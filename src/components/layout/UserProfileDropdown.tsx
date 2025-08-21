'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  UserCircleIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { UserProfileDropdownProps, UserMenuItem } from './types'

/**
 * 사용자 프로필 드롭다운 컴포넌트
 * @description 사용자 정보와 메뉴를 표시하는 드롭다운
 */
export function UserProfileDropdown({
  user: userProp,
  menuItems: customMenuItems,
  onSignOut: customSignOut
}: UserProfileDropdownProps = {}) {
  const { user: authUser, profile: authProfile, signOut: authSignOut } = useAuthStore()
  const { role, isAdmin } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)


  // Props 또는 Auth Store에서 사용자 정보 가져오기
  const user = userProp || (authUser && authProfile ? {
    email: authUser.email || '',
    name: authProfile.name || authUser.email?.split('@')[0],
    role: role || authProfile.role, // usePermissions의 role을 우선 사용
    avatar: authProfile.avatar_url
  } : undefined)

  const handleSignOut = customSignOut || authSignOut

  // 시스템 관리자 여부
  const isSystemAdmin = role === 'system_admin' || role === 'developer'

  // 기본 메뉴 아이템
  const defaultMenuItems: UserMenuItem[] = [
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
      show: isAdmin
    },
    {
      name: '시스템 관리',
      href: '/system-admin',
      icon: ShieldCheckIcon,
      show: isSystemAdmin
    },
    {
      name: '도움말',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      show: true
    },
    {
      name: '문서',
      href: '/docs',
      icon: DocumentTextIcon,
      show: true
    },
    {
      divider: true,
      name: 'divider',
      show: true
    },
    {
      name: '로그아웃',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleSignOut,
      variant: 'danger',
      show: true
    }
  ]

  const menuItems = customMenuItems || defaultMenuItems

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // 프로필이 로딩 중일 때는 렌더링하지 않음
  if (!authUser || !authProfile || !authProfile.role) {
    return null
  }

  // 사용자 정보가 없으면 렌더링하지 않음
  if (!user) return null

  // 사용자 이니셜 생성
  const userInitial = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'

  // 역할 라벨 한글화
  const roleLabels: Record<string, string> = {
    system_admin: '시스템 관리자',
    tenant_admin: '테넌트 관리자',
    instructor: '강사',
    staff: '스태프',
    viewer: '뷰어',
    developer: '개발자'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors',
          isOpen && 'bg-gray-100'
        )}
        aria-label="사용자 메뉴"
      >
        {/* 프로필 이미지 또는 아이콘 */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || '사용자'}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {userInitial}
            </span>
          </div>
        )}

        {/* 사용자 정보 (데스크톱) */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.name || user.email?.split('@')[0]}
          </div>
          {user.role && (
            <div className="text-xs text-gray-500">
              {roleLabels[user.role] || user.role}
            </div>
          )}
        </div>

        {/* 드롭다운 화살표 */}
        <ChevronDownIcon className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* 사용자 정보 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || '사용자'}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-600">
                    {userInitial}
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {user.name || user.email?.split('@')[0]}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email}
                </div>
                {user.role && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 mt-1"
                  >
                    {roleLabels[user.role] || user.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 테마 토글 */}
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">테마</span>
              <ThemeToggle />
            </div>
          </div>

          {/* 메뉴 아이템 */}
          <div className="py-1">
            {menuItems
              .filter(item => item.show !== false)
              .map((item, index) => {
                // 구분선
                if (item.divider) {
                  return (
                    <div 
                      key={`divider-${index}`} 
                      className="border-t border-gray-100 my-1" 
                    />
                  )
                }

                const Icon = item.icon

                // 링크 아이템
                if (item.href) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                        item.variant === 'danger' 
                          ? 'text-red-700 hover:bg-red-50' 
                          : 'text-gray-700'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {Icon && <Icon className="h-4 w-4 mr-3" />}
                      {item.name}
                    </Link>
                  )
                }

                // 버튼 아이템
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick()
                      }
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                      item.variant === 'danger' 
                        ? 'text-red-700 hover:bg-red-50' 
                        : 'text-gray-700'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 mr-3" />}
                    {item.name}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 간소화된 사용자 메뉴 (모바일용)
 */
export function MobileUserMenu({
  user,
  onSignOut
}: Pick<UserProfileDropdownProps, 'user' | 'onSignOut'>) {
  const { user: authUser, profile: authProfile, signOut: authSignOut } = useAuthStore()
  
  const currentUser = user || (authUser ? {
    email: authUser.email || '',
    name: authUser.email?.split('@')[0]
  } : undefined)

  const handleSignOut = onSignOut || authSignOut

  if (!currentUser) return null

  return (
    <div className="px-4 py-3 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {currentUser.name || currentUser.email?.split('@')[0]}
            </div>
            <div className="text-xs text-gray-500">
              {currentUser.email}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:text-red-700"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}