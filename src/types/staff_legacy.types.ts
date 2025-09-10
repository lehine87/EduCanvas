// Staff 관리 관련 타입 정의
// Updated for Schema v5.0 (2025-08-25) - staff_info integration

import { Database } from './database.types'

export type TenantMembership = Database['public']['Tables']['tenant_memberships']['Row']
export type TenantMembershipInsert = Database['public']['Tables']['tenant_memberships']['Insert']
export type TenantMembershipUpdate = Database['public']['Tables']['tenant_memberships']['Update']

// Staff Info stored in tenant_memberships.staff_info JSONB field
export interface StaffInfo {
  // Basic info
  name?: string
  name_english?: string
  phone?: string
  email?: string
  bio?: string
  
  // Employment info
  hire_date?: string
  employment_status?: string
  employment_type?: string
  
  // Financial info
  hourly_rate?: number
  salary_policy_id?: string
  bank_account?: string
  
  // Teaching info
  qualifications?: string[]
  specialties?: string[]
  max_classes?: number
  teaching_experience_years?: number
  
  // Additional custom fields (JSON-safe types only) 
  [key: string]: string | number | boolean | string[] | null | undefined
}

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
  staff_info?: StaffInfo  // ✅ v5.0: Additional staff information
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
  staff_info?: StaffInfo  // ✅ v5.0: Additional staff information
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
  staff_info?: StaffInfo  // ✅ v5.0: Additional staff information
}