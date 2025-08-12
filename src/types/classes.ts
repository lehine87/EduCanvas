// src/types/classes.ts
// Updated for Schema v4.1 (2025-08-11)
// Key changes: grade, course columns, User-first Architecture

export type ClassStatus = 'active' | 'inactive' | 'archived'

export interface Class {
  id: string
  name: string
  subject?: string
  grade?: string  // ⚠️ v4.1: New field for class grade level
  course?: string  // ✅ v4.1: Course/curriculum field (corrected from "cource" typo)
  level?: string  // Additional level classification
  max_students?: number
  min_students?: number  // ⚠️ v4.1: Minimum students requirement
  instructor_id?: string  // ⚠️ CRITICAL: References user_profiles.id (NOT instructors.id!)
  classroom_id?: string  // FK to classrooms table
  color?: string
  description?: string  // Additional description field
  is_active?: boolean  // ⚠️ v4.1: Status field (boolean type)
  start_date?: string
  end_date?: string
  schedule_config?: any  // JSON field for schedule configuration
  custom_fields?: any    // JSON field for custom data
  tenant_id?: string     // ⚠️ v4.1: Multitenant architecture
  created_at?: string
  updated_at?: string
  created_by?: string    // FK to user_profiles.id
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