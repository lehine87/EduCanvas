import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signInSchema } from '@/lib/auth/authValidation'
import { rateLimiter, RATE_LIMIT_CONFIG, getClientIP, createRateLimitResponse } from '@/lib/auth/rateLimiter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientIP = getClientIP(request)
    
    // Rate limiting 검사 (IP 기반)
    const rateLimitCheck = rateLimiter.checkAndRecord(
      `login:${clientIP}`,
      RATE_LIMIT_CONFIG.LOGIN.maxAttempts,
      RATE_LIMIT_CONFIG.LOGIN.windowMs,
      RATE_LIMIT_CONFIG.LOGIN.blockDurationMs
    )
    
    if (!rateLimitCheck.allowed) {
      console.warn('🚨 로그인 Rate limit 초과:', { ip: clientIP, retryAfter: rateLimitCheck.retryAfter })
      return createRateLimitResponse(
        rateLimitCheck.retryAfter!,
        '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }
    
    // 입력값 검증
    const validationResult = signInSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      )
    }
    
    const { email, password } = validationResult.data
    
    // 이메일 기반 추가 Rate limiting (더 엄격한 제한)
    const emailRateLimit = rateLimiter.checkAndRecord(
      `login:email:${email}`,
      3, // 이메일당 3회만 허용
      RATE_LIMIT_CONFIG.LOGIN.windowMs,
      RATE_LIMIT_CONFIG.LOGIN.blockDurationMs
    )
    
    if (!emailRateLimit.allowed) {
      console.warn('🚨 이메일 기반 Rate limit 초과:', { email, retryAfter: emailRateLimit.retryAfter })
      return createRateLimitResponse(
        emailRateLimit.retryAfter!,
        '해당 계정으로 로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }
    
    const supabase = await createClient()
    
    // 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('🚨 로그인 실패:', error.message)
      
      // 특정 오류에 대한 사용자 친화적 메시지
      if (error.message?.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        )
      } else if (error.message?.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: '이메일 인증이 필요합니다. 이메일을 확인해주세요.' },
          { status: 401 }
        )
      } else if (error.message?.includes('Too many requests')) {
        return createRateLimitResponse(300, 'Supabase에서 너무 많은 요청이 감지되었습니다. 5분 후 다시 시도해주세요.')
      }
      
      return NextResponse.json(
        { error: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }
    
    // 로그인 성공 - Rate limit 기록 초기화
    rateLimiter.reset(`login:${clientIP}`)
    rateLimiter.reset(`login:email:${email}`)
    
    console.log('✅ 로그인 성공:', { email: data.user?.email })
    
    return NextResponse.json({ 
      message: '로그인되었습니다.',
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })
    
  } catch (error) {
    console.error('🚨 로그인 API 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}