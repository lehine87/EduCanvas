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

  // 페이지 진입 시 상태 로깅
  useEffect(() => {
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

  // 역할별 자동 리다이렉트
  useEffect(() => {
    if (!profile) return

    setIsRedirecting(true)

    // 시스템 관리자인 경우
    if (profile.role === 'system_admin' || 
        ['admin@test.com', 'sjlee87@kakao.com'].includes(profile.email)) {
      console.log('🔧 시스템 관리자로 인식, system-admin 페이지로 리다이렉트')
      
      if (isVercel) {
        console.log(`🔄 [VERCEL-ADMIN-${requestId}] SYSTEM ADMIN REDIRECT:`, {
          from: '/admin',
          to: '/system-admin',
          profileRole: profile.role,
          userEmail: profile.email
        })
      }
      
      router.push('/system-admin')
      return
    }

    // 테넌트 관리자인 경우
    if (profile.role === 'admin' && profile.tenant_id) {
      console.log('🏢 테넌트 관리자로 인식, tenant-admin 페이지로 리다이렉트')
      
      if (isVercel) {
        console.log(`🔄 [VERCEL-ADMIN-${requestId}] TENANT ADMIN REDIRECT:`, {
          from: '/admin',
          to: '/tenant-admin',
          profileRole: profile.role,
          tenantId: profile.tenant_id
        })
      }
      
      router.push('/tenant-admin')
      return
    }

    // 일반 사용자(강사, 직원)인 경우
    if (profile.role && ['instructor', 'staff'].includes(profile.role) && profile.tenant_id) {
      console.log('👨‍🏫 일반 사용자로 인식, tenant-admin 페이지로 리다이렉트')
      
      if (isVercel) {
        console.log(`🔄 [VERCEL-ADMIN-${requestId}] USER REDIRECT:`, {
          from: '/admin',
          to: '/tenant-admin',
          profileRole: profile.role,
          tenantId: profile.tenant_id
        })
      }
      
      router.push('/tenant-admin')
      return
    }

    // 온보딩이 필요한 사용자 체크
    if (!profile.tenant_id || profile.status === 'pending_approval') {
      console.log('🎯 온보딩 필요한 사용자 감지:', {
        hasTenant: !!profile.tenant_id,
        status: profile.status,
        role: profile.role
      })

      // 승인 대기 상태인 경우
      if (profile.status === 'pending_approval') {
        console.log('⏳ 승인 대기 중인 사용자, pending-approval 페이지로 리다이렉트')
        
        if (isVercel) {
          console.log(`🔄 [VERCEL-ADMIN-${requestId}] PENDING APPROVAL REDIRECT:`, {
            from: '/admin',
            to: '/pending-approval',
            profileStatus: profile.status
          })
        }
        
        router.push('/pending-approval')
        return
      }

      // 테넌트가 없는 경우 온보딩 페이지로
      if (!profile.tenant_id) {
        console.log('🆕 테넌트 미설정 사용자, onboarding 페이지로 리다이렉트')
        
        if (isVercel) {
          console.log(`🔄 [VERCEL-ADMIN-${requestId}] ONBOARDING REDIRECT:`, {
            from: '/admin',
            to: '/onboarding',
            tenantId: profile.tenant_id
          })
        }
        
        router.push('/onboarding')
        return
      }
    }

    // 권한이 명확하지 않은 경우 현재 페이지 유지
    console.log('❓ 권한 불명확, 현재 페이지 유지:', {
      role: profile.role,
      tenant_id: profile.tenant_id,
      status: profile.status
    })
    
    if (isVercel) {
      console.log(`✅ [VERCEL-ADMIN-${requestId}] STAY ON ADMIN:`, {
        reason: 'unclear permissions - staying on admin page',
        profileRole: profile.role,
        profileStatus: profile.status,
        tenantId: profile.tenant_id
      })
    }
    
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