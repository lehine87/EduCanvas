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
import { useCreateStudent } from '@/hooks/mutations/useStudentMutations'
import { 
  UserPlusIcon, 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Loader2, X } from 'lucide-react'
import type { Student, StudentStatus } from '@/types/student.types'
import { cn } from '@/lib/utils'

/**
 * CreateStudentSideSheet Props
 */
export interface CreateStudentSideSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 생성 성공 콜백 */
  onSuccess?: (student: Student) => void
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
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

const initialFormData: StudentFormData = {
  name: '',
  status: 'active' as StudentStatus,
  student_number: '',
  email: '',
  phone: '',
  birth_date: '',
  grade_level: '',
  school_name: '',
  parent_name_1: '',
  parent_phone_1: '',
  parent_name_2: '',
  parent_phone_2: '',
  address: '',
  notes: ''
}

/**
 * CreateStudentSideSheet - 사이드바 옆에서 열리는 학생 등록 Sheet
 */
export const CreateStudentSideSheet = memo<CreateStudentSideSheetProps>(({
  open,
  onOpenChange,
  onSuccess,
  sidebarWidth = 384, // 사이드바 기본 너비 (w-96 = 24rem = 384px)
  className
}) => {
  // 상태 관리
  const { profile: userProfile } = useAuthStore()
  const createStudentMutation = useCreateStudent()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({})

  // 폼 리셋
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData)
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

  // 제출 핸들러
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    if (!userProfile?.tenant_id) {
      return
    }

    setIsLoading(true)

    try {
      const result = await createStudentMutation.mutateAsync({
        ...formData,
        student_number: formData.student_number || `S${Date.now()}`,
        status: formData.status
      })

      onSuccess?.(result.student)
      onOpenChange(false)
      setFormData(initialFormData)
      setErrors({})
    } catch (error) {
      console.error('학생 등록 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, userProfile, createStudentMutation, onSuccess, onOpenChange, validateForm])

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
                      <UserPlusIcon className="h-4 w-4 text-educanvas-600 dark:text-educanvas-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        새 학생 등록
                      </h2>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        학생 정보를 입력해주세요
                      </p>
                    </div>
                  </div>
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

              {/* 폼 콘텐츠 - 더 컴팩트한 간격 */}
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
                              <SelectItem value="inactive">비활성</SelectItem>
                              <SelectItem value="withdrawn">퇴학</SelectItem>
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

              {/* 푸터 - 더 컴팩트하게 */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 h-9"
                    disabled={isLoading}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 h-9 bg-educanvas-500 hover:bg-educanvas-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-3 w-3 mr-1.5" />
                        등록
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})