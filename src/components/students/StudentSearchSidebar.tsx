'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { StudentDetailSideSheet } from './StudentDetailSideSheet'
import { CreateStudentSideSheet } from './CreateStudentSideSheet'
import QuickAccessPanel from './QuickAccessPanel'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useDebounce } from '@/hooks/useDebounce'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import type { Student } from '@/types/student.types'

interface StudentSearchSidebarProps {
  selectedStudent: Student | null
  onStudentSelect: (student: Student) => void
  onCreateStudent: () => void
  onEditStudent: () => void
  showCreateSheet: boolean
  showDetailSheet: boolean
  onCreateSuccess: () => void
  onUpdateSuccess: () => void
  onDeleteSuccess: () => void
  onCloseCreateSheet: () => void
  onCloseDetailSheet: () => void
  pendingStudentId?: string | null
  onPendingStudentLoaded?: () => void
}

export default function StudentSearchSidebar({
  selectedStudent,
  onStudentSelect,
  onCreateStudent,
  onEditStudent,
  showCreateSheet,
  showDetailSheet,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onCloseCreateSheet,
  onCloseDetailSheet,
  pendingStudentId,
  onPendingStudentLoaded
}: StudentSearchSidebarProps) {
  const { profile } = useAuthStore()
  const { students, loading, actions } = useStudentsStore()
  
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)
  
  const debouncedBasicSearch = useDebounce(basicSearchTerm, 300)

  const tenantId = profile?.tenant_id

  // 초기 학생 목록 로드
  useEffect(() => {
    console.log('📚 Student fetch useEffect:', { tenantId, hasActions: !!actions })
    if (tenantId) {
      console.log('📞 Fetching students for tenant:', tenantId)
      actions.fetchStudents(tenantId)
    }
  }, [tenantId, actions])
  
  // pendingStudentId가 있을 때 해당 학생 자동 선택
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { 
      pendingStudentId, 
      studentsLength: students.length, 
      tenantId,
      hasOnStudentSelect: !!onStudentSelect,
      hasOnPendingStudentLoaded: !!onPendingStudentLoaded
    })
    
    const selectPendingStudent = () => {
      if (pendingStudentId && students.length > 0) {
        console.log('🔍 Looking for pending student:', { pendingStudentId, studentsCount: students.length })
        
        // 이미 로드된 학생 목록에서 해당 ID 찾기
        const targetStudent = students.find(student => student.id === pendingStudentId)
        
        if (targetStudent) {
          console.log('✅ Found and selecting student:', targetStudent.name)
          onStudentSelect(targetStudent)
          onPendingStudentLoaded?.()
        } else {
          console.warn('⚠️ Student not found in loaded list:', pendingStudentId)
          // 학생을 찾을 수 없으면 API로 다시 시도
          loadStudentFromApi()
        }
      }
    }
    
    const loadStudentFromApi = async () => {
      if (pendingStudentId && tenantId) {
        console.log('📞 Fetching student from API:', pendingStudentId)
        try {
          const response = await fetch(`/api/students/${pendingStudentId}`)
          console.log('📞 API response status:', response.status)
          
          if (response.ok) {
            const data = await response.json()
            console.log('📄 API response data:', data)
            
            if (data.success && data.data) {
              console.log('✅ Selecting student from API:', data.data.name)
              onStudentSelect(data.data)
              onPendingStudentLoaded?.()
            } else {
              console.warn('⚠️ API returned no student data')
              onPendingStudentLoaded?.()
            }
          } else {
            console.error('❌ API call failed:', response.status)
            onPendingStudentLoaded?.()
          }
        } catch (error) {
          console.error('💥 Failed to load pending student:', error)
          onPendingStudentLoaded?.()
        }
      }
    }
    
    selectPendingStudent()
  }, [pendingStudentId, students, tenantId, onStudentSelect, onPendingStudentLoaded])

  // 기본 검색 처리 - API 호출 방식
  useEffect(() => {
    const searchStudents = async () => {
      if (debouncedBasicSearch.length >= 2) {
        try {
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: debouncedBasicSearch,
              context: 'students',
              limit: 10
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            const studentResults = data.results
              ?.filter((r: any) => r.type === 'student')
              ?.map((r: any) => ({
                id: r.id,
                name: r.title,
                student_number: r.subtitle?.split(' • ')[0] || '',
                phone: r.metadata?.phone || '',
                email: r.metadata?.email || '',
                status: r.metadata?.status || 'active',
                avatar_url: r.metadata?.avatar,
                tenant_id: tenantId
              })) || []
            setSearchResults(studentResults)
            setSelectedSearchIndex(-1)
          }
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
        setSelectedSearchIndex(-1)
      }
    }
    
    searchStudents()
  }, [debouncedBasicSearch, tenantId])

  // 기본검색 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (searchResults.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
      } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
        e.preventDefault()
        const selectedStudent = searchResults[selectedSearchIndex]
        if (selectedStudent) {
          handleBasicSearchSelect(selectedStudent)
        }
      } else if (e.key === 'Escape') {
        setSearchResults([])
        setSelectedSearchIndex(-1)
        setBasicSearchTerm('')
      }
    }

    if (searchResults.length > 0) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [searchResults, selectedSearchIndex])


  const handleBasicSearchSelect = useCallback((student: Student) => {
    onStudentSelect(student)
    setBasicSearchTerm('')
    setSearchResults([])
  }, [onStudentSelect])


  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '재학중'
      case 'inactive': return '휴학'
      case 'graduated': return '졸업'
      case 'withdrawn': return '자퇴'
      case 'suspended': return '정학'
      default: return status
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'graduated': return 'outline'
      case 'withdrawn': return 'destructive'
      case 'suspended': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* 기본 검색 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="학생 이름, 학번으로 검색..."
              value={basicSearchTerm}
              onChange={(e) => setBasicSearchTerm(e.target.value)}
              className="pl-10"
            />
            
            {/* 검색 결과 드롭다운 */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
                >
                  {searchResults.slice(0, 8).map((student, index) => (
                    <button
                      key={student.id}
                      onClick={() => handleBasicSearchSelect(student)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                        selectedSearchIndex === index ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profile_image || undefined} />
                        <AvatarFallback className="text-xs">
                          {student.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student.student_number || '학번 없음'}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 선택된 학생 기본 정보 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {selectedStudent ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedStudent.profile_image || undefined} />
                    <AvatarFallback>
                      {selectedStudent.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {selectedStudent.name}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(selectedStudent.status || 'active')}>
                        {getStatusText(selectedStudent.status || 'active')}
                      </Badge>
                    </div>
                    
                    {selectedStudent.student_number && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        학번: {selectedStudent.student_number}
                      </p>
                    )}
                    
                    {selectedStudent.phone && (
                      <div className="flex items-center space-x-1 mb-1">
                        <PhoneIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {selectedStudent.phone}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.email && (
                      <div className="flex items-center space-x-1">
                        <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {selectedStudent.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">학생을 선택해주세요</p>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onCreateStudent} variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              원생등록
            </Button>
            <Button 
              onClick={onEditStudent} 
              variant="outline" 
              size="sm"
              disabled={!selectedStudent}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              원생상세
            </Button>
          </div>
        </div>

        {/* 빠른 액세스 패널 */}
        <div className="flex-1 p-4 overflow-hidden">
          <QuickAccessPanel 
            selectedStudent={selectedStudent}
            onStudentSelect={onStudentSelect}
            className="h-full"
          />
        </div>
      </div>

      {/* 사이드시트들 - 사이드바 우측에서 슬라이딩 */}
      <CreateStudentSideSheet
        open={showCreateSheet}
        onOpenChange={onCloseCreateSheet}
        onSuccess={onCreateSuccess}
        sidebarWidth={384} // 사이드바 너비 전달
      />

      {selectedStudent && (
        <StudentDetailSideSheet
          open={showDetailSheet}
          onOpenChange={onCloseDetailSheet}
          studentId={selectedStudent.id}
          onUpdateSuccess={onUpdateSuccess}
          onDeleteSuccess={onDeleteSuccess}
          sidebarWidth={384} // 사이드바 너비 전달
        />
      )}
    </>
  )
}