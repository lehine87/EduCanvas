import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin, hash } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'
  const error = searchParams.get('error')
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')
  const type = searchParams.get('type') // recovery, signup 등
  
  // URL 해시에서 토큰 추출 (백업 감지 로직)
  let access_token: string | null = null
  let refresh_token: string | null = null
  
  if (hash && hash.includes('access_token=')) {
    const hashParams = new URLSearchParams(hash.replace('#', ''))
    access_token = hashParams.get('access_token')
    refresh_token = hashParams.get('refresh_token')
    
    console.log('🔍 [AUTH-CALLBACK] 해시에서 토큰 감지:', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token
    })
  }
  
  // 🔍 디버깅: URL 파라미터 전체 구조 로깅
  console.log('🔍 [AUTH-CALLBACK] URL 파라미터 분석:', {
    fullUrl: request.url,
    searchParams: Object.fromEntries(searchParams.entries()),
    hash: hash,
    code: code ? 'present' : 'missing',
    access_token: access_token ? 'present' : 'missing',
    refresh_token: refresh_token ? 'present' : 'missing',
    next: next,
    type: type,
    error: error,
    error_code: error_code,
    error_description: error_description
  })
  
  // 비밀번호 재설정 감지 로직 (다중 조건 검사)
  const isPasswordReset = (
    next === '/auth/update-password' ||
    type === 'recovery' ||
    searchParams.has('type') && searchParams.get('type') === 'recovery'
  )
  
  console.log('🔑 [AUTH-CALLBACK] 비밀번호 재설정 감지:', {
    isPasswordReset,
    nextParam: next,
    typeParam: type,
    hasRecoveryType: searchParams.get('type') === 'recovery'
  })

  // URL에서 이미 에러가 있는 경우 (OTP 만료 등)
  if (error) {
    console.error('🚨 [AUTH-CALLBACK] URL 에러:', { error, error_code, error_description, isPasswordReset })
    const errorParams = new URLSearchParams()
    errorParams.set('error', error)
    if (error_code) errorParams.set('error_code', error_code)
    if (error_description) errorParams.set('error_description', error_description)
    
    // 비밀번호 재설정 관련 에러인 경우 적절한 페이지로 리다이렉트
    if (isPasswordReset) {
      console.log('🔄 [AUTH-CALLBACK] 비밀번호 재설정 에러 → reset-password 페이지로 리다이렉트')
      return NextResponse.redirect(`${origin}/auth/reset-password?${errorParams.toString()}`)
    }
    
    return NextResponse.redirect(`${origin}/auth/login?${errorParams.toString()}`)
  }

  // 코드나 토큰이 있는 경우 세션 처리
  if (code || access_token) {
    const supabase = await createClient()
    console.log('🔑 [AUTH-CALLBACK] 세션 처리 시도 중...', { 
      hasCode: !!code, 
      hasAccessToken: !!access_token,
      isPasswordReset 
    })
    
    let sessionError: Error | null = null
    
    // 코드 기반 세션 교환 우선 시도
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      sessionError = exchangeError
    }
    // 해시 토큰 기반 세션 설정 (백업)
    else if (access_token) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || ''
      })
      sessionError = setSessionError
    }
    
    if (!sessionError) {
      // 비밀번호 재설정 링크인 경우 update-password 페이지로 이동
      if (isPasswordReset) {
        console.log('✅ [AUTH-CALLBACK] 비밀번호 재설정 세션 처리 성공 → update-password 페이지로 이동')
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      
      // 이메일 인증 성공 - 로그인 페이지로 성공 메시지와 함께 리다이렉트
      console.log('✅ [AUTH-CALLBACK] 일반 이메일 인증 성공 → 로그인 페이지로 이동')
      return NextResponse.redirect(`${origin}/auth/login?message=email_confirmed`)
    } else {
      console.error('🚨 [AUTH-CALLBACK] 세션 처리 실패:', { 
        error: sessionError.message, 
        isPasswordReset,
        code: 'status' in sessionError ? sessionError.status : 'unknown',
        method: code ? 'code_exchange' : 'token_set'
      })
      
      // 비밀번호 재설정 관련 에러인 경우 적절한 페이지로 리다이렉트
      if (isPasswordReset) {
        console.log('🔄 [AUTH-CALLBACK] 비밀번호 재설정 세션 처리 실패 → reset-password 페이지로 리다이렉트')
        return NextResponse.redirect(`${origin}/auth/reset-password?error=callback_error&error_description=${encodeURIComponent('링크가 만료되었거나 이미 사용되었습니다')}`)
      }
      
      // 에러가 있는 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  // 코드나 토큰이 없는 경우 적절한 페이지로 리다이렉트
  console.log('🚨 [AUTH-CALLBACK] 코드/토큰 없음:', { 
    isPasswordReset, 
    hasError: !!error,
    hasCode: !!code,
    hasToken: !!access_token
  })
  
  if (isPasswordReset) {
    console.log('🔄 [AUTH-CALLBACK] 비밀번호 재설정 인증 정보 없음 → reset-password 페이지로 리다이렉트')
    return NextResponse.redirect(`${origin}/auth/reset-password?error=no_auth&error_description=${encodeURIComponent('잘못된 링크입니다')}`)
  }
  
  return NextResponse.redirect(`${origin}/auth/login`)
}