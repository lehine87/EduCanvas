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

  // 전역 Rate Limiting (DDoS 방지)
  if (process.env.NODE_ENV === 'production') {
    const globalRateLimit = rateLimiter.checkAndRecord(
      `global:${clientIP}`,
      60, // 분당 60회
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

  // Supabase 쿠키 기반 인증 확인
  let isAuthenticated = false
  try {
    const cookies = request.headers.get('cookie')
    
    if (cookies) {
      // Supabase의 실제 쿠키 패턴들 확인
      // sb-{project-ref}-auth-token (access token)
      // sb-{project-ref}-auth-token-code-verifier 
      // sb-{project-ref}-auth-refresh-token (refresh token)
      const supabaseCookiePatterns = [
        /sb-[a-zA-Z0-9]+-auth-token(?:-code-verifier)?=/,
        /sb-[a-zA-Z0-9]+-auth-refresh-token=/
      ]
      
      const hasValidSupabaseCookie = supabaseCookiePatterns.some(pattern => 
        pattern.test(cookies)
      )
      
      if (hasValidSupabaseCookie) {
        isAuthenticated = true
        console.log('✅ 유효한 Supabase 인증 쿠키 발견')
      } else {
        console.log('❌ 유효한 Supabase 인증 쿠키 없음')
      }
      
      console.log('🔍 쿠키 상세 분석:', {
        hasCookies: true,
        cookieNames: cookies.split(';').map(c => c.split('=')[0]?.trim() || ''),
        hasValidSupabaseCookie,
        isAuthenticated
      })
    } else {
      console.log('❌ 쿠키 없음')
    }
  } catch (error) {
    console.error('❌ 인증 확인 예외:', error)
    isAuthenticated = false
  }

  const url = request.nextUrl.clone()
  
  // 정적 파일과 API 라우트는 건너뛰기
  const isStaticOrApi = 
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/test-') ||
    request.nextUrl.pathname.startsWith('/debug-') ||
    request.nextUrl.pathname.startsWith('/seed-') ||
    request.nextUrl.pathname.startsWith('/design-system-test')

  if (isStaticOrApi) {
    const securedResponse = NextResponse.next()
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      securedResponse.headers.set(key, value)
    })
    return securedResponse
  }

  // 경로 분석
  const protectedPaths = ['/admin', '/onboarding', '/pending-approval', '/system-admin', '/tenant-admin']
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path))
  
  const authPaths = ['/auth']
  const isAuthPath = authPaths.some(path => url.pathname.startsWith(path))

  // 보호된 경로에 인증되지 않은 사용자가 접근하는 경우
  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', url.pathname)
    return Response.redirect(redirectUrl.toString())
  }

  // 인증된 사용자가 auth 페이지에 접근하는 경우
  if (isAuthPath && isAuthenticated) {
    const next = url.searchParams.get('next')
    const error = url.searchParams.get('error')
    
    // 에러 상태인 경우 리다이렉트하지 않고 로그인 페이지 유지
    if (error === 'profile-error' || error === 'account-suspended') {
      const securedResponse = NextResponse.next()
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        securedResponse.headers.set(key, value)
      })
      return securedResponse
    }
    
    // 안전한 리다이렉트 경로 검증
    let redirectPath = next || '/admin'
    const dangerousPaths = ['/auth/login', '/auth/signup', '/auth/reset-password']
    
    if (next && (!next.startsWith('/') || dangerousPaths.includes(next))) {
      redirectPath = '/admin'
    }
    
    if (redirectPath === url.pathname) {
      redirectPath = '/admin'
    }
    
    const redirectUrl = new URL(redirectPath, request.url)
    return Response.redirect(redirectUrl.toString())
  }

  // 기본 접근 제어 (세부 권한은 각 페이지에서 처리)
  // 에러 상태인 경우 정상 진행
  if (isProtectedPath && isAuthenticated) {
    const hasError = url.searchParams.get('error')
    if (hasError) {
      // 에러 상태에서는 통과 (각 페이지에서 에러 처리)
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