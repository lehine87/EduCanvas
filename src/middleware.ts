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

  // 사용자 인증 확인 (보안 강화)
  let user
  try {
    const { data: { user: authenticatedUser }, error } = await supabase.auth.getUser()
    if (error) {
      console.warn('인증 확인 실패:', error.message)
      user = null
    } else {
      user = authenticatedUser
    }
  } catch (error) {
    console.error('사용자 인증 예외:', error)
    user = null
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
  
  const isAuthenticated = !!user

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

  // 역할 기반 접근 제어 (간소화 - 리다이렉트 루프 방지)
  if (isProtectedPath && isAuthenticated) {
    try {
      // 에러 상태인 경우 프로필 검증 스킵
      const hasProfileError = url.searchParams.get('error') === 'profile-error'
      const hasAccountSuspended = url.searchParams.get('error') === 'account-suspended'
      
      if (hasProfileError || hasAccountSuspended) {
        const securedResponse = NextResponse.next()
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          securedResponse.headers.set(key, value)
        })
        return securedResponse
      }

      // 간단한 프로필 확인 (타임아웃 설정)
      if (!user) {
        const securedResponse = NextResponse.next()
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          securedResponse.headers.set(key, value)
        })
        return securedResponse
      }

      const profilePromise = supabase
        .from('user_profiles')
        .select('role, status, tenant_id')
        .eq('id', user.id)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
      )

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]).catch((error: unknown) => {
        return { data: null, error }
      })

      // 프로필 조회 실패 시 기본 접근 허용 (리다이렉트 루프 방지)
      if (profileError || !profile) {
        const securedResponse = NextResponse.next()
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          securedResponse.headers.set(key, value)
        })
        return securedResponse
      }

      // 비활성 사용자만 차단
      if (profile.status === 'inactive') {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('error', 'account-suspended')
        return Response.redirect(redirectUrl.toString())
      }

      // system-admin 경로 권한 체크
      if (url.pathname.startsWith('/system-admin') && profile.role !== 'system_admin') {
        const redirectUrl = new URL('/unauthorized', request.url)
        return Response.redirect(redirectUrl.toString())
      }

    } catch (error: unknown) {
      // 예외 발생 시 기본 접근 허용
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