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

  // 전역 Rate Limiting (DDoS 방지 - 개발환경에서는 완화)
  if (process.env.NODE_ENV === 'production') {
    const globalRateLimit = rateLimiter.checkAndRecord(
      `global:${clientIP}`,
      60, // 분당 60회
      60 * 1000, // 1분 윈도우
      5 * 60 * 1000 // 5분 차단
    )

    if (!globalRateLimit.allowed) {
      console.warn('🚨 전역 Rate limit 초과:', { ip: clientIP, path: request.nextUrl.pathname })
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
    const redirectUrl = new URL(next || '/admin', request.url)
    return Response.redirect(redirectUrl.toString())
  }

  // 역할 기반 접근 제어 (추가 보안)
  if (isProtectedPath && session && isSessionValid) {
    try {
      // 사용자 프로필 확인 (선택적 - 성능상 캐시된 정보 사용 권장)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, status, tenant_id')
        .eq('id', session.user.id)
        .single()

      // 비활성 사용자 차단
      if (profile?.status === 'suspended' || profile?.status === 'deleted') {
        console.warn('🚨 비활성 사용자 접근:', { userId: session.user.id, status: profile.status })
        const redirectUrl = new URL('/auth/login?error=account-suspended', request.url)
        return Response.redirect(redirectUrl.toString())
      }

      // system-admin 경로는 system_admin 역할만 접근 가능
      if (url.pathname.startsWith('/system-admin') && profile?.role !== 'system_admin') {
        console.warn('🚨 권한 없는 시스템 관리자 페이지 접근:', { 
          userId: session.user.id, 
          role: profile?.role 
        })
        const redirectUrl = new URL('/unauthorized', request.url)
        return Response.redirect(redirectUrl.toString())
      }
    } catch (error) {
      console.error('🚨 프로필 확인 실패:', error)
      // 프로필 확인 실패 시 로그인 페이지로 리다이렉트
      const redirectUrl = new URL('/auth/login?error=profile-error', request.url)
      return Response.redirect(redirectUrl.toString())
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