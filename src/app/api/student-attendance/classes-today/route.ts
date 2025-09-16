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
 * 오늘의 출석체크 클래스 목록 API
 * T-V2-014: 출석 관리 시스템 v2
 * 당일 출석체크가 필요한 클래스들과 각 클래스의 출석 현황 제공
 */

// 오늘의 클래스 조회 스키마
const TodayClassesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  time_filter: z.enum(['current', 'all']).default('all'),
})

export async function OPTIONS() {
  return handleCorsPreflightRequest()
}

// GET: 오늘의 클래스 목록과 출석 현황
export const GET = withRouteValidation({
  querySchema: TodayClassesSchema,
  handler: async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const params = TodayClassesSchema.parse(Object.fromEntries(searchParams))

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

      // 클래스 스케줄 정보 조회 (schedule_config에서 해당 요일 수업 확인)
      const targetDate = new Date(params.date)
      const dayOfWeek = targetDate.getDay() // 0: 일요일, 1: 월요일, ..., 6: 토요일
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = dayNames[dayOfWeek]

      // 활성화된 클래스들과 해당 요일에 수업이 있는 클래스 조회
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          color,
          schedule_config,
          instructor_id,
          tenant_memberships!classes_instructor_id_fkey (
            user_profiles (
              name
            )
          ),
          classrooms (
            name
          )
        `)
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)

      if (classesError) {
        console.error('클래스 조회 오류:', classesError)
        return createServerErrorResponse('클래스 정보를 조회할 수 없습니다')
      }

      // 해당 요일에 수업이 있는 클래스 필터링 및 시간 정보 추출
      const todayClasses = classes?.filter(cls => {
        const scheduleConfig = cls.schedule_config as any
        return scheduleConfig && scheduleConfig[targetDay] && scheduleConfig[targetDay].length > 0
      }).map(cls => {
        const scheduleConfig = cls.schedule_config as any
        const daySchedule = scheduleConfig[targetDay][0] // 첫 번째 시간대 사용

        return {
          id: cls.id,
          name: cls.name,
          color: cls.color,
          start_time: daySchedule?.start_time || '00:00',
          end_time: daySchedule?.end_time || '00:00',
          instructor_name: cls.tenant_memberships?.user_profiles?.name || '미정',
          instructor_id: cls.instructor_id,
          room: cls.classrooms?.name || '미정'
        }
      }) || []

      // 시간 필터링 (현재 시간 ±30분)
      let filteredClasses = todayClasses
      if (params.time_filter === 'current') {
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()

        filteredClasses = todayClasses.filter(cls => {
          const [startHour, startMin] = cls.start_time.split(':').map(Number)
          const classStartMinutes = startHour * 60 + startMin

          return Math.abs(classStartMinutes - currentMinutes) <= 30
        })
      }

      // 각 클래스의 총 학생 수 조회
      const classIds = filteredClasses.map(cls => cls.id)

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('tenant_id', userProfile.tenant_id)
        .eq('status', 'active')

      if (enrollmentsError) {
        console.error('등록 정보 조회 오류:', enrollmentsError)
        return createServerErrorResponse('학생 등록 정보를 조회할 수 없습니다')
      }

      // 각 클래스별 출석 현황 조회
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendances')
        .select('class_id, status')
        .in('class_id', classIds)
        .eq('tenant_id', userProfile.tenant_id)
        .eq('attendance_date', params.date)

      if (attendanceError) {
        console.error('출석 현황 조회 오류:', attendanceError)
        return createServerErrorResponse('출석 현황을 조회할 수 없습니다')
      }

      // 클래스별 통계 계산
      const classesWithAttendance = filteredClasses.map(cls => {
        const classEnrollments = enrollments?.filter(e => e.class_id === cls.id) || []
        const classAttendance = attendanceData?.filter(a => a.class_id === cls.id) || []

        const totalStudents = classEnrollments.length
        const presentCount = classAttendance.filter(a => a.status === 'present').length
        const absentCount = classAttendance.filter(a => a.status === 'absent').length
        const lateCount = classAttendance.filter(a => a.status === 'late').length
        const earlyLeaveCount = classAttendance.filter(a => a.status === 'early_leave').length
        const excusedCount = classAttendance.filter(a => a.status === 'excused').length

        const attendanceRate = totalStudents > 0
          ? Math.round(((presentCount + lateCount + excusedCount) / totalStudents) * 100 * 10) / 10
          : 0

        const isCompleted = classAttendance.length === totalStudents && totalStudents > 0

        return {
          ...cls,
          total_students: totalStudents,
          attendance_status: {
            total_students: totalStudents,
            present_count: presentCount,
            absent_count: absentCount,
            late_count: lateCount,
            early_leave_count: earlyLeaveCount,
            excused_count: excusedCount,
            attendance_rate: attendanceRate,
            is_completed: isCompleted
          }
        }
      })

      // 시간순으로 정렬
      classesWithAttendance.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time)
      })

      return createSuccessResponse({
        date: params.date,
        classes: classesWithAttendance,
        summary: {
          total_classes: classesWithAttendance.length,
          completed_classes: classesWithAttendance.filter(cls => cls.attendance_status.is_completed).length,
          classes_with_absences: classesWithAttendance.filter(cls => cls.attendance_status.absent_count > 0).length,
          pending_classes: classesWithAttendance.filter(cls => !cls.attendance_status.is_completed).length
        }
      }, '오늘의 클래스 목록 조회가 완료되었습니다')

    } catch (error) {
      console.error('오늘의 클래스 조회 오류:', error)
      if (error instanceof z.ZodError) {
        return createValidationErrorResponse('입력 데이터가 올바르지 않습니다', 'validation', error.errors)
      }
      return createServerErrorResponse('서버 오류가 발생했습니다')
    }
  }
})