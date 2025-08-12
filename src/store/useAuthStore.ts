import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { authClient } from '@/lib/auth/authClient'
import type { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  tenants?: {
    id: string
    name: string
    slug: string
  } | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: false,
      initialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
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
              async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email)
                
                if (event === 'SIGNED_IN' && session?.user) {
                  const profile = await authClient.getUserProfile()
                  set({ 
                    user: session.user,
                    session,
                    profile 
                  })
                } else if (event === 'SIGNED_OUT') {
                  set({ 
                    user: null,
                    session: null,
                    profile: null 
                  })
                } else if (event === 'TOKEN_REFRESHED' && session) {
                  set({ session })
                }
              }
            )
            
            return () => subscription.unsubscribe()
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

      refreshProfile: async () => {
        try {
          const { user } = get()
          if (!user) return

          const profile = await authClient.getUserProfile()
          set({ profile })
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
          initialized: false
        })
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        initialized: state.initialized,
      }),
    }
  )
)

export const useAuth = () => {
  const { user, profile, loading, initialized, signOut, refreshProfile } = useAuthStore()
  
  return {
    user,
    profile,
    loading,
    initialized,
    signOut,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin' || profile?.role === 'system_admin',
    isSystemAdmin: profile?.role === 'system_admin',
    isInstructor: profile?.role === 'instructor',
    isStaff: profile?.role === 'staff',
    isViewer: profile?.role === 'viewer',
  }
}