'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StudentSearchSidebar from './StudentSearchSidebar'
import StudentDetailMain from './StudentDetailMain'
import type { Student } from '@/types/student.types'

interface StudentsPageLayoutProps {
  className?: string
}

export default function StudentsPageLayout({ className }: StudentsPageLayoutProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)

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

  const handleUpdateSuccess = useCallback(() => {
    setShowDetailSheet(false)
    // 학생 정보 갱신 처리
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setShowDetailSheet(false)
    setSelectedStudent(null)
  }, [])

  return (
    <div className={`flex h-full bg-gray-50 dark:bg-gray-900 ${className || ''}`}>
      {/* 사이드바 - 고정 너비 384px */}
      <div className="w-96 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
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
        />
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col">
        <StudentDetailMain
          selectedStudent={selectedStudent}
          onStudentUpdate={setSelectedStudent}
          onEditStudent={handleEditStudent}
        />
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