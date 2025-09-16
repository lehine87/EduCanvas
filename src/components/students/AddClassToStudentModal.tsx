'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
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
  AcademicCapIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import type { Student } from '@/types/student.types'

interface Class {
  id: string
  name: string
  subject?: string
  course?: string
  grade?: string
  level?: string
  is_active: boolean
  start_date?: string
  end_date?: string
  max_students?: number
  min_students?: number
  tenant_memberships?: {
    id: string
    user_profiles?: {
      id: string
      name: string
      email: string
    }
  }
  created_at: string
}

interface AddClassToStudentModalProps {
  isOpen: boolean
  onClose: () => void
  studentData: Student
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
  selectedClasses: string[]
}

export default function AddClassToStudentModal({
  isOpen,
  onClose,
  studentData,
  tenantId
}: AddClassToStudentModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<'select' | 'config'>('select')
  const [formData, setFormData] = useState<EnrollmentFormData>({
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0,
    paymentPlan: 'monthly',
    hoursTotal: 0,
    sessionsTotal: 0,
    notes: '',
    selectedClasses: []
  })
  
  const queryClient = useQueryClient()

  // 클래스 목록 조회 (등록되지 않은 클래스만)
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['available-classes', tenantId, searchTerm],
    queryFn: () => apiClient.get('/api/classes/search', {
      params: {
        tenantId,
        limit: 100,
        offset: 0,
        ...(searchTerm.trim() && { search: searchTerm.trim() })
      }
    }),
    enabled: isOpen && !!tenantId
  })

  // 이미 등록된 클래스들 조회
  const { data: enrolledClassesData } = useQuery({
    queryKey: queryKeys.studentClasses(studentData.id, { tenantId, status: 'active' }),
    queryFn: () => apiClient.get(`/api/students/${studentData.id}/classes`, {
      params: {
        tenantId,
        status: 'active',
        limit: 1000
      }
    }),
    enabled: isOpen && !!studentData.id && !!tenantId
  })

  // 클래스 등록 mutation
  const addClassMutation = useMutation({
    mutationFn: (classData: { classId: string; enrollmentData: any }) =>
      apiClient.post(`/api/students/${studentData.id}/classes`, {
        tenantId,
        classId: classData.classId,
        ...classData.enrollmentData
      }),
    onSuccess: (data, variables) => {
      toast.success('클래스가 학생에게 성공적으로 등록되었습니다.')
      queryClient.invalidateQueries({ queryKey: queryKeys.studentClasses(studentData.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
    },
    onError: (error) => {
      toast.error(`클래스 등록 실패: ${getErrorMessage(error)}`)
    }
  })

  // 사용 가능한 클래스 목록 (이미 등록된 클래스 제외)
  const availableClasses = useMemo(() => {
    if (!classesData?.classes) return []

    const enrolledIds = new Set(
      enrolledClassesData?.enrollments?.all?.map((e: any) => e.class_id) || []
    )

    return classesData.classes.filter((classItem: Class) =>
      !enrolledIds.has(classItem.id) && classItem.is_active
    )
  }, [classesData?.classes, enrolledClassesData?.enrollments?.all])

  // 검색 필터링
  const filteredClasses = useMemo(() => {
    if (!availableClasses) return []
    
    if (!searchTerm.trim()) return availableClasses
    
    const search = searchTerm.toLowerCase()
    return availableClasses.filter((classItem: Class) =>
      classItem.name.toLowerCase().includes(search) ||
      classItem.subject?.toLowerCase().includes(search) ||
      classItem.course?.toLowerCase().includes(search) ||
      classItem.grade?.toLowerCase().includes(search)
    )
  }, [availableClasses, searchTerm])

  const handleClassSelect = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const handleNext = () => {
    if (selectedClasses.length === 0) {
      toast.error('최소 한 개의 클래스를 선택해주세요.')
      return
    }
    setFormData(prev => ({ ...prev, selectedClasses }))
    setCurrentStep('config')
  }

  const handleBack = () => {
    setCurrentStep('select')
  }

  const handleSubmit = async () => {
    if (selectedClasses.length === 0) return

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
      // 선택된 클래스들을 순차적으로 등록
      for (const classId of selectedClasses) {
        await addClassMutation.mutateAsync({
          classId,
          enrollmentData
        })
      }
      
      toast.success(`${selectedClasses.length}개의 클래스가 성공적으로 등록되었습니다.`)
      handleClose()
    } catch (error) {
      // 에러는 mutation에서 처리됨
    }
  }

  const handleClose = () => {
    setCurrentStep('select')
    setSelectedClasses([])
    setSearchTerm('')
    setFormData({
      originalPrice: 0,
      discountAmount: 0,
      finalPrice: 0,
      paymentPlan: 'monthly',
      hoursTotal: 0,
      sessionsTotal: 0,
      notes: '',
      selectedClasses: []
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
            학생에게 클래스 등록 - {studentData.name}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'select' 
              ? '등록할 클래스를 선택해주세요.'
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
                  placeholder="클래스명, 과목, 과정으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 선택된 클래스 수 */}
              {selectedClasses.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {selectedClasses.length}개의 클래스가 선택되었습니다.
                  </p>
                </div>
              )}

              {/* 클래스 목록 */}
              {isLoadingClasses ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록 가능한 클래스가 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">선택</TableHead>
                        <TableHead>클래스 정보</TableHead>
                        <TableHead>강사</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>정원</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClasses.map((classItem: Class) => (
                        <TableRow key={classItem.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedClasses.includes(classItem.id)}
                              onCheckedChange={() => handleClassSelect(classItem.id)}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-educanvas-100 text-educanvas-700">
                                  <AcademicCapIcon className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {classItem.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {[
                                    classItem.subject,
                                    classItem.course,
                                    classItem.grade
                                  ].filter(Boolean).join(' • ')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {classItem.tenant_memberships?.user_profiles?.name || '-'}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="default">활성</Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {classItem.max_students ? `최대 ${classItem.max_students}명` : '무제한'}
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
                  선택된 클래스 ({selectedClasses.length}개)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClasses.map(classId => {
                    const classItem = availableClasses.find((c: Class) => c.id === classId)
                    return classItem ? (
                      <Badge key={classId} variant="outline">
                        {classItem.name}
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
                disabled={selectedClasses.length === 0}
              >
                다음 ({selectedClasses.length}개 선택됨)
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
                disabled={addClassMutation.isPending}
              >
                {addClassMutation.isPending ? '등록 중...' : '등록 완료'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}