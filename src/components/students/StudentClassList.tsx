'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EllipsisVerticalIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import type { Student } from '@/types/student.types'

interface ClassEnrollment {
  id: string
  class_id: string
  enrollment_date: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed' | 'suspended' | 'cancelled'
  position_in_class: number
  attendance_rate?: number
  final_price: number
  notes?: string
  classes: {
    id: string
    name: string
    subject?: string
    course?: string
    grade?: string
    level?: string
    is_active: boolean
    start_date?: string
    end_date?: string
    tenant_memberships?: {
      id: string
      user_profiles?: {
        id: string
        name: string
        email: string
      }
    }
  }
  course_packages?: {
    id: string
    name: string
    billing_type: string
    price: number
  }
  user_profiles?: {
    id: string
    name: string
    email: string
  }
}

interface StudentClassListProps {
  studentData: Student
  tenantId: string
  onAddClass: () => void
}

export default function StudentClassList({ 
  studentData, 
  tenantId, 
  onAddClass 
}: StudentClassListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'suspended' | 'cancelled'>('all')
  const [deleteEnrollmentId, setDeleteEnrollmentId] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  // 학생별 클래스 목록 조회
  const {
    data: classesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.studentClasses(studentData.id, {
      tenantId,
      status: statusFilter,
      search: searchTerm
    }),
    queryFn: () => apiClient.get(`/api/students/${studentData.id}/classes`, {
      params: {
        tenantId,
        status: statusFilter,
        limit: 100,
        offset: 0,
        ...(searchTerm.trim() && { search: searchTerm.trim() })
      }
    }),
    enabled: !!studentData.id && !!tenantId
  })

  // 수강 등록 해제 mutation
  const removeClassMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      apiClient.delete(`/api/enrollments/${enrollmentId}`, {
        params: {
          tenantId,
          forceDelete: false
        }
      }),
    onSuccess: (data, enrollmentId) => {
      toast.success('클래스 등록이 해제되었습니다.')
      queryClient.invalidateQueries({ queryKey: queryKeys.studentClasses(studentData.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      setDeleteEnrollmentId(null)
    },
    onError: (error) => {
      toast.error(`클래스 등록 해제 실패: ${getErrorMessage(error)}`)
    }
  })

  // 필터링된 클래스 목록
  const filteredEnrollments = useMemo(() => {
    const enrollments = classesData?.enrollments?.all || []

    return enrollments.filter((enrollment: ClassEnrollment) => {
      if (statusFilter !== 'all' && enrollment.status !== statusFilter) {
        return false
      }

      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase()
        const classInfo = enrollment.classes
        return (
          classInfo.name.toLowerCase().includes(search) ||
          classInfo.subject?.toLowerCase().includes(search) ||
          classInfo.course?.toLowerCase().includes(search) ||
          classInfo.grade?.toLowerCase().includes(search)
        )
      }

      return true
    })
  }, [classesData?.enrollments?.all, statusFilter, searchTerm])

  // 상태별 요약
  const summary = classesData?.summary || {
    total: 0,
    active: 0,
    completed: 0,
    suspended: 0,
    cancelled: 0
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary' 
      case 'suspended': return 'destructive'
      case 'cancelled': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '수강중'
      case 'completed': return '수강완료'
      case 'suspended': return '중단'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const handleRemoveClass = (enrollmentId: string) => {
    setDeleteEnrollmentId(enrollmentId)
  }

  const confirmRemoveClass = () => {
    if (deleteEnrollmentId) {
      removeClassMutation.mutate(deleteEnrollmentId)
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>클래스 목록을 불러오는데 실패했습니다.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 및 요약 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            수강 클래스
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>총 {summary.total}개</span>
            <span className="text-green-600">진행중 {summary.active}개</span>
            <span className="text-blue-600">완료 {summary.completed}개</span>
            {summary.suspended > 0 && (
              <span className="text-red-600">중단 {summary.suspended}개</span>
            )}
          </div>
        </div>
        
        <Button onClick={onAddClass} className="w-full sm:w-auto">
          <PlusIcon className="w-4 h-4 mr-2" />
          클래스 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="클래스명, 과목, 과정으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'active', 'completed', 'suspended', 'cancelled'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? '전체' : getStatusText(status)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 클래스 목록 테이블 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center">
              <AcademicCapIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm ? '검색 결과가 없습니다' : '등록된 클래스가 없습니다'}
              </p>
              {!searchTerm && (
                <Button variant="outline" onClick={onAddClass}>
                  첫 번째 클래스 등록하기
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>클래스 정보</TableHead>
                  <TableHead>강사</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>출석률</TableHead>
                  <TableHead>수강료</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment: ClassEnrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-educanvas-100 text-educanvas-700">
                            <AcademicCapIcon className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {enrollment.classes.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {[
                              enrollment.classes.subject,
                              enrollment.classes.course,
                              enrollment.classes.grade
                            ].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {enrollment.classes.tenant_memberships?.user_profiles?.name || '-'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                        {getStatusText(enrollment.status)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {enrollment.attendance_rate !== null && enrollment.attendance_rate !== undefined 
                          ? `${enrollment.attendance_rate}%`
                          : '-'
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm font-medium">
                        ₩{enrollment.final_price?.toLocaleString() || '0'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <PencilIcon className="w-4 h-4 mr-2" />
                            수강 정보 수정
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleRemoveClass(enrollment.id)}
                            disabled={enrollment.status === 'cancelled'}
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            등록 해제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteEnrollmentId} onOpenChange={() => setDeleteEnrollmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>클래스 등록 해제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 클래스의 수강 등록을 해제하시겠습니까? 
              이 작업은 되돌릴 수 있으며, 클래스 정보는 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveClass}
              className="bg-red-600 hover:bg-red-700"
            >
              등록 해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}