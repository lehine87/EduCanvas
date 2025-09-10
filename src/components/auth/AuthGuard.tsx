'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useSessionAutoRefresh } from '@/store/useAuthStore'
import { AuthPermissions, type PermissionAction } from '@/lib/auth/AuthorizationService'
import type { UserRole } from '@/types/auth.types'
import { Loading } from '@/components/ui'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: UserRole[]
  requiredPermissions?: PermissionAction[] // 🆕 세밀한 권한 제어
  requireTenantAccess?: string // 특정 테넌트 접근 권한 필요
  permissionMode?: 'any' | 'all' // 🆕 다중 권한 검증 모드
  fallback?: React.ReactNode // 로딩 중 표시할 커스텀 컴포넌트
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  allowedRoles = [],
  requiredPermissions = [],
  requireTenantAccess,
  permissionMode = 'any',
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
  
  // 🔒 개선된 인증 및 권한 검사 (중앙집중식)
  const isAuthenticated = !!user && isSessionValid()
  const isActive = profile?.status === 'active'
  
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

  // 세션 자동 갱신 적용 (인증이 필요한 페이지에서만)
  useSessionAutoRefresh(requireAuth)

  // 🔒 개선된 보안 검사 로직 (중앙집중식 권한 관리)
  const performSecurityChecks = useCallback(() => {
    // 인증이 필요없는 페이지는 초기화 완료시 바로 통과
    if (!requireAuth && initialized) {
      setIsChecking(false)
      setAuthError(null)
      
      // 인증된 사용자가 인증 불필요 페이지 접근 (로그인 페이지 등)
      if (isAuthenticated) {
        router.push('/main')
        return
      }
      return
    }

    // 인증이 필요한 페이지는 profile까지 필요
    if (!initialized || (requireAuth && !profile)) return

    setIsChecking(false)
    setAuthError(null)

    // 1. 기본 인증 검사
    if (requireAuth && !isAuthenticated) {
      console.log('🚨 [AUTH-GUARD] Unauthenticated access attempt')
      const currentUrl = window.location.pathname + window.location.search
      router.push(`${redirectTo}?next=${encodeURIComponent(currentUrl)}`)
      return
    }

    if (requireAuth && isAuthenticated && profile) {
      // 3. 세션 유효성 검사
      if (!isSessionValid()) {
        console.log('🚨 [AUTH-GUARD] Expired session detected')
        clearSensitiveData()
        router.push(`${redirectTo}?reason=session-expired`)
        return
      }

      // 4. 계정 활성 상태 검사
      if (!isActive) {
        console.log('🚨 [AUTH-GUARD] Inactive account access:', profile.status)
        setAuthError('계정이 비활성화되었습니다. 관리자에게 문의하세요.')
        router.push('/auth/login?error=account-inactive')
        return
      }

      // 5. 🆕 역할 기반 접근 제어 (중앙집중식)
      if (allowedRoles.length > 0) {
        const hasValidRole = AuthPermissions.hasRole(profile, allowedRoles)
        if (!hasValidRole) {
          console.log('🚨 [AUTH-GUARD] Insufficient role permissions:', { 
            userRole: profile.role, 
            allowedRoles 
          })
          setAuthError('이 페이지에 접근할 권한이 없습니다.')
          router.push('/unauthorized')
          return
        }
      }

      // 6. 🆕 세밀한 권한 검증 (Permission-based)
      if (requiredPermissions.length > 0) {
        const hasPermissions = permissionMode === 'all' 
          ? AuthPermissions.checkAll(profile, requiredPermissions, requireTenantAccess)
          : AuthPermissions.checkAny(profile, requiredPermissions, requireTenantAccess)
        
        if (!hasPermissions) {
          console.log('🚨 [AUTH-GUARD] Insufficient permissions:', { 
            userRole: profile.role,
            requiredPermissions,
            permissionMode
          })
          setAuthError('이 기능에 접근할 권한이 없습니다.')
          router.push('/unauthorized')
          return
        }
      }

      // 7. 테넌트 접근 권한 검사 (중앙집중식)
      if (requireTenantAccess) {
        const canAccess = AuthPermissions.canAccessTenant(profile, requireTenantAccess)
        if (!canAccess) {
          console.log('🚨 [AUTH-GUARD] Tenant access denied:', { 
            requiredTenant: requireTenantAccess,
            userTenant: profile.tenant_id
          })
          setAuthError('해당 학원에 접근할 권한이 없습니다.')
          router.push('/unauthorized')
          return
        }
      }

      // 8. 권한 검사 통과 로그 (개발 환경)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [AUTH-GUARD] Access granted:', {
          user: profile.email,
          role: profile.role,
          path: window.location.pathname
        })
      }
    }
  }, [
    initialized, requireAuth, isAuthenticated, isSessionValid, isActive, 
    allowedRoles, requiredPermissions, requireTenantAccess, permissionMode,
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