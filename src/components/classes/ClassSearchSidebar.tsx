'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FloatingSidebar, FloatingSidebarHeader, FloatingSidebarContent, FloatingSidebarFooter } from '@/components/ui/floating-sidebar'
import ClassDetailSideSheet from './ClassDetailSideSheet'
import CreateClassSideSheet from './CreateClassSideSheet'
import ClassQuickAccessPanel from './ClassQuickAccessPanel'
import { useAuthStore } from '@/store/useAuthStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useClasses, useClassSearch } from '@/hooks/queries/useClasses'
import { useCreateClass, useUpdateClass, useDeleteClass } from '@/hooks/mutations/useClassMutations'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  AcademicCapIcon,
  UsersIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import type { Class } from '@/types/class.types'

interface ClassSearchSidebarProps {
  selectedClass: Class | null
  onClassSelect: (classItem: Class) => void
  onCreateClass: () => void
  onEditClass: () => void
  showCreateSheet: boolean
  showDetailSheet: boolean
  onCreateSuccess: () => void
  onUpdateSuccess: (updatedClass: Class) => void
  onDeleteSuccess: () => void
  onCloseCreateSheet: () => void
  onCloseDetailSheet: () => void
  pendingClassId?: string | null
  onPendingClassLoaded?: () => void
}

export default function ClassSearchSidebar({
  selectedClass,
  onClassSelect,
  onCreateClass,
  onEditClass,
  showCreateSheet,
  showDetailSheet,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onCloseCreateSheet,
  onCloseDetailSheet,
  pendingClassId,
  onPendingClassLoaded
}: ClassSearchSidebarProps) {
  const { profile } = useAuthStore()
  
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)
  
  const debouncedBasicSearch = useDebounce(basicSearchTerm, 300)
  const tenantId = profile?.tenant_id

  // React Query hooks
  const { 
    data: classesData, 
    isLoading: loading, 
    refetch: refetchClasses 
  } = useClasses({ 
    tenantId: tenantId || '', 
    enabled: !!tenantId 
  })
  
  const {
    data: searchData,
    isLoading: searchLoading
  } = useClassSearch({
    search: debouncedBasicSearch,
    tenantId: tenantId || '',
    enabled: debouncedBasicSearch.length >= 2 && !!tenantId
  })

  // Mutations
  const createClassMutation = useCreateClass()
  const updateClassMutation = useUpdateClass()
  const deleteClassMutation = useDeleteClass()

  const classes = classesData?.items || []
  const searchResults = searchData?.classes || []

  // pendingClassId가 있을 때 해당 클래스 자동 선택
  useEffect(() => {
    if (pendingClassId && classes.length > 0) {
      console.log('🔍 Looking for pending class:', { pendingClassId, classesCount: classes.length })
      
      const targetClass = classes.find((classItem: Class) => classItem.id === pendingClassId)
      
      if (targetClass) {
        console.log('✅ Found and selecting class:', targetClass.name)
        onClassSelect(targetClass)
        onPendingClassLoaded?.()
      }
    }
  }, [pendingClassId, classes, onClassSelect, onPendingClassLoaded])

  // 검색 결과 표시 로직
  const displayClasses: Class[] = debouncedBasicSearch.length >= 2 ? searchResults : classes
  const isSearchMode = debouncedBasicSearch.length >= 2

  // 검색 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayClasses.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev < displayClasses.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : displayClasses.length - 1
        )
      } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
        e.preventDefault()
        const selectedClassItem = displayClasses[selectedSearchIndex]
        if (selectedClassItem) {
          handleBasicSearchSelect(selectedClassItem)
        }
      } else if (e.key === 'Escape') {
        setSelectedSearchIndex(-1)
        setBasicSearchTerm('')
      }
    }

    if (displayClasses.length > 0 && isSearchMode) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [displayClasses, selectedSearchIndex, isSearchMode])

  const handleBasicSearchSelect = useCallback((classItem: Class) => {
    onClassSelect(classItem)
    setBasicSearchTerm('')
    setSelectedSearchIndex(-1)
  }, [onClassSelect])

  const getStatusText = (isActive: boolean) => {
    return isActive ? '활성' : '비활성'
  }

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary'
  }

  return (
    <>
      <FloatingSidebar
        width="md"
        blur="md"
        transparency={85}
        floating={true}
      >
        {/* 헤더 영역 - 기본 검색 */}
        <FloatingSidebarHeader>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="클래스명, 강사명으로 검색..."
              value={basicSearchTerm}
              onChange={(e) => setBasicSearchTerm(e.target.value)}
              className="pl-10"
            />
            
            {/* 검색 결과 드롭다운 */}
            <AnimatePresence>
              {isSearchMode && displayClasses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto no-scrollbar"
                >
                  {displayClasses.slice(0, 8).map((classItem, index) => (
                    <button
                      key={classItem.id}
                      onClick={() => handleBasicSearchSelect(classItem)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                        selectedSearchIndex === index ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-educanvas-100 text-educanvas-700">
                          <AcademicCapIcon className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {classItem.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {classItem.instructor?.name || '강사 미배정'}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FloatingSidebarHeader>

        {/* 콘텐츠 영역 */}
        <FloatingSidebarContent>
          {/* 선택된 클래스 기본 정보 */}
          <div className="py-4">
          {selectedClass ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-educanvas-100 text-educanvas-700">
                      <AcademicCapIcon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {selectedClass.name}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(selectedClass.is_active ?? false)}>
                        {getStatusText(selectedClass.is_active ?? false)}
                      </Badge>
                    </div>
                    
                    {selectedClass.instructor?.name && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        강사: {selectedClass.instructor.name}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-1 mb-1">
                      <UsersIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedClass.student_count || 0}명 수강
                      </span>
                    </div>
                    
                    {selectedClass.subject && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {selectedClass.subject}
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
                <AcademicCapIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">클래스를 선택해주세요</p>
              </div>
            </div>
          )}
          </div>

          {/* 액션 버튼들 */}
          <div className="py-4">
            <div className="grid grid-cols-2 gap-2">
            <Button onClick={onCreateClass} variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              클래스등록
            </Button>
            <Button 
              onClick={onEditClass} 
              variant="outline" 
              size="sm"
              disabled={!selectedClass}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              클래스상세
            </Button>
            </div>
          </div>

          {/* 빠른 액세스 패널 */}
          <div className="flex-1 py-4 overflow-hidden">
            <ClassQuickAccessPanel
              selectedClass={selectedClass}
              onClassSelect={onClassSelect}
              className="h-full"
            />
          </div>
        </FloatingSidebarContent>
      </FloatingSidebar>

      {/* 사이드시트들 - 사이드바 우측에서 슬라이딩 */}
      <CreateClassSideSheet
        open={showCreateSheet}
        onOpenChange={(open) => {
          if (!open) {
            onCloseCreateSheet()
          }
        }}
        onSuccess={() => {
          // 부모 컴포넌트의 콜백 호출
          onCreateSuccess()
        }}
        sidebarWidth={384} // 사이드바 너비 전달
      />

      {selectedClass && (
        <ClassDetailSideSheet
          open={showDetailSheet}
          onOpenChange={(open) => {
            if (!open) {
              onCloseDetailSheet()
            }
          }}
          classData={selectedClass}
          onUpdateSuccess={(updatedClass) => {
            // 부모 컴포넌트의 콜백 호출 (업데이트된 클래스 데이터 전달)
            onUpdateSuccess(updatedClass)
            // 선택된 클래스 업데이트
            onClassSelect(updatedClass)
          }}
          onDeleteSuccess={() => {
            // 부모 컴포넌트의 콜백 호출
            onDeleteSuccess()
          }}
          sidebarWidth={384} // 사이드바 너비 전달
        />
      )}
    </>
  )
}