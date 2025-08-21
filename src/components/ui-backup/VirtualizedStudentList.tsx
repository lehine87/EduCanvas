'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { usePerformanceProfiler, useWhyDidYouUpdate } from '@/hooks/usePerformanceMonitor'
import { useKeyboardNavigation, useScreenReaderSupport } from '@/hooks/useAccessibility'
import type { Student } from '@/types/student.types'
import { STUDENT_STATUS_BG_COLORS, STUDENT_STATUS_TEXT } from '@/constants/studentConstants'
import { 
  UserIcon,
  PhoneIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface VirtualizedStudentListProps {
  students: Student[]
  onStudentSelect: (student: Student) => void
  maxHeight?: number
  itemHeight?: number
  searchTerm?: string
  onSearchChange?: (term: string) => void
}

// 개별 학생 아이템 컴포넌트 (React.memo로 최적화)
const StudentItem = memo<{
  index: number
  style: React.CSSProperties
  data: {
    students: Student[]
    onStudentSelect: (student: Student) => void
    searchTerm: string
  }
}>(({ index, style, data }) => {
  const { students, onStudentSelect, searchTerm } = data
  const student = students[index]

  // student가 undefined인 경우 빈 요소 반환
  if (!student) {
    return <div style={style} />
  }

  // 검색어 하이라이트 (성능 최적화된 버전)
  const highlightText = useCallback((text: string, search: string) => {
    if (!search || !text) return text
    
    try {
      // 정규식 에스케이프 처리로 보안 강화
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedSearch})`, 'gi')
      const parts = text.split(regex)
      
      return parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={`highlight-${i}`} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : part
      )
    } catch (error) {
      // 정규식 오류 시 원본 텍스트 반환
      console.warn('Highlight text error:', error)
      return text
    }
  }, [])

  const getStatusColor = (status: string) => {
    return STUDENT_STATUS_BG_COLORS[status as keyof typeof STUDENT_STATUS_BG_COLORS] || STUDENT_STATUS_BG_COLORS.active
  }

  return (
    <div style={style} className="px-4">
      <div 
        className="cursor-pointer"
        onClick={() => onStudentSelect(student)}
      >
        <Card className="mb-2 hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* 아바타 */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {student.name.charAt(0)}
              </div>
              
              {/* 학생 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {highlightText(student.name, searchTerm)}
                  </h3>
                  <Badge className={getStatusColor(student.status || 'active')}>
                    {STUDENT_STATUS_TEXT[student.status as keyof typeof STUDENT_STATUS_TEXT] || STUDENT_STATUS_TEXT.active}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{highlightText(student.student_number, searchTerm)}</span>
                  </div>
                  
                  {student.grade_level && (
                    <div className="flex items-center space-x-1">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>{student.grade_level}</span>
                    </div>
                  )}
                  
                  {student.parent_phone_1 && (
                    <div className="flex items-center space-x-1">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{highlightText(student.parent_phone_1, searchTerm)}</span>
                    </div>
                  )}
                </div>
                
                {(student as any).school && (
                  <div className="text-xs text-gray-500 mt-1">
                    {(student as any).school}
                  </div>
                )}
              </div>
            </div>
            
            {/* 빠른 액션 버튼들 */}
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // 빠른 편집
                }}
              >
                편집
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // 상담 예약
                }}
              >
                상담
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
})

StudentItem.displayName = 'StudentItem'

// 메인 가상화된 학생 리스트 컴포넌트
export const VirtualizedStudentList = memo<VirtualizedStudentListProps>(({
  students,
  onStudentSelect,
  maxHeight = 600,
  itemHeight = 120,
  searchTerm = '',
  onSearchChange
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'grade'>('name')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 성능 모니터링 (개발 환경에서만)
  const { profileComponent } = usePerformanceProfiler('VirtualizedStudentList', {
    studentsCount: students.length,
    searchTerm: localSearchTerm,
    sortBy,
    filterStatus
  })

  // 리렌더링 추적 (필요시 활성화)
  useWhyDidYouUpdate('VirtualizedStudentList', {
    students,
    maxHeight,
    itemHeight,
    searchTerm,
    onStudentSelect,
    onSearchChange
  }, false) // 기본적으로 비활성화

  // 필터링 및 정렬된 학생 목록 (최적화된 메모이제이션)
  const filteredAndSortedStudents = useMemo(() => {
    // 메모이제이션 최적화: 검색어가 없고 필터가 기본값이면 원본 반환
    if (!localSearchTerm && filterStatus === 'all' && sortBy === 'name') {
      return [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    }

    let filtered = students

    // 상태 필터링 (조기 반환으로 성능 향상)
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus)
    }

    // 검색 필터링 (인덱스 기반 검색으로 최적화)
    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase()
      const searchTerms = searchLower.split(' ').filter(term => term.length > 0)
      
      filtered = filtered.filter(student => {
        const searchableText = [
          student.name,
          student.student_number,
          student.parent_phone_1,
          student.parent_phone_2,
          (student as any).school
        ].join(' ').toLowerCase()

        return searchTerms.every(term => searchableText.includes(term))
      })
    }

    // 정렬 (안정적인 정렬로 성능 향상)
    const collator = new Intl.Collator('ko', { 
      numeric: true, 
      sensitivity: 'base',
      ignorePunctuation: true 
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return collator.compare(a.name, b.name)
        case 'grade':
          return collator.compare(a.grade_level || '', b.grade_level || '')
        case 'recent':
          const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
          const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
          return bTime - aTime
        default:
          return 0
      }
    })
  }, [students, localSearchTerm, sortBy, filterStatus])

  // 접근성 지원
  const { announce } = useScreenReaderSupport()
  const {
    containerRef: navContainerRef,
    focusedIndex,
    registerItem
  } = useKeyboardNavigation(filteredAndSortedStudents, {
    onSelect: (index, student) => {
      announce(`학생 ${(student as Student).name} 포커스됨`)
    },
    onActivate: (index, student) => {
      onStudentSelect(student as Student)
      announce(`학생 ${(student as Student).name} 선택됨`)
    }
  })

  // 검색 핸들러
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchTerm(value)
    onSearchChange?.(value)
  }, [onSearchChange])

  // 리스트 데이터 (react-window에 전달)
  const listData = useMemo(() => ({
    students: filteredAndSortedStudents,
    onStudentSelect,
    searchTerm: localSearchTerm
  }), [filteredAndSortedStudents, onStudentSelect, localSearchTerm])

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 헤더 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색창 */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="이름, 학번, 연락처로 검색..."
                value={localSearchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  handleSearchChange(value)
                  if (value.trim()) {
                    announce(`검색어 입력: ${value}`)
                  }
                }}
                className="pl-10"
                aria-label="학생 검색"
                aria-describedby="virtualized-search-help"
              />
              <div id="virtualized-search-help" className="sr-only">
                학생 이름, 학번, 연락처로 검색할 수 있습니다.
              </div>
            </div>
            
            {/* 정렬 선택 */}
            <select
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value as typeof sortBy
                setSortBy(value)
                announce(`정렬 기준 변경: ${value === 'name' ? '이름순' : value === 'grade' ? '학년순' : '최근 수정순'}`)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="정렬 기준 선택"
            >
              <option value="name">이름순</option>
              <option value="grade">학년순</option>
              <option value="recent">최근 수정순</option>
            </select>
            
            {/* 상태 필터 */}
            <select
              value={filterStatus}
              onChange={(e) => {
                const value = e.target.value
                setFilterStatus(value)
                announce(`상태 필터 변경: ${value === 'all' ? '전체' : value}`)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="상태 필터 선택"
            >
              <option value="all">전체</option>
              <option value="active">활동중</option>
              <option value="inactive">비활성</option>
              <option value="graduated">졸업</option>
              <option value="withdrawn">탈퇴</option>
            </select>
          </div>
          
          {/* 결과 요약 */}
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>
              총 {filteredAndSortedStudents.length}명 
              {localSearchTerm && `(검색: "${localSearchTerm}")`}
            </span>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4" />
              <span>스마트 필터링 적용</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 가상화된 학생 리스트 */}
      <div 
        ref={navContainerRef as React.RefObject<HTMLDivElement>}
        className="border rounded-lg overflow-hidden"
        role="region"
        aria-label="학생 리스트"
        aria-describedby="list-description"
      >
        <div id="list-description" className="sr-only">
          총 {filteredAndSortedStudents.length}명의 학생이 있습니다. 위아래 화살표로 탐색할 수 있습니다.
        </div>
        {filteredAndSortedStudents.length > 0 ? (
          <List
            height={Math.min(maxHeight, filteredAndSortedStudents.length * itemHeight)}
            width="100%"
            itemCount={filteredAndSortedStudents.length}
            itemSize={itemHeight}
            itemData={listData}
            overscanCount={5} // 성능 최적화: 미리 렌더링할 아이템 수
          >
            {StudentItem}
          </List>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
            <p>다른 검색어를 시도하거나 필터를 조정해보세요.</p>
          </div>
        )}
      </div>

      {/* 성능 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 text-center space-y-1">
          <div>🚀 가상화된 리스트로 {filteredAndSortedStudents.length}명 중 최대 10개만 DOM에 렌더링됨</div>
          <button 
            onClick={profileComponent}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            📊 성능 프로파일링 실행
          </button>
        </div>
      )}
    </div>
  )
})

VirtualizedStudentList.displayName = 'VirtualizedStudentList'