import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'
  const error = searchParams.get('error')
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')

  // URL에서 이미 에러가 있는 경우 (OTP 만료 등)
  if (error) {
    console.error('Auth URL error:', { error, error_code, error_description })
    const errorParams = new URLSearchParams()
    errorParams.set('error', error)
    if (error_code) errorParams.set('error_code', error_code)
    if (error_description) errorParams.set('error_description', error_description)
    
    return NextResponse.redirect(`${origin}/auth/login?${errorParams.toString()}`)
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      // 이메일 인증 성공 - 로그인 페이지로 성공 메시지와 함께 리다이렉트
      return NextResponse.redirect(`${origin}/auth/login?message=email_confirmed`)
    } else {
      console.error('Auth callback error:', exchangeError)
      // 에러가 있는 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  // code가 없는 경우 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/login`)
}