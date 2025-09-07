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
import type { 
  AttendanceTrendsResponse,
  DailyAttendanceTrend,
  HourlyAttendanceTrend,
  AttendanceComparison 
} from '@/types/attendance-widget'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// 출석 트렌드 파라미터 스키마
const attendanceTrendsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  period: z.enum(['7d', '30d', '90d']).optional().default('7d')
})

/**
 * 출석 트렌드 분석 API
 * GET /api/dashboard/attendance/trends?tenantId=xxx&period=7d
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const startTime = performance.now()
      
      logApiStart('attendance-trends', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        period: searchParams.get('period') || '7d'
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        attendanceTrendsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { tenantId, period } = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 출석 트렌드 정보에 접근할 권한이 없습니다.')
      }

      // 기간별 날짜 계산
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays)

      // 비교 기간 계산 (이전 동일한 기간)
      const comparisonEndDate = new Date(startDate)
      comparisonEndDate.setDate(comparisonEndDate.getDate() - 1) // 하루 전까지
      const comparisonStartDate = new Date(comparisonEndDate)
      comparisonStartDate.setDate(comparisonStartDate.getDate() - periodDays)

      // 1. 일별 출석 트렌드 조회
      const daily = await fetchDailyAttendanceTrends(
        supabase, 
        tenantId, 
        startDate, 
        endDate
      )

      // 2. 시간별 출석 트렌드 조회 
      const hourly = await fetchHourlyAttendanceTrends(
        supabase,
        tenantId,
        startDate,
        endDate
      )

      // 3. 이전 기간과의 비교 분석
      const comparison = await fetchAttendanceComparison(
        supabase,
        tenantId,
        startDate,
        endDate,
        comparisonStartDate,
        comparisonEndDate
      )

      const response: AttendanceTrendsResponse = {
        daily,
        hourly,
        comparison
      }

      // 성능 메트릭 계산
      const processingTime = performance.now() - startTime

      logApiSuccess('attendance-trends', { 
        period,
        dailyDataPoints: daily.length,
        hourlyDataPoints: hourly.length,
        processingTime: Math.round(processingTime)
      })

      return createSuccessResponse(response)
    },
    {
      requireAuth: true
    }
  )
}

// 일별 출석 트렌드 조회 함수
async function fetchDailyAttendanceTrends(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyAttendanceTrend[]> {
  const { data: dailyData, error } = await supabase
    .from('attendances')
    .select(`
      attendance_date,
      status,
      students!inner(id, status)
    `)
    .eq('tenant_id', tenantId)
    .eq('students.status', 'active')
    .gte('attendance_date', startDate.toISOString().split('T')[0])
    .lte('attendance_date', endDate.toISOString().split('T')[0])

  if (error) {
    console.error('❌ 일별 출석 데이터 조회 실패:', error)
    throw new Error(`일별 출석 데이터 조회 실패: ${error.message}`)
  }

  if (!dailyData || dailyData.length === 0) {
    return []
  }

  // 날짜별 그룹화 및 통계 계산
  const dateGroups = new Map<string, {
    present: number
    absent: number
    late: number
    total: number
  }>()

  // 출석 기록과 학생 정보가 포함된 타입 정의 (실제 Supabase 조인 결과)
  type AttendanceWithStudent = {
    attendance_date: string
    status: Database['public']['Enums']['attendance_status']
    students: { id: string; status: string | null }
  }
  
  dailyData.forEach((record: AttendanceWithStudent) => {
    const date = record.attendance_date
    if (!dateGroups.has(date)) {
      dateGroups.set(date, { present: 0, absent: 0, late: 0, total: 0 })
    }
    
    const group = dateGroups.get(date)!
    group.total++
    
    switch (record.status) {
      case 'present':
        group.present++
        break
      case 'absent':
        group.absent++
        break
      case 'late':
        group.late++
        break
    }
  })

  // 결과 배열 생성
  const trends: DailyAttendanceTrend[] = []
  for (const [date, data] of dateGroups.entries()) {
    const attendanceRate = data.total > 0 
      ? Math.round(((data.present + data.late) / data.total) * 100 * 10) / 10
      : 0

    trends.push({
      date,
      attendanceRate,
      totalStudents: data.total,
      presentCount: data.present,
      absentCount: data.absent,
      lateCount: data.late
    })
  }

  // 날짜순으로 정렬
  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// 시간별 출석 트렌드 조회 함수
async function fetchHourlyAttendanceTrends(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<HourlyAttendanceTrend[]> {
  // 시간별 분석을 위해 클래스의 스케줄 정보와 출석 기록을 결합
  const { data: hourlyData, error } = await supabase
    .from('attendances')
    .select(`
      status,
      attendance_date,
      classes!inner(
        id,
        name,
        start_date,
        class_classroom_schedules!inner(
          day_of_week,
          time_slots(
            start_time,
            end_time
          )
        ),
        student_enrollments(student_id)
      )
    `)
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate.toISOString().split('T')[0])
    .lte('attendance_date', endDate.toISOString().split('T')[0])

  if (error) {
    console.error('❌ 시간별 출석 데이터 조회 실패:', error)
    throw new Error(`시간별 출석 데이터 조회 실패: ${error.message}`)
  }

  if (!hourlyData || hourlyData.length === 0) {
    return []
  }

  // 시간대별 그룹화
  const hourGroups = new Map<number, {
    totalRecords: number
    presentAndLate: number
    classCount: Set<string>
    studentCount: Set<string>
  }>()

  // 클래스 스케줄과 시간 슬롯 정보가 포함된 복잡한 join 결과 타입
  type AttendanceWithClassSchedule = {
    status: Database['public']['Enums']['attendance_status']
    attendance_date: string
    classes?: {
      id: string
      name: string
      start_date: string | null
      class_classroom_schedules?: {
        day_of_week: Database['public']['Enums']['day_of_week']
        time_slots?: {
          start_time: string
          end_time: string
        } | null
      }[]
      student_enrollments: { student_id: string | null }[]
    }
  }
  
  hourlyData.forEach((record: AttendanceWithClassSchedule) => {
    // 실제 수업 시간 계산: attendance_date + time_slot.start_time 조합
    let hour = 9 // 기본값 (9시)
    
    if (record.classes?.class_classroom_schedules?.[0]?.time_slots?.start_time) {
      const startTime = record.classes.class_classroom_schedules[0].time_slots.start_time
      hour = parseInt(startTime.split(':')[0], 10)
    }
    
    if (!hourGroups.has(hour)) {
      hourGroups.set(hour, {
        totalRecords: 0,
        presentAndLate: 0,
        classCount: new Set(),
        studentCount: new Set()
      })
    }
    
    const group = hourGroups.get(hour)!
    group.totalRecords++
    
    if (record.status === 'present' || record.status === 'late') {
      group.presentAndLate++
    }
    
    // 클래스 ID 추가 (중복 제거용)
    if (record.classes?.id) {
      group.classCount.add(record.classes.id)
    }
  })

  // 결과 배열 생성
  const trends: HourlyAttendanceTrend[] = []
  for (let hour = 0; hour < 24; hour++) {
    const data = hourGroups.get(hour)
    
    if (data && data.totalRecords > 0) {
      const attendanceRate = Math.round((data.presentAndLate / data.totalRecords) * 100 * 10) / 10
      const avgStudentsPerClass = Math.round((data.totalRecords / data.classCount.size) * 10) / 10
      
      trends.push({
        hour,
        attendanceRate,
        totalClasses: data.classCount.size,
        avgStudentsPerClass
      })
    }
  }

  return trends.sort((a, b) => a.hour - b.hour)
}

// 이전 기간과의 비교 분석 함수
async function fetchAttendanceComparison(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  currentStartDate: Date,
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
): Promise<AttendanceComparison> {
  // 현재 기간 출석률 계산
  const { data: currentData, error: currentError } = await supabase
    .from('attendances')
    .select('status, students!inner(id, status)')
    .eq('tenant_id', tenantId)
    .eq('students.status', 'active')
    .gte('attendance_date', currentStartDate.toISOString().split('T')[0])
    .lte('attendance_date', currentEndDate.toISOString().split('T')[0])

  if (currentError) {
    console.error('❌ 현재 기간 출석 데이터 조회 실패:', currentError)
    throw new Error('현재 기간 출석 데이터 조회 실패')
  }

  // 이전 기간 출석률 계산
  const { data: previousData, error: previousError } = await supabase
    .from('attendances')
    .select('status, students!inner(id, status)')
    .eq('tenant_id', tenantId)
    .eq('students.status', 'active')
    .gte('attendance_date', previousStartDate.toISOString().split('T')[0])
    .lte('attendance_date', previousEndDate.toISOString().split('T')[0])

  if (previousError) {
    console.error('❌ 이전 기간 출석 데이터 조회 실패:', previousError)
    throw new Error('이전 기간 출석 데이터 조회 실패')
  }

  // 출석률 계산 헬퍼 함수
  // 출석률 계산용 타입
  type AttendanceForCalculation = {
    status: Database['public']['Enums']['attendance_status']
    students: { id: string; status: string | null }
  }
  
  const calculateRate = (data: AttendanceForCalculation[]): number => {
    if (!data || data.length === 0) return 0
    
    const presentAndLate = data.filter(d => d.status === 'present' || d.status === 'late').length
    return Math.round((presentAndLate / data.length) * 100 * 10) / 10
  }

  const currentPeriod = calculateRate(currentData)
  const previousPeriod = calculateRate(previousData)
  
  const changePercent = previousPeriod > 0 
    ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100 * 10) / 10
    : 0

  // 변화 방향 결정
  let changeDirection: 'up' | 'down' | 'stable'
  if (Math.abs(changePercent) < 1) {
    changeDirection = 'stable'
  } else if (changePercent > 0) {
    changeDirection = 'up'
  } else {
    changeDirection = 'down'
  }

  return {
    currentPeriod,
    previousPeriod,
    changePercent,
    changeDirection
  }
}