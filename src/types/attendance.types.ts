/**
 * 근태 관리 시스템 타입 정의
 */

export interface AttendanceRecord {
  id: string
  tenant_id: string
  membership_id: string
  date: string // YYYY-MM-DD
  check_in: string | null // HH:MM
  check_out: string | null // HH:MM
  status: AttendanceStatus
  notes: string | null
  created_at: string
  updated_at: string
  
  // 조인된 데이터
  tenant_memberships?: {
    id: string
    user_profiles: {
      name: string
      email: string
    }
  }
}

export type AttendanceStatus = '정상' | '지각' | '조퇴' | '결근' | '휴가'

export interface CheckInRequest {
  qr_code?: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
}

export interface CheckOutRequest {
  qr_code?: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
}

export interface CheckInResponse {
  record: AttendanceRecord
  check_in_time: string
  status: AttendanceStatus
  is_late: boolean
}

export interface CheckOutResponse {
  record: AttendanceRecord
  check_out_time: string
  work_hours: number
  status: AttendanceStatus
  is_early_leave: boolean
}

export interface AttendanceFilters {
  membership_id?: string
  start_date?: string
  end_date?: string
  status?: AttendanceStatus
  page?: number
  limit?: number
}

export interface AttendanceListResponse {
  records: AttendanceRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// 근태 통계
export interface AttendanceStats {
  total_days: number
  present_days: number
  late_days: number
  early_leave_days: number
  absent_days: number
  vacation_days: number
  
  attendance_rate: number // 출석률 (%)
  punctuality_rate: number // 정시 출근률 (%)
  
  total_work_hours: number
  average_work_hours: number
  overtime_hours: number
  
  // 월별 통계
  monthly_stats?: {
    [month: string]: {
      attendance_rate: number
      total_work_hours: number
      late_count: number
      early_leave_count: number
    }
  }
}

// QR 코드 생성 요청
export interface QRCodeRequest {
  action: 'check_in' | 'check_out'
  valid_hours?: number // 유효 시간 (기본 1시간)
}

export interface QRCodeResponse {
  qr_code: string
  expires_at: string
  action: string
}

// 위치 정보
export interface LocationInfo {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
}

// 근태 규칙 설정
export interface AttendanceRules {
  work_start_time: string // HH:MM
  work_end_time: string // HH:MM
  lunch_break_start: string // HH:MM
  lunch_break_end: string // HH:MM
  late_threshold_minutes: number // 지각 기준 (분)
  early_leave_threshold_minutes: number // 조퇴 기준 (분)
  
  // 위치 기반 설정
  office_location?: {
    latitude: number
    longitude: number
    allowed_radius: number // 허용 반경 (미터)
  }
  
  // QR 코드 설정
  qr_code_enabled: boolean
  qr_code_valid_hours: number
  
  // 위치 기반 설정
  location_based_enabled: boolean
  
  // 자동 체크아웃 설정
  auto_checkout_enabled: boolean
  auto_checkout_time: string // HH:MM
}

// 휴가 신청
export interface VacationRequest {
  id: string
  membership_id: string
  start_date: string
  end_date: string
  vacation_type: VacationType
  reason: string
  status: VacationStatus
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export type VacationType = '연차' | '병가' | '경조사' | '기타'
export type VacationStatus = '대기' | '승인' | '거부'

// 근태 대시보드 데이터
export interface AttendanceDashboard {
  today_stats: {
    total_staff: number
    checked_in: number
    late_arrivals: number
    on_vacation: number
    absent: number
  }
  
  recent_activities: {
    type: 'check_in' | 'check_out' | 'vacation_request'
    staff_name: string
    timestamp: string
    status?: AttendanceStatus
  }[]
  
  weekly_summary: {
    date: string
    attendance_rate: number
    late_rate: number
    average_work_hours: number
  }[]
  
  monthly_trends: {
    month: string
    attendance_rate: number
    total_work_hours: number
    overtime_hours: number
  }[]
}

// 근태 보고서
export interface AttendanceReport {
  period: {
    start_date: string
    end_date: string
  }
  
  staff_summary: {
    membership_id: string
    staff_name: string
    total_days: number
    present_days: number
    late_days: number
    early_leave_days: number
    absent_days: number
    vacation_days: number
    total_work_hours: number
    overtime_hours: number
    attendance_rate: number
  }[]
  
  department_summary?: {
    [department: string]: {
      total_staff: number
      average_attendance_rate: number
      total_work_hours: number
      overtime_hours: number
    }
  }
  
  overall_stats: {
    total_staff: number
    average_attendance_rate: number
    total_work_hours: number
    average_work_hours_per_staff: number
    total_overtime_hours: number
  }
}

// Frontend 컴포넌트용 Props
export interface AttendanceClockProps {
  onCheckIn: (request: CheckInRequest) => void
  onCheckOut: (request: CheckOutRequest) => void
  currentStatus?: 'not_started' | 'working' | 'completed'
  todayRecord?: AttendanceRecord
  isLoading?: boolean
}

export interface AttendanceTableProps {
  records: AttendanceRecord[]
  pagination?: AttendanceListResponse['pagination']
  onPageChange?: (page: number) => void
  onFilterChange?: (filters: AttendanceFilters) => void
  isLoading?: boolean
}

export interface QRCodeScannerProps {
  onScan: (qrCode: string) => void
  onError: (error: string) => void
  action: 'check_in' | 'check_out'
}

export interface AttendanceStatsCardProps {
  stats: AttendanceStats
  period: string
  isLoading?: boolean
}

export interface VacationRequestFormProps {
  onSubmit: (request: Omit<VacationRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  isLoading?: boolean
}