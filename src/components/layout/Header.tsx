'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuthStore'
import { useVisibleTabs } from '@/lib/stores/navigationStore'
import { TabNavigation } from '@/components/navigation/TabNavigation'
import { UserMenu } from '@/components/navigation/UserMenu'

interface MainHeaderProps {
  className?: string
}

/**
 * 메인 헤더 컴포넌트
 * 학원 브랜딩 + 탭 네비게이션 + 사용자 메뉴
 * 브랜드 컬러 배경 + 흰색 텍스트
 */
export function Header({ className }: MainHeaderProps) {
  const { profile } = useAuth()
  const visibleTabs = useVisibleTabs()

  return (
    <header className={cn(
      'sticky top-0 z-30',
      'bg-educanvas-500 border-b border-educanvas-600 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between h-16 px-6">
        {/* 학원 브랜딩 */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
              {profile?.tenants?.name?.charAt(0) || profile?.tenant_id?.slice(0, 1)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-bold text-white">
            {profile?.tenants?.name || '학원명'}
          </h1>
        </div>
        
        {/* 구분선 */}
        <div className="h-6 w-px bg-white/30 mx-6" />
        
        {/* 탭 네비게이션 */}
        <div className="flex-1">
          <TabNavigation />
        </div>
        
        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-4 ml-6">
          {/* 키보드 단축키 힌트 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="hidden lg:block px-2 py-1 bg-white/20 rounded text-xs text-white/70">
              Ctrl+1~{visibleTabs.length}
            </div>
          )}
          
          {/* 현업 SaaS 스타일 사용자 메뉴 */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * 페이지 헤더 컴포넌트 (페이지 내부용)
 */
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{ name: string; href?: string }>
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  breadcrumbs 
}: PageHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
      {/* 브레드크럼 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={item.name} className="flex items-center">
                {index > 0 && (
                  <span className="mr-2 text-gray-400">/</span>
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-gray-900">{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* 제목과 액션 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}