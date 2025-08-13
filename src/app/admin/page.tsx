'use client'

import { useAuth } from '@/store/useAuthStore'
import { Button, Loading } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Vercel 환경에서만 상세 디버깅
  const isVercel = typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'production' && 
    window.location.hostname.includes('vercel.app')
  const requestId = Math.random().toString(36).substring(7)

  // 컴포넌트 로드 확인 (개발/디버깅용)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`🏠 [ADMIN-PAGE] ADMIN PAGE LOADED:`, {
      timestamp: new Date().toISOString(),
      hasUser: !!user,
      hasProfile: !!profile,
      currentPath: window.location.pathname
    })
  }

  // 페이지 진입 시 상태 로깅
  useEffect(() => {
    // 조건 없이 항상 로그 출력
    console.log(`🎯 [ADMIN-EFFECT] PAGE ENTRY EFFECT:`, {
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email,
      profileRole: profile?.role,
      profileStatus: profile?.status,
      profileTenantId: profile?.tenant_id,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server-side',
      timestamp: new Date().toISOString(),
      isVercel
    })
    
    if (isVercel) {
      console.log(`🎯 [VERCEL-ADMIN-${requestId}] PAGE ENTRY:`, {
        hasUser: !!user,
        hasProfile: !!profile,
        userEmail: user?.email,
        profileRole: profile?.role,
        profileStatus: profile?.status,
        profileTenantId: profile?.tenant_id,
        currentPath: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    }
  }, [user, profile, isVercel, requestId])

  // 역할별 단방향 리다이렉트 (순환 참조 완전 제거)
  useEffect(() => {
    console.log(`🔄 [REDIRECT-LOGIC] STARTING SINGLE-DIRECTION REDIRECT:`, {
      hasProfile: !!profile,
      profileRole: profile?.role,
      profileEmail: profile?.email,
      profileStatus: profile?.status,
      tenantId: profile?.tenant_id,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server',
      timestamp: new Date().toISOString()
    })
    
    if (!profile) {
      console.log(`❌ [REDIRECT-LOGIC] NO PROFILE - WAITING FOR PROFILE`)
      return
    }

    console.log(`✅ [REDIRECT-LOGIC] PROFILE EXISTS - APPLYING FORWARD-ONLY REDIRECT`)
    setIsRedirecting(true)

    // 🎯 단방향 리다이렉트 규칙: admin은 모든 역할의 "허브" 역할
    // 다른 페이지에서 admin으로 되돌아오지 않음 (순환 방지)
    
    // 1. 시스템 관리자 → system-admin (단방향, 절대 되돌아오지 않음)
    if (profile.role === 'system_admin' || 
        ['admin@test.com', 'sjlee87@kakao.com'].includes(profile.email)) {
      
      const searchParams = new URLSearchParams(window.location.search)
      const forceStay = searchParams.get('stay') === 'true'
      
      if (forceStay) {
        console.log('👤 [REDIRECT-LOGIC] SYSTEM ADMIN FORCED TO STAY ON /admin')
        setIsRedirecting(false)
        return
      }
      
      console.log('🚀 [REDIRECT-LOGIC] SYSTEM ADMIN → /system-admin (FORWARD ONLY)')
      router.push('/system-admin')
      return
    }

    // 2. 테넌트 관리자 → tenant-admin (단방향)
    if (profile.role === 'admin' && profile.tenant_id) {
      console.log('🚀 [REDIRECT-LOGIC] TENANT ADMIN → /tenant-admin (FORWARD ONLY)')
      router.push('/tenant-admin')
      return
    }

    // 3. 일반 사용자(강사, 직원) → tenant-admin (단방향)
    if (profile.role && ['instructor', 'staff'].includes(profile.role) && profile.tenant_id) {
      console.log('🚀 [REDIRECT-LOGIC] STAFF/INSTRUCTOR → /tenant-admin (FORWARD ONLY)')
      router.push('/tenant-admin')
      return
    }

    // 4. 온보딩/승인 필요 사용자 → onboarding/pending-approval (단방향)
    if (!profile.tenant_id || profile.status === 'pending_approval') {
      console.log('🎯 [REDIRECT-LOGIC] ONBOARDING/APPROVAL NEEDED')
      
      // 승인 대기 상태 → pending-approval (단방향)
      if (profile.status === 'pending_approval') {
        console.log('🚀 [REDIRECT-LOGIC] PENDING APPROVAL → /pending-approval (FORWARD ONLY)')
        router.push('/pending-approval')
        return
      }

      // 테넌트 없음 → onboarding (단방향)
      if (!profile.tenant_id) {
        console.log('🚀 [REDIRECT-LOGIC] NO TENANT → /onboarding (FORWARD ONLY)')
        router.push('/onboarding')
        return
      }
    }

    // 5. 기본 케이스: admin 페이지 유지 (리다이렉트 없음)
    console.log('✅ [REDIRECT-LOGIC] STAYING ON /admin - NO REDIRECT NEEDED:', {
      reason: 'Default case or viewer role',
      profileRole: profile.role,
      profileStatus: profile.status,
      tenantId: profile.tenant_id
    })
    
    setIsRedirecting(false)
  }, [profile, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // 리다이렉트 중이면 로딩 화면 표시
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loading />
          <p className="text-gray-600">적절한 관리자 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              EduCanvas 관리자 대시보드
            </h1>
            <Button onClick={handleSignOut} variant="ghost">
              로그아웃
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                사용자 정보
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <p><strong>이메일:</strong> {user?.email}</p>
                <p><strong>이름:</strong> {profile?.name || 'System Administrator'}</p>
                <p><strong>역할:</strong> {profile?.role}</p>
                <p><strong>테넌트:</strong> {profile?.tenants?.name || (profile?.role === 'system_admin' ? 'System Admin (No Tenant)' : '없음')}</p>
                <p><strong>활성 상태:</strong> {profile?.status === 'active' ? '활성' : profile?.status || '비활성'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                인증 테스트 완료 ✅
              </h2>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✅ Supabase Auth 연동 완료</li>
                  <li>✅ 로그인/회원가입/비밀번호 재설정</li>
                  <li>✅ 인증 상태 전역 관리 (Zustand)</li>
                  <li>✅ AuthGuard 보호된 페이지 접근</li>
                  <li>✅ 미들웨어 인증 검증</li>
                </ul>
              </div>

              {/* 시스템 관리자를 위한 링크 */}
              {(profile?.role === 'system_admin' || 
                ['admin@test.com', 'sjlee87@kakao.com'].includes(profile?.email || '')) && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mt-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">
                    시스템 관리자 권한 감지됨
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    시스템 관리자 페이지에서 테넌트를 관리할 수 있습니다.
                  </p>
                  <Button
                    onClick={() => {
                      console.log('🔧 시스템 관리자 페이지로 수동 이동')
                      router.push('/system-admin')
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    시스템 관리자 페이지로 이동
                  </Button>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p>
                  T-007 Supabase Auth 인증 시스템 구현이 성공적으로 완료되었습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}