/**
 * @file error-handler.ts
 * @description API 에러 처리 유틸리티
 * @module T-V2-012
 */

import { toast } from '@/components/ui/use-toast'
import type { ApiError } from './instructors.api'

// 에러 타입 정의
export interface AppError extends Error {
  code?: string
  status?: number
  details?: unknown
  context?: Record<string, any>
  timestamp?: string
}

/**
 * 에러 메시지 매핑
 */
const ERROR_MESSAGES: Record<string, string> = {
  // HTTP 상태 코드
  400: '잘못된 요청입니다.',
  401: '인증이 필요합니다. 다시 로그인해주세요.',
  403: '권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  409: '이미 존재하거나 충돌하는 데이터입니다.',
  422: '입력 데이터가 올바르지 않습니다.',
  429: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
  500: '서버 내부 오류가 발생했습니다.',
  502: '서버에 연결할 수 없습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',

  // 커스텀 에러 코드
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  VALIDATION_ERROR: '입력값이 올바르지 않습니다.',
  PERMISSION_DENIED: '해당 작업을 수행할 권한이 없습니다.',
  RESOURCE_NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  DUPLICATE_ERROR: '이미 존재하는 데이터입니다.',
  BUSINESS_LOGIC_ERROR: '비즈니스 규칙에 위반됩니다.',

  // 강사 관련 특정 에러
  INSTRUCTOR_HAS_ACTIVE_CLASSES: '진행 중인 수업이 있는 강사는 삭제할 수 없습니다.',
  INSTRUCTOR_ALREADY_EXISTS: '이미 등록된 강사입니다.',
  INVALID_INSTRUCTOR_DATA: '강사 정보가 올바르지 않습니다.',
}

/**
 * 에러 메시지 생성
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.'

  // ApiError 타입인 경우
  if (error instanceof Error && 'status' in error) {
    const apiError = error as ApiError
    
    // 커스텀 코드가 있는 경우
    if (apiError.code && ERROR_MESSAGES[apiError.code]) {
      return ERROR_MESSAGES[apiError.code]
    }

    // HTTP 상태 코드로 매핑
    if (apiError.status && ERROR_MESSAGES[apiError.status]) {
      return ERROR_MESSAGES[apiError.status]
    }

    // 서버에서 온 메시지가 있는 경우
    if (apiError.message) {
      return apiError.message
    }
  }

  // 일반 Error 타입인 경우
  if (error instanceof Error) {
    return error.message
  }

  // 문자열인 경우
  if (typeof error === 'string') {
    return error
  }

  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * 에러 심각도 분류
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (!error) return 'low'

  if (error instanceof Error && 'status' in error) {
    const apiError = error as ApiError
    
    switch (apiError.status) {
      case 401:
      case 403:
        return 'high' // 인증/권한 오류
      case 500:
      case 502:
      case 503:
        return 'critical' // 서버 오류
      case 404:
      case 422:
        return 'medium' // 클라이언트 오류
      default:
        return 'low'
    }
  }

  return 'medium'
}

/**
 * 에러 로깅
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo: AppError = {
    name: 'AppError',
    message: getErrorMessage(error),
    timestamp: new Date().toISOString(),
    context,
  }

  // ApiError인 경우 추가 정보 포함
  if (error instanceof Error && 'status' in error) {
    const apiError = error as ApiError
    errorInfo.code = apiError.code
    errorInfo.status = apiError.status
    errorInfo.details = apiError.details
  }

  // 심각도에 따라 다른 로깅 레벨 사용
  const severity = getErrorSeverity(error)
  
  if (severity === 'critical') {
    console.error('[CRITICAL ERROR]', errorInfo)
  } else if (severity === 'high') {
    console.error('[HIGH ERROR]', errorInfo)
  } else if (severity === 'medium') {
    console.warn('[MEDIUM ERROR]', errorInfo)
  } else {
    console.log('[LOW ERROR]', errorInfo)
  }

  // 프로덕션 환경에서는 에러 모니터링 서비스로 전송
  // if (process.env.NODE_ENV === 'production') {
  //   // Sentry, DataDog 등으로 전송
  //   sendToErrorMonitoring(errorInfo)
  // }

  return errorInfo
}

/**
 * 토스트 에러 표시
 */
export function showErrorToast(
  error: unknown, 
  context?: { 
    title?: string
    action?: string
    duration?: number
  }
) {
  const message = getErrorMessage(error)
  const severity = getErrorSeverity(error)
  
  const title = context?.title || 
    (context?.action ? `${context.action} 실패` : '오류 발생')

  toast({
    title,
    description: message,
    variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
  })

  // 에러 로깅도 함께 수행
  logError(error, { title, action: context?.action, ...context })
}

/**
 * 재시도 가능 여부 판단
 */
export function isRetryable(error: unknown): boolean {
  if (!error) return false

  if (error instanceof Error && 'status' in error) {
    const apiError = error as ApiError
    
    // 재시도하지 않을 상태 코드들
    const nonRetryableStatuses = [400, 401, 403, 404, 409, 422]
    
    if (apiError.status && nonRetryableStatuses.includes(apiError.status)) {
      return false
    }
  }

  // 네트워크 오류나 서버 오류는 재시도 가능
  return true
}

/**
 * 에러 복구 제안
 */
export function getErrorSuggestion(error: unknown): string | null {
  if (!error) return null

  if (error instanceof Error && 'status' in error) {
    const apiError = error as ApiError
    
    switch (apiError.status) {
      case 401:
        return '로그인 페이지로 이동하여 다시 로그인하세요.'
      case 403:
        return '관리자에게 권한 요청을 하거나 다른 계정으로 시도하세요.'
      case 404:
        return '페이지를 새로고침하거나 목록에서 다시 선택하세요.'
      case 409:
        return '기존 데이터를 확인하고 다른 정보로 시도하세요.'
      case 422:
        return '입력 정보를 다시 확인하고 수정하세요.'
      case 500:
      case 502:
      case 503:
        return '잠시 후 다시 시도하거나 관리자에게 문의하세요.'
      default:
        return null
    }
  }

  return '문제가 지속되면 관리자에게 문의하세요.'
}