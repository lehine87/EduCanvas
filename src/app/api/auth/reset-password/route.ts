import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '@/lib/auth/authValidation'
import { rateLimiter, RATE_LIMIT_CONFIG, getClientIP, createRateLimitResponse } from '@/lib/auth/rateLimiter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = getClientIP(request)
    
    // Rate limiting 검사 (IP 기반 - 비밀번호 재설정은 더 엄격)
    const rateLimitCheck = rateLimiter.checkAndRecord(
      `password-reset:${clientIP}`,
      RATE_LIMIT_CONFIG.PASSWORD_RESET.maxAttempts,
      RATE_LIMIT_CONFIG.PASSWORD_RESET.windowMs,
      RATE_LIMIT_CONFIG.PASSWORD_RESET.blockDurationMs
    )
    
    if (!rateLimitCheck.allowed) {
      console.warn('🚨 비밀번호 재설정 Rate limit 초과:', { ip: clientIP, retryAfter: rateLimitCheck.retryAfter })
      return createRateLimitResponse(
        rateLimitCheck.retryAfter!,
        '비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.'
      )
    }
    
    // 입력값 검증
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '올바른 이메일 주소를 입력하세요.' },
        { status: 400 }
      )
    }
    
    const { email } = validationResult.data
    
    // 이메일 기반 추가 Rate limiting (이메일당 1시간에 2회만 허용)
    const emailRateLimit = rateLimiter.checkAndRecord(
      `password-reset:email:${email}`,
      2,
      RATE_LIMIT_CONFIG.PASSWORD_RESET.windowMs,
      RATE_LIMIT_CONFIG.PASSWORD_RESET.blockDurationMs
    )
    
    if (!emailRateLimit.allowed) {
      console.warn('🚨 이메일별 비밀번호 재설정 Rate limit 초과:', { email, retryAfter: emailRateLimit.retryAfter })
      return createRateLimitResponse(
        emailRateLimit.retryAfter!,
        '해당 이메일로 비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.'
      )
    }
    
    const supabase = await createClient()
    
    // 먼저 해당 이메일이 실제로 등록된 사용자인지 확인 (선택적 - 보안을 위해)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('email, status')
      .eq('email', email)
      .single()
    
    // 사용자가 존재하지 않아도 동일한 응답 (보안: 이메일 enumeration 방지)
    
    // Supabase Auth로 비밀번호 재설정 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/update-password`,
    })
    
    if (error) {
      console.error('🚨 비밀번호 재설정 실패:', error.message)
      
      // Supabase 오류 처리
      if (error.message?.includes('Unable to validate email address')) {
        // 보안: 실제로는 등록되지 않은 이메일이라도 동일한 응답
        return NextResponse.json({ 
          message: '비밀번호 재설정 링크를 이메일로 보냈습니다.' 
        })
      } else if (error.message?.includes('For security purposes')) {
        return NextResponse.json(
          { error: '보안상의 이유로 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: '비밀번호 재설정 요청 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    console.log('✅ 비밀번호 재설정 이메일 발송 성공:', { email })
    
    // 보안: 성공/실패와 관계없이 동일한 응답 (이메일 enumeration 방지)
    return NextResponse.json({ 
      message: '비밀번호 재설정 링크를 이메일로 보냈습니다.' 
    })
    
  } catch (error) {
    console.error('🚨 비밀번호 재설정 API 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}