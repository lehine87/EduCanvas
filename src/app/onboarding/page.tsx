'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { Loading } from '@/components/ui'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Tenant } from '@/types/auth.types'
import { hasTenantId } from '@/types/auth.types'

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ auth: User; profile: UserProfile } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthStatus() {
      console.log('🔍 [ONBOARDING] 인증 상태 확인 시작')
      
      try {
        const currentUser = await authClient.getCurrentUser()
        console.log('🔍 [ONBOARDING] 현재 사용자:', { 
          hasUser: !!currentUser, 
          email: currentUser?.email 
        })
        
        if (!currentUser) {
          console.log('🔄 [ONBOARDING] 사용자 없음 → 로그인 페이지로 리다이렉트')
          setError('로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다...')
          setIsLoading(false)
          
          // 강제 리다이렉트 (여러 방법 시도)
          setTimeout(() => {
            console.log('🔄 [ONBOARDING] 강제 리다이렉트 실행')
            // Next.js router 우선 시도
            router.push('/auth/login')
            
            // 1초 후 window.location으로도 시도
            setTimeout(() => {
              window.location.href = '/auth/login'
            }, 1000)
          }, 1000)
          return
        }

        // 사용자 프로필 확인 (간단한 버전으로 테스트)
        console.log('🔍 [ONBOARDING] 사용자 프로필 조회 시작...')
        
        // 직접 Supabase 클라이언트로 프로필 조회 (authClient 우회)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
          
        console.log('🔍 [ONBOARDING] 직접 프로필 조회 결과:', { 
          hasProfile: !!profile, 
          error: profileError?.message,
          status: profile?.status,
          hasTenant: profile && hasTenantId(profile)
        })
        
        if (!profile) {
          console.error('❌ [ONBOARDING] 사용자 프로필을 찾을 수 없습니다.')
          router.push('/auth/login')
          return
        }

        // 이미 온보딩을 완료한 경우 (테넌트가 설정되어 있으면)
        if (hasTenantId(profile)) {
          console.log('✅ [ONBOARDING] 온보딩 이미 완료됨:', profile.status)
          if (profile.status === 'pending_approval') {
            router.push('/pending-approval')
          } else if (profile.status === 'active') {
            router.push('/admin')
          }
          return
        }

        // 승인 대기 상태이면서 테넌트가 없는 경우 (온보딩 진행)
        if (profile.status === 'pending_approval' && !hasTenantId(profile)) {
          console.log('🎯 [ONBOARDING] 온보딩 진행 필요: 승인 대기 상태이지만 테넌트 미설정')
        }

        console.log('✅ [ONBOARDING] 온보딩 페이지 표시 준비 완료')
        setUser({ auth: currentUser, profile })
        setIsLoading(false)

      } catch (error) {
        console.error('❌ [ONBOARDING] 인증 상태 확인 실패:', error)
        setError(`인증 확인 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsLoading(false)
        // router.push('/auth/login') // 임시 주석 처리하여 에러 메시지 확인
      }
    }

    checkAuthStatus()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading text="인증 상태 확인 중..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('🔄 [ONBOARDING] 수동 리다이렉트 버튼 클릭')
                router.push('/auth/login')
                // 백업 리다이렉트
                setTimeout(() => {
                  window.location.href = '/auth/login'
                }, 500)
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              로그인 페이지로 이동
            </button>
            <button
              onClick={() => {
                console.log('🔄 [ONBOARDING] 강제 새로고침')
                window.location.reload()
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            EduCanvas에 오신 것을 환영합니다! 🎉
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            프로필 설정을 완료하여 학원에 합류하세요
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-medium text-gray-900">
            <span className="text-blue-600">1. 기본 정보</span>
            <span className="text-gray-500">2. 학원 연결</span>
            <span className="text-gray-500">3. 승인 대기</span>
          </div>
          <div className="mt-2 flex">
            <div className="flex-1 bg-blue-600 rounded-l-full h-2"></div>
            <div className="flex-1 bg-gray-200 h-2"></div>
            <div className="flex-1 bg-gray-200 rounded-r-full h-2"></div>
          </div>
        </div>

        {/* 온보딩 폼 */}
        {user && <OnboardingForm user={user} />}

        {/* 도움말 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>문제가 있으신가요? <a href="mailto:support@educanvas.com" className="text-blue-600 hover:text-blue-500">고객지원</a>으로 문의해주세요.</p>
        </div>
      </div>
    </div>
  )
}