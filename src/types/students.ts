// src/types/students.ts
// Updated for Schema v4.1 (2025-08-11)
// Key changes: parent_phone_1, parent_phone_2, email, student_number (required)

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'

export interface Student {
  id: string
  name: string
  student_number: string  // ⚠️ v4.1: Required field (NOT NULL)
  phone?: string
  email?: string  // ⚠️ v4.1: New field for student email
  parent_name?: string
  parent_phone?: string  // ⚠️ Deprecated, use parent_phone_1
  parent_phone_1?: string  // ⚠️ v4.1: Primary parent contact
  parent_phone_2?: string  // ⚠️ v4.1: Secondary parent contact
  grade_level?: string  // ⚠️ Updated field name (was grade)
  class_id?: string
  status: StudentStatus
  enrollment_date: string
  graduation_date?: string
  display_color?: string
  memo?: string
  tenant_id: string  // ⚠️ v4.1: Multitenant architecture
  created_at: string
  updated_at: string
  created_by?: string  // FK to user_profiles.id
}

export interface StudentFilters {
  search: string
  status: StudentStatus | 'all'
  class: string | 'all'
  grade: string | 'all'
}

export interface StudentStats {
  total: number
  active: number
  waiting: number
  graduated: number
  revenue: {
    total: number
    monthly: number
    projected: number
  }
}