/**
 * 유틸리티 타입 정의
 * @description Any 타입 제거를 위한 안전한 유틸리티 타입들
 * @version v1.0
 * @since 2025-08-14
 */

import type { Database } from './database'
import type { UserProfile, UserRole } from './auth.types'
import type { Permission } from './permissions.types'

// ================================================================
// 관계형 데이터 타입
// ================================================================

/**
 * 출결 관계 데이터 (class_schedules 포함)
 */
export interface AttendanceWithRelations {
  id: string
  tenant_id: string | null
  student_id: string
  class_schedule_id: string
  status: Database['public']['Enums']['attendance_status']
  checked_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
  class_schedules?: {
    id: string
    class_id: string
    classes?: {
      id: string
      instructor_id: string | null
      name: string
      tenant_id: string | null
    }
  }
}

/**
 * 학생 관계 데이터 (enrollments 포함)
 */
export interface StudentWithRelations {
  id: string
  tenant_id: string | null
  name: string
  student_number: string
  email: string | null
  phone: string | null
  parent_name: string | null
  parent_phone_1: string | null
  parent_phone_2: string | null
  address: string | null
  grade: string | null
  status: Database['public']['Enums']['student_status']
  enrollment_date: string | null
  graduation_date: string | null
  memo: string | null
  display_color: string | null
  created_at: string
  updated_at: string
  enrollments?: Array<{
    id: string
    class_id: string
    enrollment_date: string
    classes?: {
      id: string
      name: string
      instructor_id: string | null
    }
  }>
}

/**
 * 클래스 관계 데이터 (instructor 포함)
 */
export interface ClassWithRelations {
  id: string
  tenant_id: string | null
  name: string
  description: string | null
  grade: string | null
  course: string | null
  subject: string | null
  instructor_id: string | null
  max_students: number
  current_students: number
  classroom: string | null
  color: string | null
  status: Database['public']['Enums']['class_status']
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  instructor?: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

// ================================================================
// 테스트 결과 타입
// ================================================================

/**
 * 일반적인 테스트 결과
 */
export interface TestResult {
  success: boolean
  count?: number
  error?: string
  message?: string
  data?: unknown
}

/**
 * RLS 테스트 결과
 */
export interface RLSTestResult {
  success: boolean
  count: number
  error?: string
  data?: unknown
}

/**
 * 권한 테스트 결과
 */
export interface PermissionTestResult {
  permission: string
  resource: string
  action: string
  granted: boolean
  reason?: string
  userRole: UserRole
  tenantId?: string
}

// ================================================================
// 업데이트 데이터 타입
// ================================================================

/**
 * 테넌트 역할 업데이트 데이터 (매뉴얼 Pattern 1: Database-First 통합)
 */
export interface TenantRoleUpdate {
  display_name?: string
  description?: string
  permissions?: Permission[]
  hierarchy_level?: number
}

/**
 * 사용자 프로필 업데이트 데이터
 */
export interface UserProfileUpdate {
  name?: string
  email?: string
  role?: UserRole
  status?: Database['public']['Enums']['user_status']
  tenant_id?: string | null
  metadata?: Record<string, unknown>
  updated_at?: string
}

/**
 * 권한 컨텍스트 메타데이터
 */
export interface PermissionMetadata {
  userId?: string
  tenantId?: string | null
  resourceId?: string
  resourceOwnerId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  requestPath?: string
  timestamp?: string
  [key: string]: unknown
}

// ================================================================
// API 응답 타입
// ================================================================

/**
 * 표준 API 응답
 */
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    timestamp: string
  }
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ================================================================
// 개발 도구 인터페이스
// ================================================================

/**
 * RBAC 디버그 인터페이스
 */
export interface RBACDebugInterface {
  hasPermission: (
    profile: UserProfile | null | undefined,
    permission: string | { resource: string; action: string },
    context?: PermissionMetadata
  ) => boolean
  hasAnyPermission: (
    profile: UserProfile | null | undefined,
    permissions: (string | { resource: string; action: string })[],
    context?: PermissionMetadata
  ) => boolean
  hasAllPermissions: (
    profile: UserProfile | null | undefined,
    permissions: (string | { resource: string; action: string })[],
    context?: PermissionMetadata
  ) => boolean
  canPerformAction: (
    profile: UserProfile | null | undefined,
    resource: string,
    action: string,
    context?: PermissionMetadata
  ) => boolean
  checkPermissionDetails: (
    profile: UserProfile | null | undefined,
    permission: string | { resource: string; action: string },
    context?: PermissionMetadata
  ) => unknown
  getUserPermissions: (profile: UserProfile | null | undefined) => unknown[]
  getUserPermissionStrings: (profile: UserProfile | null | undefined) => string[]
  invalidateCache: (userId?: string) => void
  getCacheStats: () => { size: number; maxSize: number; ttl: number }
  ROLE_PERMISSIONS: Record<string, unknown[]>
  ROLE_PERMISSION_STRINGS: Record<string, string[]>
}

/**
 * 테넌트 역할 디버그 인터페이스
 */
export interface TenantRolesDebugInterface {
  manager: {
    getTenantRole: (tenantId: string, roleId: string) => Promise<unknown>
    getUserTenantMembership: (userId: string, tenantId: string) => Promise<unknown>
    getUserTenantPermissions: (userId: string, tenantId: string, baseRole?: UserRole) => Promise<unknown[]>
    invalidateCache: (userId?: string, tenantId?: string) => void
  }
  hasTenantPermission: (
    profile: UserProfile,
    tenantId: string,
    permission: { resource: string; action: string } | string
  ) => Promise<boolean>
  getUserTenantRole: (userId: string, tenantId: string) => Promise<unknown>
  checkTenantMembershipStatus: (userId: string, tenantId: string) => Promise<{
    isMember: boolean
    status?: string | null
    role?: unknown
    acceptedAt?: string | null
  }>
  createTenantRole: (tenantId: string, roleData: {
    name: string
    display_name: string
    description?: string
    base_role?: UserRole
    permissions?: unknown[]
    hierarchy_level?: number
  }) => Promise<unknown>
  updateTenantRole: (
    tenantId: string,
    roleId: string,
    updates: Partial<{
      display_name: string
      description: string
      permissions: unknown[]
      hierarchy_level: number
    }>
  ) => Promise<boolean>
  assignTenantRole: (userId: string, tenantId: string, roleId: string) => Promise<boolean>
}

/**
 * 리소스 접근 디버그 인터페이스
 */
export interface ResourceAccessDebugInterface {
  checkResourceAccess: (
    profile: UserProfile,
    resource: string,
    action: string,
    resourceId?: string
  ) => Promise<{ granted: boolean; reason?: string }>
  checkBulkResourceAccess: (
    profile: UserProfile,
    resources: Array<{
      resource: string
      action: string
      resourceId?: string
    }>
  ) => Promise<Map<string, { granted: boolean; reason?: string }>>
  filterAccessibleResources: <T extends { id: string }>(
    profile: UserProfile,
    resource: string,
    action: string,
    items: T[]
  ) => Promise<T[]>
  canCreateResource: (
    profile: UserProfile,
    resource: string,
    tenantId?: string
  ) => Promise<boolean>
  isInstructorStudent: (instructorId: string, studentId: string) => Promise<boolean>
  isInstructorClass: (instructorId: string, classId: string) => Promise<boolean>
  isResourceOwner: (userId: string, resource: string, resourceId: string) => Promise<boolean>
  checkStudentOwnership: (userId: string, studentId: string, userRole?: UserRole) => Promise<unknown>
  checkClassOwnership: (userId: string, classId: string, userRole?: UserRole) => Promise<unknown>
  checkPaymentOwnership: (userId: string, paymentId: string, userRole?: UserRole) => Promise<unknown>
  checkAttendanceOwnership: (userId: string, attendanceId: string, userRole?: UserRole) => Promise<unknown>
  cache: {
    getCacheKey: (userId: string, resource: string, action: string, resourceId?: string) => string
    get: (userId: string, resource: string, action: string, resourceId?: string) => boolean | null
    set: (userId: string, resource: string, action: string, result: boolean, resourceId?: string) => void
    invalidate: (userId?: string) => void
  }
}

// ================================================================
// Window 인터페이스 확장
// ================================================================

declare global {
  interface Window {
    __RBAC__?: RBACDebugInterface
    __TENANT_ROLES__?: TenantRolesDebugInterface
    __RESOURCE_ACCESS__?: ResourceAccessDebugInterface
  }
}

// ================================================================
// 타입 유틸리티
// ================================================================

/**
 * 옵셔널 필드를 가진 타입에서 특정 필드를 필수로 만들기
 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * 특정 필드들만 옵셔널로 만들기
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 깊은 Partial 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 안전한 Record 타입 (unknown 값)
 */
export type SafeRecord<K extends string | number | symbol = string> = Record<K, unknown>

/**
 * 테이블 이름 타입
 */
export type TableName = keyof Database['public']['Tables']

/**
 * 테이블 Row 타입 추출
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']

/**
 * 테이블 Insert 타입 추출
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

/**
 * 테이블 Update 타입 추출
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

// ================================================================
// 내보내기
// ================================================================

export type {
  // 기본 내보내기들은 이미 위에서 export interface로 정의됨
}