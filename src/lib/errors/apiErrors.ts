import { PostgrestError } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import type { 
  BaseError, 
  ErrorSeverity, 
  ErrorCategory,
  ValidationError as ValidationErrorType,
  AuthenticationError as AuthenticationErrorType,
  AuthorizationError as AuthorizationErrorType,
  NetworkError as NetworkErrorType,
  DatabaseError as DatabaseErrorType,
  BusinessError as BusinessErrorType,
} from '@/types/error.types'

/**
 * 기본 API 에러 클래스
 */
export class APIError extends Error implements BaseError {
  public readonly id: string
  public readonly code: string
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly context: Record<string, unknown>
  public readonly timestamp: Date
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public override readonly cause?: Error | BaseError

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message)
    this.name = 'APIError'
    this.id = `API_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.code = code || 'API_ERROR'
    this.statusCode = statusCode
    this.details = details
    this.cause = cause
    this.timestamp = new Date()
    this.context = { source: 'backend', statusCode }
    
    // 상태 코드에 따른 심각도 설정
    if (statusCode >= 500) {
      this.severity = 'critical'
      this.category = 'system'
    } else if (statusCode >= 400) {
      this.severity = 'medium'
      this.category = 'validation'
    } else {
      this.severity = 'low'
      this.category = 'business'
    }
    
    // 스택 트레이스 캡처
    Error.captureStackTrace(this, APIError)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      category: this.category,
      details: this.details,
      timestamp: this.timestamp,
    }
  }
}

/**
 * 유효성 검증 에러
 */
export class ValidationError extends APIError implements Partial<ValidationErrorType> {
  public override readonly category: 'validation' = 'validation'
  public readonly field?: string
  public readonly value?: unknown
  public readonly constraint?: string
  public readonly validationRules?: Array<{
    rule: string
    message: string
    passed: boolean
  }>

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    field?: string,
    value?: unknown
  ) {
    super(message, 400, 'VALIDATION_ERROR', fields)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * 인증 에러
 */
export class AuthenticationError extends APIError {
  public readonly reason?: string

  constructor(
    message = '인증에 실패했습니다',
    reason?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 401, 'AUTH_ERROR', details)
    this.name = 'AuthenticationError'
    this.reason = reason
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * 인가 에러
 */
export class AuthorizationError extends APIError {
  public readonly requiredPermissions: string[]
  public readonly userPermissions: string[]

  constructor(
    message = '권한이 없습니다',
    requiredPermissions: string[] = [],
    userPermissions: string[] = [],
    details?: Record<string, unknown>
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', details)
    this.name = 'AuthorizationError'
    this.requiredPermissions = requiredPermissions
    this.userPermissions = userPermissions
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * 리소스를 찾을 수 없음
 */
export class NotFoundError extends APIError {
  constructor(
    message = '요청한 리소스를 찾을 수 없습니다',
    resource?: string
  ) {
    super(message, 404, 'NOT_FOUND', { resource })
    this.name = 'NotFoundError'
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * 충돌 에러 (중복 등)
 */
export class ConflictError extends APIError {
  constructor(
    message = '리소스 충돌이 발생했습니다',
    conflictingField?: string
  ) {
    super(message, 409, 'CONFLICT', { conflictingField })
    this.name = 'ConflictError'
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * Rate Limit 에러
 */
export class RateLimitError extends APIError {
  public readonly retryAfter?: number

  constructor(
    message = '요청 제한을 초과했습니다',
    retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter })
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * 서버 에러
 */
export class InternalServerError extends APIError {
  constructor(
    message = '서버 오류가 발생했습니다',
    cause?: Error
  ) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', undefined, cause)
    this.name = 'InternalServerError'
    // severity와 category는 부모 클래스에서 설정됨
  }
}

/**
 * 데이터베이스 에러
 */
export class DatabaseError extends APIError {
  public readonly query?: string
  public readonly table?: string
  public readonly constraint?: string

  constructor(
    message = '데이터베이스 오류가 발생했습니다',
    error?: PostgrestError,
    queryParam?: string
  ) {
    const details = {
      query: queryParam,
      ...(error && {
        table: error.details,
        constraint: error.code,
      })
    }
    
    super(message, 500, 'DATABASE_ERROR', details, error)
    this.name = 'DatabaseError'
    this.query = queryParam
    this.table = error?.details
    this.constraint = error?.code
    // severity와 category는 부모 클래스에서 statusCode에 따라 설정됨
  }
}

/**
 * 비즈니스 로직 에러
 */
export class BusinessLogicError extends APIError implements Partial<BusinessErrorType> {
  public readonly businessRule?: string
  public readonly entityType?: string
  public readonly entityId?: string

  constructor(
    message: string,
    rule: string,
    entityType?: string,
    entityId?: string
  ) {
    super(message, 400, 'BUSINESS_RULE_VIOLATION', { rule, entityType, entityId })
    this.name = 'BusinessLogicError'
    this.businessRule = rule
    this.entityType = entityType
    this.entityId = entityId
    // severity와 category는 부모 클래스에서 statusCode에 따라 설정됨
  }
}

/**
 * Supabase 에러를 API 에러로 변환
 */
export function transformSupabaseError(error: PostgrestError | AuthError): APIError {
  // PostgrestError 처리
  if ('code' in error && 'message' in error && 'details' in error) {
    const pgError = error as PostgrestError
    
    // 권한 에러
    if (pgError.message.includes('row-level security') || 
        pgError.code === '42501') {
      return new AuthorizationError(
        '해당 데이터에 접근할 권한이 없습니다',
        ['resource_access'],
        []
      )
    }
    
    // 찾을 수 없음
    if (pgError.code === 'PGRST116') {
      return new NotFoundError()
    }
    
    // 중복 키 에러
    if (pgError.code === '23505') {
      return new ConflictError('이미 존재하는 데이터입니다')
    }
    
    // 외래 키 제약 조건
    if (pgError.code === '23503') {
      return new ValidationError('참조하는 데이터가 존재하지 않습니다')
    }
    
    // 기타 데이터베이스 에러
    return new DatabaseError(pgError.message, pgError)
  }
  
  // AuthError 처리
  if ('name' in error && error.name === 'AuthError') {
    const authError = error as AuthError
    
    // 토큰 만료
    if (authError.message.includes('expired')) {
      return new AuthenticationError('세션이 만료되었습니다', 'token_expired')
    }
    
    // 잘못된 자격 증명
    if (authError.message.includes('Invalid login credentials')) {
      return new AuthenticationError('이메일 또는 비밀번호가 올바르지 않습니다', 'invalid_credentials')
    }
    
    // 기타 인증 에러
    return new AuthenticationError(authError.message)
  }
  
  // 알 수 없는 에러
  return new InternalServerError('알 수 없는 오류가 발생했습니다', error as Error)
}

/**
 * 에러를 HTTP 응답으로 변환
 */
export function errorToResponse(error: unknown) {
  // APIError 인스턴스
  if (error instanceof APIError) {
    return {
      error: error.toJSON(),
      status: error.statusCode,
    }
  }
  
  // Supabase 에러
  if (error && typeof error === 'object' && ('code' in error || 'name' in error)) {
    // PostgrestError 또는 AuthError인지 확인
    if ('code' in error && 'message' in error) {
      const apiError = transformSupabaseError(error as PostgrestError | AuthError)
      return {
        error: apiError.toJSON(),
        status: apiError.statusCode,
      }
    }
  }
  
  // 일반 Error
  if (error instanceof Error) {
    const internalError = new InternalServerError(error.message, error)
    return {
      error: internalError.toJSON(),
      status: 500,
    }
  }
  
  // 알 수 없는 에러
  const unknownError = new InternalServerError('알 수 없는 오류가 발생했습니다')
  return {
    error: unknownError.toJSON(),
    status: 500,
  }
}

/**
 * 에러 로깅 헬퍼
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  // 콘솔 로그
  console.error('[API Error]:', error)
  
  if (context) {
    console.error('[API Error Context]:', context)
  }
  
  // Sentry 리포팅 (프로덕션)
  if (process.env.NODE_ENV === 'production') {
    if (error instanceof APIError) {
      // APIError는 상태 코드에 따라 레벨 설정
      const level = error.statusCode >= 500 ? 'error' : 'warning'
      
      Sentry.withScope((scope) => {
        scope.setLevel(level)
        scope.setTag('error.type', error.name)
        scope.setTag('error.code', error.code)
        scope.setTag('error.statusCode', error.statusCode)
        
        if (context) {
          scope.setContext('error.context', context)
        }
        
        if (error.details) {
          scope.setContext('error.details', error.details)
        }
        
        Sentry.captureException(error)
      })
    } else {
      // 일반 에러
      Sentry.captureException(error)
    }
  }
}