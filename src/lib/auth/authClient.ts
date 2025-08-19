import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'
import type { UserProfile } from '@/types/auth.types'

// 환경에 따른 앱 URL 동적 생성
function getAppUrl(): string {
  const isVercel = typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'production' && 
    window.location.hostname.includes('vercel.app')
  
  let detectedUrl = ''
  
  // Vercel 환경
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    detectedUrl = `https://${window.location.hostname}`
  }
  // 서버 사이드에서 Vercel 환경 감지
  else if (process.env.VERCEL_URL) {
    detectedUrl = `https://${process.env.VERCEL_URL}`
  }
  // 환경변수에서 설정된 URL 사용
  else if (process.env.NEXT_PUBLIC_APP_URL) {
    detectedUrl = process.env.NEXT_PUBLIC_APP_URL
  }
  // 기본값 (개발 환경)
  else {
    detectedUrl = 'http://localhost:3000'
  }
  
  if (isVercel) {
    console.log(`🌐 [VERCEL-URL] APP URL DETECTION:`, {
      detectedUrl,
      windowHostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
      vercelUrl: process.env.VERCEL_URL,
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV
    })
  }
  
  return detectedUrl
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
  // tenant_slug 제거 - 온보딩에서 처리
}

export interface SignInData {
  email: string
  password: string
}

export class AuthClient {
  private supabase = createClient()

  async signUp({ email, password, full_name }: SignUpData) {
    console.log('🔐 SignUp 시도 (API 라우트 사용):', { email, full_name })
    
    try {
      // API 라우트를 통해 회원가입 처리
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('🚨 SignUp API 오류:', result)
        throw new Error(result.error || '회원가입 중 오류가 발생했습니다.')
      }

      console.log('✅ SignUp 성공:', result.user?.email)
      
      return {
        user: result.user,
        session: null // 이메일 인증 전까지는 세션 없음
      }
    } catch (error) {
      console.error('🚨 SignUp 예외:', error)
      
      if (error instanceof Error) {
        // 이미 처리된 에러 메시지 그대로 전달
        throw error
      }
      
      throw new Error('회원가입 중 예상치 못한 오류가 발생했습니다.')
    }
  }

  async signIn({ email, password }: SignInData) {
    // Vercel 환경에서 디버깅
    const isVercel = typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'production' && 
      window.location.hostname.includes('vercel.app')
    
    if (isVercel) {
      console.log(`🔑 [VERCEL-AUTH] SIGNIN CONFIG:`, {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
        detectedAppUrl: getAppUrl(),
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
      })
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      if (isVercel) {
        console.error(`❌ [VERCEL-AUTH] SIGNIN ERROR:`, {
          errorMessage: error.message,
          errorCode: error.status,
          errorName: error.name
        })
      }
      throw error
    }
    
    if (isVercel) {
      console.log(`✅ [VERCEL-AUTH] SIGNIN SUCCESS:`, {
        hasUser: !!data.user,
        hasSession: !!data.session,
        sessionExpiresAt: data.session?.expires_at
      })
    }
    
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
    
    // 로그아웃 후 로그인 페이지로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  async resetPassword(email: string) {
    // API Route를 통해 Rate Limiting이 적용된 비밀번호 재설정 요청
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '비밀번호 재설정 요청 실패')
    }

    const result = await response.json()
    return result
  }

  async updatePassword(password: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password
      })

      if (error) {
        console.error('🚨 [AUTH-CLIENT] 비밀번호 업데이트 에러:', error.message)
        throw error
      }
      
      console.log('✅ [AUTH-CLIENT] 비밀번호 업데이트 성공')
    } catch (error) {
      console.error('🚨 [AUTH-CLIENT] 비밀번호 업데이트 예외:', error)
      throw error
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error) {
        console.warn('🔍 [AUTH-CLIENT] 사용자 조회 에러:', error.message)
        return null
      }
      return user
    } catch (error) {
      console.warn('🔍 [AUTH-CLIENT] 사용자 조회 예외:', error)
      return null
    }
  }

  async getCurrentSession() {
    try {
      // getUser()로 먼저 사용자 확인 (보안상 더 안전)
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        console.warn('🔍 [AUTH-CLIENT] 사용자 인증 실패:', userError?.message)
        return null
      }

      // 세션 정보가 필요한 경우 추가로 조회
      const { data: { session }, error } = await this.supabase.auth.getSession()
      if (error) {
        console.warn('🔍 [AUTH-CLIENT] 세션 조회 에러:', error.message)
        return null
      }
      return session
    } catch (error) {
      console.warn('🔍 [AUTH-CLIENT] 세션 조회 예외:', error)
      return null
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    console.log('🔍 사용자 프로필 조회 중...', user.email)

    let { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name,
          slug
        )
      `)
      .eq('id', user.id)
      .single()

    // 프로필이 없으면 자동으로 생성
    if (error?.code === 'PGRST116') { // No rows found
      console.log('💡 사용자 프로필이 없음. 자동 생성 중...')
      
      // 시스템 관리자인지 확인
      const isSystemAdmin = ['admin@test.com', 'sjlee87@kakao.com'].includes(user.email || '')
      
      let newProfile
      if (isSystemAdmin) {
        // 시스템 관리자 프로필 생성
        newProfile = {
          id: user.id,
          email: user.email || '',
          name: 'System Administrator',
          tenant_id: null, // 시스템 관리자는 tenant_id가 null
          role: 'system_admin' as UserRole,
          status: 'active' as const
        }
      } else {
        // 일반 사용자 프로필 생성
        const { data: defaultTenant } = await this.supabase
          .from('tenants')
          .select('id')
          .limit(1)
          .single()
        
        newProfile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          tenant_id: defaultTenant?.id,
          role: 'viewer' as UserRole,
          status: 'pending_approval' as const
        }
      }

      const { data: insertData, error: insertError } = await this.supabase
        .from('user_profiles')
        .insert(newProfile)
        .select(`
          *,
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .single()

      if (insertError) {
        console.error('❌ 사용자 프로필 생성 실패:', insertError)
        return null
      }

      console.log('✅ 사용자 프로필 자동 생성 완료:', insertData.email)
      return insertData
    }

    if (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error)
      return null
    }

    // 프로필 데이터 검증 및 보정
    if (data) {
      let needsUpdate = false
      const updates: Record<string, unknown> = {}

      // 시스템 관리자 계정인 경우 데이터 보정
      const isSystemAdmin = ['admin@test.com', 'sjlee87@kakao.com'].includes(data.email)
      if (isSystemAdmin) {
        if (!data.name || data.name === 'Unknown User') {
          updates.name = 'System Administrator'
          needsUpdate = true
        }
        if (data.role !== 'system_admin') {
          updates.role = 'system_admin'
          needsUpdate = true
        }
        if (data.status !== 'active') {
          updates.status = 'active'
          needsUpdate = true
        }
        if (data.tenant_id !== null) {
          updates.tenant_id = null
          needsUpdate = true
        }
      }

      // 업데이트가 필요한 경우 실행
      if (needsUpdate) {
        console.log('🔄 프로필 데이터 보정 중...', updates)
        const { data: updatedData, error: updateError } = await this.supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id)
          .select(`
            *,
            tenants:tenant_id (
              id,
              name,
              slug
            )
          `)
          .single()

        if (updateError) {
          console.error('❌ 프로필 업데이트 실패:', updateError)
        } else {
          console.log('✅ 프로필 데이터 보정 완료')
          data = updatedData
        }
      }
    }

    console.log('✅ 사용자 프로필 조회 성공:', {
      email: data?.email,
      name: data?.name,
      tenant: data?.tenants?.name || '시스템 관리자',
      role: data?.role || '없음',
      status: data?.status
    })

    return data
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authClient = new AuthClient()