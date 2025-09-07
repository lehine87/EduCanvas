/**
 * 표준화된 애플리케이션 에러 타입
 * @description 일관된 에러 처리 및 사용자 친화적 메시지 제공
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'validation' | 'network' | 'authentication' | 'authorization' | 'business' | 'system'

/**
 * 기본 에러 인터페이스 (apiErrors.ts 호환성을 위함)
 */
export interface BaseError {
  id: string
  message: string
  severity: ErrorSeverity
  category: ErrorCategory
  timestamp: Date
  context?: Record<string, unknown>
}

/**
 * 데이터베이스 에러 인터페이스
 */
export interface DatabaseError extends BaseError {
  query?: string
  table?: string
  constraint?: string
}

/**
 * 인증 에러 인터페이스
 */
export interface AuthenticationError extends Omit<BaseError, 'category' | 'context' | 'severity' | 'timestamp'> {
  category: 'authentication'
  severity: ErrorSeverity
  timestamp: Date
  context?: Record<string, unknown>
  reason?: string
}

/**
 * 인가 에러 인터페이스  
 */
export interface AuthorizationError extends Omit<BaseError, 'category' | 'context' | 'severity' | 'timestamp'> {
  category: 'authorization'
  severity: ErrorSeverity
  timestamp: Date
  context?: Record<string, unknown>
  requiredPermissions: string[]
  userPermissions: string[]
}

/**
 * 네트워크 에러 인터페이스
 */
export interface NetworkError extends Omit<BaseError, 'category' | 'context' | 'severity' | 'timestamp'> {
  category: 'network'
  severity: ErrorSeverity
  timestamp: Date
  context?: Record<string, unknown>
  url: string
  status: number
  method: string
}

/**
 * 비즈니스 에러 인터페이스 (확장)
 */
export interface BusinessError extends AppError {
  businessRule: string
  affectedEntities: string[]
}

/**
 * 기본 애플리케이션 에러 인터페이스
 */
export interface AppError {
  code: string
  message: string
  userMessage: string
  severity: ErrorSeverity
  category: ErrorCategory
  details?: Record<string, unknown>
  timestamp: Date
  context?: {
    userId?: string
    tenantId?: string
    component?: string
    action?: string
  }
}

/**
 * API 응답 에러
 */
export interface ApiError extends AppError {
  status: number
  endpoint: string
  method: string
}

/**
 * 검증 에러 (확장)
 */
export interface ValidationError extends BaseError {
  field: string
  value: unknown
  constraint: string
}

/**
 * 표준 에러 클래스들
 */
export class AppErrorBase extends Error implements AppError {
  public readonly code: string
  public readonly userMessage: string
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly details?: Record<string, unknown>
  public readonly timestamp: Date
  public readonly context?: AppError['context']

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = 'medium',
    category: ErrorCategory = 'system',
    details?: Record<string, unknown>,
    context?: AppError['context']
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.userMessage = userMessage
    this.severity = severity
    this.category = category
    this.details = details
    this.timestamp = new Date()
    this.context = context

    // V8 스택 트레이스 개선
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 로그용 JSON 직렬화
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      category: this.category,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    }
  }

  /**
   * 사용자 표시용 메시지
   */
  getDisplayMessage(): string {
    return this.userMessage || this.message
  }
}

/**
 * 학생 관리 관련 에러들
 */
export class StudentNotFoundError extends AppErrorBase {
  constructor(studentId: string, context?: AppError['context']) {
    super(
      'STUDENT_NOT_FOUND',
      `Student with ID ${studentId} not found`,
      '요청한 학생을 찾을 수 없습니다.',
      'medium',
      'business',
      { studentId },
      context
    )
  }
}

export class StudentValidationError extends AppErrorBase {
  constructor(field: string, value: unknown, constraint: string, context?: AppError['context']) {
    super(
      'STUDENT_VALIDATION_ERROR',
      `Invalid ${field}: ${constraint}`,
      `${field} 값이 올바르지 않습니다: ${constraint}`,
      'medium',
      'validation',
      { field, value, constraint },
      context
    )
  }
}

export class DuplicateStudentNumberError extends AppErrorBase {
  constructor(studentNumber: string, context?: AppError['context']) {
    super(
      'DUPLICATE_STUDENT_NUMBER',
      `Student number ${studentNumber} already exists`,
      '이미 존재하는 학번입니다.',
      'medium',
      'business',
      { studentNumber },
      context
    )
  }
}

/**
 * API 관련 에러들
 */
export class NetworkError extends AppErrorBase {
  constructor(endpoint: string, status?: number, context?: AppError['context']) {
    super(
      'NETWORK_ERROR',
      `Network request failed: ${endpoint}`,
      '네트워크 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      'high',
      'network',
      { endpoint, status },
      context
    )
  }
}

export class AuthenticationError extends AppErrorBase {
  constructor(context?: AppError['context']) {
    super(
      'AUTHENTICATION_ERROR',
      'Authentication failed',
      '로그인이 필요합니다.',
      'high',
      'authentication',
      undefined,
      context
    )
  }
}

export class AuthorizationError extends AppErrorBase {
  constructor(action: string, resource: string, context?: AppError['context']) {
    super(
      'AUTHORIZATION_ERROR',
      `Insufficient permissions for ${action} on ${resource}`,
      '해당 작업을 수행할 권한이 없습니다.',
      'high',
      'authorization',
      { action, resource },
      context
    )
  }
}

/**
 * 에러 팩토리 함수들
 */
export function createStudentError(type: 'notFound', studentId: string, context?: AppError['context']): StudentNotFoundError
export function createStudentError(type: 'validation', field: string, value: unknown, constraint: string, context?: AppError['context']): StudentValidationError
export function createStudentError(type: 'duplicateNumber', studentNumber: string, context?: AppError['context']): DuplicateStudentNumberError
export function createStudentError(
  type: 'notFound' | 'validation' | 'duplicateNumber',
  ...args: unknown[]
): AppErrorBase {
  switch (type) {
    case 'notFound':
      return new StudentNotFoundError(args[0] as string, args[1] as AppError['context'])
    case 'validation':
      return new StudentValidationError(
        args[0] as string,
        args[1],
        args[2] as string,
        args[3] as AppError['context']
      )
    case 'duplicateNumber':
      return new DuplicateStudentNumberError(args[0] as string, args[1] as AppError['context'])
    default:
      throw new Error(`Unknown student error type: ${type}`)
  }
}

export function createApiError(endpoint: string, status: number, message: string, context?: AppError['context']): AppErrorBase {
  if (status === 401) {
    return new AuthenticationError(context)
  }
  if (status === 403) {
    return new AuthorizationError('request', endpoint, context)
  }
  if (status >= 500) {
    return new NetworkError(endpoint, status, context)
  }
  
  return new AppErrorBase(
    `API_ERROR_${status}`,
    message,
    '요청 처리 중 오류가 발생했습니다.',
    'medium',
    'network',
    { endpoint, status },
    context
  )
}

/**
 * 에러 타입 가드들
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'severity' in error &&
    'category' in error &&
    'timestamp' in error
  )
}

export function isValidationError(error: unknown): error is ValidationError {
  return isAppError(error) && 'field' in error && 'constraint' in error
}

export function isNetworkError(error: unknown): error is NetworkError {
  return isAppError(error) && error.category === 'network'
}

export function isAuthError(error: unknown): error is AuthenticationError | AuthorizationError {
  return isAppError(error) && (error.category === 'authentication' || error.category === 'authorization')
}

/**
 * 에러 처리 유틸리티
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message || error.code || 'Unknown error'
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isAppError(error)) {
    return error.severity
  }
  return 'medium'
}

export function shouldRetryError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true
  }
  if (isAppError(error) && error.code === 'TIMEOUT') {
    return true
  }
  return false
}

/**
 * 에러 로깅 헬퍼
 */
export function logError(error: unknown, context?: AppError['context']) {
  // error가 null/undefined인 경우 안전하게 처리
  const safeErrorMessage = (() => {
    try {
      if (error === null) return 'null error'
      if (error === undefined) return 'undefined error'  
      if (error instanceof Error) return error.message
      return String(error)
    } catch (e) {
      return 'Unknown error (failed to convert to string)'
    }
  })()
  
  const errorObj = isAppError(error) ? error : new AppErrorBase(
    'UNKNOWN_ERROR',
    safeErrorMessage,
    '예상치 못한 오류가 발생했습니다.',
    'medium',
    'system',
    undefined,
    context
  )

  try {
    console.error(`[${errorObj.severity.toUpperCase()}] ${errorObj.code}:`, JSON.stringify(errorObj))
  } catch (e) {
    // JSON.stringify 실패 시 간단한 객체로 로깅
    console.error(`[${errorObj.severity.toUpperCase()}] ${errorObj.code}:`, {
      message: errorObj.message,
      code: errorObj.code,
      context: errorObj.context
    })
  }
  
  // Sentry나 다른 에러 추적 서비스에 전송
  if (typeof window !== 'undefined' && (window as unknown as { Sentry?: unknown }).Sentry) {
    const Sentry = (window as unknown as { Sentry: { captureException: (error: unknown, options?: unknown) => void } }).Sentry
    Sentry.captureException(errorObj, {
      tags: {
        errorCode: errorObj.code,
        severity: errorObj.severity,
        category: errorObj.category
      },
      extra: errorObj.details,
      contexts: {
        app: errorObj.context
      }
    })
  }
}