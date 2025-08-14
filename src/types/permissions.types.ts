/**
 * EduCanvas 권한 체계 타입 정의
 * @description RBAC(Role-Based Access Control) 시스템을 위한 상세 권한 타입
 * @version v4.1 스키마 기반
 * @since 2025-08-14
 */

import type { UserRole } from './auth.types'

// ================================================================
// 1. 권한 관련 기본 타입
// ================================================================

/**
 * 리소스 타입
 * 권한이 적용되는 시스템 리소스들
 */
export type Resource = 
  | 'system'     // 시스템 전체 설정
  | 'tenant'     // 테넌트 관리
  | 'user'       // 사용자 관리
  | 'student'    // 학생 관리
  | 'class'      // 클래스 관리
  | 'instructor' // 강사 관리
  | 'payment'    // 결제 관리
  | 'attendance' // 출결 관리
  | 'grade'      // 성적 관리
  | 'analytics'  // 분석 및 통계
  | 'document'   // 문서 관리
  | 'schedule'   // 일정 관리
  | 'audit'      // 감사 로그

/**
 * 액션 타입
 * 리소스에 대해 수행할 수 있는 작업들
 */
export type Action = 
  | 'create'     // 생성
  | 'read'       // 조회
  | 'update'     // 수정
  | 'delete'     // 삭제
  | 'list'       // 목록 조회
  | 'export'     // 내보내기
  | 'import'     // 가져오기
  | 'approve'    // 승인
  | 'reject'     // 거부
  | 'manage'     // 전체 관리
  | '*'          // 모든 권한

/**
 * 권한 정의
 */
export interface Permission {
  resource: Resource
  action: Action
  scope?: 'own' | 'tenant' | 'system' // 권한 범위
  conditions?: PermissionCondition[]   // 추가 조건
}

/**
 * 권한 조건
 * 동적 권한 체크를 위한 조건들
 */
export interface PermissionCondition {
  type: 'ownership' | 'time' | 'status' | 'custom'
  field?: string
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin'
  value?: unknown
  evaluate?: (context: PermissionContext) => boolean
}

/**
 * 권한 컨텍스트
 * 권한 체크 시 제공되는 컨텍스트 정보
 */
export interface PermissionContext {
  userId: string
  tenantId?: string
  resourceId?: string
  resourceOwnerId?: string
  metadata?: Record<string, unknown>
}

// ================================================================
// 2. 역할별 권한 매핑
// ================================================================

/**
 * 역할별 기본 권한 정의
 * 각 역할이 가지는 기본 권한 세트
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  system_admin: [
    { resource: 'system', action: '*', scope: 'system' },
    { resource: 'tenant', action: '*', scope: 'system' },
    { resource: 'user', action: '*', scope: 'system' },
    { resource: 'student', action: '*', scope: 'system' },
    { resource: 'class', action: '*', scope: 'system' },
    { resource: 'instructor', action: '*', scope: 'system' },
    { resource: 'payment', action: '*', scope: 'system' },
    { resource: 'attendance', action: '*', scope: 'system' },
    { resource: 'grade', action: '*', scope: 'system' },
    { resource: 'analytics', action: '*', scope: 'system' },
    { resource: 'document', action: '*', scope: 'system' },
    { resource: 'schedule', action: '*', scope: 'system' },
    { resource: 'audit', action: '*', scope: 'system' },
  ],
  
  admin: [
    { resource: 'tenant', action: 'read', scope: 'tenant' },
    { resource: 'tenant', action: 'update', scope: 'tenant' },
    { resource: 'user', action: '*', scope: 'tenant' },
    { resource: 'student', action: '*', scope: 'tenant' },
    { resource: 'class', action: '*', scope: 'tenant' },
    { resource: 'instructor', action: '*', scope: 'tenant' },
    { resource: 'payment', action: '*', scope: 'tenant' },
    { resource: 'attendance', action: '*', scope: 'tenant' },
    { resource: 'grade', action: '*', scope: 'tenant' },
    { resource: 'analytics', action: 'read', scope: 'tenant' },
    { resource: 'analytics', action: 'export', scope: 'tenant' },
    { resource: 'document', action: '*', scope: 'tenant' },
    { resource: 'schedule', action: '*', scope: 'tenant' },
    { resource: 'audit', action: 'read', scope: 'tenant' },
  ],
  
  instructor: [
    { resource: 'student', action: 'read', scope: 'own' },
    { resource: 'student', action: 'update', scope: 'own' },
    { resource: 'class', action: 'read', scope: 'own' },
    { resource: 'class', action: 'update', scope: 'own' },
    { resource: 'attendance', action: 'create', scope: 'own' },
    { resource: 'attendance', action: 'read', scope: 'own' },
    { resource: 'attendance', action: 'update', scope: 'own' },
    { resource: 'grade', action: 'create', scope: 'own' },
    { resource: 'grade', action: 'read', scope: 'own' },
    { resource: 'grade', action: 'update', scope: 'own' },
    { resource: 'schedule', action: 'read', scope: 'own' },
    { resource: 'document', action: 'read', scope: 'own' },
    { resource: 'document', action: 'create', scope: 'own' },
  ],
  
  staff: [
    { resource: 'student', action: 'create', scope: 'tenant' },
    { resource: 'student', action: 'read', scope: 'tenant' },
    { resource: 'student', action: 'update', scope: 'tenant' },
    { resource: 'student', action: 'list', scope: 'tenant' },
    { resource: 'class', action: 'create', scope: 'tenant' },
    { resource: 'class', action: 'read', scope: 'tenant' },
    { resource: 'class', action: 'update', scope: 'tenant' },
    { resource: 'class', action: 'list', scope: 'tenant' },
    { resource: 'payment', action: 'read', scope: 'tenant' },
    { resource: 'payment', action: 'create', scope: 'tenant' },
    { resource: 'attendance', action: 'read', scope: 'tenant' },
    { resource: 'schedule', action: 'read', scope: 'tenant' },
    { resource: 'document', action: 'read', scope: 'tenant' },
  ],
  
  viewer: [
    { resource: 'student', action: 'read', scope: 'tenant' },
    { resource: 'student', action: 'list', scope: 'tenant' },
    { resource: 'class', action: 'read', scope: 'tenant' },
    { resource: 'class', action: 'list', scope: 'tenant' },
    { resource: 'analytics', action: 'read', scope: 'tenant' },
    { resource: 'schedule', action: 'read', scope: 'tenant' },
  ],
}

// ================================================================
// 3. 권한 문자열 타입
// ================================================================

/**
 * 권한 문자열 형식
 * resource:action 또는 resource:action:scope 형식
 */
export type PermissionString = `${Resource}:${Action}` | `${Resource}:${Action}:${Exclude<Permission['scope'], undefined>}`

/**
 * 역할별 권한 문자열 세트
 */
export const ROLE_PERMISSION_STRINGS: Record<UserRole, PermissionString[]> = {
  system_admin: [
    'system:*',
    'tenant:*',
    'user:*',
    'student:*',
    'class:*',
    'instructor:*',
    'payment:*',
    'attendance:*',
    'grade:*',
    'analytics:*',
    'document:*',
    'schedule:*',
    'audit:*',
  ],
  
  admin: [
    'tenant:read:tenant',
    'tenant:update:tenant',
    'user:*:tenant',
    'student:*:tenant',
    'class:*:tenant',
    'instructor:*:tenant',
    'payment:*:tenant',
    'attendance:*:tenant',
    'grade:*:tenant',
    'analytics:read:tenant',
    'analytics:export:tenant',
    'document:*:tenant',
    'schedule:*:tenant',
    'audit:read:tenant',
  ],
  
  instructor: [
    'student:read:own',
    'student:update:own',
    'class:read:own',
    'class:update:own',
    'attendance:create:own',
    'attendance:read:own',
    'attendance:update:own',
    'grade:create:own',
    'grade:read:own',
    'grade:update:own',
    'schedule:read:own',
    'document:read:own',
    'document:create:own',
  ],
  
  staff: [
    'student:create:tenant',
    'student:read:tenant',
    'student:update:tenant',
    'student:list:tenant',
    'class:create:tenant',
    'class:read:tenant',
    'class:update:tenant',
    'class:list:tenant',
    'payment:read:tenant',
    'payment:create:tenant',
    'attendance:read:tenant',
    'schedule:read:tenant',
    'document:read:tenant',
  ],
  
  viewer: [
    'student:read:tenant',
    'student:list:tenant',
    'class:read:tenant',
    'class:list:tenant',
    'analytics:read:tenant',
    'schedule:read:tenant',
  ],
}

// ================================================================
// 4. 페이지별 권한 매핑
// ================================================================

/**
 * 페이지/라우트별 필요 권한
 */
export const ROUTE_PERMISSIONS: Record<string, {
  roles?: UserRole[]
  permissions?: PermissionString[]
  conditions?: PermissionCondition[]
}> = {
  '/admin': {
    roles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
  },
  '/admin/students': {
    permissions: ['student:read:tenant', 'student:list:tenant'],
  },
  '/admin/students/create': {
    permissions: ['student:create:tenant'],
  },
  '/admin/students/[id]': {
    permissions: ['student:read:tenant'],
  },
  '/admin/students/[id]/edit': {
    permissions: ['student:update:tenant'],
  },
  '/admin/classes': {
    permissions: ['class:read:tenant', 'class:list:tenant'],
  },
  '/admin/classes/create': {
    permissions: ['class:create:tenant'],
  },
  '/admin/instructors': {
    roles: ['system_admin', 'admin'],
    permissions: ['instructor:read:tenant', 'instructor:list:tenant'],
  },
  '/admin/payments': {
    roles: ['system_admin', 'admin', 'staff'],
    permissions: ['payment:read:tenant'],
  },
  '/admin/analytics': {
    permissions: ['analytics:read:tenant'],
  },
  '/admin/settings': {
    roles: ['system_admin', 'admin'],
  },
  '/instructor': {
    roles: ['instructor'],
  },
  '/instructor/classes': {
    roles: ['instructor'],
    permissions: ['class:read:own'],
  },
  '/instructor/students': {
    roles: ['instructor'],
    permissions: ['student:read:own'],
  },
  '/instructor/attendance': {
    roles: ['instructor'],
    permissions: ['attendance:manage:own'],
  },
}

// ================================================================
// 5. 컴포넌트별 권한 매핑
// ================================================================

/**
 * UI 컴포넌트별 필요 권한
 */
export const COMPONENT_PERMISSIONS: Record<string, {
  view?: PermissionString[]
  interact?: PermissionString[]
  manage?: PermissionString[]
}> = {
  StudentCreateButton: {
    view: ['student:create:tenant'],
    interact: ['student:create:tenant'],
  },
  StudentEditButton: {
    view: ['student:update:tenant'],
    interact: ['student:update:tenant'],
  },
  StudentDeleteButton: {
    view: ['student:delete:tenant'],
    interact: ['student:delete:tenant'],
  },
  ClassCreateButton: {
    view: ['class:create:tenant'],
    interact: ['class:create:tenant'],
  },
  PaymentProcessButton: {
    view: ['payment:create:tenant'],
    interact: ['payment:create:tenant'],
  },
  ExportDataButton: {
    view: ['analytics:export:tenant'],
    interact: ['analytics:export:tenant'],
  },
  SystemSettingsPanel: {
    view: ['system:read'],
    interact: ['system:update'],
    manage: ['system:*'],
  },
}

// ================================================================
// 6. 권한 유틸리티 타입
// ================================================================

/**
 * 권한 체크 결과 상세
 */
export interface PermissionCheckDetails {
  granted: boolean
  role: UserRole
  permission?: Permission
  failureReason?: 
    | 'no_permission'
    | 'wrong_scope'
    | 'condition_failed'
    | 'resource_not_found'
    | 'tenant_mismatch'
    | 'ownership_mismatch'
  matchedPermissions?: Permission[]
  requiredPermissions?: Permission[]
}

/**
 * 권한 오버라이드
 * 테넌트별 커스텀 권한 설정
 */
export interface PermissionOverride {
  tenantId: string
  userId?: string
  additions?: Permission[]
  removals?: Permission[]
  conditions?: PermissionCondition[]
  expiresAt?: string
}

/**
 * 권한 그룹
 * 여러 권한을 그룹으로 관리
 */
export interface PermissionGroup {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  roles?: UserRole[]
}

// ================================================================
// 7. 타입 가드 함수
// ================================================================

/**
 * 유효한 Resource인지 확인
 */
export function isValidResource(resource: unknown): resource is Resource {
  const validResources: Resource[] = [
    'system', 'tenant', 'user', 'student', 'class',
    'instructor', 'payment', 'attendance', 'grade',
    'analytics', 'document', 'schedule', 'audit'
  ]
  return typeof resource === 'string' && validResources.includes(resource as Resource)
}

/**
 * 유효한 Action인지 확인
 */
export function isValidAction(action: unknown): action is Action {
  const validActions: Action[] = [
    'create', 'read', 'update', 'delete', 'list',
    'export', 'import', 'approve', 'reject', 'manage', '*'
  ]
  return typeof action === 'string' && validActions.includes(action as Action)
}

/**
 * 유효한 Permission인지 확인
 */
export function isValidPermission(permission: unknown): permission is Permission {
  return (
    typeof permission === 'object' &&
    permission !== null &&
    'resource' in permission &&
    'action' in permission &&
    isValidResource((permission as Permission).resource) &&
    isValidAction((permission as Permission).action)
  )
}

/**
 * 권한 문자열을 Permission 객체로 파싱
 */
export function parsePermissionString(permissionStr: string): Permission | null {
  const parts = permissionStr.split(':')
  if (parts.length < 2 || parts.length > 3) return null
  
  const [resource, action, scope] = parts
  
  if (!isValidResource(resource) || !isValidAction(action)) return null
  
  const permission: Permission = { resource, action }
  
  if (scope && (scope === 'own' || scope === 'tenant' || scope === 'system')) {
    permission.scope = scope
  }
  
  return permission
}

/**
 * Permission 객체를 권한 문자열로 변환
 */
export function toPermissionString(permission: Permission): PermissionString {
  if (permission.scope) {
    return `${permission.resource}:${permission.action}:${permission.scope}` as PermissionString
  }
  return `${permission.resource}:${permission.action}` as PermissionString
}

/**
 * 와일드카드 권한 매칭
 */
export function matchesPermission(
  permission: Permission,
  pattern: Permission
): boolean {
  // 와일드카드 처리
  if (pattern.action === '*') {
    return permission.resource === pattern.resource
  }
  
  // 정확한 매칭
  return (
    permission.resource === pattern.resource &&
    permission.action === pattern.action &&
    (!pattern.scope || permission.scope === pattern.scope)
  )
}

// ================================================================
// 8. 권한 캐시 타입
// ================================================================

/**
 * 권한 캐시 엔트리
 */
export interface PermissionCacheEntry {
  key: string
  result: boolean
  timestamp: number
  ttl: number
}

/**
 * 권한 캐시 설정
 */
export interface PermissionCacheConfig {
  enabled: boolean
  ttl: number // milliseconds
  maxSize: number
  invalidateOn?: string[] // 이벤트 이름
}

// ================================================================
// 9. 권한 감사 타입
// ================================================================

/**
 * 권한 감사 로그
 */
export interface PermissionAuditLog {
  id: string
  timestamp: string
  userId: string
  tenantId?: string
  action: 'grant' | 'deny' | 'check'
  resource: Resource
  operation: Action
  result: boolean
  context?: PermissionContext
  metadata?: Record<string, unknown>
}

// ================================================================
// 10. 권한 관련 에러 타입
// ================================================================

/**
 * 권한 에러 클래스
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'INVALID_PERMISSION' | 'SCOPE_MISMATCH',
    public details?: {
      required?: Permission
      actual?: Permission
      context?: PermissionContext
    }
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 권한 체크 옵션
 */
export interface PermissionCheckOptions {
  strict?: boolean // 엄격한 체크 모드
  cache?: boolean // 캐시 사용 여부
  audit?: boolean // 감사 로그 생성 여부
  throwOnDenied?: boolean // 거부 시 에러 throw
}