// Rate Limiting 유틸리티
// 로그인 시도, 비밀번호 재설정 등에 사용

interface RateLimitStore {
  [key: string]: {
    attempts: number
    lastAttempt: number
    blockedUntil?: number
  }
}

// 메모리 기반 Rate Limiter (개발/소규모 운영용)
// 실제 운영에서는 Redis 등 외부 스토리지 사용 권장
class MemoryRateLimiter {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 5분마다 만료된 기록 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const key in this.store) {
      const record = this.store[key]
      // 1시간 지난 기록 삭제
      if (record && now - record.lastAttempt > 60 * 60 * 1000) {
        delete this.store[key]
      }
    }
  }

  /**
   * Rate limit 검사 및 시도 기록
   * @param identifier 식별자 (IP, 이메일 등)
   * @param maxAttempts 최대 시도 횟수 (기본: 5회)
   * @param windowMs 시간 윈도우 (기본: 15분)
   * @param blockDurationMs 차단 시간 (기본: 15분)
   * @returns { allowed: boolean, retryAfter?: number }
   */
  checkAndRecord(
    identifier: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000,
    blockDurationMs: number = 15 * 60 * 1000
  ): { allowed: boolean; retryAfter?: number; remainingAttempts?: number } {
    const now = Date.now()
    const record = this.store[identifier] || {
      attempts: 0,
      lastAttempt: 0
    }

    // 차단 상태 확인
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
      }
    }

    // 시간 윈도우가 지났으면 초기화
    if (now - record.lastAttempt > windowMs) {
      record.attempts = 0
    }

    // 최대 시도 횟수 초과 시 차단
    if (record.attempts >= maxAttempts) {
      record.blockedUntil = now + blockDurationMs
      this.store[identifier] = record
      return {
        allowed: false,
        retryAfter: Math.ceil(blockDurationMs / 1000)
      }
    }

    // 시도 기록
    record.attempts++
    record.lastAttempt = now
    this.store[identifier] = record

    return {
      allowed: true,
      remainingAttempts: maxAttempts - record.attempts
    }
  }

  /**
   * 성공 시 기록 초기화
   * @param identifier 식별자
   */
  reset(identifier: string): void {
    delete this.store[identifier]
  }

  /**
   * 현재 상태 확인 (차단 여부만 확인)
   * @param identifier 식별자
   * @returns { blocked: boolean, retryAfter?: number }
   */
  isBlocked(identifier: string): { blocked: boolean; retryAfter?: number } {
    const record = this.store[identifier]
    if (!record?.blockedUntil) {
      return { blocked: false }
    }

    const now = Date.now()
    if (now >= record.blockedUntil) {
      return { blocked: false }
    }

    return {
      blocked: true,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// 전역 인스턴스
export const rateLimiter = new MemoryRateLimiter()

// 설정값들
export const RATE_LIMIT_CONFIG = {
  // 로그인 시도
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15분
    blockDurationMs: 15 * 60 * 1000 // 15분 차단
  },
  
  // 비밀번호 재설정 요청
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1시간
    blockDurationMs: 60 * 60 * 1000 // 1시간 차단
  },
  
  // 회원가입 시도
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1시간
    blockDurationMs: 30 * 60 * 1000 // 30분 차단
  }
} as const

/**
 * IP 주소 추출 헬퍼 함수
 * @param request NextRequest 객체
 * @returns IP 주소 문자열
 */
export function getClientIP(request: Request): string {
  // Vercel, Netlify 등 플랫폼에서 사용하는 헤더들 확인
  const headers = request.headers
  
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '127.0.0.1'
  }
  
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // 기본값 (localhost 개발 환경)
  return '127.0.0.1'
}

/**
 * Rate limit 에러 응답 생성
 * @param retryAfter 재시도까지 남은 시간 (초)
 * @param message 에러 메시지
 */
export function createRateLimitResponse(retryAfter: number, message?: string) {
  const defaultMessage = `너무 많은 시도가 있었습니다. ${Math.ceil(retryAfter / 60)}분 후 다시 시도해주세요.`
  
  return new Response(
    JSON.stringify({ 
      error: message || defaultMessage,
      retryAfter 
    }), 
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  )
}

export default rateLimiter