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
 * 학생 출석 일일 비교 API
 * T-V2-014: 출석 관리 시스템 v2
 * 어제와 오늘 출석률 비교 데이터 제공
 */

// 일일 비교 조회 스키마
const DailyComparisonSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
})

export async function OPTIONS() {
  return handleCorsPreflightRequest()
}

// GET: 일일 출석 비교 데이터
export const GET = withRouteValidation({
  querySchema: DailyComparisonSchema,
  handler: async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const params = DailyComparisonSchema.parse(Object.fromEntries(searchParams))

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

      // 현재 날짜와 전날 계산
      const currentDate = new Date(params.date)
      const previousDate = new Date(currentDate)
      previousDate.setDate(previousDate.getDate() - 1)

      const currentDateStr = params.date
      const previousDateStr = previousDate.toISOString().split('T')[0]

      // 두 날짜의 출석 데이터를 동시에 조회
      const { data: attendanceData, error } = await supabase
        .from('attendances')
        .select('attendance_date, status')
        .eq('tenant_id', userProfile.tenant_id)
        .in('attendance_date', [previousDateStr, currentDateStr])

      if (error) {
        console.error('출석 비교 데이터 조회 오류:', error)
        return createServerErrorResponse('출석 비교 데이터를 조회할 수 없습니다')
      }

      // 날짜별로 데이터 분리
      const previousDayData = attendanceData?.filter(record => record.attendance_date === previousDateStr) || []
      const currentDayData = attendanceData?.filter(record => record.attendance_date === currentDateStr) || []

      // 통계 계산 함수
      const calculateStats = (data: typeof attendanceData) => {
        const total = data.length
        const present = data.filter(record => record.status === 'present').length
        const absent = data.filter(record => record.status === 'absent').length
        const late = data.filter(record => record.status === 'late').length
        const earlyLeave = data.filter(record => record.status === 'early_leave').length
        const excused = data.filter(record => record.status === 'excused').length

        const attendanceRate = total > 0
          ? Math.round(((present + late + excused) / total) * 100 * 10) / 10
          : 0

        return {
          total,
          present,
          absent,
          late,
          early_leave: earlyLeave,
          excused,
          attendance_rate: attendanceRate
        }
      }

      // 어제와 오늘의 통계
      const yesterdayStats = {
        date: previousDateStr,
        ...calculateStats(previousDayData)
      }

      const todayStats = {
        date: currentDateStr,
        ...calculateStats(currentDayData)
      }

      // 변화량 계산
      const rateChange = todayStats.attendance_rate - yesterdayStats.attendance_rate
      const countChange = todayStats.total - yesterdayStats.total

      const comparisonData = {
        yesterday: yesterdayStats,
        today: todayStats,
        changes: {
          attendance_rate_change: Math.round(rateChange * 10) / 10,
          total_count_change: countChange,
          is_improvement: rateChange >= 0
        }
      }

      return createSuccessResponse(comparisonData, '출석 비교 데이터 조회가 완료되었습니다')

    } catch (error) {
      console.error('출석 비교 데이터 조회 오류:', error)
      if (error instanceof z.ZodError) {
        return createValidationErrorResponse('입력 데이터가 올바르지 않습니다', 'validation', error.errors)
      }
      return createServerErrorResponse('서버 오류가 발생했습니다')
    }
  }
})