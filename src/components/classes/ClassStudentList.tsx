'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  UserIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import type { Class } from '@/types/class.types'

interface StudentEnrollment {
  id: string
  student_id: string
  enrollment_date: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed' | 'suspended' | 'cancelled'
  position_in_class: number
  attendance_rate?: number
  notes?: string
  students: {
    id: string
    name: string
    student_number: string
    status: string
    phone?: string
    email?: string
    grade_level?: string
    school_name?: string
    profile_image?: string
    created_at: string
  }
  user_profiles?: {
    id: string
    name: string
    email: string
  }
}

interface ClassStudentListProps {
  classData: Class
  tenantId: string
  onAddStudent: () => void
}

export default function ClassStudentList({ 
  classData, 
  tenantId, 
  onAddStudent 
}: ClassStudentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'suspended' | 'cancelled'>('active')
  const [deleteEnrollmentId, setDeleteEnrollmentId] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  // 클래스별 학생 목록 조회
  const {
    data: studentsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.classStudents(classData.id, {
      tenantId,
      status: statusFilter,
      search: searchTerm
    }),
    queryFn: () => apiClient.get(`/api/classes/${classData.id}/students`, {
      params: {
        tenantId,
        status: statusFilter,
        limit: 100,
        offset: 0,
        ...(searchTerm.trim() && { search: searchTerm.trim() })
      }
    }),
    enabled: !!classData.id && !!tenantId
  })

  // 수강 등록 해제 mutation
  const removeStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      apiClient.delete(`/api/enrollments/${enrollmentId}`, {
        params: {
          tenantId,
          forceDelete: false
        }
      }),
    onSuccess: (data, enrollmentId) => {
      toast.success('학생이 클래스에서 제거되었습니다.')
      // 해당 클래스의 학생 목록 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classStudents(classData.id) })
      // 클래스 목록 무효화 (학생 수 변경에 따라)
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
      setDeleteEnrollmentId(null)
    },
    onError: (error) => {
      toast.error(`학생 제거 실패: ${getErrorMessage(error)}`)
    }
  })

  // 학생 목록 (API에서 이미 필터링 완료)
  const filteredStudents = useMemo(() => {
    if (!studentsData ||
        typeof studentsData !== 'object' ||
        !('students' in studentsData) ||
        !Array.isArray(studentsData.students)) {
      return []
    }
    return studentsData.students
  }, [studentsData])

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
      case 'active': return '활성'
      case 'completed': return '완료'
      case 'suspended': return '중단'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const handleRemoveStudent = (enrollmentId: string) => {
    setDeleteEnrollmentId(enrollmentId)
  }

  const confirmRemoveStudent = () => {
    if (deleteEnrollmentId) {
      removeStudentMutation.mutate(deleteEnrollmentId)
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>학생 목록을 불러오는데 실패했습니다.</p>
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
      {/* 헤더 및 액션 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            수강생 목록
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            총 {filteredStudents.length}명의 학생이 등록되어 있습니다
          </p>
        </div>
        
        <Button onClick={onAddStudent} className="w-full sm:w-auto">
          <PlusIcon className="w-4 h-4 mr-2" />
          학생 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이름, 학번, 연락처로 검색..."
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

      {/* 학생 목록 테이블 */}
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
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm ? '검색 결과가 없습니다' : '등록된 학생이 없습니다'}
              </p>
              {!searchTerm && (
                <Button variant="outline" onClick={onAddStudent}>
                  첫 번째 학생 등록하기
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">순서</TableHead>
                  <TableHead>학생 정보</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>출석률</TableHead>
                  <TableHead>비고</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((enrollment: StudentEnrollment, index: number) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {enrollment.position_in_class || index + 1}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={enrollment.students.profile_image || undefined} />
                          <AvatarFallback>
                            {enrollment.students.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {enrollment.students.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {enrollment.students.student_number}
                            {enrollment.students.grade_level && ` • ${enrollment.students.grade_level}`}
                          </div>
                          {enrollment.students.phone && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <PhoneIcon className="w-3 h-3 mr-1" />
                              {enrollment.students.phone}
                            </div>
                          )}
                        </div>
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
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {enrollment.notes || '-'}
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
                            정보 수정
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleRemoveStudent(enrollment.id)}
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
            <AlertDialogTitle>학생 등록 해제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 학생의 수강 등록을 해제하시겠습니까? 
              이 작업은 되돌릴 수 있으며, 학생 정보는 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveStudent}
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