'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import type { Student } from '@/types/student.types'
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

  // 검색어 하이라이트
  const highlightText = useCallback((text: string, search: string) => {
    if (!search) return text
    
    const regex = new RegExp(`(${search})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }, [])

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      graduated: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || colors.active
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
                    {student.status === 'active' ? '활동중' : 
                     student.status === 'inactive' ? '비활성' :
                     student.status === 'graduated' ? '졸업' :
                     student.status === 'withdrawn' ? '탈퇴' : '정지'}
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
                
                {student.school_name && (
                  <div className="text-xs text-gray-500 mt-1">
                    {student.school_name}
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

  // 필터링 및 정렬된 학생 목록
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus)
    }

    // 검색 필터링
    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase()
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.student_number.toLowerCase().includes(searchLower) ||
        student.parent_phone_1?.includes(localSearchTerm) ||
        student.parent_phone_2?.includes(localSearchTerm) ||
        student.school_name?.toLowerCase().includes(searchLower)
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ko')
        case 'grade':
          return (a.grade_level || '').localeCompare(b.grade_level || '', 'ko')
        case 'recent':
          return new Date(b.updated_at || b.created_at || '').getTime() - 
                 new Date(a.updated_at || a.created_at || '').getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [students, localSearchTerm, sortBy, filterStatus])

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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 정렬 선택 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">이름순</option>
              <option value="grade">학년순</option>
              <option value="recent">최근 수정순</option>
            </select>
            
            {/* 상태 필터 */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="border rounded-lg overflow-hidden">
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
        <div className="text-xs text-gray-400 text-center">
          🚀 가상화된 리스트로 {filteredAndSortedStudents.length}명 중 최대 10개만 DOM에 렌더링됨
        </div>
      )}
    </div>
  )
})

VirtualizedStudentList.displayName = 'VirtualizedStudentList'