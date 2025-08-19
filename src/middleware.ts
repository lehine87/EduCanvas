/**
 * Enhanced Middleware with Navigation System v2.0
 * @description 제로베이스 리디렉션 시스템 기반 간소화된 미들웨어
 * @version v2.0 - NavigationController 통합
 * @since 2025-08-15
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, getClientIP, createRateLimitResponse } from '@/lib/auth/rateLimiter'
import { navigationController } from '@/lib/navigation'
import type { NavigationContext } from '@/types/navigation.types'

/**
 * 미들웨어 제외 패턴들
 */
const MIDDLEWARE_EXCLUDE_PATTERNS = [
  '/_next',
  '/api',
  '/monitoring',
  '/test-',
  '/debug-',
  '/seed-',
  '/design-system-test'
]

/**
 * 정적 파일 확장자 패턴
 */
const STATIC_FILE_EXTENSIONS = [
  'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 
  'css', 'js', 'woff', 'woff2', 'ttf', 'eot', 
  'ico', 'json', 'xml', 'txt'
]

/**
 * 보안 헤더 설정
 */
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

/**
 * 정적 파일 및 제외 경로 확인
 */
function shouldSkipMiddleware(pathname: string): boolean {
  // 제외 패턴 확인
  if (MIDDLEWARE_EXCLUDE_PATTERNS.some(pattern => pathname.startsWith(pattern))) {
    return true
  }
  
  // 정적 파일 확인
  const extension = pathname.split('.').pop()?.toLowerCase()
  if (extension && STATIC_FILE_EXTENSIONS.includes(extension)) {
    return true
  }
  
  return false
}

/**
 * 보안 헤더 적용
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // 개발 환경에서는 CSP 완화
  if (process.env.NODE_ENV === 'development') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://hodkqpmukwfrreozwmcy.supabase.co wss://hodkqpmukwfrreozwmcy.supabase.co http://localhost:* ws://localhost:*"
    )
  }
  
  return response
}

/**
 * 간소화된 미들웨어 - NavigationController 통합
 */
export async function middleware(request: NextRequest) {
  const clientIP = getClientIP(request)
  const currentPath = request.nextUrl.pathname
  const requestId = Math.random().toString(36).substring(7)
  
  // 디버깅 모드 확인 (환경변수로 명시적 활성화 시에만)
  const isProduction = process.env.NODE_ENV === 'production'
  const debugMode = process.env.NAVIGATION_DEBUG === 'true'
  
  if (debugMode) {
    console.log(`🛡️ [MIDDLEWARE-${requestId}] Request:`, {
      method: request.method,
      path: currentPath,
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })
  }

  // 1. 정적 파일 및 제외 경로 체크
  if (shouldSkipMiddleware(currentPath)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 2. Rate Limiting (DDoS 방지)
  if (isProduction) {
    const globalRateLimit = rateLimiter.checkAndRecord(
      `global:${clientIP}`,
      60, // 분당 60회
      60 * 1000, // 1분 윈도우
      5 * 60 * 1000 // 5분 차단
    )

    if (!globalRateLimit.allowed) {
      console.warn(`🚨 [MIDDLEWARE-${requestId}] Rate limit exceeded:`, { 
        ip: clientIP, 
        path: currentPath
      })
      return createRateLimitResponse(
        globalRateLimit.retryAfter!,
        '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }
  }

  // 3. NavigationController를 통한 중앙집중화된 리디렉션 체크
  try {
    const redirectionResult = await navigationController.checkRedirectForRequest(request)

    if (debugMode) {
      console.log(`🧭 [MIDDLEWARE-${requestId}] Navigation result:`, {
        shouldRedirect: redirectionResult.shouldRedirect,
        targetPath: redirectionResult.targetPath,
        reason: redirectionResult.reason,
        priority: redirectionResult.priority
      })
    }

    // 리디렉션이 필요한 경우
    if (redirectionResult.shouldRedirect && redirectionResult.targetPath) {
      const redirectUrl = new URL(redirectionResult.targetPath, request.url)
      
      // 현재 경로를 next 파라미터로 추가 (로그인의 경우)
      if (redirectionResult.targetPath.startsWith('/auth/login')) {
        redirectUrl.searchParams.set('next', currentPath)
      }
      
      if (debugMode) {
        console.log(`🔄 [MIDDLEWARE-${requestId}] Redirecting:`, {
          from: currentPath,
          to: redirectUrl.toString(),
          reason: redirectionResult.reason
        })
      }
      
      return Response.redirect(redirectUrl.toString())
    }

    // 리디렉션이 필요하지 않은 경우 - 정상 진행
    if (debugMode) {
      console.log(`✅ [MIDDLEWARE-${requestId}] Access granted:`, {
        path: currentPath,
        reason: redirectionResult.reason
      })
    }
    
    return applySecurityHeaders(NextResponse.next())

  } catch (error) {
    console.error(`❌ [MIDDLEWARE-${requestId}] Navigation error:`, error)
    
    // 에러 발생 시 안전한 기본 동작
    const errorUrl = new URL('/auth/login', request.url)
    errorUrl.searchParams.set('error', 'navigation-error')
    errorUrl.searchParams.set('next', currentPath)
    
    return Response.redirect(errorUrl.toString())
  }
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