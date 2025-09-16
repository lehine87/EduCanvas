import React, { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SubTabMenu } from './SubTabMenu'
import type { TabItem as TabItemType } from '@/types/navigation'

interface TabItemProps {
  tab: TabItemType
  isActive: boolean
  onClick?: () => void
  shortcutIndex?: number
}

/**
 * 개별 탭 아이템 컴포넌트
 * 헤더용 내비게이션 탭 (글자 길이에 맞춤)
 * hover 시 서브메뉴 지원
 */
export function TabItem({ tab, isActive, onClick, shortcutIndex }: TabItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  // CSS hover로 제어하므로 useState 삭제
  // const [isHovered, setIsHovered] = useState(false)
  // const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const Icon = tab.icon

  const handleClick = () => {
    onClick?.()
    router.push(tab.href)
  }

  // CSS hover로 제어하므로 마우스 이벤트 핸들러 삭제


  // 서브탭 카테고리가 있는지 확인
  const hasSubTabs = tab.subtabs && tab.subtabs.length > 0

  return (
    <div 
      className="relative group" // group 클래스 추가로 CSS hover 제어
    >
      <button
        onClick={handleClick}
        className={cn(
          // 기본 스타일 - 라운드 버튼 스타일 적용
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full',
          'transition-all duration-200 ease-in-out relative',
          'focus:outline-none focus:ring-2 focus:ring-educanvas-500/50 focus:ring-offset-2 focus:ring-offset-transparent',

          // 활성 상태 스타일
          isActive ? [
            'bg-educanvas-500',
            'text-educanvas-contrast',
            'shadow-md'
          ] : [
            // 비활성 상태 스타일
            'text-gray-600 dark:text-gray-400',
            'hover:text-gray-900 dark:hover:text-gray-100',
            'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
          ]
        )}
        aria-label={tab.description || tab.label}
        aria-haspopup={hasSubTabs ? 'menu' : undefined}
      >
        <Icon className={cn(
          'h-4 w-4 flex-shrink-0',
          isActive
            ? 'text-educanvas-contrast'
            : 'text-gray-500 dark:text-gray-400'
        )} />
        
        <span className="truncate whitespace-nowrap">
          {tab.label}
        </span>
        
        {/* 배지 표시 */}
        {tab.badge !== undefined && tab.badge > 0 && (
          <Badge 
            className={cn(
              'min-w-[18px] h-[18px] px-1.5 text-xs font-bold ml-1',
              'bg-growth-500 text-growth-contrast border-0',
              'flex items-center justify-center rounded-full'
            )}
          >
            {tab.badge > 99 ? '99+' : tab.badge}
          </Badge>
        )}

        {/* 서브메뉴 인디케이터 */}
        {hasSubTabs && (
          <svg 
            className="ml-1 h-3 w-3 text-text-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* 서브메뉴 - CSS hover로 제어 */}
      {hasSubTabs && (
        <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <SubTabMenu
            subtabs={tab.subtabs!}
            currentPath={pathname}
            isVisible={true} // CSS로 제어하므로 항상 true
          />
        </div>
      )}
    </div>
  )
}