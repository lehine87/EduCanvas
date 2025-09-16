import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleCorsPreflightRequest, withRouteValidation } from '@/lib/route-validation'
import { 
  createSuccessResponse,
  createValidationErrorResponse,
  createServerErrorResponse 
} from '@/lib/api-response'
import { 
  getStudentByIdService,
  updateStudentService,
  deleteStudentService 
} from '@/services/student-service'
import type { Database } from '@/types/database.types'
import { 
  checkApiPermission, 
  checkStudentDataAccess,
  type AuthenticatedUser 
} from '@/lib/auth/apiPermissionMiddleware'
import { StudentVersionConflictError } from '@/types/student.types'

/**
 * 학생 개별 리소스 API - 업계 표준 구현 (Next.js 15 App Router)
 * 
 * 기능:
 * - GET: 학생 상세 조회 (관계 데이터 포함 옵션)
 * - PUT: 학생 정보 수정 (부분 업데이트 지원)
 * - DELETE: 학생 삭제 (Soft Delete)
 * - OPTIONS: CORS 프리플라이트 처리
 */

// Query 파라미터 스키마
const StudentDetailQuerySchema = z.object({
  include_enrollment: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default(false),
  include_attendance_stats: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default(false),
  include_payment_history: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default(false)
})

// Database-First Student Update Schema with Optimistic Locking
const StudentUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  student_number: z.string().min(1).max(50).optional(),
  name_english: z.string().max(100).optional(),
  birth_date: z.string().nullable().optional(), // Database: string | null
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(), 
  address: z.string().nullable().optional(),
  school_name: z.string().nullable().optional(),
  grade_level: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended']).optional(),
  notes: z.string().nullable().optional(),
  emergency_contact: z.unknown().nullable().optional(),
  custom_fields: z.unknown().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  parent_name_1: z.string().nullable().optional(),
  parent_phone_1: z.string().nullable().optional(),
  parent_name_2: z.string().nullable().optional(),
  parent_phone_2: z.string().nullable().optional(),
  enrollment_date: z.string().nullable().optional(), // Database: string | null
  tenantId: z.string().uuid().optional(), // 클라이언트에서 전송하는 tenantId 허용
  expected_version: z.string().optional() // Optimistic Locking을 위한 버전 체크
})

/**
 * GET /api/students/[id] - 학생 상세 조회 (업계 표준 Next.js 15)
 */
export const GET = withRouteValidation({
  querySchema: StudentDetailQuerySchema,
  requireAuth: true,
  handler: async (req, { query, user, timer }) => {
    const performanceTimer = {
      start: Date.now(),
      checkpoints: {} as Record<string, number>
    }

    try {
      // 성능 측정: URL 파싱
      performanceTimer.checkpoints.urlParsing = Date.now()

      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const id = pathSegments[pathSegments.length - 1]

      if (!id) {
        return createValidationErrorResponse(
          [{ field: 'id', message: 'Student ID is required' }],
          'Invalid student ID'
        )
      }

      // 성능 측정: 권한 검증
      performanceTimer.checkpoints.authCheck = Date.now()

      if (!user.tenant_id) {
        return createValidationErrorResponse(
          [{ field: 'auth', message: 'Tenant access required' }],
          'Unauthorized'
        )
      }

      console.log('🔍 [API Performance] Pre-service call:', {
        elapsed: Date.now() - performanceTimer.start,
        user_id: user.id,
        tenant_id: user.tenant_id,
        student_id: id
      })

      // 성능 측정: DB 서비스 호출
      performanceTimer.checkpoints.serviceCall = Date.now()

      const result = await getStudentByIdService(
        id,
        user.tenant_id,
        {
          include_enrollment: query.include_enrollment,
          include_attendance_stats: query.include_attendance_stats,
          include_payment_history: query.include_payment_history
        }
      )

      // 성능 측정: 서비스 완료
      performanceTimer.checkpoints.serviceComplete = Date.now()

      if (!result.student) {
        console.log('🔍 [API Performance] Student not found:', {
          elapsed: Date.now() - performanceTimer.start,
          student_id: id
        })
        return createValidationErrorResponse(
          [{ field: 'id', message: 'Student not found' }],
          'Student not found'
        )
      }

      // 성능 로깅
      const totalTime = Date.now() - performanceTimer.start
      const serviceTime = performanceTimer.checkpoints.serviceComplete - performanceTimer.checkpoints.serviceCall

      console.log('🔍 [API Performance] Request completed:', {
        total_ms: totalTime,
        service_ms: serviceTime,
        overhead_ms: totalTime - serviceTime,
        student_id: id,
        tenant_id: user.tenant_id
      })

      return createSuccessResponse(
        result,
        'Student retrieved successfully'
      )

    } catch (error) {
      const totalTime = Date.now() - performanceTimer.start
      console.error('🔍 [API Performance] Request failed:', {
        total_ms: totalTime,
        error: error instanceof Error ? error.message : String(error),
        student_id: pathSegments[pathSegments.length - 1],
        tenant_id: user?.tenant_id
      })

      return createServerErrorResponse(
        'Failed to retrieve student details',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * PUT /api/students/[id] - 학생 정보 수정 (업계 표준 Next.js 15)
 */
export const PUT = withRouteValidation({
  bodySchema: StudentUpdateSchema,
  requireAuth: true,
  handler: async (req, { body, user }) => {
    try {
      // Next.js 15: params 추출
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const id = pathSegments[pathSegments.length - 1]
      
      if (!id) {
        return createValidationErrorResponse(
          [{ field: 'id', message: 'Student ID is required' }],
          'Invalid student ID'
        )
      }

      // 업데이트할 필드가 없는 경우
      if (!body || Object.keys(body).length === 0) {
        return createValidationErrorResponse(
          [{ field: 'body', message: 'At least one field is required for update' }],
          'No update fields provided'
        )
      }
      
      // 권한 검증: 학생 데이터 수정 권한 체크
      // TODO: 권한 시스템 수정 필요 - tenant_memberships.role이 UUID임
      // 임시로 tenant_id가 있으면 허용
      if (!user.tenant_id) {
        return createValidationErrorResponse(
          [{ field: 'auth', message: 'Tenant access required' }],
          'Unauthorized'
        )
      }

      if (!user.tenant_id) {
        return createValidationErrorResponse(
          [{ field: 'auth', message: 'Tenant access required' }],
          'Unauthorized'
        )
      }
      
      // tenantId와 expected_version은 클라이언트에서 오는 필드이므로 분리
      const { tenantId, expected_version, ...updateFields } = body
      const updateData = {
        ...updateFields,
        tenant_id: user.tenant_id
      } as Database['public']['Tables']['students']['Update'] & { tenant_id: string }
      
      const result = await updateStudentService(
        id,
        updateData,
        user.id,
        expected_version // Optimistic Locking을 위한 버전 전달
      )

      return createSuccessResponse(
        result,
        'Student updated successfully',
        200
      )

    } catch (error) {
      console.error('Student update error:', error)
      
      // 버전 충돌 에러 처리 (409 Conflict)
      if (error instanceof StudentVersionConflictError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VERSION_CONFLICT',
              message: 'Student was modified by another user',
              details: {
                current_data: error.currentData,
                conflicting_data: error.conflictingData
              }
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 } // Conflict
        )
      }
      
      // 비즈니스 로직 에러 처리
      if (error instanceof Error) {
        if (error.message.includes('Student number already exists')) {
          return createValidationErrorResponse(
            [{ field: 'student_number', message: 'Student number already exists' }],
            'Duplicate student number'
          )
        }
        
        if (error.message.includes('not found')) {
          return createValidationErrorResponse(
            [{ field: 'id', message: 'Student not found' }],
            'Student not found'
          )
        }
      }

      return createServerErrorResponse(
        'Failed to update student',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * DELETE /api/students/[id] - 학생 삭제 (Soft Delete, 업계 표준 Next.js 15)
 */
export const DELETE = withRouteValidation({
  requireAuth: true,
  handler: async (req: NextRequest, context) => {
    const { user } = context;
    try {
      // Next.js 15: params 추출
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const id = pathSegments[pathSegments.length - 1]
      
      if (!id) {
        return createValidationErrorResponse(
          [{ field: 'id', message: 'Student ID is required' }],
          'Invalid student ID'
        )
      }
      
      // 권한 검증: 학생 데이터 삭제 권한 체크
      // TODO: 권한 시스템 수정 필요 - tenant_memberships.role이 UUID임
      // 임시로 tenant_id가 있으면 허용 (관리자만 삭제 가능하도록 추후 수정)
      if (!user.tenant_id) {
        return createValidationErrorResponse(
          [{ field: 'auth', message: 'Tenant access required' }],
          'Unauthorized'
        )
      }

      const result = await deleteStudentService(
        id,
        user.tenant_id,
        user.id
      )

      if (!result.success) {
        return createValidationErrorResponse(
          [{ field: 'id', message: 'Student not found' }],
          'Student not found'
        )
      }

      // 204 No Content (성공, 반환 데이터 없음) - 업계 표준
      return NextResponse.json(null, { status: 204 })

    } catch (error) {
      console.error('Student deletion error:', error)
      return createServerErrorResponse(
        'Failed to delete student',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * OPTIONS - CORS 프리플라이트 처리 (업계 표준)
 */
export const OPTIONS = () => handleCorsPreflightRequest()