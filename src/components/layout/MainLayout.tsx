'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdaptiveSidebar } from './AdaptiveSidebar'
import { Header } from './Header'
import { Breadcrumbs } from './Breadcrumbs'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { cn } from '@/lib/utils'
import type { LayoutProps } from './types'
import type { UserRole } from '@/types/auth.types'

/**
 * 메인 레이아웃 컴포넌트
 * @description 애플리케이션의 기본 레이아웃 구조를 제공
 */
interface MainLayoutProps extends LayoutProps {
  requireAuth?: boolean
  allowedRoles?: UserRole[]
}

export function MainLayout({ 
  children, 
  title,
  description,
  breadcrumbs,
  actions,
  sidebar = true,
  sidebarCollapsed: initialCollapsed = false,
  showHeader = true,
  containerClassName,
  mainClassName,
  requireAuth = true,
  allowedRoles = ['system_admin', 'tenant_admin', 'instructor', 'staff', 'viewer']
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 모바일에서 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, isMobile])

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(prev => !prev)
    } else {
      setSidebarCollapsed(prev => !prev)
    }
  }, [isMobile])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  // ESC 키로 모바일 메뉴 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen, closeMobileMenu])

  const content = (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 모바일 오버레이 */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* 사이드바 */}
      {sidebar && (
        <>
          {/* 데스크톱 사이드바 */}
          <div className={cn(
            'hidden lg:flex transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}>
            <AdaptiveSidebar 
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              className="h-full"
            />
          </div>

          {/* 모바일 사이드바 */}
          {isMobile && (
            <div className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
              <AdaptiveSidebar 
                collapsed={false}
                onToggle={closeMobileMenu}
                className="h-full bg-white shadow-xl"
              />
            </div>
          )}
        </>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        {showHeader && (
          <Header 
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            showSidebarToggle={sidebar}
            actions={actions}
          />
        )}

        {/* 브레드크럼 */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        {/* 페이지 설명 */}
        {description && (
          <div className="bg-white border-b border-gray-200 px-4 py-2 sm:px-6">
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <main className={cn(
          'flex-1 overflow-y-auto',
          mainClassName
        )}>
          <div className={cn(
            'container mx-auto px-4 py-6 sm:px-6 lg:px-8',
            containerClassName
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )

  // 인증이 필요한 경우 AuthGuard로 감싸기
  if (requireAuth) {
    return (
      <AuthGuard 
        requireAuth={true}
        allowedRoles={allowedRoles}
      >
        {content}
      </AuthGuard>
    )
  }

  return content
}

/**
 * 간소화된 레이아웃 (사이드바 없음)
 */
export function MinimalLayout({ 
  children, 
  title,
  containerClassName,
  mainClassName
}: Pick<LayoutProps, 'children' | 'title' | 'containerClassName' | 'mainClassName'>) {
  return (
    <MainLayout
      sidebar={false}
      showHeader={true}
      title={title}
      containerClassName={containerClassName}
      mainClassName={mainClassName}
      requireAuth={false}
    >
      {children}
    </MainLayout>
  )
}

/**
 * 전체 화면 레이아웃 (헤더/사이드바 없음)
 */
export function FullscreenLayout({ 
  children,
  containerClassName
}: Pick<LayoutProps, 'children' | 'containerClassName'>) {
  return (
    <div className={cn('h-screen w-screen overflow-hidden', containerClassName)}>
      {children}
    </div>
  )
}