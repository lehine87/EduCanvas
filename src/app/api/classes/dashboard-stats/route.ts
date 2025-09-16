import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api/utils'
import { 
  createSuccessResponse,
  createServerErrorResponse
} from '@/lib/api-response'

// 클래스 대시보드 통계 조회
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ userProfile, supabase }) => {
      console.log('🏢 API 시작: classes-dashboard-stats', { userId: userProfile?.id })

      try {
        // userProfile과 tenant_id null 체크
        if (!userProfile?.tenant_id) {
          return createServerErrorResponse(
            '테넌트 정보가 없습니다.',
            new Error('Missing tenant information')
          )
        }

        // 전체 클래스 수
        const { count: totalClasses } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', userProfile.tenant_id)

        // 활성 클래스 수
        const { count: activeClasses } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', userProfile.tenant_id)
          .eq('is_active', true)

        // 비활성 클래스 수
        const inactiveClasses = (totalClasses || 0) - (activeClasses || 0)

        // 총 수강생 수 계산
        const { data: enrollmentsData } = await supabase
          .from('student_enrollments')
          .select(`
            id,
            classes!inner (
              tenant_id
            )
          `)
          .eq('status', 'active')
          .eq('classes.tenant_id', userProfile.tenant_id)

        const totalStudents = enrollmentsData?.length || 0
        const avgClassSize = totalClasses && totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0

        // 수익 계산 (기본값 - 실제 payments 테이블이 구현되면 업데이트)
        const monthlyRevenue = 0
        const revenueGrowth = 0

        // 평균 출석률 계산 (최근 30일)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: attendanceData } = await supabase
          .from('attendances')
          .select(`
            status,
            classes!inner (
              tenant_id
            )
          `)
          .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0])
          .eq('classes.tenant_id', userProfile.tenant_id)

        const totalAttendances = attendanceData?.length || 0
        const presentAttendances = attendanceData?.filter(a => a.status === 'present').length || 0
        const avgAttendanceRate = totalAttendances > 0 ? 
          Math.round((presentAttendances / totalAttendances) * 100) : 0

        // 출석률 변화 (전주 대비) - 간단한 예시
        const attendanceChange = 0 // 추후 구현

        const stats = {
          totalClasses: totalClasses || 0,
          activeClasses: activeClasses || 0,
          inactiveClasses,
          totalStudents,
          avgClassSize,
          monthlyRevenue,
          revenueGrowth,
          avgAttendanceRate,
          attendanceChange,
        }

        console.log('✅ API 성공: classes-dashboard-stats', stats)

        return createSuccessResponse(stats, '클래스 대시보드 통계 조회 완료')

      } catch (error) {
        console.error('❌ API 에러: classes-dashboard-stats', error)
        return createServerErrorResponse(
          '클래스 대시보드 통계 조회 실패',
          error instanceof Error ? error : new Error(String(error))
        )
      }
    },
    { 
      requireAuth: true,
      validateTenant: true 
    }
  )
}