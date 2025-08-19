/**
 * Route Definitions
 * @description EduCanvas 애플리케이션의 모든 라우트와 접근 권한 정의
 * @version v1.0 - 제로베이스 리디렉션 시스템 재설계
 * @since 2025-08-15
 */

import type { 
  RouteConfig, 
  NavigationContext, 
  UserNavigationState, 
  NavigationConfig 
} from '@/types/navigation.types'
import type { UserRole } from '@/types/auth.types'

/**
 * 네비게이션 시스템 설정
 */
export const NAVIGATION_CONFIG: NavigationConfig = {
  defaultLoginPath: '/auth/login',
  defaultDashboardPath: '/main',  // 기본 대시보드를 main으로 변경
  onboardingPath: '/onboarding',
  pendingApprovalPath: '/pending-approval',
  accessDeniedPath: '/unauthorized',
  maxRedirectDepth: 3,
  cacheTtl: 5 * 60 * 1000, // 5분
  debugMode: process.env.NODE_ENV === 'development',
  enableLogging: true
}

/**
 * 역할별 기본 대시보드 경로
 */
const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  system_admin: '/main',  // 시스템 관리자도 메인 대시보드에서 시작
  admin: '/main',         // 테넌트 관리자도 메인 대시보드에서 시작  
  instructor: '/main',    // 강사는 메인 대시보드만
  staff: '/main',         // 스태프는 메인 대시보드만
  viewer: '/main'         // 뷰어는 메인 대시보드만
}

/**
 * 특수 이메일 주소 (시스템 관리자)
 */
const SYSTEM_ADMIN_EMAILS = ['admin@test.com', 'sjlee87@kakao.com']

/**
 * 컨텍스트 기반 기본 경로 결정
 */
function getDefaultPath(context: NavigationContext): string {
  switch (context.userState) {
    case 'anonymous':
      return NAVIGATION_CONFIG.defaultLoginPath

    case 'authenticated':
      return NAVIGATION_CONFIG.onboardingPath

    case 'onboarding':
      return NAVIGATION_CONFIG.onboardingPath

    case 'pending':
      return NAVIGATION_CONFIG.pendingApprovalPath

    case 'active':
      if (context.role) {
        // 모든 역할이 메인 대시보드에서 시작
        // 시스템 관리자나 테넌트 관리자는 메인에서 관리 기능으로 이동 가능
        return ROLE_DEFAULT_PATHS[context.role] || NAVIGATION_CONFIG.defaultDashboardPath
      }
      return NAVIGATION_CONFIG.defaultDashboardPath

    default:
      return NAVIGATION_CONFIG.defaultLoginPath
  }
}

/**
 * 시스템 관리자 권한 체크
 */
function isSystemAdmin(context: NavigationContext): boolean {
  return context.role === 'system_admin' || 
         context.specialPermissions?.includes('system_admin') || 
         (context.specialPermissions?.some(email => SYSTEM_ADMIN_EMAILS.includes(email)) ?? false)
}

/**
 * 라우트 설정 정의
 * 모든 애플리케이션 라우트와 접근 규칙
 */
export const ROUTE_DEFINITIONS: Record<string, RouteConfig> = {
  // ============================================================================
  // 공개 라우트
  // ============================================================================
  
  '/': {
    path: '/',
    allowedStates: ['anonymous', 'authenticated', 'onboarding', 'pending', 'active'],
    redirectTo: (context: NavigationContext) => getDefaultPath(context),
    metadata: {
      title: '홈',
      description: '메인 페이지',
      isPublic: true
    }
  },

  // ============================================================================
  // 인증 관련 라우트
  // ============================================================================

  '/auth/login': {
    path: '/auth/login',
    allowedStates: ['anonymous'],
    redirectTo: (context: NavigationContext) => {
      // 이미 로그인된 사용자는 적절한 대시보드로 리디렉션
      if (context.userState !== 'anonymous') {
        return getDefaultPath(context)
      }
      return null
    },
    metadata: {
      title: '로그인',
      description: '사용자 로그인 페이지',
      isPublic: true
    }
  },

  '/auth/signup': {
    path: '/auth/signup',
    allowedStates: ['anonymous'],
    redirectTo: (context: NavigationContext) => {
      if (context.userState !== 'anonymous') {
        return getDefaultPath(context)
      }
      return null
    },
    metadata: {
      title: '회원가입',
      description: '새 사용자 등록',
      isPublic: true
    }
  },

  '/auth/reset-password': {
    path: '/auth/reset-password',
    allowedStates: ['anonymous'],
    redirectTo: (context: NavigationContext) => {
      if (context.userState !== 'anonymous') {
        return getDefaultPath(context)
      }
      return null
    },
    metadata: {
      title: '비밀번호 재설정',
      description: '비밀번호 재설정',
      isPublic: true
    }
  },

  '/auth/update-password': {
    path: '/auth/update-password',
    allowedStates: ['authenticated', 'onboarding', 'pending', 'active'],
    metadata: {
      title: '비밀번호 업데이트',
      description: '비밀번호 변경',
      isProtected: true
    }
  },

  // ============================================================================
  // 온보딩 및 승인 관련 라우트
  // ============================================================================

  '/onboarding': {
    path: '/onboarding',
    allowedStates: ['authenticated', 'onboarding'],
    redirectTo: (context: NavigationContext) => {
      // 이미 온보딩을 완료한 사용자는 적절한 페이지로
      if (context.userState === 'pending') {
        return NAVIGATION_CONFIG.pendingApprovalPath
      }
      if (context.userState === 'active') {
        return getDefaultPath(context)
      }
      return null
    },
    metadata: {
      title: '온보딩',
      description: '초기 설정 및 테넌트 연결',
      isProtected: true
    }
  },

  '/pending-approval': {
    path: '/pending-approval',
    allowedStates: ['pending'],
    redirectTo: (context: NavigationContext) => {
      // 승인이 완료된 사용자는 대시보드로
      if (context.userState === 'active') {
        return getDefaultPath(context)
      }
      // 온보딩이 필요한 사용자는 온보딩으로
      if (context.userState === 'onboarding' || context.userState === 'authenticated') {
        return NAVIGATION_CONFIG.onboardingPath
      }
      return null
    },
    metadata: {
      title: '승인 대기',
      description: '관리자 승인 대기 중',
      isProtected: true
    }
  },

  // ============================================================================
  // 관리 기능은 /main 페이지 내 동적 섹션으로 통합됨
  // 별도 라우트 불필요
  // ============================================================================

  // ============================================================================
  // 일반 관리자 라우트
  // ============================================================================

  '/main': {
    path: '/main',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    requiresEmailVerification: false,
    redirectTo: () => {
      // 모든 역할이 메인 대시보드에 접근 가능
      // 역할별 관리 기능은 메뉴를 통해 별도 접근
      return null
    },
    metadata: {
      title: '메인 대시보드',
      description: '학원 관리 메인 대시보드',
      isProtected: true
    }
  },

  // ============================================================================
  // 기존 경로 호환성 (리다이렉트) - 모든 관리 기능을 /main으로 통합
  // ============================================================================
  
  '/admin': {
    path: '/admin',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    redirectTo: () => '/main', // 기존 admin 접근을 main으로 리다이렉트
    metadata: {
      title: '관리자 대시보드 (리다이렉트)',
      description: '기존 경로 호환성을 위한 리다이렉트',
      isProtected: true
    }
  },

  '/admin/students': {
    path: '/admin/students',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    redirectTo: () => '/main/students', // 기존 admin/students 접근을 main/students로 리다이렉트
    metadata: {
      title: '학생 관리 (리다이렉트)',
      description: '기존 경로 호환성을 위한 리다이렉트',
      isProtected: true
    }
  },

  '/admin/system-admin': {
    path: '/admin/system-admin',
    allowedStates: ['active'],
    allowedRoles: ['system_admin'],
    redirectTo: () => '/main', // 시스템 관리 기능도 main으로 통합됨
    metadata: {
      title: '시스템 관리 (리다이렉트)',
      description: 'main 페이지 내 시스템 관리 섹션으로 리다이렉트',
      isProtected: true
    }
  },

  '/admin/tenant-admin': {
    path: '/admin/tenant-admin',
    allowedStates: ['active'],
    allowedRoles: ['admin'],
    redirectTo: () => '/main', // 학원 관리 기능도 main으로 통합됨
    metadata: {
      title: '학원 관리 (리다이렉트)',
      description: 'main 페이지 내 학원 관리 섹션으로 리다이렉트',
      isProtected: true
    }
  },

  '/system-admin': {
    path: '/system-admin',
    allowedStates: ['active'],
    allowedRoles: ['system_admin'],
    redirectTo: () => '/main', // 기존 system-admin 접근을 main으로 리다이렉트
    metadata: {
      title: '시스템 관리 (리다이렉트)',
      description: '기존 경로 호환성을 위한 리다이렉트',
      isProtected: true
    }
  },

  '/tenant-admin': {
    path: '/tenant-admin',
    allowedStates: ['active'],
    allowedRoles: ['admin'],
    redirectTo: () => '/main', // 기존 tenant-admin 접근을 main으로 리다이렉트
    metadata: {
      title: '학원 관리 (리다이렉트)',
      description: '기존 경로 호환성을 위한 리다이렉트',
      isProtected: true
    }
  },

  '/router': {
    path: '/router',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    redirectTo: () => '/main', // router 페이지도 main으로 리다이렉트
    metadata: {
      title: '라우터 (리다이렉트)',
      description: '더 이상 필요하지 않은 라우터 페이지 리다이렉트',
      isProtected: true
    }
  },

  // ============================================================================
  // 학생 관리 라우트
  // ============================================================================

  '/main/students': {
    path: '/main/students',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    metadata: {
      title: '학생 관리',
      description: '학생 목록 및 관리',
      isProtected: true
    }
  },

  '/main/students/new': {
    path: '/main/students/new',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'staff'],
    metadata: {
      title: '학생 등록',
      description: '새 학생 등록',
      isProtected: true
    }
  },

  '/main/students/dashboard': {
    path: '/main/students/dashboard',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff'],
    metadata: {
      title: '학생 대시보드',
      description: '학생 통계 및 분석',
      isProtected: true
    }
  },

  '/main/students/smart': {
    path: '/main/students/smart',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'staff'],
    metadata: {
      title: '스마트 학생 검색',
      description: 'AI 기반 학생 검색',
      isProtected: true
    }
  },

  // 동적 라우트들
  '/main/students/[id]': {
    path: '/main/students/[id]',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'instructor', 'staff', 'viewer'],
    metadata: {
      title: '학생 상세',
      description: '학생 상세 정보',
      isProtected: true
    }
  },

  '/main/students/[id]/edit': {
    path: '/main/students/[id]/edit',
    allowedStates: ['active'],
    allowedRoles: ['system_admin', 'admin', 'staff'],
    metadata: {
      title: '학생 정보 수정',
      description: '학생 정보 편집',
      isProtected: true
    }
  },

  // ============================================================================
  // 기타 보호된 라우트들
  // ============================================================================

  '/unauthorized': {
    path: '/unauthorized',
    allowedStates: ['anonymous', 'authenticated', 'onboarding', 'pending', 'active'],
    metadata: {
      title: '접근 거부',
      description: '권한이 없습니다',
      isPublic: true
    }
  }
}

/**
 * 동적 라우트 패턴들
 * [id] 같은 동적 세그먼트가 있는 라우트들
 */
export const DYNAMIC_ROUTE_PATTERNS: Array<{
  pattern: string
  regex: RegExp
  config: RouteConfig
}> = [
  {
    pattern: '/main/students/[id]',
    regex: /^\/main\/students\/([^\/]+)$/,
    config: ROUTE_DEFINITIONS['/main/students/[id]'] as RouteConfig
  },
  {
    pattern: '/main/students/[id]/edit',
    regex: /^\/main\/students\/([^\/]+)\/edit$/,
    config: ROUTE_DEFINITIONS['/main/students/[id]/edit'] as RouteConfig
  }
]

/**
 * 미들웨어에서 제외할 경로 패턴들
 */
export const MIDDLEWARE_EXCLUDE_PATTERNS = [
  // Next.js 내부 경로들
  '/_next',
  '/api',
  
  // 정적 파일들
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  
  // 정적 자산들
  /.*\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot|json)$/,
  
  // 개발/테스트 페이지들
  '/test-',
  '/debug-',
  '/design-system-test',
  '/sentry-example-page',
  '/seed-'
]

/**
 * 공개 라우트 목록
 * 인증 없이 접근 가능한 라우트들
 */
export const PUBLIC_ROUTES = Object.keys(ROUTE_DEFINITIONS).filter(
  route => ROUTE_DEFINITIONS[route].metadata?.isPublic
)

/**
 * 보호된 라우트 목록
 * 인증이 필요한 라우트들
 */
export const PROTECTED_ROUTES = Object.keys(ROUTE_DEFINITIONS).filter(
  route => ROUTE_DEFINITIONS[route].metadata?.isProtected
)