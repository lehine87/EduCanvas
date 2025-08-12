'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { Loading } from '@/components/ui'
import type { User } from '@supabase/supabase-js'
import type { UserProfileV41 } from '@/types'

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ auth: User; profile: UserProfileV41 } | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const currentUser = await authClient.getCurrentUser()
        
        if (!currentUser) {
          // 로그인되지 않은 경우 로그인 페이지로
          router.push('/auth/login')
          return
        }

        // 사용자 프로필 확인
        const profile = await authClient.getUserProfile()
        
        if (!profile) {
          console.error('사용자 프로필을 찾을 수 없습니다.')
          router.push('/auth/login')
          return
        }

        // 이미 온보딩을 완료한 경우 (테넌트가 설정되어 있으면)
        if (profile.tenant_id) {
          if (profile.status === 'pending_approval') {
            router.push('/pending-approval')
          } else if (profile.status === 'active') {
            router.push('/admin')
          }
          return
        }

        // 승인 대기 상태이면서 테넌트가 없는 경우 (온보딩 진행)
        if (profile.status === 'pending_approval' && !profile.tenant_id) {
          console.log('🎯 온보딩 진행 필요: 승인 대기 상태이지만 테넌트 미설정')
        }

        setUser({ auth: currentUser, profile })
        setIsLoading(false)

      } catch (error) {
        console.error('인증 상태 확인 실패:', error)
        router.push('/auth/login')
      }
    }

    checkAuthStatus()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
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
        <OnboardingForm user={user} />

        {/* 도움말 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>문제가 있으신가요? <a href="mailto:support@educanvas.com" className="text-blue-600 hover:text-blue-500">고객지원</a>으로 문의해주세요.</p>
        </div>
      </div>
    </div>
  )
}