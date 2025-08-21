'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authManager, AuthUser, supabase } from '@/lib/auth/supabaseAuth'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: AuthUser | null
  tenantId: string | null
  loading: boolean
  signIn: (email: string, password: string, selectedTenantId?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  switchTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>
  hasPermission: (resource: string, action: string) => boolean
  refreshAuth: () => Promise<void>
  isOwner: () => boolean
  isAdmin: () => boolean
  isInstructor: () => boolean
  isDeveloper: () => boolean
  availableTenants: Array<{ id: string; name: string; slug: string; role?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableTenants, setAvailableTenants] = useState<Array<{ id: string; name: string; slug: string; role?: string }>>([])
  const router = useRouter()

  useEffect(() => {
    initializeAuth()
    
    // Supabase Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setTenantId(null)
          setAvailableTenants([])
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // 토큰이 새로고침된 경우 사용자 정보도 새로고침
          await refreshAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function initializeAuth() {
    try {
      setLoading(true)
      console.log('Initializing auth...')
      
      // 세션 복원 시도
      const { user: restoredUser, error } = await authManager.restoreSession()
      
      if (restoredUser && !error) {
        console.log('Session restored:', restoredUser.email, 'Tenant:', restoredUser.tenant_id)
        setUser(restoredUser)
        setTenantId(restoredUser.tenant_id || null)
        setAvailableTenants(restoredUser.available_tenants || [])
      } else {
        console.log('No valid session found:', error)
        setUser(null)
        setTenantId(null)
        setAvailableTenants([])
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      setUser(null)
      setTenantId(null)
      setAvailableTenants([])
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string, selectedTenantId?: string) {
    try {
      setLoading(true)
      console.log('Signing in:', email, selectedTenantId ? `with tenant: ${selectedTenantId}` : 'auto-detect tenant')
      
      const { user: authUser, error } = await authManager.signIn(email, password, selectedTenantId)
      
      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      if (authUser) {
        console.log('Sign in successful:', authUser.email, 'Role:', authUser.role, 'Tenant:', authUser.tenant_id)
        setUser(authUser)
        setTenantId(authUser.tenant_id || null)
        setAvailableTenants(authUser.available_tenants || [])
        return {}
      }

      return { error: '로그인 실패' }
    } catch (error) {
      console.error('Sign in exception:', error)
      return { error: '로그인 중 오류가 발생했습니다.' }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    try {
      setLoading(true)
      await authManager.signOut()
      setUser(null)
      setTenantId(null)
      setAvailableTenants([])
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function switchTenant(targetTenantId: string) {
    try {
      console.log('Switching tenant to:', targetTenantId)
      const result = await authManager.switchTenant(targetTenantId)
      
      if (result.success) {
        const updatedUser = authManager.getCurrentUser()
        if (updatedUser) {
          setUser({ ...updatedUser })
          setTenantId(targetTenantId)
        }
      }
      
      return result
    } catch (error) {
      console.error('Tenant switch error:', error)
      return { success: false, error: '테넌트 변경 중 오류가 발생했습니다.' }
    }
  }

  async function refreshAuth() {
    try {
      console.log('Refreshing auth state...')
      const { user: refreshedUser, error } = await authManager.restoreSession()
      
      if (refreshedUser && !error) {
        setUser(refreshedUser)
        setTenantId(refreshedUser.tenant_id || null)
        setAvailableTenants(refreshedUser.available_tenants || [])
      }
    } catch (error) {
      console.error('Auth refresh failed:', error)
    }
  }

  function hasPermission(resource: string, action: string): boolean {
    return authManager.hasPermission(resource, action)
  }

  function isOwner(): boolean {
    return user?.role === 'owner' || user?.role === 'developer'
  }

  function isAdmin(): boolean {
    return user?.role === 'tenant_admin' || user?.role === 'system_admin' || user?.role === 'owner' || user?.role === 'developer'
  }

  function isInstructor(): boolean {
    return user?.role === 'instructor' || isAdmin()
  }

  function isDeveloper(): boolean {
    return user?.is_developer === true || user?.role === 'developer'
  }

  const value = {
    user,
    tenantId,
    loading,
    signIn,
    signOut,
    switchTenant,
    hasPermission,
    refreshAuth,
    isOwner,
    isAdmin,
    isInstructor,
    isDeveloper,
    availableTenants
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: { resource: string; action: string }[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasPermission } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
      }
    }, [user, loading, router])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    // Check required permissions
    if (requiredPermissions) {
      const hasRequiredPermissions = requiredPermissions.every(perm => 
        hasPermission(perm.resource, perm.action)
      )

      if (!hasRequiredPermissions) {
        return (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900">접근 권한 없음</h2>
            <p className="text-gray-600 mt-2">이 페이지에 접근할 권한이 없습니다.</p>
          </div>
        )
      }
    }

    return <Component {...props} />
  }
}