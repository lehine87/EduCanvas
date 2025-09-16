'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StaffSearchSidebar from './StaffSearchSidebar'
import StaffDetailMain from './StaffDetailMain'
import StaffOverviewDashboard from './StaffOverviewDashboard'
import RealtimeIndicator from './RealtimeIndicator'
import CachePerformanceMonitor, { CacheMonitorToggle } from './CachePerformanceMonitor'
import { useStaffRealtime } from '@/hooks/useStaffRealtime'
import type { Instructor } from '@/types/staff.types'

interface InstructorsPageLayoutProps {
  className?: string
  initialSelectedInstructor?: Instructor | null
}

export default function InstructorsPageLayout({ className, initialSelectedInstructor }: InstructorsPageLayoutProps) {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(initialSelectedInstructor || null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showCacheMonitor, setShowCacheMonitor] = useState(false)

  // 실시간 동기화 Hook
  const { isConnected } = useStaffRealtime()

  // initialSelectedInstructor가 변경될 때 내부 상태 업데이트
  useEffect(() => {
    if (initialSelectedInstructor) {
      console.log('🔄 InstructorsPageLayout: initialSelectedInstructor 업데이트', initialSelectedInstructor.user?.name)
      setSelectedInstructor(initialSelectedInstructor)
    }
  }, [initialSelectedInstructor])

  const handleInstructorSelect = useCallback((instructor: Instructor) => {
    setSelectedInstructor(instructor)
  }, [])

  const handleCreateInstructor = useCallback(() => {
    setShowDetailSheet(false) // 상세 시트 닫기
    setShowCreateSheet(true)
  }, [])

  const handleEditInstructor = useCallback(() => {
    if (selectedInstructor) {
      setShowCreateSheet(false) // 등록 시트 닫기
      setShowDetailSheet(true)
    }
  }, [selectedInstructor])

  const handleCreateSuccess = useCallback(() => {
    setShowCreateSheet(false)
    // 새로 생성된 강사를 선택하도록 할 수도 있음
  }, [])

  const handleUpdateSuccess = useCallback((updatedInstructor: Instructor) => {
    setShowDetailSheet(false)
    // 업데이트된 강사 정보로 selectedInstructor 갱신
    setSelectedInstructor(updatedInstructor)
    console.log('🔄 InstructorsPageLayout: 강사 정보 업데이트 완료', updatedInstructor.user?.name)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setShowDetailSheet(false)
    setSelectedInstructor(null)
  }, [])

  return (
    <div className={`flex h-full p-4 gap-4 bg-gray-50 dark:bg-gray-950 overflow-hidden ${className || ''}`}>
      {/* 플로팅 사이드바 */}
      <div className="relative">
        {/* 실시간 동기화 인디케이터 */}
        <div className="absolute top-4 right-4 z-10">
          <RealtimeIndicator isConnected={isConnected} showText={false} />
        </div>
        <StaffSearchSidebar
          selectedInstructor={selectedInstructor}
          onInstructorSelect={handleInstructorSelect}
          onCreateInstructor={handleCreateInstructor}
          onEditInstructor={handleEditInstructor}
          showCreateSheet={showCreateSheet}
          showDetailSheet={showDetailSheet}
          onCreateSuccess={handleCreateSuccess}
          onUpdateSuccess={handleUpdateSuccess}
          onDeleteSuccess={handleDeleteSuccess}
          onCloseCreateSheet={() => setShowCreateSheet(false)}
          onCloseDetailSheet={() => setShowDetailSheet(false)}
          pendingInstructorId={null}
          onPendingInstructorLoaded={() => {}}
        />
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950 no-scrollbar">
        {selectedInstructor ? (
          <StaffDetailMain
            selectedInstructor={selectedInstructor}
            onInstructorUpdate={setSelectedInstructor}
            onEditInstructor={handleEditInstructor}
          />
        ) : (
          <StaffOverviewDashboard
            onInstructorSelect={handleInstructorSelect}
            onCreateInstructor={handleCreateInstructor}
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

      {/* 캐시 성능 모니터 (개발 환경) */}
      <CachePerformanceMonitor 
        isVisible={showCacheMonitor}
        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
      />
      
      <CacheMonitorToggle
        isVisible={showCacheMonitor}
        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
      />
    </div>
  )
}