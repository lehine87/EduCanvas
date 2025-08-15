/**
 * Navigation System Types
 * @description 중앙집중화된 네비게이션 시스템을 위한 타입 정의
 * @version v1.0 - 제로베이스 리디렉션 시스템 재설계
 * @since 2025-08-15
 */

import type { UserRole } from './auth.types'

/**
 * 사용자 네비게이션 상태
 * 리디렉션 결정을 위한 핵심 상태 분류
 */
export type UserNavigationState = 
  | 'anonymous'         // 로그인하지 않은 상태
  | 'authenticated'     // 로그인했지만 프로필 없음
  | 'onboarding'        // 온보딩 진행 필요
  | 'pending'           // 승인 대기 중
  | 'active'            // 정상 활성 상태

/**
 * 네비게이션 컨텍스트
 * 리디렉션 결정에 필요한 모든 정보를 담는 구조체
 */
export interface NavigationContext {
  /** 사용자 상태 */
  userState: UserNavigationState
  /** 사용자 역할 */
  role?: UserRole
  /** 테넌트 ID */
  tenantId?: string
  /** 이메일 인증 상태 */
  isEmailVerified: boolean
  /** 계정 상태 */
  accountStatus?: 'active' | 'suspended' | 'inactive' | 'pending_approval'
  /** 특별 권한 (개발자, 시스템 관리자 등) */
  specialPermissions?: string[]
}

/**
 * 라우트 설정
 * 각 라우트가 요구하는 조건과 리디렉션 규칙
 */
export interface RouteConfig {
  /** 라우트 경로 */
  path: string
  /** 허용되는 사용자 상태들 */
  allowedStates: UserNavigationState[]
  /** 허용되는 역할들 (선택적) */
  allowedRoles?: UserRole[]
  /** 이메일 인증 필수 여부 */
  requiresEmailVerification?: boolean
  /** 커스텀 리디렉션 함수 */
  redirectTo?: (context: NavigationContext) => string | null
  /** 접근 거부 시 기본 리디렉션 경로 */
  fallbackRoute?: string
  /** 라우트 메타데이터 */
  metadata?: {
    title?: string
    description?: string
    isPublic?: boolean
    isProtected?: boolean
  }
}

/**
 * 네비게이션 액션
 * 사용자가 수행할 수 있는 네비게이션 관련 액션들
 */
export type NavigationAction = 
  | 'LOGIN'
  | 'LOGOUT' 
  | 'SIGNUP'
  | 'ONBOARD'
  | 'APPROVE'
  | 'ACTIVATE'
  | 'SUSPEND'
  | 'REDIRECT'

/**
 * 리디렉션 결과
 * 네비게이션 컨트롤러의 판단 결과
 */
export interface RedirectionResult {
  /** 리디렉션이 필요한가? */
  shouldRedirect: boolean
  /** 리디렉션 대상 경로 (필요한 경우) */
  targetPath?: string
  /** 리디렉션 이유 */
  reason?: string
  /** 추가 컨텍스트 정보 */
  context?: Record<string, unknown>
  /** 리디렉션 우선순위 (0이 최고) */
  priority?: number
}

/**
 * 네비게이션 이벤트
 * 네비게이션 상태 변경 시 발생하는 이벤트
 */
export interface NavigationEvent {
  /** 이벤트 타입 */
  type: NavigationAction
  /** 이전 컨텍스트 */
  from: NavigationContext
  /** 새로운 컨텍스트 */
  to: NavigationContext
  /** 타임스탬프 */
  timestamp: number
  /** 이벤트 메타데이터 */
  metadata?: Record<string, unknown>
}

/**
 * 네비게이션 히스토리 엔트리
 * 사용자의 네비게이션 기록
 */
export interface NavigationHistoryEntry {
  /** 경로 */
  path: string
  /** 타임스탬프 */
  timestamp: number
  /** 사용자 컨텍스트 (해당 시점) */
  userContext: NavigationContext
  /** 리디렉션 여부 */
  wasRedirected: boolean
  /** 리디렉션 이유 */
  redirectReason?: string
}

/**
 * 네비게이션 설정
 * 네비게이션 시스템의 전역 설정
 */
export interface NavigationConfig {
  /** 기본 로그인 페이지 */
  defaultLoginPath: string
  /** 기본 대시보드 페이지 */
  defaultDashboardPath: string
  /** 온보딩 페이지 */
  onboardingPath: string
  /** 승인 대기 페이지 */
  pendingApprovalPath: string
  /** 접근 거부 페이지 */
  accessDeniedPath: string
  /** 리디렉션 체인 최대 깊이 */
  maxRedirectDepth: number
  /** 캐시 TTL (밀리초) */
  cacheTtl: number
  /** 디버그 모드 */
  debugMode: boolean
  /** 로깅 활성화 */
  enableLogging: boolean
}

/**
 * 라우트 매처 결과
 * 동적 라우트 매칭 결과
 */
export interface RouteMatchResult {
  /** 매칭 성공 여부 */
  matches: boolean
  /** 추출된 파라미터들 */
  params: Record<string, string>
  /** 매칭된 라우트 설정 */
  config?: RouteConfig
  /** 매칭 점수 (0-100) */
  score: number
}

/**
 * 네비게이션 캐시 엔트리
 * 성능 최적화를 위한 캐시 구조
 */
export interface NavigationCacheEntry {
  /** 캐시 키 */
  key: string
  /** 캐시된 리디렉션 결과 */
  result: RedirectionResult
  /** 생성 시간 */
  createdAt: number
  /** TTL */
  ttl: number
  /** 히트 카운트 */
  hitCount: number
}

/**
 * 네비게이션 에러
 * 네비게이션 시스템에서 발생하는 에러들
 */
export class NavigationError extends Error {
  constructor(
    message: string,
    public code: NavigationErrorCode,
    public context?: NavigationContext,
    public targetPath?: string
  ) {
    super(message)
    this.name = 'NavigationError'
  }
}

/**
 * 네비게이션 에러 코드
 */
export type NavigationErrorCode =
  | 'INVALID_ROUTE'
  | 'ACCESS_DENIED'
  | 'INFINITE_REDIRECT'
  | 'INVALID_STATE'
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHORIZATION_FAILED'

/**
 * 네비게이션 미들웨어 옵션
 */
export interface NavigationMiddlewareOptions {
  /** 제외할 경로 패턴들 */
  excludePatterns: string[]
  /** 캐시 사용 여부 */
  enableCache: boolean
  /** 로깅 수준 */
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  /** 성능 측정 */
  enableMetrics: boolean
  /** 개발 모드 설정 */
  development: {
    /** 상세 로깅 */
    verboseLogging: boolean
    /** 리디렉션 지연 (디버깅용) */
    redirectDelay: number
  }
}

/**
 * 타입 가드: 유효한 네비게이션 상태인지 확인
 */
export function isValidNavigationState(state: unknown): state is UserNavigationState {
  const validStates: UserNavigationState[] = [
    'anonymous', 'authenticated', 'onboarding', 'pending', 'active'
  ]
  return typeof state === 'string' && validStates.includes(state as UserNavigationState)
}

/**
 * 타입 가드: 유효한 네비게이션 컨텍스트인지 확인
 */
export function isValidNavigationContext(context: unknown): context is NavigationContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'userState' in context &&
    'isEmailVerified' in context &&
    isValidNavigationState((context as NavigationContext).userState)
  )
}

/**
 * 네비게이션 컨텍스트 생성 헬퍼
 */
export function createNavigationContext(
  userState: UserNavigationState,
  options: Partial<NavigationContext> = {}
): NavigationContext {
  return {
    userState,
    isEmailVerified: false,
    ...options
  }
}

/**
 * 빈 리디렉션 결과 생성 (리디렉션 불필요)
 */
export function createNoRedirectResult(reason = 'Access allowed'): RedirectionResult {
  return {
    shouldRedirect: false,
    reason,
    priority: 100
  }
}

/**
 * 리디렉션 결과 생성 헬퍼
 */
export function createRedirectResult(
  targetPath: string,
  reason = 'Access denied',
  priority = 50,
  context?: Record<string, unknown>
): RedirectionResult {
  return {
    shouldRedirect: true,
    targetPath,
    reason,
    priority,
    context
  }
}