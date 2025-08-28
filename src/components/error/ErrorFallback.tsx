'use client'

import React, { ErrorInfo } from 'react'
import { Button } from '@/components/ui'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { 
  getUserFriendlyErrorMessage, 
  getErrorSeverityClass, 
  getErrorSeverityIcon,
  getRecommendedActions,
  type ErrorContext 
} from '@/lib/errors/userFriendlyMessages'

export interface ErrorFallbackProps {
  error: Error
  errorInfo?: ErrorInfo | null
  resetErrorBoundary: () => void
  errorId?: string | null
  level?: 'page' | 'section' | 'component'
  showDetails?: boolean
  retryCount?: number
  maxRetries?: number
  context?: ErrorContext
}

export function ErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
  errorId,
  level = 'component',
  showDetails = false,
  retryCount = 0,
  maxRetries = 3,
  context,
}: ErrorFallbackProps) {
  const router = useRouter()
  const isPageLevel = level === 'page'
  const canRetry = retryCount < maxRetries

  // 사용자 친화적 에러 메시지 생성
  const friendlyMessage = getUserFriendlyErrorMessage(error, context)
  const severityClass = getErrorSeverityClass(friendlyMessage.severity)
  const severityIcon = getErrorSeverityIcon(friendlyMessage.severity)
  const recommendedActions = getRecommendedActions(error, context)

  const handleGoHome = () => {
    router.push('/admin')
  }

  const handleReload = () => {
    window.location.reload()
  }

  // 페이지 레벨 에러 (전체 화면)
  if (isPageLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100">
              <ExclamationTriangleIcon className="h-10 w-10 text-error-600" />
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
              {severityIcon} {friendlyMessage.title}
            </h2>
            
            <p className="mt-2 text-sm text-neutral-600">
              {friendlyMessage.description}
            </p>
            
            {errorId && (
              <p className="mt-2 text-xs text-neutral-500">
                오류 ID: {errorId}
              </p>
            )}
            
            {!canRetry && (
              <p className="mt-2 text-sm text-warning-600">
                여러 번 시도했지만 문제가 지속됩니다. 관리자에게 문의해주세요.
              </p>
            )}
          </div>

          <div className="mt-8 space-y-3">
            {(canRetry && friendlyMessage.canRetry) && (
              <Button
                onClick={resetErrorBoundary}
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="h-5 w-5" />
                {friendlyMessage.actionText || '다시 시도'} {retryCount > 0 && `(${retryCount}/${maxRetries})`}
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2"
            >
              <HomeIcon className="h-5 w-5" />
              홈으로 가기
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReload}
              className="w-full"
            >
              페이지 새로고침
            </Button>
          </div>

          {/* 추천 액션 */}
          {recommendedActions.length > 0 && (
            <div className="mt-6 p-4 bg-info-50 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-info-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-info-800 mb-2">해결 방법</h4>
                  <ul className="text-sm text-info-700 space-y-1">
                    {recommendedActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {showDetails && errorInfo && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900">
                개발자 정보 보기
              </summary>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-neutral-700 mb-2">에러 메시지:</h4>
                  <pre className="text-xs text-neutral-600 overflow-auto whitespace-pre-wrap">
                    {error.toString()}
                  </pre>
                </div>
                
                {error.stack && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-neutral-700 mb-2">스택 트레이스:</h4>
                    <pre className="text-xs text-neutral-600 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                {errorInfo.componentStack && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-neutral-700 mb-2">컴포넌트 스택:</h4>
                    <pre className="text-xs text-neutral-600 overflow-auto max-h-40">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }

  // 섹션/컴포넌트 레벨 에러 (인라인)
  return (
    <div className={`rounded-lg p-4 border ${severityClass}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-current opacity-60" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {severityIcon} {friendlyMessage.title}
          </h3>
          <p className="mt-1 text-sm opacity-80">
            {friendlyMessage.description}
          </p>
          
          {errorId && (
            <p className="mt-1 text-xs text-error-600">
              오류 ID: {errorId}
            </p>
          )}
          
          <div className="mt-4 flex gap-2">
            {(canRetry && friendlyMessage.canRetry) && (
              <Button
                size="sm"
                onClick={resetErrorBoundary}
                className="flex items-center gap-1"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {friendlyMessage.actionText || '다시 시도'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReload}
            >
              새로고침
            </Button>
          </div>

          {/* 컴포넌트 레벨 추천 액션 */}
          {recommendedActions.length > 0 && recommendedActions.length <= 3 && (
            <div className="mt-3 text-xs space-y-1">
              <div className="font-medium opacity-80">💡 해결 방법:</div>
              {recommendedActions.slice(0, 2).map((action, index) => (
                <div key={index} className="opacity-70">• {action}</div>
              ))}
            </div>
          )}
          
          {showDetails && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium opacity-70 hover:opacity-90">
                자세히 보기
              </summary>
              <pre className="mt-2 text-xs opacity-60 overflow-auto bg-black bg-opacity-10 p-2 rounded">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

// 최소한의 폴백 컴포넌트 (ErrorFallback 자체에서 에러 발생 시)
export function MinimalErrorFallback({ 
  error, 
  resetErrorBoundary 
}: Pick<ErrorFallbackProps, 'error' | 'resetErrorBoundary'>) {
  return (
    <div className="p-4 bg-error-50 border border-error-200 rounded">
      <p className="text-error-800 font-semibold">오류가 발생했습니다</p>
      <p className="text-error-600 text-sm mt-1">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-error-600 text-white rounded text-sm hover:bg-error-700"
      >
        다시 시도
      </button>
    </div>
  )
}