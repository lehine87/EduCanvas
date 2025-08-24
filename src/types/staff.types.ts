// Staff 관리 관련 타입 정의

export interface StaffMember {
  id: string
  email: string
  full_name: string
  phone?: string
  status: string
  job_function: 'instructor' | 'general'
  role: string
  role_name?: string
  hierarchy_level: number
  hire_date?: string
  specialization?: string
  bio?: string
  created_at: string
  membership_id: string
}

export interface StaffStats {
  total: number
  active: number
  pending: number
  inactive: number
  instructors: number
  general: number
  byRole?: Record<string, number>
}

export type StaffJobFunction = 'instructor' | 'general'
export type StaffRole = 'admin' | 'instructor' | 'staff' | 'viewer'
export type StaffStatus = 'active' | 'pending' | 'inactive'

export interface CreateStaffRequest {
  tenantId: string
  email: string
  full_name: string
  phone?: string
  job_function: StaffJobFunction
  role: StaffRole
  hire_date?: string
  specialization?: string
  bio?: string
}

export interface UpdateStaffRequest {
  tenantId: string
  full_name: string
  phone?: string
  job_function: StaffJobFunction
  role: StaffRole
  hire_date?: string
  specialization?: string
  bio?: string
}