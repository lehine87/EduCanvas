import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/db/supabase'
import type { Database } from '@/types/database'
import { isSignupRequest, createErrorResponse } from '@/types'
import type { SignupRequest, SignupResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()

    // 타입 가드를 사용한 안전한 입력 검증
    if (!isSignupRequest(body)) {
      console.warn('⚠️ SignUp API 잘못된 요청 형식:', body)
      return createErrorResponse('필수 정보가 누락되었거나 형식이 올바르지 않습니다.', 400)
    }

    const { email, password, full_name }: SignupRequest = body

    console.log('🔐 SignUp API 시도:', { email, full_name })

    // 2. Service Role 클라이언트로 이메일 중복 검사
    const supabaseServiceRole = createServiceRoleClient()
    
    const { data: existingUser } = await supabaseServiceRole
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      console.warn('⚠️ 이미 등록된 이메일:', email)
      return createErrorResponse('이미 등록된 이메일입니다.', 409)
    }

    // 3. 일반 클라이언트로 Auth 회원가입
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=/onboarding`,
        data: {
          full_name
        }
      }
    })

    if (authError) {
      console.error('🚨 Auth SignUp 오류:', authError)
      
      // Supabase 특정 오류 메시지 변환
      if (authError.message?.includes('User already registered')) {
        return createErrorResponse('이미 등록된 이메일입니다.', 409)
      } else if (authError.message?.includes('Password should be')) {
        return createErrorResponse('비밀번호는 최소 8자 이상이어야 합니다.', 400)
      }
      
      return createErrorResponse(authError.message || '회원가입 중 오류가 발생했습니다.', 400)
    }

    if (!authData.user) {
      return createErrorResponse('사용자 생성에 실패했습니다.', 500)
    }

    // 4. Service Role로 user_profiles 생성
    console.log('🔄 Service Role로 사용자 프로필 생성 중...')
    
    const profileData = {
      id: authData.user.id,
      email: email,
      name: full_name || email.split('@')[0] || 'User',
      role: 'viewer',
      status: 'pending_approval' as Database['public']['Enums']['user_status'],
      tenant_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 프로필 생성 데이터:', profileData)

    const { data: profileInsertData, error: profileError } = await supabaseServiceRole
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) {
      console.error('🚨 프로필 생성 오류:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      
      // Auth 사용자는 생성되었으므로 프로필 생성 실패를 알리되
      // Auth 사용자는 삭제하지 않음 (이메일 인증 후 재시도 가능)
      return NextResponse.json(
        { 
          error: '프로필 생성에 실패했습니다. 관리자에게 문의해주세요.',
          details: profileError.message,
          userId: authData.user.id 
        },
        { status: 500 }
      )
    }

    console.log('✅ 사용자 프로필 생성 성공:', profileInsertData.email)

    const response: SignupResponse = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || email,
        name: profileInsertData.name
      },
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('🚨 SignUp API 예외:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '회원가입 처리 중 알 수 없는 오류가 발생했습니다.'
    
    return createErrorResponse(errorMessage, 500)
  }
}