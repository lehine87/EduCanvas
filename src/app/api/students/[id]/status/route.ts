import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRouteValidation, handleCorsPreflightRequest } from '@/lib/route-validation'
import { 
  createSuccessResponse,
  createValidationErrorResponse,
  createServerErrorResponse 
} from '@/lib/api-response'
import { updateStudentService } from '@/services/student-service'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 학생 상태 변경 API - 업계 표준 구현
 * 
 * 기능:
 * - PATCH: 학생 상태 변경 (이유 및 유효 날짜 포함)
 * - 상태 변경 히스토리 추적
 * - 비즈니스 규칙 검증
 */

// 학생 상태 변경 스키마
const StudentStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended'])
    .describe('변경할 상태'),
  reason: z.string()
    .min(1, '상태 변경 이유는 필수입니다')
    .max(500, '이유는 500자를 초과할 수 없습니다')
    .optional()
    .describe('상태 변경 이유'),
  effective_date: z.string()
    .optional()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .describe('상태 변경 유효 날짜'),
  notes: z.string()
    .max(1000, '추가 메모는 1000자를 초과할 수 없습니다')
    .optional()
    .describe('추가 메모')
})

/**
 * PATCH /api/students/[id]/status - 학생 상태 변경
 */
export const PATCH = withRouteValidation({
  bodySchema: StudentStatusUpdateSchema,
  requireAuth: true,
  rateLimitKey: 'students_status_update',
  handler: async (req: NextRequest, context) => {
    const { body, user, timer } = context;
    try {
      // URL에서 ID 추출 (Next.js 15 방식)
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const id = pathSegments[pathSegments.length - 2] // status 전의 id
      
      if (!id) {
        return createValidationErrorResponse(
          [{ field: 'id', message: 'Student ID is required' }],
          'Invalid student ID'
        )
      }

      if (!body) {
        return createValidationErrorResponse(
          [{ field: 'body', message: 'Request body is required' }],
          'Invalid request'
        )
      }

      const { status, reason, effective_date, notes } = body

      if (!user.tenant_id) {
        return createValidationErrorResponse(
          [{ field: 'auth', message: 'Tenant access required' }],
          'Unauthorized'
        )
      }
      
      // 비즈니스 규칙 검증
      await validateStatusTransition(id, status, user.tenant_id)

      // 상태 변경 히스토리를 notes에 추가
      const currentDate = new Date().toISOString().split('T')[0]
      const effectiveDate = effective_date || currentDate
      
      const statusChangeNote = `[${currentDate}] 상태 변경: → ${getStatusLabel(status)}${reason ? ` (사유: ${reason})` : ''}`
      const updatedNotes = notes ? `${notes}\n\n${statusChangeNote}` : statusChangeNote

      // 학생 상태 업데이트
      const result = await updateStudentService(
        id,
        { 
          status,
          notes: updatedNotes,
          tenant_id: user.tenant_id!
        },
        user.id
      )

      // 관련 enrollment 상태도 업데이트 (비즈니스 로직)
      if (status === 'inactive' || status === 'graduated') {
        await updateRelatedEnrollments(id, status, user.tenant_id)
      }

      return createSuccessResponse(
        {
          student: result.student,
          status_change: {
            previous_status: await getPreviousStatus(id),
            new_status: status,
            effective_date: effectiveDate,
            changed_by: user.id,
            changed_at: new Date().toISOString(),
            reason
          }
        },
        'Student status updated successfully',
        200
      )

    } catch (error) {
      console.error('Student status update error:', error)
      
      // 비즈니스 로직 에러 처리
      if (error instanceof Error) {
        if (error.message.includes('Invalid status transition')) {
          return new NextResponse(
            JSON.stringify({ 
              success: false,
              error: { 
                code: 'INVALID_STATUS_TRANSITION', 
                message: error.message 
              },
              timestamp: new Date().toISOString()
            }),
            { status: 422, headers: { 'Content-Type': 'application/json' } }
          )
        }
        
        if (error.message.includes('Active enrollments exist')) {
          return new NextResponse(
            JSON.stringify({ 
              success: false,
              error: { 
                code: 'ACTIVE_ENROLLMENTS_EXIST', 
                message: error.message 
              },
              timestamp: new Date().toISOString()
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      return createServerErrorResponse(
        'Failed to update student status',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * 상태 전환 유효성 검증
 */
async function validateStatusTransition(
  studentId: string, 
  newStatus: string, 
  tenantId: string
): Promise<void> {
  const { createServiceRoleClient } = await import('@/lib/supabase/server')
  const supabase: SupabaseClient<Database> = createServiceRoleClient()
  
  // 현재 학생 상태 확인
  const { data: student, error } = await supabase
    .from('students')
    .select('status')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !student) {
    throw new Error('Student not found')
  }

  const currentStatus = student.status as Database['public']['Enums']['student_status']

  // 상태 전환 규칙 정의
  const validTransitions: Record<string, string[]> = {
    'waiting': ['active', 'inactive'],
    'active': ['inactive', 'graduated', 'waiting'],
    'inactive': ['active', 'waiting'],
    'graduated': [] // 졸업 상태에서는 변경 불가
  }

  if (!currentStatus || !validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`)
  }

  // 활성 수강권이 있는 경우 inactive/graduated로 변경 제한
  if (newStatus === 'inactive' || newStatus === 'graduated') {
    const { data: activeEnrollments } = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .limit(1)

    if (activeEnrollments && activeEnrollments.length > 0) {
      throw new Error('Active enrollments exist. Please complete or cancel enrollments first.')
    }
  }
}

/**
 * 관련 enrollment 상태 업데이트
 */
async function updateRelatedEnrollments(
  studentId: string,
  studentStatus: string,
  tenantId: string
): Promise<void> {
  const { createServiceRoleClient } = await import('@/lib/supabase/server')
  const supabase: SupabaseClient<Database> = createServiceRoleClient()
  
  const enrollmentStatus = studentStatus === 'graduated' ? 'completed' : 'suspended'
  
  await supabase
    .from('student_enrollments')
    .update({ 
      status: enrollmentStatus,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
}

/**
 * 이전 상태 조회
 */
async function getPreviousStatus(studentId: string): Promise<string> {
  const { createServiceRoleClient } = await import('@/lib/supabase/server')
  const supabase: SupabaseClient<Database> = createServiceRoleClient()
  
  const { data } = await supabase
    .from('students')
    .select('status')
    .eq('id', studentId)
    .single()
    
  return data?.status || 'unknown'
}

/**
 * 상태 라벨 변환
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'waiting': '대기',
    'active': '활성',
    'inactive': '비활성',
    'graduated': '졸업'
  }
  return labels[status] || status
}

/**
 * OPTIONS - CORS 프리플라이트 처리
 */
export const OPTIONS = () => handleCorsPreflightRequest()