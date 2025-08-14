/**
 * RBAC (Role-Based Access Control) 권한 검증 시스템
 * @description 역할 기반 권한 검증 및 관리 유틸리티
 * @version v4.1
 * @since 2025-08-14
 */

import type { 
  UserProfile, 
  UserRole
} from '@/types/auth.types'
import {
  hasTenantId,
  hasRole as hasRoleAuth,
  isSystemAdmin 
} from '@/types/auth.types'
import type {
  Permission,
  PermissionString,
  PermissionContext,
  PermissionCheckDetails,
  PermissionCondition,
  Resource,
  Action,
  PermissionCheckOptions,
  PermissionError as PermissionErrorType
} from '@/types/permissions.types'
import type { RBACDebugInterface } from '@/types/utilityTypes'
import { isPermissionMetadata } from '@/types/typeGuards'
import {
  ROLE_PERMISSIONS,
  ROLE_PERMISSION_STRINGS,
  parsePermissionString,
  toPermissionString,
  matchesPermission,
  PermissionError
} from '@/types/permissions.types'

// ================================================================
// 권한 캐시 관리
// ================================================================

/**
 * 권한 체크 결과 캐시
 * 메모리 캐시를 사용하여 반복적인 권한 체크 성능 향상
 */
class PermissionCache {
  private cache: Map<string, { result: boolean; timestamp: number }>
  private readonly ttl: number // milliseconds
  private readonly maxSize: number

  constructor(ttl = 60000, maxSize = 1000) { // 기본 1분 TTL
    this.cache = new Map()
    this.ttl = ttl
    this.maxSize = maxSize
  }

  /**
   * 캐시 키 생성
   */
  private createKey(
    userId: string,
    permission: string,
    context?: PermissionContext
  ): string {
    const contextKey = context ? JSON.stringify(context) : 'no-context'
    return `${userId}:${permission}:${contextKey}`
  }

  /**
   * 캐시 조회
   */
  get(
    userId: string,
    permission: string,
    context?: PermissionContext
  ): boolean | null {
    const key = this.createKey(userId, permission, context)
    const entry = this.cache.get(key)

    if (!entry) return null

    // TTL 체크
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  /**
   * 캐시 저장
   */
  set(
    userId: string,
    permission: string,
    result: boolean,
    context?: PermissionContext
  ): void {
    // 캐시 크기 제한 체크
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거 (FIFO)
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    const key = this.createKey(userId, permission, context)
    this.cache.set(key, { result, timestamp: Date.now() })
  }

  /**
   * 캐시 무효화
   */
  invalidate(userId?: string): void {
    if (!userId) {
      this.cache.clear()
      return
    }

    // 특정 사용자의 캐시만 무효화
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 캐시 상태 확인
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    }
  }
}

// 전역 권한 캐시 인스턴스
const permissionCache = new PermissionCache()

// ================================================================
// 핵심 권한 검증 함수
// ================================================================

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 * @param userProfile 사용자 프로필
 * @param permission 권한 문자열 또는 Permission 객체
 * @param context 권한 컨텍스트 (옵션)
 * @param options 권한 체크 옵션
 * @returns 권한 보유 여부
 */
export function hasPermission(
  userProfile: UserProfile | null | undefined,
  permission: PermissionString | Permission,
  context?: PermissionContext,
  options?: PermissionCheckOptions
): boolean {
  // 사용자 프로필 없음
  if (!userProfile) return false

  // 시스템 관리자는 모든 권한 보유
  if (isSystemAdmin(userProfile)) return true

  // 역할이 없는 경우
  if (!hasRoleAuth(userProfile)) return false

  const role = userProfile.role as UserRole

  // 캐시 체크
  if (options?.cache !== false) {
    const permissionStr = typeof permission === 'string' 
      ? permission 
      : toPermissionString(permission)
    
    const cached = permissionCache.get(userProfile.id, permissionStr, context)
    if (cached !== null) return cached
  }

  // Permission 객체로 변환
  const permissionObj = typeof permission === 'string'
    ? parsePermissionString(permission)
    : permission

  if (!permissionObj) return false

  // 역할 기반 권한 체크
  const rolePermissions = ROLE_PERMISSIONS[role]
  if (!rolePermissions) return false

  let hasBasePermission = false

  for (const rolePermission of rolePermissions) {
    if (matchesPermission(permissionObj, rolePermission)) {
      // 범위(scope) 체크
      if (rolePermission.scope && context) {
        const scopeCheck = checkPermissionScope(
          rolePermission.scope,
          userProfile,
          context
        )
        if (!scopeCheck) continue
      }

      // 조건(conditions) 체크
      if (rolePermission.conditions) {
        const conditionCheck = checkPermissionConditions(
          rolePermission.conditions,
          context || { userId: userProfile.id, tenantId: userProfile.tenant_id || '' }
        )
        if (!conditionCheck) continue
      }

      hasBasePermission = true
      break
    }
  }

  // 캐시 저장
  if (options?.cache !== false) {
    const permissionStr = typeof permission === 'string' 
      ? permission 
      : toPermissionString(permissionObj)
    permissionCache.set(userProfile.id, permissionStr, hasBasePermission, context)
  }

  // 감사 로그 (옵션)
  if (options?.audit) {
    logPermissionCheck(userProfile, permissionObj, hasBasePermission, context)
  }

  // 거부 시 에러 throw (옵션)
  if (!hasBasePermission && options?.throwOnDenied) {
    throw new PermissionError(
      `Permission denied: ${toPermissionString(permissionObj)}`,
      'PERMISSION_DENIED',
      {
        required: permissionObj,
        context
      }
    )
  }

  return hasBasePermission
}

/**
 * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
 */
export function hasAnyPermission(
  userProfile: UserProfile | null | undefined,
  permissions: (PermissionString | Permission)[],
  context?: PermissionContext,
  options?: PermissionCheckOptions
): boolean {
  if (!userProfile) return false
  
  return permissions.some(permission => 
    hasPermission(userProfile, permission, context, options)
  )
}

/**
 * 사용자가 모든 권한을 가지고 있는지 확인
 */
export function hasAllPermissions(
  userProfile: UserProfile | null | undefined,
  permissions: (PermissionString | Permission)[],
  context?: PermissionContext,
  options?: PermissionCheckOptions
): boolean {
  if (!userProfile) return false
  
  return permissions.every(permission => 
    hasPermission(userProfile, permission, context, options)
  )
}

/**
 * 권한 범위(scope) 체크
 */
function checkPermissionScope(
  scope: 'own' | 'tenant' | 'system',
  userProfile: UserProfile,
  context: PermissionContext
): boolean {
  switch (scope) {
    case 'system':
      // 시스템 범위는 system_admin만 가능
      return isSystemAdmin(userProfile)
    
    case 'tenant':
      // 테넌트 범위는 같은 테넌트 소속이어야 함
      if (!hasTenantId(userProfile)) return false
      return !context.tenantId || userProfile.tenant_id === context.tenantId
    
    case 'own':
      // 소유 범위는 본인 리소스이거나 담당 리소스여야 함
      if (!context.resourceOwnerId) return true
      return userProfile.id === context.resourceOwnerId
    
    default:
      return true
  }
}

/**
 * 권한 조건 체크
 */
function checkPermissionConditions(
  conditions: PermissionCondition[],
  context: PermissionContext
): boolean {
  return conditions.every(condition => {
    // 커스텀 평가 함수가 있는 경우
    if (condition.evaluate) {
      return condition.evaluate(context)
    }

    // 필드 기반 조건 체크
    if (condition.field && condition.operator && condition.value !== undefined) {
      const fieldValue = isPermissionMetadata(context.metadata) 
        ? context.metadata[condition.field]
        : undefined
      
      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value
        case 'neq':
          return fieldValue !== condition.value
        case 'gt':
          return typeof fieldValue === 'number' && typeof condition.value === 'number' &&
                 fieldValue > condition.value
        case 'gte':
          return typeof fieldValue === 'number' && typeof condition.value === 'number' &&
                 fieldValue >= condition.value
        case 'lt':
          return typeof fieldValue === 'number' && typeof condition.value === 'number' &&
                 fieldValue < condition.value
        case 'lte':
          return typeof fieldValue === 'number' && typeof condition.value === 'number' &&
                 fieldValue <= condition.value
        case 'in':
          return Array.isArray(condition.value) && 
                 condition.value.includes(fieldValue)
        case 'nin':
          return Array.isArray(condition.value) && 
                 !condition.value.includes(fieldValue)
        default:
          return false
      }
    }

    return true
  })
}

// ================================================================
// 리소스별 권한 체크
// ================================================================

/**
 * 리소스에 대한 액션 권한 체크
 */
export function canPerformAction(
  userProfile: UserProfile | null | undefined,
  resource: Resource,
  action: Action,
  context?: PermissionContext,
  options?: PermissionCheckOptions
): boolean {
  const permission: Permission = { resource, action }
  return hasPermission(userProfile, permission, context, options)
}

/**
 * 리소스 접근 권한 체크 (읽기 권한)
 */
export function canAccessResource(
  userProfile: UserProfile | null | undefined,
  resource: Resource,
  context?: PermissionContext
): boolean {
  return canPerformAction(userProfile, resource, 'read', context)
}

/**
 * 리소스 생성 권한 체크
 */
export function canCreateResource(
  userProfile: UserProfile | null | undefined,
  resource: Resource,
  context?: PermissionContext
): boolean {
  return canPerformAction(userProfile, resource, 'create', context)
}

/**
 * 리소스 수정 권한 체크
 */
export function canUpdateResource(
  userProfile: UserProfile | null | undefined,
  resource: Resource,
  context?: PermissionContext
): boolean {
  return canPerformAction(userProfile, resource, 'update', context)
}

/**
 * 리소스 삭제 권한 체크
 */
export function canDeleteResource(
  userProfile: UserProfile | null | undefined,
  resource: Resource,
  context?: PermissionContext
): boolean {
  return canPerformAction(userProfile, resource, 'delete', context)
}

// ================================================================
// 상세 권한 체크
// ================================================================

/**
 * 권한 체크 상세 정보 반환
 */
export function checkPermissionDetails(
  userProfile: UserProfile | null | undefined,
  permission: PermissionString | Permission,
  context?: PermissionContext
): PermissionCheckDetails {
  // 사용자 없음
  if (!userProfile) {
    return {
      granted: false,
      role: 'viewer',
      failureReason: 'no_permission'
    }
  }

  // 역할 없음
  if (!hasRoleAuth(userProfile)) {
    return {
      granted: false,
      role: 'viewer',
      failureReason: 'no_permission'
    }
  }

  const role = userProfile.role as UserRole

  // 시스템 관리자
  if (isSystemAdmin(userProfile)) {
    return {
      granted: true,
      role,
      permission: typeof permission === 'string' 
        ? parsePermissionString(permission) || undefined
        : permission
    }
  }

  // Permission 객체로 변환
  const permissionObj = typeof permission === 'string'
    ? parsePermissionString(permission)
    : permission

  if (!permissionObj) {
    return {
      granted: false,
      role,
      failureReason: 'no_permission'
    }
  }

  // 역할 권한 체크
  const rolePermissions = ROLE_PERMISSIONS[role]
  const matchedPermissions: Permission[] = []

  for (const rolePermission of rolePermissions) {
    if (matchesPermission(permissionObj, rolePermission)) {
      // 범위 체크
      if (rolePermission.scope && context) {
        const scopeCheck = checkPermissionScope(
          rolePermission.scope,
          userProfile,
          context
        )
        if (!scopeCheck) {
          return {
            granted: false,
            role,
            permission: permissionObj,
            failureReason: 'wrong_scope',
            requiredPermissions: [rolePermission]
          }
        }
      }

      // 조건 체크
      if (rolePermission.conditions) {
        const conditionCheck = checkPermissionConditions(
          rolePermission.conditions,
          context || { userId: userProfile.id, tenantId: userProfile.tenant_id || '' }
        )
        if (!conditionCheck) {
          return {
            granted: false,
            role,
            permission: permissionObj,
            failureReason: 'condition_failed',
            requiredPermissions: [rolePermission]
          }
        }
      }

      matchedPermissions.push(rolePermission)
    }
  }

  if (matchedPermissions.length > 0) {
    return {
      granted: true,
      role,
      permission: permissionObj,
      matchedPermissions
    }
  }

  return {
    granted: false,
    role,
    permission: permissionObj,
    failureReason: 'no_permission',
    requiredPermissions: [permissionObj]
  }
}

// ================================================================
// 역할 기반 체크
// ================================================================

/**
 * 사용자가 특정 역할을 가지고 있는지 확인
 */
export function hasRole(
  userProfile: UserProfile | null | undefined,
  role: UserRole
): boolean {
  if (!userProfile || !userProfile.role) return false
  return userProfile.role === role
}

/**
 * 사용자가 여러 역할 중 하나를 가지고 있는지 확인
 */
export function hasAnyRole(
  userProfile: UserProfile | null | undefined,
  roles: UserRole[]
): boolean {
  if (!userProfile || !userProfile.role) return false
  return roles.includes(userProfile.role as UserRole)
}

/**
 * 사용자의 역할별 모든 권한 가져오기
 */
export function getUserPermissions(
  userProfile: UserProfile | null | undefined
): Permission[] {
  if (!userProfile || !hasRoleAuth(userProfile)) return []
  
  const role = userProfile.role as UserRole
  return ROLE_PERMISSIONS[role] || []
}

/**
 * 사용자의 권한 문자열 목록 가져오기
 */
export function getUserPermissionStrings(
  userProfile: UserProfile | null | undefined
): PermissionString[] {
  if (!userProfile || !hasRoleAuth(userProfile)) return []
  
  const role = userProfile.role as UserRole
  return ROLE_PERMISSION_STRINGS[role] || []
}

// ================================================================
// 감사 및 로깅
// ================================================================

/**
 * 권한 체크 로그
 */
function logPermissionCheck(
  userProfile: UserProfile,
  permission: Permission,
  result: boolean,
  context?: PermissionContext
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Permission Check:', {
      userId: userProfile.id,
      role: userProfile.role,
      permission: toPermissionString(permission),
      result,
      context
    })
  }
}

// ================================================================
// 캐시 관리 유틸리티
// ================================================================

/**
 * 권한 캐시 무효화
 */
export function invalidatePermissionCache(userId?: string): void {
  permissionCache.invalidate(userId)
}

/**
 * 권한 캐시 상태 조회
 */
export function getPermissionCacheStats() {
  return permissionCache.getStats()
}

// ================================================================
// 개발 도구 (Development Only)
// ================================================================

// Debug Interface는 별도 파일에서 관리 (src/lib/permissions/debug.ts)
// Production 빌드에서 완전히 제외됨