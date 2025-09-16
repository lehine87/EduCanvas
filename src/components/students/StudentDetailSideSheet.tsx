'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/store/useAuthStore'
import { useUpdateStudent, useDeleteStudent } from '@/hooks/mutations/useStudentMutations'
import { useStudent } from '@/hooks/queries/useStudents'
import { 
  UserIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  CheckIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { Loader2, X } from 'lucide-react'
import type { Student, StudentStatus } from '@/types/student.types'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

/**
 * StudentDetailSideSheet Props
 */
export interface StudentDetailSideSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 표시할 학생 ID */
  studentId?: string | null
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** 수정 성공 콜백 */
  onUpdateSuccess?: (student: Student) => void
  /** 삭제 성공 콜백 */
  onDeleteSuccess?: (studentId: string) => void
}

/**
 * 학생 폼 데이터 타입
 */
interface StudentFormData {
  // 기본 정보
  name: string
  student_number?: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female'
  
  // 학업 정보
  grade_level?: string
  school_name?: string
  status: StudentStatus
  
  // 학부모 연락처
  parent_name_1?: string
  parent_phone_1?: string
  parent_name_2?: string
  parent_phone_2?: string
  
  // 주소
  address?: string
  
  // 기타
  notes?: string
}


/**
 * StudentDetailSideSheet - 사이드바 옆에서 열리는 학생 상세/수정 Sheet
 */
export const StudentDetailSideSheet = memo<StudentDetailSideSheetProps>(({
  open,
  onOpenChange,
  studentId,
  sidebarWidth = 384,
  className,
  onUpdateSuccess,
  onDeleteSuccess
}) => {
  // 상태 관리
  const { profile: userProfile } = useAuthStore()
  const { data: studentData, isLoading: loading } = useStudent(studentId || '', { enabled: !!studentId })
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()

  const selectedStudent = studentData?.student
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    student_number: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: undefined,
    grade_level: '',
    school_name: '',
    status: 'active' as StudentStatus,
    parent_name_1: '',
    parent_phone_1: '',
    parent_name_2: '',
    parent_phone_2: '',
    address: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({})

  // API Client 패턴으로 자동 로딩됨

  // 학생 정보로 폼 데이터 초기화
  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        name: selectedStudent.name || '',
        student_number: selectedStudent.student_number || '',
        email: selectedStudent.email || '',
        phone: selectedStudent.phone || '',
        birth_date: selectedStudent.birth_date || '',
        gender: selectedStudent.gender as 'male' | 'female' | undefined,
        grade_level: selectedStudent.grade_level || '',
        school_name: selectedStudent.school_name || '',
        status: selectedStudent.status || 'active',
        parent_name_1: selectedStudent.parent_name_1 || '',
        parent_phone_1: selectedStudent.parent_phone_1 || '',
        parent_name_2: selectedStudent.parent_name_2 || '',
        parent_phone_2: selectedStudent.parent_phone_2 || '',
        address: selectedStudent.address || '',
        notes: selectedStudent.notes || ''
      })
    }
  }, [selectedStudent])

  // Sheet 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setErrors({})
      setIsLoading(false)
    }
  }, [open])

  // 입력 핸들러
  const handleInputChange = useCallback((field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  // 유효성 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름은 필수입니다'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }

    if (formData.phone && !/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!validateForm() || !selectedStudent || !userProfile?.tenant_id) {
      toast.error('필수 정보를 확인해주세요')
      return
    }

    setIsSaving(true)

    try {
      const updateData = {
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        birth_date: formData.birth_date || undefined,
        parent_name_1: formData.parent_name_1 || undefined,
        parent_name_2: formData.parent_name_2 || undefined,
        parent_phone_1: formData.parent_phone_1 || undefined,
        parent_phone_2: formData.parent_phone_2 || undefined,
        grade_level: formData.grade_level || undefined,
        school_name: formData.school_name || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined
      }

      // API 호출 및 업데이트된 학생 데이터 받기
      const result = await updateStudentMutation.mutateAsync({ id: selectedStudent.id, data: updateData })
      const updatedStudent = result.student

      toast.success('학생 정보가 수정되었습니다')

      // 수정된 학생 데이터를 콜백으로 전달
      onUpdateSuccess?.(updatedStudent)
    } catch (error) {
      console.error('학생 정보 수정 실패:', error)
      toast.error('학생 정보 수정에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }, [formData, selectedStudent, userProfile, updateStudentMutation, validateForm, onUpdateSuccess])



  if (!selectedStudent && !loading) {
    return null
  }

  return (
    <>

      {/* Sheet 본체 - 사이드바 오른쪽에서 나타남 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              duration: 0.3
            }}
            className={cn(
              "fixed w-[400px] origin-left",
              "backdrop-blur-md bg-white/80 dark:bg-neutral-950/80",
              "border border-white/20 dark:border-neutral-700/30",
              "shadow-2xl dark:shadow-none",
              "rounded-2xl overflow-hidden",
              className
            )}
            style={{
              left: `${sidebarWidth + 32}px`, // 사이드바에서 32px 떨어진 위치
              top: '80px', // 사이드바와 동일한 top 위치
              bottom: '16px', // 사이드바와 동일한 bottom 마진
              zIndex: 30
            }}
          >
            {/* 글래스 효과 강화를 위한 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="relative flex flex-col h-full">
              {/* 헤더 - glassmorphism 스타일 */}
              <div className="px-6 py-4 border-b border-white/10 dark:border-neutral-800/50 bg-gradient-to-b from-white/10 to-transparent dark:from-black/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-educanvas-100 dark:bg-educanvas-900/30">
                      <PencilIcon className="h-4 w-4 text-educanvas-600 dark:text-educanvas-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        학생 정보 수정
                      </h2>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {selectedStudent?.name} {selectedStudent?.student_number && `(${selectedStudent.student_number})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenChange(false)}
                      className="h-7 w-7"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-neutral-600">로딩 중...</span>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-4">
                            {/* 기본 정보 섹션 */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                기본 정보
                              </h3>
                              
                              <div className="space-y-2">
                                <div className="space-y-1.5">
                                  <Label htmlFor="name" className="text-xs">
                                    이름 <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="홍길동"
                                    className={cn("h-9", errors.name ? 'border-red-500' : '')}
                                  />
                                  {errors.name && (
                                    <p className="text-xs text-red-500">{errors.name}</p>
                                  )}
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="student_number" className="text-xs">학번</Label>
                                  <Input
                                    id="student_number"
                                    value={formData.student_number}
                                    onChange={(e) => handleInputChange('student_number', e.target.value)}
                                    placeholder="2024001"
                                    className="h-9"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="birth_date" className="text-xs">생년월일</Label>
                                    <Input
                                      id="birth_date"
                                      type="date"
                                      value={formData.birth_date}
                                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                      className="h-9"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label htmlFor="gender" className="text-xs">성별</Label>
                                    <Select
                                      value={formData.gender}
                                      onValueChange={(value) => handleInputChange('gender', value)}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="선택" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="male">남</SelectItem>
                                        <SelectItem value="female">여</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-3" />

                            {/* 연락처 정보 섹션 */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <PhoneIcon className="h-4 w-4" />
                                연락처 정보
                              </h3>
                              
                              <div className="space-y-2">
                                <div className="space-y-1.5">
                                  <Label htmlFor="phone" className="text-xs">전화번호</Label>
                                  <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="010-1234-5678"
                                    className={cn("h-9", errors.phone ? 'border-red-500' : '')}
                                  />
                                  {errors.phone && (
                                    <p className="text-xs text-red-500">{errors.phone}</p>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs">이메일</Label>
                                    <Input
                                      id="email"
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) => handleInputChange('email', e.target.value)}
                                      placeholder="email@example.com"
                                      className={cn("h-9", errors.email ? 'border-red-500' : '')}
                                    />
                                    {errors.email && (
                                      <p className="text-xs text-red-500">{errors.email}</p>
                                    )}
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label htmlFor="address" className="text-xs">주소</Label>
                                    <Input
                                      id="address"
                                      value={formData.address}
                                      onChange={(e) => handleInputChange('address', e.target.value)}
                                      placeholder="서울시 강남구..."
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-3" />

                            {/* 학업 정보 섹션 */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <CalendarDaysIcon className="h-4 w-4" />
                                학업 정보
                              </h3>
                              
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="school_name" className="text-xs">학교</Label>
                                    <Input
                                      id="school_name"
                                      value={formData.school_name}
                                      onChange={(e) => handleInputChange('school_name', e.target.value)}
                                      placeholder="강남중"
                                      className="h-9"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label htmlFor="grade_level" className="text-xs">학년</Label>
                                    <Select
                                      value={formData.grade_level}
                                      onValueChange={(value) => handleInputChange('grade_level', value)}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="선택" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="초1">초1</SelectItem>
                                        <SelectItem value="초2">초2</SelectItem>
                                        <SelectItem value="초3">초3</SelectItem>
                                        <SelectItem value="초4">초4</SelectItem>
                                        <SelectItem value="초5">초5</SelectItem>
                                        <SelectItem value="초6">초6</SelectItem>
                                        <SelectItem value="중1">중1</SelectItem>
                                        <SelectItem value="중2">중2</SelectItem>
                                        <SelectItem value="중3">중3</SelectItem>
                                        <SelectItem value="고1">고1</SelectItem>
                                        <SelectItem value="고2">고2</SelectItem>
                                        <SelectItem value="고3">고3</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-xs">상태</Label>
                                    <Select
                                      value={formData.status}
                                      onValueChange={(value) => handleInputChange('status', value as StudentStatus)}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">활동중</SelectItem>
                                        <SelectItem value="inactive">휴원</SelectItem>
                                        <SelectItem value="withdrawn">탈퇴</SelectItem>
                                        <SelectItem value="graduated">졸업</SelectItem>
                                        <SelectItem value="suspended">정지</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-3" />

                            {/* 학부모 정보 섹션 */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                학부모 정보
                              </h3>
                              
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="parent_name_1" className="text-xs">학부모 1 이름</Label>
                                    <Input
                                      id="parent_name_1"
                                      value={formData.parent_name_1}
                                      onChange={(e) => handleInputChange('parent_name_1', e.target.value)}
                                      placeholder="홍부모"
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="parent_phone_1" className="text-xs">학부모 1 연락처</Label>
                                    <Input
                                      id="parent_phone_1"
                                      value={formData.parent_phone_1}
                                      onChange={(e) => handleInputChange('parent_phone_1', e.target.value)}
                                      placeholder="010-1234-5678"
                                      className="h-9"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="parent_name_2" className="text-xs">학부모 2 이름</Label>
                                    <Input
                                      id="parent_name_2"
                                      value={formData.parent_name_2}
                                      onChange={(e) => handleInputChange('parent_name_2', e.target.value)}
                                      placeholder="홍부모"
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="parent_phone_2" className="text-xs">학부모 2 연락처</Label>
                                    <Input
                                      id="parent_phone_2"
                                      value={formData.parent_phone_2}
                                      onChange={(e) => handleInputChange('parent_phone_2', e.target.value)}
                                      placeholder="010-1234-5678"
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-3" />

                            {/* 메모 섹션 */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                메모
                              </h3>
                              
                              <Textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="학생에 대한 추가 정보..."
                                rows={3}
                                className="text-sm"
                              />
                            </div>
                    </div>
                </ScrollArea>
              )}

              {/* 푸터 */}
              {!loading && (
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="flex-1 h-9"
                      disabled={isSaving || loading}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex-1 h-9 bg-educanvas-500 hover:bg-educanvas-600"
                      disabled={isSaving || loading}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-3 w-3 mr-1.5" />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

StudentDetailSideSheet.displayName = 'StudentDetailSideSheet'