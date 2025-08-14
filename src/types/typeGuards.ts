/**
 * 타입 가드 함수들
 * @description Any 타입 제거를 위한 런타임 타입 검증 함수들
 * @version v1.0
 * @since 2025-08-14
 */

import type { Database } from './database'
import type { UserProfile, UserRole } from './auth.types'
import type {
  AttendanceWithRelations,
  StudentWithRelations,
  ClassWithRelations,
  TestResult,
  RLSTestResult,
  PermissionTestResult,
  TenantRoleUpdate,
  UserProfileUpdate,
  PermissionMetadata,
  APIResponse,
  PaginatedResponse,
  SafeRecord
} from './utilityTypes'

// ================================================================
// 기본 타입 가드
// ================================================================

/**
 * 객체인지 확인
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 문자열인지 확인
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * 숫자인지 확인
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 불린인지 확인
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * 배열인지 확인
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// ================================================================
// 사용자 및 프로필 타입 가드
// ================================================================

/**
 * UserProfile 타입 가드
 */
export function isUserProfile(value: unknown): value is UserProfile {
  if (!isObject(value)) return false
  
  return (
    isString(value.id) &&
    isString(value.email) &&
    isString(value.name) &&
    isUserRole(value.role) &&
    (value.tenant_id === null || isString(value.tenant_id)) &&
    isString(value.status)
  )
}

/**
 * UserRole 타입 가드
 */
export function isUserRole(value: unknown): value is UserRole {
  return (
    value === 'system_admin' ||
    value === 'tenant_admin' ||
    value === 'admin' ||
    value === 'instructor' ||
    value === 'staff' ||
    value === 'viewer'
  )
}

/**
 * UserProfileUpdate 타입 가드
 */
export function isUserProfileUpdate(value: unknown): value is UserProfileUpdate {
  if (!isObject(value)) return false
  
  // 모든 필드가 옵셔널이므로 존재하는 필드들만 검증
  const update = value as Partial<UserProfileUpdate>
  
  if (update.name !== undefined && !isString(update.name)) return false
  if (update.email !== undefined && !isString(update.email)) return false
  if (update.role !== undefined && !isUserRole(update.role)) return false
  if (update.tenant_id !== undefined && update.tenant_id !== null && !isString(update.tenant_id)) return false
  if (update.status !== undefined && !isString(update.status)) return false
  if (update.metadata !== undefined && !isObject(update.metadata)) return false
  if (update.updated_at !== undefined && !isString(update.updated_at)) return false
  
  return true
}

// ================================================================
// 권한 및 메타데이터 타입 가드
// ================================================================

/**
 * PermissionMetadata 타입 가드
 */
export function isPermissionMetadata(value: unknown): value is PermissionMetadata {
  if (!isObject(value)) return false
  
  const metadata = value as Partial<PermissionMetadata>
  
  if (metadata.userId !== undefined && !isString(metadata.userId)) return false
  if (metadata.tenantId !== undefined && metadata.tenantId !== null && !isString(metadata.tenantId)) return false
  if (metadata.resourceId !== undefined && !isString(metadata.resourceId)) return false
  if (metadata.resourceOwnerId !== undefined && !isString(metadata.resourceOwnerId)) return false
  if (metadata.sessionId !== undefined && !isString(metadata.sessionId)) return false
  if (metadata.ipAddress !== undefined && !isString(metadata.ipAddress)) return false
  if (metadata.userAgent !== undefined && !isString(metadata.userAgent)) return false
  if (metadata.requestPath !== undefined && !isString(metadata.requestPath)) return false
  if (metadata.timestamp !== undefined && !isString(metadata.timestamp)) return false
  
  return true
}

/**
 * TenantRoleUpdate 타입 가드
 */
export function isTenantRoleUpdate(value: unknown): value is TenantRoleUpdate {
  if (!isObject(value)) return false
  
  const update = value as Partial<TenantRoleUpdate>
  
  if (update.display_name !== undefined && !isString(update.display_name)) return false
  if (update.description !== undefined && !isString(update.description)) return false
  if (update.permissions !== undefined && !isArray(update.permissions)) return false
  if (update.hierarchy_level !== undefined && !isNumber(update.hierarchy_level)) return false
  
  return true
}

// ================================================================
// 관계형 데이터 타입 가드
// ================================================================

/**
 * AttendanceWithRelations 타입 가드
 */
export function isAttendanceWithRelations(value: unknown): value is AttendanceWithRelations {
  if (!isObject(value)) return false
  
  const attendance = value as Partial<AttendanceWithRelations>
  
  // 필수 필드 검증
  if (!isString(attendance.id)) return false
  if (!isString(attendance.student_id)) return false
  if (!isString(attendance.class_schedule_id)) return false
  if (!isString(attendance.status)) return false
  if (!isString(attendance.created_at)) return false
  if (!isString(attendance.updated_at)) return false
  
  // 옵셔널 필드 검증
  if (attendance.tenant_id !== null && attendance.tenant_id !== undefined && !isString(attendance.tenant_id)) return false
  if (attendance.checked_at !== null && attendance.checked_at !== undefined && !isString(attendance.checked_at)) return false
  if (attendance.memo !== null && attendance.memo !== undefined && !isString(attendance.memo)) return false
  
  // 관계 필드 검증
  if (attendance.class_schedules !== undefined) {
    if (!isObject(attendance.class_schedules)) return false
    const schedule = attendance.class_schedules
    if (!isString(schedule.id) || !isString(schedule.class_id)) return false
    
    if (schedule.classes !== undefined) {
      if (!isObject(schedule.classes)) return false
      const classData = schedule.classes
      if (!isString(classData.id) || !isString(classData.name)) return false
      if (classData.instructor_id !== null && !isString(classData.instructor_id)) return false
      if (classData.tenant_id !== null && !isString(classData.tenant_id)) return false
    }
  }
  
  return true
}

/**
 * StudentWithRelations 타입 가드
 */
export function isStudentWithRelations(value: unknown): value is StudentWithRelations {
  if (!isObject(value)) return false
  
  const student = value as Partial<StudentWithRelations>
  
  // 필수 필드 검증
  if (!isString(student.id)) return false
  if (!isString(student.name)) return false
  if (!isString(student.student_number)) return false
  if (!isString(student.status)) return false
  if (!isString(student.created_at)) return false
  if (!isString(student.updated_at)) return false
  
  // 옵셔널 관계 필드 검증
  if (student.enrollments !== undefined) {
    if (!isArray(student.enrollments)) return false
    return student.enrollments.every(enrollment => 
      isObject(enrollment) &&
      isString(enrollment.id) &&
      isString(enrollment.class_id) &&
      isString(enrollment.enrollment_date)
    )
  }
  
  return true
}

/**
 * ClassWithRelations 타입 가드
 */
export function isClassWithRelations(value: unknown): value is ClassWithRelations {
  if (!isObject(value)) return false
  
  const classData = value as Partial<ClassWithRelations>
  
  // 필수 필드 검증
  if (!isString(classData.id)) return false
  if (!isString(classData.name)) return false
  if (!isNumber(classData.max_students)) return false
  if (!isNumber(classData.current_students)) return false
  if (!isString(classData.status)) return false
  if (!isString(classData.created_at)) return false
  if (!isString(classData.updated_at)) return false
  
  // 옵셔널 관계 필드 검증
  if (classData.instructor !== undefined) {
    if (!isObject(classData.instructor)) return false
    const instructor = classData.instructor
    if (!isString(instructor.id) || !isString(instructor.name) || !isString(instructor.email)) return false
    if (!isUserRole(instructor.role)) return false
  }
  
  return true
}

// ================================================================
// 테스트 결과 타입 가드
// ================================================================

/**
 * TestResult 타입 가드
 */
export function isTestResult(value: unknown): value is TestResult {
  if (!isObject(value)) return false
  
  const result = value as Partial<TestResult>
  
  if (!isBoolean(result.success)) return false
  if (result.count !== undefined && !isNumber(result.count)) return false
  if (result.error !== undefined && !isString(result.error)) return false
  if (result.message !== undefined && !isString(result.message)) return false
  
  return true
}

/**
 * RLSTestResult 타입 가드
 */
export function isRLSTestResult(value: unknown): value is RLSTestResult {
  if (!isObject(value)) return false
  
  const result = value as Partial<RLSTestResult>
  
  if (!isBoolean(result.success)) return false
  if (!isNumber(result.count)) return false
  if (result.error !== undefined && !isString(result.error)) return false
  
  return true
}

/**
 * PermissionTestResult 타입 가드
 */
export function isPermissionTestResult(value: unknown): value is PermissionTestResult {
  if (!isObject(value)) return false
  
  const result = value as Partial<PermissionTestResult>
  
  if (!isString(result.permission)) return false
  if (!isString(result.resource)) return false
  if (!isString(result.action)) return false
  if (!isBoolean(result.granted)) return false
  if (!isUserRole(result.userRole)) return false
  if (result.reason !== undefined && !isString(result.reason)) return false
  if (result.tenantId !== undefined && !isString(result.tenantId)) return false
  
  return true
}

// ================================================================
// API 응답 타입 가드
// ================================================================

/**
 * APIResponse 타입 가드
 */
export function isAPIResponse<T>(value: unknown, dataGuard?: (data: unknown) => data is T): value is APIResponse<T> {
  if (!isObject(value)) return false
  
  const response = value as Partial<APIResponse<T>>
  
  if (!isBoolean(response.success)) return false
  if (response.error !== undefined && !isString(response.error)) return false
  if (response.message !== undefined && !isString(response.message)) return false
  
  // 데이터 타입 검증 (dataGuard가 제공된 경우)
  if (response.data !== undefined && dataGuard && !dataGuard(response.data)) {
    return false
  }
  
  // 메타데이터 검증
  if (response.meta !== undefined) {
    if (!isObject(response.meta)) return false
    const meta = response.meta
    if (meta.total !== undefined && !isNumber(meta.total)) return false
    if (meta.page !== undefined && !isNumber(meta.page)) return false
    if (meta.limit !== undefined && !isNumber(meta.limit)) return false
    if (!isString(meta.timestamp)) return false
  }
  
  return true
}

/**
 * PaginatedResponse 타입 가드
 */
export function isPaginatedResponse<T>(value: unknown, itemGuard: (item: unknown) => item is T): value is PaginatedResponse<T> {
  if (!isObject(value)) return false
  
  const response = value as Partial<PaginatedResponse<T>>
  
  if (!isArray(response.data)) return false
  if (!response.data.every(itemGuard)) return false
  
  if (!isObject(response.pagination)) return false
  const pagination = response.pagination
  
  return (
    isNumber(pagination.page) &&
    isNumber(pagination.limit) &&
    isNumber(pagination.total) &&
    isNumber(pagination.totalPages) &&
    isBoolean(pagination.hasNext) &&
    isBoolean(pagination.hasPrev)
  )
}

// ================================================================
// 유틸리티 타입 가드
// ================================================================

/**
 * 안전한 Record 타입인지 확인
 */
export function isSafeRecord(value: unknown): value is SafeRecord {
  return isObject(value)
}

/**
 * 빈 객체가 아닌지 확인
 */
export function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && Object.keys(value).length > 0
}

/**
 * 특정 키를 가진 객체인지 확인
 */
export function hasKey<K extends string>(
  value: unknown, 
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value
}

/**
 * 여러 키를 모두 가진 객체인지 확인
 */
export function hasKeys<K extends string>(
  value: unknown, 
  keys: K[]
): value is Record<K, unknown> {
  return isObject(value) && keys.every(key => key in value)
}

/**
 * 특정 값의 배열인지 확인
 */
export function isArrayOf<T>(
  value: unknown, 
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return isArray(value) && value.every(itemGuard)
}

// ================================================================
// 특수 목적 타입 가드
// ================================================================

/**
 * 테이블명인지 확인
 */
export function isTableName(value: unknown): value is keyof Database['public']['Tables'] {
  if (!isString(value)) return false
  
  const tableNames = [
    'attendances', 'audit_logs', 'backup_executions', 'backup_policies',
    'classes', 'consultations', 'course_packages', 'instructors',
    'payments', 'permissions', 'playlist_video_items', 'resource_scopes',
    'role_permissions', 'salary_policies', 'student_enrollments', 
    'student_histories', 'student_video_access', 'students', 
    'tenant_memberships', 'tenant_roles', 'tenant_users', 'tenants', 
    'user_profiles', 'video_lectures', 'video_playlists', 'video_ratings',
    'video_watch_sessions', 'videos'
  ] as const
  
  return tableNames.includes(value as keyof Database['public']['Tables'])
}

/**
 * UUID 형식인지 확인
 */
export function isUUID(value: unknown): value is string {
  if (!isString(value)) return false
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * 이메일 형식인지 확인
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * 날짜 문자열인지 확인 (ISO 8601)
 */
export function isISODateString(value: unknown): value is string {
  if (!isString(value)) return false
  
  const date = new Date(value)
  return !isNaN(date.getTime()) && date.toISOString() === value
}

// ================================================================
// 조건부 타입 가드
// ================================================================

/**
 * 성공한 테스트 결과인지 확인
 */
export function isSuccessfulTestResult(value: TestResult): value is TestResult & { success: true } {
  return value.success === true
}

/**
 * 실패한 테스트 결과인지 확인
 */
export function isFailedTestResult(value: TestResult): value is TestResult & { success: false; error: string } {
  return value.success === false
}

/**
 * 데이터가 있는 API 응답인지 확인
 */
export function isAPIResponseWithData<T>(
  value: APIResponse<T>
): value is APIResponse<T> & { data: T } {
  return value.data !== undefined
}

/**
 * 에러가 있는 API 응답인지 확인
 */
export function isAPIResponseWithError<T>(
  value: APIResponse<T>
): value is APIResponse<T> & { error: string } {
  return value.error !== undefined
}