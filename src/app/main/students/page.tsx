'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CheckCircleIcon as CheckCircleOutline,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid'
import type { Student, StudentStatus } from '@/types/student.types'
import { CreateStudentSheet } from '@/components/students/CreateStudentSheet'
import { StudentDetailSheet } from '@/components/students/StudentDetailSheet'
import { GroupedStudentView } from '@/components/students/GroupedStudentView'
import type { StudentGroup, GroupType } from '@/types/student-groups.types'
import { GROUP_TYPE_OPTIONS } from '@/types/student-groups.types'

// 상태별 스타일 매핑
const statusStyles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  withdrawn: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  graduated: 'bg-blue-100 text-blue-800'
}

const statusLabels = {
  active: '활동중',
  inactive: '비활성',
  withdrawn: '퇴학',
  suspended: '정지',
  graduated: '졸업'
}

interface StudentFilters {
  search: string
  status: StudentStatus | 'all'
  grade: string | 'all'
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function StudentsPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const { students, loading, error, actions } = useStudentsStore()
  
  // 필터 및 정렬 상태
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    status: 'all',
    grade: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // 선택된 학생들
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  
  // 필터 표시 상태
  const [showFilters, setShowFilters] = useState(false)
  
  // 삭제 확인 상태
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null)
  
  // Sheet 상태
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // 그룹 뷰 상태
  const [groupBy, setGroupBy] = useState<'grade' | 'school' | 'class'>('grade')
  const [subGroupBy, setSubGroupBy] = useState<'none' | 'grade' | 'school' | 'class'>('none')
  const [groupViewMode, setGroupViewMode] = useState<'list' | 'cards'>('list')
  
  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    let result = students

    // 검색 필터링
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.student_number?.toLowerCase().includes(searchTerm) ||
        student.phone?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm)
      )
    }

    // 상태 필터링
    if (filters.status !== 'all') {
      result = result.filter(student => student.status === filters.status)
    }

    // 학년 필터링
    if (filters.grade !== 'all') {
      result = result.filter(student => student.grade_level === filters.grade)
    }
    
    // 그룹 필터링은 여기서 직접 처리하지 않고 그룹별로 나누어서 표시

    // 정렬 (배열을 복사한 후 정렬)
    result = [...result].sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'created_at':
          aValue = new Date(a.created_at || 0)
          bValue = new Date(b.created_at || 0)
          break
        case 'student_number':
          aValue = a.student_number || ''
          bValue = b.student_number || ''
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return result
  }, [students, filters])

  // 페이지네이션된 데이터
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  // 통계 계산
  const stats = useMemo(() => {
    const total = students.length
    const active = students.filter(s => s.status === 'active').length
    const withdrawn = students.filter(s => s.status === 'withdrawn').length
    const inactive = students.filter(s => s.status === 'inactive').length
    
    return { total, active, withdrawn, inactive }
  }, [students])

  // 데이터 새로고침 핸들러 (다른 핸들러들보다 먼저 정의)
  const handleRefresh = useCallback(() => {
    if (profile?.tenant_id || profile?.role === 'system_admin') {
      const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
      actions.fetchStudents(tenantId)
    }
  }, [profile, actions])

  // 데이터 로드
  useEffect(() => {
    if (profile?.tenant_id || profile?.role === 'system_admin') {
      const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
      actions.fetchStudents(tenantId)
    }
  }, [profile, actions])

  // Sheet 핸들러들
  const handleCreateSuccess = useCallback((newStudent: Student) => {
    setShowCreateSheet(false)
    toast.success(`${newStudent.name} 학생이 등록되었습니다.`)
    if (profile?.tenant_id || profile?.role === 'system_admin') {
      const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
      actions.fetchStudents(tenantId)
    }
  }, [profile, actions])

  const handleUpdateSuccess = useCallback((updatedStudent: Student) => {
    toast.success(`${updatedStudent.name} 학생 정보가 업데이트되었습니다.`)
    setSelectedStudent(updatedStudent)
    if (profile?.tenant_id || profile?.role === 'system_admin') {
      const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
      actions.fetchStudents(tenantId)
    }
  }, [profile, actions])

  const handleDeleteSuccess = useCallback((deletedStudent: Student) => {
    setShowDetailSheet(false)
    setSelectedStudent(null)
    toast.success(`${deletedStudent.name} 학생이 삭제되었습니다.`)
    if (profile?.tenant_id || profile?.role === 'system_admin') {
      const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
      actions.fetchStudents(tenantId)
    }
  }, [profile, actions])

  // 핸들러들
  const handleStudentClick = useCallback((student: Student) => {
    if (!selectionMode) {
      setSelectedStudent(student)
      setShowDetailSheet(true)
    } else {
      handleStudentSelect(student.id, !selectedStudents.includes(student.id))
    }
  }, [selectionMode, selectedStudents])

  const handleFilterChange = useCallback((key: keyof StudentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // 필터 변경 시 첫 페이지로
  }, [])

  const handleStudentSelect = useCallback((studentId: string, checked: boolean) => {
    setSelectedStudents(prev => 
      checked 
        ? [...prev, studentId]
        : prev.filter(id => id !== studentId)
    )
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedStudents(checked ? paginatedStudents.map(s => s.id) : [])
  }, [paginatedStudents])

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev)
    setSelectedStudents([])
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedStudents([])
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedStudents.length === 0) return
    
    toast.success(`${selectedStudents.length}명의 학생을 삭제합니다.`)
    clearSelection()
    // TODO: 실제 삭제 구현
  }, [selectedStudents, clearSelection])

  const handleDeleteStudent = useCallback((student: Student) => {
    setDeleteConfirmStudent(student)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmStudent) {
      toast.success(`${deleteConfirmStudent.name} 학생을 삭제했습니다.`)
      setDeleteConfirmStudent(null)
      // TODO: 실제 삭제 구현
    }
  }, [deleteConfirmStudent])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 페이지 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
            <nav className="flex mt-1" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <a href="/main" className="hover:text-gray-700">홈</a>
                </li>
                <li>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">학생 관리</span>
                </li>
              </ol>
            </nav>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-3">
            {/* 일괄 작업 버튼 */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-sm font-medium text-brand-700">
                  {selectedStudents.length}명 선택됨
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-error-600 hover:text-error-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* 선택 모드 토글 */}
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className="transition-all flex-shrink-0 z-10"
              title={selectionMode ? "상세보기 모드로 전환" : "선택 모드로 전환"}
            >
              <CheckCircleOutline className="w-4 h-4 mr-1" />
              {selectionMode ? "선택 모드" : "선택"}
            </Button>

            {/* 그룹 뷰 옵션 */}
            <div className="flex items-center gap-2">
              <Select
                value={groupBy}
                onValueChange={(value: 'grade' | 'school' | 'class') => setGroupBy(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade">학년별</SelectItem>
                  <SelectItem value="school">학교별</SelectItem>
                  <SelectItem value="class">클래스별</SelectItem>
                </SelectContent>
              </Select>
              
              {/* 서브그룹 선택 */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">→</span>
                <Select
                  value={subGroupBy}
                  onValueChange={(value: 'none' | 'grade' | 'school' | 'class') => setSubGroupBy(value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {groupBy !== 'grade' && <SelectItem value="grade">학년별</SelectItem>}
                    {groupBy !== 'school' && <SelectItem value="school">학교별</SelectItem>}
                    {groupBy !== 'class' && <SelectItem value="class">클래스별</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex rounded-lg border border-gray-300 bg-white">
                <Button
                  variant={groupViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupViewMode('list')}
                  className="rounded-r-none border-0"
                  title="리스트"
                >
                  <ListBulletIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={groupViewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupViewMode('cards')}
                  className="rounded-l-none border-l border-gray-300"
                  title="카드"
                >
                  <Squares2X2Icon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* 새 학생 등록 */}
            <Button onClick={() => setShowCreateSheet(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 학생 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircleIcon className="w-5 h-5 text-error-400 mr-3" />
                <div>
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 통계 대시보드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-brand-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">전체 학생</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-success-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">활동중</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <AcademicCapIcon className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">퇴학/대기</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.withdrawn}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <XCircleIcon className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">비활성</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 검색 및 필터 */}
          <Card>
            <CardContent>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* 검색 */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="이름, 학번, 연락처, 이메일로 검색..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 필터 버튼 */}
                <div className="flex items-center space-x-3">
                  {/* 그룹 내 정렬 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">정렬:</span>
                    <Select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onValueChange={(value: string) => {
                        const [sortBy, sortOrder] = value.split('-')
                        setFilters(prev => ({ 
                          ...prev,
                          sortBy,
                          sortOrder: sortOrder as 'asc' | 'desc'
                        }))
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">이름순</SelectItem>
                        <SelectItem value="name-desc">이름 역순</SelectItem>
                        <SelectItem value="created_at-desc">최신 등록순</SelectItem>
                        <SelectItem value="created_at-asc">오래된 등록순</SelectItem>
                        <SelectItem value="student_number-asc">학번순</SelectItem>
                        <SelectItem value="student_number-desc">학번 역순</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      showFilters && 'bg-brand-50 border-brand-300 text-brand-700'
                    )}
                  >
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    필터
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (profile?.tenant_id || profile?.role === 'system_admin') {
                        const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
                        actions.fetchStudents(tenantId)
                      }
                    }}
                    disabled={loading}
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
              </div>

              {/* 필터 옵션 */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상태
                      </label>
                      <Select
                        value={filters.status}
                        onValueChange={(value: string) => handleFilterChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="active">활동중</SelectItem>
                          <SelectItem value="inactive">비활성</SelectItem>
                          <SelectItem value="withdrawn">퇴학</SelectItem>
                          <SelectItem value="suspended">정지</SelectItem>
                          <SelectItem value="graduated">졸업</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        학년
                      </label>
                      <Select
                        value={filters.grade}
                        onValueChange={(value: string) => handleFilterChange('grade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 학년</SelectItem>
                          <SelectItem value="초1">초등학교 1학년</SelectItem>
                          <SelectItem value="초2">초등학교 2학년</SelectItem>
                          <SelectItem value="초3">초등학교 3학년</SelectItem>
                          <SelectItem value="초4">초등학교 4학년</SelectItem>
                          <SelectItem value="초5">초등학교 5학년</SelectItem>
                          <SelectItem value="초6">초등학교 6학년</SelectItem>
                          <SelectItem value="중1">중학교 1학년</SelectItem>
                          <SelectItem value="중2">중학교 2학년</SelectItem>
                          <SelectItem value="중3">중학교 3학년</SelectItem>
                          <SelectItem value="고1">고등학교 1학년</SelectItem>
                          <SelectItem value="고2">고등학교 2학년</SelectItem>
                          <SelectItem value="고3">고등학교 3학년</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        추가 필터
                      </label>
                      <Button variant="outline" className="w-full">
                        상세 필터 설정
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 학생 테이블 - 그룹화된 뷰 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <GroupedStudentView
              students={paginatedStudents}
              groupBy={groupBy}
              subGroupBy={subGroupBy}
              viewMode={groupViewMode}
              selectionMode={selectionMode}
              selectedStudents={selectedStudents}
              onStudentClick={handleStudentClick}
              onStudentSelect={handleStudentSelect}
              onDeleteStudent={handleDeleteStudent}
              onCreateStudent={() => setShowCreateSheet(true)}
            />
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {filteredStudents.length}명 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStudents.length)}명 표시
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  이전
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && <span className="px-2">...</span>}
                  {totalPages > 5 && (
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-error-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  학생 삭제
                </h3>
                <p className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              "{deleteConfirmStudent.name}" 학생을 삭제하시겠습니까?
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmStudent(null)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sheet 컴포넌트들 */}
      <CreateStudentSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
        onSuccess={handleCreateSuccess}
      />
      
      {selectedStudent && (
        <StudentDetailSheet
          student={selectedStudent}
          open={showDetailSheet}
          onOpenChange={setShowDetailSheet}
          onUpdate={handleUpdateSuccess}
          onDelete={handleDeleteSuccess}
        />
      )}
    </div>
  )
}