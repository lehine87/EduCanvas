'use client'

import React, { useState, useCallback, useMemo } from 'react'
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
  Badge
} from '@/components/ui'
import { X, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '@/store/useAuthStore'
import type { 
  CoursePackageFormData, 
  BillingType,
  CoursePackageWithRelations 
} from '@/types/course.types'
import { 
  BILLING_TYPE_CONFIGS, 
  validateCoursePackage 
} from '@/types/course.types'

// Form validation schema
const createCoursePackageSchema = z.object({
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

type CreateCoursePackageFormData = z.infer<typeof createCoursePackageSchema>

interface CreateCoursePackageSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (coursePackage: CoursePackageWithRelations) => void
}

export const CreateCoursePackageSheet: React.FC<CreateCoursePackageSheetProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form setup
  const form = useForm<CreateCoursePackageFormData>({
    resolver: zodResolver(createCoursePackageSchema),
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

  // 결제 타입별 필수/선택 필드 표시 여부
  const billingConfig = useMemo(() => 
    BILLING_TYPE_CONFIGS[selectedBillingType as BillingType], 
    [selectedBillingType]
  )

  // 할인율 계산
  const discountPercentage = useMemo(() => {
    if (originalPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    }
    return 0
  }, [originalPrice, currentPrice])

  // 폼 제출 핸들러
  const onSubmit = useCallback(async (data: CreateCoursePackageFormData) => {
    if (!profile?.tenant_id) {
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

      console.log('🎯 과정 생성 데이터:', data)

      // 실제 API 호출
      const response = await fetch('/api/course-packages', {
        method: 'POST',
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
        throw new Error(result.error || result.message || '과정 등록에 실패했습니다.')
      }

      console.log('✅ 과정 생성 성공:', result.data)
      onSuccess?.(result.data)
      onOpenChange(false)
      reset()
      
    } catch (error) {
      console.error('❌ 과정 생성 오류:', error)
      setSubmitError(error instanceof Error ? error.message : '과정 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }, [profile?.tenant_id, onSuccess, onOpenChange, reset])

  // 시트 닫기 핸들러
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onOpenChange(false)
      reset()
      setSubmitError(null)
    }
  }, [isSubmitting, onOpenChange, reset])

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8 overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold">
                새 과정 등록
              </SheetTitle>
              <SheetDescription className="text-sm text-gray-500 mt-1">
                새로운 과정 패키지를 등록합니다
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

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
                    {Object.entries(BILLING_TYPE_CONFIGS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {billingConfig.description}
                </p>
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

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
                  생성 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  과정 등록
                </div>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}