'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from 'react'

export function ProfileDebugger() {
  const { user, profile } = useAuthStore()

  useEffect(() => {
    console.log('🔍 [PROFILE-DEBUGGER] Current auth state:', {
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email,
      profileRole: profile?.role,
      profileStatus: profile?.status,
      profileTenantId: profile?.tenant_id,
      fullProfile: profile
    })
  }, [user, profile])

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs font-mono z-50">
      <div className="text-green-300">Profile Debug:</div>
      <div>User: {user?.email || 'null'}</div>
      <div>Role: {profile?.role || 'null'}</div>
      <div>Status: {profile?.status || 'null'}</div>
      <div>Tenant: {profile?.tenant_id || 'null'}</div>
    </div>
  )
}