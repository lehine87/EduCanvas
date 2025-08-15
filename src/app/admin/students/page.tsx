'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { StudentCard } from '@/components/ui/classflow/StudentCard'
import { LoadingPlaceholder } from '@/components/ui/classflow/LoadingPlaceholder'
import { VirtualizedStudentList } from '@/components/ui/VirtualizedStudentList'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorFallback } from '@/components/error/ErrorFallback'
import type { Student, StudentStatus } from '@/types/student.types'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// 상태별 색상 매핑
const statusColors: Record<StudentStatus, string> = {
  active: 'bg-success-100 text-success-800 border-success-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  graduated: 'bg-blue-100 text-blue-800 border-blue-200',
  withdrawn: 'bg-warning-100 text-warning-800 border-warning-200',
  suspended: 'bg-error-100 text-error-800 border-error-200'
}

const statusText: Record<StudentStatus, string> = {
  active: '활동중',
  inactive: '비활성',
  graduated: '졸업',
  withdrawn: '탈퇴',
  suspended: '정지'
}

// 통계 카드 컴포넌트
const StatsCard = memo<{
  title: string
  value: number
  icon: React.ReactNode
  color?: string
}>(({ title, value, icon, color = 'text-gray-600' }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
        </div>
        <div className={`${color} opacity-60`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
))
StatsCard.displayName = 'StatsCard'

// 필터 컴포넌트
const StatusFilter = memo<{
  selectedStatuses: StudentStatus[]
  onStatusChange: (statuses: StudentStatus[]) => void
}>(({ selectedStatuses, onStatusChange }) => {
  const toggleStatus = (status: StudentStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(statusText) as [StudentStatus, string][]).map(([status, text]) => (
        <Button
          key={status}
          variant={selectedStatuses.includes(status) ? "default" : "outline"}
          size="sm"
          onClick={() => toggleStatus(status)}
          className="h-8"
        >
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            selectedStatuses.includes(status) ? 'bg-white' : statusColors[status].split(' ')[0]
          }`} />
          {text}
        </Button>
      ))}
    </div>
  )
})
StatusFilter.displayName = 'StatusFilter'

const StudentsPage = memo(() => {
  const router = useRouter()
  const { profile } = useAuthStore()
  const {
    students,
    loading,
    error,
    filters,
    searchTerm,
    pagination,
    stats,
    actions
  } = useStudentsStore()

  // 로컬 상태
  const [searchInput, setSearchInput] = useState(searchTerm)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  // 테넌트 ID - 시스템 관리자는 전체 테넌트 접근 가능
  const tenantId = profile?.tenant_id
  const isSystemAdmin = profile?.role === 'system_admin'
  const canAccessStudents = tenantId || isSystemAdmin

  // 디버그 로그
  console.log('🎓 [STUDENTS-PAGE] User context:', {
    profile: profile ? {
      role: profile.role,
      tenant_id: profile.tenant_id,
      status: profile.status
    } : 'No profile',
    tenantId,
    isSystemAdmin,
    canAccessStudents
  })

  // 초기 데이터 로드
  useEffect(() => {
    if (canAccessStudents) {
      // 시스템 관리자는 tenantId 없이 전체 학생 조회
      actions.fetchStudents(isSystemAdmin ? undefined : tenantId)
      actions.fetchStudentStats(isSystemAdmin ? undefined : tenantId)
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, actions])

  // 검색어 디바운스
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchTerm) {
        actions.setSearchTerm(searchInput)
        if (canAccessStudents) {
          actions.fetchStudents(isSystemAdmin ? undefined : tenantId, { search: searchInput })
        }
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput, searchTerm, canAccessStudents, tenantId, isSystemAdmin, actions])

  // 필터 변경 핸들러
  const handleStatusFilterChange = useCallback((statuses: StudentStatus[]) => {
    actions.setFilters({ status: statuses })
    if (canAccessStudents) {
      actions.fetchStudents(isSystemAdmin ? undefined : tenantId, { status: statuses })
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, actions])

  // 학생 선택 핸들러
  const handleStudentSelect = useCallback((studentId: string, selected: boolean) => {
    setSelectedStudents(prev => 
      selected 
        ? [...prev, studentId]
        : prev.filter(id => id !== studentId)
    )
  }, [])

  // 학생 클릭 핸들러
  const handleStudentClick = useCallback((student: Student) => {
    actions.setSelectedStudent(student)
    router.push(`/admin/students/${student.id}`)
  }, [router, actions])

  // 새 학생 추가 핸들러
  const handleAddStudent = useCallback(() => {
    router.push('/admin/students/new')
  }, [router])

  // 더 보기 핸들러
  const handleLoadMore = useCallback(() => {
    if (canAccessStudents && pagination.hasMore && !loading) {
      actions.loadMoreStudents(isSystemAdmin ? undefined : tenantId)
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, pagination.hasMore, loading, actions])

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    if (canAccessStudents) {
      actions.refreshStudents(isSystemAdmin ? undefined : tenantId)
      actions.fetchStudentStats(isSystemAdmin ? undefined : tenantId)
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, actions])

  // 로딩 중이면서 학생이 없는 경우 (초기 로딩)
  if (loading && students.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
          <Button disabled>
            <PlusIcon className="h-4 w-4 mr-2" />
            새 학생 추가
          </Button>
        </div>
        
        {/* 통계 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingPlaceholder key={i} className="h-24" />
          ))}
        </div>
        
        {/* 필터 스켈레톤 */}
        <LoadingPlaceholder className="h-16" />
        
        {/* 학생 목록 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingPlaceholder key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-error-600" />
              <div>
                <h3 className="text-lg font-medium text-error-900">오류 발생</h3>
                <p className="text-error-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleRefresh} variant="outline">
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
          <p className="text-gray-600 mt-1">
            총 {pagination.total.toLocaleString()}명의 학생이 등록되어 있습니다.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            새로고침
          </Button>
          <Button onClick={handleAddStudent}>
            <PlusIcon className="h-4 w-4 mr-2" />
            새 학생 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <ErrorBoundary
          level="section"
          isolate={true}
          onError={(error) => console.error('Stats cards error:', error)}
          fallback={(props) => (
            <ErrorFallback {...props} context={{ feature: 'students', component: 'StatsCards' }} />
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="전체 학생"
              value={stats.total}
              icon={<UserGroupIcon className="h-8 w-8" />}
              color="text-blue-600"
            />
            <StatsCard
              title="활동중"
              value={stats.active}
              icon={<AcademicCapIcon className="h-8 w-8" />}
              color="text-success-600"
            />
            <StatsCard
              title="졸업생"
              value={stats.graduated}
              icon={<AcademicCapIcon className="h-8 w-8" />}
              color="text-purple-600"
            />
            <StatsCard
              title="탈퇴/정지"
              value={stats.withdrawn + stats.suspended}
              icon={<ExclamationTriangleIcon className="h-8 w-8" />}
              color="text-warning-600"
            />
          </div>
        </ErrorBoundary>
      )}

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* 검색바 */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="학생 이름, 학번, 연락처로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              필터
            </Button>
          </div>

          {/* 필터 패널 */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    학생 상태
                  </label>
                  <StatusFilter
                    selectedStatuses={filters.status || []}
                    onStatusChange={handleStatusFilterChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 선택된 필터 표시 */}
          {(filters.search || (filters.status && filters.status.length > 0)) && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <span className="text-sm text-gray-600">활성 필터:</span>
              {filters.search && (
                <Badge variant="outline">검색: &quot;{filters.search}&quot;</Badge>
              )}
              {filters.status?.map(status => (
                <Badge key={status} variant="outline">
                  상태: {statusText[status]}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  actions.clearFilters()
                  setSearchInput('')
                  if (canAccessStudents) {
                    actions.fetchStudents(isSystemAdmin ? undefined : tenantId)
                  }
                }}
                className="text-xs"
              >
                모든 필터 제거
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 학생 목록 */}
      <div className="space-y-4">
        {students.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 학생이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                첫 번째 학생을 등록해보세요.
              </p>
              <Button onClick={handleAddStudent}>
                <PlusIcon className="h-4 w-4 mr-2" />
                학생 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 대용량 데이터(100명 이상) 시 가상화 사용 */}
            {students.length >= 100 ? (
              <ErrorBoundary
                level="section"
                isolate={true}
                onError={(error) => console.error('VirtualizedStudentList error:', error)}
                fallback={(props) => (
                  <ErrorFallback {...props} context={{ feature: 'students', component: 'VirtualizedStudentList' }} />
                )}
              >
                <VirtualizedStudentList
                  students={students}
                  onStudentSelect={handleStudentClick}
                  searchTerm={filters.search || ''}
                  maxHeight={600}
                />
              </ErrorBoundary>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={{
                      id: student.id,
                      name: student.name,
                      phone: student.parent_phone_1 || student.phone || undefined,
                      email: student.email || undefined,
                      status: student.status as 'active' | 'inactive' | 'pending' | 'suspended',
                      grade: student.grade_level || undefined,
                      enrollmentDate: student.created_at || undefined
                    }}
                    isSelected={selectedStudents.includes(student.id)}
                    onClick={() => handleStudentClick(student)}
                    onSelectionChange={handleStudentSelect}
                    showSelection={selectedStudents.length > 0}
                    showDragHandle={false}
                  />
                ))}
              </div>
            )}

            {/* 더 보기 버튼 */}
            {pagination.hasMore && (
              <div className="text-center">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
                  {loading ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 선택된 학생 액션 */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">
              {selectedStudents.length}명 선택됨
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                일괄 수정
              </Button>
              <Button size="sm" variant="outline">
                클래스 이동
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setSelectedStudents([])}
              >
                선택 해제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

StudentsPage.displayName = 'StudentsPage'

export default StudentsPage