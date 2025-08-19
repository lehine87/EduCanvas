'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/store/useAuthStore'
import { authClient } from '@/lib/auth/authClient'
import { cn } from '@/lib/utils'
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  allowedRoles?: string[]
}

/**
 * 메인 사이드바 - 역할별 메뉴 표시
 */
export function MainSidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // 기본 메뉴 (모든 역할 공통)
  const commonMenuItems: MenuItem[] = [
    {
      name: '대시보드',
      href: '/main',
      icon: HomeIcon,
      description: '메인 대시보드'
    },
    {
      name: '학생 관리',
      href: '/main/students',
      icon: AcademicCapIcon,
      description: '학생 정보 관리'
    },
    {
      name: '클래스 관리',
      href: '/main/classes',
      icon: UserGroupIcon,
      description: '수업 및 반 관리',
      allowedRoles: ['system_admin', 'admin', 'instructor']
    },
    {
      name: '강사 관리',
      href: '/main/instructors',
      icon: ClipboardDocumentListIcon,
      description: '강사 정보 관리',
      allowedRoles: ['system_admin', 'admin']
    },
    {
      name: '시간표',
      href: '/main/schedules',
      icon: CalendarDaysIcon,
      description: '수업 시간표'
    },
    {
      name: '수강 등록',
      href: '/main/enrollments',
      icon: CurrencyDollarIcon,
      description: '수강 신청 및 결제',
      allowedRoles: ['system_admin', 'admin', 'staff']
    },
    {
      name: '통계 및 리포트',
      href: '/main/reports',
      icon: ChartBarIcon,
      description: '운영 현황 분석',
      allowedRoles: ['system_admin', 'admin']
    }
  ]

  // 관리 메뉴를 별도 페이지 이동 대신 메인 페이지 내 섹션으로 이동하는 버튼들
  const adminMenuItems: MenuItem[] = []
  
  if (profile?.role === 'system_admin' || ['admin@test.com', 'sjlee87@kakao.com'].includes(profile?.email || '')) {
    adminMenuItems.push({
      name: '시스템 관리',
      href: '#system-admin-section',
      icon: ShieldCheckIcon,
      description: '시스템 전체 관리'
    })
  }
  
  if (profile?.role === 'admin') {
    adminMenuItems.push({
      name: '학원 관리',
      href: '#tenant-admin-section',
      icon: Cog6ToothIcon,
      description: '학원 설정 및 관리'
    })
  }

  // 역할 기반 메뉴 필터링
  const filteredMenuItems = commonMenuItems.filter(item => {
    if (!item.allowedRoles) return true
    return item.allowedRoles.includes(profile?.role || 'viewer')
  })

  const allMenuItems = [...filteredMenuItems, ...adminMenuItems]

  // 활성 메뉴 확인
  const isActive = (href: string) => {
    if (href === '/main') {
      return pathname === '/main'
    }
    return pathname.startsWith(href)
  }

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    await authClient.signOut()
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-900">EduCanvas</h1>
            <p className="text-sm text-gray-600">학원 관리 시스템</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          {collapsed ? <Bars3Icon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* 사용자 정보 */}
      {!collapsed && profile && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {profile.name?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {profile.name || profile.email?.split('@')[0]}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {profile.role === 'system_admin' ? '시스템 관리자' :
                 profile.role === 'admin' ? '학원 관리자' :
                 profile.role === 'instructor' ? '강사' :
                 profile.role === 'staff' ? '스태프' : '뷰어'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {allMenuItems.map((item) => {
          // 앵커 링크인 경우 스크롤 이동 처리
          const isAnchorLink = item.href.startsWith('#')
          
          if (isAnchorLink) {
            return (
              <button
                key={item.href}
                onClick={() => {
                  const targetId = item.href.substring(1) // # 제거
                  const targetElement = document.getElementById(targetId)
                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className={cn(
                  'w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left',
                  'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500',
                    !collapsed && 'mr-3'
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </button>
            )
          }
          
          // 일반 링크는 기존 방식 유지
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'flex-shrink-0 h-5 w-5',
                  isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                  !collapsed && 'mr-3'
                )}
              />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 프로필 및 로그아웃 */}
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-2">
          {!collapsed ? (
            <>
              <Link
                href="/main/profile"
                className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                <UserCircleIcon className="h-4 w-4 mr-3" />
                프로필
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                로그아웃
              </button>
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link
                href="/main/profile"
                className="flex justify-center p-2 text-gray-600 rounded-md hover:bg-gray-50"
                title="프로필"
              >
                <UserCircleIcon className="h-5 w-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="flex justify-center p-2 text-red-600 rounded-md hover:bg-red-50"
                title="로그아웃"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}