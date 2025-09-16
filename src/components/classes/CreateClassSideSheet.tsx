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
import { useCreateClass } from '@/hooks/mutations/useClassMutations'
import {
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Loader2, X } from 'lucide-react'
import type { ClassFormData } from '@/types/class.types'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

/**
 * CreateClassSideSheet Props
 */
export interface CreateClassSideSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 생성 성공 콜백 */
  onSuccess?: () => void
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
}

const initialFormData: ClassFormData = {
  name: '',
  description: '',
  instructor_id: '',
  subject: '',
  course: '',
  max_students: 20,
  min_students: 1,
  start_date: '',
  end_date: '',
  classroom_id: '',
  duration_minutes: 60,
  price: 0
}

/**
 * CreateClassSideSheet - 사이드바 옆에서 열리는 클래스 등록 Sheet
 */
export const CreateClassSideSheet = memo<CreateClassSideSheetProps>(({
  open,
  onOpenChange,
  onSuccess,
  sidebarWidth = 384, // 사이드바 기본 너비 (w-96 = 24rem = 384px)
  className
}) => {
  // 상태 관리
  const createClassMutation = useCreateClass()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ClassFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ClassFormData, string>>>({})

  // 폼 리셋
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData)
      setErrors({})
      setIsLoading(false)
    }
  }, [open])

  // 입력 핸들러
  const handleInputChange = useCallback((field: keyof ClassFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  // 유효성 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ClassFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '클래스명은 필수입니다'
    }

    if (!formData.start_date) {
      newErrors.start_date = '시작일은 필수입니다'
    }

    if (formData.max_students && formData.max_students < 1) {
      newErrors.max_students = '정원은 1명 이상이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 제출 핸들러
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await createClassMutation.mutateAsync(formData)

      toast.success('새 클래스가 등록되었습니다')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('클래스 등록 실패:', error)
      toast.error('클래스 등록에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [formData, createClassMutation, onSuccess, onOpenChange, validateForm])

  return (
    <>
      {/* 메인 영역 오버레이 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-black/30 z-30"
            style={{
              left: `${sidebarWidth}px`, // 사이드바 바로 다음부터
              top: '65px',
              right: 0,
              bottom: 0
            }}
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

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
              "bg-white dark:bg-neutral-950",
              "border-r border-neutral-200 dark:border-neutral-800",
              "shadow-xl",
              className
            )}
            style={{
              left: `${sidebarWidth}px`,
              top: '65px', // 헤더 아래부터 시작
              bottom: 0,
              zIndex: 30
            }}
          >
            <div className="flex flex-col h-full">
              {/* 헤더 - 더 컴팩트하게 */}
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-educanvas-100 dark:bg-educanvas-900/30">
                      <PlusIcon className="h-4 w-4 text-educanvas-600 dark:text-educanvas-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        새 클래스 등록
                      </h2>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        클래스 정보를 입력해주세요
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
                      <AcademicCapIcon className="h-4 w-4" />
                      기본 정보
                    </h3>

                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs">
                          클래스명 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="수학 기초반"
                          className={cn("h-9", errors.name ? 'border-red-500' : '')}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs">설명</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="클래스에 대한 간단한 설명..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="max_students" className="text-xs">정원</Label>
                          <Input
                            id="max_students"
                            type="number"
                            value={formData.max_students}
                            onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 20)}
                            min="1"
                            max="100"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="min_students" className="text-xs">최소 인원</Label>
                          <Input
                            id="min_students"
                            type="number"
                            value={formData.min_students}
                            onChange={(e) => handleInputChange('min_students', parseInt(e.target.value) || 1)}
                            min="1"
                            max="100"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* 배정 정보 섹션 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4" />
                      배정 정보
                    </h3>

                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="instructor_id" className="text-xs">담당 강사</Label>
                        <Select
                          value={formData.instructor_id}
                          onValueChange={(value) => handleInputChange('instructor_id', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="강사를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="temp">임시 강사 (개발용)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="subject" className="text-xs">과목</Label>
                          <Select
                            value={formData.subject}
                            onValueChange={(value) => handleInputChange('subject', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="과목 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="math">수학</SelectItem>
                              <SelectItem value="english">영어</SelectItem>
                              <SelectItem value="science">과학</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="course" className="text-xs">과정</Label>
                          <Select
                            value={formData.course}
                            onValueChange={(value) => handleInputChange('course', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="과정 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">기초반</SelectItem>
                              <SelectItem value="intermediate">중급반</SelectItem>
                              <SelectItem value="advanced">고급반</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="classroom_id" className="text-xs">강의실</Label>
                        <Select
                          value={formData.classroom_id}
                          onValueChange={(value) => handleInputChange('classroom_id', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="강의실을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">배정하지 않음</SelectItem>
                            <SelectItem value="room1">강의실 1</SelectItem>
                            <SelectItem value="room2">강의실 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* 수업 정보 섹션 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      수업 정보
                    </h3>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="duration_minutes" className="text-xs">수업 시간</Label>
                          <Select
                            value={formData.duration_minutes?.toString()}
                            onValueChange={(value) => handleInputChange('duration_minutes' as keyof ClassFormData, parseInt(value))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="시간" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30분</SelectItem>
                              <SelectItem value="45">45분</SelectItem>
                              <SelectItem value="60">60분</SelectItem>
                              <SelectItem value="90">90분</SelectItem>
                              <SelectItem value="120">120분</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="price" className="text-xs">수강료</Label>
                          <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price' as keyof ClassFormData, parseInt(e.target.value) || 0)}
                            placeholder="50000"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* 기간 정보 섹션 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      수업 기간
                    </h3>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="start_date" className="text-xs">
                            시작일 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                            className={cn("h-9", errors.start_date ? 'border-red-500' : '')}
                          />
                          {errors.start_date && (
                            <p className="text-xs text-red-500">{errors.start_date}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="end_date" className="text-xs">종료일</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
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

CreateClassSideSheet.displayName = 'CreateClassSideSheet'

export default CreateClassSideSheet