import { NextResponse } from 'next/server'

/**
 * 표준 API 응답 형식 (업계 표준)
 * 모든 API가 일관된 형태로 응답하도록 보장
 */
export interface StandardApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
  timestamp: string
  request_id?: string
}

/**
 * 페이지네이션 메타데이터 (Cursor-based)
 */
export interface PaginationMetadata {
  cursor: string | null
  has_more: boolean
  total_count?: number
  per_page: number
}

/**
 * 페이지네이션된 응답 데이터
 */
export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMetadata
  metadata: {
    filters_applied: string[]
    sort_applied: string
    search_query?: string
    execution_time_ms?: number
  }
}

/**
 * 성공 응답 생성 (표준)
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: StandardApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    request_id: generateRequestId(),
  }

  return NextResponse.json(response, { status })
}

/**
 * 페이지네이션된 응답 생성 (업계 표준)
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationMetadata,
  metadata: {
    filters_applied?: string[]
    sort_applied?: string
    search_query?: string
    execution_time_ms?: number
  } = {},
  status: number = 200
): NextResponse {
  const data: PaginatedData<T> = {
    items,
    pagination,
    metadata: {
      filters_applied: metadata.filters_applied || [],
      sort_applied: metadata.sort_applied || 'default',
      search_query: metadata.search_query,
      execution_time_ms: metadata.execution_time_ms,
    },
  }

  return createSuccessResponse(data, undefined, status)
}

/**
 * 에러 응답 생성 (표준)
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown[],
  status: number = 400
): NextResponse {
  const response: StandardApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    request_id: generateRequestId(),
  }

  return NextResponse.json(response, { status })
}

/**
 * Validation 에러 응답 생성
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string; code?: string }>,
  message: string = 'Validation failed'
): NextResponse {
  return createErrorResponse(
    'VALIDATION_ERROR',
    message,
    errors,
    422
  )
}

/**
 * 인증 에러 응답
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required'
): NextResponse {
  return createErrorResponse(
    'AUTHENTICATION_REQUIRED',
    message,
    undefined,
    401
  )
}

/**
 * 권한 에러 응답
 */
export function createForbiddenErrorResponse(
  message: string = 'Insufficient permissions'
): NextResponse {
  return createErrorResponse(
    'FORBIDDEN',
    message,
    undefined,
    403
  )
}

/**
 * 리소스 없음 에러 응답
 */
export function createNotFoundErrorResponse(
  resource: string = 'Resource'
): NextResponse {
  return createErrorResponse(
    'RESOURCE_NOT_FOUND',
    `${resource} not found`,
    undefined,
    404
  )
}

/**
 * 서버 에러 응답
 */
export function createServerErrorResponse(
  message: string = 'Internal server error',
  error?: Error
): NextResponse {
  // 프로덕션에서는 상세 에러 정보를 로그에만 기록
  const details = process.env.NODE_ENV === 'development' && error 
    ? [{ stack: error.stack }]
    : undefined

  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    message,
    details,
    500
  )
}

/**
 * Rate limit 에러 응답
 */
export function createRateLimitErrorResponse(
  message: string = 'Too many requests'
): NextResponse {
  return createErrorResponse(
    'RATE_LIMIT_EXCEEDED',
    message,
    undefined,
    429
  )
}

/**
 * Request ID 생성 (추적용)
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 실행 시간 측정 유틸리티
 */
export class ExecutionTimer {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  getExecutionTime(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Cursor 생성 유틸리티 (Pagination용)
 */
export function generateCursor(item: { created_at?: string | Date; id?: string }): string {
  if (item.created_at) {
    const timestamp = typeof item.created_at === 'string' 
      ? item.created_at 
      : item.created_at.toISOString()
    return Buffer.from(`${timestamp}:${item.id || ''}`).toString('base64')
  }
  return Buffer.from(item.id || '').toString('base64')
}

/**
 * Cursor 파싱 유틸리티
 */
export function parseCursor(cursor: string): { timestamp?: string; id?: string } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    const [timestamp, id] = decoded.split(':')
    return { timestamp, id }
  } catch (error) {
    throw new Error('Invalid cursor format')
  }
}

/**
 * API 응답 헤더 설정 (보안 + 성능)
 */
export function setStandardHeaders(response: NextResponse): NextResponse {
  // CORS 헤더
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 보안 헤더
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 캐싱 헤더 (검색 결과는 짧은 캐시)
  response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120')
  
  return response
}