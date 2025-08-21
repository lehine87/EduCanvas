'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions, useNavigationPermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/auth.types'
import type { Resource, Action } from '@/types/permissions.types'

// 아이콘 임포트
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
  CalendarIcon,
  BellIcon,
  RectangleStackIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

/**
 * 동적 네비게이션 아이템 타입
 */
interface AdaptiveNavigationItem {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string | number
  children?: AdaptiveNavigationItem[]
  
  // 권한 기반 표시 조건
  requiredPermissions?: {
    resource: Resource
    action: Action
  }[]
  
  // 역할 기반 표시 조건 (추가 필터)
  requiredRoles?: UserRole[]
  
  // 동적 표시 조건 함수
  shouldShow?: (permissions: unknown, role: UserRole | undefined) => boolean
  
  // 역할별 커스터마이징
  roleCustomization?: {
    [K in UserRole]?: {
      name?: string
      description?: string
      icon?: React.ComponentType<{ className?: string }>
      hidden?: boolean
    }
  }
}

/**
 * 역할별 맞춤형 네비게이션 구성
 */
const ADAPTIVE_NAVIGATION_CONFIG: AdaptiveNavigationItem[] = [
  // === 공통 메뉴 ===
  {
    id: 'dashboard',
    name: '대시보드',
    href: '/admin',
    icon: HomeIcon,
    description: '전체 현황 보기',
    roleCustomization: {
      tenant_admin: { 
        name: '학원 관리 대시보드',
        description: '학원 전체 현황 및 관리'
      },
      staff: { 
        name: '업무 대시보드',
        description: '일일 업무 현황'
      },
      instructor: { 
        name: '강의 대시보드',
        description: '담당 강의 및 학생 현황'
      }
    }
  },

  // === 학원 관리자 전용 메뉴 ===
  {
    id: 'staff-management',
    name: '직원 관리',
    href: '/admin/staff',
    icon: UserGroupIcon,
    description: '직원 정보 및 관리',
    requiredRoles: ['tenant_admin'],
    requiredPermissions: [
      { resource: 'user', action: 'read' }
    ]
  },
  {
    id: 'payroll-management',
    name: '직원 급여 관리',
    href: '/admin/payroll',
    icon: CurrencyDollarIcon,
    description: '직원 급여 및 수당 관리',
    requiredRoles: ['tenant_admin'],
    requiredPermissions: [
      { resource: 'user', action: 'read' },
      { resource: 'payment', action: 'read' }
    ]
  },
  {
    id: 'permissions',
    name: '권한 관리',
    href: '/admin/permissions',
    icon: ShieldCheckIcon,
    description: '역할 및 권한 설정',
    requiredRoles: ['tenant_admin'],
    requiredPermissions: [
      { resource: 'user', action: 'manage' }
    ]
  },
  {
    id: 'analytics',
    name: '통계 및 분석',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    description: '통계 및 분석 데이터',
    requiredPermissions: [
      { resource: 'analytics', action: 'read' }
    ],
    roleCustomization: {
      tenant_admin: { 
        name: '종합 통계 분석',
        description: '학원 전체 통계 및 분석'
      },
      instructor: { 
        name: '강의 분석',
        description: '담당 강의 성과 분석',
        hidden: false
      }
    },
    shouldShow: (permissions, role) => {
      const perms = permissions as any
      return perms?.resources?.analytics?.canRead || 
             (role === 'tenant_admin' || role === 'instructor')
    }
  },
  {
    id: 'notifications',
    name: '알림 관리',
    href: '/admin/notifications',
    icon: BellIcon,
    description: '시스템 알림 관리',
    requiredRoles: ['tenant_admin'],
    requiredPermissions: [
      { resource: 'system', action: 'read' }
    ]
  },
  {
    id: 'audit-logs',
    name: '감사 로그',
    href: '/admin/audit-logs',
    icon: DocumentTextIcon,
    description: '시스템 활동 로그',
    requiredRoles: ['tenant_admin'],
    requiredPermissions: [
      { resource: 'audit', action: 'read' }
    ]
  },
  {
    id: 'academy-settings',
    name: '학원 설정',
    href: '/admin/academy-settings',
    icon: BuildingOfficeIcon,
    description: '학원 기본 설정',
    requiredRoles: ['tenant_admin'],
    requiredPermissions: [
      { resource: 'tenant', action: 'update' }
    ]
  },

  // === 학생 관리 (행정직원, 강사 공통) ===
  {
    id: 'students',
    name: '학생 관리',
    href: '/admin/students',
    icon: UsersIcon,
    description: '학생 정보 및 등록 관리',
    requiredPermissions: [
      { resource: 'student', action: 'read' }
    ],
    roleCustomization: {
      staff: { 
        description: '학생 등록 및 정보 관리'
      },
      instructor: { 
        description: '담당 학생 정보 조회',
        name: '담당 학생'
      }
    },
    children: [
      {
        id: 'students-dashboard',
        name: '대시보드',
        href: '/admin/students/dashboard',
        icon: RectangleStackIcon,
        description: '스마트 학생관리 대시보드',
        requiredPermissions: [
          { resource: 'student', action: 'read' }
        ]
      },
      {
        id: 'students-list',
        name: '전체 목록',
        href: '/admin/students',
        icon: UsersIcon,
        description: '전체 학생 목록',
        requiredPermissions: [
          { resource: 'student', action: 'list' }
        ]
      },
      {
        id: 'students-new',
        name: '새 학생 등록',
        href: '/admin/students/new',
        icon: UsersIcon,
        description: '새로운 학생 등록',
        requiredPermissions: [
          { resource: 'student', action: 'create' }
        ],
        shouldShow: (permissions, role) => {
          return (permissions as any)?.resources?.students?.canWrite && role !== 'instructor'
        }
      }
    ]
  },

  // === 클래스 관리 (모든 역할 공통) ===
  {
    id: 'classes',
    name: '클래스 관리',
    href: '/admin/classes',
    icon: BookOpenIcon,
    description: '클래스 및 수업 관리',
    requiredPermissions: [
      { resource: 'class', action: 'read' }
    ],
    roleCustomization: {
      instructor: { 
        name: '내 클래스',
        description: '담당 클래스 관리'
      }
    }
  },

  // === 출결 관리 (모든 역할 공통) ===
  {
    id: 'attendance',
    name: '출결 관리',
    href: '/admin/attendance',
    icon: ClipboardDocumentListIcon,
    description: '학생 출결 현황',
    requiredPermissions: [
      { resource: 'attendance', action: 'read' }
    ]
  },

  // === 수납 관리 (행정직원만) ===
  {
    id: 'payments',
    name: '수납 관리',
    href: '/admin/payments',
    icon: CreditCardIcon,
    description: '수강료 및 결제 관리',
    requiredPermissions: [
      { resource: 'payment', action: 'read' }
    ],
    shouldShow: (permissions, role) => {
      return (permissions as any)?.resources?.payments?.canRead && role !== 'instructor'
    }
  },

  // === 일정 관리 (모든 역할 공통) ===
  {
    id: 'schedule',
    name: '일정 관리',
    href: '/admin/schedule',
    icon: CalendarIcon,
    description: '수업 일정 및 스케줄',
    requiredPermissions: [
      { resource: 'schedule', action: 'read' }
    ]
  },

  // === 동영상 관리 (강사만) ===
  {
    id: 'videos',
    name: '동영상 관리',
    href: '/admin/videos',
    icon: RectangleStackIcon,
    description: '강의 동영상 및 자료 관리',
    requiredPermissions: [
      { resource: 'document', action: 'read' }
    ],
    shouldShow: (permissions, role) => {
      return role === 'instructor' && (permissions as any)?.resources?.videos?.canRead
    }
  },

  // === 설정 (모든 역할 공통 - 내용은 역할별 다름) ===
  {
    id: 'settings',
    name: '설정',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
    description: '개인 및 시스템 설정',
    roleCustomization: {
      tenant_admin: { 
        description: '시스템 및 학원 설정'
      },
      staff: { 
        description: '개인 설정'
      },
      instructor: { 
        description: '개인 및 강의 설정'
      }
    }
  },

  // === 시스템 관리 (system_admin 전용) ===
  {
    id: 'system-admin',
    name: '시스템 관리',
    href: '/system-admin',
    icon: ShieldCheckIcon,
    description: '시스템 전체 관리',
    requiredRoles: ['system_admin']
  }
]

/**
 * 권한 기반 적응형 사이드바 컴포넌트
 */
interface AdaptiveSidebarProps {
  className?: string
  collapsed?: boolean
  onToggle?: () => void
}

export function AdaptiveSidebar({ className, collapsed = false, onToggle }: AdaptiveSidebarProps) {
  const pathname = usePathname()
  const permissions = usePermissions()
  const navigationPermissions = useNavigationPermissions()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['students']))

  // 실시간 권한 업데이트를 위한 상태
  const [lastPermissionHash, setLastPermissionHash] = useState<string>('')
  
  // 권한 해시 생성 (권한 변경 감지용)
  const generatePermissionHash = useCallback((perms: unknown) => {
    const p = perms as any
    const hashData = {
      role: p?.role,
      resources: p?.resources,
      userStatus: p?.user?.status,
      tenantId: p?.user?.tenant_id
    }
    return JSON.stringify(hashData)
  }, [])

  // 권한 변경 감지 및 실시간 업데이트
  useEffect(() => {
    const currentHash = generatePermissionHash(permissions)
    if (currentHash !== lastPermissionHash && lastPermissionHash !== '') {
      // 권한이 변경되었음을 감지
      console.log('🔄 권한 변경 감지 - 사이드바 메뉴 업데이트')
      
      // 권한 캐시 무효화
      if (permissions.refreshPermissions) {
        permissions.refreshPermissions()
      }
      
      // 확장된 메뉴 상태 재설정 (새로운 권한에 맞게)
      setExpandedItems(new Set(['students']))
    }
    setLastPermissionHash(currentHash)
  }, [permissions, lastPermissionHash, generatePermissionHash])

  // 글로벌 권한 변경 이벤트 리스너
  useEffect(() => {
    const handlePermissionChange = (event: CustomEvent) => {
      console.log('🔄 글로벌 권한 변경 이벤트 수신:', event.detail)
      
      // 강제로 권한 새로고침
      if (permissions.refreshPermissions) {
        permissions.refreshPermissions()
      }
      
      // 메뉴 상태 초기화
      setExpandedItems(new Set(['students']))
      
      // 사용자에게 알림 (선택사항)
      if (event.detail?.newRole !== event.detail?.previousRole) {
        console.log(`✅ 역할이 ${event.detail.previousRole}에서 ${event.detail.newRole}으로 변경되었습니다.`)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('permission-changed', handlePermissionChange as EventListener)
      
      return () => {
        window.removeEventListener('permission-changed', handlePermissionChange as EventListener)
      }
    }
    
    return () => {} // cleanup function for SSR compatibility
  }, [permissions.refreshPermissions])

  // 현재 사용자 역할에 따라 표시할 메뉴 아이템 필터링 및 커스터마이징
  const adaptiveNavItems = useMemo(() => {
    const { role, resources, hasPermission } = permissions
    
    if (!role) return []

    return ADAPTIVE_NAVIGATION_CONFIG
      .filter(item => {
        // 1. 역할 기반 필터링
        if (item.requiredRoles && !item.requiredRoles.includes(role as UserRole)) {
          return false
        }

        // 2. 권한 기반 필터링
        if (item.requiredPermissions) {
          const hasRequiredPermissions = item.requiredPermissions.every(perm => 
            hasPermission(perm.resource, perm.action)
          )
          if (!hasRequiredPermissions) return false
        }

        // 3. 커스텀 shouldShow 조건
        if (item.shouldShow && !item.shouldShow(permissions, role as UserRole)) {
          return false
        }

        // 4. 역할별 커스터마이징에서 hidden 체크
        const roleCustom = item.roleCustomization?.[role as UserRole]
        if (roleCustom?.hidden) return false

        return true
      })
      .map(item => {
        // 역할별 커스터마이징 적용
        const roleCustom = item.roleCustomization?.[role as UserRole]
        const customizedItem = { ...item }
        
        if (roleCustom) {
          if (roleCustom.name) customizedItem.name = roleCustom.name
          if (roleCustom.description) customizedItem.description = roleCustom.description
          if (roleCustom.icon) customizedItem.icon = roleCustom.icon
        }

        // 하위 메뉴도 필터링
        if (item.children) {
          customizedItem.children = item.children.filter(child => {
            if (child.requiredPermissions) {
              const hasRequiredPermissions = child.requiredPermissions.every(perm => 
                hasPermission(perm.resource, perm.action)
              )
              if (!hasRequiredPermissions) return false
            }

            if (child.shouldShow && !child.shouldShow(permissions, role as UserRole)) {
              return false
            }

            return true
          })
        }

        return customizedItem
      })
  }, [permissions, lastPermissionHash])

  // 활성 상태 체크
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // 하위 메뉴 토글
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // 네비게이션 아이템 렌더링
  const renderNavItem = (item: AdaptiveNavigationItem, depth = 0) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const showChildren = hasChildren && !collapsed && isExpanded

    const handleClick = (e: React.MouseEvent) => {
      if (hasChildren && !collapsed) {
        e.preventDefault()
        toggleExpanded(item.id)
      }
    }

    const NavContent = () => (
      <div
        className={cn(
          'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
          depth > 0 && 'ml-4',
          active
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          collapsed && 'justify-center px-2'
        )}
        onClick={hasChildren ? handleClick : undefined}
        title={collapsed ? item.description || item.name : undefined}
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
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  item.badge === 'NEW' 
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
      <div key={item.id}>
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
                key={child.id}
                href={child.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                  isActive(child.href)
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <child.icon
                  className={cn(
                    'flex-shrink-0 h-4 w-4 mr-3',
                    isActive(child.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                <span className="flex-1">{child.name}</span>
                {child.badge && (
                  <span className={cn(
                    'ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                    child.badge === 'NEW' 
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
      {!collapsed && permissions.user && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">
              {permissions.user.email}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {permissions.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {adaptiveNavItems.map(item => renderNavItem(item))}
      </nav>

      {/* 푸터 */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            EduCanvas v4.1 • {permissions.role ? `${permissions.role.replace('_', ' ')} 모드` : 'Guest'}
          </div>
        </div>
      )}
    </div>
  )
}