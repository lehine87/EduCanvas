'use client'

import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { StudentCard } from '@/components/ui/StudentCard'
import { LoadingPlaceholder } from '@/components/ui/classflow/LoadingPlaceholder'
import { VirtualizedStudentList } from '@/components/ui/VirtualizedStudentList'
import { EnhancedSearchBox } from '@/components/ui/EnhancedSearchBox'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorFallback } from '@/components/error/ErrorFallback'
import { usePerformanceProfiler } from '@/hooks/usePerformanceMonitor'
import { useKeyboardNavigation, useScreenReaderSupport } from '@/hooks/useAccessibility'
import { toast } from 'react-hot-toast'
import type { Student, StudentStatus } from '@/types/student.types'

// 성능 최적화를 위한 메모이제이션된 StudentCard
const StudentCardMemoized = memo<{
  student: Student
  isSelected: boolean
  onClick: (student: Student) => void
  onSelectionChange: (studentId: string, selected: boolean) => void
  showSelection: boolean
  showDragHandle: boolean
}>(({ student, isSelected, onClick, onSelectionChange, showSelection, showDragHandle }) => {
  // 학생 데이터 변환을 메모이제이션
  const studentCardData = useMemo(() => ({
    id: student.id,
    name: student.name,
    phone: student.parent_phone_1 || student.phone || undefined,
    email: student.email || undefined,
    status: student.status as 'active' | 'inactive' | 'pending' | 'suspended',
    grade_level: student.grade_level || undefined,
    created_at: student.created_at || undefined,
    parent_phone_1: student.parent_phone_1,
    student_number: student.student_number,
    avatar_url: undefined // 아바타 URL은 향후 추가될 예정
  }), [student])

  return (
    <StudentCard
      student={studentCardData as any}
      isSelected={isSelected}
      onClick={onClick as any}
      onSelectionChange={onSelectionChange}
      showSelection={showSelection}
      showDragHandle={showDragHandle}
    />
  )
}, (prevProps, nextProps) => {
  // 얕은 비교로 리렌더링 최적화
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.name === nextProps.student.name &&
    prevProps.student.status === nextProps.student.status &&
    prevProps.student.phone === nextProps.student.phone &&
    prevProps.student.parent_phone_1 === nextProps.student.parent_phone_1 &&
    prevProps.student.email === nextProps.student.email &&
    (prevProps.student as any).grade_level === (nextProps.student as any).grade_level &&
    // Avatar URL comparison removed
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showSelection === nextProps.showSelection &&
    prevProps.showDragHandle === nextProps.showDragHandle
  )
})
StudentCardMemoized.displayName = 'StudentCardMemoized'
import { 
  STUDENT_STATUS_COLORS,
  STUDENT_STATUS_TEXT,
  getStudentStatusStyles
} from '@/constants/studentConstants'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

// 🎯 UX 가이드: 최근 조회 학생 카드 컴포넌트
const RecentStudentCard = memo<{
  student: Student
  onClick: () => void
}>(({ student, onClick }) => (
  <div 
    className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-gray-200"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
  >
    <Card>
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        {/* 학생 프로필 사진 (48x48px) */}
        <div className="flex-shrink-0">
          {false ? (
            <img 
              src="" 
              alt={`${student.name} 프로필 사진`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-medium text-lg">
                {student.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        {/* 학생 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            {student.grade_level && (
              <span className="text-sm text-gray-600">{student.grade_level}</span>
            )}
            <span className={`inline-block w-2 h-2 rounded-full ${STUDENT_STATUS_COLORS[student.status || 'active'].split(' ')[0]}`} />
          </div>
        </div>
      </div>
    </CardContent>
    </Card>
  </div>
))
RecentStudentCard.displayName = 'RecentStudentCard'

// 🎯 UX 가이드: 빠른 작업 버튼 컴포넌트
const QuickActionButton = memo<{
  title: string
  description: string
  icon: React.ReactNode
  color: string
  count?: number
  onClick: () => void
}>(({ title, description, icon, color, count, onClick }) => (
  <div 
    className="cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 group"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
  >
    <Card className="h-full">
    <CardContent className="p-6 text-center">
      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      {count !== undefined && (
        <Badge variant={count > 0 ? "destructive" : "secondary"} className="text-xs">
          {count}건
        </Badge>
      )}
    </CardContent>
    </Card>
  </div>
))
QuickActionButton.displayName = 'QuickActionButton'

// 통계 카드 컴포넌트 (접을 수 있도록 수정)
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
      {(Object.entries(STUDENT_STATUS_TEXT) as [StudentStatus, string][]).map(([status, text]) => (
        <Button
          key={status}
          variant={selectedStatuses.includes(status) ? "default" : "outline"}
          size="sm"
          onClick={() => toggleStatus(status)}
          className="h-8"
        >
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            selectedStatuses.includes(status) ? 'bg-white' : STUDENT_STATUS_COLORS[status].split(' ')[0]
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

  // 🔧 React Hooks Rules 준수: 모든 hooks를 조건문보다 먼저 호출
  // 성능 모니터링 (개발 환경에서만)
  const { profileComponent } = usePerformanceProfiler('StudentsPage', {
    profile,
    studentsCount: students.length,
    loading,
    error,
    searchTerm
  })

  // 접근성 지원
  const { announce, announceLoading, announceError, announcementRef } = useScreenReaderSupport()
  
  // 🔧 React Hooks 오류 방지: students 배열이 변경되어도 hook 순서 유지
  const stableStudents = useMemo(() => students || [], [students])
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    focusedIndex,
    registerItem,
    setFocusedIndex
  } = useKeyboardNavigation(stableStudents, {
    onSelect: (index, student) => {
      announce(`학생 ${(student as any).name} 선택됨`)
    },
    onActivate: (index, student) => {
      handleStudentClick(student as Student)
    }
  })

  // 로컬 상태
  const [searchInput, setSearchInput] = useState(searchTerm)
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false) // 🎯 UX 가이드: 통계를 접을 수 있게 함
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [recentStudents, setRecentStudents] = useState<Student[]>([]) // 🎯 UX 가이드: 최근 조회 학생

  // 테넌트 ID - 시스템 관리자는 전체 테넌트 접근 가능 (메모이제이션)
  const tenantId = useMemo(() => profile?.tenant_id, [profile?.tenant_id])
  const isSystemAdmin = useMemo(() => profile?.role === 'system_admin', [profile?.role])
  const canAccessStudents = useMemo(() => tenantId || isSystemAdmin, [tenantId, isSystemAdmin])

  // 🎯 UX 가이드: 빠른 작업에 필요한 통계 계산
  const quickActionStats = useMemo(() => {
    return {
      unpaidStudents: 0, // TODO: 미납 학생 수 계산 로직 구현
      absentToday: 0,    // TODO: 오늘 결석 학생 수 계산 로직 구현
      consultationDue: 0 // TODO: 상담 예정 학생 수 계산 로직 구현
    }
  }, [students])

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

  // 초기 데이터 로드 (최적화된 의존성)
  useEffect(() => {
    if (canAccessStudents) {
      announceLoading(true, '학생 데이터')
      // 시스템 관리자는 tenantId 없이 전체 학생 조회
      const targetTenantId = isSystemAdmin ? undefined : tenantId
      const loadingToast = toast.loading('학생 데이터를 불러오는 중...')
      Promise.all([
        actions.fetchStudents(targetTenantId!),
        actions.fetchStudentStats(targetTenantId!)
      ]).then(() => {
        toast.dismiss(loadingToast)
        toast.success('학생 데이터를 불러왔습니다.')
        announceLoading(false, '학생 데이터')
        // 🎯 UX 가이드: 최근 조회 학생 5명 설정 (임시로 최신 학생 5명)
        setRecentStudents(students.slice(0, 5))
      }).catch((error) => {
        toast.dismiss(loadingToast)
        toast.error('학생 데이터 로드에 실패했습니다.')
        announceError('학생 데이터 로드 실패')
      })
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, actions, announceLoading, announceError])

  // 검색어 디바운스 (최적화된 디바운싱)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchTerm && canAccessStudents) {
        actions.setSearchTerm(searchInput)
        const targetTenantId = isSystemAdmin ? undefined : (tenantId || undefined)
        actions.fetchStudents(targetTenantId, { search: searchInput })
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput, searchTerm, canAccessStudents, tenantId, isSystemAdmin, actions])

  // 필터 변경 핸들러 (최적화된 조건부 실행)
  const handleStatusFilterChange = useCallback((statuses: StudentStatus[]) => {
    actions.setFilters({ status: statuses })
    if (canAccessStudents) {
      const targetTenantId = isSystemAdmin ? undefined : (tenantId || undefined)
      actions.fetchStudents(targetTenantId, { status: statuses })
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
    // 🎯 UX 가이드: 최근 조회 학생 목록 업데이트
    setRecentStudents(prev => {
      const filtered = prev.filter(s => s.id !== student.id)
      return [student, ...filtered].slice(0, 5)
    })
    router.push(`/main/students/${student.id}`)
  }, [router, actions])

  // 새 학생 추가 핸들러
  const handleAddStudent = useCallback(() => {
    router.push('/main/students/new')
  }, [router])

  // 🎯 UX 가이드: 빠른 작업 핸들러들
  const handleUnpaidStudents = useCallback(() => {
    // TODO: 미결제 학생 필터 구현 - payment_status 필터로 대체 예정
    actions.setFilters({ status: ['active'] })
    setShowFilters(true)
  }, [actions])

  const handleAbsentToday = useCallback(() => {
    // TODO: 오늘 결석 학생 필터 구현
    console.log('오늘 결석 학생 조회')
  }, [])

  const handleConsultationDue = useCallback(() => {
    // TODO: 상담 예정 학생 필터 구현  
    console.log('상담 예정 학생 조회')
  }, [])

  // 더 보기 핸들러 (최적화된 조건 체크)
  const handleLoadMore = useCallback(() => {
    if (canAccessStudents && pagination.hasMore && !loading) {
      const targetTenantId = isSystemAdmin ? undefined : (tenantId || undefined)
      actions.loadMoreStudents(targetTenantId)
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, pagination.hasMore, loading, actions])

  // 새로고침 핸들러 (배치 호출 최적화)
  const handleRefresh = useCallback(() => {
    if (canAccessStudents) {
      const targetTenantId = isSystemAdmin ? undefined : (tenantId || undefined)
      const loadingToast = toast.loading('데이터를 새로고침 중...')
      // 병렬 실행으로 성능 향상
      Promise.all([
        actions.refreshStudents(targetTenantId),
        actions.fetchStudentStats(targetTenantId)
      ]).then(() => {
        toast.dismiss(loadingToast)
        toast.success('데이터를 새로고침했습니다.')
      }).catch((error) => {
        toast.dismiss(loadingToast)
        toast.error('새로고침에 실패했습니다.')
        console.error(error)
      })
    }
  }, [canAccessStudents, tenantId, isSystemAdmin, actions])

  // 성능 프로파일링 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        profileComponent()
      }, 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [profileComponent])

  // 🔧 React Hooks Rules 준수: 조건부 early return 제거, 상태 기반 렌더링으로 변경
  const isInitialLoading = loading && students.length === 0
  const hasError = Boolean(error)

  // 로딩 상태일 때는 로딩 화면 표시
  if (isInitialLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <LoadingPlaceholder />
        </div>
      </div>
    )
  }

  // 오류 상태일 때는 오류 화면 표시
  if (hasError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorBoundary
          level="page"
          isolate={true}
          onError={(error) => console.error('StudentsPage error:', error)}
          fallback={(props) => (
            <ErrorFallback {...props} context={{ feature: 'students', component: 'StudentsPage' }} />
          )}
        >
          <div className="text-center">
            <p className="text-red-600">오류가 발생했습니다: {error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
              새로고침
            </button>
          </div>
        </ErrorBoundary>
      </div>
    )
  }

  // 권한이 없는 경우
  if (!canAccessStudents) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">학생 관리 페이지에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="container mx-auto p-6 space-y-8"
      role="main"
      aria-label="학생 관리 페이지"
    >
      {/* 스크린 리더 알림 영역 */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* 🎯 Phase 1: 검색 중심 홈 인터페이스 */}
      {/* 큰 검색창 - 최상단 중앙 배치 */}
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">학생 검색</h1>
          <p className="text-lg text-gray-600">
            학생 이름 또는 전화번호 뒤 4자리로 검색하세요
          </p>
        </div>
        
        {/* 메인 검색창 - 고도화된 검색 컴포넌트 */}
        <div className="max-w-2xl mx-auto">
          <EnhancedSearchBox
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value)
              if (value.trim()) {
                announce(`검색어 입력: ${value}`)
              }
            }}
            onStudentSelect={handleStudentClick}
            students={students}
            loading={loading}
            placeholder="학생 이름, 전화번호 뒤 4자리, 학번으로 검색..."
          />
        </div>
      </div>

      {/* 🎯 Phase 1: 최근 조회 학생 5명 카드 */}
      {recentStudents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 조회 학생</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {recentStudents.map((student) => (
              <RecentStudentCard
                key={student.id}
                student={student}
                onClick={() => handleStudentClick(student)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🎯 Phase 1: 빠른 작업 버튼 4개 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickActionButton
            title="미납 학생"
            description="수강료 미납 학생 확인"
            icon={<CreditCardIcon className="h-8 w-8 text-white" />}
            color="bg-red-500"
            count={quickActionStats.unpaidStudents}
            onClick={handleUnpaidStudents}
          />
          <QuickActionButton
            title="오늘 결석"
            description="오늘 결석한 학생 확인"
            icon={<CalendarDaysIcon className="h-8 w-8 text-white" />}
            color="bg-orange-500"
            count={quickActionStats.absentToday}
            onClick={handleAbsentToday}
          />
          <QuickActionButton
            title="상담 예정"
            description="이번 주 상담 예정 학생"
            icon={<ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />}
            color="bg-blue-500"
            count={quickActionStats.consultationDue}
            onClick={handleConsultationDue}
          />
          <QuickActionButton
            title="신규 등록"
            description="새 학생 등록하기"
            icon={<PlusIcon className="h-8 w-8 text-white" />}
            color="bg-green-500"
            onClick={handleAddStudent}
          />
        </div>
      </div>
      
      {/* 헤더 - 간소화 */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <p className="text-gray-600">
            총 {pagination.total.toLocaleString()}명의 학생이 등록되어 있습니다.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline" disabled={loading} size="sm">
            새로고침
          </Button>
          <Button 
            onClick={() => setShowStats(!showStats)} 
            variant="outline" 
            size="sm"
          >
            {showStats ? <ChevronUpIcon className="h-4 w-4 mr-2" /> : <ChevronDownIcon className="h-4 w-4 mr-2" />}
            통계 {showStats ? '숨기기' : '보기'}
          </Button>
        </div>
      </div>

      {/* 🎯 Phase 1: 통계 카드 - 접을 수 있는 섹션으로 이동 */}
      {showStats && stats && (
        <ErrorBoundary
          level="section"
          isolate={true}
          onError={(error) => console.error('Stats cards error:', error)}
          fallback={(props) => (
            <ErrorFallback {...props} context={{ feature: 'students', component: 'StatsCards' }} />
          )}
        >
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">학생 통계</h3>
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
                value={stats.inactive + stats.withdrawn}
                icon={<ExclamationTriangleIcon className="h-8 w-8" />}
                color="text-warning-600"
              />
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* 고급 검색 및 필터 */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* 고급 필터 토글 */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">고급 검색</h3>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
              size="sm"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              필터 {showFilters ? '숨기기' : '보기'}
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
                  상태: {STUDENT_STATUS_TEXT[status]}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  actions.clearFilters()
                  setSearchInput('')
                  if (canAccessStudents) {
                    const targetTenantId = isSystemAdmin ? undefined : (tenantId || undefined)
                    actions.fetchStudents(targetTenantId)
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
                  <StudentCardMemoized
                    key={student.id}
                    student={student}
                    isSelected={selectedStudents.includes(student.id)}
                    onClick={handleStudentClick}
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