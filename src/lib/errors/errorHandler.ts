import { NextRequest, NextResponse } from 'next/server'
import { APIError, errorToResponse, logError } from './apiErrors'
import * as Sentry from '@sentry/nextjs'

/**
 * API Route 에러 핸들링 래퍼
 * 모든 API route를 이 함수로 감싸서 일관된 에러 처리를 보장합니다.
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const [request] = args as [NextRequest]
    
    try {
      // 핸들러 실행
      const response = await handler(...args)
      return response
    } catch (error) {
      // 에러 컨텍스트 수집
      const context = {
        method: request.method,
        url: request.url,
        pathname: new URL(request.url).pathname,
        headers: Object.fromEntries(request.headers.entries()),
      }
      
      // 민감한 헤더 제거
      delete context.headers['authorization']
      delete context.headers['cookie']
      
      // 에러 로깅
      logError(error, context)
      
      // 응답 생성
      const { error: errorResponse, status } = errorToResponse(error)
      
      return NextResponse.json(
        { 
          success: false,
          error: errorResponse 
        },
        { status }
      )
    }
  }
}

/**
 * 비동기 함수 에러 핸들링 래퍼
 */
export function withAsyncErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorCallback?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (errorCallback) {
        errorCallback(error as Error)
      }
      
      // 에러 로깅
      logError(error)
      
      // 에러 재던지기
      throw error
    }
  }) as T
}

/**
 * 재시도 로직이 포함된 에러 핸들링
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
    retryCondition?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    retryCondition = (error) => {
      // 네트워크 에러나 5xx 에러만 재시도
      if (error instanceof APIError) {
        return error.statusCode >= 500 || error.statusCode === 429
      }
      return false
    }
  } = options
  
  let lastError: unknown
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // 재시도 조건 확인
      if (!retryCondition(error) || attempt === maxRetries - 1) {
        throw error
      }
      
      // 재시도 전 대기
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`)
    }
  }
  
  throw lastError
}

/**
 * 타임아웃이 있는 에러 핸들링
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(timeoutError || new APIError('Request timeout', 408, 'TIMEOUT'))
    }, timeoutMs)
  })
  
  return Promise.race([fn(), timeoutPromise])
}

/**
 * 트랜잭션 에러 핸들링
 * 에러 발생 시 롤백을 보장합니다.
 */
export async function withTransaction<T>(
  fn: (rollback: () => void) => Promise<T>,
  rollbackFn: () => Promise<void> | void
): Promise<T> {
  let shouldRollback = false
  
  const rollback = () => {
    shouldRollback = true
  }
  
  try {
    const result = await fn(rollback)
    
    if (shouldRollback) {
      await rollbackFn()
      throw new APIError('Transaction rolled back', 500, 'TRANSACTION_ROLLBACK')
    }
    
    return result
  } catch (error) {
    // 에러 발생 시 롤백
    try {
      await rollbackFn()
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError)
      // 롤백 실패도 Sentry에 리포트
      if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(rollbackError)
      }
    }
    
    throw error
  }
}

/**
 * 병렬 실행 에러 핸들링
 * 여러 작업을 병렬로 실행하고 에러를 수집합니다.
 */
export async function withParallelErrorHandling<T>(
  tasks: Array<() => Promise<T>>,
  options: {
    failFast?: boolean // 첫 에러 발생 시 즉시 중단
    continueOnError?: boolean // 에러 발생해도 계속 진행
  } = {}
): Promise<{
  results: (T | null)[]
  errors: (Error | null)[]
  hasErrors: boolean
}> {
  const { failFast = false, continueOnError = false } = options
  
  if (failFast) {
    // 첫 에러 발생 시 즉시 중단
    const results = await Promise.all(tasks.map(task => task()))
    return {
      results,
      errors: new Array(results.length).fill(null),
      hasErrors: false,
    }
  }
  
  // 모든 작업 실행 (에러 여부 관계없이)
  const settlements = await Promise.allSettled(tasks.map(task => task()))
  
  const results: (T | null)[] = []
  const errors: (Error | null)[] = []
  
  for (const settlement of settlements) {
    if (settlement.status === 'fulfilled') {
      results.push(settlement.value)
      errors.push(null)
    } else {
      results.push(null)
      errors.push(settlement.reason)
      
      // 에러 로깅
      logError(settlement.reason)
    }
  }
  
  const hasErrors = errors.some(error => error !== null)
  
  if (hasErrors && !continueOnError) {
    // 에러가 있고 continueOnError가 false면 첫 에러를 던짐
    const firstError = errors.find(error => error !== null)
    throw firstError
  }
  
  return {
    results,
    errors,
    hasErrors,
  }
}

/**
 * 에러 복구 핸들링
 * 에러 발생 시 대체 값이나 동작을 제공합니다.
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T | (() => T | Promise<T>),
  shouldUseFallback?: (error: unknown) => boolean
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // 폴백 사용 조건 확인
    if (shouldUseFallback && !shouldUseFallback(error)) {
      throw error
    }
    
    console.warn('Using fallback due to error:', error)
    
    // 폴백 값 반환
    if (typeof fallback === 'function') {
      return await (fallback as () => T | Promise<T>)()
    }
    
    return fallback
  }
}