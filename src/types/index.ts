// EduCanvas v4.1 통합 타입 Export 시스템
// 모든 타입을 중앙에서 관리하고 일관되게 export
// @version v4.1 완전 체계화 버전
// @since 2025-08-12

// ================================================================
// 1. 핵심 데이터베이스 타입들 (최우선)
// ================================================================
import type { Database, Json } from './database.types'
export type { Database, Json } from './database.types'

// ================================================================
// 2. 도메인별 핵심 타입들
// ================================================================
// Database table types (from Supabase generated types)
export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']

export type Instructor = Database['public']['Tables']['instructors']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type CoursePackage = Database['public']['Tables']['course_packages']['Row']
export type StudentEnrollment = Database['public']['Tables']['student_enrollments']['Row']

// Enum types
export type {
  StudentStatus,
  UserRole,
  BillingType,
  PaymentStatus,
  PaymentMethod,
  AttendanceStatus
} from './database'

// Utility types
export type UserStatus = Database['public']['Enums']['user_status']
export type CreateEnrollmentRequest = StudentEnrollment // Simplified for now
export type ClassFlowStudent = Student & { position?: { x: number; y: number } }

// ================================================================
// 3. UI 및 컴포넌트 타입들
// ================================================================
export type {
  ComponentVariant,
  ComponentSize,
  BaseComponentProps,
  InteractiveProps,
  AccessibilityProps,
  FormFieldState,
  StatusType,
  TableColumn,
  TableProps,
  ButtonProps,
  InputProps,
  ModalProps,
  BadgeProps,
  CardProps
} from '../components/ui/types'

// ================================================================
// 4. 유틸리티 타입들
// ================================================================
export type {
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  DeepNullable,
  DeepNonNullable,
  PartialBy,
  RequiredBy,
  ReadonlyBy,
  WritableBy,
  NullableBy,
  NonNullableBy,
  KeysOfType,
  PickByType,
  OmitByType,
  PickFunctions,
  OmitFunctions,
  Head,
  Tail,
  Length,
  Args,
  Return,
  IsEqual,
  IsNever,
  IsUnknown,
  IsAny,
  KebabToCamel,
  CamelToKebab,
  WithTenant,
  WithTimestamps,
  ApiResponse,
  PaginatedResponse
} from './utility.types'

// ================================================================
// 5. 애플리케이션 레벨 타입들
// ================================================================
export type SearchParams = Record<string, string | string[] | undefined>
export type SortDirection = 'asc' | 'desc'
export type FilterValue = string | number | boolean | null
export type PaginationParams = {
  page: number
  limit: number
  offset: number
}