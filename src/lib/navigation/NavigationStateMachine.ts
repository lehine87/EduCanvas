/**
 * Navigation State Machine
 * @description 중앙집중화된 네비게이션 로직과 상태 관리
 * @version v1.0 - 제로베이스 리디렉션 시스템 재설계
 * @since 2025-08-15
 */

import type { 
  NavigationContext, 
  RouteConfig, 
  RedirectionResult, 
  RouteMatchResult,
  NavigationCacheEntry
} from '@/types/navigation.types'

import { 
  ROUTE_DEFINITIONS, 
  DYNAMIC_ROUTE_PATTERNS, 
  NAVIGATION_CONFIG 
} from './RouteDefinitions'

import { 
  createRedirectResult, 
  createNoRedirectResult 
} from '@/types/navigation.types'

/**
 * Navigation State Machine
 * 모든 라우팅 결정을 담당하는 중앙 컨트롤러
 */
export class NavigationStateMachine {
  private static instance: NavigationStateMachine
  private cache: Map<string, NavigationCacheEntry> = new Map()
  private redirectHistory: Array<{ path: string; timestamp: number }> = []

  /**
   * 싱글톤 패턴으로 인스턴스 관리
   */
  static getInstance(): NavigationStateMachine {
    if (!NavigationStateMachine.instance) {
      NavigationStateMachine.instance = new NavigationStateMachine()
    }
    return NavigationStateMachine.instance
  }

  /**
   * 주어진 경로와 사용자 컨텍스트에 대한 리디렉션 필요성 판단
   */
  shouldRedirect(currentPath: string, context: NavigationContext): RedirectionResult {
    if (process.env.NAVIGATION_DEBUG === 'true') {
      console.log(`🧭 [NAV-STATE-MACHINE] Checking redirect for:`, {
        currentPath,
        userState: context.userState,
        role: context.role,
        tenantId: context.tenantId,
        timestamp: new Date().toISOString()
      })
    }

    // 캐시 확인
    const cacheKey = this.generateCacheKey(currentPath, context)
    const cachedResult = this.getCachedResult(cacheKey)
    if (cachedResult) {
      if (process.env.NAVIGATION_DEBUG === 'true') {
        console.log(`💾 [NAV-STATE-MACHINE] Using cached result:`, cachedResult)
      }
      return cachedResult
    }

    // 무한 리디렉션 방지
    if (this.hasInfiniteRedirectRisk(currentPath)) {
      const errorResult = createNoRedirectResult('Infinite redirect risk detected')
      this.setCacheEntry(cacheKey, errorResult)
      return errorResult
    }

    try {
      // 라우트 매칭
      const matchResult = this.matchRoute(currentPath)
      
      if (!matchResult.matches || !matchResult.config) {
        // 매칭되지 않는 라우트 - 404 또는 기본 페이지로
        const result = createRedirectResult(
          this.getDefaultPathForContext(context),
          'Route not found',
          10
        )
        this.setCacheEntry(cacheKey, result)
        return result
      }

      // 라우트 설정 기반 접근 권한 검증
      const accessResult = this.checkAccess(matchResult.config, context)
      this.setCacheEntry(cacheKey, accessResult)
      
      return accessResult

    } catch (error) {
      console.error(`❌ [NAV-STATE-MACHINE] Error during redirect check:`, error)
      
      // 에러 발생 시 안전한 기본 경로로 리디렉션
      const safeResult = createRedirectResult(
        NAVIGATION_CONFIG.defaultLoginPath,
        'Error during access check',
        0 // 최고 우선순위
      )
      this.setCacheEntry(cacheKey, safeResult)
      return safeResult
    }
  }

  /**
   * 라우트 매칭 (정적 + 동적)
   * 🎯 UX 테스트: 더 구체적인 경로를 우선 매칭하도록 수정
   */
  private matchRoute(path: string): RouteMatchResult {
    // 1. 정확한 정적 라우트 매칭 (최우선)
    if (ROUTE_DEFINITIONS[path]) {
      return {
        matches: true,
        params: {},
        config: ROUTE_DEFINITIONS[path],
        score: 100
      }
    }

    // 2. 동적 라우트 매칭
    for (const dynamicRoute of DYNAMIC_ROUTE_PATTERNS) {
      const match = path.match(dynamicRoute.regex)
      if (match) {
        const params: Record<string, string> = {}
        
        // URL 파라미터 추출 (예: [id] -> { id: "123" })
        if (dynamicRoute.pattern.includes('[id]') && match[1]) {
          params.id = match[1]
        }

        return {
          matches: true,
          params,
          config: dynamicRoute.config,
          score: 90
        }
      }
    }

    // 3. 더 구체적인 경로 우선 매칭을 위한 추가 로직
    // /admin/students -> /admin 보다 우선
    const sortedRoutes = Object.keys(ROUTE_DEFINITIONS)
      .filter(route => path.startsWith(route))
      .sort((a, b) => b.length - a.length) // 더 긴 경로 우선

    if (sortedRoutes.length > 0) {
      const bestMatch = sortedRoutes[0]
      if (bestMatch) {
        const config = ROUTE_DEFINITIONS[bestMatch]
        if (config) {
          return {
            matches: true,
            params: {},
            config,
            score: 95
          }
        }
      }
    }

    // 4. 매칭 실패
    return {
      matches: false,
      params: {},
      score: 0
    }
  }

  /**
   * 라우트 접근 권한 검증
   */
  private checkAccess(routeConfig: RouteConfig, context: NavigationContext): RedirectionResult {
    // 1. 사용자 상태 검증
    if (!routeConfig.allowedStates.includes(context.userState)) {
      const targetPath = this.getDefaultPathForContext(context)
      return createRedirectResult(
        targetPath,
        `User state '${context.userState}' not allowed for this route`,
        20
      )
    }

    // 2. 역할 검증
    if (routeConfig.allowedRoles && context.role) {
      if (!routeConfig.allowedRoles.includes(context.role)) {
        const targetPath = routeConfig.fallbackRoute || this.getDefaultPathForContext(context)
        return createRedirectResult(
          targetPath,
          `Role '${context.role}' not allowed for this route`,
          30
        )
      }
    }

    // 3. 이메일 인증 검증
    if (routeConfig.requiresEmailVerification && !context.isEmailVerified) {
      // 이메일 인증 필요하지만 인증되지 않은 경우 - 경고만 로그
      if (process.env.NAVIGATION_DEBUG === 'true') {
        console.warn(`📧 [NAV-STATE-MACHINE] Email verification required but not verified for route: ${routeConfig.path}`)
      }
      // 현재는 접근 허용 (UI에서 경고 표시)
    }

    // 4. 커스텀 리디렉션 로직
    if (routeConfig.redirectTo) {
      const customRedirectPath = routeConfig.redirectTo(context)
      if (customRedirectPath) {
        return createRedirectResult(
          customRedirectPath,
          'Custom redirect logic applied',
          40
        )
      }
    }

    // 5. 모든 검증 통과 - 접근 허용
    return createNoRedirectResult(`Access granted to ${routeConfig.path}`)
  }

  /**
   * 컨텍스트 기반 기본 경로 결정
   * 🎯 UX 개선: 첫 로그인시에만 기본 대시보드로 안내
   */
  private getDefaultPathForContext(context: NavigationContext): string {
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
        // 🎯 개선: 매칭되지 않는 라우트에서만 기본 경로로 안내
        // 직접 접근한 경우에는 강제 리다이렉트 하지 않음
        
        // 역할별 기본 경로 (404 또는 매칭 실패시에만 사용)
        if (context.role === 'system_admin' || 
            context.specialPermissions?.includes('system_admin')) {
          return '/system-admin'
        }
        
        if (context.role === 'tenant_admin' && context.tenantId) {
          return '/tenant-admin'
        }
        
        if (['instructor', 'staff'].includes(context.role || '') && context.tenantId) {
          return '/tenant-admin'
        }
        
        return NAVIGATION_CONFIG.defaultDashboardPath

      default:
        return NAVIGATION_CONFIG.defaultLoginPath
    }
  }

  /**
   * 무한 리디렉션 위험 감지
   */
  private hasInfiniteRedirectRisk(currentPath: string): boolean {
    const now = Date.now()
    const recentWindow = 10000 // 10초

    // 최근 기록 정리
    this.redirectHistory = this.redirectHistory.filter(
      entry => now - entry.timestamp < recentWindow
    )

    // 같은 경로로의 최근 리디렉션 횟수 확인
    const recentRedirects = this.redirectHistory.filter(
      entry => entry.path === currentPath
    ).length

    // 임계값 초과 시 무한 리디렉션 위험으로 판단
    if (recentRedirects >= 3) {
      console.error(`🔄 [NAV-STATE-MACHINE] Infinite redirect risk detected for path: ${currentPath}`)
      return true
    }

    // 현재 요청 기록
    this.redirectHistory.push({
      path: currentPath,
      timestamp: now
    })

    return false
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(path: string, context: NavigationContext): string {
    const keyParts = [
      path,
      context.userState,
      context.role || 'no-role',
      context.tenantId || 'no-tenant',
      context.isEmailVerified ? 'verified' : 'unverified'
    ]
    return keyParts.join('|')
  }

  /**
   * 캐시된 결과 조회
   */
  private getCachedResult(cacheKey: string): RedirectionResult | null {
    const entry = this.cache.get(cacheKey)
    if (!entry) return null

    const now = Date.now()
    
    // TTL 만료 확인
    if (now - entry.createdAt > entry.ttl) {
      this.cache.delete(cacheKey)
      return null
    }

    // 히트 카운트 증가
    entry.hitCount++
    
    return entry.result
  }

  /**
   * 캐시 엔트리 설정
   */
  private setCacheEntry(cacheKey: string, result: RedirectionResult): void {
    const entry: NavigationCacheEntry = {
      key: cacheKey,
      result,
      createdAt: Date.now(),
      ttl: NAVIGATION_CONFIG.cacheTtl,
      hitCount: 0
    }

    this.cache.set(cacheKey, entry)

    // 캐시 크기 제한 (최대 1000개 엔트리)
    if (this.cache.size > 1000) {
      // 가장 오래된 엔트리 제거
      const oldestKey = Array.from(this.cache.keys())[0]
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  /**
   * 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear()
    if (process.env.NAVIGATION_DEBUG === 'true') {
      console.log(`🧹 [NAV-STATE-MACHINE] Cache cleared`)
    }
  }

  /**
   * 디버그 정보 조회
   */
  public getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      redirectHistoryLength: this.redirectHistory.length,
      recentRedirects: this.redirectHistory.slice(-10),
      cacheEntries: Array.from(this.cache.values()).slice(0, 10), // 최신 10개만
      config: NAVIGATION_CONFIG
    }
  }

  /**
   * 캐시 통계 조회
   */
  public getCacheStats() {
    const entries = Array.from(this.cache.values())
    return {
      totalEntries: entries.length,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      averageHits: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hitCount, 0) / entries.length : 0,
      oldestEntry: entries.reduce((oldest, entry) => 
        !oldest || entry.createdAt < oldest.createdAt ? entry : oldest
      , null as NavigationCacheEntry | null),
      newestEntry: entries.reduce((newest, entry) => 
        !newest || entry.createdAt > newest.createdAt ? entry : newest
      , null as NavigationCacheEntry | null)
    }
  }
}

/**
 * 글로벌 인스턴스 접근을 위한 헬퍼
 */
export const navigationStateMachine = NavigationStateMachine.getInstance()