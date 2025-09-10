/**
 * @file instructor.types.ts
 * @description 강사 관리 시스템 타입 정의
 * @module T-V2-012
 */

import { Database, Json } from './supabase'

// ============================================================================
// Base Types from Supabase
// ============================================================================

export type TenantMembership = Database['public']['Tables']['tenant_memberships']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type TenantRole = Database['public']['Tables']['tenant_roles']['Row']

// ============================================================================
// Staff Info Type Definitions (통합된 정의)
// ============================================================================

export interface StaffInfo {
  employee_id?: string
  employment_type?: '정규직' | '계약직' | '파트타임'
  department?: string
  position?: string
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
  instructor_info?: {
    teaching_level?: '초급' | '중급' | '고급'
    subjects?: string[]
    certifications?: string[]
    specialties?: string[]
    max_classes_per_week?: number
  }
  salary_info?: {
    type?: string
    base_amount?: number
    allowances?: Array<{
      name: string
      amount: number
      is_taxable: boolean
    }>
    deductions?: Array<{
      name: string
      amount: number
      is_mandatory: boolean
    }>
    payment_day?: number
    bank_info?: {
      bank_name: string
      account_number: string
      account_holder: string
    }
  }
}

// 수동으로 정의 (새로 생성한 테이블들)
export interface SalaryPolicy {
  id: string
  tenant_id: string
  name: string
  policy_type: 'fixed_monthly' | 'fixed_hourly' | 'commission' | 'tiered_commission' | 'student_based' | 'hybrid' | 'guaranteed_minimum'
  base_amount: number
  hourly_rate?: number
  commission_rate?: number
  minimum_guaranteed: number
  calculation_basis: 'revenue' | 'students' | 'hours'
  policy_config?: Record<string, any>
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SalaryCalculation {
  id: string
  tenant_id: string
  membership_id: string
  calculation_month: string
  total_revenue: number
  total_students: number
  total_hours: number
  base_salary: number
  commission_salary: number
  bonus_amount: number
  deduction_amount: number
  total_calculated: number
  minimum_guaranteed: number
  final_salary: number
  calculation_details?: Record<string, any>
  calculated_at: string
  calculated_by?: string
  approved_at?: string
  approved_by?: string
  status: 'calculated' | 'approved' | 'paid'
}

export interface AttendanceRecord {
  id: string
  tenant_id: string
  membership_id: string
  date: string
  check_in?: string
  check_out?: string
  status: '정상' | '지각' | '조퇴' | '결근' | '휴가' | '병가' | '공가'
  notes?: string
  created_at: string
  updated_at: string
}

export interface StaffEvaluation {
  id: string
  tenant_id: string
  membership_id: string
  evaluator_id: string
  evaluation_date: string
  content?: string
  rating?: number
  visibility: 'admin_only' | 'managers'
  created_at: string
}

// ============================================================================
// Instructor Types
// ============================================================================

/**
 * 강사 기본 정보
 */
export interface Instructor extends TenantMembership {
  user?: UserProfile
  role?: TenantRole
  salary_policies?: InstructorSalaryPolicy[]
}

// 중복 제거됨 - 상단의 StaffInfo 정의 사용

/**
 * 강사-급여정책 연결
 */
export interface InstructorSalaryPolicy {
  id: string
  membership_id: string
  policy_id: string
  effective_from: string
  effective_to?: string
  is_active: boolean
  created_at: string
  policy?: SalaryPolicy
}

// ============================================================================
// Filter & Search Types
// ============================================================================

/**
 * 강사 필터 옵션
 */
export interface InstructorFilters {
  search?: string
  status?: 'active' | 'inactive' | 'pending'
  employment_type?: '정규직' | '계약직' | '파트타임'
  department?: string
  teaching_level?: '초급' | '중급' | '고급'
  date_range?: {
    start: string
    end: string
  }
  limit?: number
  sort_field?: 'name' | 'hire_date' | 'department' | 'position'
  sort_order?: 'asc' | 'desc'
  hire_date_from?: string
  hire_date_to?: string
}

/**
 * 강사 정렬 옵션
 */
export interface InstructorSortOptions {
  field: 'name' | 'hire_date' | 'department' | 'position'
  order: 'asc' | 'desc'
}

// ============================================================================
// Dashboard & Statistics Types
// ============================================================================

/**
 * 강사 대시보드 통계
 */
export interface InstructorDashboardStats {
  total: number
  active: number
  onLeave: number
  todayClasses: number
  monthlyHours: number
  avgClassesPerInstructor: number
  
  byDepartment: Record<string, number>
  byEmploymentType: {
    fullTime: number
    partTime: number
    contract: number
  }
}

/**
 * 근태 통계
 */
export interface AttendanceStats {
  total: number
  present: number
  late: number
  absent: number
  leave: number
  month: string
}

// ============================================================================
// Salary Types
// ============================================================================

/**
 * 급여 정책 타입
 */
export type SalaryPolicyType = 
  | 'fixed_monthly'      // 고정 월급
  | 'fixed_hourly'       // 시급제
  | 'commission'         // 단순 비율제
  | 'tiered_commission'  // 누진 비율제
  | 'student_based'      // 학생수 기준
  | 'hybrid'             // 혼합형
  | 'guaranteed_minimum' // 최저 보장제

/**
 * 급여 계산 상세
 */
export interface SalaryCalculationDetail {
  base_salary: number
  commission_salary: number
  bonus_amount: number
  deduction_amount: number
  final_salary: number
  calculation_details?: {
    overtime_hours?: number
    overtime_pay?: number
    position_allowance?: number
    qualification_allowance?: number
    tax?: number
    insurance?: number
    other_deductions?: Array<{
      name: string
      amount: number
    }>
  }
}

// ============================================================================
// Form & Request Types
// ============================================================================

/**
 * 강사 생성 요청
 */
export interface CreateInstructorRequest {
  user_id: string
  tenant_id?: string
  role_id?: string
  staff_info?: StaffInfo
  hire_date?: string
  bio?: string
  qualification?: string
  specialization?: string
  salary_policy_id?: string
}

/**
 * 강사 수정 요청
 */
export interface UpdateInstructorRequest {
  staff_info?: Partial<StaffInfo>
  bio?: string
  qualification?: string
  specialization?: string
  status?: 'active' | 'inactive' | 'pending'
  salary_policy_id?: string
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * 강사 목록 응답
 */
export interface InstructorListResponse {
  instructors: Instructor[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * 강사 상세 응답
 */
export interface InstructorDetailResponse {
  instructor: Instructor
  salary_history?: SalaryCalculation[]
  attendance_stats?: AttendanceStats
  evaluations?: StaffEvaluation[]
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * 강사 관리 UI 상태
 */
export interface InstructorUIState {
  selectedInstructor: Instructor | null
  filters: InstructorFilters
  sortOptions: InstructorSortOptions
  viewMode: 'grid' | 'table'
  isCreateModalOpen: boolean
  isEditModalOpen: boolean
  isDetailDrawerOpen: boolean
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * 강사 관리 권한
 */
export interface InstructorPermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canViewSalary: boolean
  canEditSalary: boolean
  canViewEvaluations: boolean
  canCreateEvaluations: boolean
}