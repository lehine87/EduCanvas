'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Badge,
  Separator
} from '@/components/ui'
import { 
  X, 
  Edit, 
  Save, 
  AlertCircle, 
  Eye,
  Calendar,
  DollarSign,
  Users,
  Tag,
  Star,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/store/useAuthStore'
import type { 
  CoursePackageWithRelations,
  CoursePackageFormData, 
  BillingType 
} from '@/types/course.types'
import { 
  BILLING_TYPE_CONFIGS, 
  getBillingPeriodText,
  calculateDiscountPercentage,
  validateCoursePackage 
} from '@/types/course.types'

// Form validation schema
const updateCoursePackageSchema = z.object({
  name: z.string().min(1, '과정명은 필수입니다'),
  description: z.string().optional(),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  original_price: z.number().optional(),
  billing_type: z.enum(['monthly', 'sessions', 'hours', 'package', 'drop_in']),
  currency: z.string(),
  class_id: z.string().optional(),
  
  // 기간/횟수 관련 - 조건부 필수
  months: z.number().optional(),
  sessions: z.number().optional(),
  hours: z.number().optional(),
  validity_days: z.number().optional(),
  
  // 접근 제어
  max_enrollments: z.number().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  available_from: z.string().optional(),
  available_until: z.string().optional(),
  
  // 추가 기능
  download_allowed: z.boolean(),
  offline_access: z.boolean(),
  video_access_days: z.number().optional(),
  display_order: z.number()
})

type UpdateCoursePackageFormData = z.infer<typeof updateCoursePackageSchema>

interface CoursePackageDetailSheetProps {
  coursePackage: CoursePackageWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (coursePackage: CoursePackageWithRelations) => void
  onDelete?: (coursePackage: CoursePackageWithRelations) => void
}

export const CoursePackageDetailSheet: React.FC<CoursePackageDetailSheetProps> = ({
  coursePackage,
  open,
  onOpenChange,
  onUpdate,
  onDelete
}) => {
  const { profile } = useAuth()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form setup
  const form = useForm<UpdateCoursePackageFormData>({
    resolver: zodResolver(updateCoursePackageSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      original_price: 0,
      billing_type: 'monthly' as const,
      currency: 'KRW',
      class_id: '',
      months: 0,
      sessions: 0,
      hours: 0,
      validity_days: 0,
      max_enrollments: 0,
      is_active: true,
      is_featured: false,
      available_from: '',
      available_until: '',
      download_allowed: false,
      offline_access: false,
      video_access_days: 0,
      display_order: 0
    }
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form
  const selectedBillingType = watch('billing_type')
  const originalPrice = watch('original_price')
  const currentPrice = watch('price')

  // 과정 데이터로 폼 초기화
  useEffect(() => {
    if (coursePackage && open) {
      reset({
        name: coursePackage.name || '',
        description: coursePackage.description || '',
        price: coursePackage.price || 0,
        original_price: coursePackage.original_price || undefined,
        billing_type: coursePackage.billing_type as BillingType || 'monthly',
        currency: coursePackage.currency || 'KRW',
        class_id: coursePackage.class_id || undefined,
        months: coursePackage.months || undefined,
        sessions: coursePackage.sessions || undefined,
        hours: coursePackage.hours || undefined,
        validity_days: coursePackage.validity_days || undefined,
        max_enrollments: coursePackage.max_enrollments || undefined,
        is_active: coursePackage.is_active ?? true,
        is_featured: coursePackage.is_featured ?? false,
        available_from: coursePackage.available_from || undefined,
        available_until: coursePackage.available_until || undefined,
        download_allowed: coursePackage.download_allowed ?? false,
        offline_access: coursePackage.offline_access ?? false,
        video_access_days: coursePackage.video_access_days || undefined,
        display_order: coursePackage.display_order || 0
      })
      setMode('view')
      setSubmitError(null)
    }
  }, [coursePackage, open, reset])

  // 결제 타입별 필수/선택 필드 표시 여부
  const billingConfig = useMemo(() => 
    BILLING_TYPE_CONFIGS[selectedBillingType as BillingType], 
    [selectedBillingType]
  )

  // 할인율 계산
  const discountPercentage = useMemo(() => {
    if (originalPrice && originalPrice > currentPrice) {
      return calculateDiscountPercentage(originalPrice, currentPrice)
    }
    return 0
  }, [originalPrice, currentPrice])

  // 기간 텍스트 계산
  const periodText = useMemo(() => {
    if (!coursePackage) return ''
    return getBillingPeriodText(coursePackage)
  }, [coursePackage])

  // 폼 제출 핸들러
  const onSubmit = useCallback(async (data: UpdateCoursePackageFormData) => {
    if (!coursePackage || !profile?.tenant_id) {
      setSubmitError('사용자 정보를 확인할 수 없습니다.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      // 클라이언트 측 유효성 검사
      const validationErrors = validateCoursePackage(data as CoursePackageFormData)
      if (validationErrors.length > 0) {
        setSubmitError(validationErrors.join(', '))
        return
      }

      console.log('🎯 과정 수정 데이터:', { id: coursePackage.id, ...data })

      // 실제 API 호출
      const response = await fetch(`/api/course-packages/${coursePackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tenantId: profile.tenant_id
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || '과정 수정에 실패했습니다.')
      }

      console.log('✅ 과정 수정 성공:', result.data)
      onUpdate?.(result.data)
      setMode('view')
      
    } catch (error) {
      console.error('❌ 과정 수정 오류:', error)
      setSubmitError(error instanceof Error ? error.message : '과정 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }, [coursePackage, profile?.tenant_id, onUpdate])

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!coursePackage || !profile?.tenant_id) return

    if (!confirm(`'${coursePackage.name}' 과정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      setIsDeleting(true)
      
      console.log('🗑️ 과정 삭제:', coursePackage.id)

      // 실제 API 호출 - 소프트 삭제 (비활성화)
      const response = await fetch(`/api/course-packages/${coursePackage.id}?tenantId=${profile.tenant_id}&forceDelete=false`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || '과정 삭제에 실패했습니다.')
      }

      console.log('✅ 과정 삭제 성공:', result.data)
      onDelete?.(coursePackage)
      onOpenChange(false)
      
    } catch (error) {
      console.error('❌ 과정 삭제 오류:', error)
      alert(error instanceof Error ? error.message : '과정 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }, [coursePackage, profile?.tenant_id, onDelete, onOpenChange])

  // 시트 닫기 핸들러
  const handleClose = useCallback(() => {
    if (!isSubmitting && !isDeleting) {
      setMode('view')
      setSubmitError(null)
      onOpenChange(false)
    }
  }, [isSubmitting, isDeleting, onOpenChange])

  // 수정 모드 전환
  const handleEditMode = useCallback(() => {
    setMode('edit')
    setSubmitError(null)
  }, [])

  // 수정 취소
  const handleCancelEdit = useCallback(() => {
    setMode('view')
    setSubmitError(null)
    if (coursePackage) {
      reset({
        name: coursePackage.name || '',
        description: coursePackage.description || '',
        price: coursePackage.price || 0,
        original_price: coursePackage.original_price || undefined,
        billing_type: coursePackage.billing_type as BillingType || 'monthly',
        currency: coursePackage.currency || 'KRW',
        class_id: coursePackage.class_id || undefined,
        months: coursePackage.months || undefined,
        sessions: coursePackage.sessions || undefined,
        hours: coursePackage.hours || undefined,
        validity_days: coursePackage.validity_days || undefined,
        max_enrollments: coursePackage.max_enrollments || undefined,
        is_active: coursePackage.is_active ?? true,
        is_featured: coursePackage.is_featured ?? false,
        available_from: coursePackage.available_from || undefined,
        available_until: coursePackage.available_until || undefined,
        download_allowed: coursePackage.download_allowed ?? false,
        offline_access: coursePackage.offline_access ?? false,
        video_access_days: coursePackage.video_access_days || undefined,
        display_order: coursePackage.display_order || 0
      })
    }
  }, [coursePackage, reset])

  if (!coursePackage) return null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8 overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-xl font-semibold truncate">
                  {mode === 'edit' ? '과정 수정' : coursePackage.name}
                </SheetTitle>
                
                {/* 상태 배지들 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant="default"
                    className={coursePackage.is_active 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {coursePackage.is_active ? '활성' : '비활성'}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`bg-${BILLING_TYPE_CONFIGS[coursePackage.billing_type as BillingType].color}-100 text-${BILLING_TYPE_CONFIGS[coursePackage.billing_type as BillingType].color}-700`}
                  >
                    {BILLING_TYPE_CONFIGS[coursePackage.billing_type as BillingType].icon} {BILLING_TYPE_CONFIGS[coursePackage.billing_type as BillingType].label}
                  </Badge>
                  
                  {coursePackage.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Star className="w-3 h-3 mr-1" />
                      추천
                    </Badge>
                  )}
                </div>
              </div>
              
              {mode === 'view' && (
                <SheetDescription className="text-sm text-gray-500 mt-1">
                  {coursePackage.description || '과정 설명이 없습니다'}
                </SheetDescription>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting || isDeleting}
              className="h-8 w-8 p-0 flex-shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {mode === 'view' ? (
          // 보기 모드
          <div className="space-y-6">
            {/* 가격 정보 */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                가격 정보
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {coursePackage.price.toLocaleString()}
                    <span className="text-sm text-gray-500 font-normal ml-1">
                      {coursePackage.currency || 'KRW'}
                    </span>
                  </div>
                  
                  {coursePackage.original_price && coursePackage.original_price > coursePackage.price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        {coursePackage.original_price.toLocaleString()}
                      </span>
                      <Badge className="bg-red-100 text-red-700">
                        -{calculateDiscountPercentage(coursePackage.original_price, coursePackage.price)}% 할인
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  {periodText}
                </div>
              </div>
            </div>

            {/* 과정 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-400" />
                과정 정보
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {coursePackage.class && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">연결된 클래스</Label>
                    <div className="text-sm text-gray-900">
                      {coursePackage.class.name}
                    </div>
                  </div>
                )}
                
                {coursePackage.enrollment_count !== undefined && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">수강생 수</Label>
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {coursePackage.enrollment_count}명
                      {coursePackage.max_enrollments && (
                        <span className="text-gray-400">
                          / {coursePackage.max_enrollments}명
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 기간/횟수 정보 */}
              {(coursePackage.months || coursePackage.sessions || coursePackage.hours) && (
                <div className="grid grid-cols-3 gap-4">
                  {coursePackage.months && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-600">기간 (개월)</Label>
                      <div className="text-sm text-gray-900">{coursePackage.months}개월</div>
                    </div>
                  )}
                  
                  {coursePackage.sessions && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-600">수업 횟수</Label>
                      <div className="text-sm text-gray-900">{coursePackage.sessions}회</div>
                    </div>
                  )}
                  
                  {coursePackage.hours && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-600">수업 시간</Label>
                      <div className="text-sm text-gray-900">{coursePackage.hours}시간</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 추가 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">추가 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={coursePackage.download_allowed ?? false} disabled />
                  <Label className="text-sm">다운로드 허용</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox checked={coursePackage.offline_access ?? false} disabled />
                  <Label className="text-sm">오프라인 접근</Label>
                </div>
              </div>

              {coursePackage.validity_days && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">유효기간</Label>
                  <div className="text-sm text-gray-900">{coursePackage.validity_days}일</div>
                </div>
              )}
              
              {coursePackage.video_access_days && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">영상 접근 기간</Label>
                  <div className="text-sm text-gray-900">{coursePackage.video_access_days}일</div>
                </div>
              )}
            </div>

            {/* 생성 정보 */}
            {coursePackage.created_at && (
              <div className="space-y-2">
                <Separator />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>생성일: {new Date(coursePackage.created_at).toLocaleString('ko-KR')}</span>
                  {coursePackage.updated_at && (
                    <span>수정일: {new Date(coursePackage.updated_at).toLocaleString('ko-KR')}</span>
                  )}
                </div>
              </div>
            )}

            {/* 보기 모드 액션 버튼 */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-error-600 hover:text-error-700"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-error-600 border-t-transparent rounded-full animate-spin" />
                    삭제 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </div>
                )}
              </Button>
              
              <Button onClick={handleEditMode}>
                <Edit className="w-4 h-4 mr-2" />
                수정
              </Button>
            </div>
          </div>
        ) : (
          // 수정 모드 - 폼
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">기본 정보</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* 과정명 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  과정명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="예: 고등부 수학 심화과정"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* 과정 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  과정 설명
                </Label>
                <Textarea
                  id="description"
                  placeholder="과정에 대한 상세한 설명을 입력하세요"
                  className="min-h-[80px]"
                  {...register('description')}
                />
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">결제 정보</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 결제 타입 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    결제 타입 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedBillingType}
                    onValueChange={(value) => setValue('billing_type', value as BillingType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BILLING_TYPE_CONFIGS).map(([key, config]) => {
                        if (!key || key.trim() === '') return null
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{config.icon}</span>
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* 통화 */}
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    통화
                  </Label>
                  <Select
                    value={watch('currency')}
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KRW">KRW (원)</SelectItem>
                      <SelectItem value="USD">USD (달러)</SelectItem>
                      <SelectItem value="EUR">EUR (유로)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 가격 */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    판매가격 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                  )}
                </div>

                {/* 정가 */}
                <div className="space-y-2">
                  <Label htmlFor="original_price" className="text-sm font-medium">
                    정가 (할인 표시용)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="original_price"
                      type="number"
                      min="0"
                      placeholder="정가 입력 (선택)"
                      {...register('original_price', { valueAsNumber: true })}
                    />
                    {discountPercentage > 0 && (
                      <Badge className="bg-red-100 text-red-700 whitespace-nowrap">
                        -{discountPercentage}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 타입별 기간/횟수 설정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">기간/횟수 설정</h3>
                <Badge variant="outline" className={`bg-${billingConfig.color}-100 text-${billingConfig.color}-700`}>
                  {billingConfig.icon} {billingConfig.label}
                </Badge>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 월 기간 */}
                {(billingConfig.requiredFields.includes('months') || billingConfig.optionalFields.includes('months')) && (
                  <div className="space-y-2">
                    <Label htmlFor="months" className="text-sm font-medium">
                      개월 수 {billingConfig.requiredFields.includes('months') && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="months"
                      type="number"
                      min="1"
                      placeholder="예: 3"
                      {...register('months', { valueAsNumber: true })}
                    />
                  </div>
                )}

                {/* 세션 횟수 */}
                {(billingConfig.requiredFields.includes('sessions') || billingConfig.optionalFields.includes('sessions')) && (
                  <div className="space-y-2">
                    <Label htmlFor="sessions" className="text-sm font-medium">
                      수업 횟수 {billingConfig.requiredFields.includes('sessions') && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="sessions"
                      type="number"
                      min="1"
                      placeholder="예: 12"
                      {...register('sessions', { valueAsNumber: true })}
                    />
                  </div>
                )}

                {/* 시간 수 */}
                {(billingConfig.requiredFields.includes('hours') || billingConfig.optionalFields.includes('hours')) && (
                  <div className="space-y-2">
                    <Label htmlFor="hours" className="text-sm font-medium">
                      수업 시간 {billingConfig.requiredFields.includes('hours') && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      placeholder="예: 40"
                      {...register('hours', { valueAsNumber: true })}
                    />
                  </div>
                )}

                {/* 유효기간 */}
                {billingConfig.optionalFields.includes('validity_days') && (
                  <div className="space-y-2">
                    <Label htmlFor="validity_days" className="text-sm font-medium">
                      유효기간 (일)
                    </Label>
                    <Input
                      id="validity_days"
                      type="number"
                      min="1"
                      placeholder="예: 90"
                      {...register('validity_days', { valueAsNumber: true })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 추가 설정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">추가 설정</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 최대 수강생 수 */}
                <div className="space-y-2">
                  <Label htmlFor="max_enrollments" className="text-sm font-medium">
                    최대 수강생 수
                  </Label>
                  <Input
                    id="max_enrollments"
                    type="number"
                    min="1"
                    placeholder="제한 없음"
                    {...register('max_enrollments', { valueAsNumber: true })}
                  />
                </div>

                {/* 영상 접근 기간 */}
                <div className="space-y-2">
                  <Label htmlFor="video_access_days" className="text-sm font-medium">
                    영상 접근 기간 (일)
                  </Label>
                  <Input
                    id="video_access_days"
                    type="number"
                    min="1"
                    placeholder="제한 없음"
                    {...register('video_access_days', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* 체크박스 옵션들 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    활성 상태
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={watch('is_featured')}
                    onCheckedChange={(checked) => setValue('is_featured', Boolean(checked))}
                  />
                  <Label htmlFor="is_featured" className="text-sm font-medium">
                    추천 과정
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="download_allowed"
                    checked={watch('download_allowed')}
                    onCheckedChange={(checked) => setValue('download_allowed', Boolean(checked))}
                  />
                  <Label htmlFor="download_allowed" className="text-sm font-medium">
                    다운로드 허용
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="offline_access"
                    checked={watch('offline_access')}
                    onCheckedChange={(checked) => setValue('offline_access', Boolean(checked))}
                  />
                  <Label htmlFor="offline_access" className="text-sm font-medium">
                    오프라인 접근
                  </Label>
                </div>
              </div>
            </div>

            {/* 오류 메시지 */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            {/* 수정 모드 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    저장 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    변경사항 저장
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}