/**
 * 테넌트 역할 관련 커스텀 훅
 * @description 멀티테넌트 환경에서 테넌트별 역할 및 권한 관리를 위한 훅
 * @version v4.1
 * @since 2025-08-14
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { 
  UserRole,
  UserProfile,
  Tenant
} from '@/types/auth.types'
import type { 
  Permission,
  PermissionString
} from '@/types/permissions.types'
import type { TenantRoleUpdate } from '@/types/utilityTypes'
import { isTenantRoleUpdate } from '@/types/typeGuards'
import {
  tenantRoleManager,
  getUserTenantRole,
  checkTenantMembershipStatus,
  hasTenantPermission,
  createTenantRole,
  updateTenantRole,
  assignTenantRole,
  type TenantRoleWithPermissions
} from '@/lib/permissions/tenantRoles'

/**
 * 테넌트 역할 훅 반환 타입
 */
interface UseTenantRoleReturn {
  // 테넌트 역할 정보
  tenantRole: TenantRoleWithPermissions | null
  membership: {
    isMember: boolean
    status: string | null
    acceptedAt: string | null
  }
  
  // 권한 체크
  hasTenantPermission: (permission: Permission | PermissionString) => Promise<boolean>
  getTenantPermissions: () => Promise<Permission[]>
  
  // 역할 관리
  createCustomRole: (roleData: {
    name: string
    display_name: string
    description?: string
    permissions?: Permission[]
  }) => Promise<boolean>
  updateRole: (roleId: string, updates: TenantRoleUpdate) => Promise<boolean>
  assignRole: (userId: string, roleId: string) => Promise<boolean>
  
  // 유틸리티
  refreshTenantRole: () => Promise<void>
  loading: boolean
  error: string | null
}

/**
 * 테넌트 역할 관리 훅
 */
export function useTenantRole(tenantId?: string): UseTenantRoleReturn {
  const { user, profile } = useAuth()
  const [tenantRole, setTenantRole] = useState<TenantRoleWithPermissions | null>(null)
  const [membership, setMembership] = useState({
    isMember: false,
    status: null as string | null,
    acceptedAt: null as string | null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 사용할 테넌트 ID 결정 (제공된 ID 또는 프로필의 테넌트 ID)
  const effectiveTenantId = tenantId || profile?.tenant_id
  
  // 테넌트 역할 및 멤버십 로드
  const loadTenantRole = useCallback(async () => {
    if (!user || !effectiveTenantId) {
      setTenantRole(null)
      setMembership({ isMember: false, status: null, acceptedAt: null })
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // 멤버십 상태 확인
      const membershipStatus = await checkTenantMembershipStatus(
        user.id,
        effectiveTenantId
      )
      
      setMembership({
        isMember: membershipStatus.isMember,
        status: membershipStatus.status || null,
        acceptedAt: membershipStatus.acceptedAt || null
      })
      
      // 테넌트 역할 가져오기
      if (membershipStatus.role) {
        setTenantRole(membershipStatus.role)
      } else {
        const role = await getUserTenantRole(user.id, effectiveTenantId)
        setTenantRole(role)
      }
    } catch (err) {
      console.error('Error loading tenant role:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tenant role')
    } finally {
      setLoading(false)
    }
  }, [user, effectiveTenantId])
  
  // 초기 로드
  useEffect(() => {
    loadTenantRole()
  }, [loadTenantRole])
  
  // 테넌트 권한 체크
  const checkTenantPermission = useCallback(async (
    permission: Permission | PermissionString
  ): Promise<boolean> => {
    if (!profile || !effectiveTenantId) return false
    
    return hasTenantPermission(profile, effectiveTenantId, permission)
  }, [profile, effectiveTenantId])
  
  // 테넌트 권한 목록 가져오기
  const getTenantPermissions = useCallback(async (): Promise<Permission[]> => {
    if (!user || !effectiveTenantId) return []
    
    return tenantRoleManager.getUserTenantPermissions(
      user.id,
      effectiveTenantId,
      profile?.role as UserRole | undefined
    )
  }, [user, effectiveTenantId, profile])
  
  // 커스텀 역할 생성
  const createCustomRole = useCallback(async (roleData: {
    name: string
    display_name: string
    description?: string
    permissions?: Permission[]
  }): Promise<boolean> => {
    if (!effectiveTenantId) {
      setError('No tenant ID available')
      return false
    }
    
    try {
      const newRole = await createTenantRole(effectiveTenantId, {
        ...roleData,
        base_role: profile?.role as UserRole | undefined
      })
      
      if (newRole) {
        await loadTenantRole() // 역할 목록 새로고침
        return true
      }
      return false
    } catch (err) {
      console.error('Error creating custom role:', err)
      setError(err instanceof Error ? err.message : 'Failed to create role')
      return false
    }
  }, [effectiveTenantId, profile, loadTenantRole])
  
  // 역할 업데이트
  const updateRoleHandler = useCallback(async (
    roleId: string,
    updates: TenantRoleUpdate
  ): Promise<boolean> => {
    // 입력 검증
    if (!isTenantRoleUpdate(updates)) {
      setError('Invalid update data format')
      return false
    }
    if (!effectiveTenantId) {
      setError('No tenant ID available')
      return false
    }
    
    try {
      const success = await updateTenantRole(effectiveTenantId, roleId, updates)
      if (success) {
        await loadTenantRole() // 역할 정보 새로고침
      }
      return success
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role')
      return false
    }
  }, [effectiveTenantId, loadTenantRole])
  
  // 역할 할당
  const assignRoleHandler = useCallback(async (
    userId: string,
    roleId: string
  ): Promise<boolean> => {
    if (!effectiveTenantId) {
      setError('No tenant ID available')
      return false
    }
    
    try {
      const success = await assignTenantRole(userId, effectiveTenantId, roleId)
      if (success && userId === user?.id) {
        await loadTenantRole() // 본인 역할이 변경된 경우 새로고침
      }
      return success
    } catch (err) {
      console.error('Error assigning role:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign role')
      return false
    }
  }, [effectiveTenantId, user, loadTenantRole])
  
  // 역할 정보 새로고침
  const refreshTenantRole = useCallback(async () => {
    await loadTenantRole()
  }, [loadTenantRole])
  
  return {
    tenantRole,
    membership,
    hasTenantPermission: checkTenantPermission,
    getTenantPermissions,
    createCustomRole,
    updateRole: updateRoleHandler,
    assignRole: assignRoleHandler,
    refreshTenantRole,
    loading,
    error
  }
}

/**
 * 여러 테넌트의 역할 관리 훅
 */
export function useMultiTenantRoles() {
  const { user } = useAuth()
  const [tenantRoles, setTenantRoles] = useState<Map<string, TenantRoleWithPermissions>>(new Map())
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user) {
      setTenantRoles(new Map())
      setLoading(false)
      return
    }
    
    // 여기서는 사용자가 속한 모든 테넌트의 역할을 로드할 수 있습니다
    // 실제 구현은 API를 통해 사용자의 모든 테넌트 멤버십을 가져와야 합니다
    setLoading(false)
  }, [user])
  
  return {
    tenantRoles,
    loading
  }
}

/**
 * 테넌트 전환 훅
 */
export function useTenantSwitcher() {
  const { profile } = useAuth()
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(
    profile?.tenant_id || null
  )
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  
  // 테넌트 전환
  const switchTenant = useCallback(async (tenantId: string): Promise<boolean> => {
    setLoading(true)
    try {
      // 여기서 실제 테넌트 전환 로직을 구현
      // 예: API 호출, 세션 업데이트 등
      setCurrentTenantId(tenantId)
      
      // 캐시 무효화
      tenantRoleManager.invalidateCache()
      
      return true
    } catch (error) {
      console.error('Error switching tenant:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])
  
  // 사용 가능한 테넌트 목록 로드
  const loadAvailableTenants = useCallback(async () => {
    if (!profile) {
      setAvailableTenants([])
      return
    }
    
    setLoading(true)
    try {
      // 여기서 사용자가 접근 가능한 테넌트 목록을 로드
      // 실제 구현 필요
      setAvailableTenants([])
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])
  
  useEffect(() => {
    loadAvailableTenants()
  }, [loadAvailableTenants])
  
  return {
    currentTenantId,
    availableTenants,
    switchTenant,
    loading
  }
}

/**
 * 테넌트 권한 계층 확인 훅
 */
export function useTenantHierarchy(tenantId?: string) {
  const { profile } = useAuth()
  const { tenantRole } = useTenantRole(tenantId)
  
  const canManageRole = useCallback((targetRoleLevel: number): boolean => {
    if (!tenantRole) return false
    
    // 시스템 관리자는 모든 역할 관리 가능
    if (profile?.role === 'system_admin') return true
    
    // 계층 레벨 비교
    const myLevel = tenantRole.hierarchy_level || 0
    return myLevel < targetRoleLevel // 낮은 숫자가 더 높은 권한
  }, [tenantRole, profile])
  
  const getSubordinateRoles = useCallback((): string[] => {
    if (!tenantRole) return []
    
    // 현재 역할보다 낮은 계층의 역할들 반환
    // 실제 구현 필요
    return []
  }, [tenantRole])
  
  return {
    hierarchyLevel: tenantRole?.hierarchy_level || 999,
    canManageRole,
    getSubordinateRoles
  }
}