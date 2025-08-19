'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth/authClient'

// 아이콘 임포트 (Heroicons 사용)
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClockIcon,
  DocumentTextIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PresentationChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

/**
 * 학원 관리자 네비게이션 아이템 타입
 */
interface TenantNavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: TenantNavigationItem[]
  badge?: string | number
  description?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}

/**
 * 학원 관리자 네비게이션 아이템 설정
 */
const TENANT_NAVIGATION_ITEMS: TenantNavigationItem[] = [
  {
    name: '대시보드',
    href: '/tenant-admin',
    icon: HomeIcon,
    description: '학원 관리 현황',
    color: 'blue'
  },
  {
    name: '회원 관리',
    href: '/tenant-admin/members',
    icon: UsersIcon,
    description: '학원 회원 관리',
    color: 'green',
    children: [
      {
        name: '전체 회원',
        href: '/tenant-admin/members',
        icon: UserGroupIcon,
        description: '모든 회원 목록'
      },
      {
        name: '승인 대기',
        href: '/tenant-admin/members/pending',
        icon: ClockIcon,
        description: '가입 승인 대기 중인 회원',
        color: 'yellow'
      },
      {
        name: '활성 회원',
        href: '/tenant-admin/members/active',
        icon: CheckCircleIcon,
        description: '활성화된 회원',
        color: 'green'
      },
      {
        name: '비활성 회원',
        href: '/tenant-admin/members/inactive',
        icon: XCircleIcon,
        description: '비활성화된 회원',
        color: 'red'
      }
    ]
  },
  {
    name: '학생 관리',
    href: '/admin/students',
    icon: AcademicCapIcon,
    description: '학생 정보 및 관리',
    color: 'blue',
    children: [
      {
        name: '전체 학생',
        href: '/admin/students',
        icon: UserGroupIcon,
        description: '모든 학생 목록 및 관리'
      },
      {
        name: '학생 등록',
        href: '/admin/students/new',
        icon: PlusIcon,
        description: '새 학생 등록',
        color: 'green'
      },
      {
        name: '학생 대시보드',
        href: '/admin/students/dashboard',
        icon: PresentationChartBarIcon,
        description: '학생 통계 및 현황',
        color: 'purple'
      },
      {
        name: '스마트 검색',
        href: '/admin/students/smart',
        icon: MagnifyingGlassIcon,
        description: 'AI 기반 학생 검색',
        color: 'yellow'
      }
    ]
  },
  {
    name: '권한 관리',
    href: '/tenant-admin/permissions',
    icon: ShieldCheckIcon,
    description: '역할 및 권한 설정',
    color: 'purple',
    children: [
      {
        name: '역할 관리',
        href: '/tenant-admin/permissions/roles',
        icon: UserGroupIcon,
        description: '사용자 역할 관리'
      },
      {
        name: '권한 설정',
        href: '/tenant-admin/permissions/settings',
        icon: Cog6ToothIcon,
        description: '세부 권한 설정'
      }
    ]
  },
  {
    name: '통계 및 분석',
    href: '/tenant-admin/analytics',
    icon: ChartBarIcon,
    description: '사용자 및 활동 통계',
    color: 'purple'
  },
  {
    name: '알림 관리',
    href: '/tenant-admin/notifications',
    icon: BellIcon,
    description: '시스템 알림 관리',
    color: 'yellow'
  },
  {
    name: '감사 로그',
    href: '/tenant-admin/audit-logs',
    icon: DocumentTextIcon,
    description: '시스템 활동 로그',
    color: 'gray'
  },
  {
    name: '학원 설정',
    href: '/tenant-admin/settings',
    icon: Cog6ToothIcon,
    description: '학원 기본 설정',
    color: 'gray'
  }
]

/**
 * 학원 관리자 사이드바 컴포넌트
 */
interface TenantAdminSidebarProps {
  className?: string
  collapsed?: boolean
  onToggle?: () => void
  tenantName?: string
  userInfo?: {
    name?: string
    email?: string
    role?: string
  }
}

export function TenantAdminSidebar({ 
  className, 
  collapsed = false, 
  onToggle,
  tenantName,
  userInfo
}: TenantAdminSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['/tenant-admin/members', '/admin/students']))

  // 활성 상태 체크
  const isActive = (href: string) => {
    if (href === '/tenant-admin') {
      return pathname === '/tenant-admin'
    }
    return pathname.startsWith(href)
  }

  // 하위 메뉴 토글 함수
  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(href)) {
        newSet.delete(href)
      } else {
        newSet.add(href)
      }
      return newSet
    })
  }

  // 색상 클래스 매핑
  const getColorClasses = (color: string, active: boolean) => {
    if (active) {
      switch (color) {
        case 'blue': return 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
        case 'green': return 'bg-green-100 text-green-700 border-r-2 border-green-500'
        case 'yellow': return 'bg-yellow-100 text-yellow-700 border-r-2 border-yellow-500'
        case 'red': return 'bg-red-100 text-red-700 border-r-2 border-red-500'
        case 'purple': return 'bg-purple-100 text-purple-700 border-r-2 border-purple-500'
        default: return 'bg-gray-100 text-gray-700 border-r-2 border-gray-500'
      }
    }
    return 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }

  const getIconColorClasses = (color: string, active: boolean) => {
    if (active) {
      switch (color) {
        case 'blue': return 'text-blue-500'
        case 'green': return 'text-green-500'
        case 'yellow': return 'text-yellow-500'
        case 'red': return 'text-red-500'
        case 'purple': return 'text-purple-500'
        default: return 'text-gray-500'
      }
    }
    return 'text-gray-400 group-hover:text-gray-500'
  }

  // 네비게이션 아이템 렌더링
  const renderNavItem = (item: TenantNavigationItem, depth = 0) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.href)
    const showChildren = hasChildren && !collapsed && isExpanded

    const handleClick = (e: React.MouseEvent) => {
      if (hasChildren && !collapsed) {
        e.preventDefault()
        toggleExpanded(item.href)
      }
    }

    const NavContent = () => (
      <div
        className={cn(
          'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
          depth > 0 && 'ml-4',
          getColorClasses(item.color || 'gray', active),
          collapsed && 'justify-center px-2'
        )}
        onClick={hasChildren ? handleClick : undefined}
      >
        <item.icon
          className={cn(
            'flex-shrink-0 h-5 w-5',
            getIconColorClasses(item.color || 'gray', active),
            !collapsed && 'mr-3'
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  typeof item.badge === 'number' && item.badge > 0
                    ? 'bg-red-100 text-red-800'
                    : item.badge === 'NEW' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                )}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )

    return (
      <div key={item.href}>
        {hasChildren ? (
          <NavContent />
        ) : (
          <Link href={item.href}>
            <NavContent />
          </Link>
        )}

        {/* 하위 메뉴 */}
        {showChildren && (
          <div className="mt-1 space-y-1 ml-4">
            {item.children!.map(child => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                  isActive(child.href)
                    ? getColorClasses(child.color || 'gray', true).replace('border-r-2', 'border-l-2')
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <child.icon
                  className={cn(
                    'flex-shrink-0 h-4 w-4 mr-3',
                    getIconColorClasses(child.color || 'gray', isActive(child.href))
                  )}
                />
                <span className="flex-1">{child.name}</span>
                {child.badge && (
                  <span className={cn(
                    'ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                    typeof child.badge === 'number' && child.badge > 0
                      ? 'bg-red-100 text-red-800'
                      : child.badge === 'NEW' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-900">학원 관리</h1>
            {tenantName && (
              <p className="text-sm text-gray-600">{tenantName}</p>
            )}
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* 사용자 정보 */}
      {!collapsed && userInfo && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userInfo.name?.charAt(0) || userInfo.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.name || userInfo.email}
                </div>
                <div className="text-xs text-gray-500">
                  학원 관리자
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {TENANT_NAVIGATION_ITEMS.map(item => renderNavItem(item))}
      </nav>

      {/* 빠른 액션 */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              일반 관리자 모드로
            </Link>
            <button
              onClick={async () => {
                await authClient.signOut()
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 푸터 */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            EduCanvas Tenant Admin v4.1
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 학원 관리자 사이드바의 상태를 관리하는 훅
 */
export function useTenantAdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = () => setCollapsed(prev => !prev)

  return {
    collapsed,
    toggle
  }
}