'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InstructorSearchSidebar from './InstructorSearchSidebar'
import InstructorDetailMain from './InstructorDetailMain'
import InstructorOverviewDashboard from './InstructorOverviewDashboard'
import type { Instructor } from '@/types/staff.types'

interface InstructorsPageLayoutProps {
  className?: string
  initialSelectedInstructor?: Instructor | null
}

export default function InstructorsPageLayout({ className, initialSelectedInstructor }: InstructorsPageLayoutProps) {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(initialSelectedInstructor || null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)

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
    <div className={`flex h-full ${className || ''}`}>
      {/* 사이드바 - 고정 너비 384px */}
      <div className="w-96 flex-shrink-0 h-full overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <InstructorSearchSidebar
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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
        {selectedInstructor ? (
          <InstructorDetailMain
            selectedInstructor={selectedInstructor}
            onInstructorUpdate={setSelectedInstructor}
            onEditInstructor={handleEditInstructor}
          />
        ) : (
          <InstructorOverviewDashboard
            onInstructorSelect={handleInstructorSelect}
            onCreateInstructor={handleCreateInstructor}
          />
        )}
      </div>

      {/* 사이드시트용 오버레이 - 사이드시트가 열릴 때 메인 영역 dim 처리 */}
      <AnimatePresence>
        {(showCreateSheet || showDetailSheet) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20"
            style={{ left: '384px' }} // 사이드바 너비만큼 왼쪽 오프셋
            onClick={() => {
              setShowCreateSheet(false)
              setShowDetailSheet(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}