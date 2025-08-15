import { useCallback } from 'react'
import { useErrorToast } from '@/lib/toast/toastConfig'
import { errorDebugger } from '@/lib/debug/errorDebugger'
import { APIError } from '@/lib/errors/apiErrors'
import * as Sentry from '@sentry/nextjs'

interface UseErrorHandlerOptions {
  enableToast?: boolean
  enableDebugger?: boolean
  enableSentry?: boolean
  fallbackMessage?: string
  onError?: (error: unknown) => void
}

interface AsyncOptions extends UseErrorHandlerOptions {
  loadingMessage?: string
  successMessage?: string
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

/**
 * 에러 처리를 위한 통합 Hook
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    enableToast = true,
    enableDebugger = process.env.NODE_ENV === 'development',
    enableSentry = process.env.NODE_ENV === 'production',
    fallbackMessage = '알 수 없는 오류가 발생했습니다',
    onError,
  } = options

  const { showError, handleAsyncError: toastAsyncError } = useErrorToast()

  /**
   * 에러 처리 메인 함수
   */
  const handleError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    console.error('Error handled:', error, context)

    // 커스텀 에러 핸들러 실행
    if (onError) {
      try {
        onError(error)
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError)
      }
    }

    // 디버거에 기록
    if (enableDebugger) {
      try {
        errorDebugger.report(error instanceof Error ? error : new Error(String(error)), context)
      } catch (debuggerError) {
        console.error('Error in debugger:', debuggerError)
      }
    }

    // Sentry에 리포트
    if (enableSentry) {
      try {
        if (context) {
          Sentry.withScope((scope) => {
            Object.keys(context).forEach(key => {
              const value = context[key]
              // setContext expects Context | null, so we need to type guard
              if (value !== null && (typeof value === 'object' || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
                scope.setContext(key, value as Record<string, unknown>)
              } else {
                scope.setTag(key, String(value))
              }
            })
            Sentry.captureException(error)
          })
        } else {
          Sentry.captureException(error)
        }
      } catch (sentryError) {
        console.error('Error in Sentry reporting:', sentryError)
      }
    }

    // Toast 알림
    if (enableToast) {
      try {
        showError(error)
      } catch (toastError) {
        console.error('Error in toast notification:', toastError)
        // Toast 실패 시 최소한 알림 표시
        alert(fallbackMessage)
      }
    }
  }, [enableToast, enableDebugger, enableSentry, fallbackMessage, onError, showError])

  /**
   * 비동기 함수 실행 및 에러 처리
   */
  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    asyncOptions: AsyncOptions = {}
  ): Promise<T | null> => {
    const {
      loadingMessage,
      successMessage,
      enableRetry = false,
      maxRetries = 3,
      retryDelay = 1000,
    } = asyncOptions

    if (enableToast && loadingMessage) {
      try {
        // toastAsyncError는 void를 반환하므로 직접 asyncFn 실행
        const result = await asyncFn()
        if (loadingMessage) {
          // 로딩 메시지를 보여주지만 결과는 asyncFn에서 받음
          showError('완료되었습니다') // 임시로 showError 사용
        }
        return result
      } catch (error) {
        handleError(error, { context: 'async-with-toast' })
        return null
      }
    }

    // 재시도 로직
    if (enableRetry) {
      let lastError: unknown
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await asyncFn()
          
          if (successMessage && enableToast) {
            showError(successMessage) // showSuccess가 없으므로 임시로 showError 사용
          }
          
          return result
        } catch (error) {
          lastError = error
          
          // 마지막 시도가 아니면 재시도
          if (attempt < maxRetries - 1) {
            console.log(`Retry attempt ${attempt + 1}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
            continue
          }
        }
      }
      
      // 모든 재시도 실패
      handleError(lastError, { 
        context: 'async-retry-failed',
        attempts: maxRetries
      })
      return null
    }

    // 단순 실행
    try {
      const result = await asyncFn()
      
      if (successMessage && enableToast) {
        showError(successMessage) // showSuccess가 없으므로 임시로 showError 사용
      }
      
      return result
    } catch (error) {
      handleError(error, { context: 'async-simple' })
      return null
    }
  }, [enableToast, toastAsyncError, handleError, showError])

  /**
   * API 호출 에러 처리
   */
  const handleApiError = useCallback((error: unknown, apiContext?: {
    endpoint?: string
    method?: string
    payload?: unknown
  }) => {
    const context: Record<string, unknown> = {
      type: 'api-error',
      ...apiContext,
    }

    // API 에러 특별 처리
    if (error instanceof APIError) {
      context.statusCode = error.statusCode
      context.apiErrorCode = error.code
    }

    handleError(error, context)
  }, [handleError])

  /**
   * Form 제출 에러 처리
   */
  const handleFormError = useCallback((error: unknown, formData?: Record<string, unknown>) => {
    const context: Record<string, unknown> = {
      type: 'form-error',
      formData: formData ? Object.keys(formData) : undefined, // 실제 값은 제외
    }

    handleError(error, context)
  }, [handleError])

  /**
   * 네트워크 에러 처리
   */
  const handleNetworkError = useCallback((error: unknown, requestInfo?: {
    url?: string
    method?: string
    timeout?: boolean
  }) => {
    const context: Record<string, unknown> = {
      type: 'network-error',
      ...requestInfo,
    }

    handleError(error, context)
  }, [handleError])

  /**
   * 권한 에러 처리
   */
  const handlePermissionError = useCallback((error: unknown, permissionContext?: {
    requiredRole?: string
    requiredPermission?: string
    currentRole?: string
  }) => {
    const context: Record<string, unknown> = {
      type: 'permission-error',
      ...permissionContext,
    }

    handleError(error, context)
  }, [handleError])

  return {
    // 기본 에러 처리
    handleError,
    
    // 비동기 함수 처리
    handleAsync,
    
    // 특화된 에러 처리
    handleApiError,
    handleFormError,
    handleNetworkError,
    handlePermissionError,
    
    // 유틸리티
    reportError: (error: unknown, context?: Record<string, unknown>) => {
      if (enableDebugger) {
        errorDebugger.report(error instanceof Error ? error : new Error(String(error)), context)
      }
      if (enableSentry) {
        Sentry.captureException(error)
      }
    },
    
    // 에러 래핑
    wrapAsync: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
      return (async (...args: Parameters<T>) => {
        try {
          return await fn(...args)
        } catch (error) {
          handleError(error, { 
            function: fn.name,
            arguments: args.length 
          })
          throw error
        }
      }) as T
    },
    
    // 조건부 실행
    safeExecute: async <T>(
      fn: () => T | Promise<T>,
      fallback?: T
    ): Promise<T | undefined> => {
      try {
        return await fn()
      } catch (error) {
        handleError(error, { context: 'safe-execute' })
        return fallback
      }
    },
  }
}