// EduCanvas v5.0 통합 타입 Export 시스템
// 모든 타입을 중앙에서 관리하고 일관되게 export
// @version v5.0 Staff Management Integration
// @since 2025-08-25

// ================================================================
// 1. 핵심 데이터베이스 타입들 (최우선)
// ================================================================
import type { Database, Json } from './database.types'
export type { Database, Json } from './database.types'

// ================================================================
// 2. 도메인별 핵심 타입들
// ================================================================
// 에러 처리 타입 시스템 (v1.0 - 표준화된 에러 처리)
export type {
  ErrorSeverity,
  ErrorCategory,
  AppError,
  ApiError,
  ValidationError,
  BusinessError,
  StudentNotFoundError,
  StudentValidationError,
  DuplicateStudentNumberError,
  NetworkError,
  AuthenticationError,
  AuthorizationError
} from './error.types'

export {
  AppErrorBase,
  createStudentError,
  createApiError,
  isAppError,
  isValidationError,
  isNetworkError,
  isAuthError,
  getErrorMessage,
  getErrorSeverity,
  shouldRetryError,
  logError
} from './error.types'
// Database table types - Student 타입은 student.types.ts에서 가져옴
// 다른 기본 타입들은 여기서 정의
export type {
  Student,
  StudentInsert,
  StudentUpdate,
  ClassFlowStudent
} from './student.types'

// UserProfile 타입은 auth.types.ts에서 확장된 버전 사용
// 기본 DB 타입은 BaseUserProfile로 참조 가능
export type BaseUserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

// Tenant 타입은 auth.types.ts에서 참조
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']

// ✅ v5.0: Staff Management Integration - tenant_memberships based
export type TenantMembership = Database['public']['Tables']['tenant_memberships']['Row']
export type TenantMembershipInsert = Database['public']['Tables']['tenant_memberships']['Insert']
export type TenantMembershipUpdate = Database['public']['Tables']['tenant_memberships']['Update']

// Staff types (unified instructor/staff management)
export type {
  StaffInfo
} from './staff.types'

// Legacy instructor table (will be deprecated)
export type Instructor = Database['public']['Tables']['instructors']['Row']
// export type Course = Database['public']['Tables']['courses']['Row'] // 테이블 없음
export type CoursePackage = Database['public']['Tables']['course_packages']['Row']
export type StudentEnrollment = Database['public']['Tables']['student_enrollments']['Row']

// Enum types from different modules
export type { StudentStatus } from './student.types'
export type { UserRole } from './auth.types'
export type {
  BillingType,
  PaymentStatus,
  PaymentMethod,
  AttendanceStatus
} from './database'

// Utility types
export type UserStatus = Database['public']['Enums']['user_status']
export type CreateEnrollmentRequest = StudentEnrollment // Simplified for now
// ClassFlowStudent는 student.types.ts에서 import됨

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
  
  // 개발 도구 인터페이스
  RBACDebugInterface,
  TenantRolesDebugInterface,
  ResourceAccessDebugInterface,
  
  // 타입 유틸리티
  WithRequired,
  WithOptional,
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
// 4. 유틸리티 타입들 (utilityTypes.ts에서 실용적인 타입들만 가져옴)
// ================================================================
export type {
  DeepPartial,
  PaginatedResponse
} from './utilityTypes'

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
// 6.5 API 관련 타입들 (Phase 4 - API Routes 타입 안정성)
// ================================================================
export type {
  // API 응답 타입
  ApiResponse,
  PaginatedApiResponse,
  
  // 인증 관련 API
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ResetPasswordRequest,
  CheckEmailRequest,
  CheckEmailResponse,
  SearchTenantsRequest,
  SearchTenantsResponse,
  OnboardingRequest,
  
  // 테넌트 관리 API
  ApproveMemberRequest,
  UpdateMemberRequest,
  CreateTenantRequest,
  CreateTenantResponse,
  ToggleTenantStatusRequest,
  ToggleTenantStatusResponse,
  
  // 학생 관리 API
  GetStudentsRequest,
  GetStudentsResponse,
  CreateStudentRequest,
  CreateStudentResponse,
  BulkUpdateStudentsRequest,
  BulkUpdateStudentsResponse,
  
  // 클래스 관리 API
  GetClassesRequest,
  GetClassesResponse,
  CreateClassRequest,
  CreateClassResponse,
  MoveStudentRequest,
  MoveStudentResponse
} from './api.types'

export {
  // API 타입 가드
  isLoginRequest,
  isSignupRequest,
  isApproveMemberRequest,
  isUpdateMemberRequest,
  isCheckEmailRequest,
  isSearchTenantsRequest,
  isCreateTenantRequest,
  
  // API 유틸리티 함수
  createErrorResponse,
  createSuccessResponse
} from './api.types'

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
  SESSION_EXPIRY,
// 확장된 UserProfile과 Tenant은 auth.types에서 import
} from './auth.types'

// Auth 관련 핵심 타입들 별도 export (UserRole은 이미 위에서 export됨)
export type { UserProfile, Tenant } from './auth.types'

// Student 관련 타입 가드
export {
  isValidStudent,
  isClassFlowStudent,
  isActiveStudent,
  isSearchableStudent
} from './student.types'

// ================================================================
// 8. Navigation System Types (v5.0 - 제로베이스 리디렉션 시스템)
// ================================================================
export type {
  NavigationContext,
  UserNavigationState,
  RouteConfig,
  RedirectionResult,
  RouteMatchResult,
  NavigationEvent,
  NavigationHistoryEntry,
  NavigationConfig,
  NavigationCacheEntry,
  NavigationErrorCode,
  NavigationMiddlewareOptions
} from './navigation.types'

export {
  isValidNavigationState,
  isValidNavigationContext,
  createNavigationContext,
  createNoRedirectResult,
  createRedirectResult
} from './navigation.types'