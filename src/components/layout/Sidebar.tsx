'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions, useNavigationPermissions } from '@/hooks/usePermissions'
import { RoleGuard, PermissionGuard } from '@/components/auth/PermissionGuard'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/auth.types'

// 아이콘 임포트 (Heroicons 사용)
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

/**
 * 네비게이션 아이템 타입
 */
interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRoles?: UserRole[]
  requiredPermissions?: string[]
  children?: NavigationItem[]
  badge?: string | number
  description?: string
}

/**
 * 네비게이션 아이템 설정
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: '대시보드',
    href: '/admin',
    icon: HomeIcon,
    requiredRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    description: '전체 현황 보기'
  },
  {
    name: '학생 관리',
    href: '/admin/students',
    icon: UsersIcon,
    requiredRoles: ['system_admin', 'admin', 'staff'],
    description: '학생 정보 및 등록 관리'
  },
  {
    name: '강사 관리',
    href: '/admin/instructors',
    icon: AcademicCapIcon,
    requiredRoles: ['system_admin', 'admin'],
    description: '강사 정보 및 배정 관리'
  },
  {
    name: '클래스 관리',
    href: '/admin/classes',
    icon: BookOpenIcon,
    requiredRoles: ['system_admin', 'admin', 'instructor', 'staff'],
    description: '클래스 및 수업 관리'
  },
  {
    name: '결제 관리',
    href: '/admin/payments',
    icon: CreditCardIcon,
    requiredRoles: ['system_admin', 'admin', 'staff'],
    description: '수강료 및 결제 관리'
  },
  {
    name: '출결 관리',
    href: '/admin/attendance',
    icon: ClipboardDocumentListIcon,
    requiredRoles: ['system_admin', 'admin', 'instructor', 'staff'],
    description: '학생 출결 현황'
  },
  {
    name: '일정 관리',
    href: '/admin/schedule',
    icon: CalendarIcon,
    requiredRoles: ['system_admin', 'admin', 'instructor', 'staff'],
    description: '수업 일정 및 스케줄'
  },
  {
    name: '분석 및 리포트',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    requiredRoles: ['system_admin', 'admin', 'instructor'],
    description: '통계 및 분석 데이터'
  },
  {
    name: '내 수업',
    href: '/instructor/classes',
    icon: BookOpenIcon,
    requiredRoles: ['instructor'],
    description: '담당 수업 관리'
  },
  {
    name: '설정',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
    requiredRoles: ['system_admin', 'admin'],
    description: '시스템 설정',
    children: [
      {
        name: '일반 설정',
        href: '/admin/settings/general',
        icon: Cog6ToothIcon,
        requiredRoles: ['system_admin', 'admin']
      },
      {
        name: '사용자 관리',
        href: '/admin/settings/users',
        icon: UserGroupIcon,
        requiredRoles: ['system_admin', 'admin']
      },
      {
        name: '권한 관리',
        href: '/admin/settings/permissions',
        icon: ShieldCheckIcon,
        requiredRoles: ['system_admin', 'admin']
      }
    ]
  },
  {
    name: '시스템 관리',
    href: '/system-admin',
    icon: ShieldCheckIcon,
    requiredRoles: ['system_admin'],
    description: '시스템 전체 관리'
  }
]

/**
 * 사이드바 컴포넌트
 */
interface SidebarProps {
  className?: string
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ className, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { role, user } = usePermissions()
  const navigationPermissions = useNavigationPermissions()

  // 현재 사용자 역할에 따라 표시할 네비게이션 아이템 필터링
  const visibleNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => {
      // 역할 체크
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (!role || !item.requiredRoles.includes(role as any)) {
          return false
        }
      }

      // 권한 체크 (추가적인 세밀한 제어)
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        // 여기서 실제 권한 체크 로직 추가 가능
        return true // 일단 허용
      }

      return true
    }).map(item => ({
      ...item,
      children: item.children?.filter(child => {
        if (child.requiredRoles && child.requiredRoles.length > 0) {
          return role && child.requiredRoles.includes(role as any)
        }
        return true
      })
    }))
  }, [role])

  // 활성 상태 체크
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // 네비게이션 아이템 렌더링
  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            depth > 0 && 'ml-4',
            active
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            collapsed && 'justify-center px-2'
          )}
        >
          <item.icon
            className={cn(
              'flex-shrink-0 h-5 w-5',
              active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
              !collapsed && 'mr-3'
            )}
          />
          {!collapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>

        {/* 하위 메뉴 */}
        {hasChildren && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-900">EduCanvas</h1>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* 사용자 정보 */}
      {!collapsed && user && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">
              {user.email}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map(item => renderNavItem(item))}
      </nav>

      {/* 푸터 */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            EduCanvas v4.1
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 네비게이션 아이템을 권한별로 필터링하는 훅
 */
export function useFilteredNavigation() {
  const { role } = usePermissions()
  
  return useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => {
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        return role && item.requiredRoles.includes(role as any)
      }
      return true
    })
  }, [role])
}

/**
 * 역할별 빠른 네비게이션 링크
 */
export function QuickNavigation() {
  const { role, isAdmin, isInstructor, isStaff } = usePermissions()
  const isSystemAdmin = role === 'system_admin' || role === 'developer'

  const quickLinks = useMemo(() => {
    const links = []

    if (isSystemAdmin) {
      links.push(
        { name: '시스템 관리', href: '/system-admin', icon: ShieldCheckIcon },
        { name: '테넌트 관리', href: '/system-admin/tenants', icon: BuildingOfficeIcon }
      )
    }

    if (isAdmin) {
      links.push(
        { name: '대시보드', href: '/admin', icon: HomeIcon },
        { name: '학생 관리', href: '/admin/students', icon: UsersIcon },
        { name: '강사 관리', href: '/admin/instructors', icon: AcademicCapIcon }
      )
    }

    if (isInstructor) {
      links.push(
        { name: '내 수업', href: '/instructor/classes', icon: BookOpenIcon },
        { name: '출결 관리', href: '/admin/attendance', icon: ClipboardDocumentListIcon }
      )
    }

    if (isStaff) {
      links.push(
        { name: '학생 등록', href: '/admin/students/create', icon: UsersIcon },
        { name: '결제 처리', href: '/admin/payments', icon: CreditCardIcon }
      )
    }

    return links
  }, [role, isSystemAdmin, isAdmin, isInstructor, isStaff])

  if (quickLinks.length === 0) return null

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-2">빠른 접근</h3>
      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center p-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
          >
            <link.icon className="h-4 w-4 mr-2" />
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  )
}