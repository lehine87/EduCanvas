'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loading } from '@/components/ui'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: string[]
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  allowedRoles = []
}: AuthGuardProps) {
  const { user, profile, loading, initialized } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!initialized) return

    setIsChecking(false)

    // 인증이 필요한 페이지인데 로그인하지 않은 경우
    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    // 인증이 필요하지 않은 페이지인데 로그인한 경우 (로그인 페이지 등)
    if (!requireAuth && user) {
      router.push('/admin')
      return
    }

    // 역할 기반 접근 제어 (현재 is_admin만 지원)
    if (requireAuth && user && profile && allowedRoles.length > 0) {
      const userRole = profile.is_admin ? 'admin' : 'viewer'
      if (!allowedRoles.includes(userRole)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [user, profile, initialized, requireAuth, allowedRoles, router, redirectTo])

  // 초기화 중이거나 인증 상태를 확인 중일 때 로딩 표시
  if (!initialized || loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="인증 상태를 확인하는 중..." />
      </div>
    )
  }

  // 인증이 필요한데 로그인하지 않은 경우
  if (requireAuth && !user) {
    return null // 리다이렉트 중
  }

  // 인증이 필요하지 않은데 로그인한 경우
  if (!requireAuth && user) {
    return null // 리다이렉트 중
  }

  // 역할 권한이 없는 경우
  if (requireAuth && user && profile && allowedRoles.length > 0) {
    const userRole = profile.is_admin ? 'admin' : 'viewer'
    if (!allowedRoles.includes(userRole)) {
      return null // 리다이렉트 중
    }
  }

  return <>{children}</>
}