/**
 * Enhanced Middleware with Navigation System v2.0
 * @description 제로베이스 리디렉션 시스템 기반 간소화된 미들웨어
 * @version v2.0 - NavigationController 통합
 * @since 2025-08-15
 */

import { NextRequest, NextResponse } from 'next/server'
// 1단계에서는 복잡한 의존성 제거
// import { rateLimiter, getClientIP, createRateLimitResponse } from '@/lib/auth/rateLimiter'
// import { navigationController } from '@/lib/navigation'
// import type { NavigationContext } from '@/types/navigation.types'

/**
 * 미들웨어 제외 패턴들
 */
const MIDDLEWARE_EXCLUDE_PATTERNS = [
  '/_next',
  '/api',
  '/monitoring',
  '/test',  // 테스트 페이지 인증 우회
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
 * 간소화된 미들웨어 - 1단계: 보안 헤더만 적용
 */
export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname
  const requestId = Math.random().toString(36).substring(7)
  
  // 디버깅 모드 확인
  const debugMode = process.env.NAVIGATION_DEBUG === 'true'
  
  if (debugMode) {
    console.log(`🛡️ [MIDDLEWARE-${requestId}] Simple Request:`, {
      method: request.method,
      path: currentPath
    })
  }

  // 1. 정적 파일 및 제외 경로 체크
  if (shouldSkipMiddleware(currentPath)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 2. 보안 헤더만 적용하고 통과
  if (debugMode) {
    console.log(`✅ [MIDDLEWARE-${requestId}] Security headers applied:`, currentPath)
  }
  
  return applySecurityHeaders(NextResponse.next())
}

// 1단계: 보안 헤더만 활성화 (정적 파일 제외)
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청에 적용:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - test 페이지들
     */
    '/((?!api|_next/static|_next/image|favicon.ico|test).*)',
  ],
}