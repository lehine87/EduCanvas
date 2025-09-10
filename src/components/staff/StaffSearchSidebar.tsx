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
import { StaffDetailSideSheet } from './StaffDetailSideSheet'
import CreateStaffSideSheet from './CreateStaffSideSheet'
import StaffQuickAccessPanel from './StaffQuickAccessPanel'
import { useAuthStore } from '@/store/useAuthStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useInstructorsWithFilters, useInstructorSearch } from '@/hooks/queries'
import { useCreateInstructor, useUpdateInstructor, useDeleteInstructor } from '@/hooks/mutations/useStaffMutations'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import type { Instructor, StaffInfo } from '@/types/staff.types'

interface StaffSearchSidebarProps {
  selectedInstructor: Instructor | null
  onInstructorSelect: (instructor: Instructor) => void
  onCreateInstructor: () => void
  onEditInstructor: () => void
  showCreateSheet: boolean
  showDetailSheet: boolean
  onCreateSuccess: () => void
  onUpdateSuccess: (updatedInstructor: Instructor) => void
  onDeleteSuccess: () => void
  onCloseCreateSheet: () => void
  onCloseDetailSheet: () => void
  pendingInstructorId?: string | null
  onPendingInstructorLoaded?: () => void
}

export default function StaffSearchSidebar({
  selectedInstructor,
  onInstructorSelect,
  onCreateInstructor,
  onEditInstructor,
  showCreateSheet,
  showDetailSheet,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onCloseCreateSheet,
  onCloseDetailSheet,
  pendingInstructorId,
  onPendingInstructorLoaded
}: StaffSearchSidebarProps) {
  const { profile } = useAuthStore()
  
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)
  
  const debouncedBasicSearch = useDebounce(basicSearchTerm, 300)
  const tenantId = profile?.tenant_id

  // React Query hooks
  const { 
    data: instructorsData, 
    isLoading: loading, 
    refetch: refetchInstructors 
  } = useInstructorsWithFilters()
  
  const { 
    data: searchData, 
    isLoading: searchLoading 
  } = useInstructorSearch(debouncedBasicSearch, true)

  // Mutations
  const createInstructorMutation = useCreateInstructor()
  const updateInstructorMutation = useUpdateInstructor()
  const deleteInstructorMutation = useDeleteInstructor()

  const instructors = instructorsData?.instructors || []
  const searchResults = searchData?.instructors || []
  
  // pendingInstructorId가 있을 때 해당 강사 자동 선택
  useEffect(() => {
    if (pendingInstructorId && instructors.length > 0) {
      console.log('🔍 Looking for pending instructor:', { pendingInstructorId, instructorsCount: instructors.length })
      
      const targetInstructor = instructors.find((instructor: Instructor) => instructor.id === pendingInstructorId)
      
      if (targetInstructor) {
        console.log('✅ Found and selecting instructor:', targetInstructor.user?.name)
        onInstructorSelect(targetInstructor)
        onPendingInstructorLoaded?.()
      }
    }
  }, [pendingInstructorId, instructors, onInstructorSelect, onPendingInstructorLoaded])

  // 검색 결과 표시 로직
  const displayInstructors: Instructor[] = debouncedBasicSearch.length >= 2 ? searchResults : instructors
  const isSearchMode = debouncedBasicSearch.length >= 2

  // 검색 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayInstructors.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev < displayInstructors.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : displayInstructors.length - 1
        )
      } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
        e.preventDefault()
        const selectedInstructor = displayInstructors[selectedSearchIndex]
        if (selectedInstructor) {
          handleBasicSearchSelect(selectedInstructor)
        }
      } else if (e.key === 'Escape') {
        setSelectedSearchIndex(-1)
        setBasicSearchTerm('')
      }
    }

    if (displayInstructors.length > 0 && isSearchMode) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [displayInstructors, selectedSearchIndex, isSearchMode])

  const handleBasicSearchSelect = useCallback((instructor: Instructor) => {
    onInstructorSelect(instructor)
    setBasicSearchTerm('')
    setSelectedSearchIndex(-1)
  }, [onInstructorSelect])

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'pending': return '대기중'
      default: return status
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'pending': return 'outline'
      default: return 'secondary'
    }
  }

  const getEmployeeId = (instructor: Instructor) => {
    return (instructor.staff_info as StaffInfo)?.employee_id || '사번 없음'
  }

  const getPhone = (instructor: Instructor) => {
    return instructor.user?.phone || (instructor.staff_info as StaffInfo)?.emergency_contact?.phone
  }

  const getEmail = (instructor: Instructor) => {
    return instructor.user?.email
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* 기본 검색 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="강사 이름, 사번으로 검색..."
              value={basicSearchTerm}
              onChange={(e) => setBasicSearchTerm(e.target.value)}
              className="pl-10"
            />
            
            {/* 검색 결과 드롭다운 */}
            <AnimatePresence>
              {isSearchMode && displayInstructors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
                >
                  {displayInstructors.slice(0, 8).map((instructor, index) => (
                    <button
                      key={instructor.id}
                      onClick={() => handleBasicSearchSelect(instructor)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                        selectedSearchIndex === index ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={instructor.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {instructor.user?.name?.substring(0, 1) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {instructor.user?.name || '이름 없음'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getEmployeeId(instructor)}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 선택된 강사 기본 정보 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {selectedInstructor ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedInstructor.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedInstructor.user?.name?.substring(0, 1) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {selectedInstructor.user?.name || '이름 없음'}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(selectedInstructor.status || 'active')}>
                        {getStatusText(selectedInstructor.status || 'active')}
                      </Badge>
                    </div>
                    
                    {getEmployeeId(selectedInstructor) !== '사번 없음' && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        사번: {getEmployeeId(selectedInstructor)}
                      </p>
                    )}
                    
                    {getPhone(selectedInstructor) && (
                      <div className="flex items-center space-x-1 mb-1">
                        <PhoneIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getPhone(selectedInstructor)}
                        </span>
                      </div>
                    )}
                    
                    {getEmail(selectedInstructor) && (
                      <div className="flex items-center space-x-1">
                        <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getEmail(selectedInstructor)}
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
                <p className="text-sm">강사를 선택해주세요</p>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onCreateInstructor} variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              강사등록
            </Button>
            <Button 
              onClick={onEditInstructor} 
              variant="outline" 
              size="sm"
              disabled={!selectedInstructor}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              강사상세
            </Button>
          </div>
        </div>

        {/* 빠른 액세스 패널 */}
        <div className="flex-1 p-4 overflow-hidden">
          <StaffQuickAccessPanel 
            selectedInstructor={selectedInstructor}
            onInstructorSelect={onInstructorSelect}
            className="h-full"
          />
        </div>
      </div>

      {/* 사이드시트들 - 사이드바 우측에서 슬라이딩 */}
      <CreateStaffSideSheet
        open={showCreateSheet}
        onOpenChange={onCloseCreateSheet}
        onSuccess={(newInstructor) => {
          // 부모 컴포넌트의 콜백 호출
          onCreateSuccess()
          // 새로 생성된 강사 선택
          if (newInstructor) {
            onInstructorSelect(newInstructor)
          }
        }}
        sidebarWidth={384} // 사이드바 너비 전달
      />

      {selectedInstructor && (
        <StaffDetailSideSheet
          open={showDetailSheet}
          onOpenChange={onCloseDetailSheet}
          instructorId={selectedInstructor.id}
          onUpdateSuccess={(updatedInstructor) => {
            // 부모 컴포넌트의 콜백 호출 (업데이트된 강사 데이터 전달)
            onUpdateSuccess(updatedInstructor)
            // 선택된 강사 업데이트
            onInstructorSelect(updatedInstructor)
          }}
          onDeleteSuccess={(deletedId) => {
            // 부모 컴포넌트의 콜백 호출
            onDeleteSuccess()
          }}
          sidebarWidth={384} // 사이드바 너비 전달
        />
      )}
    </>
  )
}