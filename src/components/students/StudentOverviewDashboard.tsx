'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader } from '@/components/data-table'
import StudentStatsGrid from './StudentStatsGrid'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import type { Student } from '@/types/student.types'
import type { ColumnDef } from '@tanstack/react-table'
import { useAuthStore } from '@/store/useAuthStore'
import { useStudentsStore } from '@/store/studentsStore'

interface StudentOverviewDashboardProps {
  onStudentSelect?: (student: Student) => void
  onCreateStudent?: () => void
  className?: string
}

// 학생 데이터 테이블용 컬럼 정의
const createStudentColumns = (onStudentSelect?: (student: Student) => void): ColumnDef<Student>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>이름</SortableHeader>
    ),
    cell: ({ row }) => {
      const student = row.original
      return (
        <div className="flex items-center space-x-2">
          <div 
            className="font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onStudentSelect?.(student)}
          >
            {student.name}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "student_number",
    header: ({ column }) => (
      <SortableHeader column={column}>학번</SortableHeader>
    ),
    cell: ({ row }) => row.getValue("student_number") || "-",
  },
  {
    accessorKey: "grade_level", 
    header: ({ column }) => (
      <SortableHeader column={column}>학년</SortableHeader>
    ),
    cell: ({ row }) => row.getValue("grade_level") || "-",
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>상태</SortableHeader>
    ), 
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusText = getStatusText(status || 'active')
      const variant = getStatusBadgeVariant(status || 'active')
      
      return <Badge variant={variant}>{statusText}</Badge>
    },
  },
  {
    accessorKey: "phone",
    header: "연락처",
    cell: ({ row }) => row.getValue("phone") || "-",
    enableSorting: false,
  },
  {
    accessorKey: "enrollment_date",
    header: ({ column }) => (
      <SortableHeader column={column}>등록일</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = row.getValue("enrollment_date") as string
      if (!date) return "-"
      return new Date(date).toLocaleDateString('ko-KR')
    },
  },
]

// 상태별 텍스트 변환 함수
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

// 상태별 배지 색상
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

// Mock 데이터 제거됨 - 실제 StudentsStore 데이터 사용

export default function StudentOverviewDashboard({ 
  onStudentSelect, 
  onCreateStudent,
  className = '' 
}: StudentOverviewDashboardProps) {
  const { profile } = useAuthStore()
  const students = useStudentsStore((state) => state.students)
  const loading = useStudentsStore((state) => state.loading)
  const totalCount = useStudentsStore((state) => state.totalCount)
  const pagination = useStudentsStore((state) => state.pagination)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  
  // 필터 상태
  const [filters, setFilters] = useState({
    grades: [] as string[],
    statuses: [] as string[],
    classes: [] as string[],
    dateRange: null as { from: Date, to: Date } | null
  })

  // StudentsStore는 이미 학생 데이터를 로드하고 있으므로 별도의 useEffect가 필요 없음

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student => {
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesName = student.name.toLowerCase().includes(searchLower)
      const matchesNumber = student.student_number?.toLowerCase().includes(searchLower)
      const matchesPhone = student.phone?.toLowerCase().includes(searchLower)
      
      if (!matchesName && !matchesNumber && !matchesPhone) {
        return false
      }
    }

    // 학년 필터
    if (filters.grades.length > 0 && student.grade_level) {
      if (!filters.grades.includes(student.grade_level)) {
        return false
      }
    }

    // 상태 필터  
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(student.status || 'active')) {
        return false
      }
    }

    return true
  })

  // 다중 선택 핸들러
  const handleRowSelect = (selectedRows: Student[]) => {
    setSelectedStudents(selectedRows)
  }

  // 데이터 내보내기
  const handleExport = () => {
    console.log('Export students data:', filteredStudents)
    // TODO: 실제 내보내기 구현
  }

  // 일괄 처리 핸들러
  const handleBatchAction = (action: string) => {
    console.log('Batch action:', action, 'for students:', selectedStudents)
    // TODO: 실제 일괄 처리 구현
  }

  const columns = createStudentColumns(onStudentSelect)

  return (
    <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-950 ${className}`}>
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6 space-y-6 overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                학생 현황
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                전체 학생 정보를 관리하고 분석하세요
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleExport}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                내보내기
              </Button>
              {onCreateStudent && (
                <Button onClick={onCreateStudent}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  학생 등록
                </Button>
              )}
            </div>
          </div>

          {/* 통계 카드 그리드 */}
          <StudentStatsGrid 
            students={filteredStudents}
            totalStudents={totalCount || students.length}
          />

          {/* 통합 검색 및 필터 바 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* 검색 */}
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="학생명, 학번, 연락처로 검색..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* 뷰 모드 전환 */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <TableCellsIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </Button>
                </div>

                {/* 고급 필터 */}
                <Button variant="outline" size="sm">
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                  필터
                </Button>
              </div>

              {/* 활성 필터 표시 */}
              {(filters.grades.length > 0 || filters.statuses.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {filters.grades.map(grade => (
                    <Badge key={grade} variant="secondary">
                      학년: {grade}
                    </Badge>
                  ))}
                  {filters.statuses.map(status => (
                    <Badge key={status} variant="secondary">
                      상태: {getStatusText(status)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 선택된 학생 정보 - 고정 높이로 레이아웃 변경 방지 */}
          <Card className={`transition-all duration-300 ${
            selectedStudents.length > 0 
              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 opacity-100' 
              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-50'
          }`}>
            <CardContent className="p-4">
              {selectedStudents.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant="default">
                      {selectedStudents.length}명 선택됨
                    </Badge>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      선택된 학생들에 대한 일괄 작업을 수행할 수 있습니다
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchAction('status')}
                    >
                      상태 변경
                    </Button>
                    <Button
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBatchAction('move')}
                    >
                      반 이동
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStudents([])}
                    >
                      선택 해제
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-12">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    학생을 선택하면 일괄 작업 옵션이 표시됩니다
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 데이터 테이블 */}
          <Card>
            <CardContent className="p-0">
              {viewMode === 'table' ? (
                <DataTable
                  columns={columns}
                  data={filteredStudents}
                  searchable={false}
                  selectable={true}
                  onRowSelect={handleRowSelect}
                  pagination={true}
                  pageSize={20}
                  pageSizeOptions={[10, 20, 50, 100]}
                  enableColumnResizing={true}
                  columnResizeMode="onChange"
                />
              ) : (
                <div className="p-4">
                  <div className="text-center py-8">
                    <Squares2X2Icon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      카드 뷰는 곧 구현 예정입니다
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}