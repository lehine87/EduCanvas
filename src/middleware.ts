import { createClient } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, getClientIP, createRateLimitResponse } from '@/lib/auth/rateLimiter'

// 보안 헤더 설정
const SECURITY_HEADERS = {
  // XSS 보호
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS 강제 (운영환경)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // 콘텐츠 보안 정책
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://hodkqpmukwfrreozwmcy.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://hodkqpmukwfrreozwmcy.supabase.co wss://hodkqpmukwfrreozwmcy.supabase.co",
    "frame-src 'none'"
  ].join('; '),
  
  // Referrer 정책
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // 권한 정책
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

export async function middleware(request: NextRequest) {
  const clientIP = getClientIP(request)
  const { supabase, response } = createClient(request)
  
  // 🔍 상세 디버깅 로그 (리다이렉트 루프 분석용)
  console.log('🔍 Middleware 시작:', {
    method: request.method,
    path: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
    referer: request.headers.get('referer'),
    timestamp: new Date().toISOString()
  })

  // 전역 Rate Limiting (DDoS 방지 - 리다이렉트 루프 해결까지 일시 완화)
  if (process.env.NODE_ENV === 'production') {
    const globalRateLimit = rateLimiter.checkAndRecord(
      `global:${clientIP}`,
      300, // 분당 300회로 일시 완화 (리다이렉트 루프 대응)
      60 * 1000, // 1분 윈도우
      5 * 60 * 1000 // 5분 차단
    )

    if (!globalRateLimit.allowed) {
      console.warn('🚨 전역 Rate limit 초과:', { 
        ip: clientIP, 
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer')
      })
      return createRateLimitResponse(
        globalRateLimit.retryAfter!,
        '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }
  }

  // 세션 새로고침 (중요: 만료된 토큰 자동 갱신)
  let session
  try {
    const sessionResult = await supabase.auth.getSession()
    session = sessionResult.data.session
    console.log('🔐 세션 확인 결과:', {
      hasSession: !!session,
      userId: session?.user?.id?.substring(0, 8) + '...',
      email: session?.user?.email,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      isExpired: session?.expires_at ? (session.expires_at * 1000) <= Date.now() : null
    })
  } catch (error) {
    console.error('🚨 세션 확인 실패:', error)
    session = null
  }

  const url = request.nextUrl.clone()
  
  // 정적 파일과 API 라우트는 건너뛰기
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/test-') || // 개발용 페이지들
    request.nextUrl.pathname.startsWith('/debug-') ||
    request.nextUrl.pathname.startsWith('/seed-') ||
    request.nextUrl.pathname.startsWith('/design-system-test')
  ) {
    // 보안 헤더를 API/정적 파일에도 적용
    const securedResponse = NextResponse.next()
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      securedResponse.headers.set(key, value)
    })
    return securedResponse
  }

  // 인증이 필요한 경로들
  const protectedPaths = ['/admin', '/onboarding', '/pending-approval', '/system-admin', '/tenant-admin']
  const isProtectedPath = protectedPaths.some(path => 
    url.pathname.startsWith(path)
  )

  // 인증 페이지들
  const authPaths = ['/auth']
  const isAuthPath = authPaths.some(path => 
    url.pathname.startsWith(path)
  )

  // 세션 유효성 추가 검증
  const isSessionValid = session && session.expires_at && 
    (session.expires_at * 1000) > Date.now()

  // 보호된 경로에 인증되지 않은 사용자가 접근하는 경우
  if (isProtectedPath && (!session || !isSessionValid)) {
    console.log('🚨 인증되지 않은 접근:', { path: url.pathname, hasSession: !!session, isValid: isSessionValid })
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', url.pathname)
    
    // 만료된 세션의 경우 추가 매개변수
    if (session && !isSessionValid) {
      redirectUrl.searchParams.set('reason', 'expired')
    }
    
    return Response.redirect(redirectUrl.toString())
  }

  // 인증된 사용자가 auth 페이지에 접근하는 경우
  if (isAuthPath && session && isSessionValid) {
    const next = url.searchParams.get('next')
    const error = url.searchParams.get('error')
    const retry = url.searchParams.get('retry')
    
    console.log('🔄 인증된 사용자의 auth 페이지 접근:', {
      currentPath: url.pathname,
      next,
      error,
      retry,
      userEmail: session.user?.email
    })
    
    // 에러 상태인 경우 리다이렉트하지 않고 로그인 페이지 유지
    if (error === 'profile-error' || error === 'account-suspended') {
      console.log('⚠️ 에러 상태로 로그인 페이지 유지:', { error, retry })
      const securedResponse = NextResponse.next()
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        securedResponse.headers.set(key, value)
      })
      return securedResponse
    }
    
    // 안전한 리다이렉트 경로 검증 (무한 루프 방지)
    let redirectPath = next || '/admin'
    
    // 위험한 리다이렉트 경로들을 필터링
    const dangerousPaths = ['/auth/login', '/auth/signup', '/auth/reset-password']
    if (next && (!next.startsWith('/') || dangerousPaths.includes(next))) {
      console.log('🚨 위험한 리다이렉트 경로 차단:', next)
      redirectPath = '/admin'
    }
    
    // 현재 경로와 동일한 리다이렉트 방지
    if (redirectPath === url.pathname) {
      console.log('🚨 자기 자신으로의 리다이렉트 방지')
      redirectPath = '/admin'
    }
    
    console.log('✅ 인증된 사용자 안전 리다이렉트:', { 
      from: url.pathname, 
      to: redirectPath,
      originalNext: next,
      reason: '인증된 사용자가 auth 페이지 접근'
    })
    
    const redirectUrl = new URL(redirectPath, request.url)
    return Response.redirect(redirectUrl.toString())
  }

  // 역할 기반 접근 제어 (추가 보안)
  if (isProtectedPath && session && isSessionValid) {
    try {
      // 리다이렉트 루프 방지: 이미 에러가 있는 경우 스킵
      const hasProfileError = url.searchParams.get('error') === 'profile-error'
      const hasAccountSuspended = url.searchParams.get('error') === 'account-suspended'
      
      if (hasProfileError || hasAccountSuspended) {
        console.log('⚠️ 프로필 에러 상태로 프로필 검증 스킵:', url.searchParams.get('error'))
        // 에러 상태에서는 프로필 검증을 스킵하여 무한 루프 방지
        const securedResponse = NextResponse.next()
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          securedResponse.headers.set(key, value)
        })
        return securedResponse
      }

      // 프로필 확인 타임아웃 설정 (3초)
      const profilePromise = supabase
        .from('user_profiles')
        .select('role, status, tenant_id')
        .eq('id', session.user.id)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      )

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]).catch((error: unknown) => {
        console.warn('⏰ 프로필 조회 타임아웃 또는 실패:', error)
        return { data: null, error }
      })

      // 프로필이 없거나 조회 실패 시 기본 접근 허용 (리다이렉트 루프 방지)
      if (profileError || !profile) {
        console.warn('⚠️ 프로필 조회 실패 - 기본 접근 허용 (무한 루프 방지):', { 
          userId: session.user.id, 
          email: session.user.email,
          error: profileError,
          currentPath: url.pathname,
          decision: '기본 접근 허용'
        })
        
        // 리다이렉트 루프 방지를 위해 모든 인증된 사용자에게 기본 접근 허용
        // 실제 권한 체크는 각 페이지 컴포넌트에서 수행
        const securedResponse = NextResponse.next()
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          securedResponse.headers.set(key, value)
        })
        return securedResponse
      }

      // 비활성 사용자 차단
      if (profile.status === 'inactive') {
        console.warn('🚨 비활성 사용자 접근:', { userId: session.user.id, status: profile.status })
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('error', 'account-suspended')
        return Response.redirect(redirectUrl.toString())
      }

      // system-admin 경로는 system_admin 역할만 접근 가능
      if (url.pathname.startsWith('/system-admin') && profile.role !== 'system_admin') {
        console.warn('🚨 권한 없는 시스템 관리자 페이지 접근:', { 
          userId: session.user.id, 
          role: profile.role 
        })
        const redirectUrl = new URL('/unauthorized', request.url)
        return Response.redirect(redirectUrl.toString())
      }

      console.log('✅ 프로필 검증 성공:', { 
        userId: session.user.id, 
        role: profile.role, 
        status: profile.status 
      })

    } catch (error: unknown) {
      console.error('🚨 프로필 확인 예외 - 기본 접근 허용 (무한 루프 방지):', {
        error,
        userId: session.user.id,
        email: session.user.email,
        currentPath: url.pathname,
        decision: '기본 접근 허용'
      })
      
      // 예외 상황에서는 모든 인증된 사용자에게 기본 접근 허용 (리다이렉트 루프 방지)
      // 실제 권한 체크는 각 페이지 컴포넌트에서 수행
      const securedResponse = NextResponse.next()
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        securedResponse.headers.set(key, value)
      })
      return securedResponse
    }
  }

  // 보안 헤더 적용
  const securedResponse = NextResponse.next()
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    securedResponse.headers.set(key, value)
  })

  // 개발 환경에서는 CSP 완화
  if (process.env.NODE_ENV === 'development') {
    securedResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://hodkqpmukwfrreozwmcy.supabase.co wss://hodkqpmukwfrreozwmcy.supabase.co http://localhost:* ws://localhost:*"
    )
  }

  return securedResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|ico|json)$).*)',
  ],
}