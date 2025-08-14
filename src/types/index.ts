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
// export type Course = Database['public']['Tables']['courses']['Row'] // 테이블 없음
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
// 2.5 유틸리티 타입 및 타입 가드 (v1.0 - Any 타입 제거용)
// ================================================================
export type {
  // 관계형 데이터 타입
  AttendanceWithRelations,
  StudentWithRelations,
  ClassWithRelations,
  
  // 테스트 결과 타입
  TestResult,
  RLSTestResult,
  PermissionTestResult,
  
  // 업데이트 데이터 타입
  TenantRoleUpdate,
  UserProfileUpdate as UserProfileUpdateUtil,
  PermissionMetadata,
  
  // API 응답 타입
  APIResponse,
  PaginatedResponse,
  
  // 개발 도구 인터페이스
  RBACDebugInterface,
  TenantRolesDebugInterface,
  ResourceAccessDebugInterface,
  
  // 타입 유틸리티
  WithRequired,
  WithOptional,
  DeepPartial,
  SafeRecord,
  TableName,
  TableRow,
  TableInsert,
  TableUpdate
} from './utilityTypes'

export {
  // 기본 타입 가드
  isObject,
  isString,
  isNumber,
  isBoolean,
  isArray,
  
  // 사용자 및 프로필 타입 가드
  isUserProfile,
  isUserRole,
  isUserProfileUpdate,
  
  // 권한 및 메타데이터 타입 가드
  isPermissionMetadata,
  isTenantRoleUpdate,
  
  // 관계형 데이터 타입 가드
  isAttendanceWithRelations,
  isStudentWithRelations,
  isClassWithRelations,
  
  // 테스트 결과 타입 가드
  isTestResult,
  isRLSTestResult,
  isPermissionTestResult,
  
  // API 응답 타입 가드
  isAPIResponse,
  isPaginatedResponse,
  
  // 유틸리티 타입 가드
  isSafeRecord,
  isNonEmptyObject,
  hasKey,
  hasKeys,
  isArrayOf,
  
  // 특수 목적 타입 가드
  isTableName,
  isUUID,
  isEmail,
  isISODateString,
  
  // 조건부 타입 가드
  isSuccessfulTestResult,
  isFailedTestResult,
  isAPIResponseWithData,
  isAPIResponseWithError
} from './typeGuards'

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

// ================================================================
// 6. 비즈니스 도메인 타입들 (추가)
// ================================================================
export type Class = Database['public']['Tables']['classes']['Row']
export type ClassInsert = Database['public']['Tables']['classes']['Insert']
export type ClassUpdate = Database['public']['Tables']['classes']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Attendance = Database['public']['Tables']['attendances']['Row']
export type AttendanceInsert = Database['public']['Tables']['attendances']['Insert']
export type AttendanceUpdate = Database['public']['Tables']['attendances']['Update']

// export type Classroom = Database['public']['Tables']['classrooms']['Row'] // 테이블 없음
// export type Schedule = Database['public']['Tables']['schedules']['Row'] // 테이블 없음
export type Video = Database['public']['Tables']['videos']['Row']
export type VideoWatchSession = Database['public']['Tables']['video_watch_sessions']['Row']
// export type Exam = Database['public']['Tables']['exams']['Row'] // 테이블 없음
// export type ExamResult = Database['public']['Tables']['exam_results']['Row'] // 테이블 없음
// export type Document = Database['public']['Tables']['documents']['Row'] // 테이블 없음
export type Consultation = Database['public']['Tables']['consultations']['Row']
export type StudentHistory = Database['public']['Tables']['student_histories']['Row']

// ================================================================
// 7. 타입 가드 함수들 Export
// ================================================================

// Auth 관련 타입 가드
export {
  isValidUserProfile,
  hasTenantId,
  hasRole,
  isActiveUser,
  isEmailVerified,
  isSystemAdmin,
  isTenantAdmin,
  isInstructor as isInstructorRole,
  isStaff,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isValidTenant,
  isActiveTenant,
  isValidJWTPayload,
  isJWTExpired,
  canAccessTenant,
  isSameTenant,
  maskUserProfile,
  getUserDisplayInfo,
  createPermissionResult,
  createSecurityContext,
  DEFAULT_PERMISSIONS,
  ROLE_HIERARCHY,
  SESSION_EXPIRY
} from './auth.types'

// Student 관련 타입 가드
export {
  isValidStudent,
  isClassFlowStudent,
  isActiveStudent,
  isSearchableStudent
} from './student.types'