// src/types/class.ts
export interface Class {
  id: string
  name: string
  subject: string
  grade_level?: string
  max_students: number
  monthly_fee: number
  main_instructor_id?: string
  classroom?: string
  color: string
  status: Status
  start_date?: string
  end_date?: string
  order_index: number
  memo?: string
  academy_id: string
  created_at: string
  updated_at: string
}

export interface ClassSchedule {
  id: string
  class_id: string
  day_of_week: number // 0=일요일, 1=월요일, ..., 6=토요일
  start_time: string
  end_time: string
  created_at: string
}

export interface ClassStats {
  total_students: number
  active_students: number
  waiting_students: number
  total_revenue: number
  attendance_rate: number
}