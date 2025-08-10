import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 현재는 디자인 시스템 테스트를 위해 간단한 미들웨어 사용
  // 실제 Supabase 설정이 완료되면 인증 로직을 추가할 예정
  
  // 디자인 시스템 테스트 페이지는 항상 허용
  if (req.nextUrl.pathname.startsWith('/design-system-test')) {
    return NextResponse.next()
  }
  
  // 정적 파일과 API 라우트는 통과
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 현재는 모든 요청 허용 (개발/테스트 목적)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}