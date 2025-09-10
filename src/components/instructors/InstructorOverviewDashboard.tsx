'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader } from '@/components/data-table'
import InstructorStatsGrid from './InstructorStatsGrid'
import InstructorSearchAndFilters from './InstructorSearchAndFilters'
import { useInstructorsWithFilters, useInstructorStats } from '@/hooks/queries'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  PlusIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import type { Instructor, InstructorFilters, StaffInfo, InstructorDashboardStats } from '@/types/instructor.types'
import type { ColumnDef } from '@tanstack/react-table'
import { useAuthStore } from '@/store/useAuthStore'
import { useInstructorsStore } from '@/store/instructorsStore'

interface InstructorOverviewDashboardProps {
  onInstructorSelect?: (instructor: Instructor) => void
  onCreateInstructor?: () => void
  className?: string
}

// 강사 데이터 테이블용 컬럼 정의
const createInstructorColumns = (onInstructorSelect?: (instructor: Instructor) => void): ColumnDef<Instructor>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>이름</SortableHeader>
    ),
    cell: ({ row }) => {
      const instructor = row.original
      const staffInfo = instructor.staff_info as StaffInfo
      return (
        <div className="flex items-center space-x-2">
          <div 
            className="font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onInstructorSelect?.(instructor)}
          >
            {instructor.user?.name || '이름 없음'}
          </div>
          {staffInfo?.employee_id && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({staffInfo.employee_id})
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "employee_id",
    header: ({ column }) => (
      <SortableHeader column={column}>사번</SortableHeader>
    ),
    cell: ({ row }) => {
      const staffInfo = row.original.staff_info as StaffInfo
      return staffInfo?.employee_id || "-"
    },
  },
  {
    accessorKey: "department", 
    header: ({ column }) => (
      <SortableHeader column={column}>부서</SortableHeader>
    ),
    cell: ({ row }) => {
      const staffInfo = row.original.staff_info as StaffInfo
      return staffInfo?.department || "-"
    },
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
    accessorKey: "employment_type",
    header: "고용형태",
    cell: ({ row }) => {
      const staffInfo = row.original.staff_info as StaffInfo
      return staffInfo?.employment_type || "-"
    },
    enableSorting: false,
  },
  {
    accessorKey: "hire_date",
    header: ({ column }) => (
      <SortableHeader column={column}>입사일</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = row.getValue("hire_date") as string
      if (!date) return "-"
      return new Date(date).toLocaleDateString('ko-KR')
    },
  },
]

// 상태별 텍스트 변환 함수
const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '재직'
    case 'inactive': return '퇴직'
    case 'pending': return '대기'
    default: return status
  }
}

// 상태별 배지 색상
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default'
    case 'inactive': return 'secondary'
    case 'pending': return 'outline'
    default: return 'secondary'
  }
}

export default function InstructorOverviewDashboard({ 
  onInstructorSelect, 
  onCreateInstructor,
  className = '' 
}: InstructorOverviewDashboardProps) {
  const { profile } = useAuthStore()
  
  // T-V2-012: 고도화된 필터링 시스템 사용
  const [filters, setFilters] = useState<InstructorFilters>({
    limit: 20,
    sort_field: 'name',
    sort_order: 'asc',
  })
  
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selectedInstructors, setSelectedInstructors] = useState<Instructor[]>([])
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false)
  
  // 통계 카드 필터 상태 (기존 방식과 호환성 유지)
  const [statsFilter, setStatsFilter] = useState<{ type: string, value?: string } | null>(null)

  // React Query 기반 데이터 로딩
  const {
    data: instructorsData,
    isLoading: loading,
    isError,
    error,
    refetch
  } = useInstructorsWithFilters(filters)

  // 전체 강사 통계 데이터 (임시로 비활성화)
  const allInstructorsStats: InstructorDashboardStats | null = null
  const statsLoading = false
  const statsError = false
  const statsErrorMessage = null
  // TODO: Create useAllInstructorsStats hook for overview statistics

  // 통계 데이터 디버깅
  console.log('📊 [InstructorOverviewDashboard] 통계 상태:', {
    allInstructorsStats,
    statsLoading,
    statsError,
    statsErrorMessage: statsErrorMessage,
    hasData: !!allInstructorsStats
  })

  // 데이터 추출
  const instructors = instructorsData?.instructors || []
  const pagination = instructorsData?.pagination || { total_count: 0, has_more: false }
  const totalCount = 'total_count' in pagination ? pagination.total_count : pagination.total

  // Fallback: 기존 store 데이터도 사용 (마이그레이션 기간)
  const legacyInstructors = useInstructorsStore((state) => state.instructors)
  const legacyLoading = useInstructorsStore((state) => state.loading)
  const fetchInstructors = useInstructorsStore((state) => state.actions.fetchInstructors)

  // 실제 사용할 데이터 결정
  const finalInstructors = useAdvancedFilters ? instructors : legacyInstructors
  const finalLoading = useAdvancedFilters ? loading : legacyLoading
  const finalTotalCount = useAdvancedFilters ? totalCount : legacyInstructors.length

  // 레거시 모드에서는 기존 방식으로 데이터 로드
  useEffect(() => {
    if (!useAdvancedFilters && profile?.tenant_id) {
      console.log('👨‍🏫 [InstructorOverviewDashboard] 레거시 강사 데이터 로드:', profile.tenant_id)
      fetchInstructors(profile.tenant_id)
    }
  }, [profile?.tenant_id, fetchInstructors, useAdvancedFilters])

  // 디버깅용 로그
  console.log('👨‍🏫 [InstructorOverviewDashboard] 렌더링:', {
    instructorsCount: finalInstructors.length,
    loading: finalLoading,
    totalCount: finalTotalCount,
    useAdvancedFilters,
    firstInstructor: finalInstructors[0] ? { id: finalInstructors[0].id, name: finalInstructors[0].user?.name } : null
  })

  // T-V2-012: 고도화된 필터링 핸들러
  const handleFiltersChange = useCallback((newFilters: InstructorFilters) => {
    setFilters(prevFilters => {
      // 동일한 필터인 경우 업데이트하지 않음 (무한 루프 방지)
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters
      }
      return newFilters
    })
    setSelectedInstructors([]) // 필터 변경 시 선택 초기화
  }, [])

  // 통계 카드 필터 핸들러 (기존 방식 + 새로운 방식 통합)
  const handleStatsFilterApply = useCallback((filterType: 'all' | 'active' | 'inactive' | 'pending' | 'recent' | 'department', filterValue?: string) => {
    if (useAdvancedFilters) {
      // 새로운 방식: InstructorFilters 형식으로 변환
      if (filterType === 'all') {
        setFilters(prev => ({
          ...prev,
          status: undefined,
          department: undefined,
          hire_date_from: undefined,
          hire_date_to: undefined,
        }))
      } else if (filterType === 'active' || filterType === 'inactive' || filterType === 'pending') {
        setFilters(prev => ({
          ...prev,
          status: filterType as any
        }))
      } else if (filterType === 'recent') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        setFilters(prev => ({
          ...prev,
          hire_date_from: thirtyDaysAgo.toISOString()
        }))
      } else if (filterType === 'department' && filterValue) {
        setFilters(prev => ({
          ...prev,
          department: filterValue
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
    })
  }, [])

  // 필터링된 강사 목록 (레거시 모드에서만 사용)
  const filteredInstructors = useAdvancedFilters ? finalInstructors : finalInstructors.filter((instructor: Instructor) => {
    // 통계 카드 필터 우선 적용
    if (statsFilter) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const staffInfo = instructor.staff_info as StaffInfo
      
      switch (statsFilter.type) {
        case 'active':
          if (instructor.status !== 'active') return false
          break
        case 'inactive':
          if (instructor.status !== 'inactive') return false
          break
        case 'pending':
          if (instructor.status !== 'pending') return false
          break
        case 'recent':
          if (!instructor.hire_date || new Date(instructor.hire_date) <= thirtyDaysAgo) return false
          break
        case 'department':
          if (!statsFilter.value || staffInfo?.department !== statsFilter.value) return false
          break
        default:
          break
      }
    }

    return true
  })

  // 다중 선택 핸들러
  const handleRowSelect = (selectedRows: Instructor[]) => {
    setSelectedInstructors(selectedRows)
  }

  // 데이터 내보내기
  const handleExport = () => {
    console.log('Export instructors data:', filteredInstructors)
    // TODO: 실제 내보내기 구현
  }

  // 일괄 처리 핸들러
  const handleBatchAction = (action: string) => {
    console.log('Batch action:', action, 'for instructors:', selectedInstructors)
    // TODO: 실제 일괄 처리 구현
  }

  const columns = createInstructorColumns(onInstructorSelect)

  return (
    <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-950 ${className}`}>
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6 space-y-6 overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                강사 현황
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                전체 강사 정보를 관리하고 분석하세요
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleExport}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                내보내기
              </Button>
              {onCreateInstructor && (
                <Button onClick={onCreateInstructor}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  강사 등록
                </Button>
              )}
            </div>
          </div>

          {/* 통계 카드 그리드 - 전체 통계 데이터 사용 */}
          <InstructorStatsGrid 
            stats={allInstructorsStats} // API 통계 데이터 사용
            isLoading={statsLoading}
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
                /* T-V2-012: 고도화된 다중 필터링 컴포넌트 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      고급 필터링 시스템 (T-V2-012)
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      React Query + API 연동
                    </Badge>
                  </div>
                  <InstructorSearchAndFilters
                    onFilterChange={handleFiltersChange}
                    initialFilters={filters}
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
                          statsFilter.type === 'active' ? '재직' :
                          statsFilter.type === 'inactive' ? '퇴직' :
                          statsFilter.type === 'pending' ? '대기' :
                          statsFilter.type === 'recent' ? '최근 입사' :
                          statsFilter.type === 'department' ? `부서: ${statsFilter.value}` :
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

          {/* 선택된 강사 정보 - 고정 높이로 레이아웃 변경 방지 */}
          <div className="h-16"> {/* 고정 높이 컨테이너 */}
            {selectedInstructors.length > 0 ? (
              <Card className="h-full bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="h-full p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="h-7">
                      {selectedInstructors.length}명 선택됨
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
                      onClick={() => handleBatchAction('department')}
                      className="h-8"
                    >
                      부서 이동
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedInstructors([])}
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
                    강사를 선택하면 일괄 작업 옵션이 표시됩니다
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
                        <span>🚀 고급 필터링 결과: {filteredInstructors.length}명</span>
                        <span>
                          {loading ? '🔄 로딩 중...' : 
                           isError ? '❌ 에러 발생' : 
                           '✅ 데이터 로드 완료'}
                        </span>
                      </div>
                    ) : (
                      <span>📋 기본 필터링 결과: {filteredInstructors.length}명</span>
                    )}
                  </div>
                  
                  <DataTable
                    columns={columns}
                    data={filteredInstructors}
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