'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSearchStore, useSearchIsOpen } from '@/lib/stores/searchStore'
import SearchInput from './SearchInput'
import SearchFilters from './SearchFilters'
import SearchResults from './SearchResults'
import RecentSearches from './RecentSearches'

interface SearchSidebarProps {
  className?: string
  title?: string
  subtitle?: string
  context?: 'students' | 'classes' | 'staff' | 'schedule' | 'dashboard'
  children?: React.ReactNode
}

export default function SearchSidebar({ 
  className = '', 
  title = '페이지 검색',
  subtitle,
  context = 'dashboard',
  children
}: SearchSidebarProps) {
  const isOpen = useSearchIsOpen()
  const { closeSidebar, openSidebar, query, results, loading } = useSearchStore()
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

  // Keyboard navigation (only when sidebar is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle these keys when sidebar is open
      if (!isOpen) return

      // Close on ESC
      if (e.key === 'Escape') {
        closeSidebar()
        return
      }

      // Arrow key navigation when there are results
      if (results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          )
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault()
          // Navigate to selected result
          const selectedResult = results[selectedIndex]
          if (selectedResult) {
            closeSidebar()
            // Navigate based on result type
            switch (selectedResult.type) {
              case 'student':
                window.location.href = `/students/${selectedResult.id}`
                break
              case 'class':
                window.location.href = `/classes/${selectedResult.id}`
                break
              case 'staff':
                window.location.href = `/staff/${selectedResult.id}`
                break
              case 'schedule':
                window.location.href = `/schedule/${selectedResult.id}`
                break
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeSidebar, openSidebar, results, selectedIndex])

  // Close sidebar when clicking outside
  const handleBackdropClick = useCallback(() => {
    closeSidebar()
  }, [closeSidebar])

  // Context configuration
  const getContextConfig = (ctx: string) => {
    switch (ctx) {
      case 'students':
        return {
          placeholder: '학생 이름, 학번, 전화번호로 검색...',
          title: '학생 검색',
          subtitle: '학생 정보를 빠르게 찾아보세요',
          showFilters: false // 학생 관리에서는 필터 불필요 (인적사항 표시 중심)
        }
      case 'classes':
        return {
          placeholder: '수업명, 강사명, 강의실로 검색...',
          title: '수업 필터',
          subtitle: '조건을 설정하여 수업을 필터링하세요',
          showFilters: true // 클래스 관리에서는 필터 항상 노출
        }
      case 'staff':
        return {
          placeholder: '강사명, 부서, 역할로 검색...',
          title: '직원 검색',
          subtitle: '직원 정보를 빠르게 찾아보세요',
          showFilters: false // 직원 관리에서는 필터 불필요 (인적사항 표시 중심)
        }
      case 'schedule':
        return {
          placeholder: '일정, 시간, 강의실로 검색...',
          title: '일정 검색',
          subtitle: '일정을 검색하고 관리하세요',
          showFilters: true // 일정에서는 날짜/시간 필터 항상 노출
        }
      default:
        return {
          placeholder: '이름, 전화번호, 학번으로 검색...',
          title: '통합 검색',
          subtitle: '전체 데이터를 검색하세요',
          showFilters: true // 대시보드에서는 필터 항상 노출
        }
    }
  }
  
  const contextConfig = getContextConfig(context)

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
            className={`
              fixed top-0 left-0 h-full w-80 z-50
              bg-white dark:bg-neutral-950
              border-r border-neutral-200 dark:border-neutral-800
              shadow-xl dark:shadow-none
              flex flex-col
              ${className}
            `}
            role="search"
            aria-label="통합 검색 사이드바"
            aria-expanded={isOpen}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-educanvas-500 dark:text-educanvas-400" />
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {title || contextConfig.title}
                  </h2>
                </div>
                {(subtitle || contextConfig.subtitle) && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-7">
                    {subtitle || contextConfig.subtitle}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
                className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="검색 사이드바 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <SearchInput 
                context={context}
                placeholder={contextConfig.placeholder}
              />
            </div>

            {/* Filters - Show based on context */}
            {contextConfig.showFilters && (
              <div className="px-4 pb-4">
                <SearchFilters />
              </div>
            )}

            {/* Content Area */}
            <ScrollArea className="flex-1 px-4">
              {children ? (
                // Custom context content
                children
              ) : (
                // Default search content
                query.length >= 2 ? (
                  <SearchResults selectedIndex={selectedIndex} />
                ) : (
                  <RecentSearches />
                )
              )}
            </ScrollArea>

            {/* Footer with shortcuts */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                      ↑↓
                    </kbd>
                    <span>탐색</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                      Enter
                    </kbd>
                    <span>선택</span>
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                    ESC
                  </kbd>
                  <span>닫기</span>
                </span>
              </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-educanvas-500 border-t-transparent" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    검색 중...
                  </span>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating Search Button (Mobile) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
            onClick={openSidebar}
            className="fixed bottom-6 right-6 z-40 lg:hidden h-14 w-14 bg-educanvas-500 hover:bg-educanvas-600 text-white rounded-full shadow-lg flex items-center justify-center"
            aria-label="검색 열기"
          >
            <Search className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}