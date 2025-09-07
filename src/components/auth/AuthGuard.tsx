'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useSessionAutoRefresh } from '@/store/useAuthStore'
import { Loading } from '@/components/ui'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: string[]
  requireTenantAccess?: string // 특정 테넌트 접근 권한 필요
  fallback?: React.ReactNode // 로딩 중 표시할 커스텀 컴포넌트
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  allowedRoles = [],
  requireTenantAccess,
  fallback
}: AuthGuardProps) {
  const { 
    user, 
    profile, 
    loading, 
    initialized, 
    isSessionValid,
    clearSensitiveData
  } = useAuthStore()
  
  // 인증 및 권한 검사 헬퍼 함수들
  const isAuthenticated = !!user && isSessionValid()
  const isActive = profile?.status === 'active'
  
  const hasRole = useCallback((roles: string | string[]) => {
    if (!profile?.role) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(profile.role)
  }, [profile?.role])
  
  const canAccessTenant = useCallback((tenantId: string) => {
    if (profile?.role === 'system_admin') return true
    return profile?.tenant_id === tenantId
  }, [profile?.role, profile?.tenant_id])
  
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // 개발 환경에서만 로깅 (Vercel 429 에러 방지)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log(`🛡️ [AUTHGUARD] AUTH GUARD EXECUTED:`, {
      timestamp: new Date().toISOString(),
      currentPath: window.location.pathname,
      initialized,
      loading,
      isChecking,
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!profile,
      profileRole: profile?.role,
      profileEmail: profile?.email,
      requireAuth,
      allowedRoles
    })
  }

  // 세션 자동 갱신 적용
  useSessionAutoRefresh()

  // 보안 검사 로직
  const performSecurityChecks = useCallback(() => {
    if (!initialized) return

    setIsChecking(false)
    setAuthError(null)

    // 1. 기본 인증 검사
    if (requireAuth && !isAuthenticated) {
      console.log('🚨 인증 필요한 페이지에 비인증 사용자 접근')
      const currentUrl = window.location.pathname + window.location.search
      router.push(`${redirectTo}?next=${encodeURIComponent(currentUrl)}`)
      return
    }

    // 2. 인증된 사용자가 인증 불필요 페이지 접근 (로그인 페이지 등)
    if (!requireAuth && isAuthenticated) {
      router.push('/main')
      return
    }

    if (requireAuth && isAuthenticated) {
      // 3. 세션 유효성 검사
      if (!isSessionValid()) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 만료된 세션으로 접근')
        }
        clearSensitiveData()
        router.push(`${redirectTo}?reason=session-expired`)
        return
      }

      // 4. 계정 활성 상태 검사
      if (!isActive) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 비활성 계정 접근:', profile?.status)
        }
        setAuthError('계정이 비활성화되었습니다. 관리자에게 문의하세요.')
        router.push('/auth/login?error=account-inactive')
        return
      }

      // 5. 역할 기반 리다이렉트 (system_admin 특별 처리) - 무한 루프 방지를 위해 제거
      // 대신 admin 페이지에서 사용자가 직접 system-admin으로 이동하도록 UI 제공
      // if (profile?.role === 'system_admin' && window.location.pathname === '/admin') {
      //   console.log('🔧 시스템 관리자 자동 리다이렉트: /admin → /system-admin')
      //   router.push('/system-admin')
      //   return
      // }

      // 6. 역할 기반 접근 제어
      if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 권한 없는 역할로 접근:', { 
            userRole: profile?.role, 
            allowedRoles 
          })
        }
        setAuthError('이 페이지에 접근할 권한이 없습니다.')
        router.push('/unauthorized')
        return
      }

      // 7. 테넌트 접근 권한 검사
      if (requireTenantAccess && !canAccessTenant(requireTenantAccess)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 테넌트 접근 권한 없음:', { 
            requiredTenant: requireTenantAccess,
            userTenant: profile?.tenant_id
          })
        }
        setAuthError('해당 학원에 접근할 권한이 없습니다.')
        router.push('/unauthorized')
        return
      }
    }
  }, [
    initialized, requireAuth, isAuthenticated, isSessionValid, isActive, 
    hasRole, canAccessTenant, allowedRoles, requireTenantAccess, 
    profile, router, redirectTo, clearSensitiveData
  ])

  useEffect(() => {
    performSecurityChecks()
  }, [performSecurityChecks])

  // 초기화 중이거나 인증 상태를 확인 중일 때 로딩 표시
  if (!initialized || loading || isChecking) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loading text="인증 상태를 확인하는 중..." />
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-500">
              개발 모드: 보안 검사 진행 중
            </p>
          )}
        </div>
      </div>
    )
  }

  // 인증 오류가 있는 경우
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            접근 권한 오류
          </h2>
          <p className="text-gray-600 mb-4">
            {authError}
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  // 모든 보안 검사 통과 시 컴포넌트 렌더링
  return <>{children}</>
}