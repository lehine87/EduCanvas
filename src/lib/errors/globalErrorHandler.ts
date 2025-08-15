'use client'

import * as Sentry from '@sentry/nextjs'
import { errorDebugger } from '@/lib/debug/errorDebugger'

/**
 * 글로벌 에러 핸들러
 * - 처리되지 않은 Promise rejection
 * - 처리되지 않은 JavaScript 에러
 * - Resource loading 에러
 */

interface GlobalErrorInfo {
  type: 'unhandledrejection' | 'error' | 'resource'
  error: Error | string
  source?: string
  lineno?: number
  colno?: number
  filename?: string
  stack?: string
  timestamp: number
  userAgent: string
  url: string
}

class GlobalErrorHandler {
  private errorQueue: GlobalErrorInfo[] = []
  private isInitialized = false
  private maxQueueSize = 100
  private reportThrottle = 5000 // 5초마다 최대 1회 보고

  /**
   * 글로벌 에러 핸들러 초기화
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    console.log('🔧 Initializing Global Error Handler...')

    // 처리되지 않은 Promise rejection 처리
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    
    // 처리되지 않은 JavaScript 에러 처리
    window.addEventListener('error', this.handleError)
    
    // 콘솔 에러 가로채기 (선택적)
    this.interceptConsoleError()

    this.isInitialized = true
    console.log('✅ Global Error Handler initialized')
  }

  /**
   * 정리 함수
   */
  destroy() {
    if (typeof window === 'undefined') return

    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    window.removeEventListener('error', this.handleError)
    this.isInitialized = false
  }

  /**
   * 처리되지 않은 Promise rejection 핸들러
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason)

    const errorInfo: GlobalErrorInfo = {
      type: 'unhandledrejection',
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      timestamp: Date.now(),
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    }

    this.reportError(errorInfo)

    // 브라우저 기본 동작 방지 (콘솔 출력 방지)
    event.preventDefault()
  }

  /**
   * 처리되지 않은 JavaScript 에러 핸들러
   */
  private handleError = (event: ErrorEvent) => {
    console.error('🚨 Unhandled JavaScript Error:', event.error || event.message)

    const errorInfo: GlobalErrorInfo = {
      type: 'error',
      error: event.error || new Error(event.message),
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      filename: event.filename,
      timestamp: Date.now(),
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    }

    this.reportError(errorInfo)
  }

  /**
   * 콘솔 에러 가로채기
   */
  private interceptConsoleError() {
    const originalError = console.error
    
    console.error = (...args: unknown[]) => {
      // 원본 콘솔 에러 호출
      originalError.apply(console, args)

      // Sentry나 다른 에러 리포팅 시스템으로 전송할 수 있음
      if (process.env.NODE_ENV === 'development') {
        // 개발 환경에서는 console.error를 그대로 둠
        return
      }

      // 프로덕션에서 특정 패턴의 에러만 리포트
      const errorMessage = args.join(' ')
      if (this.shouldReportConsoleError(errorMessage)) {
        const errorInfo: GlobalErrorInfo = {
          type: 'error',
          error: new Error(`Console Error: ${errorMessage}`),
          timestamp: Date.now(),
          userAgent: window.navigator.userAgent,
          url: window.location.href,
        }
        
        this.reportError(errorInfo)
      }
    }
  }

  /**
   * 콘솔 에러 보고 여부 결정
   */
  private shouldReportConsoleError(message: string): boolean {
    // 특정 패턴의 에러만 리포트
    const reportPatterns = [
      /Failed to fetch/i,
      /Network error/i,
      /TypeError/i,
      /ReferenceError/i,
    ]

    // 무시할 패턴
    const ignorePatterns = [
      /hydration/i,
      /development/i,
      /warning/i,
      /deprecated/i,
    ]

    // 무시 패턴에 해당하면 리포트하지 않음
    if (ignorePatterns.some(pattern => pattern.test(message))) {
      return false
    }

    // 리포트 패턴에 해당하면 리포트
    return reportPatterns.some(pattern => pattern.test(message))
  }

  /**
   * 에러 정보 리포트
   */
  private reportError(errorInfo: GlobalErrorInfo) {
    // 큐에 추가
    this.errorQueue.push(errorInfo)
    
    // 큐 크기 제한
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // 스로틀링된 리포트
    this.throttledReport()
  }

  /**
   * 스로틀링된 에러 리포트
   */
  private throttledReport = this.throttle(() => {
    if (this.errorQueue.length === 0) return

    // 최근 에러들을 그룹화
    const recentErrors = this.errorQueue.splice(0)
    
    recentErrors.forEach(errorInfo => {
      try {
        // Sentry 리포트
        if (process.env.NODE_ENV === 'production') {
          Sentry.withScope((scope) => {
            scope.setLevel('error')
            scope.setTag('errorHandler', 'global')
            scope.setTag('errorType', errorInfo.type)
            
            scope.setContext('globalError', {
              type: errorInfo.type,
              source: errorInfo.source,
              lineno: errorInfo.lineno,
              colno: errorInfo.colno,
              filename: errorInfo.filename,
              timestamp: new Date(errorInfo.timestamp).toISOString(),
              userAgent: errorInfo.userAgent,
              url: errorInfo.url,
            })

            // 에러 fingerprint 설정
            scope.setFingerprint([
              'global-error',
              errorInfo.type,
              String(errorInfo.error),
            ])

            Sentry.captureException(errorInfo.error)
          })
        }

        // 개발 환경에서 디버거에 기록
        if (process.env.NODE_ENV === 'development') {
          errorDebugger.report(
            errorInfo.error instanceof Error ? errorInfo.error : new Error(String(errorInfo.error)),
            {
              type: 'global',
              errorType: errorInfo.type,
              source: errorInfo.source,
              timestamp: errorInfo.timestamp,
            }
          )
        }

      } catch (reportError) {
        console.error('Failed to report global error:', reportError)
      }
    })
  }, this.reportThrottle)

  /**
   * 스로틀 유틸리티
   */
  private throttle(func: Function, delay: number) {
    let timeoutId: NodeJS.Timeout | null = null
    let lastExecTime = 0
    
    return function (this: any, ...args: any[]) {
      const currentTime = Date.now()
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func.apply(this, args)
          lastExecTime = Date.now()
        }, delay)
      }
    }
  }

  /**
   * 에러 통계 조회
   */
  getErrorStats() {
    return {
      queueLength: this.errorQueue.length,
      isInitialized: this.isInitialized,
      recentErrors: this.errorQueue.slice(-5), // 최근 5개 에러
    }
  }

  /**
   * 수동 에러 리포트
   */
  reportManualError(error: Error | string, context?: Record<string, unknown>) {
    const errorInfo: GlobalErrorInfo = {
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    }

    // 컨텍스트 정보 추가
    if (context) {
      Object.assign(errorInfo, context)
    }

    this.reportError(errorInfo)
  }
}

// 싱글톤 인스턴스
export const globalErrorHandler = new GlobalErrorHandler()

/**
 * 글로벌 에러 핸들러 초기화 (클라이언트에서만)
 */
export function initGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    globalErrorHandler.init()
    
    // 언로드 시 정리
    window.addEventListener('beforeunload', () => {
      globalErrorHandler.destroy()
    })
  }
}

/**
 * 수동 에러 리포트 함수
 */
export function reportError(error: Error | string, context?: Record<string, unknown>) {
  globalErrorHandler.reportManualError(error, context)
}

/**
 * 에러 핸들러 상태 조회
 */
export function getErrorHandlerStats() {
  return globalErrorHandler.getErrorStats()
}