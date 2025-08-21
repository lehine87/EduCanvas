'use client'

import React, { memo, useCallback, useState, useEffect } from 'react'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/Loading'
import { 
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * 클래스 정보 타입 (검색 결과용)
 */
export interface ClassSearchResult {
  id: string
  name: string
  description?: string | null
  grade?: string | null
  course?: string | null
  subject?: string | null
  instructor_name?: string | null
  max_students?: number | null
  current_student_count: number
  is_active: boolean
  start_date?: string | null
  end_date?: string | null
  color?: string | null
}

/**
 * ClassSearchSelector Props
 */
export interface ClassSearchSelectorProps {
  /** Modal 열림 상태 */
  isOpen: boolean
  /** Modal 닫기 핸들러 */
  onClose: () => void
  /** 클래스 선택 완료 핸들러 */
  onClassSelected: (classData: ClassSearchResult) => void
  /** 다중 선택 허용 여부 */
  allowMultiple?: boolean
  /** 이미 등록된 클래스 ID 목록 (중복 방지) */
  excludeClassIds?: string[]
  /** 특정 학년의 클래스만 검색 */
  filterByGrade?: string | null
  /** 특정 과목의 클래스만 검색 */
  filterBySubject?: string | null
  /** 활성 클래스만 검색 */
  activeOnly?: boolean
  /** 제목 커스터마이징 */
  title?: string
  /** 설명 커스터마이징 */
  description?: string
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * ClassSearchSelector - 클래스 검색 및 선택 Modal 컴포넌트
 * 
 * 특징:
 * - 실시간 클래스 검색 (이름, 과목, 강사명)
 * - 단일 선택 지원 (학생 배정용)
 * - 클래스 정원 정보 표시
 * - 필터링 (학년별, 과목별, 활성 상태)
 * - 접근성 완벽 지원
 */
export const ClassSearchSelector = memo<ClassSearchSelectorProps>(({
  isOpen,
  onClose,
  onClassSelected,
  allowMultiple = false,
  excludeClassIds = [],
  filterByGrade = null,
  filterBySubject = null,
  activeOnly = true,
  title = '클래스 검색 및 선택',
  description = '학생을 배정할 클래스를 선택하세요',
  className
}) => {
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('')
  const [classes, setClasses] = useState<ClassSearchResult[]>([])
  const [selectedClasses, setSelectedClasses] = useState<ClassSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // 인증 정보
  const { profile: userProfile } = useAuthStore()
  const tenantId = userProfile?.tenant_id

  // Supabase 클라이언트
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 클래스 검색 함수
  const searchClasses = useCallback(async (query: string = '') => {
    if (!tenantId) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('인증 토큰이 없습니다')
        return
      }

      // API 파라미터 구성
      const params = new URLSearchParams({
        tenantId,
        search: query,
        includeInstructor: 'true',
        includeStudentCount: 'true',
        limit: '50'
      })

      if (filterByGrade) {
        params.append('grade', filterByGrade)
      }

      if (filterBySubject) {
        params.append('subject', filterBySubject)
      }

      if (activeOnly) {
        params.append('isActive', 'true')
      }

      const response = await fetch(`/api/classes?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('클래스 검색 실패')
      }

      const data = await response.json()
      
      if (data.success && data.data && Array.isArray(data.data.classes)) {
        const searchResults: ClassSearchResult[] = data.data.classes
          .filter((classItem: any) => !excludeClassIds.includes(classItem.id))
          .map((classItem: any) => ({
            id: classItem.id,
            name: classItem.name,
            description: classItem.description,
            grade: classItem.grade,
            course: classItem.course,
            subject: classItem.subject,
            instructor_name: classItem.instructors?.name || classItem.user_profiles?.name,
            max_students: classItem.max_students,
            current_student_count: classItem.current_student_count || 0,
            is_active: classItem.is_active,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            color: classItem.color
          }))

        setClasses(searchResults)
      } else {
        console.error('클래스 검색 응답 오류:', data)
        setClasses([])
      }
    } catch (error) {
      console.error('클래스 검색 중 오류:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, supabase.auth, filterByGrade, filterBySubject, activeOnly, excludeClassIds])

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClasses(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchClasses])

  // Modal 열릴 때 초기 검색
  useEffect(() => {
    if (isOpen && tenantId) {
      setSearchQuery('')
      setSelectedClasses([])
      searchClasses('')
    }
  }, [isOpen, tenantId, searchClasses])

  // 클래스 선택/해제
  const handleClassToggle = useCallback((classItem: ClassSearchResult) => {
    if (allowMultiple) {
      setSelectedClasses(prev => {
        const isSelected = prev.some(c => c.id === classItem.id)
        
        if (isSelected) {
          return prev.filter(c => c.id !== classItem.id)
        } else {
          return [...prev, classItem]
        }
      })
    } else {
      // 단일 선택인 경우 바로 콜백 호출
      onClassSelected(classItem)
      onClose()
    }
  }, [allowMultiple, onClassSelected, onClose])

  // 선택 완료 (다중 선택인 경우)
  const handleConfirm = useCallback(() => {
    const firstClass = selectedClasses[0]
    if (firstClass) {
      // 다중 선택은 현재 미지원이지만 확장 가능
      onClassSelected(firstClass)
    }
    onClose()
  }, [selectedClasses, onClassSelected, onClose])

  // 클래스 정원 상태 확인
  const getCapacityStatus = (current: number, max: number | null) => {
    if (!max) return { status: 'unknown', text: `${current}명`, variant: 'secondary' as const }
    
    const percentage = (current / max) * 100
    
    if (percentage >= 100) {
      return { status: 'full', text: `정원마감 (${current}/${max})`, variant: 'destructive' as const }
    } else if (percentage >= 80) {
      return { status: 'nearly-full', text: `${current}/${max}명`, variant: 'outline' as const }
    } else {
      return { status: 'available', text: `${current}/${max}명`, variant: 'default' as const }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                {description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 검색 입력 */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="클래스 이름, 과목, 강사명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 필터 정보 표시 */}
        {(filterByGrade || filterBySubject) && (
          <div className="flex flex-wrap gap-2">
            {filterByGrade && (
              <Badge variant="outline">
                {filterByGrade}학년
              </Badge>
            )}
            {filterBySubject && (
              <Badge variant="outline">
                {filterBySubject}
              </Badge>
            )}
            {activeOnly && (
              <Badge variant="outline">
                활성 클래스만
              </Badge>
            )}
          </div>
        )}

        {/* 클래스 목록 */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="sm" />
              <span className="ml-2 text-gray-500">클래스를 검색하고 있습니다...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <UserGroupIcon className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="text-sm">다른 검색어를 시도해보세요</p>
            </div>
          ) : (
            <div className="divide-y">
              {classes.map((classItem) => {
                const isSelected = selectedClasses.some(c => c.id === classItem.id)
                const capacityStatus = getCapacityStatus(
                  classItem.current_student_count ?? 0, 
                  classItem.max_students ?? null
                )
                
                return (
                  <div
                    key={classItem.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 border-r-2 border-brand-500' : ''
                    }`}
                    onClick={() => handleClassToggle(classItem)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {classItem.name}
                          </h4>
                          <Badge variant={capacityStatus.variant}>
                            {capacityStatus.text}
                          </Badge>
                          {classItem.grade && (
                            <Badge variant="outline">
                              {classItem.grade}학년
                            </Badge>
                          )}
                          {!classItem.is_active && (
                            <Badge variant="secondary">
                              비활성
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {classItem.description && (
                            <p>{classItem.description}</p>
                          )}
                          {classItem.subject && (
                            <p>과목: {classItem.subject}</p>
                          )}
                          {classItem.course && (
                            <p>과정: {classItem.course}</p>
                          )}
                          {classItem.instructor_name && (
                            <p>담당강사: {classItem.instructor_name}</p>
                          )}
                          {classItem.start_date && classItem.end_date && (
                            <p>
                              기간: {new Date(classItem.start_date).toLocaleDateString()} ~ 
                              {new Date(classItem.end_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {allowMultiple && (
                        <div className="ml-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleClassToggle(classItem)}
                            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* 정원 초과 경고 */}
                    {capacityStatus.status === 'full' && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-sm text-red-700">
                        <UserGroupIcon className="w-4 h-4" />
                        이 클래스는 정원이 마감되었습니다.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 다중 선택인 경우에만 푸터 표시 */}
        {allowMultiple && (
          <SheetFooter>
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedClasses.length === 0}
            >
              {selectedClasses.length > 0 
                ? `${selectedClasses.length}개 클래스 선택` 
                : '클래스 선택'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
})

ClassSearchSelector.displayName = 'ClassSearchSelector'