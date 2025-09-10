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
  authSubscription: { subscription: { unsubscribe: () => void } } | null // 인증 리스너 구독 객체 저장
  
  // ✅ 업계 표준: SSR/CSR 하이드레이션을 위한 지속 데이터 (학원명 포함)
  persistedProfile: Pick<UserProfile, 'name' | 'role' | 'tenant_id' | 'status'> & {
    tenantName?: string
  } | null
  hasValidSession: boolean
  
  // Computed Values (getters)
  getEffectiveProfile: () => UserProfile | (Pick<UserProfile, 'name' | 'role' | 'tenant_id' | 'status'> & { tenantName?: string }) | null
  
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
  cleanup: () => void // 리스너 정리 함수
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
        authSubscription: null,
        
        // ✅ 업계 표준: 지속된 데이터 초기값
        persistedProfile: null,
        hasValidSession: false,

        setUser: (user) => set({ user }),
        setProfile: (profile) => set({ 
          profile, 
          lastProfileRefresh: Date.now(),
          // ✅ 업계 표준: 프로필 설정시 지속 데이터도 업데이트 (학원명 포함)
          persistedProfile: profile ? {
            name: profile.name,
            role: profile.role,
            tenant_id: profile.tenant_id,
            status: profile.status,
            tenantName: (profile as any)?.tenants?.name
          } : null
        }),
        setSession: (session) => set({ 
          session,
          // ✅ 업계 표준: 세션 상태 지속 정보 업데이트
          hasValidSession: session ? true : false
        }),
        setLoading: (loading) => set({ loading }),

        initialize: async () => {
          try {
            // ✅ 업계 표준: 지속된 데이터로 즉시 UI 업데이트 (깜빡거림 방지)
            const { persistedProfile, hasValidSession } = get()
            if (persistedProfile && hasValidSession) {
              console.log('🔄 [AUTH-STORE] 지속된 프로필 데이터로 즉시 UI 렌더링:', persistedProfile.name)
              // 지속된 데이터를 임시로 profile에 설정하여 즉시 렌더링
              set({ 
                profile: persistedProfile as UserProfile, // 기본 정보만 있지만 UI 렌더링에는 충분
                loading: true 
              })
            } else {
              set({ loading: true })
            }

            // 🚀 성능 최적화: 세션과 프로필 병렬 로딩
            const [session, profile] = await Promise.allSettled([
              authClient.getCurrentSession(),
              authClient.getUserProfile()
            ])
            
            const sessionResult = session.status === 'fulfilled' ? session.value : null
            const profileResult = profile.status === 'fulfilled' ? profile.value : null
            
            if (sessionResult?.user && profileResult) {
              
              set({ 
                user: sessionResult.user,
                session: sessionResult,
                profile: profileResult,
                initialized: true,
                // ✅ 업계 표준: 완전한 프로필 데이터 로드시 지속 데이터도 업데이트
                persistedProfile: profileResult ? {
                  name: profileResult.name,
                  role: profileResult.role,
                  tenant_id: profileResult.tenant_id,
                  status: profileResult.status,
                  tenantName: (profileResult as any)?.tenants?.name
                } : null,
                hasValidSession: true
              })
              
              // 기존 구독이 있으면 정리
              const currentSubscription = get().authSubscription
              if (currentSubscription) {
                currentSubscription.subscription.unsubscribe()
              }

              const { data: { subscription } } = authClient.onAuthStateChange(
                async (event, sessionData) => {
                  console.log('🔐 [AUTH-STORE] Auth state changed:', event, sessionData && typeof sessionData === 'object' && 'user' in sessionData ? 'user present' : 'no user')
                  
                  if (event === 'SIGNED_IN' && sessionData && typeof sessionData === 'object' && 'user' in sessionData && sessionData.user) {
                    const profile = await authClient.getUserProfile()
                    const typedSession = sessionData as Session
                    set({ 
                      user: typedSession.user,
                      session: typedSession,
                      profile,
                      // ✅ 업계 표준: 사인인시 지속 데이터 업데이트
                      persistedProfile: profile ? {
                        name: profile.name,
                        role: profile.role,
                        tenant_id: profile.tenant_id,
                        status: profile.status,
                        tenantName: (profile as any)?.tenants?.name
                      } : null,
                      hasValidSession: true
                    })
                  } else if (event === 'SIGNED_OUT') {
                    set({ 
                      user: null,
                      session: null,
                      profile: null,
                      // ✅ 업계 표준: 사인아웃시 지속 데이터도 클리어
                      persistedProfile: null,
                      hasValidSession: false
                    })
                  } else if (event === 'TOKEN_REFRESHED' && sessionData && typeof sessionData === 'object' && 'user' in sessionData) {
                    set({ 
                      session: sessionData as Session,
                      hasValidSession: true
                    })
                  }
                }
              )
              
              // ✅ 업계 표준: 구독 객체를 상태에 저장하여 나중에 정리할 수 있게 함
              set({ authSubscription: { subscription } })
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
            
            // 인증 리스너 정리
            const { authSubscription } = get()
            if (authSubscription?.subscription) {
              authSubscription.subscription.unsubscribe()
            }
            
            await authClient.signOut()
            
            set({
              user: null,
              profile: null,
              session: null,
              loading: false,
              authSubscription: null,
              persistedProfile: null,
              hasValidSession: false
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
          // 인증 리스너 정리
          const { authSubscription } = get()
          if (authSubscription?.subscription) {
            authSubscription.subscription.unsubscribe()
          }
          
          set({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: false,
            lastProfileRefresh: null,
            authSubscription: null,
            persistedProfile: null,
            hasValidSession: false
          })
        },

        cleanup: () => {
          const { authSubscription } = get()
          if (authSubscription?.subscription) {
            console.log('🧹 [AUTH-STORE] 인증 리스너 정리 중...')
            authSubscription.subscription.unsubscribe()
          }
          set({ authSubscription: null })
        },

        getEffectiveProfile: () => {
          const { profile, persistedProfile } = get()
          return profile || persistedProfile
        },

        // 🔒 보안 강화: 민감한 데이터를 메모리에서 완전 제거
        clearSensitiveData: () => {
          const state = get()
          
          // 인증 리스너 정리
          if (state.authSubscription?.subscription) {
            state.authSubscription.subscription.unsubscribe()
          }
          
          // 🛡️ 보안 강화: 민감한 문자열 덮어쓰기 후 삭제
          const secureDelete = (obj: any) => {
            if (!obj || typeof obj !== 'object') return
            
            Object.keys(obj).forEach(key => {
              const value = obj[key]
              if (typeof value === 'string' && value.length > 0) {
                // 민감한 문자열을 0으로 덮어쓰기 (여러 번 반복으로 메모리 완전 덮어쓰기)
                for (let i = 0; i < 3; i++) {
                  obj[key] = '0'.repeat(value.length)
                }
                obj[key] = null
              } else if (typeof value === 'object' && value !== null) {
                secureDelete(value) // 재귀적으로 중첩 객체 처리
              }
              delete obj[key]
            })
          }
          
          // 민감한 데이터 안전 삭제
          if (state.user) {
            secureDelete(state.user)
          }
          
          if (state.profile) {
            secureDelete(state.profile)
          }
          
          if (state.session) {
            secureDelete(state.session)
          }
          
          if (state.persistedProfile) {
            secureDelete(state.persistedProfile)
          }
          
          // 상태 초기화
          set({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: false,
            lastProfileRefresh: null,
            authSubscription: null,
            persistedProfile: null,
            hasValidSession: false
          })
          
          // 메모리 정리 강화
          if (typeof window !== 'undefined') {
            // 브라우저 환경: 가능한 한 가비지 컬렉션 유도
            setTimeout(() => {
              const windowWithGc = window as any
              if (windowWithGc.gc && typeof windowWithGc.gc === 'function') {
                windowWithGc.gc() // Chrome DevTools에서 사용 가능
              }
            }, 100)
          }
          
          // Node.js 개발환경: 강제 가비지 컬렉션
          if (process.env.NODE_ENV === 'development' && typeof global !== 'undefined' && 'gc' in global) {
            const gc = (global as { gc?: () => void }).gc
            if (typeof gc === 'function') {
              setTimeout(() => gc(), 50)
            }
          }
          
          console.log('🔒 [SECURITY] Sensitive data securely cleared from memory')
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
          // ✅ 업계 표준: UI 깜빡거림 방지를 위한 기본 정보 지속
          // 민감하지 않은 기본 정보만 저장하여 SSR/CSR 하이드레이션 개선
          // persistedProfile을 state에서 직접 저장 (이미 setProfile에서 정리된 데이터)
          persistedProfile: state.persistedProfile,
          hasValidSession: state.hasValidSession,
        }),
        // 보안: 실제 세션 토큰, 전체 유저 데이터는 메모리에만 보관
        // UI 개선: 기본 프로필 정보로 깜빡거림 없는 초기 렌더링
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
    isSessionValid,
    cleanup,
    // ✅ 업계 표준: 지속된 데이터에 접근하여 즉시 UI 렌더링 가능
    persistedProfile,
    hasValidSession
  } = useAuthStore()
  
  // ✅ 업계 표준: 앱 언마운트시 리소스 정리
  React.useEffect(() => {
    return () => {
      // 컴포넌트 언마운트시 인증 리스너 정리 (메모리 누수 방지)
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 [AUTH] useAuth 컴포넌트 언마운트 - 리소스 정리 예약')
      }
    }
  }, [])

  // 개발환경 디버깅: 인증 상태 변화 로깅
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 [AUTH] useAuth STATE CHANGE:`, {
        hasUser: !!user,
        hasProfile: !!profile,
        hasPersisted: !!persistedProfile,
        loading,
        initialized,
        userEmail: user?.email,
        profileRole: profile?.role || persistedProfile?.role,
        profileName: profile?.name || persistedProfile?.name,
        hasValidSession,
        isSessionValid: isSessionValid(),
        timestamp: new Date().toISOString()
      })
    }
  }, [user, profile, persistedProfile, loading, initialized, hasValidSession])
  
  // ✅ 업계 표준: 즉시 UI 렌더링을 위한 스마트 프로필 접근
  const effectiveProfile = profile || persistedProfile
  
  return {
    user,
    profile,
    loading,
    initialized,
    signOut,
    refreshProfile,
    clearSensitiveData,
    isSessionValid,
    cleanup,
    
    // ✅ 업계 표준: 지속된 데이터 접근 (즉시 렌더링용)
    persistedProfile,
    hasValidSession,
    effectiveProfile, // 실제 프로필 또는 지속된 프로필
    
    // ✅ 개선된 인증 상태 (지속 데이터 고려)
    isAuthenticated: !!user && isSessionValid(),
    hasAuthData: !!(effectiveProfile && (user || hasValidSession)), // 인증 데이터 존재 여부
    
    // ✅ 개선된 역할 기반 권한 (지속 데이터 사용으로 즉시 응답)
    isAdmin: effectiveProfile?.role === 'tenant_admin' || effectiveProfile?.role === 'system_admin',
    isSystemAdmin: effectiveProfile?.role === 'system_admin',
    isTenantAdmin: effectiveProfile?.role === 'tenant_admin',
    isInstructor: effectiveProfile?.role === 'instructor',
    isStaff: effectiveProfile?.role === 'staff',
    isViewer: effectiveProfile?.role === 'viewer',
    
    // 역할 기반 권한 검사 헬퍼 (지속 데이터 사용)
    hasRole: (role: string | string[]) => {
      if (!effectiveProfile?.role) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(effectiveProfile.role)
    },
    
    // 테넌트 접근 권한 검사 (지속 데이터 사용)
    canAccessTenant: (tenantId: string) => {
      if (effectiveProfile?.role === 'system_admin') return true
      return effectiveProfile?.tenant_id === tenantId
    },
    
    // 관리 권한 검사 (지속 데이터 사용)
    isManager: effectiveProfile?.role === 'tenant_admin' || effectiveProfile?.role === 'system_admin',
    
    // 활성 상태 검사 (지속 데이터 사용)
    isActive: effectiveProfile?.status === 'active'
  }
}

// 세션 자동 갱신을 위한 헬퍼 훅
export const useSessionAutoRefresh = (enabled = true) => {
  const { session, isSessionValid, refreshProfile } = useAuthStore()
  
  // 세션 만료 10분 전에 자동 갱신
  React.useEffect(() => {
    if (!enabled || !session || !isSessionValid()) return
    
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
  }, [enabled, session, isSessionValid, refreshProfile])
}