'use client'

import { useEffect } from 'react'
import { useAuth } from '@/store/useAuthStore'
import { useNavigationStore, validatePageAccess } from '@/lib/stores/navigationStore'
import { usePathname, useRouter } from 'next/navigation'
import SearchSidebar from '@/components/search/SearchSidebar'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * 메인 레이아웃 컴포넌트
 * TabNavigation + SearchSidebar 조합으로 구성된 현대적 레이아웃
 * T-V2-005: 레거시 MainLayout을 완전 대체
 */
export function MainLayout({ children, className }: MainLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const { currentTab, userRole, updateVisibleTabs, syncWithSearchContext } = useNavigationStore()

  // 사용자 권한 변경시 탭 메뉴 업데이트
  useEffect(() => {
    if (profile?.role && profile.role !== userRole) {
      updateVisibleTabs(profile.role as any)
    }
  }, [profile?.role, userRole, updateVisibleTabs])

  // 페이지 접근 권한 검증 및 리다이렉트
  useEffect(() => {
    if (!profile?.role) return

    const hasAccess = validatePageAccess(pathname, profile.role as any)
    
    if (!hasAccess) {
      // 권한 없는 페이지 접근시 대시보드로 리다이렉트
      router.replace('/admin')
    }
  }, [pathname, profile?.role, router])

  // SearchSidebar 컨텍스트 동기화
  useEffect(() => {
    syncWithSearchContext()
  }, [currentTab, syncWithSearchContext])

  // 사용자가 로그인하지 않은 경우
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-educanvas-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            사용자 정보를 불러오는 중...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex h-screen bg-background',
      className
    )}>
      {/* SearchSidebar - 컨텍스트별 자동 설정 */}
      <SearchSidebar 
        context={currentTab as any}
        className="flex-shrink-0"
      />
      
      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 메인 헤더 */}
        <Header />
        
        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}