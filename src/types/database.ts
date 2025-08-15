// EduCanvas v4.1 Database Types (메인 파일)
// Generated from: Supabase + Manual Schema v4.1 updates
// Updated on: 2025-08-12
// Key changes: UserProfile 통합, 타입 불일치 해결, 최신 스키마 반영

// Re-export the auto-generated types from Supabase
export * from './database.types'

// ================================================================
// 1. ENUM TYPES (PostgreSQL Enums → TypeScript)
// ================================================================
// StudentStatus는 student.types.ts에서 정의됨
// UserRole은 auth.types.ts에서 정의됨

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled' | 'refunded'

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mobile'

export type BillingType = 'monthly' | 'sessions' | 'hours' | 'package' | 'drop_in'

export type DiscountType = 'sibling' | 'early_payment' | 'loyalty' | 'scholarship' | 'promotion' | 'volume'

export type SalaryPolicyType = 'fixed_monthly' | 'fixed_hourly' | 'commission' | 'tiered_commission' | 'student_based' | 'hybrid' | 'guaranteed_minimum'

export type ConsultationType = 'academic' | 'career' | 'behavioral' | 'parent_conference' | 'emergency'

export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

// ================================================================
// 2. 데이터베이스 스키마 (자동 생성 타입에서 가져옴)
// ================================================================

// Supabase에서 생성된 Database 타입을 기본으로 사용
// database.types.ts에서 export됨

// ================================================================
// 3. UTILITY TYPES
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

// ================================================================
// 4. PAGINATION TYPES (API Response는 api.types.ts에서 처리)
// ================================================================

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
// 5. ERROR AND VALIDATION TYPES
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