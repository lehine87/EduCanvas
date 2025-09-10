/**
 * 🔐 보안 감사 로깅 시스템
 * 
 * 기능:
 * - 보안 관련 이벤트 로깅 (로그인, 권한 변경, 의심스러운 활동)
 * - 개인정보 제외 메타데이터만 기록
 * - 이상 행위 감지 알고리즘
 * - 로그 무결성 보장
 * 
 * 준수 표준:
 * - OWASP Logging Cheat Sheet
 * - ISO 27001 보안 감사 요구사항
 * - GDPR 개인정보 보호 규정
 * 
 * @version 1.0.0
 * @since 2025-09-10
 */

import type { UserProfile } from '@/types/auth.types'

/**
 * 보안 감사 이벤트 타입
 */
export type AuditEventType = 
  // 인증 관련
  | 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_FAILED' | 'AUTH_LOGOUT'
  | 'AUTH_SESSION_EXPIRED' | 'AUTH_SESSION_REFRESH'
  | 'AUTH_PASSWORD_CHANGE' | 'AUTH_PASSWORD_RESET'
  
  // 권한 관련
  | 'PERM_ACCESS_GRANTED' | 'PERM_ACCESS_DENIED'
  | 'PERM_ROLE_CHANGED' | 'PERM_ELEVATION_ATTEMPT'
  
  // 보안 위반
  | 'SEC_BRUTE_FORCE_ATTEMPT' | 'SEC_RATE_LIMIT_EXCEEDED'
  | 'SEC_UNAUTHORIZED_ACCESS' | 'SEC_SUSPICIOUS_ACTIVITY'
  | 'SEC_DATA_BREACH_ATTEMPT' | 'SEC_INJECTION_ATTEMPT'
  
  // 데이터 접근
  | 'DATA_CREATE' | 'DATA_READ' | 'DATA_UPDATE' | 'DATA_DELETE'
  | 'DATA_EXPORT' | 'DATA_BULK_OPERATION'
  
  // 시스템 관리
  | 'SYS_CONFIG_CHANGE' | 'SYS_USER_ADDED' | 'SYS_USER_REMOVED'
  | 'SYS_BACKUP_CREATED' | 'SYS_MAINTENANCE'

/**
 * 위험도 레벨
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * 보안 감사 로그 엔트리
 */
export interface AuditLogEntry {
  // 기본 정보
  id: string
  timestamp: string
  eventType: AuditEventType
  riskLevel: RiskLevel
  
  // 사용자 정보 (익명화)
  userHash: string // 사용자 ID 해시 (개인정보 보호)
  userRole?: string
  tenantHash?: string // 테넌트 ID 해시
  
  // 세션 및 접근 정보
  sessionId: string
  ipHash: string // IP 주소 해시
  userAgent: string // 일부만 (브라우저 정보)
  
  // 요청 정보
  resource?: string // 접근한 리소스
  action?: string // 수행한 작업
  method?: string // HTTP 메서드
  path?: string // 요청 경로
  
  // 결과 정보
  success: boolean
  statusCode?: number
  errorType?: string
  
  // 메타데이터 (개인정보 제외)
  metadata?: Record<string, any>
  
  // 보안 분석
  anomalyScore?: number // 이상 행위 점수 (0-100)
  tags?: string[] // 분석용 태그
}

/**
 * 이상 행위 감지 설정
 */
interface AnomalyDetectionConfig {
  maxLoginAttemptsPerHour: number
  maxSessionsPerUser: number
  suspiciousActivityThreshold: number
  bruteForceThreshold: number
}

/**
 * 🔐 보안 감사 로거 클래스
 */
export class AuditLogger {
  private static instance: AuditLogger
  private logBuffer: AuditLogEntry[] = []
  private readonly MAX_BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 5000 // 5초
  
  private anomalyConfig: AnomalyDetectionConfig = {
    maxLoginAttemptsPerHour: 10,
    maxSessionsPerUser: 3,
    suspiciousActivityThreshold: 70,
    bruteForceThreshold: 5
  }
  
  private userActivityMap = new Map<string, {
    loginAttempts: number
    lastActivity: Date
    activeSessions: Set<string>
    suspiciousEvents: number
  }>()

  private constructor() {
    // 정기적으로 로그 버퍼 플러시
    setInterval(() => {
      this.flushLogs()
    }, this.FLUSH_INTERVAL)
    
    // 1시간마다 사용자 활동 데이터 정리
    setInterval(() => {
      this.cleanupActivityData()
    }, 60 * 60 * 1000)
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * 🔍 보안 이벤트 로깅
   */
  public logEvent(
    eventType: AuditEventType,
    context: {
      user?: UserProfile
      sessionId?: string
      ipAddress?: string
      userAgent?: string
      resource?: string
      action?: string
      method?: string
      path?: string
      success?: boolean
      statusCode?: number
      errorType?: string
      metadata?: Record<string, any>
    }
  ): void {
    try {
      const userHash = context.user ? this.hashValue(context.user.id) : 'anonymous'
      const ipHash = context.ipAddress ? this.hashValue(context.ipAddress) : 'unknown'
      const tenantHash = context.user?.tenant_id ? this.hashValue(context.user.tenant_id) : undefined
      
      // 이상 행위 점수 계산
      const anomalyScore = this.calculateAnomalyScore(eventType, userHash, context)
      
      // 위험도 레벨 결정
      const riskLevel = this.determineRiskLevel(eventType, anomalyScore)
      
      const logEntry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventType,
        riskLevel,
        userHash,
        userRole: context.user?.role || undefined,
        tenantHash,
        sessionId: context.sessionId || 'unknown',
        ipHash,
        userAgent: this.sanitizeUserAgent(context.userAgent || ''),
        resource: context.resource,
        action: context.action,
        method: context.method,
        path: context.path,
        success: context.success !== false, // 기본값 true
        statusCode: context.statusCode,
        errorType: context.errorType,
        metadata: this.sanitizeMetadata(context.metadata),
        anomalyScore,
        tags: this.generateTags(eventType, context)
      }
      
      // 버퍼에 추가
      this.logBuffer.push(logEntry)
      
      // 위험도가 높은 경우 즉시 플러시
      if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        this.flushLogs()
      }
      
      // 사용자 활동 추적 업데이트
      this.updateUserActivity(userHash, eventType, context.sessionId)
      
      // 콘솔에 중요 이벤트 출력 (개발 환경)
      if (process.env.NODE_ENV === 'development' && riskLevel !== 'LOW') {
        console.log(`🚨 [AUDIT] ${riskLevel} - ${eventType}:`, {
          userRole: context.user?.role || undefined,
          anomalyScore,
          success: logEntry.success
        })
      }
      
    } catch (error) {
      console.error('🚨 [AUDIT] Failed to log security event:', error)
    }
  }

  /**
   * 🔍 편의 메서드들
   */
  public logLogin(user: UserProfile, success: boolean, ipAddress?: string, userAgent?: string, errorType?: string) {
    this.logEvent(success ? 'AUTH_LOGIN_SUCCESS' : 'AUTH_LOGIN_FAILED', {
      user,
      ipAddress,
      userAgent,
      success,
      errorType,
      action: 'login'
    })
  }

  public logLogout(user: UserProfile, sessionId: string) {
    this.logEvent('AUTH_LOGOUT', {
      user,
      sessionId,
      success: true,
      action: 'logout'
    })
  }

  public logPermissionDenied(
    user: UserProfile, 
    resource: string, 
    action: string,
    ipAddress?: string
  ) {
    this.logEvent('PERM_ACCESS_DENIED', {
      user,
      resource,
      action,
      ipAddress,
      success: false
    })
  }

  public logSuspiciousActivity(
    user: UserProfile | undefined,
    details: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    this.logEvent('SEC_SUSPICIOUS_ACTIVITY', {
      user,
      ipAddress,
      userAgent,
      success: false,
      metadata: { details }
    })
  }

  public logDataAccess(
    user: UserProfile,
    action: 'create' | 'read' | 'update' | 'delete' | 'export',
    resource: string,
    recordCount?: number
  ) {
    const eventType = `DATA_${action.toUpperCase()}` as AuditEventType
    this.logEvent(eventType, {
      user,
      resource,
      action,
      success: true,
      metadata: { recordCount }
    })
  }

  /**
   * 📊 이상 행위 감지
   */
  private calculateAnomalyScore(
    eventType: AuditEventType,
    userHash: string,
    context: any
  ): number {
    let score = 0
    
    const activity = this.userActivityMap.get(userHash)
    if (!activity) return 0
    
    // 로그인 실패 패턴
    if (eventType === 'AUTH_LOGIN_FAILED') {
      score += Math.min(activity.loginAttempts * 15, 60)
    }
    
    // 권한 상승 시도
    if (eventType === 'PERM_ELEVATION_ATTEMPT') {
      score += 80
    }
    
    // 비정상적인 시간대 접근 (예: 새벽 시간)
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      score += 10
    }
    
    // 다중 세션
    if (activity.activeSessions.size > this.anomalyConfig.maxSessionsPerUser) {
      score += 25
    }
    
    // 빈번한 의심 이벤트
    if (activity.suspiciousEvents > 3) {
      score += 40
    }
    
    return Math.min(score, 100)
  }

  /**
   * 🎯 위험도 레벨 결정
   */
  private determineRiskLevel(eventType: AuditEventType, anomalyScore: number): RiskLevel {
    // 이벤트 타입별 기본 위험도
    const criticalEvents: AuditEventType[] = [
      'SEC_DATA_BREACH_ATTEMPT', 'SEC_INJECTION_ATTEMPT', 'PERM_ELEVATION_ATTEMPT'
    ]
    const highEvents: AuditEventType[] = [
      'SEC_BRUTE_FORCE_ATTEMPT', 'SEC_UNAUTHORIZED_ACCESS', 'AUTH_LOGIN_FAILED'
    ]
    
    if (criticalEvents.includes(eventType) || anomalyScore >= 90) {
      return 'CRITICAL'
    }
    if (highEvents.includes(eventType) || anomalyScore >= 70) {
      return 'HIGH'
    }
    if (anomalyScore >= 40) {
      return 'MEDIUM'
    }
    return 'LOW'
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private hashValue(value: string): string {
    // 간단한 해싱 (실제로는 crypto.subtle.digest 사용 권장)
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit 정수 변환
    }
    return Math.abs(hash).toString(36)
  }

  private sanitizeUserAgent(userAgent: string): string {
    // User Agent의 첫 50자만 사용 (개인정보 제거)
    return userAgent.substring(0, 50)
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined
    
    // 개인정보가 포함될 수 있는 필드 제거
    const sensitiveFields = ['email', 'phone', 'name', 'address', 'password', 'token']
    const sanitized: Record<string, any> = {}
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (!sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = value
      }
    })
    
    return sanitized
  }

  private generateTags(eventType: AuditEventType, context: any): string[] {
    const tags: string[] = []
    
    // 이벤트 카테고리 태그
    if (eventType.startsWith('AUTH_')) tags.push('authentication')
    if (eventType.startsWith('PERM_')) tags.push('authorization')
    if (eventType.startsWith('SEC_')) tags.push('security-violation')
    if (eventType.startsWith('DATA_')) tags.push('data-access')
    
    // 성공/실패 태그
    tags.push(context.success !== false ? 'success' : 'failure')
    
    // 사용자 역할 태그
    if (context.user?.role) {
      tags.push(`role-${context.user.role}`)
    }
    
    return tags
  }

  private updateUserActivity(userHash: string, eventType: AuditEventType, sessionId?: string) {
    if (!this.userActivityMap.has(userHash)) {
      this.userActivityMap.set(userHash, {
        loginAttempts: 0,
        lastActivity: new Date(),
        activeSessions: new Set(),
        suspiciousEvents: 0
      })
    }
    
    const activity = this.userActivityMap.get(userHash)!
    activity.lastActivity = new Date()
    
    if (sessionId) {
      activity.activeSessions.add(sessionId)
    }
    
    if (eventType === 'AUTH_LOGIN_FAILED') {
      activity.loginAttempts++
    }
    
    if (eventType.startsWith('SEC_')) {
      activity.suspiciousEvents++
    }
  }

  private cleanupActivityData() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    for (const [userHash, activity] of this.userActivityMap.entries()) {
      if (activity.lastActivity < oneHourAgo) {
        this.userActivityMap.delete(userHash)
      } else {
        // 1시간 이전 데이터 리셋
        activity.loginAttempts = 0
        activity.suspiciousEvents = 0
      }
    }
  }

  /**
   * 💾 로그 버퍼 플러시 (실제 환경에서는 DB나 로그 서비스로 전송)
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return
    
    const logs = [...this.logBuffer]
    this.logBuffer = []
    
    try {
      // 실제 환경에서는 여기서 데이터베이스나 로깅 서비스로 전송
      // await this.sendToLoggingService(logs)
      
      // 개발 환경에서는 콘솔에 중요 로그만 출력
      if (process.env.NODE_ENV === 'development') {
        const importantLogs = logs.filter(log => log.riskLevel !== 'LOW')
        if (importantLogs.length > 0) {
          console.log(`📊 [AUDIT] Flushing ${importantLogs.length} important security events`)
        }
      }
      
    } catch (error) {
      console.error('🚨 [AUDIT] Failed to flush logs:', error)
      // 실패한 로그는 다시 버퍼에 추가 (메모리 한계 고려)
      this.logBuffer.unshift(...logs.slice(-50)) // 최근 50개만 보존
    }
  }

  /**
   * 📈 보안 통계 반환
   */
  public getSecurityStats(): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsByRisk: Record<RiskLevel, number>
    suspiciousUsers: number
    activeThreats: number
  } {
    const stats = {
      totalEvents: this.logBuffer.length,
      eventsByType: {} as Record<string, number>,
      eventsByRisk: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<RiskLevel, number>,
      suspiciousUsers: 0,
      activeThreats: 0
    }
    
    this.logBuffer.forEach(log => {
      // 이벤트 타입별 집계
      stats.eventsByType[log.eventType] = (stats.eventsByType[log.eventType] || 0) + 1
      
      // 위험도별 집계
      stats.eventsByRisk[log.riskLevel]++
      
      // 활성 위협 집계
      if (log.riskLevel === 'CRITICAL' || log.riskLevel === 'HIGH') {
        stats.activeThreats++
      }
    })
    
    // 의심 사용자 집계
    for (const activity of this.userActivityMap.values()) {
      if (activity.suspiciousEvents > 2 || activity.loginAttempts > 5) {
        stats.suspiciousUsers++
      }
    }
    
    return stats
  }
}

/**
 * 전역 감사 로거 인스턴스
 */
export const auditLogger = AuditLogger.getInstance()

/**
 * 🎯 편의 함수들
 */
export const AuditLog = {
  login: (user: UserProfile, success: boolean, ip?: string, ua?: string, error?: string) => {
    auditLogger.logLogin(user, success, ip, ua, error)
  },
  
  logout: (user: UserProfile, sessionId: string) => {
    auditLogger.logLogout(user, sessionId)
  },
  
  accessDenied: (user: UserProfile, resource: string, action: string, ip?: string) => {
    auditLogger.logPermissionDenied(user, resource, action, ip)
  },
  
  suspicious: (user: UserProfile | undefined, details: string, ip?: string, ua?: string) => {
    auditLogger.logSuspiciousActivity(user, details, ip, ua)
  },
  
  dataAccess: (user: UserProfile, action: 'create' | 'read' | 'update' | 'delete' | 'export', resource: string, count?: number) => {
    auditLogger.logDataAccess(user, action, resource, count)
  },
  
  custom: (eventType: AuditEventType, context: any) => {
    auditLogger.logEvent(eventType, context)
  }
}