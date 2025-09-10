/**
 * Enhanced Middleware with Navigation System v3.0
 * @description 온보딩 플로우 및 status 기반 리다이렉트 시스템
 * @version v3.0 - 온보딩/승인 대기 플로우 추가
 * @since 2025-09-10
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

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
 * 업계 표준 미들웨어 - 온보딩/승인 대기 플로우 포함
 */
export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname
  const requestId = Math.random().toString(36).substring(7)
  
  // 디버깅 모드 확인
  const debugMode = process.env.NAVIGATION_DEBUG === 'true'
  
  if (debugMode) {
    console.log(`🛡️ [MIDDLEWARE-${requestId}] Request:`, {
      method: request.method,
      path: currentPath
    })
  }

  // 1. 정적 파일 및 제외 경로 체크
  if (shouldSkipMiddleware(currentPath)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 2. 인증이 필요 없는 페이지들 (회원가입, 로그인, 콜백 등)
  const publicPaths = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/reset-password']
  if (publicPaths.includes(currentPath)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 3. 온보딩/승인 대기 페이지는 직접 접근 허용
  const onboardingPaths = ['/onboarding', '/pending-approval']
  if (onboardingPaths.includes(currentPath)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 4. 인증 상태 및 프로필 확인 (보호된 라우트)
  const protectedPaths = ['/main', '/admin', '/classes', '/students', '/settings']
  const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path))
  
  if (isProtectedPath) {
    try {
      const { supabase, response } = createClient(request)
      
      // 사용자 세션 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        if (debugMode) {
          console.log(`🔒 [MIDDLEWARE-${requestId}] 인증 필요:`, currentPath)
        }
        // 로그인 페이지로 리다이렉트
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('next', currentPath)
        return NextResponse.redirect(redirectUrl)
      }

      // 사용자 프로필 확인
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, status, tenant_id, role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        if (debugMode) {
          console.log(`❌ [MIDDLEWARE-${requestId}] 프로필 조회 실패:`, profileError)
        }
        // 프로필이 없으면 로그인 페이지로
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        return NextResponse.redirect(redirectUrl)
      }

      if (debugMode) {
        console.log(`👤 [MIDDLEWARE-${requestId}] 사용자 상태:`, {
          status: profile.status,
          hasTenant: !!profile.tenant_id,
          role: profile.role,
          currentPath
        })
      }

      // 5. Status 기반 리다이렉트 로직 (업계 표준)
      
      // 온보딩이 필요한 경우 (pending_approval + tenant_id 없음)
      if (profile.status === 'pending_approval' && !profile.tenant_id) {
        if (currentPath !== '/onboarding') {
          if (debugMode) {
            console.log(`🎯 [MIDDLEWARE-${requestId}] 온보딩 필요 → /onboarding 리다이렉트`)
          }
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/onboarding'
          return NextResponse.redirect(redirectUrl)
        }
      }
      
      // 승인 대기 중인 경우 (pending_approval + tenant_id 있음)
      else if (profile.status === 'pending_approval' && profile.tenant_id) {
        if (currentPath !== '/pending-approval') {
          if (debugMode) {
            console.log(`⏳ [MIDDLEWARE-${requestId}] 승인 대기 → /pending-approval 리다이렉트`)
          }
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/pending-approval'
          return NextResponse.redirect(redirectUrl)
        }
      }
      
      // 비활성/정지 상태
      else if (profile.status === 'inactive' || profile.status === 'suspended') {
        if (debugMode) {
          console.log(`🚫 [MIDDLEWARE-${requestId}] 계정 ${profile.status} 상태`)
        }
        // 계정 상태 페이지로 리다이렉트 (추후 구현)
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('error', `account_${profile.status}`)
        return NextResponse.redirect(redirectUrl)
      }
      
      // 활성 사용자는 정상 진행
      else if (profile.status === 'active') {
        // 정상 진행
        return applySecurityHeaders(response)
      }

    } catch (error) {
      if (debugMode) {
        console.error(`❌ [MIDDLEWARE-${requestId}] 오류:`, error)
      }
      // 오류 시 기본 응답
      return applySecurityHeaders(NextResponse.next())
    }
  }

  // 6. 기본 응답 (보안 헤더 적용)
  if (debugMode) {
    console.log(`✅ [MIDDLEWARE-${requestId}] 기본 처리:`, currentPath)
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