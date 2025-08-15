'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePermissions } from './usePermissions'
import type { UserRole } from '@/types/auth.types'

/**
 * 적응형 네비게이션 훅
 * 권한 변경 시 실시간으로 메뉴 구성을 업데이트
 */
export function useAdaptiveNavigation() {
  const permissions = usePermissions()
  const [lastRole, setLastRole] = useState<UserRole | undefined>(undefined)
  const [menuCache, setMenuCache] = useState<Map<string, any>>(new Map())

  // 역할 변경 감지 및 실시간 업데이트
  useEffect(() => {
    if (permissions.role !== lastRole) {
      // 역할이 변경되면 메뉴 캐시 초기화
      console.log('🔄 역할 변경 감지:', lastRole, '→', permissions.role)
      setMenuCache(new Map())
      setLastRole(permissions.role as UserRole)
      
      // 권한 새로고침 (캐시 무효화)
      permissions.refreshPermissions?.()
      
      // 글로벌 이벤트 발생 (다른 컴포넌트들도 업데이트)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('permission-changed', {
          detail: { 
            previousRole: lastRole,
            newRole: permissions.role,
            timestamp: Date.now()
          }
        }))
      }
    }
  }, [permissions.role, lastRole, permissions.refreshPermissions])

  // 권한 리소스 변경 감지
  useEffect(() => {
    // 권한 리소스가 변경되면 메뉴 캐시 일부 무효화
    const resourceKeys = Object.keys(permissions.resources || {})
    const cacheKeysToRemove = Array.from(menuCache.keys()).filter(key => 
      resourceKeys.some(resource => key.includes(resource))
    )
    
    if (cacheKeysToRemove.length > 0) {
      console.log('🔄 권한 리소스 변경 감지 - 캐시 무효화:', cacheKeysToRemove.length, '개 항목')
      setMenuCache(prev => {
        const newCache = new Map(prev)
        cacheKeysToRemove.forEach(key => newCache.delete(key))
        return newCache
      })
    }
  }, [permissions.resources, menuCache])

  // 메뉴 가시성 계산 (메모화)
  const calculateMenuVisibility = useCallback((menuId: string, requiredPermissions?: any[]) => {
    const cacheKey = `${menuId}-${permissions.role}-${JSON.stringify(requiredPermissions)}`
    
    if (menuCache.has(cacheKey)) {
      return menuCache.get(cacheKey)
    }

    let isVisible = true

    if (requiredPermissions) {
      isVisible = requiredPermissions.every(perm => 
        permissions.hasPermission(perm.resource, perm.action)
      )
    }

    // 캐시에 저장
    setMenuCache(prev => new Map(prev).set(cacheKey, isVisible))
    return isVisible
  }, [permissions, menuCache])

  // 네비게이션 통계
  const navigationStats = useMemo(() => {
    const { role, resources } = permissions
    
    const accessibleMenus = {
      dashboard: true,
      students: resources?.students?.canRead || false,
      classes: resources?.classes?.canRead || false,
      attendance: resources?.attendance?.canRead || false,
      payments: resources?.payments?.canRead || false,
      analytics: resources?.analytics?.canRead || false,
      settings: true,
      adminOnly: role === 'admin' || role === 'system_admin',
      instructorFeatures: role === 'instructor',
      staffFeatures: role === 'staff'
    }

    const totalAccessible = Object.values(accessibleMenus).filter(Boolean).length
    
    return {
      totalMenus: Object.keys(accessibleMenus).length,
      accessibleMenus: totalAccessible,
      accessibilityRatio: totalAccessible / Object.keys(accessibleMenus).length,
      role: role || 'guest',
      capabilities: {
        canManageUsers: accessibleMenus.adminOnly,
        canManageStudents: accessibleMenus.students,
        canManagePayments: accessibleMenus.payments,
        canViewAnalytics: accessibleMenus.analytics,
        canCreateContent: accessibleMenus.instructorFeatures
      }
    }
  }, [permissions])

  // 권한 기반 액션 확인
  const canPerformAction = useCallback((resource: string, action: string) => {
    return permissions.hasPermission(resource, action)
  }, [permissions])

  // 메뉴 커스터마이제이션 가져오기
  const getMenuCustomization = useCallback((menuId: string, role: UserRole) => {
    const customizations = {
      dashboard: {
        admin: { title: '학원 관리 대시보드', icon: 'building' },
        staff: { title: '업무 대시보드', icon: 'clipboard' },
        instructor: { title: '강의 대시보드', icon: 'academic' }
      },
      students: {
        staff: { title: '학생 관리', subtitle: '등록 및 정보 관리' },
        instructor: { title: '담당 학생', subtitle: '내 학생 정보' }
      },
      classes: {
        instructor: { title: '내 클래스', subtitle: '담당 클래스 관리' }
      },
      analytics: {
        admin: { title: '종합 통계', subtitle: '학원 전체 분석' },
        instructor: { title: '강의 분석', subtitle: '수업 성과 분석' }
      }
    }

    return (customizations as any)[menuId]?.[role] || null
  }, [])

  // 실시간 권한 상태
  const permissionStatus = useMemo(() => ({
    isLoading: false, // permissions 시스템에서 로딩 상태를 제공하면 여기에 연결
    hasError: false,  // 에러 상태도 마찬가지
    lastUpdated: new Date(),
    cacheSize: menuCache.size
  }), [menuCache.size])

  return {
    // 기본 권한 정보
    permissions,
    role: permissions.role as UserRole,
    
    // 메뉴 관련 함수
    calculateMenuVisibility,
    canPerformAction,
    getMenuCustomization,
    
    // 통계 및 상태
    navigationStats,
    permissionStatus,
    
    // 캐시 관리
    clearMenuCache: useCallback(() => setMenuCache(new Map()), []),
    
    // 권한 새로고침
    refreshPermissions: permissions.refreshPermissions
  }
}

/**
 * 특정 메뉴 아이템의 가시성을 확인하는 훅
 */
export function useMenuVisibility(menuId: string, requiredPermissions?: any[]) {
  const { calculateMenuVisibility } = useAdaptiveNavigation()
  
  return useMemo(() => 
    calculateMenuVisibility(menuId, requiredPermissions),
    [calculateMenuVisibility, menuId, requiredPermissions]
  )
}

/**
 * 역할별 메뉴 커스터마이제이션 훅
 */
export function useMenuCustomization(menuId: string) {
  const { getMenuCustomization, role } = useAdaptiveNavigation()
  
  return useMemo(() => 
    role ? getMenuCustomization(menuId, role) : null,
    [getMenuCustomization, menuId, role]
  )
}

/**
 * 네비게이션 성능 모니터링 훅
 */
export function useNavigationPerformance() {
  const { permissionStatus, navigationStats } = useAdaptiveNavigation()
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    setRenderCount(prev => prev + 1)
  })

  return {
    renderCount,
    cacheEfficiency: permissionStatus.cacheSize > 0 ? 
      navigationStats.accessibleMenus / permissionStatus.cacheSize : 0,
    lastUpdate: permissionStatus.lastUpdated,
    menuAccessibility: navigationStats.accessibilityRatio
  }
}