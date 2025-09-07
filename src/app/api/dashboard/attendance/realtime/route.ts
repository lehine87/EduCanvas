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
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { 
  AttendanceRealtimeResponse,
  AttendanceStats,
  ClassAttendance,
  AttendanceTrend,
  AttendanceAlert 
} from '@/types/attendance-widget'

// 실시간 출석 현황 파라미터 스키마
const realtimeAttendanceSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다')
})

/**
 * 실시간 출석 현황 API
 * GET /api/dashboard/attendance/realtime?tenantId=xxx
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const startTime = performance.now()
      
      logApiStart('attendance-realtime', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        realtimeAttendanceSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { tenantId } = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 출석 정보에 접근할 권한이 없습니다.')
      }

      // 오늘 날짜 계산
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

      // 1. 오늘의 클래스 및 출석 정보 조회 (최적화된 단일 쿼리)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendances')
        .select(`
          id,
          status,
          attendance_date,
          check_in_time,
          late_minutes,
          student_id,
          class_id,
          classes!inner(
            id,
            name,
            start_date,
            is_active
          ),
          students!inner(
            id,
            name,
            status
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('attendance_date', todayStart.toISOString().split('T')[0])
        .lte('attendance_date', todayEnd.toISOString().split('T')[0])

      if (attendanceError) {
        console.error('❌ 출석 데이터 조회 실패:', attendanceError)
        throw new Error(`출석 데이터 조회 실패: ${attendanceError.message}`)
      }

      // 2. 전체 학생 수 조회 (활성 학생만)
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')

      if (studentsError) {
        console.error('❌ 학생 데이터 조회 실패:', studentsError)
        throw new Error(`학생 데이터 조회 실패: ${studentsError.message}`)
      }

      // 3. 오늘 출석 데이터가 있는 수업들 조회 (올바른 관계 테이블 사용)
      const { data: todayClasses, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          start_date,
          is_active,
          student_enrollments(
            student_id,
            students(id, name, status)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .in('id', attendanceData?.map((a: any) => a.class_id) || [])

      if (classesError) {
        console.error('❌ 클래스 데이터 조회 실패:', classesError)
        throw new Error(`클래스 데이터 조회 실패: ${classesError.message}`)
      }

      // 4. 데이터 가공 및 통계 계산
      const stats = calculateAttendanceStats(attendanceData, activeStudents)
      const classesByTime = processClassAttendance(todayClasses, attendanceData)
      const trends = await calculateAttendanceTrends(supabase, tenantId)
      const alerts = generateAttendanceAlerts(stats, classesByTime)

      const response: AttendanceRealtimeResponse = {
        stats,
        classesByTime,
        trends,
        alerts,
        lastUpdated: new Date().toISOString()
      }

      // 성능 메트릭 계산
      const processingTime = performance.now() - startTime

      logApiSuccess('attendance-realtime', { 
        totalStudents: stats.totalStudents,
        attendanceRate: stats.attendanceRate,
        classCount: classesByTime.length,
        processingTime: Math.round(processingTime)
      })

      return createSuccessResponse(response)
    },
    {
      requireAuth: true
    }
  )
}

// 출석 통계 계산 함수
// 안전한 출석 데이터 타입 정의
interface SafeAttendanceRecord {
  student_id: string
  status: string
  attendance_date: string
  class_id: string
}

// 안전한 학생 데이터 타입 정의  
interface SafeStudentRecord {
  id: string
  status: string
}

function calculateAttendanceStats(
  attendanceData: unknown[], 
  activeStudents: unknown[]
): AttendanceStats {
  const totalStudents = activeStudents?.length || 0
  
  if (!attendanceData || attendanceData.length === 0) {
    return {
      totalStudents,
      presentStudents: 0,
      absentStudents: 0,
      lateStudents: 0,
      attendanceRate: 0,
      updateTime: new Date()
    }
  }

  // 중복 제거 (같은 학생이 여러 수업에 참여할 수 있음)
  const uniqueStudentAttendances = new Map<string, SafeAttendanceRecord>()
  
  attendanceData.forEach((record: unknown) => {
    // 타입 가드 적용
    if (!record || typeof record !== 'object') return
    const safeRecord = record as Record<string, unknown>
    
    if (typeof safeRecord.student_id !== 'string' || 
        typeof safeRecord.status !== 'string' ||
        typeof safeRecord.attendance_date !== 'string' ||
        typeof safeRecord.class_id !== 'string') {
      return
    }
    
    const validRecord: SafeAttendanceRecord = {
      student_id: safeRecord.student_id,
      status: safeRecord.status,
      attendance_date: safeRecord.attendance_date,
      class_id: safeRecord.class_id
    }
    
    const studentId = validRecord.student_id
    if (!uniqueStudentAttendances.has(studentId)) {
      uniqueStudentAttendances.set(studentId, validRecord)
    } else {
      // 이미 있는 경우, 더 나은 상태로 업데이트 (present > late > absent)
      const existing = uniqueStudentAttendances.get(studentId)!
      if (validRecord.status === 'present' || 
          (validRecord.status === 'late' && existing.status === 'absent')) {
        uniqueStudentAttendances.set(studentId, validRecord)
      }
    }
  })

  const uniqueRecords = Array.from(uniqueStudentAttendances.values())
  
  const presentStudents = uniqueRecords.filter(r => r.status === 'present').length
  const absentStudents = uniqueRecords.filter(r => r.status === 'absent').length
  const lateStudents = uniqueRecords.filter(r => r.status === 'late').length

  const attendanceRate = totalStudents > 0 
    ? Math.round(((presentStudents + lateStudents) / totalStudents) * 100 * 10) / 10
    : 0

  return {
    totalStudents,
    presentStudents,
    absentStudents,
    lateStudents,
    attendanceRate,
    updateTime: new Date()
  }
}

// 안전한 클래스 데이터 타입 정의
interface SafeClassRecord {
  id: string
  name: string
  start_date: string
  student_enrollments?: Array<{
    student_id: string
    students?: {
      id: string
      name: string
      status: string
    }
  }>
}

// 클래스별 출석 현황 처리 함수
function processClassAttendance(
  classes: unknown[], 
  attendanceData: unknown[]
): ClassAttendance[] {
  if (!classes || classes.length === 0) return []

  return classes
    .filter((cls: unknown): cls is SafeClassRecord => {
      // 타입 가드: 클래스 데이터 검증
      if (!cls || typeof cls !== 'object') return false
      const safeClass = cls as Record<string, unknown>
      
      return typeof safeClass.id === 'string' &&
             typeof safeClass.name === 'string' &&
             typeof safeClass.start_date === 'string'
    })
    .map((cls: SafeClassRecord) => {
      // 출석 데이터 필터링 (타입 가드 적용)
      const classAttendances = attendanceData
        ?.filter((a: unknown) => {
          if (!a || typeof a !== 'object') return false
          const safeA = a as Record<string, unknown>
          return safeA.class_id === cls.id && typeof safeA.status === 'string'
        })
        .map((a: unknown) => {
          const safeA = a as Record<string, unknown>
          return {
            status: safeA.status as string,
            class_id: safeA.class_id as string
          }
        }) || []
      
      const totalStudents = cls.student_enrollments?.length || 0
      
      const presentCount = classAttendances.filter(a => a.status === 'present').length
      const absentCount = classAttendances.filter(a => a.status === 'absent').length  
      const lateCount = classAttendances.filter(a => a.status === 'late').length

      const attendanceRate = totalStudents > 0 
        ? Math.round(((presentCount + lateCount) / totalStudents) * 100 * 10) / 10
        : 0

      // 간단한 수업 시간 추정 (오늘 출석 데이터가 있는 수업)
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const scheduledTime = new Date(`${todayStr}T09:00:00`) // 기본 9시로 설정
      const endTime = new Date(`${todayStr}T17:00:00`) // 기본 5시 종료
      
      let status: 'ongoing' | 'completed' | 'upcoming'
      if (now < scheduledTime) {
        status = 'upcoming'
      } else if (now > endTime) {
        status = 'completed'
      } else {
        status = 'ongoing'
      }

      return {
        classId: cls.id,
        className: cls.name,
        scheduledTime,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        status
      }
    })
}

// 출석 트렌드 계산 함수 (간단한 버전)
async function calculateAttendanceTrends(
  supabase: SupabaseClient<Database>,
  tenantId: string
): Promise<AttendanceTrend[]> {
  try {
    // 최근 7일간의 출석률 트렌드 계산
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: trendData, error } = await supabase
      .from('attendances')
      .select(`
        attendance_date,
        status,
        students!inner(id, status)
      `)
      .eq('tenant_id', tenantId)
      .gte('attendance_date', sevenDaysAgo.toISOString().split('T')[0])
      .eq('students.status', 'active')

    if (error || !trendData) return []

    // 날짜별 그룹화 및 출석률 계산
    const dateGroups = new Map()
    trendData.forEach((record: unknown) => {
      // 타입 가드를 통한 안전한 타입 검증
      if (!record || typeof record !== 'object') return
      
      const safeRecord = record as Record<string, unknown>
      if (typeof safeRecord.attendance_date !== 'string') return
      if (typeof safeRecord.status !== 'string') return
      
      const date = safeRecord.attendance_date
      const status = safeRecord.status
      
      if (!dateGroups.has(date)) {
        dateGroups.set(date, { present: 0, total: 0 })
      }
      const group = dateGroups.get(date)!
      group.total++
      if (status === 'present' || status === 'late') {
        group.present++
      }
    })

    // 트렌드 데이터 생성
    const trends: AttendanceTrend[] = []
    for (const [date, data] of dateGroups.entries()) {
      const attendanceRate = data.total > 0 
        ? Math.round((data.present / data.total) * 100 * 10) / 10
        : 0

      trends.push({
        time: new Date(`${date}T12:00:00`).toISOString(),
        attendanceRate,
        totalStudents: data.total,
        presentCount: data.present
      })
    }

    return trends.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  } catch (error) {
    console.error('트렌드 계산 실패:', error)
    return []
  }
}

// 출석 알림 생성 함수
function generateAttendanceAlerts(
  stats: AttendanceStats,
  classesByTime: ClassAttendance[]
): AttendanceAlert[] {
  const alerts: AttendanceAlert[] = []

  // 전체 출석률이 낮을 때 알림
  if (stats.attendanceRate < 70 && stats.totalStudents > 0) {
    alerts.push({
      id: `low-attendance-${Date.now()}`,
      type: 'low_attendance',
      severity: 'high',
      message: `전체 출석률이 ${stats.attendanceRate}%로 낮습니다. (${stats.presentStudents + stats.lateStudents}/${stats.totalStudents})`,
      timestamp: new Date()
    })
  }

  // 클래스별 낮은 출석률 알림
  classesByTime.forEach(cls => {
    if (cls.attendanceRate < 60 && cls.totalStudents > 0 && cls.status === 'ongoing') {
      alerts.push({
        id: `class-low-attendance-${cls.classId}`,
        type: 'low_attendance',
        severity: 'medium',
        message: `${cls.className} 클래스의 출석률이 ${cls.attendanceRate}%로 낮습니다.`,
        classId: cls.classId,
        timestamp: new Date()
      })
    }
  })

  return alerts
}