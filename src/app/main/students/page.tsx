'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
import { toast } from 'react-hot-toast'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import type { Student, StudentStatus } from '@/types/student.types'

// 상태별 스타일 매핑
const statusStyles = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  withdrawn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
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

  // 데이터 로드
  useEffect(() => {
    if (profile?.tenant_id || profile?.role === 'system_admin') {
      const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
      actions.fetchStudents(tenantId)
    }
  }, [profile, actions])

  // 핸들러들
  const handleStudentClick = useCallback((student: Student) => {
    router.push(`/main/students/${student.id}`)
  }, [router])

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

  const handleBulkAction = useCallback((action: string) => {
    toast.success(`${selectedStudents.length}명 학생에 대해 ${action} 작업을 시작합니다.`)
    // TODO: 실제 벌크 액션 구현
  }, [selectedStudents])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="h-96 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">학생 관리</h1>
            <p className="text-muted-foreground mt-1">
              학생 정보를 관리하고 클래스를 배정하세요
            </p>
          </div>
          <Button onClick={() => router.push('/main/students/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            새 학생 등록
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 학생</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">활동중</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">대기중</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.withdrawn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">비활성</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">필터 및 검색</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름, 학번, 연락처로 검색..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="active">활동중</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                  <SelectItem value="withdrawn">퇴학</SelectItem>
                  <SelectItem value="suspended">정지</SelectItem>
                  <SelectItem value="graduated">졸업</SelectItem>
                  <SelectItem value="withdrawn">자퇴</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">이름순</SelectItem>
                  <SelectItem value="created_at">등록일순</SelectItem>
                  <SelectItem value="student_number">학번순</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {filters.sortOrder === 'asc' ? '오름차순' : '내림차순'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 선택된 학생 액션 바 */}
        {selectedStudents.length > 0 && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedStudents.length}명 선택됨
                </span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('클래스 이동')}>
                    클래스 이동
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('상태 변경')}>
                    상태 변경
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedStudents([])}>
                    선택 해제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 학생 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>학번</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <UserGroupIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">학생이 없습니다</h3>
                      <p className="text-muted-foreground">새로운 학생을 등록해보세요.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student) => (
                    <TableRow 
                      key={student.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleStudentClick(student)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            {student.email && (
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{student.student_number || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.phone && (
                            <div className="flex items-center text-sm">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {student.phone}
                            </div>
                          )}
                          {student.parent_phone_1 && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {student.parent_phone_1} (학부모)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[student.status as keyof typeof statusStyles]}>
                          {statusLabels[student.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.grade_level || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.created_at ? new Date(student.created_at).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>작업</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/main/students/${student.id}`)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              상세보기
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/main/students/${student.id}/edit`)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <TrashIcon className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredStudents.length}명 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStudents.length)}명 표시
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
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
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}