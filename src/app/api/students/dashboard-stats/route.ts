import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'

// 대시보드 통계 파라미터 스키마
const dashboardStatsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다')
})

interface DashboardStats {
  total_students: number
  active_students: number
  inactive_students: number
  graduated_students: number
  withdrawn_students: number
  suspended_students: number
  urgent_actions: number
  today_attendance: number
  unpaid_students: number
  consultation_scheduled: number
  new_registrations_this_month: number
  recent_activities: Array<{
    id: string
    student_name: string
    action: string
    timestamp: string
  }>
}

/**
 * 학생 관리 대시보드 통계 API
 * GET /api/students/dashboard-stats?tenantId=xxx
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const startTime = performance.now()
      
      logApiStart('dashboard-stats', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        dashboardStatsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { tenantId } = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 통계 정보에 접근할 권한이 없습니다.')
      }

      // 기본 학생 통계 조회
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, status, created_at, updated_at')
        .eq('tenant_id', tenantId)

      if (studentsError) {
        console.error('❌ 학생 통계 조회 실패:', studentsError)
        throw new Error(`학생 통계 조회 실패: ${studentsError.message}`)
      }

      // 통계 계산
      const totalStudents = students?.length || 0
      const activeStudents = students?.filter(s => s.status === 'active').length || 0
      const inactiveStudents = students?.filter(s => s.status === 'inactive').length || 0
      const graduatedStudents = students?.filter(s => s.status === 'graduated').length || 0
      const withdrawnStudents = students?.filter(s => s.status === 'withdrawn').length || 0
      const suspendedStudents = students?.filter(s => s.status === 'suspended').length || 0

      // 이번 달 신규 등록 계산
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const newRegistrationsThisMonth = students?.filter(s => 
        s.created_at && new Date(s.created_at) >= thisMonth
      ).length || 0

      // 최근 활동 (최근 업데이트된 학생들)
      const recentActivities = students
        ?.filter(s => s.updated_at) // null 값 제외
        ?.sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 5)
        .map(student => ({
          id: student.id,
          student_name: `학생 ${student.id.slice(0, 8)}`, // 실제로는 학생 이름을 가져와야 함
          action: '정보 업데이트',
          timestamp: student.updated_at!
        })) || []

      // TODO: 실제 데이터가 있을 때는 다음 통계들도 구현
      // - 오늘 출석 체크가 필요한 학생 수
      // - 미납금이 있는 학생 수
      // - 상담 예정 학생 수
      // - 긴급 처리가 필요한 사항들

      const stats: DashboardStats = {
        total_students: totalStudents,
        active_students: activeStudents,
        inactive_students: inactiveStudents,
        graduated_students: graduatedStudents,
        withdrawn_students: withdrawnStudents,
        suspended_students: suspendedStudents,
        urgent_actions: 0, // TODO: 실제 긴급 사항 계산
        today_attendance: 0, // TODO: 오늘 출석 대상 학생 수
        unpaid_students: 0, // TODO: 미납금 학생 수
        consultation_scheduled: 0, // TODO: 상담 예정 학생 수
        new_registrations_this_month: newRegistrationsThisMonth,
        recent_activities: recentActivities
      }

      // 성능 메트릭 계산
      const processingTime = performance.now() - startTime

      logApiSuccess('dashboard-stats', { 
        totalStudents,
        processingTime: Math.round(processingTime)
      })

      return createSuccessResponse(stats)
    },
    {
      requireAuth: true
    }
  )
}