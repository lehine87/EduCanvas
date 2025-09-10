/**
 * 🔐 중앙집중식 권한 관리 서비스 (RBAC 구현)
 * 
 * 기능:
 * - 역할 기반 접근 제어 (Role-Based Access Control)
 * - 권한 캐싱 및 성능 최적화
 * - 동적 권한 검증
 * - 권한 상속 및 계층 관리
 * 
 * @version 1.0.0
 * @since 2025-09-10
 */

import type { UserRole, UserProfile } from '@/types/auth.types'

/**
 * 권한 액션 타입 정의
 */
export type PermissionAction = 
  // 학생 관리
  | 'student:create' | 'student:read' | 'student:update' | 'student:delete'
  | 'student:list' | 'student:search' | 'student:export'
  
  // 강사 관리  
  | 'instructor:create' | 'instructor:read' | 'instructor:update' | 'instructor:delete'
  | 'instructor:list' | 'instructor:assign'
  
  // 수업 관리
  | 'class:create' | 'class:read' | 'class:update' | 'class:delete'
  | 'class:list' | 'class:schedule' | 'class:attendance'
  
  // 결제 관리
  | 'payment:create' | 'payment:read' | 'payment:update' | 'payment:refund'
  | 'payment:list' | 'payment:export'
  
  // 분석 및 리포트
  | 'analytics:read' | 'analytics:export' | 'report:generate'
  
  // 시스템 관리
  | 'system:admin' | 'tenant:manage' | 'user:manage'
  
  // 와일드카드 권한
  | 'all:read' | 'all:write' | 'all:admin'

/**
 * 권한 검증 결과
 */
export interface AuthorizationResult {
  granted: boolean
  reason?: string
  requiredRole?: UserRole
  currentRole?: UserRole
  missingPermissions?: PermissionAction[]
  context?: Record<string, any>
}

/**
 * 권한 규칙 정의
 */
interface PermissionRule {
  action: PermissionAction
  allowedRoles: UserRole[]
  conditions?: (context: AuthorizationContext) => boolean
  description: string
}

/**
 * 권한 검증 컨텍스트
 */
export interface AuthorizationContext {
  user: UserProfile
  targetTenantId?: string
  resourceId?: string
  metadata?: Record<string, any>
}

/**
 * 역할별 권한 매핑 (업계 표준 RBAC)
 */
const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  // 시스템 관리자: 모든 권한
  system_admin: [
    'all:admin', 'all:write', 'all:read',
    'system:admin', 'tenant:manage', 'user:manage',
    'student:create', 'student:read', 'student:update', 'student:delete', 'student:list', 'student:search', 'student:export',
    'instructor:create', 'instructor:read', 'instructor:update', 'instructor:delete', 'instructor:list', 'instructor:assign',
    'class:create', 'class:read', 'class:update', 'class:delete', 'class:list', 'class:schedule', 'class:attendance',
    'payment:create', 'payment:read', 'payment:update', 'payment:refund', 'payment:list', 'payment:export',
    'analytics:read', 'analytics:export', 'report:generate'
  ],

  // 테넌트 관리자: 해당 테넌트 내 모든 권한
  tenant_admin: [
    'all:write', 'all:read',
    'user:manage',
    'student:create', 'student:read', 'student:update', 'student:delete', 'student:list', 'student:search', 'student:export',
    'instructor:create', 'instructor:read', 'instructor:update', 'instructor:delete', 'instructor:list', 'instructor:assign',
    'class:create', 'class:read', 'class:update', 'class:delete', 'class:list', 'class:schedule', 'class:attendance',
    'payment:create', 'payment:read', 'payment:update', 'payment:refund', 'payment:list', 'payment:export',
    'analytics:read', 'analytics:export', 'report:generate'
  ],

  // 강사: 수업 및 학생 관리 권한
  instructor: [
    'all:read',
    'student:read', 'student:update', 'student:list', 'student:search',
    'instructor:read', 'instructor:update',
    'class:read', 'class:update', 'class:schedule', 'class:attendance',
    'analytics:read'
  ],

  // 직원: 학생 관리 및 일부 수업 권한
  staff: [
    'all:read',
    'student:create', 'student:read', 'student:update', 'student:list', 'student:search',
    'instructor:read', 'instructor:list',
    'class:read', 'class:list',
    'payment:create', 'payment:read', 'payment:list'
  ],

  // 관람자: 읽기 전용 권한
  viewer: [
    'all:read',
    'student:read', 'student:list', 'student:search',
    'instructor:read', 'instructor:list',
    'class:read', 'class:list',
    'analytics:read'
  ]
}

/**
 * 역할 계층 레벨 (높을수록 상위 역할)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  system_admin: 100,
  tenant_admin: 80,
  instructor: 60,
  staff: 40,
  viewer: 20
}

/**
 * 🔐 중앙집중식 권한 관리 서비스
 */
export class AuthorizationService {
  private static instance: AuthorizationService
  private permissionCache = new Map<string, { result: AuthorizationResult; expiry: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5분 캐시

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService()
    }
    return AuthorizationService.instance
  }

  /**
   * 🔍 단일 권한 검증
   */
  public checkPermission(
    context: AuthorizationContext,
    action: PermissionAction
  ): AuthorizationResult {
    const { user, targetTenantId } = context
    
    // 캐시 키 생성
    const cacheKey = this.generateCacheKey(user.id, action, targetTenantId)
    const cached = this.permissionCache.get(cacheKey)
    
    // 캐시된 결과 반환 (만료되지 않은 경우)
    if (cached && Date.now() < cached.expiry) {
      return cached.result
    }

    let result: AuthorizationResult

    try {
      // 1. 기본 유효성 검사
      if (!user || !user.role) {
        result = {
          granted: false,
          reason: 'No user or role information',
          currentRole: user?.role as UserRole | undefined
        }
      }
      // 2. 시스템 관리자는 모든 권한 허용
      else if (user.role === 'system_admin') {
        result = {
          granted: true,
          currentRole: user.role as UserRole,
          context: { systemAdmin: true }
        }
      }
      // 3. 테넌트 접근 권한 검사
      else if (targetTenantId && !this.canAccessTenant(user, targetTenantId)) {
        result = {
          granted: false,
          reason: 'Tenant access denied',
          currentRole: user.role as UserRole,
          context: { userTenant: user.tenant_id, targetTenant: targetTenantId }
        }
      }
      // 4. 역할별 권한 검사
      else if (!this.hasRolePermission(user.role as UserRole, action)) {
        result = {
          granted: false,
          reason: 'Insufficient role permissions',
          currentRole: user.role as UserRole,
          missingPermissions: [action],
          requiredRole: this.getMinimumRequiredRole(action)
        }
      }
      // 5. 권한 허용
      else {
        result = {
          granted: true,
          currentRole: user.role as UserRole
        }
      }

      // 결과 캐싱
      this.permissionCache.set(cacheKey, {
        result,
        expiry: Date.now() + this.CACHE_TTL
      })

      // 감사 로그 (개발환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 [AUTHORIZATION] ${result.granted ? '✅' : '❌'} ${user.email} -> ${action}`, {
          granted: result.granted,
          role: user.role,
          reason: result.reason
        })
      }

      return result

    } catch (error) {
      console.error('🚨 [AUTHORIZATION] Permission check failed:', error)
      return {
        granted: false,
        reason: 'Authorization service error',
        currentRole: user?.role as UserRole | undefined
      }
    }
  }

  /**
   * 🔍 다중 권한 검증 (OR 조건)
   */
  public checkAnyPermission(
    context: AuthorizationContext,
    actions: PermissionAction[]
  ): AuthorizationResult {
    const results = actions.map(action => this.checkPermission(context, action))
    const granted = results.some(result => result.granted)
    
    if (granted) {
      const grantedResult = results.find(result => result.granted)!
      return grantedResult
    }

    return {
      granted: false,
      reason: 'None of the required permissions granted',
      currentRole: context.user?.role as UserRole | undefined,
      missingPermissions: actions
    }
  }

  /**
   * 🔍 다중 권한 검증 (AND 조건)
   */
  public checkAllPermissions(
    context: AuthorizationContext,
    actions: PermissionAction[]
  ): AuthorizationResult {
    const results = actions.map(action => this.checkPermission(context, action))
    const deniedResults = results.filter(result => !result.granted)
    
    if (deniedResults.length === 0) {
      return {
        granted: true,
        currentRole: context.user?.role as UserRole | undefined
      }
    }

    return {
      granted: false,
      reason: 'Some required permissions denied',
      currentRole: context.user?.role as UserRole | undefined,
      missingPermissions: deniedResults.flatMap(result => result.missingPermissions || [])
    }
  }

  /**
   * 🔍 역할 기반 접근 권한 검사
   */
  public hasRole(user: UserProfile, requiredRoles: UserRole | UserRole[]): boolean {
    if (!user?.role) return false
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    return roles.includes(user.role as UserRole)
  }

  /**
   * 🔍 역할 계층 기반 권한 검사 (상위 역할이 하위 역할 권한 포함)
   */
  public hasRoleOrHigher(user: UserProfile, minimumRole: UserRole): boolean {
    if (!user?.role) return false
    
    const userLevel = ROLE_HIERARCHY[user.role as UserRole] || 0
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0
    
    return userLevel >= requiredLevel
  }

  /**
   * 🔍 테넌트 접근 권한 검사
   */
  public canAccessTenant(user: UserProfile, tenantId: string): boolean {
    if (!user) return false
    
    // 시스템 관리자는 모든 테넌트 접근 가능
    if (user.role === 'system_admin') return true
    
    // 같은 테넌트 접근
    return user.tenant_id === tenantId
  }

  /**
   * 🔍 리소스 소유자 권한 검사
   */
  public isResourceOwner(user: UserProfile, resourceOwnerId: string): boolean {
    return user.id === resourceOwnerId
  }

  /**
   * 📊 사용자 권한 요약 반환
   */
  public getUserPermissionSummary(user: UserProfile): {
    role: UserRole
    level: number
    permissions: PermissionAction[]
    canManageUsers: boolean
    canAccessAllTenants: boolean
    tenantId?: string
  } {
    const permissions = user.role ? ROLE_PERMISSIONS[user.role as UserRole] || [] : []
    
    return {
      role: user.role as UserRole,
      level: ROLE_HIERARCHY[user.role as UserRole] || 0,
      permissions,
      canManageUsers: permissions.includes('user:manage'),
      canAccessAllTenants: user.role === 'system_admin',
      tenantId: user.tenant_id || undefined
    }
  }

  /**
   * 🗑️ 권한 캐시 무효화
   */
  public invalidateCache(userId?: string): void {
    if (userId) {
      // 특정 사용자의 캐시만 삭제
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.permissionCache.delete(key)
        }
      }
    } else {
      // 모든 캐시 삭제
      this.permissionCache.clear()
    }
    
    console.log('🔄 [AUTHORIZATION] Permission cache invalidated', { userId })
  }

  /**
   * 📈 캐시 통계 반환
   */
  public getCacheStats(): {
    size: number
    hitRate: number
    expired: number
  } {
    const now = Date.now()
    let expired = 0
    
    for (const [key, cached] of this.permissionCache.entries()) {
      if (now >= cached.expiry) {
        expired++
        this.permissionCache.delete(key) // 만료된 캐시 정리
      }
    }
    
    return {
      size: this.permissionCache.size,
      hitRate: 0, // 실제 구현에서는 hit/miss 카운터 필요
      expired
    }
  }

  /**
   * 🔧 Private: 역할이 특정 권한을 가지는지 확인
   */
  private hasRolePermission(role: UserRole, action: PermissionAction): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || []
    
    // 직접 권한 확인
    if (rolePermissions.includes(action)) return true
    
    // 와일드카드 권한 확인
    if (rolePermissions.includes('all:admin')) return true
    if (rolePermissions.includes('all:write') && this.isWriteAction(action)) return true
    if (rolePermissions.includes('all:read') && this.isReadAction(action)) return true
    
    return false
  }

  /**
   * 🔧 Private: 읽기 액션인지 확인
   */
  private isReadAction(action: PermissionAction): boolean {
    return action.includes(':read') || 
           action.includes(':list') || 
           action.includes(':search') ||
           action === 'analytics:read'
  }

  /**
   * 🔧 Private: 쓰기 액션인지 확인
   */
  private isWriteAction(action: PermissionAction): boolean {
    return action.includes(':create') || 
           action.includes(':update') || 
           action.includes(':delete') ||
           action.includes(':assign') ||
           action.includes(':schedule')
  }

  /**
   * 🔧 Private: 특정 액션에 필요한 최소 역할 반환
   */
  private getMinimumRequiredRole(action: PermissionAction): UserRole | undefined {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      if (permissions.includes(action)) {
        return role as UserRole
      }
    }
    return undefined
  }

  /**
   * 🔧 Private: 캐시 키 생성
   */
  private generateCacheKey(userId: string, action: PermissionAction, tenantId?: string): string {
    return `${userId}:${action}:${tenantId || 'no-tenant'}`
  }
}

/**
 * 전역 권한 서비스 인스턴스
 */
export const authorizationService = AuthorizationService.getInstance()

/**
 * 🎯 편의 함수들 (React 컴포넌트에서 쉽게 사용)
 */
export const AuthPermissions = {
  /**
   * 권한 확인 (단일)
   */
  check: (user: UserProfile, action: PermissionAction, tenantId?: string): boolean => {
    const context: AuthorizationContext = { user, targetTenantId: tenantId }
    return authorizationService.checkPermission(context, action).granted
  },

  /**
   * 권한 확인 (다중 - OR)
   */
  checkAny: (user: UserProfile, actions: PermissionAction[], tenantId?: string): boolean => {
    const context: AuthorizationContext = { user, targetTenantId: tenantId }
    return authorizationService.checkAnyPermission(context, actions).granted
  },

  /**
   * 권한 확인 (다중 - AND)
   */
  checkAll: (user: UserProfile, actions: PermissionAction[], tenantId?: string): boolean => {
    const context: AuthorizationContext = { user, targetTenantId: tenantId }
    return authorizationService.checkAllPermissions(context, actions).granted
  },

  /**
   * 역할 확인
   */
  hasRole: (user: UserProfile, roles: UserRole | UserRole[]): boolean => {
    return authorizationService.hasRole(user, roles)
  },

  /**
   * 역할 계층 확인
   */
  hasRoleOrHigher: (user: UserProfile, minimumRole: UserRole): boolean => {
    return authorizationService.hasRoleOrHigher(user, minimumRole)
  },

  /**
   * 테넌트 접근 권한
   */
  canAccessTenant: (user: UserProfile, tenantId: string): boolean => {
    return authorizationService.canAccessTenant(user, tenantId)
  }
}