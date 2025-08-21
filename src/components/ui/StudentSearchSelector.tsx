'use client'

import React, { memo, useCallback, useState, useEffect, useMemo } from 'react'
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
  XMarkIcon,
  UserPlusIcon,
  AcademicCapIcon 
} from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * 학생 정보 타입 (검색 결과용)
 */
export interface StudentSearchResult {
  id: string
  name: string
  student_number: string
  email?: string | null
  phone?: string | null
  parent_name?: string | null
  parent_phone_1?: string | null
  grade?: string | null
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
  current_class?: {
    id: string
    name: string
  } | null
}

/**
 * StudentSearchSelector Props
 */
export interface StudentSearchSelectorProps {
  /** Modal 열림 상태 */
  isOpen: boolean
  /** Modal 닫기 핸들러 */
  onClose: () => void
  /** 학생 선택 완료 핸들러 */
  onStudentsSelected: (students: StudentSearchResult[]) => void
  /** 다중 선택 허용 여부 */
  allowMultiple?: boolean
  /** 이미 등록된 학생 ID 목록 (중복 방지) */
  excludeStudentIds?: string[]
  /** 특정 클래스에서만 검색 */
  filterByClassId?: string | null
  /** 특정 상태의 학생만 검색 */
  filterByStatus?: 'active' | 'inactive' | 'all'
  /** 제목 커스터마이징 */
  title?: string
  /** 설명 커스터마이징 */
  description?: string
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * StudentSearchSelector - 학생 검색 및 선택 Modal 컴포넌트
 * 
 * 특징:
 * - 실시간 학생 검색 (이름, 학번, 전화번호)
 * - 다중/단일 선택 지원
 * - 이미 등록된 학생 제외
 * - 필터링 (클래스별, 상태별)
 * - 무한 스크롤 지원
 * - 접근성 완벽 지원
 */
export const StudentSearchSelector = memo<StudentSearchSelectorProps>(({
  isOpen,
  onClose,
  onStudentsSelected,
  allowMultiple = true,
  excludeStudentIds = [],
  filterByClassId = null,
  filterByStatus = 'active',
  title = '학생 검색 및 선택',
  description = '등록할 학생을 검색하고 선택하세요',
  className
}) => {
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<StudentSearchResult[]>([])
  const [selectedStudents, setSelectedStudents] = useState<StudentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // 인증 정보
  const { profile: userProfile } = useAuthStore()
  const tenantId = userProfile?.tenant_id

  // Supabase 클라이언트
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 학생 검색 함수
  const searchStudents = useCallback(async (
    query: string = '', 
    pageNum: number = 1, 
    append: boolean = false
  ) => {
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
        status: filterByStatus === 'all' ? 'all' : filterByStatus,
        limit: '20',
        offset: ((pageNum - 1) * 20).toString()
      })

      if (filterByClassId) {
        params.append('classId', filterByClassId)
      }

      console.log('🔍 학생 검색 요청:', {
        url: `/api/students?${params.toString()}`,
        params: Object.fromEntries(params),
        hasToken: !!session.access_token
      })

      const response = await fetch(`/api/students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 학생 검색 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 학생 검색 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`학생 검색 실패: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📋 학생 검색 응답 데이터:', data)
      
      // API 응답 구조: { success: true, data: { students: [], pagination: {} } }
      if (data.success && data.data && Array.isArray(data.data.students)) {
        const searchResults: StudentSearchResult[] = data.data.students
          .filter((student: any) => !excludeStudentIds.includes(student.id))
          .map((student: any) => ({
            id: student.id,
            name: student.name,
            student_number: student.student_number,
            email: student.email,
            phone: student.phone,
            parent_name: student.parent_name,
            parent_phone_1: student.parent_phone_1,
            grade: student.grade || student.grade_level, // grade_level도 확인
            status: student.status,
            current_class: student.classes ? {
              id: student.classes.id,
              name: student.classes.name
            } : null
          }))

        if (append) {
          setStudents(prev => [...prev, ...searchResults])
        } else {
          setStudents(searchResults)
        }

        setHasMore(data.data.pagination?.hasMore || false)
      } else {
        console.error('학생 검색 응답 오류:', data)
        setStudents([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('학생 검색 중 오류:', error)
      setStudents([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [tenantId, supabase.auth, filterByStatus, filterByClassId, excludeStudentIds])

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1)
      searchStudents(searchQuery, 1, false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchStudents])

  // Modal 열릴 때 초기 검색
  useEffect(() => {
    if (isOpen && tenantId) {
      setSearchQuery('')
      setSelectedStudents([])
      setPage(1)
      searchStudents('', 1, false)
    }
  }, [isOpen, tenantId, searchStudents])

  // 학생 선택/해제
  const handleStudentToggle = useCallback((student: StudentSearchResult) => {
    setSelectedStudents(prev => {
      const isSelected = prev.some(s => s.id === student.id)
      
      if (isSelected) {
        // 선택 해제
        return prev.filter(s => s.id !== student.id)
      } else {
        // 선택 추가
        if (allowMultiple) {
          return [...prev, student]
        } else {
          return [student]
        }
      }
    })
  }, [allowMultiple])

  // 더 보기 (무한 스크롤)
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      searchStudents(searchQuery, nextPage, true)
    }
  }, [loading, hasMore, page, searchQuery, searchStudents])

  // 선택 완료
  const handleConfirm = useCallback(() => {
    onStudentsSelected(selectedStudents)
    onClose()
  }, [selectedStudents, onStudentsSelected, onClose])

  // 선택된 학생 수
  const selectedCount = selectedStudents.length

  // 학생 상태 뱃지 색상
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'graduated': return 'outline'
      case 'suspended': return 'destructive'
      default: return 'secondary'
    }
  }

  // 학생 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '재학'
      case 'inactive': return '비활성'
      case 'graduated': return '졸업'
      case 'suspended': return '휴학'
      default: return status
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                {description}
                {selectedCount > 0 && (
                  <span className="ml-2 text-brand-600 font-medium">
                    ({selectedCount}명 선택됨)
                  </span>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 검색 입력 */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="학생 이름, 학번, 전화번호로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 선택된 학생 미리보기 */}
        {selectedCount > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              선택된 학생 ({selectedCount}명)
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedStudents.map((student) => (
                <Badge
                  key={student.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {student.name} ({student.student_number})
                  <button
                    onClick={() => handleStudentToggle(student)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 학생 목록 */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading && students.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="sm" />
              <span className="ml-2 text-gray-500">학생을 검색하고 있습니다...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AcademicCapIcon className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="text-sm">다른 검색어를 시도해보세요</p>
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => {
                const isSelected = selectedStudents.some(s => s.id === student.id)
                
                return (
                  <div
                    key={student.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 border-r-2 border-brand-500' : ''
                    }`}
                    onClick={() => handleStudentToggle(student)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {student.name}
                          </h4>
                          <Badge variant={getStatusBadgeVariant(student.status)}>
                            {getStatusText(student.status)}
                          </Badge>
                          {student.grade && (
                            <Badge variant="outline">
                              {student.grade}학년
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>학번: {student.student_number}</p>
                          {student.phone && (
                            <p>전화번호: {student.phone}</p>
                          )}
                          {student.parent_name && student.parent_phone_1 && (
                            <p>학부모: {student.parent_name} ({student.parent_phone_1})</p>
                          )}
                          {student.current_class && (
                            <p>현재 클래스: {student.current_class.name}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleStudentToggle(student)}
                          className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* 더 보기 버튼 */}
              {hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        로딩 중...
                      </>
                    ) : (
                      '더 보기'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedCount === 0}
          >
            {selectedCount > 0 
              ? `${selectedCount}명 선택 완료` 
              : '학생 선택'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
})

StudentSearchSelector.displayName = 'StudentSearchSelector'