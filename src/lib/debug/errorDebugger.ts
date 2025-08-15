import { APIError } from '@/lib/errors/apiErrors'

interface ErrorReport {
  id: string
  timestamp: string
  error: SerializedError
  userAgent: string
  url: string
  userId?: string
  tenantId?: string
  sessionId?: string
  additionalContext?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  resolved: boolean
  reportedToSentry: boolean
}

interface SerializedError {
  name: string
  message: string
  stack?: string
  code?: string
  statusCode?: number
  cause?: SerializedError
}

interface ErrorPattern {
  pattern: string
  count: number
  firstOccurrence: string
  lastOccurrence: string
  affectedUsers: Set<string>
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 개발자를 위한 에러 디버깅 도구
 * 로컬 스토리지를 사용하여 에러를 추적하고 분석합니다.
 */
export class ErrorDebugger {
  private static instance: ErrorDebugger
  private errors: ErrorReport[] = []
  private maxStoredErrors = 100
  private storageKey = 'educanvas_error_debugger'
  private patterns: Map<string, ErrorPattern> = new Map()

  private constructor() {
    this.loadFromStorage()
    this.setupGlobalErrorHandlers()
  }

  static getInstance(): ErrorDebugger {
    if (!ErrorDebugger.instance) {
      ErrorDebugger.instance = new ErrorDebugger()
    }
    return ErrorDebugger.instance
  }

  /**
   * 에러 리포트
   */
  report(
    error: Error | APIError,
    additionalContext?: Record<string, unknown>
  ): string {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: this.serializeError(error),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      additionalContext,
      severity: this.determineSeverity(error),
      category: this.determineCategory(error),
      resolved: false,
      reportedToSentry: false,
      userId: this.getUserId(),
      tenantId: this.getTenantId(),
      sessionId: this.getSessionId(),
    }

    this.errors.push(report)
    this.updatePattern(report)
    this.saveToStorage()
    this.logToConsole(report)

    // 저장 용량 관리
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors)
    }

    return errorId
  }

  /**
   * 에러 직렬화
   */
  private serializeError(error: Error | APIError): SerializedError {
    const serialized: SerializedError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }

    if (error instanceof APIError) {
      serialized.code = error.code
      serialized.statusCode = error.statusCode
    }

    if (error.cause) {
      serialized.cause = this.serializeError(error.cause as Error)
    }

    return serialized
  }

  /**
   * 에러 심각도 결정
   */
  private determineSeverity(error: Error | APIError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof APIError) {
      if (error.statusCode >= 500) return 'critical'
      if (error.statusCode >= 400) return 'medium'
      return 'low'
    }

    // 시스템 에러
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high'
    }

    // 네트워크 에러
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * 에러 카테고리 결정
   */
  private determineCategory(error: Error | APIError): string {
    if (error instanceof APIError) {
      return error.category
    }

    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'javascript'
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'network'
    }

    if (error.name === 'ChunkLoadError') {
      return 'loading'
    }

    return 'unknown'
  }

  /**
   * 에러 패턴 업데이트
   */
  private updatePattern(report: ErrorReport) {
    const pattern = `${report.error.name}:${report.category}`
    const existing = this.patterns.get(pattern)

    if (existing) {
      existing.count++
      existing.lastOccurrence = report.timestamp
      if (report.userId) {
        existing.affectedUsers.add(report.userId)
      }
    } else {
      this.patterns.set(pattern, {
        pattern,
        count: 1,
        firstOccurrence: report.timestamp,
        lastOccurrence: report.timestamp,
        affectedUsers: new Set(report.userId ? [report.userId] : []),
        category: report.category,
        severity: report.severity,
      })
    }
  }

  /**
   * 콘솔 로깅
   */
  private logToConsole(report: ErrorReport) {
    if (process.env.NODE_ENV !== 'development') return

    const emoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨',
    }

    console.group(`${emoji[report.severity]} Error Debugger Report`)
    console.error('Error:', report.error)
    console.table({
      ID: report.id,
      Timestamp: report.timestamp,
      Severity: report.severity,
      Category: report.category,
      URL: report.url,
    })
    
    if (report.additionalContext) {
      console.log('Additional Context:', report.additionalContext)
    }
    
    console.groupEnd()
  }

  /**
   * 로컬 스토리지에서 로드
   */
  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.errors = data.errors || []
        
        // 패턴 복원
        if (data.patterns) {
          data.patterns.forEach((pattern: ErrorPattern) => {
            this.patterns.set(pattern.pattern, {
              ...pattern,
              affectedUsers: new Set(pattern.affectedUsers)
            })
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load error debugger data:', error)
    }
  }

  /**
   * 로컬 스토리지에 저장
   */
  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      const data = {
        errors: this.errors,
        patterns: Array.from(this.patterns.values()).map(pattern => ({
          ...pattern,
          affectedUsers: Array.from(pattern.affectedUsers)
        })),
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save error debugger data:', error)
    }
  }

  /**
   * 글로벌 에러 핸들러 설정
   */
  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return

    // JavaScript 에러
    window.addEventListener('error', (event) => {
      this.report(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript-error'
      })
    })

    // Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(`Unhandled Promise Rejection: ${event.reason}`)
      
      this.report(error, {
        type: 'unhandled-promise-rejection',
        reason: event.reason
      })
    })
  }

  /**
   * 에러 목록 조회
   */
  getErrors(filters?: {
    severity?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
    resolved?: boolean
    fromDate?: string
    toDate?: string
  }): ErrorReport[] {
    let filtered = [...this.errors]

    if (filters) {
      if (filters.severity) {
        filtered = filtered.filter(error => error.severity === filters.severity)
      }
      
      if (filters.category) {
        filtered = filtered.filter(error => error.category === filters.category)
      }
      
      if (filters.resolved !== undefined) {
        filtered = filtered.filter(error => error.resolved === filters.resolved)
      }
      
      if (filters.fromDate) {
        filtered = filtered.filter(error => error.timestamp >= filters.fromDate!)
      }
      
      if (filters.toDate) {
        filtered = filtered.filter(error => error.timestamp <= filters.toDate!)
      }
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * 에러 패턴 조회
   */
  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count)
  }

  /**
   * 통계 조회
   */
  getStats() {
    const total = this.errors.length
    const bySeverity = {
      low: this.errors.filter(e => e.severity === 'low').length,
      medium: this.errors.filter(e => e.severity === 'medium').length,
      high: this.errors.filter(e => e.severity === 'high').length,
      critical: this.errors.filter(e => e.severity === 'critical').length,
    }
    
    const byCategory = this.errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const resolved = this.errors.filter(e => e.resolved).length
    const unresolved = total - resolved

    return {
      total,
      resolved,
      unresolved,
      bySeverity,
      byCategory,
      patterns: this.patterns.size,
    }
  }

  /**
   * 에러 해결 표시
   */
  markAsResolved(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * 에러 데이터 지우기
   */
  clear() {
    this.errors = []
    this.patterns.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * 에러 데이터 내보내기
   */
  exportData() {
    return {
      errors: this.errors,
      patterns: Array.from(this.patterns.values()),
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * 사용자 ID 가져오기
   */
  private getUserId(): string | undefined {
    // 실제 구현에서는 auth store에서 가져와야 함
    return undefined
  }

  /**
   * 테넌트 ID 가져오기
   */
  private getTenantId(): string | undefined {
    // 실제 구현에서는 auth store에서 가져와야 함
    return undefined
  }

  /**
   * 세션 ID 가져오기
   */
  private getSessionId(): string | undefined {
    // 실제 구현에서는 session storage에서 가져와야 함
    return undefined
  }
}

// 싱글톤 인스턴스 생성
export const errorDebugger = ErrorDebugger.getInstance()

// 개발 환경에서만 글로벌 객체에 노출
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (globalThis as unknown as { errorDebugger: typeof errorDebugger }).errorDebugger = errorDebugger
}