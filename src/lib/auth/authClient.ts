import { createClient } from '@/lib/supabase/client'
import type { UserRole, UserProfile } from '@/types/auth.types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { AuditLog } from '@/lib/security/AuditLogger'
import { checkRateLimit, recordSuccess, recordFailure } from '@/lib/security/RateLimiter'
import { AuthErrorHandler, AuthErrorType, createAuthError } from './AuthErrorHandler'

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

  /**
   * 🔒 클라이언트 정보 수집 (감사 로깅용)
   */
  private getClientInfo(): { ipAddress?: string; userAgent?: string } {
    return {
      ipAddress: undefined, // 클라이언트에서는 실제 IP를 알 수 없음 (서버에서 처리)
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    }
  }

  async signUp({ email, password, full_name }: SignUpData) {
    console.log('🔐 SignUp 시도 (API 라우트 사용):', { email, full_name })
    
    // 🛡️ Rate Limiting: 회원가입 시도 제한 확인
    const clientInfo = this.getClientInfo()
    const rateLimitCheck = await checkRateLimit(
      email, // 이메일 기반 식별
      'signup',
      {
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ipAddress
      }
    )

    if (!rateLimitCheck.allowed) {
      // 🛡️ Rate Limit 에러 생성
      const retryAfter = rateLimitCheck.resetTime ? 
        Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000) : undefined

      const rateLimitError = AuthErrorHandler.createRateLimitError(retryAfter)
      
      // 🔒 보안 감사 로깅 통합
      throw AuthErrorHandler.logAndHandle(rateLimitError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'signup'
      })
    }
    
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
        // 🛡️ Rate Limiting: 회원가입 실패 기록
        recordFailure(email, 'signup')
        
        console.error('🚨 SignUp API 오류:', result)
        
        // 🚨 API 에러를 표준화된 AuthError로 변환
        let errorType = AuthErrorType.SERVER_ERROR
        if (response.status === 422) {
          errorType = AuthErrorType.EMAIL_ALREADY_EXISTS
        } else if (response.status === 400) {
          errorType = AuthErrorType.VALIDATION_ERROR
        }
        
        const authError = createAuthError(errorType, result.error || '회원가입 중 오류가 발생했습니다.')
        
        throw AuthErrorHandler.logAndHandle(authError, undefined, {
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          operation: 'signup'
        })
      }

      // 🛡️ Rate Limiting: 회원가입 성공 기록
      recordSuccess(email, 'signup')
      
      console.log('✅ SignUp 성공:', result.user?.email)
      
      return {
        user: result.user,
        session: null // 이메일 인증 전까지는 세션 없음
      }
    } catch (error) {
      // 🚨 예상치 못한 에러 처리
      if (error instanceof Error && error.constructor.name === 'AuthError') {
        // 이미 처리된 AuthError는 그대로 전달
        throw error
      }

      // Rate Limit 에러가 아닌 경우에만 실패 기록
      recordFailure(email, 'signup')
      
      console.error('🚨 SignUp 예외:', error)
      
      // 🛡️ 네트워크 또는 기타 에러를 AuthError로 변환
      const authError = error instanceof Error && error.message.includes('fetch')
        ? AuthErrorHandler.createNetworkError(error)
        : createAuthError(AuthErrorType.UNKNOWN_ERROR, '회원가입 중 예상치 못한 오류가 발생했습니다.', {
            cause: error instanceof Error ? error : undefined
          })

      throw AuthErrorHandler.logAndHandle(authError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'signup'
      })
    }
  }

  async signIn({ email, password }: SignInData) {
    // 🔒 보안 감사: 로그인 시도 기록을 위한 준비
    const clientInfo = this.getClientInfo()
    
    // 🛡️ Rate Limiting: 로그인 시도 제한 확인
    const rateLimitCheck = await checkRateLimit(
      email, // 이메일 기반 식별
      'login',
      {
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ipAddress
      }
    )

    if (!rateLimitCheck.allowed) {
      // 🛡️ Rate Limit 에러 생성
      const retryAfter = rateLimitCheck.resetTime ? 
        Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000) : undefined

      const rateLimitError = AuthErrorHandler.createRateLimitError(retryAfter)
      
      // 🔒 보안 감사 로깅 통합
      throw AuthErrorHandler.logAndHandle(rateLimitError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'login'
      })
    }
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // 🛡️ Rate Limiting: 로그인 실패 기록
        recordFailure(email, 'login')
        
        // 🚨 Supabase 에러를 표준화된 AuthError로 변환
        const authError = AuthErrorHandler.fromSupabaseError(error)
        
        // 🔒 보안 감사 로깅 통합
        throw AuthErrorHandler.logAndHandle(authError, undefined, {
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          operation: 'login'
        })
      }
      
      if (data.user) {
        // 🛡️ Rate Limiting: 로그인 성공 기록 (좋은 행동 보상)
        recordSuccess(email, 'login')
        
        // 사용자 프로필 조회 (감사 로깅용)
        const profile = await this.getUserProfile()
        if (profile) {
          // 🔒 보안 감사: 로그인 성공 로그
          AuditLog.login(
            profile,
            true, // 성공
            clientInfo.ipAddress,
            clientInfo.userAgent
          )
        }
      }
      
      return data
      
    } catch (error) {
      // 🚨 예상치 못한 에러 처리
      if (error instanceof Error && error.constructor.name === 'AuthError') {
        // 이미 처리된 AuthError는 그대로 전달
        throw error
      }

      // 🛡️ 네트워크 또는 기타 에러를 AuthError로 변환
      const authError = error instanceof Error && error.message.includes('fetch')
        ? AuthErrorHandler.createNetworkError(error)
        : createAuthError(AuthErrorType.UNKNOWN_ERROR, 'Login failed due to unexpected error', {
            cause: error instanceof Error ? error : undefined
          })

      throw AuthErrorHandler.logAndHandle(authError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'login'
      })
    }
  }

  async signOut() {
    // 🔒 보안 감사: 로그아웃 전 사용자 정보 수집
    const profile = await this.getUserProfile()
    const session = await this.getCurrentSession()
    
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
    
    // 🔒 보안 감사: 로그아웃 로그
    if (profile && session) {
      AuditLog.logout(profile, session.access_token.substring(0, 16)) // 토큰의 일부만 사용
    }
    
    // 로그아웃 후 로그인 페이지로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  async resetPassword(email: string) {
    // 🛡️ Rate Limiting: 비밀번호 재설정 시도 제한 확인
    const clientInfo = this.getClientInfo()
    const rateLimitCheck = await checkRateLimit(
      email,
      'passwordReset',
      {
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ipAddress
      }
    )

    if (!rateLimitCheck.allowed) {
      // 🛡️ Rate Limit 에러 생성
      const retryAfter = rateLimitCheck.resetTime ? 
        Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000) : undefined

      const rateLimitError = AuthErrorHandler.createRateLimitError(retryAfter)
      
      // 🔒 보안 감사 로깅 통합
      throw AuthErrorHandler.logAndHandle(rateLimitError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'passwordReset'
      })
    }

    try {
      // API Route를 통해 Rate Limiting이 적용된 비밀번호 재설정 요청
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        // 🛡️ Rate Limiting: 비밀번호 재설정 실패 기록
        recordFailure(email, 'passwordReset')
        
        const errorData = await response.json()
        
        // 🚨 API 에러를 표준화된 AuthError로 변환
        let errorType = AuthErrorType.SERVER_ERROR
        if (response.status === 404) {
          errorType = AuthErrorType.ACCOUNT_NOT_FOUND
        } else if (response.status === 429) {
          errorType = AuthErrorType.RATE_LIMIT_EXCEEDED
        }
        
        const authError = createAuthError(errorType, errorData.error || '비밀번호 재설정 요청 실패')
        
        throw AuthErrorHandler.logAndHandle(authError, undefined, {
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          operation: 'passwordReset'
        })
      }

      // 🛡️ Rate Limiting: 비밀번호 재설정 성공 기록
      recordSuccess(email, 'passwordReset')

      const result = await response.json()
      return result
      
    } catch (error) {
      // 🚨 예상치 못한 에러 처리
      if (error instanceof Error && error.constructor.name === 'AuthError') {
        // 이미 처리된 AuthError는 그대로 전달
        throw error
      }

      // Rate Limit 에러가 아닌 경우에만 실패 기록
      recordFailure(email, 'passwordReset')
      
      // 🛡️ 네트워크 또는 기타 에러를 AuthError로 변환
      const authError = error instanceof Error && error.message.includes('fetch')
        ? AuthErrorHandler.createNetworkError(error)
        : createAuthError(AuthErrorType.UNKNOWN_ERROR, '비밀번호 재설정 중 예상치 못한 오류가 발생했습니다.', {
            cause: error instanceof Error ? error : undefined
          })

      throw AuthErrorHandler.logAndHandle(authError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'passwordReset'
      })
    }
  }

  async updatePassword(password: string) {
    const clientInfo = this.getClientInfo()
    
    try {
      const { error } = await this.supabase.auth.updateUser({
        password
      })

      if (error) {
        console.error('🚨 [AUTH-CLIENT] 비밀번호 업데이트 에러:', error.message)
        
        // 🚨 Supabase 에러를 표준화된 AuthError로 변환
        const authError = AuthErrorHandler.fromSupabaseError(error)
        
        throw AuthErrorHandler.logAndHandle(authError, undefined, {
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          operation: 'updatePassword'
        })
      }
      
      console.log('✅ [AUTH-CLIENT] 비밀번호 업데이트 성공')
      
      // 🔒 보안 감사: 비밀번호 변경 성공 로그
      const profile = await this.getUserProfile()
      if (profile) {
        AuditLog.custom('AUTH_PASSWORD_CHANGE', {
          user: profile,
          details: 'Password updated successfully',
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        })
      }
      
    } catch (error) {
      // 🚨 예상치 못한 에러 처리
      if (error instanceof Error && error.constructor.name === 'AuthError') {
        // 이미 처리된 AuthError는 그대로 전달
        throw error
      }

      console.error('🚨 [AUTH-CLIENT] 비밀번호 업데이트 예외:', error)
      
      // 🛡️ 기타 에러를 AuthError로 변환
      const authError = createAuthError(AuthErrorType.UNKNOWN_ERROR, '비밀번호 업데이트 중 오류가 발생했습니다.', {
        cause: error instanceof Error ? error : undefined
      })

      throw AuthErrorHandler.logAndHandle(authError, undefined, {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        operation: 'updatePassword'
      })
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

  /**
   * 🔒 타입 안전성 강화: 인증 상태 변경 리스너
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authClient = new AuthClient()