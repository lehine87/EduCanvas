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
  
  // Vercel 환경에서만 상세 디버깅 (NODE_ENV production 체크)
  const isVercel = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
  const requestId = Math.random().toString(36).substring(7)
  
  if (isVercel) {
    console.log(`🚀 [VERCEL-${requestId}] REQUEST:`, {
      method: request.method,
      path: request.nextUrl.pathname,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })
  }

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
      const supabaseCookiePatterns = [
        /sb-[a-zA-Z0-9]+-auth-token(?:-code-verifier)?=/,
        /sb-[a-zA-Z0-9]+-auth-refresh-token=/
      ]
      
      const hasValidSupabaseCookie = supabaseCookiePatterns.some(pattern => 
        pattern.test(cookies)
      )
      
      if (hasValidSupabaseCookie) {
        isAuthenticated = true
      }
      
      if (isVercel) {
        console.log(`🔍 [VERCEL-${requestId}] AUTH CHECK:`, {
          hasCookies: !!cookies,
          cookieNames: cookies.split(';').map(c => c.split('=')[0]?.trim() || ''),
          hasValidSupabaseCookie,
          isAuthenticated,
          fullCookieString: cookies.substring(0, 200) + '...', // 쿠키 내용 일부 확인
          supabaseCookiePatterns: supabaseCookiePatterns.map(p => p.source) // 패턴 확인
        })
      }
    }
  } catch (error) {
    if (isVercel) {
      console.error(`❌ [VERCEL-${requestId}] AUTH ERROR:`, error)
    }
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
    
    if (isVercel) {
      console.log(`🔄 [VERCEL-${requestId}] REDIRECT TO LOGIN:`, {
        reason: '인증되지 않은 보호된 경로 접근',
        from: url.pathname,
        to: redirectUrl.toString()
      })
    }
    
    return Response.redirect(redirectUrl.toString())
  }

  // 인증된 사용자가 auth 페이지에 접근하는 경우
  if (isAuthPath && isAuthenticated) {
    const next = url.searchParams.get('next')
    const error = url.searchParams.get('error')
    
    if (isVercel) {
      console.log(`🔄 [VERCEL-${requestId}] AUTH PAGE ACCESS:`, {
        path: url.pathname,
        next,
        error,
        isAuthenticated
      })
    }
    
    // 에러 상태인 경우 리다이렉트하지 않고 로그인 페이지 유지
    if (error === 'profile-error' || error === 'account-suspended') {
      if (isVercel) {
        console.log(`⚠️ [VERCEL-${requestId}] KEEP AUTH PAGE:`, { error })
      }
      
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
      if (isVercel) {
        console.log(`🚨 [VERCEL-${requestId}] DANGEROUS PATH BLOCKED:`, { originalNext: next })
      }
    }
    
    if (redirectPath === url.pathname) {
      redirectPath = '/admin'
      if (isVercel) {
        console.log(`🚨 [VERCEL-${requestId}] SELF REDIRECT BLOCKED:`, { path: url.pathname })
      }
    }
    
    const redirectUrl = new URL(redirectPath, request.url)
    
    if (isVercel) {
      console.log(`🔄 [VERCEL-${requestId}] REDIRECT FROM AUTH:`, {
        from: url.pathname,
        to: redirectUrl.toString(),
        reason: '인증된 사용자가 auth 페이지 접근'
      })
    }
    
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

  // Vercel에서 패스스루 되는 경우 로깅
  if (isVercel) {
    console.log(`✅ [VERCEL-${requestId}] PASS THROUGH:`, {
      path: url.pathname,
      isAuthenticated,
      isProtectedPath,
      isAuthPath,
      reason: 'no redirect needed - normal page access'
    })
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