/**
 * Navigation Controller
 * @description 모든 네비게이션 결정을 담당하는 중앙 컨트롤러
 * @version v1.0 - 제로베이스 리디렉션 시스템 재설계
 * @since 2025-08-15
 */

import type { NextRequest } from 'next/server'
import type { 
  NavigationContext, 
  RedirectionResult,
  NavigationEvent,
  NavigationHistoryEntry
} from '@/types/navigation.types'

import { NavigationStateMachine } from './NavigationStateMachine'
import { getUserNavigationStateFromRequest } from './UserStateDetector'
import { NAVIGATION_CONFIG } from './RouteDefinitions'

/**
 * Navigation Controller
 * 네비게이션 시스템의 메인 컨트롤러 클래스
 */
export class NavigationController {
  private static instance: NavigationController
  private stateMachine: NavigationStateMachine
  private eventHistory: NavigationEvent[] = []
  private navigationHistory: NavigationHistoryEntry[] = []

  constructor() {
    this.stateMachine = NavigationStateMachine.getInstance()
  }

  /**
   * 싱글톤 패턴
   */
  static getInstance(): NavigationController {
    if (!NavigationController.instance) {
      NavigationController.instance = new NavigationController()
    }
    return NavigationController.instance
  }

  /**
   * 미들웨어에서 호출되는 메인 리디렉션 체크 함수
   */
  async checkRedirectForRequest(request: NextRequest): Promise<RedirectionResult> {
    const currentPath = request.nextUrl.pathname
    const requestId = Math.random().toString(36).substring(7)

    const debugMode = process.env.NAVIGATION_DEBUG === 'true'
    if (debugMode) {
      console.log(`🎯 [NAV-CONTROLLER-${requestId}] Processing request:`, {
        path: currentPath,
        method: request.method,
        userAgent: request.headers.get('user-agent')?.substring(0, 50)
      })
    }

    try {
      // 1. 사용자 컨텍스트 감지
      const context = await getUserNavigationStateFromRequest(request)
      
      if (debugMode) {
        console.log(`👤 [NAV-CONTROLLER-${requestId}] User context:`, {
          userState: context.userState,
          role: context.role,
          tenantId: context.tenantId
        })
      }

      // 2. 상태 머신으로 리디렉션 필요성 판단
      const redirectionResult = this.stateMachine.shouldRedirect(currentPath, context)

      // 3. 네비게이션 이벤트 기록
      this.recordNavigationEvent(currentPath, context, redirectionResult)

      // 4. 히스토리 업데이트
      this.updateNavigationHistory(currentPath, context, redirectionResult.shouldRedirect, redirectionResult.reason)

      if (debugMode) {
        console.log(`📊 [NAV-CONTROLLER-${requestId}] Result:`, {
          shouldRedirect: redirectionResult.shouldRedirect,
          targetPath: redirectionResult.targetPath,
          reason: redirectionResult.reason
        })
      }

      return redirectionResult

    } catch (error) {
      console.error(`❌ [NAV-CONTROLLER-${requestId}] Error during redirect check:`, error)
      
      // 에러 발생 시 안전한 기본 동작
      return {
        shouldRedirect: true,
        targetPath: NAVIGATION_CONFIG.defaultLoginPath,
        reason: 'Error occurred during navigation check',
        priority: 0
      }
    }
  }

  /**
   * 클라이언트 사이드에서 호출되는 리디렉션 체크
   */
  async checkRedirectForClient(currentPath: string, context: NavigationContext): Promise<RedirectionResult> {
    if (NAVIGATION_CONFIG.debugMode) {
      console.log(`🖥️ [NAV-CONTROLLER] Client-side redirect check:`, {
        currentPath,
        userState: context.userState,
        role: context.role
      })
    }

    const redirectionResult = this.stateMachine.shouldRedirect(currentPath, context)
    
    // 클라이언트에서도 이벤트 기록
    this.recordNavigationEvent(currentPath, context, redirectionResult)
    this.updateNavigationHistory(currentPath, context, redirectionResult.shouldRedirect, redirectionResult.reason)

    return redirectionResult
  }

  /**
   * 특정 경로에 대한 접근 권한 확인 (사전 체크용)
   */
  async canAccessPath(path: string, context: NavigationContext): Promise<{
    canAccess: boolean
    redirectTo?: string
    reason?: string
  }> {
    const result = this.stateMachine.shouldRedirect(path, context)
    
    return {
      canAccess: !result.shouldRedirect,
      redirectTo: result.targetPath,
      reason: result.reason
    }
  }

  /**
   * 사용자 역할 기반 허용된 경로들 조회
   */
  getAllowedPathsForContext(context: NavigationContext): string[] {
    // TODO: 구현 필요 - 모든 라우트를 순회하며 접근 가능한 경로들 반환
    const allowedPaths: string[] = []
    
    // 기본적으로 항상 접근 가능한 경로들
    if (context.userState === 'anonymous') {
      allowedPaths.push('/auth/login', '/auth/signup', '/auth/reset-password')
    } else if (context.userState === 'active' && context.role) {
      allowedPaths.push('/admin')
      
      if (context.role === 'system_admin') {
        allowedPaths.push('/system-admin')
      }
      
      if (['admin', 'instructor', 'staff'].includes(context.role)) {
        allowedPaths.push('/tenant-admin')
      }
    }
    
    return allowedPaths
  }

  /**
   * 네비게이션 이벤트 기록
   */
  private recordNavigationEvent(
    path: string, 
    context: NavigationContext, 
    result: RedirectionResult
  ): void {
    if (!NAVIGATION_CONFIG.enableLogging) return

    const event: NavigationEvent = {
      type: result.shouldRedirect ? 'REDIRECT' : 'APPROVE',
      from: context,
      to: context, // 현재는 동일 (실제로는 이벤트 타입에 따라 다를 수 있음)
      timestamp: Date.now(),
      metadata: {
        path,
        targetPath: result.targetPath,
        reason: result.reason,
        priority: result.priority
      }
    }

    this.eventHistory.push(event)

    // 히스토리 크기 제한 (최대 100개)
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100)
    }
  }

  /**
   * 네비게이션 히스토리 업데이트
   */
  private updateNavigationHistory(
    path: string,
    context: NavigationContext,
    wasRedirected: boolean,
    redirectReason?: string
  ): void {
    const entry: NavigationHistoryEntry = {
      path,
      timestamp: Date.now(),
      userContext: { ...context },
      wasRedirected,
      redirectReason
    }

    this.navigationHistory.push(entry)

    // 히스토리 크기 제한 (최대 200개)
    if (this.navigationHistory.length > 200) {
      this.navigationHistory = this.navigationHistory.slice(-200)
    }
  }

  /**
   * 디버깅을 위한 상태 정보 조회
   */
  getDebugInfo() {
    return {
      controller: {
        eventHistoryLength: this.eventHistory.length,
        navigationHistoryLength: this.navigationHistory.length,
        recentEvents: this.eventHistory.slice(-10),
        recentNavigation: this.navigationHistory.slice(-10)
      },
      stateMachine: this.stateMachine.getDebugInfo(),
      config: NAVIGATION_CONFIG
    }
  }

  /**
   * 네비게이션 통계 조회
   */
  getNavigationStats() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const recentEvents = this.eventHistory.filter(event => now - event.timestamp < oneHour)
    const recentNavigation = this.navigationHistory.filter(entry => now - entry.timestamp < oneHour)

    const redirectCount = recentNavigation.filter(entry => entry.wasRedirected).length
    const allowedCount = recentNavigation.filter(entry => !entry.wasRedirected).length

    return {
      lastHour: {
        totalNavigations: recentNavigation.length,
        redirects: redirectCount,
        allowed: allowedCount,
        redirectRate: recentNavigation.length > 0 ? (redirectCount / recentNavigation.length) * 100 : 0
      },
      mostVisitedPaths: this.getMostVisitedPaths(recentNavigation),
      mostCommonRedirectReasons: this.getMostCommonRedirectReasons(recentNavigation),
      cache: this.stateMachine.getCacheStats()
    }
  }

  /**
   * 가장 많이 방문된 경로들 조회
   */
  private getMostVisitedPaths(navigation: NavigationHistoryEntry[]): Array<{
    path: string
    count: number
    redirectRate: number
  }> {
    const pathCounts: Record<string, { total: number; redirects: number }> = {}

    navigation.forEach(entry => {
      if (!pathCounts[entry.path]) {
        pathCounts[entry.path] = { total: 0, redirects: 0 }
      }
      pathCounts[entry.path].total++
      if (entry.wasRedirected) {
        pathCounts[entry.path].redirects++
      }
    })

    return Object.entries(pathCounts)
      .map(([path, stats]) => ({
        path,
        count: stats.total,
        redirectRate: stats.total > 0 ? (stats.redirects / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  /**
   * 가장 일반적인 리디렉션 이유들 조회
   */
  private getMostCommonRedirectReasons(navigation: NavigationHistoryEntry[]): Array<{
    reason: string
    count: number
  }> {
    const reasonCounts: Record<string, number> = {}

    navigation.forEach(entry => {
      if (entry.wasRedirected && entry.redirectReason) {
        reasonCounts[entry.redirectReason] = (reasonCounts[entry.redirectReason] || 0) + 1
      }
    })

    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.stateMachine.clearCache()
    if (NAVIGATION_CONFIG.debugMode) {
      console.log(`🧹 [NAV-CONTROLLER] Cache cleared`)
    }
  }

  /**
   * 히스토리 초기화
   */
  clearHistory(): void {
    this.eventHistory = []
    this.navigationHistory = []
    if (NAVIGATION_CONFIG.debugMode) {
      console.log(`🧹 [NAV-CONTROLLER] History cleared`)
    }
  }

  /**
   * 전체 상태 초기화
   */
  reset(): void {
    this.clearCache()
    this.clearHistory()
    console.log(`🔄 [NAV-CONTROLLER] Navigation controller reset`)
  }
}

/**
 * 글로벌 인스턴스 접근을 위한 헬퍼
 */
export const navigationController = NavigationController.getInstance()