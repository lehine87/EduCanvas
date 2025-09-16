'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuthStore'
import { useVisibleTabs } from '@/lib/stores/navigationStore'
import { TabNavigation } from '@/components/navigation/TabNavigation'
import { UserMenu } from '@/components/navigation/UserMenu'
import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface MainHeaderProps {
  className?: string
  title?: string
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
}

/**
 * 메인 헤더 컴포넌트
 * 학원 브랜딩 + 탭 네비게이션 + 사용자 메뉴
 * 브랜드 컬러 배경 + 흰색 텍스트
 */
export function Header({ 
  className, 
  title, 
  sidebarCollapsed, 
  onToggleSidebar, 
  showSidebarToggle 
}: MainHeaderProps) {
  // ✅ 개선: 지속된 데이터 사용하여 깜빡거림 방지
  const { profile, effectiveProfile } = useAuth()
  const visibleTabs = useVisibleTabs()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className={cn(
      'sticky top-0 z-30',
      'bg-gray-50 dark:bg-gray-950',
      className
    )}>
      <div className="flex items-center justify-between h-16 px-6">
        {/* 학원 브랜딩 - 왼쪽 고정 */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-educanvas-500 text-white text-sm font-bold">
              {/* ✅ 개선: 지속된 데이터 우선 사용 */}
              {profile?.tenants?.name?.charAt(0) ||
               ('tenantName' in (effectiveProfile || {}) ? (effectiveProfile as any).tenantName?.charAt(0) : '') ||
               effectiveProfile?.tenant_id?.slice(0, 1)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {/* ✅ 개선: 실제 데이터 우선, 로딩 중에는 기본값 표시 */}
            {profile?.tenants?.name || (effectiveProfile ? (('tenantName' in effectiveProfile ? (effectiveProfile as any).tenantName : '') || '학원명') : '학원명')}
          </h1>
        </div>

        {/* 중앙 탭 네비게이션 - 라운드 버튼 스타일 */}
        <div className="flex-1 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
            <TabNavigation />
          </div>
        </div>

        {/* 오른쪽 사용자 메뉴 영역 */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          {/* 키보드 단축키 힌트 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="hidden lg:block px-3 py-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-full text-xs text-gray-600 dark:text-gray-400 backdrop-blur-sm">
              Ctrl+1~{visibleTabs.length}
            </div>
          )}

          {/* 다크모드 토글 버튼 - 라운드 스타일 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-all duration-200 group backdrop-blur-sm"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-gray-400 group-hover:text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              )}
            </motion.div>
          </motion.button>

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