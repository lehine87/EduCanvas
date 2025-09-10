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
import { useStudentsWithFilters, useStudentStats } from '@/hooks/queries/useStudents'
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
  
  // T-V2-009: 고도화된 필터링 시스템 사용
  const [filters, setFilters] = useState<StudentFilters>({
    limit: 20,
    sort_field: 'name',
    sort_order: 'asc',
    include_enrollment: true,
    include_attendance_stats: false,
  })
  
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false)
  
  // 통계 카드 필터 상태 (기존 방식과 호환성 유지)
  const [statsFilter, setStatsFilter] = useState<{ type: string, value?: string } | null>(null)

  // React Query 기반 데이터 로딩
  const {
    data: studentsData,
    isLoading: loading,
    isError,
    error,
    refetch
  } = useStudentsWithFilters(filters)

  // 전체 학생 통계 데이터 (필터링과 무관하게)
  const {
    data: allStudentsStats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorMessage
  } = useStudentStats()

  // 통계 데이터 디버깅
  console.log('📊 [StudentOverviewDashboard] 통계 상태:', {
    allStudentsStats,
    statsLoading,
    statsError,
    statsErrorMessage: statsErrorMessage?.message,
    hasData: !!allStudentsStats
  })


  // 데이터 추출
  const students = studentsData?.items || []
  const pagination = studentsData?.pagination || { total_count: 0, has_more: false }
  const totalCount = pagination.total_count

  // Fallback: 기존 store 데이터도 사용 (마이그레이션 기간)
  const legacyStudents = useStudentsStore((state) => state.students)
  const legacyLoading = useStudentsStore((state) => state.loading)
  const fetchStudents = useStudentsStore((state) => state.actions.fetchStudents)

  // 실제 사용할 데이터 결정
  const finalStudents = useAdvancedFilters ? students : legacyStudents
  const finalLoading = useAdvancedFilters ? loading : legacyLoading
  const finalTotalCount = useAdvancedFilters ? totalCount : legacyStudents.length

  // 레거시 모드에서는 기존 방식으로 데이터 로드
  useEffect(() => {
    if (!useAdvancedFilters && profile?.tenant_id) {
      console.log('🎓 [StudentOverviewDashboard] 레거시 학생 데이터 로드:', profile.tenant_id)
      fetchStudents(profile.tenant_id)
    }
  }, [profile?.tenant_id, fetchStudents, useAdvancedFilters])

  // 디버깅용 로그
  console.log('🎓 [StudentOverviewDashboard] 렌더링:', {
    studentsCount: finalStudents.length,
    loading: finalLoading,
    totalCount: finalTotalCount,
    useAdvancedFilters,
    firstStudent: finalStudents[0] ? { id: finalStudents[0].id, name: finalStudents[0].name } : null
  })

  // T-V2-009: 고도화된 필터링 핸들러
  const handleFiltersChange = useCallback((newFilters: StudentFilters) => {
    setFilters(prevFilters => {
      // 동일한 필터인 경우 업데이트하지 않음 (무한 루프 방지)
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters
      }
      return newFilters
    })
    setSelectedStudents([]) // 필터 변경 시 선택 초기화
  }, [])

  // 통계 카드 필터 핸들러 (기존 방식 + 새로운 방식 통합)
  const handleStatsFilterApply = useCallback((filterType: 'all' | 'active' | 'inactive' | 'graduated' | 'recent' | 'grade', filterValue?: string) => {
    if (useAdvancedFilters) {
      // 새로운 방식: StudentFilters 형식으로 변환
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
    } else {
      // 기존 방식
      if (filterType === 'all') {
        setStatsFilter(null)
      } else {
        setStatsFilter({ type: filterType, value: filterValue })
      }
    }
  }, [useAdvancedFilters])

  // 고급 필터 모드 토글
  const handleToggleAdvancedFilters = useCallback(() => {
    setUseAdvancedFilters(prev => !prev)
    setStatsFilter(null) // 모드 변경 시 기존 필터 초기화
    setFilters({
      limit: 20,
      sort_field: 'name',
      sort_order: 'asc',
      include_enrollment: true,
      include_attendance_stats: false,
    })
  }, [])

  // 필터링된 학생 목록 (레거시 모드에서만 사용)
  const filteredStudents = useAdvancedFilters ? finalStudents : finalStudents.filter((student: Student) => {
    // 통계 카드 필터 우선 적용
    if (statsFilter) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      switch (statsFilter.type) {
        case 'active':
          if (student.status !== 'active') return false
          break
        case 'inactive':
          if (student.status !== 'inactive') return false
          break
        case 'graduated':
          if (student.status !== 'graduated') return false
          break
        case 'recent':
          if (!student.enrollment_date || new Date(student.enrollment_date) <= thirtyDaysAgo) return false
          break
        case 'grade':
          if (!statsFilter.value || student.grade_level !== statsFilter.value) return false
          break
        default:
          break
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

          {/* 통계 카드 그리드 - 전체 통계 데이터 사용 */}
          <StudentStatsGrid 
            students={finalStudents} // 필터링된 데이터 (호환성 유지)
            totalStudents={allStudentsStats?.total_students || finalTotalCount} // 전체 통계 우선 사용
            statsData={allStudentsStats} // API 통계 데이터 사용
            onFilterApply={handleStatsFilterApply}
            activeFilter={statsFilter || undefined}
          />

          {/* 필터링 시스템 선택 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">필터링 방식:</span>
                  <Button
                    variant={useAdvancedFilters ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleToggleAdvancedFilters}
                  >
                    {useAdvancedFilters ? '🚀 고급 필터' : '📋 기본 필터'}
                  </Button>
                </div>
                
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
              </div>

              {useAdvancedFilters ? (
                /* T-V2-009: 고도화된 다중 필터링 컴포넌트 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      고급 필터링 시스템 (T-V2-009)
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      React Query + API 연동
                    </Badge>
                  </div>
                  <StudentSearchAndFilters
                    onFiltersChange={handleFiltersChange}
                    activeFilters={filters}
                    isLoading={loading}
                    totalResults={totalCount}
                    className="border-0 p-0 shadow-none"
                  />
                </div>
              ) : (
                /* 기존 단순 검색 방식 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      기본 필터링 (기존 방식)
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Store 기반
                    </Badge>
                  </div>
                  
                  {/* 활성 필터 표시 */}
                  {statsFilter && (
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="default" 
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                      >
                        📊 {
                          statsFilter.type === 'active' ? '재학중' :
                          statsFilter.type === 'inactive' ? '휴학/정지' :
                          statsFilter.type === 'graduated' ? '졸업' :
                          statsFilter.type === 'recent' ? '최근 등록' :
                          statsFilter.type === 'grade' ? `학년: ${statsFilter.value}` :
                          '전체'
                        }
                        <button 
                          onClick={() => setStatsFilter(null)}
                          className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 선택된 학생 정보 - 고정 높이로 레이아웃 변경 방지 */}
          <div className="h-16"> {/* 고정 높이 컨테이너 */}
            {selectedStudents.length > 0 ? (
              <Card className="h-full bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="h-full p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="h-7">
                      {selectedStudents.length}명 선택됨
                    </Badge>
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      일괄 작업 가능
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchAction('status')}
                      className="h-8"
                    >
                      상태 변경
                    </Button>
                    <Button
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBatchAction('move')}
                      className="h-8"
                    >
                      반 이동
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedStudents([])}
                      className="h-8 text-gray-600 dark:text-gray-400"
                    >
                      선택 해제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="h-full p-3 flex items-center justify-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    학생을 선택하면 일괄 작업 옵션이 표시됩니다
                  </span>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 데이터 테이블 */}
          <Card>
            <CardContent className="p-0">
              {viewMode === 'table' ? (
                <div className="space-y-2">
                  {/* 데이터 상태 표시 */}
                  <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground border-b">
                    {useAdvancedFilters ? (
                      <div className="flex items-center justify-between">
                        <span>🚀 고급 필터링 결과: {filteredStudents.length}명</span>
                        <span>
                          {loading ? '🔄 로딩 중...' : 
                           isError ? '❌ 에러 발생' : 
                           '✅ 데이터 로드 완료'}
                        </span>
                      </div>
                    ) : (
                      <span>📋 기본 필터링 결과: {filteredStudents.length}명</span>
                    )}
                  </div>
                  
                  <DataTable
                    columns={columns}
                    data={filteredStudents}
                    searchable={false}
                    selectable={true}
                    onRowSelect={handleRowSelect}
                    pagination={true}
                    pageSize={useAdvancedFilters ? (filters.limit || 20) : 20}
                    pageSizeOptions={[10, 20, 50, 100]}
                    enableColumnResizing={true}
                    columnResizeMode="onChange"
                  />
                </div>
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