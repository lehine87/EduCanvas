'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { SidebarItemProps } from './types'

/**
 * 사이드바 아이템 컴포넌트
 * @description 사이드바 메뉴의 개별 아이템
 */
export function SidebarItem({
  item,
  depth = 0,
  isActive: isActiveProp,
  collapsed = false,
  onClick
}: SidebarItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 활성 상태 결정
  const isActive = isActiveProp !== undefined 
    ? isActiveProp 
    : item.isActive 
      ? item.isActive(pathname)
      : item.href === '/admin' 
        ? pathname === '/admin'
        : pathname.startsWith(item.href)

  // 하위 메뉴 존재 여부
  const hasChildren = item.children && item.children.length > 0

  // 클릭 핸들러
  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && !collapsed) {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
    if (item.onClick) {
      item.onClick()
    }
    if (onClick) {
      onClick()
    }
  }

  // 아이템 콘텐츠
  const ItemContent = () => (
    <>
      {/* 아이콘 */}
      <item.icon
        className={cn(
          'flex-shrink-0 h-5 w-5',
          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
          !collapsed && 'mr-3'
        )}
      />

      {/* 텍스트 및 배지 */}
      {!collapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          
          {/* 배지 */}
          {item.badge !== undefined && (
            <span className={cn(
              'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              item.badgeVariant === 'primary' && 'bg-blue-100 text-blue-800',
              item.badgeVariant === 'success' && 'bg-green-100 text-green-800',
              item.badgeVariant === 'warning' && 'bg-yellow-100 text-yellow-800',
              item.badgeVariant === 'danger' && 'bg-red-100 text-red-800',
              (!item.badgeVariant || item.badgeVariant === 'default') && 'bg-gray-100 text-gray-800'
            )}>
              {item.badge}
            </span>
          )}

          {/* 확장 아이콘 */}
          {hasChildren && (
            <ChevronDownIcon
              className={cn(
                'ml-auto h-4 w-4 text-gray-400 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </>
      )}

      {/* Collapsed 상태에서 툴팁용 */}
      {collapsed && item.badge !== undefined && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-text-100 text-xs">
          {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </>
  )

  // 기본 클래스
  const baseClassName = cn(
    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative',
    depth > 0 && 'ml-4',
    isActive
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    collapsed && 'justify-center px-2'
  )

  // 링크 렌더링
  if (item.href && !hasChildren) {
    return (
      <div>
        <Link
          href={item.href}
          className={baseClassName}
          onClick={onClick}
          title={collapsed ? item.name : undefined}
        >
          <ItemContent />
        </Link>
      </div>
    )
  }

  // 버튼 렌더링 (하위 메뉴가 있는 경우)
  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(baseClassName, 'w-full')}
        title={collapsed ? item.name : undefined}
      >
        <ItemContent />
      </button>

      {/* 하위 메뉴 */}
      {hasChildren && !collapsed && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarItem
              key={child.href}
              item={child}
              depth={depth + 1}
              collapsed={collapsed}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 사이드바 아이템 그룹
 */
interface SidebarItemGroupProps {
  title?: string
  items: SidebarItemProps['item'][]
  collapsed?: boolean
  onClick?: () => void
}

export function SidebarItemGroup({
  title,
  items,
  collapsed = false,
  onClick
}: SidebarItemGroupProps) {
  return (
    <div className="space-y-1">
      {title && !collapsed && (
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      
      {items.map((item) => (
        <SidebarItem
          key={item.href}
          item={item}
          collapsed={collapsed}
          onClick={onClick}
        />
      ))}
    </div>
  )
}