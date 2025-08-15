'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NotificationDropdown, generateSampleNotifications } from './NotificationDropdown'
import { UserProfileDropdown } from './UserProfileDropdown'
import { cn } from '@/lib/utils'
import { Bars3Icon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { HeaderProps } from './types'

/**
 * 헤더 컴포넌트
 * @description 애플리케이션 상단 헤더
 */

export function Header({ 
  title, 
  sidebarCollapsed = false, 
  onToggleSidebar,
  showSidebarToggle = true,
  actions,
  showNotifications = true,
  showUserMenu = true
}: HeaderProps) {
  // 샘플 알림 데이터 (개발용)
  const [notifications] = useState(() => generateSampleNotifications())
  const unreadCount = notifications.filter(n => !n.read).length

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

        {/* 우측: 액션 + 알림 + 사용자 메뉴 */}
        <div className="flex items-center space-x-4">
          {/* 커스텀 액션 */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}

          {/* 알림 드롭다운 */}
          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={(id) => {
                console.log('Mark as read:', id)
              }}
              onMarkAllAsRead={() => {
                console.log('Mark all as read')
              }}
              onViewAll={() => {
                console.log('View all notifications')
              }}
            />
          )}

          {/* 사용자 프로필 드롭다운 */}
          {showUserMenu && (
            <UserProfileDropdown />
          )}
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