'use client'

import React, { memo, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Input, Textarea, Button, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database'
import { ClassStudentManager } from './ClassStudentManager'

type Class = Database['public']['Tables']['classes']['Row']

// 클래스 폼 스키마
const classFormSchema = z.object({
  name: z.string()
    .min(1, '클래스 이름은 필수입니다')
    .max(100, '클래스 이름은 100자 이하여야 합니다'),
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다')
    .optional(),
  grade: z.string()
    .optional(),
  course: z.string()
    .optional(),
  subject: z.string()
    .optional(),
  instructor_id: z.string()
    .uuid('올바른 강사를 선택해주세요')
    .optional()
    .or(z.literal('')),
  classroom_id: z.string()
    .uuid('올바른 교실을 선택해주세요')
    .optional()
    .or(z.literal('')),
  max_students: z.number()
    .int('정수를 입력해주세요')
    .min(1, '최소 1명 이상이어야 합니다')
    .max(1000, '최대 1000명까지 가능합니다')
    .optional(),
  min_students: z.number()
    .int('정수를 입력해주세요')
    .min(1, '최소 1명 이상이어야 합니다')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해주세요')
    .optional()
    .or(z.literal('')),
  start_date: z.string()
    .optional()
    .or(z.literal('')),
  end_date: z.string()
    .optional()
    .or(z.literal('')),
  main_textbook: z.string()
    .max(200, '주교재명은 200자 이하여야 합니다')
    .optional(),
  supplementary_textbook: z.string()
    .max(200, '부교재명은 200자 이하여야 합니다')
    .optional(),
  is_active: z.boolean().optional().default(true)
}).refine((data) => {
  // 최소 학생 수가 최대 학생 수보다 작아야 함
  if (data.min_students && data.max_students) {
    return data.min_students <= data.max_students
  }
  return true
}, {
  message: '최소 학생 수는 최대 학생 수보다 작거나 같아야 합니다',
  path: ['min_students']
}).refine((data) => {
  // 종료일이 시작일보다 늦어야 함
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date)
  }
  return true
}, {
  message: '종료일은 시작일보다 늦어야 합니다',
  path: ['end_date']
})

export type ClassFormData = z.infer<typeof classFormSchema>

// 옵션 타입 정의
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * ClassForm Props
 */
export interface ClassFormProps {
  /** 폼 모드 */
  mode: 'create' | 'edit'
  /** 초기 데이터 (수정 모드일 때) */
  initialData?: Partial<Class>
  /** 제출 핸들러 */
  onSubmit: (data: ClassFormData) => Promise<void> | void
  /** 취소 핸들러 */
  onCancel?: () => void
  /** 로딩 상태 */
  loading?: boolean
  /** 강사 목록 */
  instructors?: SelectOption[]
  /** 교실 목록 */
  classrooms?: SelectOption[]
  /** 학년 옵션 */
  gradeOptions?: SelectOption[]
  /** 과정 옵션 */
  courseOptions?: SelectOption[]
  /** 과목 옵션 */
  subjectOptions?: SelectOption[]
  /** 추가 CSS 클래스 */
  className?: string
  /** 폼 비활성화 */
  disabled?: boolean
}

// 기본 옵션들 (빈 문자열 value 제거)
const DEFAULT_GRADE_OPTIONS: SelectOption[] = [
  { value: '초1', label: '초등학교 1학년' },
  { value: '초2', label: '초등학교 2학년' },
  { value: '초3', label: '초등학교 3학년' },
  { value: '초4', label: '초등학교 4학년' },
  { value: '초5', label: '초등학교 5학년' },
  { value: '초6', label: '초등학교 6학년' },
  { value: '중1', label: '중학교 1학년' },
  { value: '중2', label: '중학교 2학년' },
  { value: '중3', label: '중학교 3학년' },
  { value: '고1', label: '고등학교 1학년' },
  { value: '고2', label: '고등학교 2학년' },
  { value: '고3', label: '고등학교 3학년' },
  { value: '기타', label: '기타' }
]

const DEFAULT_COURSE_OPTIONS: SelectOption[] = [
  { value: '정규', label: '정규 과정' },
  { value: '특별', label: '특별 과정' },
  { value: '심화', label: '심화 과정' },
  { value: '기초', label: '기초 과정' },
  { value: '입시', label: '입시 과정' },
  { value: '방학특강', label: '방학특강' },
  { value: '기타', label: '기타' }
]

const DEFAULT_SUBJECT_OPTIONS: SelectOption[] = [
  { value: '국어', label: '국어' },
  { value: '영어', label: '영어' },
  { value: '수학', label: '수학' },
  { value: '과학', label: '과학' },
  { value: '사회', label: '사회' },
  { value: '역사', label: '역사' },
  { value: '미술', label: '미술' },
  { value: '음악', label: '음악' },
  { value: '체육', label: '체육' },
  { value: '기타', label: '기타' }
]

const DEFAULT_COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6B7280'  // gray
]

/**
 * ClassForm - 클래스 생성/수정 공통 폼 컴포넌트
 * 
 * 특징:
 * - React Hook Form + Zod 검증
 * - TypeScript 완전 타입 안전성
 * - 실시간 검증 및 에러 표시
 * - 접근성 완벽 지원
 * - 반응형 레이아웃
 * 
 * @example
 * ```tsx
 * <ClassForm
 *   mode="create"
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   instructors={instructorOptions}
 *   classrooms={classroomOptions}
 * />
 * ```
 */
export const ClassForm = memo<ClassFormProps>(({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  instructors = [],
  classrooms = [],
  gradeOptions = DEFAULT_GRADE_OPTIONS,
  courseOptions = DEFAULT_COURSE_OPTIONS,
  subjectOptions = DEFAULT_SUBJECT_OPTIONS,
  className,
  disabled = false
}) => {
  // 폼 설정
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      grade: initialData?.grade || undefined,
      course: initialData?.course || undefined,
      subject: initialData?.subject || undefined,
      instructor_id: initialData?.instructor_id || undefined,
      classroom_id: initialData?.classroom_id || undefined,
      max_students: initialData?.max_students || undefined,
      min_students: initialData?.min_students || undefined,
      color: initialData?.color || DEFAULT_COLOR_OPTIONS[0],
      start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
      end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
      main_textbook: (initialData as any)?.main_textbook || '',
      supplementary_textbook: (initialData as any)?.supplementary_textbook || '',
      is_active: initialData?.is_active !== null ? (initialData?.is_active || true) : true
    },
    mode: 'onChange'
  })

  const { handleSubmit, watch, setValue, formState: { errors, isValid, isDirty } } = form

  // 현재 선택된 색상 감시
  const selectedColor = watch('color')

  // 초기 데이터 변경 시 폼 업데이트
  useEffect(() => {
    if (initialData && mode === 'edit') {
      Object.entries(initialData).forEach(([key, value]) => {
        if (key === 'start_date' || key === 'end_date') {
          if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
            (form.setValue as any)(key, value ? new Date(value).toISOString().split('T')[0] : '')
          } else {
            (form.setValue as any)(key, '')
          }
        } else if (value !== undefined) {
          (form.setValue as any)(key, value)
        }
      })
    }
  }, [initialData, mode, form.setValue])

  // 강사 옵션 (placeholder 옵션 제거)
  const instructorSelectOptions = useMemo(() => {
    console.log('📋 ClassForm - 강사 옵션 업데이트:', instructors)
    return instructors || []
  }, [instructors])

  // 과목 옵션 (placeholder 옵션 제거)
  const finalSubjectOptions = useMemo(() => {
    return subjectOptions.length > 0 ? subjectOptions : DEFAULT_SUBJECT_OPTIONS
  }, [subjectOptions])

  // 과정 옵션 (placeholder 옵션 제거)
  const finalCourseOptions = useMemo(() => {
    return courseOptions.length > 0 ? courseOptions : DEFAULT_COURSE_OPTIONS
  }, [courseOptions])

  // 제출 핸들러
  const handleFormSubmit = async (data: ClassFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('클래스 폼 제출 오류:', error)
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className={cn('space-y-6', className)}
        noValidate
      >
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 클래스 이름 */}
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>클래스 이름</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="클래스 이름을 입력하세요"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 학년 */}
        <div>
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>학년</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="학년을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 과정 */}
        <div>
          <FormField
            control={form.control}
            name="course"
            render={({ field }) => (
              <FormItem>
                <FormLabel>과정</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="과정을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {finalCourseOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 과목 */}
        <div>
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>과목</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="과목을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {finalSubjectOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 강사 */}
        <div>
          <FormField
            control={form.control}
            name="instructor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>담당 강사</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="강사를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructorSelectOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 용량 설정 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            control={form.control}
            name="min_students"
            render={({ field }) => (
              <FormItem>
                <FormLabel>최소 학생 수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="최소 학생 수"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="max_students"
            render={({ field }) => (
              <FormItem>
                <FormLabel>최대 학생 수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="최대 학생 수"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 색상 및 기간 설정 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 색상 선택 */}
        <div>
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>클래스 색상</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <Input
                        {...field}
                        type="color"
                        className="w-20 h-8 border-0 p-0 cursor-pointer"
                        disabled={disabled || loading}
                      />
                    </div>
                    {/* 프리셋 색상 */}
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            'w-6 h-6 rounded-full border-2 cursor-pointer transition-all',
                            selectedColor === color 
                              ? 'border-gray-900 scale-110' 
                              : 'border-gray-300 hover:border-gray-400'
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => (form.setValue as any)('color', color)}
                          disabled={disabled || loading}
                          aria-label={`색상 ${color} 선택`}
                        />
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 시작일 */}
        <div>
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시작일</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 종료일 */}
        <div>
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료일</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 교재 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 주교재 */}
        <div>
          <FormField
            control={form.control}
            name="main_textbook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주교재</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="주교재명을 입력하세요"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 부교재 */}
        <div>
          <FormField
            control={form.control}
            name="supplementary_textbook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>부교재</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="부교재명을 입력하세요"
                    disabled={disabled || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 설명 */}
      <div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="클래스에 대한 설명을 입력하세요"
                  disabled={disabled || loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 상태 설정 */}
      <div className="flex items-center space-x-3">
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={disabled || loading}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium text-gray-700">
                  클래스 활성화
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* 학생 관리 섹션 (수정 모드에서만 표시) */}
      {mode === 'edit' && initialData?.id && (
        <div className="pt-6 border-t">
          <ClassStudentManager
            classId={initialData.id}
            className={initialData.name || '클래스'}
            readOnly={disabled || loading}
          />
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={disabled || loading || !isValid}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {mode === 'create' ? '클래스 생성' : '클래스 수정'}
        </Button>
      </div>
      </form>
    </Form>
  )
})

ClassForm.displayName = 'ClassForm'

// ClassFormData is already exported above