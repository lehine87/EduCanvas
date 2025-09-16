'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StudentSearchSidebar from './StudentSearchSidebar'
import StudentDetailMain from './StudentDetailMain'
import StudentOverviewDashboard from './StudentOverviewDashboard'
import RealtimeIndicator from '@/components/staff/RealtimeIndicator'
import CachePerformanceMonitor, { CacheMonitorToggle } from '@/components/ui/CachePerformanceMonitor'
import { useStudentPageRealtime } from '@/hooks/useStudentRealtime'
import type { Student } from '@/types/student.types'

interface StudentsPageLayoutProps {
  className?: string
  initialSelectedStudent?: Student | null
}

export default function StudentsPageLayout({ className, initialSelectedStudent }: StudentsPageLayoutProps) {
  const pathname = usePathname()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialSelectedStudent || null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showCacheMonitor, setShowCacheMonitor] = useState(false)

  // 실시간 동기화 Hook
  const { isConnected } = useStudentPageRealtime()

  // URL 변화에 따른 상태 관리: /main/students 경로에서는 항상 메인 창 표시
  useEffect(() => {
    if (pathname === '/main/students') {
      console.log('🏠 StudentsPageLayout: 메인 경로로 이동 - 선택된 학생 초기화')
      setSelectedStudent(null)
    }
  }, [pathname])

  // initialSelectedStudent가 변경될 때 내부 상태 업데이트 (상세 페이지에서만)
  useEffect(() => {
    if (initialSelectedStudent && pathname !== '/main/students') {
      console.log('🔄 StudentsPageLayout: initialSelectedStudent 업데이트', initialSelectedStudent.name)
      setSelectedStudent(initialSelectedStudent)
    }
  }, [initialSelectedStudent, pathname])

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student)
  }, [])

  const handleCreateStudent = useCallback(() => {
    setShowDetailSheet(false) // 상세 시트 닫기
    setShowCreateSheet(true)
  }, [])

  const handleEditStudent = useCallback(() => {
    if (selectedStudent) {
      setShowCreateSheet(false) // 등록 시트 닫기
      setShowDetailSheet(true)
    }
  }, [selectedStudent])

  const handleCreateSuccess = useCallback(() => {
    setShowCreateSheet(false)
    // 새로 생성된 학생을 선택하도록 할 수도 있음
  }, [])

  const handleUpdateSuccess = useCallback((updatedStudent: Student) => {
    setShowDetailSheet(false)
    // 업데이트된 학생 정보로 selectedStudent 갱신
    setSelectedStudent(updatedStudent)
    console.log('🔄 StudentsPageLayout: 학생 정보 업데이트 완료', updatedStudent.name)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setShowDetailSheet(false)
    setSelectedStudent(null)
  }, [])

  return (
    <div className={`flex h-full p-4 gap-4 bg-gray-50 dark:bg-gray-950 overflow-hidden ${className || ''}`}>
      {/* 플로팅 사이드바 */}
      <div className="relative">
        {/* 실시간 동기화 인디케이터 */}
        <div className="absolute top-4 right-4 z-10">
          <RealtimeIndicator isConnected={isConnected} showText={false} />
        </div>
        <StudentSearchSidebar
          selectedStudent={selectedStudent}
          onStudentSelect={handleStudentSelect}
          onCreateStudent={handleCreateStudent}
          onEditStudent={handleEditStudent}
          showCreateSheet={showCreateSheet}
          showDetailSheet={showDetailSheet}
          onCreateSuccess={handleCreateSuccess}
          onUpdateSuccess={handleUpdateSuccess}
          onDeleteSuccess={handleDeleteSuccess}
          onCloseCreateSheet={() => setShowCreateSheet(false)}
          onCloseDetailSheet={() => setShowDetailSheet(false)}
          pendingStudentId={null}
          onPendingStudentLoaded={() => {}}
        />
      </div>

      {/* 메인 영역 */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950 no-scrollbar transition-all duration-300 ${(showCreateSheet || showDetailSheet) ? 'blur-sm' : ''}`}>
        {selectedStudent ? (
          <StudentDetailMain
            selectedStudent={selectedStudent}
            onStudentUpdate={setSelectedStudent}
            onEditStudent={handleEditStudent}
          />
        ) : (
          <StudentOverviewDashboard
            onStudentSelect={handleStudentSelect}
            onCreateStudent={handleCreateStudent}
          />
        )}
      </div>


      {/* 캐시 성능 모니터 */}
      <CachePerformanceMonitor
        isVisible={showCacheMonitor}
        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
        queryKeyPrefix="students"
        displayName="학생"
        position="bottom-right"
      />

      {/* 캐시 모니터 토글 버튼 */}
      <CacheMonitorToggle
        onToggle={() => setShowCacheMonitor(!showCacheMonitor)}
        isVisible={showCacheMonitor}
        position="bottom-right"
      />
    </div>
  )
}