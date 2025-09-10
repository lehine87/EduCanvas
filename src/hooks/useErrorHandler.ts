/**
 * @file useErrorHandler.ts
 * @description 에러 처리를 위한 커스텀 Hook
 * @module T-V2-012
 */

import React, { useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { 
  logError, 
  showErrorToast, 
  getErrorMessage, 
  getErrorSeverity,
  isRetryable,
  getErrorSuggestion 
} from '@/lib/api/error-handler'

/**
 * 에러 처리 Hook
 */
export function useErrorHandler() {
  const { toast } = useToast()

  /**
   * 일반 에러 처리
   */
  const handleError = useCallback((
    error: unknown,
    context?: {
      action?: string
      component?: string
      silent?: boolean
      showToast?: boolean
      logError?: boolean
    }
  ) => {
    const {
      action = '작업',
      component,
      silent = false,
      showToast = true,
      logError: shouldLog = true
    } = context || {}

    // 에러 로깅
    if (shouldLog) {
      logError(error, { action, component })
    }

    // 토스트 표시 (silent 모드가 아닌 경우)
    if (showToast && !silent) {
      showErrorToast(error, { action })
    }

    return {
      message: getErrorMessage(error),
      severity: getErrorSeverity(error),
      retryable: isRetryable(error),
      suggestion: getErrorSuggestion(error),
    }
  }, [])

  /**
   * React Query 에러 처리
   */
  const handleQueryError = useCallback((
    error: unknown,
    context?: {
      queryKey?: string
      operation?: 'fetch' | 'create' | 'update' | 'delete'
      silent?: boolean
    }
  ) => {
    const {
      queryKey,
      operation = 'fetch',
      silent = false
    } = context || {}

    const operationLabels = {
      fetch: '조회',
      create: '생성',
      update: '수정',
      delete: '삭제'
    }

    return handleError(error, {
      action: `강사 ${operationLabels[operation]}`,
      component: 'ReactQuery',
      silent,
      showToast: !silent,
      logError: true
    })
  }, [handleError])

  /**
   * 폼 에러 처리
   */
  const handleFormError = useCallback((
    error: unknown,
    context?: {
      formName?: string
      fieldName?: string
      showToast?: boolean
    }
  ) => {
    const {
      formName = '폼',
      fieldName,
      showToast = true
    } = context || {}

    const action = fieldName ? 
      `${formName} ${fieldName} 필드 처리` : 
      `${formName} 제출`

    return handleError(error, {
      action,
      component: 'Form',
      showToast,
      logError: true
    })
  }, [handleError])

  /**
   * 네트워크 에러 처리
   */
  const handleNetworkError = useCallback((
    error: unknown,
    context?: {
      url?: string
      method?: string
      retry?: () => void
    }
  ) => {
    const { url, method = 'GET', retry } = context || {}
    
    const result = handleError(error, {
      action: '네트워크 요청',
      component: 'Network',
      showToast: true,
      logError: true
    })

    // 네트워크 에러인 경우 재시도 옵션 제공
    if (result.retryable && retry) {
      toast({
        title: '네트워크 오류',
        description: `${result.message} 다시 시도하시겠습니까?`,
        variant: 'destructive',
        // action with retry functionality
        // Note: action removed due to TypeScript limitations in .ts files
      })
    }

    return result
  }, [handleError, toast])

  /**
   * 비즈니스 로직 에러 처리
   */
  const handleBusinessError = useCallback((
    error: unknown,
    context?: {
      businessRule?: string
      suggestion?: string
    }
  ) => {
    const { businessRule, suggestion } = context || {}
    
    const result = handleError(error, {
      action: businessRule || '비즈니스 규칙 검증',
      component: 'Business',
      showToast: true,
      logError: false // 비즈니스 에러는 일반적으로 예상된 에러
    })

    // 커스텀 제안이 있으면 사용
    if (suggestion) {
      toast({
        title: '규칙 위반',
        description: `${result.message}\n\n💡 ${suggestion}`,
        variant: 'destructive',
      })
    }

    return result
  }, [handleError, toast])

  /**
   * 권한 에러 처리
   */
  const handlePermissionError = useCallback((
    error: unknown,
    context?: {
      requiredRole?: string
      resource?: string
    }
  ) => {
    const { requiredRole, resource = '리소스' } = context || {}
    
    const customMessage = requiredRole ? 
      `${resource}에 접근하려면 ${requiredRole} 권한이 필요합니다.` :
      `${resource}에 대한 권한이 없습니다.`

    toast({
      title: '접근 권한 없음',
      description: customMessage,
      variant: 'destructive',
      // action with permission request functionality
      // Note: action removed due to TypeScript limitations in .ts files
    })

    return handleError(error, {
      action: '권한 확인',
      component: 'Permission',
      showToast: false, // 이미 커스텀 토스트 표시
      logError: true
    })
  }, [handleError, toast])

  /**
   * 에러 복구 유틸리티
   */
  const handleErrorWithRetry = useCallback(<T extends any>(
    operation: () => Promise<T>,
    context?: {
      maxRetries?: number
      retryDelay?: number
      onRetry?: (attempt: number) => void
      onMaxRetriesExceeded?: () => void
    }
  ) => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onRetry,
      onMaxRetriesExceeded
    } = context || {}

    let retryCount = 0

    const executeWithRetry = async (): Promise<T> => {
      try {
        return await operation()
      } catch (error) {
        const errorInfo = handleError(error, {
          component: 'RetryHandler',
          showToast: false, // 재시도 중에는 토스트 표시 안함
          logError: retryCount === 0 // 첫 번째 시도에만 로그
        })

        if (errorInfo.retryable && retryCount < maxRetries) {
          retryCount++
          onRetry?.(retryCount)
          
          // 지연 후 재시도
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount))
          return executeWithRetry()
        } else {
          // 최대 재시도 횟수 초과 또는 재시도 불가능한 에러
          if (retryCount >= maxRetries) {
            onMaxRetriesExceeded?.()
            showErrorToast(error, { 
              title: '재시도 실패',
              action: `${retryCount}회 재시도 후 실패` 
            })
          } else {
            showErrorToast(error)
          }
          
          throw error
        }
      }
    }

    return executeWithRetry()
  }, [handleError])

  return {
    handleError,
    handleQueryError,
    handleFormError,
    handleNetworkError,
    handleBusinessError,
    handlePermissionError,
    handleErrorWithRetry,
  }
}