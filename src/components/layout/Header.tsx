'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'

// 아이콘 임포트
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'

/**
 * 헤더 컴포넌트
 */
interface HeaderProps {
  title?: string
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
}

export function Header({ 
  title, 
  sidebarCollapsed = false, 
  onToggleSidebar,
  showSidebarToggle = true 
}: HeaderProps) {
  const { user, profile, signOut } = useAuth()
  const { role, isSystemAdmin, isAdmin } = usePermissions()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 사용자 메뉴 아이템
  const userMenuItems = [
    {
      name: '내 프로필',
      href: '/admin/profile',
      icon: UserIcon,
      show: true
    },
    {
      name: '설정',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      show: isAdmin()
    },
    {
      name: '시스템 관리',
      href: '/system-admin',
      icon: ShieldCheckIcon,
      show: isSystemAdmin()
    }
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      // 로그아웃 후 로그인 페이지로 리다이렉트는 AuthProvider에서 처리
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* 좌측: 사이드바 토글 + 제목 */}
        <div className="flex items-center space-x-4">
          {/* 사이드바 토글 버튼 */}
          {showSidebarToggle && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          )}

          {/* 페이지 제목 */}
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
          )}
        </div>

        {/* 우측: 알림 + 사용자 메뉴 */}
        <div className="flex items-center space-x-4">
          {/* 알림 버튼 */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative"
            >
              <BellIcon className="h-5 w-5" />
              {/* 알림 배지 (예시) */}
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 알림 드롭다운 (구현 예정) */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  알림
                </div>
                <div className="px-4 py-3 text-sm text-gray-500">
                  새로운 알림이 없습니다.
                </div>
              </div>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">
                  {profile?.name || user?.email?.split('@')[0]}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {role?.replace('_', ' ')}
                </div>
              </div>
            </button>

            {/* 사용자 드롭다운 메뉴 */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {/* 사용자 정보 */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">
                    {profile?.name || user?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>

                {/* 메뉴 아이템들 */}
                {userMenuItems
                  .filter(item => item.show)
                  .map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Link>
                  ))}

                {/* 구분선 */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* 로그아웃 */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
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