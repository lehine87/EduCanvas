// src/types/student.ts
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'

export interface Student {
  id: string
  name: string
  phone?: string
  parent_name?: string
  parent_phone: string
  grade?: string
  class_id?: string
  status: StudentStatus
  monthly_fee: number
  enrollment_date: string
  graduation_date?: string
  display_color?: string
  position_in_class: number
  memo?: string
  academy_id: string
  created_at: string
  updated_at: string
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