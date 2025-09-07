'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchSidebar from '@/components/search/SearchSidebar'
import { SmartGrid, GridItem, WidgetSizes } from '@/components/dashboard-v2/core/SmartGrid'
import { useSearchStore } from '@/lib/stores/searchStore'
import { cn } from '@/lib/utils'

// 반응형 브레이크포인트 타입
type BreakpointKey = 'mobile' | 'tablet' | 'desktop' | 'wide'

interface ResponsiveConfig {
  breakpoint: BreakpointKey
  sidebarBehavior: 'overlay' | 'persistent' | 'hidden'
  contentLayout: 'single' | 'grid' | 'masonry'
  searchPosition: 'floating' | 'header' | 'sidebar'
}

const RESPONSIVE_CONFIGS: Record<BreakpointKey, ResponsiveConfig> = {
  mobile: {
    breakpoint: 'mobile',
    sidebarBehavior: 'overlay',
    contentLayout: 'single',
    searchPosition: 'floating'
  },
  tablet: {
    breakpoint: 'tablet',
    sidebarBehavior: 'overlay',
    contentLayout: 'grid',
    searchPosition: 'header'
  },
  desktop: {
    breakpoint: 'desktop',
    sidebarBehavior: 'persistent',
    contentLayout: 'grid',
    searchPosition: 'sidebar'
  },
  wide: {
    breakpoint: 'wide',
    sidebarBehavior: 'persistent',
    contentLayout: 'masonry',
    searchPosition: 'sidebar'
  }
}

interface ResponsiveStudentLayoutProps {
  children: React.ReactNode
  showSearchSidebar?: boolean
  searchContext?: 'students' | 'classes' | 'staff' | 'schedule' | 'dashboard'
  enableGridLayout?: boolean
  customBreakpoints?: Partial<Record<BreakpointKey, ResponsiveConfig>>
}

export default function ResponsiveStudentLayout({ 
  children, 
  showSearchSidebar = true,
  searchContext = 'students',
  enableGridLayout = false,
  customBreakpoints
}: ResponsiveStudentLayoutProps) {
  const pathname = usePathname()
  const { isOpen: isSearchOpen, openSidebar, closeSidebar } = useSearchStore()
  const [sidebarPersistent, setSidebarPersistent] = useState(false)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('mobile')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 브레이크포인트 감지
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < 768) {
        setCurrentBreakpoint('mobile')
      } else if (width < 1024) {
        setCurrentBreakpoint('tablet')
      } else if (width < 1536) {
        setCurrentBreakpoint('desktop')
      } else {
        setCurrentBreakpoint('wide')
      }
    }
    
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  // 현재 설정 계산
  const config = useMemo(() => {
    const baseConfig = RESPONSIVE_CONFIGS[currentBreakpoint]
    if (customBreakpoints?.[currentBreakpoint]) {
      return { ...baseConfig, ...customBreakpoints[currentBreakpoint] }
    }
    return baseConfig
  }, [currentBreakpoint, customBreakpoints])

  // 사이드바 자동 열기 (데스크톱에서만)
  useEffect(() => {
    if (config.sidebarBehavior === 'persistent' && showSearchSidebar && pathname.includes('/students/') && !isSearchOpen) {
      openSidebar()
      setSidebarPersistent(true)
    }
  }, [config.sidebarBehavior, showSearchSidebar, pathname, isSearchOpen, openSidebar])

  const toggleSidebarPersistence = () => {
    if (sidebarPersistent) {
      setSidebarPersistent(false)
      closeSidebar()
    } else {
      setSidebarPersistent(true)
      openSidebar()
    }
  }

  // 사이드바 렌더링 조건
  const shouldShowPersistentSidebar = config.sidebarBehavior === 'persistent' && sidebarPersistent && showSearchSidebar
  const shouldShowOverlaySidebar = (config.sidebarBehavior === 'overlay' || !sidebarPersistent) && showSearchSidebar

  return (
    <div className="flex h-full min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* 사이드바 - 지속적 표시 (데스크톱) */}
      <AnimatePresence>
        {shouldShowPersistentSidebar && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "flex-shrink-0 border-r bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl",
              "border-neutral-200/50 dark:border-neutral-800/50",
              isCollapsed ? "w-20" : "w-80"
            )}
          >
            <div className="h-full relative">
              {/* 사이드바 컨트롤 */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-900"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                >
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
                
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
                className={cn(
                  "border-0 shadow-none h-full transition-opacity",
                  isCollapsed && "opacity-0 pointer-events-none"
                )}
                title="학생 검색"
                subtitle="학생을 검색하고 빠르게 이동하세요"
                context={searchContext}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 헤더 (사이드바가 지속적이지 않을 때) */}
        {config.searchPosition === 'header' && showSearchSidebar && !shouldShowPersistentSidebar && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm"
                  onClick={openSidebar}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">검색</span>
                </Button>
                
                {/* 브레드크럼 */}
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

              {/* 반응형 인디케이터 */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    currentBreakpoint === 'mobile' && "bg-red-400",
                    currentBreakpoint === 'tablet' && "bg-yellow-400", 
                    currentBreakpoint === 'desktop' && "bg-green-400",
                    currentBreakpoint === 'wide' && "bg-blue-400"
                  )} />
                  {currentBreakpoint}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 페이지 콘텐츠 */}
        <div className="flex-1 overflow-auto">
          {enableGridLayout && config.contentLayout === 'grid' ? (
            <div className="p-6">
              <SmartGrid 
                gap={currentBreakpoint === 'mobile' ? 16 : 24}
                maxColumns={{
                  xs: 1,
                  sm: currentBreakpoint === 'tablet' ? 2 : 1,
                  md: 2,
                  lg: currentBreakpoint === 'wide' ? 3 : 2,
                  xl: 3,
                  '2xl': 4
                }}
              >
                <GridItem size={WidgetSizes.wide} className="lg:col-span-full">
                  {children}
                </GridItem>
              </SmartGrid>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>

      {/* 오버레이 사이드바 (모바일/태블릿 또는 비지속적) */}
      {shouldShowOverlaySidebar && (
        <SearchSidebar
          title="학생 검색"
          subtitle="학생을 검색하고 빠르게 이동하세요"
          context={searchContext}
        />
      )}

      {/* 플로팅 검색 버튼 (모바일) */}
      {config.searchPosition === 'floating' && showSearchSidebar && !isSearchOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={openSidebar}
          className={cn(
            "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl",
            "bg-gradient-to-r from-educanvas-500 to-educanvas-600",
            "text-white flex items-center justify-center",
            "hover:shadow-educanvas-500/25 hover:shadow-2xl",
            "ring-4 ring-white/20 dark:ring-neutral-900/20"
          )}
          aria-label="검색 열기"
        >
          <Search className="h-6 w-6" />
        </motion.button>
      )}

      {/* 반응형 디버그 패널 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
          {currentBreakpoint} | {config.contentLayout} | {config.sidebarBehavior}
        </div>
      )}
    </div>
  )
}