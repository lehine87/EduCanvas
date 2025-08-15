import { createClient } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, getClientIP, createRateLimitResponse } from '@/lib/auth/rateLimiter'
import { ROUTE_PERMISSIONS } from '@/types/permissions.types'
import type { UserRole, UserProfile } from '@/types/auth.types'
import type { Database } from '@/types/database'
import { isUserProfile } from '@/types/typeGuards'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ================================================================
// 권한 검증 함수들
// ================================================================

/**
 * 경로에 대한 권한 체크
 */
async function checkRoutePermissions(
  pathname: string,
  userProfile: UserProfile | null,
  supabase: ReturnType<typeof createClient>['supabase'],
  requestId: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  // 정확한 경로 매칭
  let routeConfig = ROUTE_PERMISSIONS[pathname]
  
  // 동적 경로 처리 (예: /admin/students/[id])
  if (!routeConfig) {
    const dynamicRoutes = Object.keys(ROUTE_PERMISSIONS).filter(route => 
      route.includes('[') || route.includes('*')
    )
    
    for (const route of dynamicRoutes) {
      const pattern = route
        .replace(/\[.*?\]/g, '[^/]+')  // [id] → [^/]+
        .replace(/\*/g, '.*')          // * → .*
      
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(pathname)) {
        routeConfig = ROUTE_PERMISSIONS[route]
        break
      }
    }
  }
  
  // 라우트 설정이 없으면 허용 (기본 동작)
  if (!routeConfig) {
    return { hasAccess: true }
  }
  
  // 역할 기반 체크
  if (routeConfig.roles) {
    if (!userProfile?.role) {
      return { hasAccess: false, reason: 'no_role' }
    }
    
    if (!routeConfig.roles.includes(userProfile.role as UserRole)) {
      return { hasAccess: false, reason: 'insufficient_role' }
    }
  }
  
  // 권한 문자열 체크 (향후 구현)
  if (routeConfig.permissions) {
    // 여기서는 기본적인 체크만 수행
    // 실제 권한 체크는 페이지 레벨에서 수행
    console.log(`🔍 [${requestId}] Route permissions required:`, routeConfig.permissions)
  }
  
  return { hasAccess: true }
}

/**
 * 사용자 프로필 가져오기
 */
async function getUserProfile(
  supabase: ReturnType<typeof createClient>['supabase'], 
  requestId: string
): Promise<UserProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, tenant_id, status, email_verified')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.warn(`⚠️ [${requestId}] Profile not found for user:`, user.id)
      return null
    }
    
    return profile as UserProfile
  } catch (error) {
    console.error(`❌ [${requestId}] Error fetching user profile:`, error)
    return null
  }
}

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
          fullCookieString: cookies.substring(0, 300) + '...', // 더 많은 쿠키 내용 확인
          supabaseCookiePatterns: supabaseCookiePatterns.map(p => p.source),
          cookieCount: cookies.split(';').length,
          // 각 패턴별 매치 결과 확인
          patternMatches: supabaseCookiePatterns.map(pattern => ({
            pattern: pattern.source,
            matches: pattern.test(cookies)
          }))
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

  // 인증된 사용자의 권한 체크 (새로운 RBAC 시스템)
  if (isProtectedPath && isAuthenticated) {
    try {
      const userProfileData = await getUserProfile(supabase, requestId)
      
      if (!userProfileData) {
        // 프로필이 없는 경우 onboarding으로 리다이렉트 (에러가 아닌 정상적인 흐름)
        if (url.pathname.startsWith('/onboarding')) {
          // 이미 onboarding 페이지라면 통과
          if (isVercel) {
            console.log(`✅ [VERCEL-${requestId}] ONBOARDING ACCESS WITHOUT PROFILE:`, {
              path: url.pathname
            })
          }
        } else {
          // onboarding으로 리다이렉트
          const onboardingUrl = new URL('/onboarding', request.url)
          
          if (isVercel) {
            console.log(`🔄 [VERCEL-${requestId}] REDIRECT TO ONBOARDING:`, {
              path: url.pathname,
              reason: 'Profile not found - normal onboarding flow',
              redirect: onboardingUrl.toString()
            })
          }
          
          return Response.redirect(onboardingUrl.toString())
        }
      }

      // 프로필이 있는 경우에만 권한 검사 진행
      if (userProfileData) {
        const profile = userProfileData
        const { data: { user } } = await supabase.auth.getUser()

        // 계정 상태 확인
        if (profile.status === 'suspended' || profile.status === 'inactive') {
          const errorUrl = new URL('/auth/login', request.url)
          errorUrl.searchParams.set('error', 'account-suspended')
          errorUrl.searchParams.set('message', 'Account is suspended or inactive')
          
          if (isVercel) {
            console.warn(`🚨 [VERCEL-${requestId}] ACCOUNT SUSPENDED:`, {
              userId: profile.id,
              status: profile.status,
              path: url.pathname
            })
          }
          
          return Response.redirect(errorUrl.toString())
        }

        // 이메일 인증 확인 (system_admin은 제외)
        const requireEmailVerification = ['/admin', '/onboarding']
        const needsVerification = requireEmailVerification.some(path => url.pathname.startsWith(path))
        const isSystemAdmin = profile.role === 'system_admin'
        
        if (needsVerification && !profile.email_verified && !isSystemAdmin) {
          // 이메일 인증이 안된 경우 경고만 표시하고 접근은 허용
          if (isVercel) {
            console.warn(`📧 [VERCEL-${requestId}] EMAIL NOT VERIFIED (WARNING ONLY):`, {
              userId: user?.id,
              email: user?.email,
              path: url.pathname,
              role: profile.role
            })
          }
          
          // 접근은 허용하되, 추후 UI에서 경고 메시지 표시
          // return Response.redirect(errorUrl.toString()) // 주석 처리
        }

        // 라우트별 권한 체크
        const permissionCheck = await checkRoutePermissions(
          url.pathname,
          profile,
          supabase,
          requestId
        )

        if (!permissionCheck.hasAccess) {
          const unauthorizedUrl = new URL('/unauthorized', request.url)
          unauthorizedUrl.searchParams.set('reason', permissionCheck.reason || 'access_denied')
          unauthorizedUrl.searchParams.set('path', url.pathname)
          
          if (isVercel) {
            console.warn(`🚫 [VERCEL-${requestId}] ACCESS DENIED:`, {
              userId: user?.id,
              role: profile.role,
              path: url.pathname,
              reason: permissionCheck.reason
            })
          }
          
          return Response.redirect(unauthorizedUrl.toString())
        }

        // 권한 체크 통과 로깅
        if (isVercel) {
          console.log(`✅ [VERCEL-${requestId}] ACCESS GRANTED:`, {
            userId: user?.id || 'unknown',
            role: profile.role,
            path: url.pathname,
            tenantId: profile.tenant_id
          })
        }
      } // userProfileData가 있는 경우 끝

    } catch (error) {
      console.error(`❌ [${requestId}] Permission check error:`, error)
      
      // 권한 체크 실패 시 에러 페이지로 리다이렉트
      const errorUrl = new URL('/auth/login', request.url)
      errorUrl.searchParams.set('error', 'permission-check-failed')
      errorUrl.searchParams.set('message', 'Failed to verify permissions')
      
      return Response.redirect(errorUrl.toString())
    }
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