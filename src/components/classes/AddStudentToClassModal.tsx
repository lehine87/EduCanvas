'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import type { Class } from '@/types/class.types'

interface Student {
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

interface AddStudentToClassModalProps {
  isOpen: boolean
  onClose: () => void
  classData: Class
  tenantId: string
}

interface EnrollmentFormData {
  originalPrice: number
  discountAmount: number
  finalPrice: number
  paymentPlan: string
  hoursTotal?: number
  sessionsTotal?: number
  notes: string
  selectedStudents: string[]
}

export default function AddStudentToClassModal({
  isOpen,
  onClose,
  classData,
  tenantId
}: AddStudentToClassModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<'select' | 'config'>('select')
  const [formData, setFormData] = useState<EnrollmentFormData>({
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0,
    paymentPlan: 'monthly',
    hoursTotal: 0,
    sessionsTotal: 0,
    notes: '',
    selectedStudents: []
  })
  
  const queryClient = useQueryClient()

  // enabled 조건 값들 디버깅
  console.log('🔍 [AddStudentModal] enabled 조건 값들:', {
    isOpen,
    tenantId,
    'classData.id': classData.id,
    '!!tenantId': !!tenantId,
    '!!classData.id': !!classData.id,
    'enabled 결과': isOpen && !!tenantId && !!classData.id
  })

  // 학생 목록 조회 (등록되지 않은 학생만)
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: [...queryKeys.students(), 'search', tenantId, classData.id, searchTerm],
    queryFn: () => {
      console.log('🔍 [AddStudentModal] 학생 검색 API 호출:', {
        tenantId,
        searchTerm,
        classId: classData.id
      })

      const params: Record<string, string | number> = {
        tenantId,
        limit: 100,
        offset: 0
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      return apiClient.get('/api/students/search', { params })
    },
    enabled: isOpen && !!tenantId && !!classData.id
  })

  // 이미 등록된 학생들 조회
  const { data: enrolledStudentsData } = useQuery({
    queryKey: queryKeys.classStudents(classData.id, {
      tenantId,
      status: 'active',
      limit: 1000
    }),
    queryFn: () => {
      console.log('🔍 [AddStudentModal] API 호출 시작:', {
        classId: classData.id,
        className: classData.name,
        tenantId
      })

      return apiClient.get(`/api/classes/${classData.id}/students`, {
        params: {
          tenantId,
          status: 'active',
          limit: 1000
        }
      })
    },
    enabled: isOpen && !!classData.id && !!tenantId
  })

  // 학생 등록 mutation
  const addStudentMutation = useMutation({
    mutationFn: (studentData: { studentId: string; enrollmentData: any }) =>
      apiClient.post(`/api/classes/${classData.id}/students`, {
        tenantId,
        studentId: studentData.studentId,
        ...studentData.enrollmentData
      }),
    onSuccess: (data, variables) => {
      toast.success('학생이 클래스에 성공적으로 등록되었습니다.')
      // 클래스 학생 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classStudents(classData.id) })
      // 클래스 목록 무효화 (학생 수 변경에 따라)
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
    },
    onError: (error) => {
      toast.error(`학생 등록 실패: ${getErrorMessage(error)}`)
    }
  })

  // 사용 가능한 학생 목록 (이미 등록된 학생 제외)
  const availableStudents = useMemo(() => {
    console.log('🔍 [AddStudentModal] availableStudents 계산 시작')
    console.log('🔍 [AddStudentModal] studentsData:', studentsData)
    console.log('🔍 [AddStudentModal] enrolledStudentsData:', enrolledStudentsData)

    // 타입 가드: studentsData가 올바른 형식인지 확인
    if (!studentsData ||
        typeof studentsData !== 'object' ||
        !('data' in studentsData) ||
        !studentsData.data ||
        typeof studentsData.data !== 'object' ||
        !('students' in studentsData.data) ||
        !Array.isArray(studentsData.data.students)) {
      console.log('🔍 [AddStudentModal] studentsData가 없어서 빈 배열 반환')
      return []
    }

    // 타입 가드: enrolledStudentsData가 올바른 형식인지 확인
    const enrolledStudents = (enrolledStudentsData &&
      typeof enrolledStudentsData === 'object' &&
      'data' in enrolledStudentsData &&
      enrolledStudentsData.data &&
      typeof enrolledStudentsData.data === 'object' &&
      'students' in enrolledStudentsData.data &&
      Array.isArray(enrolledStudentsData.data.students)) ?
      enrolledStudentsData.data.students : []

    const enrolledIds = new Set(
      enrolledStudents.map((e: any) => e.student_id) || []
    )

    console.log('🔍 [AddStudentModal] enrolledIds:', Array.from(enrolledIds))
    console.log('🔍 [AddStudentModal] 전체 학생 수:', studentsData.data.students.length)

    const filtered = studentsData.data.students.filter((student: Student) => {
      const isNotEnrolled = !enrolledIds.has(student.id)
      const isActive = student.status === 'active'
      console.log(`🔍 [AddStudentModal] 학생 ${student.name}: enrolled=${!isNotEnrolled}, active=${isActive}`)
      return isNotEnrolled && isActive
    })

    console.log('🔍 [AddStudentModal] 필터링된 학생 수:', filtered.length)
    console.log('🔍 [AddStudentModal] 필터링된 학생들:', filtered.map((s: Student) => s.name))

    return filtered
  }, [studentsData, enrolledStudentsData])

  // 검색 필터링
  const filteredStudents = useMemo(() => {
    if (!availableStudents) return []
    
    if (!searchTerm.trim()) return availableStudents
    
    const search = searchTerm.toLowerCase()
    return availableStudents.filter((student: Student) =>
      student.name.toLowerCase().includes(search) ||
      student.student_number.toLowerCase().includes(search) ||
      student.phone?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search)
    )
  }, [availableStudents, searchTerm])

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleNext = () => {
    if (selectedStudents.length === 0) {
      toast.error('최소 한 명의 학생을 선택해주세요.')
      return
    }
    setFormData(prev => ({ ...prev, selectedStudents }))
    setCurrentStep('config')
  }

  const handleBack = () => {
    setCurrentStep('select')
  }

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) return

    const enrollmentData = {
      originalPrice: formData.originalPrice,
      discountAmount: formData.discountAmount,
      finalPrice: formData.finalPrice,
      paymentPlan: formData.paymentPlan || undefined,
      hoursTotal: formData.hoursTotal || undefined,
      sessionsTotal: formData.sessionsTotal || undefined,
      notes: formData.notes || undefined
    }

    try {
      // 선택된 학생들을 순차적으로 등록
      for (const studentId of selectedStudents) {
        await addStudentMutation.mutateAsync({
          studentId,
          enrollmentData
        })
      }
      
      toast.success(`${selectedStudents.length}명의 학생이 성공적으로 등록되었습니다.`)
      handleClose()
    } catch (error) {
      // 에러는 mutation에서 처리됨
    }
  }

  const handleClose = () => {
    setCurrentStep('select')
    setSelectedStudents([])
    setSearchTerm('')
    setFormData({
      originalPrice: 0,
      discountAmount: 0,
      finalPrice: 0,
      paymentPlan: 'monthly',
      hoursTotal: 0,
      sessionsTotal: 0,
      notes: '',
      selectedStudents: []
    })
    onClose()
  }

  const updateFinalPrice = (originalPrice: number, discountAmount: number) => {
    const final = Math.max(0, originalPrice - discountAmount)
    setFormData(prev => ({ ...prev, finalPrice: final }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            클래스에 학생 등록 - {classData.name}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'select' 
              ? '등록할 학생을 선택해주세요.'
              : '등록 정보를 설정해주세요.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {currentStep === 'select' && (
            <div className="space-y-4">
              {/* 검색 */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="이름, 학번, 연락처로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 선택된 학생 수 */}
              {selectedStudents.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {selectedStudents.length}명의 학생이 선택되었습니다.
                  </p>
                </div>
              )}

              {/* 학생 목록 */}
              {isLoadingStudents ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록 가능한 학생이 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">선택</TableHead>
                        <TableHead>학생 정보</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>연락처</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student: Student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => handleStudentSelect(student.id)}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={student.profile_image || undefined} />
                                <AvatarFallback>
                                  {student.name.substring(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {student.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {student.student_number}
                                  {student.grade_level && ` • ${student.grade_level}`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="default">활성</Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {student.phone && (
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <PhoneIcon className="w-3 h-3 mr-1" />
                                  {student.phone}
                                </div>
                              )}
                              {student.school_name && (
                                <div className="flex items-center text-gray-500 dark:text-gray-500 mt-1">
                                  <AcademicCapIcon className="w-3 h-3 mr-1" />
                                  {student.school_name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {currentStep === 'config' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  선택된 학생 ({selectedStudents.length}명)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map(studentId => {
                    const student = availableStudents.find((s: Student) => s.id === studentId)
                    return student ? (
                      <Badge key={studentId} variant="outline">
                        {student.name} ({student.student_number})
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="originalPrice">수강료</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => {
                        const price = parseInt(e.target.value) || 0
                        setFormData(prev => ({ ...prev, originalPrice: price }))
                        updateFinalPrice(price, formData.discountAmount)
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discountAmount">할인 금액</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      max={formData.originalPrice}
                      value={formData.discountAmount}
                      onChange={(e) => {
                        const discount = parseInt(e.target.value) || 0
                        setFormData(prev => ({ ...prev, discountAmount: discount }))
                        updateFinalPrice(formData.originalPrice, discount)
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="finalPrice">최종 결제 금액</Label>
                    <Input
                      id="finalPrice"
                      type="number"
                      value={formData.finalPrice}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentPlan">결제 방식</Label>
                    <Select 
                      value={formData.paymentPlan} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentPlan: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">월 단위</SelectItem>
                        <SelectItem value="quarterly">분기 단위</SelectItem>
                        <SelectItem value="yearly">연 단위</SelectItem>
                        <SelectItem value="one_time">일시불</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sessionsTotal">총 수업 횟수</Label>
                    <Input
                      id="sessionsTotal"
                      type="number"
                      min="0"
                      value={formData.sessionsTotal}
                      onChange={(e) => setFormData(prev => ({ ...prev, sessionsTotal: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hoursTotal">총 수업 시간</Label>
                    <Input
                      id="hoursTotal"
                      type="number"
                      min="0"
                      value={formData.hoursTotal}
                      onChange={(e) => setFormData(prev => ({ ...prev, hoursTotal: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">메모</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="수강 등록에 대한 추가 메모..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {currentStep === 'select' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={selectedStudents.length === 0}
              >
                다음 ({selectedStudents.length}명 선택됨)
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack}>
                이전
              </Button>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={addStudentMutation.isPending}
              >
                {addStudentMutation.isPending ? '등록 중...' : '등록 완료'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}