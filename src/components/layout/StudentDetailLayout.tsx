'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchSidebar from '@/components/search/SearchSidebar'
import { useSearchStore } from '@/lib/stores/searchStore'
import { cn } from '@/lib/utils'

interface StudentDetailLayoutProps {
  children: React.ReactNode
  showSearchSidebar?: boolean
  searchContext?: 'students' | 'classes' | 'staff' | 'schedule' | 'dashboard'
}

export default function StudentDetailLayout({ 
  children, 
  showSearchSidebar = true,
  searchContext = 'students' 
}: StudentDetailLayoutProps) {
  const pathname = usePathname()
  const { isOpen: isSearchOpen, openSidebar, closeSidebar } = useSearchStore()
  const [sidebarPersistent, setSidebarPersistent] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Check if desktop
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  // Auto-open search on desktop for student pages
  useEffect(() => {
    if (isDesktop && showSearchSidebar && pathname.includes('/students/') && !isSearchOpen) {
      openSidebar()
      setSidebarPersistent(true)
    }
  }, [isDesktop, showSearchSidebar, pathname, isSearchOpen, openSidebar])

  const toggleSidebarPersistence = () => {
    if (sidebarPersistent) {
      setSidebarPersistent(false)
      closeSidebar()
    } else {
      setSidebarPersistent(true)
      openSidebar()
    }
  }

  return (
    <div className="flex h-full min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Persistent Search Sidebar (Desktop) */}
      {isDesktop && sidebarPersistent && showSearchSidebar && (
        <div className="w-80 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="h-full relative">
            {/* Pin/Unpin Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-900"
                onClick={toggleSidebarPersistence}
                aria-label="사이드바 고정 해제"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <SearchSidebar
              className="border-0 shadow-none h-full"
              title="학생 검색"
              subtitle="학생을 검색하고 빠르게 이동하세요"
              context={searchContext}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Search Toggle (when sidebar not persistent) */}
        {showSearchSidebar && (!sidebarPersistent || !isDesktop) && (
          <div className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={isDesktop ? toggleSidebarPersistence : openSidebar}
              >
                {isDesktop ? (
                  <>
                    <Search className="h-4 w-4" />
                    <span>검색 사이드바 고정</span>
                  </>
                ) : (
                  <>
                    <Menu className="h-4 w-4" />
                    <span>검색</span>
                  </>
                )}
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="px-2">→</span>
                {pathname.includes('/students/') && pathname.includes('/edit') && (
                  <span>학생 정보 수정</span>
                )}
                {pathname.includes('/students/') && !pathname.includes('/edit') && !pathname.includes('/new') && (
                  <span>학생 상세 정보</span>
                )}
                {pathname.includes('/students/new') && (
                  <span>새 학생 등록</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Overlay Search Sidebar (Mobile/Tablet or when not persistent) */}
      {(!isDesktop || !sidebarPersistent) && showSearchSidebar && (
        <SearchSidebar
          title="학생 검색"
          subtitle="학생을 검색하고 빠르게 이동하세요"
          context={searchContext}
        />
      )}

      {/* Floating Search Button (Mobile) */}
      {!isDesktop && showSearchSidebar && !isSearchOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2 }}
          onClick={openSidebar}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 bg-educanvas-500 hover:bg-educanvas-600 text-white rounded-full shadow-lg flex items-center justify-center lg:hidden"
          aria-label="검색 열기"
        >
          <Search className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  )
}