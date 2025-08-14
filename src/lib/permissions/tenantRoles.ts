/**
 * 테넌트별 역할 관리 시스템
 * @description 멀티테넌트 환경에서 테넌트별 커스텀 역할 및 권한 관리
 * @version v4.1
 * @since 2025-08-14
 */

import type { Database } from '@/types/database'
import type { UserProfile, UserRole, Tenant } from '@/types/auth.types'
import type { 
  Permission, 
  PermissionString,
  PermissionOverride,
  PermissionContext 
} from '@/types/permissions.types'
import { ROLE_PERMISSIONS, parsePermissionString } from '@/types/permissions.types'
import type { TenantRoleUpdate as TenantRoleUpdateUtil, TenantRolesDebugInterface } from '@/types/utilityTypes'
import { isTenantRoleUpdate } from '@/types/typeGuards'
import { createClient } from '@/lib/db/supabase/client'

// ================================================================
// 테넌트 역할 타입 정의
// ================================================================

/**
 * 테넌트 역할
 * tenant_roles 테이블과 매핑
 */
export type TenantRole = Database['public']['Tables']['tenant_roles']['Row']
export type TenantRoleInsert = Database['public']['Tables']['tenant_roles']['Insert']
export type TenantRoleUpdate = Database['public']['Tables']['tenant_roles']['Update']

/**
 * 테넌트 멤버십
 * tenant_memberships 테이블과 매핑
 */
export type TenantMembership = Database['public']['Tables']['tenant_memberships']['Row']

/**
 * 확장된 테넌트 역할 (권한 포함)
 */
export interface TenantRoleWithPermissions extends TenantRole {
  permissions: Permission[]
  inheritedFrom?: UserRole
  effectivePermissions?: Permission[]
}

/**
 * 테넌트 컨텍스트
 */
export interface TenantContext {
  tenantId: string
  userId: string
  roleId?: string
  customPermissions?: Record<string, unknown>
}

// ================================================================
// 테넌트 역할 관리 클래스
// ================================================================

export class TenantRoleManager {
  private supabase = createClient()
  private roleCache: Map<string, TenantRoleWithPermissions> = new Map()
  private membershipCache: Map<string, TenantMembership> = new Map()

  /**
   * 테넌트 역할 가져오기
   */
  async getTenantRole(
    tenantId: string,
    roleId: string
  ): Promise<TenantRoleWithPermissions | null> {
    const cacheKey = `${tenantId}:${roleId}`
    
    // 캐시 확인
    if (this.roleCache.has(cacheKey)) {
      return this.roleCache.get(cacheKey)!
    }

    try {
      const { data, error } = await this.supabase
        .from('tenant_roles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', roleId)
        .single()

      if (error || !data) return null

      // 권한 파싱
      const permissions = this.parsePermissions(data.base_permissions as Record<string, unknown> | null)
      
      const roleWithPermissions: TenantRoleWithPermissions = {
        ...data,
        permissions,
        inheritedFrom: undefined,
        effectivePermissions: permissions
      }

      // 캐시 저장
      this.roleCache.set(cacheKey, roleWithPermissions)
      
      return roleWithPermissions
    } catch (error) {
      console.error('Error fetching tenant role:', error)
      return null
    }
  }

  /**
   * 사용자의 테넌트 멤버십 가져오기
   */
  async getUserTenantMembership(
    userId: string,
    tenantId: string
  ): Promise<TenantMembership | null> {
    const cacheKey = `${userId}:${tenantId}`
    
    // 캐시 확인
    if (this.membershipCache.has(cacheKey)) {
      return this.membershipCache.get(cacheKey)!
    }

    try {
      const { data, error } = await this.supabase
        .from('tenant_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !data) return null

      // 캐시 저장
      this.membershipCache.set(cacheKey, data)
      
      return data
    } catch (error) {
      console.error('Error fetching tenant membership:', error)
      return null
    }
  }

  /**
   * 사용자의 테넌트별 권한 가져오기
   */
  async getUserTenantPermissions(
    userId: string,
    tenantId: string,
    baseRole?: UserRole
  ): Promise<Permission[]> {
    // 1. 테넌트 멤버십 확인
    const membership = await this.getUserTenantMembership(userId, tenantId)
    if (!membership) {
      // 멤버십이 없으면 기본 역할 권한만 반환
      return baseRole ? ROLE_PERMISSIONS[baseRole] || [] : []
    }

    // 2. 테넌트 역할 가져오기
    if (membership.role_id) {
      const tenantRole = await this.getTenantRole(tenantId, membership.role_id)
      if (tenantRole?.effectivePermissions) {
        // 테넌트 역할의 유효 권한 반환
        return tenantRole.effectivePermissions
      }
    }

    // 3. 멤버십의 권한 오버라이드 처리
    const membershipData = membership as TenantMembership & { permissions_override?: Record<string, unknown> }
    if (membershipData.permissions_override) {
      const overridePermissions = this.parsePermissions(membershipData.permissions_override)
      const basePermissions = baseRole ? ROLE_PERMISSIONS[baseRole] || [] : []
      return this.mergePermissions(baseRole, overridePermissions)
    }

    // 4. 기본 역할 권한 반환
    return baseRole ? ROLE_PERMISSIONS[baseRole] || [] : []
  }

  /**
   * 권한 파싱 (JSON → Permission[])
   */
  private parsePermissions(
    permissionsData: Record<string, unknown> | null
  ): Permission[] {
    if (!permissionsData) return []

    const permissions: Permission[] = []

    // permissions_override 형식 파싱
    if (Array.isArray(permissionsData.permissions)) {
      for (const perm of permissionsData.permissions) {
        if (typeof perm === 'string') {
          const parsed = parsePermissionString(perm)
          if (parsed) permissions.push(parsed)
        } else if (typeof perm === 'object' && perm) {
          permissions.push(perm as Permission)
        }
      }
    }

    // additions/removals 형식 파싱
    if (permissionsData.additions && Array.isArray(permissionsData.additions)) {
      for (const perm of permissionsData.additions) {
        if (typeof perm === 'string') {
          const parsed = parsePermissionString(perm)
          if (parsed) permissions.push(parsed)
        }
      }
    }

    return permissions
  }

  /**
   * 권한 병합 (기본 권한 + 오버라이드)
   */
  private mergePermissions(
    baseRole: UserRole | undefined,
    overridePermissions: Permission[]
  ): Permission[] {
    const basePermissions = baseRole ? ROLE_PERMISSIONS[baseRole] || [] : []
    
    // 중복 제거를 위한 Set 사용
    const permissionSet = new Map<string, Permission>()
    
    // 기본 권한 추가
    for (const perm of basePermissions) {
      const key = `${perm.resource}:${perm.action}:${perm.scope || 'default'}`
      permissionSet.set(key, perm)
    }
    
    // 오버라이드 권한 추가 (덮어쓰기)
    for (const perm of overridePermissions) {
      const key = `${perm.resource}:${perm.action}:${perm.scope || 'default'}`
      permissionSet.set(key, perm)
    }
    
    return Array.from(permissionSet.values())
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(userId?: string, tenantId?: string): void {
    if (!userId && !tenantId) {
      // 전체 캐시 무효화
      this.roleCache.clear()
      this.membershipCache.clear()
      return
    }

    // 특정 사용자 또는 테넌트 캐시 무효화
    if (userId) {
      for (const key of this.membershipCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.membershipCache.delete(key)
        }
      }
    }

    if (tenantId) {
      for (const key of this.roleCache.keys()) {
        if (key.startsWith(`${tenantId}:`)) {
          this.roleCache.delete(key)
        }
      }
      for (const key of this.membershipCache.keys()) {
        if (key.endsWith(`:${tenantId}`)) {
          this.membershipCache.delete(key)
        }
      }
    }
  }
}

// 전역 테넌트 역할 관리자 인스턴스
export const tenantRoleManager = new TenantRoleManager()

// ================================================================
// 테넌트 권한 체크 함수
// ================================================================

/**
 * 사용자가 테넌트에서 특정 권한을 가지고 있는지 확인
 */
export async function hasTenantPermission(
  userProfile: UserProfile,
  tenantId: string,
  permission: Permission | PermissionString
): Promise<boolean> {
  const permissions = await tenantRoleManager.getUserTenantPermissions(
    userProfile.id,
    tenantId,
    userProfile.role as UserRole | undefined
  )

  const permissionObj = typeof permission === 'string'
    ? parsePermissionString(permission)
    : permission

  if (!permissionObj) return false

  return permissions.some(p => 
    p.resource === permissionObj.resource &&
    p.action === permissionObj.action &&
    (!permissionObj.scope || p.scope === permissionObj.scope)
  )
}

/**
 * 사용자의 테넌트 역할 확인
 */
export async function getUserTenantRole(
  userId: string,
  tenantId: string
): Promise<TenantRoleWithPermissions | null> {
  const membership = await tenantRoleManager.getUserTenantMembership(userId, tenantId)
  if (!membership?.role_id) return null

  return tenantRoleManager.getTenantRole(tenantId, membership.role_id)
}

/**
 * 테넌트 멤버십 상태 확인
 */
export async function checkTenantMembershipStatus(
  userId: string,
  tenantId: string
): Promise<{
  isMember: boolean
  status?: string | null
  role?: TenantRoleWithPermissions | null
  acceptedAt?: string | null
}> {
  const membership = await tenantRoleManager.getUserTenantMembership(userId, tenantId)
  
  if (!membership) {
    return { isMember: false }
  }

  const role = membership.role_id 
    ? await tenantRoleManager.getTenantRole(tenantId, membership.role_id)
    : null

  return {
    isMember: true,
    status: membership.status,
    role,
    acceptedAt: membership.accepted_at
  }
}

// ================================================================
// 테넌트 역할 생성 및 수정
// ================================================================

/**
 * 테넌트 커스텀 역할 생성
 */
export async function createTenantRole(
  tenantId: string,
  roleData: {
    name: string
    display_name: string
    description?: string
    base_role?: UserRole
    permissions?: Permission[]
    hierarchy_level?: number
  }
): Promise<TenantRole | null> {
  const supabase = createClient()

  const permissionsOverride = roleData.permissions 
    ? { permissions: roleData.permissions.map(p => `${p.resource}:${p.action}`) }
    : null

  try {
    const { data, error } = await supabase
      .from('tenant_roles')
      .insert({
        tenant_id: tenantId,
        name: roleData.name,
        display_name: roleData.display_name,
        description: roleData.description,
        base_role: roleData.base_role,
        base_permissions: permissionsOverride,
        hierarchy_level: roleData.hierarchy_level || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tenant role:', error)
      return null
    }

    // 캐시 무효화
    tenantRoleManager.invalidateCache(undefined, tenantId)

    return data
  } catch (error) {
    console.error('Error creating tenant role:', error)
    return null
  }
}

/**
 * 테넌트 역할 업데이트
 */
export async function updateTenantRole(
  tenantId: string,
  roleId: string,
  updates: Partial<{
    display_name: string
    description: string
    permissions: Permission[]
    hierarchy_level: number
  }>
): Promise<boolean> {
  const supabase = createClient()

  const updateData: Partial<TenantRoleUpdate> = {}
  
  if (updates.display_name !== undefined) {
    updateData.display_name = updates.display_name
  }
  
  if (updates.description !== undefined) {
    updateData.description = updates.description
  }
  
  if (updates.hierarchy_level !== undefined) {
    updateData.hierarchy_level = updates.hierarchy_level
  }
  
  if (updates.permissions) {
    const extendedUpdateData = updateData as TenantRoleUpdate & { permissions_override?: Record<string, unknown> }
    extendedUpdateData.permissions_override = {
      permissions: updates.permissions.map(p => `${p.resource}:${p.action}`)
    }
  }

  try {
    const { error } = await supabase
      .from('tenant_roles')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('id', roleId)

    if (error) {
      console.error('Error updating tenant role:', error)
      return false
    }

    // 캐시 무효화
    tenantRoleManager.invalidateCache(undefined, tenantId)

    return true
  } catch (error) {
    console.error('Error updating tenant role:', error)
    return false
  }
}

/**
 * 사용자에게 테넌트 역할 할당
 */
export async function assignTenantRole(
  userId: string,
  tenantId: string,
  roleId: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('tenant_memberships')
      .update({
        role_id: roleId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error assigning tenant role:', error)
      return false
    }

    // 캐시 무효화
    tenantRoleManager.invalidateCache(userId, tenantId)

    return true
  } catch (error) {
    console.error('Error assigning tenant role:', error)
    return false
  }
}

// ================================================================
// 개발 도구
// ================================================================

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    const windowWithTenantRoles = window as Window & { __TENANT_ROLES__?: TenantRolesDebugInterface }
    windowWithTenantRoles.__TENANT_ROLES__ = {
      manager: tenantRoleManager,
      hasTenantPermission: hasTenantPermission as any,
      getUserTenantRole,
      checkTenantMembershipStatus,
      createTenantRole: createTenantRole as any,
      updateTenantRole: updateTenantRole as any,
      assignTenantRole
    }
  }
}