/**
 * Navigation System
 * @description 중앙집중화된 네비게이션 시스템 - 메인 exports
 * @version v1.0 - 제로베이스 리디렉션 시스템 재설계
 * @since 2025-08-15
 */

// Core Navigation Components
export { NavigationController, navigationController } from './NavigationController'
export { NavigationStateMachine, navigationStateMachine } from './NavigationStateMachine'
export { 
  getUserNavigationStateFromRequest, 
  getUserNavigationStateFromClient,
  areNavigationContextsEqual,
  validateNavigationContext
} from './UserStateDetector'

// Route Definitions and Configuration
export {
  ROUTE_DEFINITIONS,
  DYNAMIC_ROUTE_PATTERNS,
  NAVIGATION_CONFIG,
  MIDDLEWARE_EXCLUDE_PATTERNS,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES
} from './RouteDefinitions'

// Types (re-export from types)
export type {
  NavigationContext,
  UserNavigationState,
  RouteConfig,
  RedirectionResult,
  RouteMatchResult,
  NavigationEvent,
  NavigationHistoryEntry,
  NavigationConfig,
  NavigationCacheEntry,
  NavigationErrorCode,
  NavigationMiddlewareOptions
} from '@/types/navigation.types'

export {
  isValidNavigationState,
  isValidNavigationContext,
  createNavigationContext,
  createNoRedirectResult,
  createRedirectResult
} from '@/types/navigation.types'

/**
 * 편의성을 위한 주요 함수들 직접 export
 */

// Navigation Controller의 주요 메서드들을 직접 접근 가능하게
import { navigationController } from './NavigationController'

export const checkRedirectForRequest = (request: unknown) => 
  navigationController.checkRedirectForRequest(request as any)

export const checkRedirectForClient = (path: string, context: unknown) => 
  navigationController.checkRedirectForClient(path, context as any)

export const canAccessPath = (path: string, context: unknown) => 
  navigationController.canAccessPath(path, context as any)

export const getAllowedPathsForContext = (context: unknown) => 
  navigationController.getAllowedPathsForContext(context as any)

export const getNavigationDebugInfo = () => 
  navigationController.getDebugInfo()

export const getNavigationStats = () => 
  navigationController.getNavigationStats()

export const clearNavigationCache = () => 
  navigationController.clearCache()

export const clearNavigationHistory = () => 
  navigationController.clearHistory()

export const resetNavigationSystem = () => 
  navigationController.reset()

/**
 * 네비게이션 시스템 상태 확인을 위한 헬퍼 함수들
 */

/**
 * 현재 네비게이션 시스템이 정상 작동 중인지 확인
 */
export function isNavigationSystemHealthy(): boolean {
  try {
    // NavigationStateMachine과 NavigationController를 직접 import
    const { navigationStateMachine } = require('./NavigationStateMachine')
    const controller = navigationController
    const stateMachine = navigationStateMachine
    
    // 기본 인스턴스들이 정상적으로 생성되었는지 확인
    const isControllerHealthy = controller && typeof controller.checkRedirectForClient === 'function'
    const isStateMachineHealthy = stateMachine && typeof stateMachine.shouldRedirect === 'function'
    
    return isControllerHealthy && isStateMachineHealthy
  } catch (error) {
    console.error('Navigation system health check failed:', error)
    return false
  }
}

/**
 * 네비게이션 시스템 버전 정보
 */
export const NAVIGATION_SYSTEM_VERSION = {
  version: '1.0.0',
  codename: 'Zero-Base Redirect Redesign',
  buildDate: '2025-08-15',
  features: [
    'Centralized Navigation State Machine',
    'Unified Route Definitions',
    'Infinite Redirect Prevention',
    'Performance-Optimized Caching',
    'Comprehensive Debug Tools',
    'Type-Safe Navigation Context'
  ]
}

/**
 * 네비게이션 시스템 정보 출력 (개발용)
 */
export function printNavigationSystemInfo(): void {
  try {
    const { NAVIGATION_CONFIG } = require('./RouteDefinitions')
    if (NAVIGATION_CONFIG.debugMode) {
      console.log(`🧭 Navigation System v${NAVIGATION_SYSTEM_VERSION.version}`)
      console.log(`   Codename: ${NAVIGATION_SYSTEM_VERSION.codename}`)
      console.log(`   Build Date: ${NAVIGATION_SYSTEM_VERSION.buildDate}`)
      console.log(`   Health: ${isNavigationSystemHealthy() ? '✅ Healthy' : '❌ Unhealthy'}`)
      console.log(`   Features:`)
      NAVIGATION_SYSTEM_VERSION.features.forEach(feature => {
        console.log(`     • ${feature}`)
      })
    }
  } catch (error) {
    // 에러 시 무시
  }
}

/**
 * 개발 환경에서 시스템 정보 자동 출력
 */
if (typeof window !== 'undefined') {
  try {
    const { NAVIGATION_CONFIG } = require('./RouteDefinitions')
    if (NAVIGATION_CONFIG?.debugMode) {
      // 브라우저 환경에서만 실행
      setTimeout(() => {
        printNavigationSystemInfo()
      }, 100)
    }
  } catch (error) {
    // 에러 시 무시
  }
}