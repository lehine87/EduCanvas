// 클래스 관련 타입 정의 (실제 DB 스키마 기반)

import type { Database } from './database.types'

export type DatabaseClass = Database['public']['Tables']['classes']['Row']

export interface Class {
  id: string
  name: string
  description?: string | null
  instructor_id?: string | null
  subject?: string | null
  course?: string | null
  grade?: string | null
  level?: string | null
  is_active?: boolean | null
  max_students?: number | null
  min_students?: number | null
  start_date?: string | null
  end_date?: string | null
  classroom_id?: string | null
  default_classroom_id?: string | null
  main_textbook?: string | null
  supplementary_textbook?: string | null
  color?: string | null
  schedule_config?: any
  custom_fields?: any
  tenant_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null

  // 추가 필드들 (UI 컴포넌트에서 사용됨)
  duration_minutes?: number | null
  price?: number | null
  notes?: string | null
  room?: string | null
  status?: 'active' | 'inactive' | 'completed' | 'cancelled' | null
  
  // 관계 데이터 (JOIN으로 가져오는 데이터)
  instructor?: {
    name: string
    email?: string
    phone?: string
  } | null
  
  // 계산된 필드
  student_count?: number
  attendance_rate?: number
  revenue_total?: number
  next_session?: string
  last_session?: string
}

// 클래스 스케줄 인터페이스
export interface ClassSchedule {
  id: string
  class_id: string
  day_of_week: number // 0-6 (일-토)
  start_time: string // HH:mm
  end_time: string // HH:mm
  room_id?: string
  room?: {
    id: string
    name: string
  }
  created_at: string
}

// 클래스 통계 인터페이스
export interface ClassStats {
  class_id: string
  total_students: number
  active_students: number
  attendance_rate: number
  revenue_current_month: number
  revenue_total: number
  last_session_date?: string
  next_session_date?: string
}

// 대시보드 통계 인터페이스
export interface ClassDashboardStats {
  totalClasses: number
  activeClasses: number
  inactiveClasses: number
  totalStudents: number
  avgClassSize: number
  monthlyRevenue: number
  revenueGrowth: number
  avgAttendanceRate: number
  attendanceChange: number
}

// 클래스 생성/수정 폼 데이터
export interface ClassFormData {
  name: string
  description?: string
  instructor_id?: string
  subject?: string
  course?: string
  grade?: string
  level?: string
  max_students?: number
  min_students?: number
  start_date?: string
  end_date?: string
  classroom_id?: string
  default_classroom_id?: string
  main_textbook?: string
  supplementary_textbook?: string
  color?: string
  is_active?: boolean

  // 추가 필드들 (UI 컴포넌트에서 사용됨)
  duration_minutes?: number
  price?: number
  notes?: string
  room?: string
}

// 클래스 검색/필터 파라미터
export interface ClassSearchParams {
  search?: string
  status?: 'all' | 'active' | 'inactive' | 'suspended'
  instructor_id?: string
  subject_id?: string
  course_id?: string
  room_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
  sort_by?: 'name' | 'created_at' | 'current_enrollment' | 'attendance_rate'
  sort_order?: 'asc' | 'desc'
}

// API 응답 타입
export interface ClassListResponse {
  classes: Class[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 클래스 상세 정보 (스케줄 포함)
export interface ClassDetail extends Class {
  schedules: ClassSchedule[]
  students: {
    id: string
    name: string
    status: 'active' | 'inactive' | 'suspended'
    enrollment_date: string
  }[]
  recent_sessions: {
    id: string
    date: string
    attendance_count: number
    total_students: number
  }[]
}