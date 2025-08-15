import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { authClient } from '@/lib/auth/authClient'
import type { UserProfile } from '@/types/auth.types'
import React from 'react'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  lastProfileRefresh: number | null
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: (force?: boolean) => Promise<void>
  reset: () => void
  
  // Security helpers
  clearSensitiveData: () => void
  isSessionValid: () => boolean
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        profile: null,
        session: null,
        loading: false,
        initialized: false,
        lastProfileRefresh: null,

        setUser: (user) => set({ user }),
        setProfile: (profile) => set({ profile, lastProfileRefresh: Date.now() }),
        setSession: (session) => set({ session }),
        setLoading: (loading) => set({ loading }),

        initialize: async () => {
          try {
            set({ loading: true })

            const session = await authClient.getCurrentSession()
            
            if (session?.user) {
              const profile = await authClient.getUserProfile()
              
              set({ 
                user: session.user,
                session,
                profile,
                initialized: true 
              })
              
              const { data: { subscription } } = authClient.onAuthStateChange(
                async (event, sessionData) => {
                  console.log('Auth state changed:', event, sessionData && typeof sessionData === 'object' && 'user' in sessionData ? 'user present' : 'no user')
                  
                  if (event === 'SIGNED_IN' && sessionData && typeof sessionData === 'object' && 'user' in sessionData && sessionData.user) {
                    const profile = await authClient.getUserProfile()
                    const typedSession = sessionData as Session
                    set({ 
                      user: typedSession.user,
                      session: typedSession,
                      profile 
                    })
                  } else if (event === 'SIGNED_OUT') {
                    set({ 
                      user: null,
                      session: null,
                      profile: null 
                    })
                  } else if (event === 'TOKEN_REFRESHED' && sessionData && typeof sessionData === 'object' && 'user' in sessionData) {
                    set({ session: sessionData as Session })
                  }
                }
              )
              
              // 정리 함수를 따로 저장하지 않고 바로 처리
              subscription.unsubscribe()
            } else {
              set({ initialized: true })
            }
          } catch (error) {
            console.error('Auth initialization error:', error)
            set({ initialized: true })
          } finally {
            set({ loading: false })
          }
        },

        signOut: async () => {
          try {
            set({ loading: true })
            await authClient.signOut()
            
            set({
              user: null,
              profile: null,
              session: null,
              loading: false
            })
          } catch (error) {
            console.error('Sign out error:', error)
            set({ loading: false })
            throw error
          }
        },

        refreshProfile: async (force = false) => {
          try {
            const { user, lastProfileRefresh } = get()
            if (!user) return

            // 5분 이내에 새로고침했다면 스킵 (force가 false인 경우)
            const CACHE_DURATION = 5 * 60 * 1000 // 5분
            if (!force && lastProfileRefresh && (Date.now() - lastProfileRefresh) < CACHE_DURATION) {
              console.log('🔄 프로필 캐시 유효, 새로고침 스킵')
              return
            }

            const profile = await authClient.getUserProfile()
            set({ profile, lastProfileRefresh: Date.now() })
          } catch (error) {
            console.error('Profile refresh error:', error)
            throw error
          }
        },

        reset: () => {
          set({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: false,
            lastProfileRefresh: null
          })
        },

        // 보안: 민감한 데이터 클리어 (메모리에서 완전 제거)
        clearSensitiveData: () => {
          const state = get()
          
          // 사용자 데이터를 null로 덮어쓰기
          if (state.user) {
            Object.keys(state.user).forEach(key => {
              delete (state.user as unknown as Record<string, unknown>)[key]
            })
          }
          
          if (state.profile) {
            Object.keys(state.profile).forEach(key => {
              delete (state.profile as unknown as Record<string, unknown>)[key]
            })
          }
          
          if (state.session) {
            Object.keys(state.session).forEach(key => {
              delete (state.session as unknown as Record<string, unknown>)[key]
            })
          }
          
          // 상태 초기화
          set({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: false,
            lastProfileRefresh: null
          })
          
          // 가비지 컬렉션 강제 실행 (개발환경)
          if (process.env.NODE_ENV === 'development' && typeof global !== 'undefined' && 'gc' in global && typeof (global as { gc?: () => void }).gc === 'function') {
            (global as { gc: () => void }).gc()
          }
        },

        // 세션 유효성 검사
        isSessionValid: () => {
          const { session } = get()
          if (!session) return false
          
          // 세션 만료 검사
          const expiresAt = session.expires_at
          if (!expiresAt) return false
          
          const now = Math.floor(Date.now() / 1000)
          const bufferTime = 5 * 60 // 5분 버퍼
          
          return expiresAt > (now + bufferTime)
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          initialized: state.initialized,
          lastProfileRefresh: state.lastProfileRefresh,
        }),
        // 민감한 데이터는 localStorage에 저장하지 않음
        // user, profile, session은 메모리에만 보관
      }
    )
  )
)

export const useAuth = () => {
  const { 
    user, 
    profile, 
    loading, 
    initialized, 
    signOut, 
    refreshProfile, 
    clearSensitiveData, 
    isSessionValid 
  } = useAuthStore()
  
  // Vercel 프로덕션 환경에서는 로깅 비활성화 (429 에러 방지)
  React.useEffect(() => {
    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 [AUTH] useAuth STATE:`, {
        hasUser: !!user,
        hasProfile: !!profile,
        loading,
        initialized,
        userEmail: user?.email,
        profileRole: profile?.role,
        profileStatus: profile?.status,
        isSessionValid: isSessionValid(),
        timestamp: new Date().toISOString()
      })
    }
  }, [user, profile, loading, initialized])
  
  return {
    user,
    profile,
    loading,
    initialized,
    signOut,
    refreshProfile,
    clearSensitiveData,
    isSessionValid,
    isAuthenticated: !!user && isSessionValid(),
    isAdmin: profile?.role === 'admin' || profile?.role === 'system_admin',
    isSystemAdmin: profile?.role === 'system_admin',
    isInstructor: profile?.role === 'instructor',
    isStaff: profile?.role === 'staff',
    isViewer: profile?.role === 'viewer',
    
    // 역할 기반 권한 검사 헬퍼
    hasRole: (role: string | string[]) => {
      if (!profile?.role) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(profile.role)
    },
    
    // 테넌트 접근 권한 검사
    canAccessTenant: (tenantId: string) => {
      if (profile?.role === 'system_admin') return true
      return profile?.tenant_id === tenantId
    },
    
    // 관리 권한 검사
    isManager: profile?.role === 'admin' || profile?.role === 'system_admin',
    
    // 활성 상태 검사
    isActive: profile?.status === 'active'
  }
}

// 세션 자동 갱신을 위한 헬퍼 훅
export const useSessionAutoRefresh = () => {
  const { session, isSessionValid, refreshProfile } = useAuthStore()
  
  // 세션 만료 10분 전에 자동 갱신
  React.useEffect(() => {
    if (!session || !isSessionValid()) return
    
    const expiresAt = session.expires_at
    if (!expiresAt) return
    
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = (expiresAt - now) * 1000
    const refreshTime = Math.max(0, timeUntilExpiry - (10 * 60 * 1000)) // 10분 전
    
    const timer = setTimeout(async () => {
      try {
        console.log('🔄 세션 자동 갱신 중...')
        await authClient.getCurrentSession()
        await refreshProfile(true)
      } catch (error) {
        console.error('🚨 세션 자동 갱신 실패:', error)
      }
    }, refreshTime)
    
    return () => clearTimeout(timer)
  }, [session, isSessionValid, refreshProfile])
}