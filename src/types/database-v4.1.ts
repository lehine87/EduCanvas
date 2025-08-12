// EduCanvas v4.1 Database Types
// Generated from: Supabase + Manual Schema v4.1 updates
// Updated on: 2025-08-11
// Key changes: parent_phone_1/2, student_number required, User-first Architecture

// Re-export the auto-generated types from Supabase
export * from './database.types'

// ================================================================
// 1. ENUM TYPES (PostgreSQL Enums → TypeScript)
// ================================================================

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'

export type UserRole = 'admin' | 'instructor' | 'staff' | 'viewer'

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled' | 'refunded'

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mobile'

export type BillingType = 'monthly' | 'sessions' | 'hours' | 'package' | 'drop_in'

export type DiscountType = 'sibling' | 'early_payment' | 'loyalty' | 'scholarship' | 'promotion' | 'volume'

export type SalaryPolicyType = 'fixed_monthly' | 'fixed_hourly' | 'commission' | 'tiered_commission' | 'student_based' | 'hybrid' | 'guaranteed_minimum'

export type ConsultationType = 'academic' | 'career' | 'behavioral' | 'parent_conference' | 'emergency'

export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

// ================================================================
// 2. v4.1 ENHANCED TYPES WITH SCHEMA CORRECTIONS
// ================================================================

/**
 * v4.1 Student Type - Enhanced with multiple parent contacts and email
 * Key changes from T-005 findings:
 * - student_number is REQUIRED (NOT NULL constraint)
 * - parent_phone_1, parent_phone_2 for multiple parent contacts  
 * - email field for direct student communication
 * - tenant_id for multitenant architecture
 */
export interface StudentV41 {
  id: string
  tenant_id?: string
  name: string
  student_number: string  // ⚠️ CRITICAL: Required field (NOT NULL)
  phone?: string | null
  email?: string | null   // ✅ v4.1: Student email
  parent_name?: string | null
  parent_phone_1?: string | null  // ✅ v4.1: Primary parent contact
  parent_phone_2?: string | null  // ✅ v4.1: Secondary parent contact  
  grade_level?: string | null
  status: StudentStatus
  enrollment_date?: string | null
  graduation_date?: string | null
  memo?: string | null
  custom_fields?: Record<string, unknown> | null     // JSON field
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null  // FK to user_profiles.id
}

/**
 * v4.1 Class Type - Enhanced with grade/course management
 * Key changes from T-005 findings:
 * - instructor_id references user_profiles.id (NOT instructors.id!)  
 * - grade, course fields for detailed class categorization
 * - User-first Architecture compliance
 */
export interface ClassV41 {
  id: string
  tenant_id?: string | null
  name: string
  subject?: string | null
  grade?: string | null      // ✅ v4.1: Class grade level
  course?: string | null     // ✅ v4.1: Course/curriculum (corrected from "cource")
  level?: string | null
  description?: string | null
  max_students?: number | null
  min_students?: number | null
  instructor_id?: string | null  // ⚠️ CRITICAL: References user_profiles.id!
  classroom_id?: string | null
  color?: string | null
  is_active?: boolean | null
  start_date?: string | null
  end_date?: string | null
  schedule_config?: Record<string, unknown> | null      // JSON field
  custom_fields?: Record<string, unknown> | null        // JSON field
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null // FK to user_profiles.id
}

/**
 * User Profiles - The foundation of User-first Architecture
 * All instructors, staff, admins are users first
 */
export interface UserProfileV41 {
  id: string  // References auth.users.id (hidden FK constraint)
  name?: string | null
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  status: 'active' | 'inactive' | null
  role?: UserRole | null
  last_login?: string | null
  tenant_id?: string | null
  custom_fields?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

/**
 * Instructors - Additional instructor-specific information
 * Links to user_profiles via user_id FK
 */
export interface InstructorV41 {
  id: string
  tenant_id?: string | null
  name: string
  user_id?: string | null    // FK to user_profiles.id
  email?: string | null
  phone?: string | null
  specialization?: string | null
  qualification?: string | null
  bank_account?: string | null
  hire_date?: string | null
  status?: string | null
  memo?: string | null
  created_at?: string | null
  updated_at?: string | null
}

/**
 * Tenants - Multitenant architecture base
 */
export interface TenantV41 {
  id: string
  name: string
  slug: string  // UNIQUE constraint
  is_active?: boolean | null
  settings?: Record<string, unknown> | null // JSON field
  created_at?: string | null
  updated_at?: string | null
}

// ================================================================
// 3. RELATIONSHIP TYPES WITH v4.1 ENHANCEMENTS
// ================================================================

export interface StudentWithRelationsV41 extends StudentV41 {
  class?: ClassV41
  instructor?: InstructorV41
  tenant?: TenantV41
  // Multiple parent contacts
  parents?: {
    primary_phone?: string
    secondary_phone?: string
    name?: string
  }
}

export interface ClassWithRelationsV41 extends ClassV41 {
  instructor?: InstructorV41
  user_profile?: UserProfileV41  // The actual user account
  students?: StudentV41[]
  tenant?: TenantV41
  student_count?: number
}

export interface InstructorWithRelationsV41 extends InstructorV41 {
  user_profile?: UserProfileV41  // The actual user account  
  classes?: ClassV41[]
  tenant?: TenantV41
}

// ================================================================
// 4. INSERT/UPDATE TYPES FOR v4.1
// ================================================================

export type StudentInsertV41 = Omit<StudentV41, 'id' | 'created_at' | 'updated_at'> & {
  student_number: string  // Ensure this required field is explicit
  tenant_id: string       // Required for multitenant
}

export type StudentUpdateV41 = Partial<Omit<StudentV41, 'id' | 'created_at' | 'updated_at'>>

export type ClassInsertV41 = Omit<ClassV41, 'id' | 'created_at' | 'updated_at'> & {
  name: string           // Required field
  tenant_id: string      // Required for multitenant
}

export type ClassUpdateV41 = Partial<Omit<ClassV41, 'id' | 'created_at' | 'updated_at'>>

// ================================================================
// 5. API RESPONSE TYPES
// ================================================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
  has_more: boolean
}

// ================================================================
// 6. FILTER TYPES FOR v4.1
// ================================================================

export interface StudentFiltersV41 {
  search?: string
  status?: StudentStatus | 'all'
  grade_level?: string | 'all'
  class_id?: string | 'all'
  tenant_id?: string
  has_email?: boolean
  parent_phone?: string  // Search across both parent phones
}

export interface ClassFiltersV41 {
  search?: string
  grade?: string | 'all'
  course?: string | 'all'
  subject?: string | 'all'
  instructor_id?: string | 'all'
  is_active?: boolean | 'all'
  tenant_id?: string
}

// ================================================================
// 7. STATISTICS TYPES FOR v4.1
// ================================================================

export interface StudentStatsV41 {
  total: number
  active: number
  inactive: number
  graduated: number
  withdrawn: number
  suspended: number
  with_email: number      // Students with email contact
  with_dual_parents: number  // Students with both parent phones
}

export interface ClassStatsV41 {
  total: number
  active: number
  inactive: number
  by_grade: Record<string, number>
  by_course: Record<string, number>
  by_subject: Record<string, number>
  total_students: number
  average_class_size: number
}

// ================================================================
// 8. ERROR AND VALIDATION TYPES
// ================================================================

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface DatabaseError {
  message: string
  code: string
  details?: string
  hint?: string
}

// ================================================================
// 9. UTILITY TYPES
// ================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Helper type for ensuring required fields in insert operations
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Helper type for database operations that need tenant_id
export type WithTenant<T> = T & { tenant_id: string }

// Helper type for timestamped entities
export type WithTimestamps<T> = T & {
  created_at?: string | null
  updated_at?: string | null
}