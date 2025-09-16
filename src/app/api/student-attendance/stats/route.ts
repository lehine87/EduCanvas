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
 * 학생 출석 통계 API
 * T-V2-014: 출석 관리 시스템 v2
 */

// 출석 통계 조회 스키마
const AttendanceStatsSchema = z.object({
  class_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function OPTIONS() {
  return handleCorsPreflightRequest()
}

// GET: 출석 통계 조회
export const GET = withRouteValidation({
  querySchema: AttendanceStatsSchema,
  handler: async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const params = AttendanceStatsSchema.parse(Object.fromEntries(searchParams))

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

      // 기본 쿼리 조건
      let baseConditions = `tenant_id.eq.${userProfile.tenant_id}`

      if (params.class_id) {
        baseConditions += `,class_id.eq.${params.class_id}`
      }
      if (params.student_id) {
        baseConditions += `,student_id.eq.${params.student_id}`
      }
      if (params.attendance_date) {
        baseConditions += `,attendance_date.eq.${params.attendance_date}`
      }
      if (params.start_date && params.end_date) {
        baseConditions += `,attendance_date.gte.${params.start_date},attendance_date.lte.${params.end_date}`
      }

      // 출석 통계 계산을 위한 쿼리
      const { data: attendanceData, error } = await supabase
        .from('attendances')
        .select('status')
        .or(baseConditions.replace('tenant_id.eq.', '').split(',').join(','))
        .eq('tenant_id', userProfile.tenant_id)

      if (error) {
        console.error('출석 통계 조회 오류:', error)
        return createServerErrorResponse('출석 통계를 조회할 수 없습니다')
      }

      // 통계 계산
      const totalStudents = attendanceData?.length || 0
      const presentCount = attendanceData?.filter(record => record.status === 'present').length || 0
      const absentCount = attendanceData?.filter(record => record.status === 'absent').length || 0
      const lateCount = attendanceData?.filter(record => record.status === 'late').length || 0
      const earlyLeaveCount = attendanceData?.filter(record => record.status === 'early_leave').length || 0
      const excusedCount = attendanceData?.filter(record => record.status === 'excused').length || 0

      // 출석률 계산 (출석 + 지각 + 공결을 출석으로 간주)
      const attendanceRate = totalStudents > 0
        ? Math.round(((presentCount + lateCount + excusedCount) / totalStudents) * 100 * 10) / 10
        : 0

      // 완료 여부 (모든 학생이 체크되었는지) - 실제로는 해당 클래스의 등록된 학생 수와 비교해야 함
      const isCompleted = totalStudents > 0

      const stats = {
        total_students: totalStudents,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        early_leave_count: earlyLeaveCount,
        excused_count: excusedCount,
        attendance_rate: attendanceRate,
        is_completed: isCompleted
      }

      return createSuccessResponse(stats, '출석 통계 조회가 완료되었습니다')

    } catch (error) {
      console.error('출석 통계 조회 오류:', error)
      if (error instanceof z.ZodError) {
        return createValidationErrorResponse('입력 데이터가 올바르지 않습니다', 'validation', error.errors)
      }
      return createServerErrorResponse('서버 오류가 발생했습니다')
    }
  }
})