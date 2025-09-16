import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRouteValidation, handleCorsPreflightRequest } from '@/lib/route-validation'
import {
  createValidationErrorResponse,
  createServerErrorResponse,
  createSuccessResponse
} from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'

/**
 * 학생 출석 벌크 업데이트 API
 * T-V2-014: 출석 관리 시스템 v2
 */

// 벌크 출석 업데이트 스키마
const BulkAttendanceSchema = z.object({
  class_id: z.string().uuid('올바른 클래스 ID가 필요합니다'),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  updates: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'early_leave', 'excused'] as const),
    reason: z.string().optional(),
  })).min(1, '최소 1명의 학생 정보가 필요합니다'),
})

export async function OPTIONS() {
  return handleCorsPreflightRequest()
}

// POST: 벌크 출석 업데이트
export const POST = withRouteValidation({
  bodySchema: BulkAttendanceSchema,
  handler: async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const body = BulkAttendanceSchema.parse(await request.json())

      // 현재 사용자의 tenant_id 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return createValidationErrorResponse('인증이 필요합니다', 'auth')
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return createValidationErrorResponse('테넌트 정보를 찾을 수 없습니다', 'tenant')
      }

      // 현재 사용자의 tenant_memberships ID 조회
      const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('id')
        .eq('user_profile_id', user.id)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      const currentTime = new Date().toISOString()
      const results = []
      const errors = []

      // 각 학생의 출석을 개별 처리
      for (const update of body.updates) {
        try {
          // enrollment_id 조회
          const { data: enrollment } = await supabase
            .from('student_enrollments')
            .select('id')
            .eq('student_id', update.student_id)
            .eq('class_id', body.class_id)
            .eq('tenant_id', userProfile.tenant_id)
            .single()

          // 기존 출석 기록 확인
          const { data: existingRecord } = await supabase
            .from('attendances')
            .select('id')
            .eq('student_id', update.student_id)
            .eq('class_id', body.class_id)
            .eq('attendance_date', body.attendance_date)
            .eq('tenant_id', userProfile.tenant_id)
            .single()

          const attendanceData = {
            tenant_id: userProfile.tenant_id,
            student_id: update.student_id,
            class_id: body.class_id,
            enrollment_id: enrollment?.id || null,
            attendance_date: body.attendance_date,
            status: update.status,
            reason: update.reason || null,
            check_in_time: update.status === 'present' ? currentTime : null,
            checked_by: membership?.id || null,
            updated_at: currentTime,
          }

          let result;

          if (existingRecord) {
            // 기존 기록 업데이트
            const { data, error } = await supabase
              .from('attendances')
              .update(attendanceData)
              .eq('id', existingRecord.id)
              .select(`
                *,
                students!inner (
                  id,
                  name,
                  student_number
                )
              `)
              .single()

            result = { data, error }
          } else {
            // 새 기록 생성
            const { data, error } = await supabase
              .from('attendances')
              .insert(attendanceData)
              .select(`
                *,
                students!inner (
                  id,
                  name,
                  student_number
                )
              `)
              .single()

            result = { data, error }
          }

          if (result.error) {
            errors.push({
              student_id: update.student_id,
              error: result.error.message
            })
          } else {
            results.push(result.data)
          }

        } catch (studentError) {
          console.error(`학생 ${update.student_id} 출석 처리 오류:`, studentError)
          errors.push({
            student_id: update.student_id,
            error: '출석 처리 중 오류가 발생했습니다'
          })
        }
      }

      // 결과 반환
      if (errors.length === 0) {
        return createSuccessResponse({
          processed: results.length,
          success: results,
          errors: []
        }, `총 ${results.length}명의 출석 체크가 완료되었습니다`)
      } else if (results.length === 0) {
        return createServerErrorResponse('모든 출석 체크 처리에 실패했습니다', {
          processed: 0,
          success: [],
          errors: errors
        })
      } else {
        return createSuccessResponse({
          processed: results.length + errors.length,
          success: results,
          errors: errors
        }, `${results.length}명 처리 완료, ${errors.length}명 처리 실패`)
      }

    } catch (error) {
      console.error('벌크 출석 체크 오류:', error)
      if (error instanceof z.ZodError) {
        return createValidationErrorResponse('입력 데이터가 올바르지 않습니다', 'validation', error.errors)
      }
      return createServerErrorResponse('서버 오류가 발생했습니다')
    }
  }
})