import { createClient } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // 세션 새로고침 (중요: 만료된 토큰 자동 갱신)
  await supabase.auth.getSession()

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
    return response
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

  // 현재 사용자 세션 확인
  const { data: { session } } = await supabase.auth.getSession()

  // 보호된 경로에 인증되지 않은 사용자가 접근하는 경우
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', url.pathname)
    return Response.redirect(redirectUrl.toString())
  }

  // 인증된 사용자가 auth 페이지에 접근하는 경우
  if (isAuthPath && session) {
    const next = url.searchParams.get('next')
    const redirectUrl = new URL(next || '/admin', request.url)
    return Response.redirect(redirectUrl.toString())
  }

  return response
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