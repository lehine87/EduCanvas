/**
 * 🚨 Auth 모듈 전용 에러 처리 시스템
 * 
 * 특징:
 * - 타입 안전성 보장 (TypeScript 엄격 모드)
 * - 사용자 친화적 메시지 변환
 * - 보안 감사 로깅 통합
 * - 국제화 지원 (i18n 준비)
 * - 에러 복구 전략 제공
 * 
 * @version 1.0.0
 * @author Claude AI
 * @created 2025-01-10
 */

import { AuditLog } from '@/lib/security/AuditLogger'
import type { UserProfile } from '@/types/auth.types'

/**
 * 인증 관련 에러 분류
 */
export enum AuthErrorType {
  // 사용자 입력 관련
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  
  // 시스템/네트워크 관련
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // 보안 관련
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // 계정 상태 관련
  ACCOUNT_NOT_VERIFIED = 'ACCOUNT_NOT_VERIFIED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // 권한 관련
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  
  // 기타
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * 에러 심각도 레벨
 */
export enum AuthErrorSeverity {
  LOW = 'LOW',        // 일반적인 사용자 실수 (잘못된 비밀번호 등)
  MEDIUM = 'MEDIUM',  // 시스템 문제 (네트워크 에러 등)
  HIGH = 'HIGH',      // 보안 문제 (무차별 대입 공격 등)
  CRITICAL = 'CRITICAL' // 심각한 시스템 장애
}

/**
 * 에러 복구 전략
 */
export enum AuthErrorRecovery {
  RETRY_IMMEDIATE = 'RETRY_IMMEDIATE',     // 즉시 재시도 가능
  RETRY_AFTER_DELAY = 'RETRY_AFTER_DELAY', // 지연 후 재시도
  USER_ACTION_REQUIRED = 'USER_ACTION_REQUIRED', // 사용자 조치 필요
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',     // 고객 지원 연락 필요
  NO_RECOVERY = 'NO_RECOVERY'              // 복구 불가
}

/**
 * 구조화된 인증 에러
 */
export class AuthError extends Error {
  readonly type: AuthErrorType
  readonly severity: AuthErrorSeverity
  readonly recovery: AuthErrorRecovery
  readonly userMessage: string
  readonly technicalDetails?: string
  readonly retryAfter?: number // 초 단위
  readonly context?: Record<string, unknown>
  readonly timestamp: Date

  constructor(
    type: AuthErrorType,
    message: string,
    options: {
      severity?: AuthErrorSeverity
      recovery?: AuthErrorRecovery
      userMessage?: string
      technicalDetails?: string
      retryAfter?: number
      context?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    super(message)
    
    this.name = 'AuthError'
    this.type = type
    this.severity = options.severity ?? AuthErrorSeverity.MEDIUM
    this.recovery = options.recovery ?? AuthErrorRecovery.USER_ACTION_REQUIRED
    this.userMessage = options.userMessage ?? this.getDefaultUserMessage(type)
    this.technicalDetails = options.technicalDetails
    this.retryAfter = options.retryAfter
    this.context = options.context
    this.timestamp = new Date()

    // 에러 체이닝 지원
    if (options.cause) {
      this.cause = options.cause
    }
  }

  /**
   * 에러 타입별 기본 사용자 메시지
   */
  private getDefaultUserMessage(type: AuthErrorType): string {
    const messages: Record<AuthErrorType, string> = {
      [AuthErrorType.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
      [AuthErrorType.INVALID_EMAIL]: '올바른 이메일 주소를 입력해주세요.',
      [AuthErrorType.WEAK_PASSWORD]: '비밀번호가 보안 요구사항을 충족하지 않습니다.',
      [AuthErrorType.PASSWORD_MISMATCH]: '비밀번호가 일치하지 않습니다.',
      
      [AuthErrorType.NETWORK_ERROR]: '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      [AuthErrorType.SERVER_ERROR]: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      [AuthErrorType.DATABASE_ERROR]: '데이터베이스 연결에 문제가 있습니다. 관리자에게 문의하세요.',
      [AuthErrorType.SERVICE_UNAVAILABLE]: '서비스가 일시적으로 사용할 수 없습니다.',
      
      [AuthErrorType.RATE_LIMIT_EXCEEDED]: '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
      [AuthErrorType.ACCOUNT_LOCKED]: '계정이 잠겨있습니다. 관리자에게 문의하세요.',
      [AuthErrorType.SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
      [AuthErrorType.UNAUTHORIZED_ACCESS]: '권한이 없습니다.',
      
      [AuthErrorType.ACCOUNT_NOT_VERIFIED]: '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.',
      [AuthErrorType.ACCOUNT_SUSPENDED]: '계정이 일시정지 상태입니다. 관리자에게 문의하세요.',
      [AuthErrorType.ACCOUNT_NOT_FOUND]: '존재하지 않는 계정입니다.',
      [AuthErrorType.EMAIL_ALREADY_EXISTS]: '이미 등록된 이메일 주소입니다.',
      
      [AuthErrorType.INSUFFICIENT_PERMISSIONS]: '충분한 권한이 없습니다.',
      [AuthErrorType.TENANT_ACCESS_DENIED]: '해당 학원에 접근할 권한이 없습니다.',
      
      [AuthErrorType.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
      [AuthErrorType.VALIDATION_ERROR]: '입력값이 올바르지 않습니다.'
    }

    return messages[type] || '오류가 발생했습니다.'
  }

  /**
   * 에러를 JSON으로 직렬화 (로깅용)
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      recovery: this.recovery,
      message: this.message,
      userMessage: this.userMessage,
      technicalDetails: this.technicalDetails,
      retryAfter: this.retryAfter,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}

/**
 * 🚨 인증 에러 처리기
 */
export class AuthErrorHandler {
  /**
   * Supabase 에러를 AuthError로 변환
   */
  static fromSupabaseError(error: any): AuthError {
    if (!error) {
      return new AuthError(AuthErrorType.UNKNOWN_ERROR, 'Unknown error occurred')
    }

    const errorMessage = error.message || error.error_description || 'Unknown error'
    const errorCode = error.error_code || error.status || error.code

    // 🔒 Supabase 에러 코드 매핑
    switch (errorCode) {
      case 'invalid_credentials':
        return new AuthError(AuthErrorType.INVALID_CREDENTIALS, errorMessage, {
          severity: AuthErrorSeverity.LOW,
          recovery: AuthErrorRecovery.USER_ACTION_REQUIRED
        })

      case 'email_not_confirmed':
        return new AuthError(AuthErrorType.ACCOUNT_NOT_VERIFIED, errorMessage, {
          severity: AuthErrorSeverity.MEDIUM,
          recovery: AuthErrorRecovery.USER_ACTION_REQUIRED,
          userMessage: '이메일 인증이 완료되지 않았습니다. 인증 메일을 확인해주세요.'
        })

      case 'user_not_found':
        return new AuthError(AuthErrorType.ACCOUNT_NOT_FOUND, errorMessage, {
          severity: AuthErrorSeverity.LOW,
          recovery: AuthErrorRecovery.USER_ACTION_REQUIRED
        })

      case 'email_address_invalid':
        return new AuthError(AuthErrorType.INVALID_EMAIL, errorMessage, {
          severity: AuthErrorSeverity.LOW,
          recovery: AuthErrorRecovery.USER_ACTION_REQUIRED
        })

      case 'signup_disabled':
        return new AuthError(AuthErrorType.SERVICE_UNAVAILABLE, errorMessage, {
          severity: AuthErrorSeverity.HIGH,
          recovery: AuthErrorRecovery.CONTACT_SUPPORT,
          userMessage: '현재 회원가입이 일시 중단되었습니다.'
        })

      case 422: // Validation error
        return new AuthError(AuthErrorType.VALIDATION_ERROR, errorMessage, {
          severity: AuthErrorSeverity.LOW,
          recovery: AuthErrorRecovery.USER_ACTION_REQUIRED
        })

      case 429: // Rate limit
        return new AuthError(AuthErrorType.RATE_LIMIT_EXCEEDED, errorMessage, {
          severity: AuthErrorSeverity.HIGH,
          recovery: AuthErrorRecovery.RETRY_AFTER_DELAY,
          retryAfter: 60
        })

      case 500:
      case 502:
      case 503:
        return new AuthError(AuthErrorType.SERVER_ERROR, errorMessage, {
          severity: AuthErrorSeverity.CRITICAL,
          recovery: AuthErrorRecovery.RETRY_AFTER_DELAY,
          retryAfter: 30
        })

      default:
        return new AuthError(AuthErrorType.UNKNOWN_ERROR, errorMessage, {
          severity: AuthErrorSeverity.MEDIUM,
          recovery: AuthErrorRecovery.CONTACT_SUPPORT,
          technicalDetails: `Supabase error: ${errorCode}`,
          context: { originalError: error }
        })
    }
  }

  /**
   * Rate Limit 에러 생성
   */
  static createRateLimitError(retryAfter?: number): AuthError {
    return new AuthError(AuthErrorType.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', {
      severity: AuthErrorSeverity.HIGH,
      recovery: AuthErrorRecovery.RETRY_AFTER_DELAY,
      retryAfter: retryAfter || 60,
      userMessage: retryAfter 
        ? `너무 많은 시도가 있었습니다. ${retryAfter}초 후 다시 시도해주세요.`
        : '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
    })
  }

  /**
   * 네트워크 에러 생성
   */
  static createNetworkError(originalError?: Error): AuthError {
    return new AuthError(AuthErrorType.NETWORK_ERROR, 'Network connection failed', {
      severity: AuthErrorSeverity.MEDIUM,
      recovery: AuthErrorRecovery.RETRY_IMMEDIATE,
      cause: originalError,
      context: { 
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true 
      }
    })
  }

  /**
   * 권한 부족 에러 생성
   */
  static createPermissionError(resource?: string, action?: string): AuthError {
    return new AuthError(AuthErrorType.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions', {
      severity: AuthErrorSeverity.MEDIUM,
      recovery: AuthErrorRecovery.CONTACT_SUPPORT,
      context: { resource, action }
    })
  }

  /**
   * 🔒 에러 로깅 및 감사
   */
  static logAndHandle(
    error: AuthError, 
    user?: UserProfile, 
    context?: { 
      ipAddress?: string, 
      userAgent?: string,
      operation?: string 
    }
  ): AuthError {
    // 1. 보안 감사 로깅
    this.performSecurityLogging(error, user, context)

    // 2. 개발 환경에서 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 [AUTH-ERROR]', {
        type: error.type,
        severity: error.severity,
        recovery: error.recovery,
        message: error.message,
        userMessage: error.userMessage,
        context: error.context,
        stack: error.stack
      })
    }

    // 3. 프로덕션에서는 민감한 정보 제거
    if (process.env.NODE_ENV === 'production' && error.severity === AuthErrorSeverity.CRITICAL) {
      // 중요한 에러는 에러 추적 서비스로 전송 (Sentry 등)
      // 추후 구현 예정
    }

    return error
  }

  /**
   * 🔒 보안 감사 로깅 수행
   */
  private static performSecurityLogging(
    error: AuthError, 
    user?: UserProfile, 
    context?: { ipAddress?: string, userAgent?: string, operation?: string }
  ): void {
    // 보안 관련 에러만 감사 로그에 기록
    const securityErrors = [
      AuthErrorType.RATE_LIMIT_EXCEEDED,
      AuthErrorType.UNAUTHORIZED_ACCESS,
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.INVALID_CREDENTIALS
    ]

    if (securityErrors.includes(error.type)) {
      AuditLog.suspicious(
        user,
        `Security-related auth error: ${error.type}`,
        context?.ipAddress,
        context?.userAgent
      )
    }

    // 계정 관련 에러는 별도 로깅
    const accountErrors = [
      AuthErrorType.ACCOUNT_SUSPENDED,
      AuthErrorType.ACCOUNT_NOT_VERIFIED,
      AuthErrorType.EMAIL_ALREADY_EXISTS
    ]

    if (accountErrors.includes(error.type) && user) {
      AuditLog.custom('SYS_USER_REMOVED', {
        user,
        errorType: error.type,
        operation: context?.operation,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent
      })
    }
  }

  /**
   * 사용자 친화적 에러 메시지 생성
   */
  static getUserFriendlyMessage(error: unknown): string {
    if (error instanceof AuthError) {
      return error.userMessage
    }

    if (error instanceof Error) {
      // 일반적인 JavaScript 에러를 친화적 메시지로 변환
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.'
      }

      if (error.message.includes('timeout')) {
        return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      }
    }

    return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  /**
   * 에러 복구 가능성 확인
   */
  static isRecoverable(error: AuthError): boolean {
    return error.recovery !== AuthErrorRecovery.NO_RECOVERY
  }

  /**
   * 재시도 지연 시간 계산
   */
  static getRetryDelay(error: AuthError): number {
    if (error.retryAfter) {
      return error.retryAfter * 1000 // 밀리초로 변환
    }

    // 에러 타입별 기본 지연 시간
    switch (error.recovery) {
      case AuthErrorRecovery.RETRY_IMMEDIATE:
        return 0
      case AuthErrorRecovery.RETRY_AFTER_DELAY:
        return 3000 // 3초
      default:
        return 0
    }
  }
}

// 편의 함수들
export const createAuthError = (
  type: AuthErrorType, 
  message: string, 
  options?: {
    severity?: AuthErrorSeverity
    recovery?: AuthErrorRecovery
    userMessage?: string
    technicalDetails?: string
    retryAfter?: number
    context?: Record<string, unknown>
    cause?: Error
  }
) => new AuthError(type, message, options)

export const handleAuthError = (error: unknown, user?: UserProfile, context?: Parameters<typeof AuthErrorHandler.logAndHandle>[2]) => {
  if (error instanceof AuthError) {
    return AuthErrorHandler.logAndHandle(error, user, context)
  }
  
  // 일반 에러를 AuthError로 변환
  const authError = error instanceof Error 
    ? new AuthError(AuthErrorType.UNKNOWN_ERROR, error.message, { cause: error })
    : new AuthError(AuthErrorType.UNKNOWN_ERROR, 'Unknown error occurred')
  
  return AuthErrorHandler.logAndHandle(authError, user, context)
}