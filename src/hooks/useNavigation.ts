'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/store/useAuthStore'
import { 
  useNavigationStore, 
  validatePageAccess, 
  syncTabWithPath,
  useCurrentTab,
  useVisibleTabs 
} from '@/lib/stores/navigationStore'
import type { UserRole } from '@/types/navigation'

/**
 * 네비게이션 관련 기능을 통합한 훅
 */
export function useNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const currentTab = useCurrentTab()
  const visibleTabs = useVisibleTabs()
  const { setCurrentTab, updateVisibleTabs, updateTabBadge } = useNavigationStore()

  // 사용자 권한 변경시 탭 메뉴 업데이트
  useEffect(() => {
    if (profile?.role) {
      updateVisibleTabs(profile.role as UserRole)
    }
  }, [profile?.role, updateVisibleTabs])

  // URL 경로와 탭 상태 동기화
  useEffect(() => {
    syncTabWithPath(pathname)
  }, [pathname])

  // 페이지 접근 권한 검증
  useEffect(() => {
    if (!profile?.role) return

    const hasAccess = validatePageAccess(pathname, profile.role as UserRole)
    
    if (!hasAccess) {
      console.warn(`Access denied to ${pathname} for role ${profile.role}`)
      router.replace('/main') // 대시보드로 리다이렉트
    }
  }, [pathname, profile?.role, router])

  /**
   * 특정 탭으로 이동
   */
  const navigateToTab = (tabId: string) => {
    const tab = visibleTabs.find(t => t.id === tabId)
    if (tab) {
      router.push(tab.href)
    }
  }

  /**
   * 현재 사용자가 특정 탭에 접근할 수 있는지 확인
   */
  const canAccessTab = (tabId: string): boolean => {
    return visibleTabs.some(tab => tab.id === tabId)
  }

  /**
   * 현재 사용자 역할 확인
   */
  const hasRole = (roles: UserRole[]): boolean => {
    if (!profile?.role) return false
    return roles.includes(profile.role as UserRole)
  }

  return {
    // 상태
    currentTab,
    visibleTabs,
    userRole: profile?.role as UserRole | null,
    
    // 액션
    setCurrentTab,
    navigateToTab,
    updateTabBadge,
    
    // 유틸리티
    canAccessTab,
    hasRole
  }
}

/**
 * 페이지 접근 권한을 확인하는 가드 훅
 */
export function usePageAccessGuard(requiredRoles: UserRole[] = []) {
  const { profile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!profile) return

    // 권한 요구사항이 없으면 접근 허용
    if (requiredRoles.length === 0) return

    // 사용자 역할이 필요 권한에 포함되는지 확인
    const hasAccess = requiredRoles.includes(profile.role as UserRole)
    
    if (!hasAccess) {
      console.warn(`Page access denied: ${pathname} requires roles [${requiredRoles.join(', ')}], but user has role ${profile.role}`)
      router.replace('/main')
    }
  }, [profile, requiredRoles, pathname, router])

  return {
    hasAccess: profile ? requiredRoles.length === 0 || requiredRoles.includes(profile.role as UserRole) : false,
    userRole: profile?.role as UserRole | null
  }
}