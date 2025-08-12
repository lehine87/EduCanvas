'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'
import { TenantSearchModal } from './TenantSearchModal'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/types/app.types'
import type { User } from '@supabase/supabase-js'

const onboardingSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요'),
  position: z.enum(['instructor', 'staff', 'admin'], {
    required_error: '직책을 선택해주세요',
  }),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  emergency_contact: z.string().optional(),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface UserProfile {
  id?: string
  name?: string
  phone?: string
  email?: string
}

interface OnboardingFormProps {
  user: {
    auth: User
    profile: UserProfile
  }
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showTenantSearch, setShowTenantSearch] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user.profile.name || '',
      phone: user.profile.phone || '',
    },
    mode: 'onChange'
  })

  const position = watch('position')

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
      setError('소속 학원을 선택해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 온보딩 데이터 제출:', { ...data, tenant: selectedTenant })

      // 현재 사용자 확인
      const supabase = createClient()
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('❌ 사용자 세션 확인 실패:', userError?.message)
        setError('로그인 세션이 만료되었습니다. 다시 로그인해주세요.')
        return
      }

      console.log('🔄 온보딩 API 호출 시작:', {
        userId: currentUser.id,
        tenant: selectedTenant.name,
        position: data.position
      })

      // 현재 세션의 access_token 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        console.error('❌ 세션 토큰 가져오기 실패:', sessionError?.message)
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }

      console.log('🔑 토큰 확인 완료, API 호출 시작')

      // 온보딩 API 호출 (Authorization 헤더 방식)
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...data,
          tenant_id: selectedTenant.id,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 온보딩 API 오류:', result.error)
        setError(result.error || '온보딩 처리 중 오류가 발생했습니다.')
        return
      }

      console.log('✅ 온보딩 완료:', result.message)
      
      // 성공 시 승인 대기 페이지로 이동
      router.push('/pending-approval')

    } catch (error) {
      console.error('온보딩 실패:', error)
      setError('온보딩 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
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
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Step 1: 기본 정보 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Input
                  label="이름"
                  type="text"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="홍길동"
                  disabled={isLoading}
                  required
                />

                <Input
                  label="전화번호"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="010-1234-5678"
                  disabled={isLoading}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    직책 *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="instructor"
                        {...register('position')}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span>강사</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="staff"
                        {...register('position')}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span>스태프</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="admin"
                        {...register('position')}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span>관리자</span>
                    </label>
                  </div>
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                  )}
                </div>

                {position === 'instructor' && (
                  <Input
                    label="전문분야"
                    type="text"
                    {...register('specialization')}
                    error={errors.specialization?.message}
                    placeholder="영어회화, 수학, 과학 등"
                    disabled={isLoading}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자기소개
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="간단한 자기소개를 작성해주세요"
                    disabled={isLoading}
                  />
                </div>

                <Input
                  label="비상연락처"
                  type="tel"
                  {...register('emergency_contact')}
                  error={errors.emergency_contact?.message}
                  placeholder="가족 연락처 등"
                  disabled={isLoading}
                />

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full"
                  disabled={!isValid || isLoading}
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
                    disabled={isLoading}
                  >
                    이전
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!selectedTenant || isLoading}
                    loading={isLoading}
                  >
                    가입 신청 완료
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      {/* 학원 검색 모달 */}
      <TenantSearchModal
        isOpen={showTenantSearch}
        onClose={() => setShowTenantSearch(false)}
        onSelect={(tenant) => {
          setSelectedTenant(tenant)
          setShowTenantSearch(false)
          setError(null)
        }}
      />
    </>
  )
}