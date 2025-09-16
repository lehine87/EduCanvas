'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader } from '@/components/data-table'
import StudentStatsGrid from './StudentStatsGrid'
import StudentSearchAndFilters from './StudentSearchAndFilters'
import { useStudentsWithFilters, useStudentDashboardStats } from '@/hooks/queries/useStudents'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import type { Student, StudentFilters } from '@/types/student.types'
import type { ColumnDef } from '@tanstack/react-table'
import { useAuthStore } from '@/store/useAuthStore'

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

export default function StudentOverviewDashboard({
  onStudentSelect,
  onCreateStudent,
  className = ''
}: StudentOverviewDashboardProps) {
  const { profile } = useAuthStore()

  // 필터링 상태
  const [filters, setFilters] = useState<StudentFilters>({
    limit: 20,
    sort_field: 'name',
    sort_order: 'asc',
    include_enrollment: true,
    include_attendance_stats: false,
  })

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

  // React Query 기반 데이터 로딩
  const {
    data: studentsData,
    isLoading: loading,
    isError,
    error,
    refetch
  } = useStudentsWithFilters(filters)

  // 대시보드 통계 로딩 (캐시되어 안정적)
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    isError: statsError
  } = useStudentDashboardStats()

  // 데이터 추출
  const students = studentsData?.items || []
  const pagination = studentsData?.pagination || { total_count: 0, has_more: false }

  // 필터링 핸들러
  const handleFiltersChange = useCallback((newFilters: StudentFilters) => {
    setFilters(prevFilters => {
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters
      }
      return newFilters
    })
    setSelectedStudents([]) // 필터 변경 시 선택 초기화
  }, [])

  // 통계 카드 필터 핸들러
  const handleStatsFilterApply = useCallback((filterType: 'all' | 'active' | 'inactive' | 'graduated' | 'recent' | 'grade', filterValue?: string) => {
    if (filterType === 'all') {
      setFilters(prev => ({
        ...prev,
        status: undefined,
        grade: undefined,
        enrollment_date_from: undefined,
        enrollment_date_to: undefined,
      }))
    } else if (filterType === 'active' || filterType === 'inactive' || filterType === 'graduated') {
      setFilters(prev => ({
        ...prev,
        status: [filterType as any]
      }))
    } else if (filterType === 'recent') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      setFilters(prev => ({
        ...prev,
        enrollment_date_from: thirtyDaysAgo.toISOString()
      }))
    } else if (filterType === 'grade' && filterValue) {
      setFilters(prev => ({
        ...prev,
        grade: [filterValue]
      }))
    }
  }, [])

  // 행 선택 핸들러
  const handleRowSelect = useCallback((selectedRows: Student[]) => {
    setSelectedStudents(selectedRows)
  }, [])

  // 검색 핸들러
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined
    }))
  }, [])

  // 테이블 컬럼 생성
  const columns = createStudentColumns(onStudentSelect)

  if (isError) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">학생 데이터를 불러오는데 실패했습니다.</p>
          <Button onClick={() => refetch()} variant="outline">
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={`flex flex-col min-h-0 flex-1 overflow-hidden ${className}`}>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
      {/* 통계 섹션 */}
      <StudentStatsGrid
        students={students}
        totalStudents={dashboardStats?.total_students || pagination.total_count}
        statsData={dashboardStats}
        onFilterApply={handleStatsFilterApply}
        className="mb-6"
      />

      {/* 헤더 및 액션 */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            학생 관리
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            총 {pagination.total_count}명의 학생
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
          >
            {viewMode === 'table' ? <Squares2X2Icon className="w-4 h-4" /> : <TableCellsIcon className="w-4 h-4" />}
            {viewMode === 'table' ? '카드뷰' : '테이블뷰'}
          </Button>

          <Button
            onClick={onCreateStudent}
            size="sm"
            className="bg-educanvas-500 hover:bg-educanvas-600"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            학생 등록
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <StudentSearchAndFilters
            activeFilters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* 데이터 테이블 */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <DataTable
              columns={columns}
              data={students}
              loading={loading}
              noDataMessage="등록된 학생이 없습니다"
              selectable={true}
              onRowSelect={handleRowSelect}
              pagination={true}
              pageSize={filters.limit || 20}
              pageSizeOptions={[10, 20, 50, 100]}
              enableColumnResizing={true}
              columnResizeMode="onChange"
            />
          </div>
        </CardContent>
      </Card>

      {/* 선택된 학생 정보 */}
      {selectedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              선택된 학생 ({selectedStudents.length}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedStudents.map((student) => (
                <Badge key={student.id} variant="secondary" className="text-xs">
                  {student.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}