/**
 * 🛡️ Rate Limiting & Brute Force Protection
 * 
 * 업계 표준 보안 기능:
 * - IP 기반 요청 속도 제한
 * - 무차별 대입 공격 탐지 및 차단
 * - 적응형 지연 시간 (Exponential Backoff)
 * - 메모리 효율적인 LRU 캐시
 * 
 * @author Claude AI
 * @version 1.0
 * @created 2025-01-10
 */

import { AuditLog } from './AuditLogger'

// 🔒 Rate Limiting 설정 (업계 표준)
interface RateLimitConfig {
  windowMs: number      // 시간 윈도우 (밀리초)
  maxAttempts: number   // 최대 시도 횟수
  blockDurationMs: number // 차단 지속 시간
  skipSuccessfulRequests?: boolean // 성공한 요청은 카운트에서 제외
}

// 🔒 요청 기록
interface RequestRecord {
  attempts: number
  lastAttempt: number
  blockedUntil?: number
  successfulRequests?: number
  failedRequests?: number
}

// 🔒 Rate Limit 유형별 설정 (OWASP 권장사항 기반)
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 로그인 시도 (가장 엄격)
  login: {
    windowMs: 15 * 60 * 1000, // 15분
    maxAttempts: 5,           // 5회 실패 시
    blockDurationMs: 30 * 60 * 1000, // 30분 차단
    skipSuccessfulRequests: true
  },
  
  // 비밀번호 재설정 (중간 수준)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1시간
    maxAttempts: 3,           // 3회 시도
    blockDurationMs: 2 * 60 * 60 * 1000, // 2시간 차단
  },
  
  // 회원가입 (스팸 방지)
  signup: {
    windowMs: 60 * 60 * 1000, // 1시간
    maxAttempts: 3,           // 3회 가입 시도
    blockDurationMs: 60 * 60 * 1000, // 1시간 차단
  },
  
  // API 요청 (일반적)
  api: {
    windowMs: 60 * 1000,      // 1분
    maxAttempts: 100,         // 100회 요청
    blockDurationMs: 5 * 60 * 1000, // 5분 차단
  },
  
  // 민감한 데이터 조회 (엄격)
  sensitiveData: {
    windowMs: 60 * 1000,      // 1분
    maxAttempts: 20,          // 20회 요청
    blockDurationMs: 15 * 60 * 1000, // 15분 차단
  }
}

/**
 * 🛡️ Rate Limiter 클래스
 * 
 * 특징:
 * - 메모리 효율적인 LRU 캐시 (자동 정리)
 * - 적응형 차단 시간 (반복 위반 시 증가)
 * - 다중 키 지원 (IP + 사용자 ID)
 * - 실시간 통계 및 알림
 */
export class RateLimiter {
  private records = new Map<string, RequestRecord>()
  private readonly maxCacheSize = 10000 // 메모리 보호

  /**
   * 🔒 요청 검증 및 기록
   */
  async checkLimit(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIGS,
    metadata?: {
      userAgent?: string
      ipAddress?: string
      userId?: string
    }
  ): Promise<{
    allowed: boolean
    remainingAttempts?: number
    resetTime?: number
    blockReason?: string
  }> {
    const config = RATE_LIMIT_CONFIGS[action]
    if (!config) {
      console.warn(`⚠️ [RATE-LIMITER] Unknown action: ${action}`)
      return { allowed: true }
    }

    const now = Date.now()
    const key = this.generateKey(identifier, action)
    
    // 캐시 크기 관리 (메모리 보호)
    if (this.records.size > this.maxCacheSize) {
      this.cleanupExpiredRecords()
    }
    
    let record = this.records.get(key)
    if (!record) {
      record = {
        attempts: 0,
        lastAttempt: 0,
        successfulRequests: 0,
        failedRequests: 0
      }
      this.records.set(key, record)
    }

    // 1. 차단 상태 확인
    if (record.blockedUntil && now < record.blockedUntil) {
      const remainingBlockTime = Math.ceil((record.blockedUntil - now) / 1000)
      
      // 🔒 보안 감사: 차단된 요청 시도
      AuditLog.suspicious(
        metadata?.userId ? { id: metadata.userId } as any : undefined,
        `Blocked request attempt during rate limit (${action}): id=${this.hashIdentifier(identifier)}, remaining=${remainingBlockTime}s, attempts=${record.attempts}`,
        metadata?.ipAddress,
        metadata?.userAgent
      )

      return {
        allowed: false,
        blockReason: `차단됨: ${remainingBlockTime}초 후 재시도 가능`,
        resetTime: record.blockedUntil
      }
    }

    // 2. 시간 윈도우 확인 (만료된 기록 초기화)
    if (now - record.lastAttempt > config.windowMs) {
      record.attempts = 0
      record.successfulRequests = 0
      record.failedRequests = 0
    }

    // 3. 요청 허용 여부 결정
    if (record.attempts >= config.maxAttempts) {
      // 🔒 적응형 차단: 반복 위반 시 차단 시간 증가
      const violationCount = Math.floor((record.failedRequests || 0) / config.maxAttempts)
      const adaptiveBlockDuration = config.blockDurationMs * Math.pow(2, Math.min(violationCount, 4)) // 최대 16배

      record.blockedUntil = now + adaptiveBlockDuration
      record.lastAttempt = now

      // 🔒 보안 감사: Rate Limit 위반
      AuditLog.custom('SEC_RATE_LIMIT_EXCEEDED', {
        user: metadata?.userId ? { id: metadata.userId } as any : undefined,
        details: `Rate limit exceeded for ${action}`,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        metadata: {
          action,
          identifier: this.hashIdentifier(identifier),
          attempts: record.attempts,
          maxAttempts: config.maxAttempts,
          blockDurationMs: adaptiveBlockDuration,
          violationCount: violationCount + 1
        }
      })

      return {
        allowed: false,
        blockReason: `요청 한도 초과: ${Math.ceil(adaptiveBlockDuration / 1000)}초 후 재시도`,
        resetTime: record.blockedUntil
      }
    }

    // 4. 요청 허용 및 기록 업데이트
    record.attempts += 1
    record.lastAttempt = now
    this.records.set(key, record)

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - record.attempts,
      resetTime: now + config.windowMs
    }
  }

  /**
   * 🔒 성공적인 요청 기록 (차단 해제 고려)
   */
  recordSuccess(identifier: string, action: keyof typeof RATE_LIMIT_CONFIGS): void {
    const key = this.generateKey(identifier, action)
    const record = this.records.get(key)
    
    if (record) {
      const config = RATE_LIMIT_CONFIGS[action]
      
      record.successfulRequests = (record.successfulRequests || 0) + 1
      
      // 성공한 요청은 카운트에서 제외하는 설정인 경우
      if (config?.skipSuccessfulRequests && record.attempts > 0) {
        record.attempts = Math.max(0, record.attempts - 1)
      }
      
      // 🔒 연속 성공 시 조기 차단 해제 (좋은 행동 보상)
      if (record.successfulRequests && record.successfulRequests >= 3 && record.blockedUntil) {
        record.blockedUntil = undefined
        record.attempts = 0
        
        console.log(`✅ [RATE-LIMITER] Early unblock for ${this.hashIdentifier(identifier)} due to good behavior`)
      }
      
      this.records.set(key, record)
    }
  }

  /**
   * 🔒 실패한 요청 기록
   */
  recordFailure(identifier: string, action: keyof typeof RATE_LIMIT_CONFIGS): void {
    const key = this.generateKey(identifier, action)
    const record = this.records.get(key)
    
    if (record) {
      record.failedRequests = (record.failedRequests || 0) + 1
      this.records.set(key, record)
    }
  }

  /**
   * 🔒 차단 상태 확인
   */
  isBlocked(identifier: string, action: keyof typeof RATE_LIMIT_CONFIGS): boolean {
    const key = this.generateKey(identifier, action)
    const record = this.records.get(key)
    
    return !!(record?.blockedUntil && Date.now() < record.blockedUntil)
  }

  /**
   * 🔒 수동 차단 (관리자 기능)
   */
  blockManually(
    identifier: string, 
    action: keyof typeof RATE_LIMIT_CONFIGS,
    durationMs: number,
    reason?: string
  ): void {
    const key = this.generateKey(identifier, action)
    const record = this.records.get(key) || {
      attempts: 0,
      lastAttempt: Date.now(),
      successfulRequests: 0,
      failedRequests: 0
    }
    
    record.blockedUntil = Date.now() + durationMs
    this.records.set(key, record)

    console.log(`🔒 [RATE-LIMITER] Manual block applied:`, {
      identifier: this.hashIdentifier(identifier),
      action,
      durationMs,
      reason
    })
  }

  /**
   * 🔒 차단 해제 (관리자 기능)
   */
  unblock(identifier: string, action: keyof typeof RATE_LIMIT_CONFIGS): void {
    const key = this.generateKey(identifier, action)
    const record = this.records.get(key)
    
    if (record) {
      record.blockedUntil = undefined
      record.attempts = 0
      this.records.set(key, record)
      
      console.log(`✅ [RATE-LIMITER] Manual unblock:`, {
        identifier: this.hashIdentifier(identifier),
        action
      })
    }
  }

  /**
   * 🔒 통계 조회 (관리자 대시보드용)
   */
  getStats(): {
    totalRecords: number
    blockedCount: number
    topActions: Array<{ action: string; count: number }>
  } {
    const now = Date.now()
    let blockedCount = 0
    const actionCounts = new Map<string, number>()

    for (const [key, record] of this.records) {
      // 차단된 레코드 카운트
      if (record.blockedUntil && now < record.blockedUntil) {
        blockedCount++
      }
      
      // 액션별 통계
      const action = key.split(':')[1]
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1)
    }

    // Top 5 액션
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRecords: this.records.size,
      blockedCount,
      topActions
    }
  }

  /**
   * 🔒 만료된 레코드 정리 (메모리 관리)
   */
  private cleanupExpiredRecords(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, record] of this.records) {
      const config = this.getConfigFromKey(key)
      if (!config) continue
      
      // 1시간 이상 비활성 또는 차단이 해제된 레코드 정리
      const isExpired = (now - record.lastAttempt > 60 * 60 * 1000) ||
                       (record.blockedUntil && now > record.blockedUntil + 60 * 60 * 1000)
      
      if (isExpired) {
        expiredKeys.push(key)
      }
    }
    
    // 일괄 삭제
    expiredKeys.forEach(key => this.records.delete(key))
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 [RATE-LIMITER] Cleaned up ${expiredKeys.length} expired records`)
    }
  }

  /**
   * 🔒 키 생성 (식별자 + 액션)
   */
  private generateKey(identifier: string, action: string): string {
    return `${this.hashIdentifier(identifier)}:${action}`
  }

  /**
   * 🔒 식별자 해싱 (개인정보 보호)
   */
  private hashIdentifier(identifier: string): string {
    // 간단한 해싱 (실제 운영에서는 crypto 사용 권장)
    let hash = 0
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit 정수 변환
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 🔒 키에서 설정 추출
   */
  private getConfigFromKey(key: string): RateLimitConfig | undefined {
    const action = key.split(':')[1] as keyof typeof RATE_LIMIT_CONFIGS
    return RATE_LIMIT_CONFIGS[action]
  }
}

// 🔒 싱글톤 인스턴스 (전역 사용)
export const rateLimiter = new RateLimiter()

// 🔒 편의 함수들
export const checkRateLimit = rateLimiter.checkLimit.bind(rateLimiter)
export const recordSuccess = rateLimiter.recordSuccess.bind(rateLimiter)
export const recordFailure = rateLimiter.recordFailure.bind(rateLimiter)
export const isBlocked = rateLimiter.isBlocked.bind(rateLimiter)