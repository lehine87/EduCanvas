'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ClassSearchSidebar from './ClassSearchSidebar'
import ClassDetailMain from './ClassDetailMain'
import ClassOverviewDashboard from './ClassOverviewDashboard'
import RealtimeIndicator from '@/components/staff/RealtimeIndicator'
import CachePerformanceMonitor, { CacheMonitorToggle } from '@/components/ui/CachePerformanceMonitor'
import { useClassRealtime } from '@/hooks/useClassRealtime'
import { useAuthStore } from '@/store/useAuthStore'
import type { Class } from '@/types/class.types'

interface ClassPageLayoutProps {
  className?: string
  initialSelectedClass?: Class | null
}

export default function ClassPageLayout({ className, initialSelectedClass }: ClassPageLayoutProps) {
  const [selectedClass, setSelectedClass] = useState<Class | null>(initialSelectedClass || null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showCacheMonitor, setShowCacheMonitor] = useState(false)

  // Auth store에서 tenantId 가져오기
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  // 실시간 동기화 Hook
  const { isConnected } = useClassRealtime()

  // initialSelectedClass가 변경될 때 내부 상태 업데이트
  useEffect(() => {
    if (initialSelectedClass) {
      console.log('🔄 ClassPageLayout: initialSelectedClass 업데이트', initialSelectedClass.name)
      setSelectedClass(initialSelectedClass)
    }
  }, [initialSelectedClass])

  const handleClassSelect = useCallback((classItem: Class) => {
    setSelectedClass(classItem)
  }, [])

  const handleCreateClass = useCallback(() => {
    setShowDetailSheet(false) // 상세 시트 닫기
    setShowCreateSheet(true)
  }, [])

  const handleEditClass = useCallback(() => {
    if (selectedClass) {
      setShowCreateSheet(false) // 등록 시트 닫기
      setShowDetailSheet(true)
    }
  }, [selectedClass])

  const handleCreateSuccess = useCallback(() => {
    setShowCreateSheet(false)
    // 새로 생성된 클래스를 선택하도록 할 수도 있음
  }, [])

  const handleUpdateSuccess = useCallback((updatedClass: Class) => {
    setShowDetailSheet(false)
    // 업데이트된 클래스 정보로 selectedClass 갱신
    setSelectedClass(updatedClass)
    console.log('🔄 ClassPageLayout: 클래스 정보 업데이트 완료', updatedClass.name)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setShowDetailSheet(false)
    setSelectedClass(null)
  }, [])

  return (
    <div className={`flex h-full p-4 gap-4 bg-gray-50 dark:bg-gray-950 overflow-hidden ${className || ''}`}>
      {/* 플로팅 사이드바 */}
      <div className="relative">
        {/* 실시간 동기화 인디케이터 */}
        <div className="absolute top-4 right-4 z-10">
          <RealtimeIndicator isConnected={isConnected} showText={false} />
        </div>
        <ClassSearchSidebar
          selectedClass={selectedClass}
          onClassSelect={handleClassSelect}
          onCreateClass={handleCreateClass}
          onEditClass={handleEditClass}
          showCreateSheet={showCreateSheet}
          showDetailSheet={showDetailSheet}
          onCreateSuccess={handleCreateSuccess}
          onUpdateSuccess={handleUpdateSuccess}
          onDeleteSuccess={handleDeleteSuccess}
          onCloseCreateSheet={() => setShowCreateSheet(false)}
          onCloseDetailSheet={() => setShowDetailSheet(false)}
          pendingClassId={null}
          onPendingClassLoaded={() => {}}
        />
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950 no-scrollbar">
        {selectedClass && tenantId ? (
          <ClassDetailMain
            selectedClass={selectedClass}
            onClassUpdate={setSelectedClass}
            onEditClass={handleEditClass}
            tenantId={tenantId}
          />
        ) : (
          <ClassOverviewDashboard
            onClassSelect={handleClassSelect}
            onCreateClass={handleCreateClass}
          />
        )}
      </div>

      {/* 사이드시트용 자연스러운 블러 오버레이 */}
      <AnimatePresence>
        {(showCreateSheet || showDetailSheet) && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(2px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 bg-white/10 dark:bg-black/10 z-20"
            style={{ left: '384px' }} // 사이드바 너비만큼 왼쪽 오프셋
            onClick={() => {
              setShowCreateSheet(false)
              setShowDetailSheet(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* 캐시 성능 모니터 */}
      <CachePerformanceMonitor
        isVisible={showCacheMonitor}
        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
        queryKeyPrefix="classes"
        displayName="클래스"
        position="bottom-left"
      />

      {/* 캐시 모니터 토글 버튼 */}
      <CacheMonitorToggle
        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
        isVisible={showCacheMonitor}
        position="bottom-left"
      />
    </div>
  )
}