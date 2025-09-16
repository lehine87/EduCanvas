'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import { TenantSearchModal } from './TenantSearchModal'
import { useOnboarding } from '@/hooks/useAuth'
import type { Tenant } from '@/lib/api-client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth.types'

const onboardingSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요'),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  emergency_contact: z.string().optional(),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface OnboardingFormProps {
  user: {
    auth: User
    profile: UserProfile
  }
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showTenantSearch, setShowTenantSearch] = useState(false)
  const router = useRouter()

  // API Client 패턴 사용
  const onboardingMutation = useOnboarding()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user.profile.name || '',
      phone: user.profile.phone ?? '',
    },
    mode: 'onChange'
  })


  const handleNextStep = () => {
    if (currentStep === 1 && isValid) {
      setCurrentStep(2)
      // 진행 단계 UI 업데이트
      updateProgressBar(2)
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
      updateProgressBar(1)
    }
  }

  const updateProgressBar = (step: number) => {
    const steps = document.querySelectorAll('.step-indicator')
    const bars = document.querySelectorAll('.progress-bar')
    
    steps.forEach((stepEl, index) => {
      if (index < step) {
        stepEl.classList.remove('text-gray-500')
        stepEl.classList.add('text-blue-600')
      } else {
        stepEl.classList.remove('text-blue-600')
        stepEl.classList.add('text-gray-500')
      }
    })
    
    bars.forEach((bar, index) => {
      if (index < step - 1) {
        bar.classList.remove('bg-gray-200')
        bar.classList.add('bg-blue-600')
      } else {
        bar.classList.remove('bg-blue-600')
        bar.classList.add('bg-gray-200')
      }
    })
  }

  const onSubmit = async (data: OnboardingFormData) => {
    if (!selectedTenant) {
      // 개별 에러 상태 설정은 useOnboarding에서 토스트로 처리됨
      return
    }

    try {
      const onboardingData = {
        ...data,
        tenant_id: selectedTenant.id,
      }

      console.log('🚀 온보딩 데이터 제출:', { ...data, tenant: selectedTenant.name })

      // API Client 패턴으로 온보딩 호출
      await onboardingMutation.mutateAsync(onboardingData)

      console.log('✅ 온보딩 완료 - 승인 대기 페이지로 이동')

      // 성공 시 승인 대기 페이지로 이동
      router.push('/pending-approval')

    } catch (error) {
      console.error('온보딩 실패:', error)
      // 에러 처리는 useOnboarding 훅에서 토스트로 처리됨
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 ? '기본 정보를 입력해주세요' : '소속 학원을 찾아주세요'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!selectedTenant && currentStep === 2 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                소속 학원을 선택해주세요.
              </div>
            )}

            {/* Step 1: 기본 정보 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <Input
                    type="text"
                    {...register('name')}
                    // error will be shown below
                    placeholder="홍길동"
                    disabled={onboardingMutation.isPending}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <Input
                    type="tel"
                    {...register('phone')}
                    // error will be shown below
                    placeholder="010-1234-5678"
                    disabled={onboardingMutation.isPending}
                    required
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전문분야 (선택사항)</label>
                  <Input
                    type="text"
                    {...register('specialization')}
                    placeholder="영어회화, 수학, 과학 등 (해당되는 경우에만)"
                    disabled={onboardingMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자기소개
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="간단한 자기소개를 작성해주세요"
                    disabled={onboardingMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비상연락처</label>
                  <Input
                    type="tel"
                    {...register('emergency_contact')}
                    // error will be shown below
                    placeholder="가족 연락처 등"
                    disabled={onboardingMutation.isPending}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full"
                  disabled={!isValid || onboardingMutation.isPending}
                >
                  다음 단계
                </Button>
              </div>
            )}

            {/* Step 2: 학원 연결 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  {selectedTenant ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800">
                        {selectedTenant.name}
                      </h3>
                      <p className="text-green-600">
                        고객번호: {selectedTenant.tenant_code}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTenantSearch(true)}
                        className="mt-2"
                      >
                        다른 학원 찾기
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          소속 학원을 찾아주세요
                        </h3>
                        <p className="text-gray-600">
                          학원에서 제공받은 고객번호나 정확한 학원명으로 검색하세요
                        </p>
                      </div>
                      
                      <Button
                        type="button"
                        onClick={() => setShowTenantSearch(true)}
                        className="w-full"
                      >
                        🔍 학원 찾기
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1"
                    disabled={onboardingMutation.isPending}
                  >
                    이전
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!selectedTenant || onboardingMutation.isPending}
                  >
                    {onboardingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    가입 신청 완료
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 학원 검색 모달 */}
      <TenantSearchModal
        isOpen={showTenantSearch}
        onClose={() => setShowTenantSearch(false)}
        onSelect={(tenant) => {
          setSelectedTenant(tenant)
          setShowTenantSearch(false)
        }}
      />
    </>
  )
}