import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'
import type { UserProfile } from '@/types/auth.types'

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
    console.log('🔐 SignUp 시도 (새로운 플로우):', { email, full_name })
    
    // 1. 이메일 중복 검사 (사전 검증)
    console.log('📧 이메일 중복 검사 중...', email)
    const { data: existingUser } = await this.supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      console.warn('⚠️ 이미 등록된 이메일:', email)
      throw new Error('이미 등록된 이메일입니다. 로그인을 시도하거나 다른 이메일을 사용해주세요.')
    }
    
    // 2. Supabase Auth 회원가입
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
        data: {
          full_name
        }
      }
    })

    if (error) {
      console.error('🚨 SignUp 오류:', error)
      
      // Supabase 특정 오류 메시지 변환
      if (error.message?.includes('User already registered')) {
        throw new Error('이미 등록된 이메일입니다. 로그인을 시도해주세요.')
      } else if (error.message?.includes('Password should be')) {
        throw new Error('비밀번호는 최소 8자 이상이어야 합니다.')
      } else if (error.message?.includes('email_address_invalid')) {
        throw new Error('유효하지 않은 이메일 주소입니다.')
      } else if (error.message?.includes('weak_password')) {
        throw new Error('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.')
      } else if (error.message?.includes('signup_disabled')) {
        throw new Error('현재 회원가입이 비활성화되어 있습니다. 관리자에게 문의해주세요.')
      }
      
      throw error
    }
    
    console.log('✅ SignUp 성공:', data.user?.email)

    // 기본 프로필만 생성 (tenant_id는 온보딩에서 설정)
    if (data.user) {
      try {
        console.log('🔄 기본 사용자 프로필 생성 중...')

        // 안전한 프로필 생성 (최소 필수 필드만 사용)
        const profileData = {
          id: data.user.id,
          email: email,
          name: full_name || email.split('@')[0] || 'User'
          // role과 status는 DB 기본값 사용 (안전성 확보)
          // tenant_id도 null로 유지 (온보딩에서 설정)
        }
        
        console.log('🔄 프로필 생성 데이터:', profileData)

        const { data: insertData, error: profileError } = await this.supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
        
        if (profileError) {
          // 모든 에러 속성을 확인해보자
          console.error('🚨 사용자 프로필 생성 오류 (상세):', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
            stack: profileError.stack,
            fullError: JSON.stringify(profileError, null, 2)
          })
          
          // PostgreSQL 에러 코드 확인
          if (profileError.code === '23502') {
            throw new Error('필수 필드가 누락되었습니다. 관리자에게 문의해주세요.')
          } else if (profileError.code === '23505') {
            throw new Error('이미 존재하는 사용자입니다.')
          } else if (profileError.code === '23503') {
            throw new Error('데이터 참조 오류가 발생했습니다.')
          }
          
          // 사용자에게 던질 에러
          throw new Error(`프로필 생성 실패: ${profileError.message || profileError.code || 'Unknown error'}`)
        } else {
          console.log('✅ 기본 사용자 프로필 생성 성공:', insertData?.[0]?.email)
        }
      } catch (profileError: unknown) {
        console.error('🚨 사용자 프로필 생성 예외 (상세):', {
          name: profileError instanceof Error ? profileError.name : 'Unknown',
          message: profileError instanceof Error ? profileError.message : String(profileError),
          stack: profileError instanceof Error ? profileError.stack : undefined,
          constructor: profileError instanceof Error ? profileError.constructor.name : 'Unknown',
          keys: typeof profileError === 'object' && profileError ? Object.keys(profileError) : [],
          stringified: JSON.stringify(profileError, undefined, 2)
        })
        
        // 사용자에게 던질 에러
        throw new Error(`프로필 생성 예외: ${profileError instanceof Error ? profileError.message : String(profileError)}`)
      }
    }

    return data
  }

  async signIn({ email, password }: SignInData) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
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
    const { error } = await this.supabase.auth.updateUser({
      password
    })

    if (error) throw error
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) throw error
    return user
  }

  async getCurrentSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    if (error) throw error
    return session
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    console.log('🔍 사용자 프로필 조회 중...', user.email)

    const { data, error } = await this.supabase
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
      email: data.email,
      name: data.name,
      tenant: data.tenants?.name || '시스템 관리자',
      role: data.role || '없음',
      status: data.status
    })

    return data
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authClient = new AuthClient()