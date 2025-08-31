// 출석 현황 위젯 타입 정의
import { Database } from './database.types'

// Database 타입에서 출석 관련 타입 추출
export type AttendanceRow = Database['public']['Tables']['attendances']['Row']
export type AttendanceStatus = Database['public']['Enums']['attendance_status']

// 실시간 출석 통계
export interface AttendanceStats {
  totalStudents: number
  presentStudents: number
  absentStudents: number
  lateStudents: number
  attendanceRate: number // 백분율 (0-100)
  updateTime: Date
}

// 클래스별 출석 현황
export interface ClassAttendance {
  classId: string
  className: string
  scheduledTime: Date
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number // 백분율 (0-100)
  status: 'ongoing' | 'completed' | 'upcoming'
}

// 출석 트렌드 데이터
export interface AttendanceTrend {
  time: string // ISO 8601 형식
  attendanceRate: number // 백분율 (0-100)
  totalStudents?: number
  presentCount?: number
}

// 출석 알림
export interface AttendanceAlert {
  id: string
  type: 'low_attendance' | 'missing_checkin' | 'late_pattern' | 'system_error'
  severity: 'low' | 'medium' | 'high'
  message: string
  classId?: string
  studentId?: string
  timestamp: Date
}

// API 응답 타입들
export interface AttendanceRealtimeResponse {
  stats: AttendanceStats
  classesByTime: ClassAttendance[]
  trends: AttendanceTrend[]
  alerts: AttendanceAlert[]
  lastUpdated: string
}

export interface AttendanceTrendsResponse {
  daily: DailyAttendanceTrend[]
  hourly: HourlyAttendanceTrend[]
  comparison: AttendanceComparison
}

// 일별 출석 트렌드
export interface DailyAttendanceTrend {
  date: string // YYYY-MM-DD 형식
  attendanceRate: number
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
}

// 시간별 출석 트렌드
export interface HourlyAttendanceTrend {
  hour: number // 0-23
  attendanceRate: number
  totalClasses: number
  avgStudentsPerClass: number
}

// 출석률 비교 데이터
export interface AttendanceComparison {
  currentPeriod: number // 현재 기간 평균 출석률
  previousPeriod: number // 이전 기간 평균 출석률
  changePercent: number // 변화율 (+ 또는 -)
  changeDirection: 'up' | 'down' | 'stable'
}

// 출석 상세 정보 (개별 학생)
export interface StudentAttendanceDetail {
  studentId: string
  studentName: string
  classId: string
  className: string
  status: AttendanceStatus
  checkInTime?: Date
  checkOutTime?: Date
  lateMinutes?: number
  notes?: string
}

// 출석 통계 필터 옵션
export interface AttendanceStatsFilter {
  dateFrom?: Date
  dateTo?: Date
  classIds?: string[]
  instructorIds?: string[]
  includeInactive?: boolean
}

// 차트 설정
export interface AttendanceChartConfig {
  showGrid: boolean
  showAnimation: boolean
  height: number
  colors: {
    present: string
    absent: string
    late: string
    trend: string
  }
}

// 위젯 설정
export interface AttendanceWidgetConfig {
  refreshInterval: number // 초 단위
  showTrends: boolean
  showAlerts: boolean
  showClassBreakdown: boolean
  maxClassesDisplay: number
  chartConfig: AttendanceChartConfig
}

// React Query 관련 타입들
export interface UseAttendanceDataOptions {
  tenantId: string
  refreshInterval?: number
  enabled?: boolean
}

export interface UseAttendanceDataResult {
  data?: AttendanceRealtimeResponse
  isLoading: boolean
  error: Error | null
  lastUpdated?: string
  refetch: () => Promise<any>
}

// 에러 타입
export interface AttendanceApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// 집계 통계 타입
export interface AttendanceAggregateStats {
  period: 'day' | 'week' | 'month'
  avgAttendanceRate: number
  totalSessions: number
  totalStudents: number
  bestPerformingClass: {
    classId: string
    className: string
    attendanceRate: number
  }
  worstPerformingClass: {
    classId: string
    className: string
    attendanceRate: number
  }
  trends: {
    improving: ClassAttendance[]
    declining: ClassAttendance[]
  }
}

// 내보내기 관련 타입
export interface AttendanceExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  dateRange: {
    from: Date
    to: Date
  }
  includeIndividualRecords: boolean
  includeStatistics: boolean
  classIds?: string[]
}

// 실시간 업데이트 이벤트 타입
export interface AttendanceUpdateEvent {
  type: 'attendance_marked' | 'class_started' | 'class_ended' | 'student_arrived_late'
  classId: string
  studentId?: string
  timestamp: Date
  data: Partial<AttendanceRow>
}

// 위젯 상태 관리
export interface AttendanceWidgetState {
  selectedClass?: string
  sortField: 'scheduledTime' | 'attendanceRate' | 'totalStudents' | 'className'
  sortDirection: 'asc' | 'desc'
  filterStatus: 'all' | 'ongoing' | 'completed' | 'upcoming'
  showDetails: boolean
}

// 성능 메트릭
export interface AttendancePerformanceMetrics {
  queryTime: number // ms
  dataSize: number // bytes
  cacheHitRate: number // 0-1
  lastOptimized: Date
}