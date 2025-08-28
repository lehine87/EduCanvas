'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SubTabCategory } from '@/types/navigation'

/**
 * SubTabMenu Props
 */
interface SubTabMenuProps {
  /** 서브탭 카테고리 목록 */
  subtabs: SubTabCategory[]
  /** 현재 활성화된 경로 */
  currentPath?: string
  /** 추가 CSS 클래스 */
  className?: string
  /** 메뉴가 표시될지 여부 (이제 CSS로 제어) */
  isVisible: boolean
}

/**
 * 서브탭 메뉴 컴포넌트
 * 메인 탭 hover 시 나타나는 드롭다운 서브메뉴
 * 
 * 특징:
 * - 마우스 오버 시 부드러운 애니메이션으로 등장
 * - 현재 경로 기반 활성화 표시
 * - 브랜드 색상 적용
 * - 접근성 지원
 */
export const SubTabMenu = memo<SubTabMenuProps>(({
  subtabs,
  currentPath,
  className,
  isVisible
}) => {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  
  if (!subtabs || subtabs.length === 0) return null

  return (
    <div 
      className={cn(
        // 기본 포지셔닝 및 스타일 - 헤더 끝에 정확히 맞춤 (15px 완벽 조정)
        'absolute top-full left-0 z-50 min-w-[480px] w-max mt-[15px]',
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
        'rounded-lg shadow-xl',
        'p-4',
        // 연결 영역을 위한 before 가상 요소 - 더 크게 (15px 완벽 조정)
        'before:content-[""] before:absolute before:-top-[15px] before:-left-4 before:-right-4 before:h-[23px] before:bg-transparent',
        className
      )}
    >
      {/* 위쪽 화살표 */}
      <div className="absolute -top-2 left-6 w-4 h-4 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45" />
      
      {/* 중분류/소분류 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {subtabs.map((category, categoryIndex) => {
          // 이 카테고리에 활성화된 아이템이 있는지 확인
          const hasActiveItem = category.items.some(item => currentPath === item.href)
          // 이 카테고리에 호버된 아이템이 있는지 확인
          const hasHoveredItem = hoveredItem && category.items.some(item => item.id === hoveredItem)
          
          return (
            <div key={category.id} className="space-y-2">
              {/* 중분류 헤더 (비클릭 가능) */}
              <div className="px-2 py-1">
                <h3 className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  'text-neutral-500 dark:text-neutral-400',
                  // 활성화된 아이템이 있거나 호버된 아이템이 있으면 브랜드 색상
                  (hasActiveItem || hasHoveredItem) && 'text-educanvas-600 dark:text-educanvas-400'
                )}>
                  {category.label}
                </h3>
              </div>
              
              {/* 중분류와 소분류 간 구분선 */}
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-2" />
              
              {/* 소분류 리스트 */}
              <div className="space-y-1">
                {category.items.map((item, itemIndex) => {
                  const isActive = currentPath === item.href
                  const isHovered = hoveredItem === item.id
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        // 기본 스타일 - 세로로 더 좋게
                        'group flex items-start px-3 py-2 rounded-md transition-colors duration-150',
                        'text-sm',
                        // 활성화 상태
                        isActive ? [
                          'text-educanvas-700 dark:text-educanvas-300 font-medium'
                        ] : [
                          'text-neutral-700 dark:text-neutral-300',
                          // 호버 시 글자만 진하게, 브랜드 색깔로
                          'hover:text-educanvas-700 dark:hover:text-educanvas-300 hover:font-medium'
                        ]
                      )}
                      role="menuitem"
                      tabIndex={isVisible ? 0 : -1}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="flex-1 min-w-0">
                        {/* 소분류 제목 */}
                        <div className="truncate">
                          {item.label}
                        </div>
                        
                        {/* 소분류 설명 */}
                        <div className={cn(
                          'mt-0.5 text-xs truncate',
                          isActive 
                            ? 'text-educanvas-600 dark:text-educanvas-400' 
                            : 'text-neutral-500 dark:text-neutral-400'
                        )}>
                          {item.description}
                        </div>
                      </div>
                      
                      {/* 활성화 인디켌이터 */}
                      {isActive && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-educanvas-500 rounded-full" />
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

SubTabMenu.displayName = 'SubTabMenu'