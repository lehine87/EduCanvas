'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useNavigationStore, useCurrentTab, useVisibleTabs, syncTabWithPath } from '@/lib/stores/navigationStore'
import { TabItem } from './TabItem'

interface TabNavigationProps {
  className?: string
}

/**
 * 탭 네비게이션 컴포넌트
 * 권한 기반 동적 탭 메뉴만 담당
 */
export function TabNavigation({ className }: TabNavigationProps) {
  const pathname = usePathname()
  const currentTab = useCurrentTab()
  const visibleTabs = useVisibleTabs()
  const { setCurrentTab } = useNavigationStore()

  // URL 경로와 탭 상태 동기화
  useEffect(() => {
    syncTabWithPath(pathname)
  }, [pathname])

  // 키보드 단축키 (Ctrl + 1~7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      
      const key = e.key
      const keyNumber = parseInt(key)
      
      // Ctrl + 1~7: 탭 전환
      if (keyNumber >= 1 && keyNumber <= 7) {
        e.preventDefault()
        const targetTab = visibleTabs[keyNumber - 1]
        if (targetTab) {
          setCurrentTab(targetTab.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visibleTabs, setCurrentTab])

  // 탭 클릭 핸들러
  const handleTabClick = useCallback((tabId: string) => {
    setCurrentTab(tabId)
  }, [setCurrentTab])

  // 권한으로 인해 탭이 없는 경우
  if (visibleTabs.length === 0) {
    return (
      <div className={cn(
        'h-12 px-4 border-b border-white/20',
        'bg-educanvas-500',
        'flex items-center justify-center',
        className
      )}>
        <span className="text-sm text-white/70">
          접근 가능한 메뉴가 없습니다.
        </span>
      </div>
    )
  }

  return (
    <nav className={cn(
      'flex items-center gap-1',
      className
    )}>
      {visibleTabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={currentTab === tab.id}
          onClick={() => handleTabClick(tab.id)}
          shortcutIndex={index + 1}
        />
      ))}
    </nav>
  )
}