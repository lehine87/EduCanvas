'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateClass, useDeleteClass } from '@/hooks/mutations/useClassMutations'
import {
  AcademicCapIcon,
  PencilIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  ChartBarIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Loader2, X } from 'lucide-react'
import type { Class, ClassFormData } from '@/types/class.types'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

/**
 * ClassDetailSideSheet Props
 */
export interface ClassDetailSideSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 표시할 클래스 데이터 */
  classData: Class | null
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** 수정 성공 콜백 */
  onUpdateSuccess?: (updatedClass: Class) => void
  /** 삭제 성공 콜백 */
  onDeleteSuccess?: () => void
}

/**
 * 클래스 폼 데이터 타입
 */
interface ClassEditFormData {
  // 기본 정보
  name: string
  description?: string
  max_students: number
  min_students?: number

  // 수업 정보
  duration_minutes?: number
  price?: number

  // 기타
  notes?: string
}

/**
 * ClassDetailSideSheet - 사이드바 옆에서 열리는 클래스 상세/수정 Sheet
 */
export const ClassDetailSideSheet = memo<ClassDetailSideSheetProps>(({
  open,
  onOpenChange,
  classData,
  sidebarWidth = 384,
  className,
  onUpdateSuccess,
  onDeleteSuccess
}) => {
  // 상태 관리
  const updateClassMutation = useUpdateClass()
  const deleteClassMutation = useDeleteClass()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ClassEditFormData>({
    name: '',
    description: '',
    max_students: 20,
    min_students: 1,
    duration_minutes: 60,
    price: 0,
    notes: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ClassEditFormData, string>>>({})

  // 클래스 정보로 폼 데이터 초기화
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        description: classData.description || '',
        max_students: classData.max_students || 20,
        min_students: classData.min_students || 1,
        duration_minutes: classData.duration_minutes || 60,
        price: classData.price || 0,
        notes: classData.notes || ''
      })
    }
  }, [classData])

  // Sheet 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setErrors({})
      setIsLoading(false)
      setIsEditing(false)
    }
  }, [open])

  // 입력 핸들러
  const handleInputChange = useCallback((field: keyof ClassEditFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  // 유효성 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ClassEditFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '클래스명은 필수입니다'
    }

    if (formData.max_students < 1) {
      newErrors.max_students = '정원은 1명 이상이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!validateForm() || !classData) {
      toast.error('필수 정보를 확인해주세요')
      return
    }

    setIsSaving(true)

    try {
      const updateData = {
        ...formData,
        description: formData.description || undefined,
        min_students: formData.min_students || undefined,
        duration_minutes: formData.duration_minutes || undefined,
        price: formData.price || undefined,
        notes: formData.notes || undefined
      }

      // API 호출 및 업데이트된 클래스 데이터 받기
      const response = await updateClassMutation.mutateAsync({
        classId: classData.id,
        data: updateData
      })

      toast.success('클래스 정보가 수정되었습니다')
      setIsEditing(false)

      // 수정된 클래스 데이터를 콜백으로 전달
      const updatedClass = response.data.class
      onUpdateSuccess?.(updatedClass)
    } catch (error) {
      console.error('클래스 정보 수정 실패:', error)
      toast.error('클래스 정보 수정에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }, [formData, classData, updateClassMutation, validateForm, onUpdateSuccess])

  // 편집 취소 핸들러
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    // 원래 데이터로 복구
    if (classData) {
      setFormData({
        name: classData.name || '',
        description: classData.description || '',
        max_students: classData.max_students || 20,
        min_students: classData.min_students || 1,
        duration_minutes: classData.duration_minutes || 60,
        price: classData.price || 0,
        notes: classData.notes || ''
      })
    }
    setErrors({})
  }, [classData])

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!classData) return

    const confirmed = window.confirm(`"${classData.name}" 클래스를 정말 삭제하시겠습니까?`)
    if (!confirmed) return

    try {
      await deleteClassMutation.mutateAsync(classData.id)

      toast.success('클래스가 삭제되었습니다')
      onDeleteSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('클래스 삭제 실패:', error)
      toast.error('클래스 삭제에 실패했습니다')
    }
  }, [classData, deleteClassMutation, onDeleteSuccess, onOpenChange])

  if (!classData) {
    return null
  }

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
              left: `${sidebarWidth}px`,
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
              top: '65px',
              bottom: 0,
              zIndex: 30
            }}
          >
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-educanvas-100 dark:bg-educanvas-900/30">
                      <PencilIcon className="h-4 w-4 text-educanvas-600 dark:text-educanvas-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        클래스 정보 {isEditing ? '수정' : '조회'}
                      </h2>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {classData?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="h-7 w-7"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
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

              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {/* 기본 정보 섹션 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <AcademicCapIcon className="h-4 w-4" />
                        기본 정보
                      </h3>
                      <Badge variant={classData.is_active ? 'default' : 'secondary'}>
                        {classData.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs">
                          클래스명 <span className="text-red-500">*</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="수학 기초반"
                            className={cn("h-9", errors.name ? 'border-red-500' : '')}
                          />
                        ) : (
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.name}
                          </div>
                        )}
                        {errors.name && (
                          <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs">설명</Label>
                        {isEditing ? (
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="클래스에 대한 간단한 설명..."
                            rows={3}
                            className="text-sm"
                          />
                        ) : (
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm min-h-[80px]">
                            {classData.description || '설명이 없습니다'}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="max_students" className="text-xs">정원</Label>
                          {isEditing ? (
                            <Input
                              id="max_students"
                              type="number"
                              value={formData.max_students}
                              onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 20)}
                              min="1"
                              max="100"
                              className="h-9"
                            />
                          ) : (
                            <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                              {classData.max_students || 20}명
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="current_students" className="text-xs">현재 수강생</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.student_count || 0}명
                          </div>
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
                        <Label className="text-xs">담당 강사</Label>
                        <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                          {classData.instructor?.name || '미배정'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">과목</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.subject || '미설정'}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">과정</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.course || '미설정'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">강의실</Label>
                        <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                          {classData.room || '미배정'}
                        </div>
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
                          {isEditing ? (
                            <Select
                              value={formData.duration_minutes?.toString()}
                              onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
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
                          ) : (
                            <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                              {classData.duration_minutes || 60}분
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="price" className="text-xs">수강료</Label>
                          {isEditing ? (
                            <Input
                              id="price"
                              type="number"
                              value={formData.price}
                              onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                              placeholder="50000"
                              className="h-9"
                            />
                          ) : (
                            <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                              {classData.price?.toLocaleString() || 0}원
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* 통계 정보 섹션 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4" />
                      통계 정보
                    </h3>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">출석률</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.attendance_rate || 0}%
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">총 수익</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.revenue_total?.toLocaleString() || 0}원
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">다음 수업</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.next_session
                              ? new Date(classData.next_session).toLocaleDateString('ko-KR')
                              : '미정'
                            }
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">마지막 수업</Label>
                          <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm">
                            {classData.last_session
                              ? new Date(classData.last_session).toLocaleDateString('ko-KR')
                              : '없음'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 메모 섹션 */}
                  <Separator className="my-3" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      메모
                    </h3>

                    {isEditing ? (
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="클래스에 대한 추가 정보..."
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <div className="mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm min-h-[80px]">
                        {classData.notes || '메모가 없습니다'}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* 푸터 */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1 h-9"
                      disabled={isSaving}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex-1 h-9 bg-educanvas-500 hover:bg-educanvas-600"
                      disabled={isSaving}
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
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="flex-1 h-9"
                    >
                      닫기
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="h-9 px-3"
                      disabled={deleteClassMutation.isPending}
                    >
                      {deleteClassMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <TrashIcon className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

ClassDetailSideSheet.displayName = 'ClassDetailSideSheet'

export default ClassDetailSideSheet