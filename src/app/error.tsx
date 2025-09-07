'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 페이지 레벨 에러를 Sentry에 리포트
    console.error('Page Error occurred:', error)
    
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setTag('errorBoundary', 'page')
      scope.setContext('pageError', {
        digest: error.digest,
        timestamp: new Date().toISOString(),
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      })
      
      // 에러 fingerprint 설정
      scope.setFingerprint(['page-error', error.name, error.message])
      
      Sentry.captureException(error)
    })
  }, [error])

  const handleGoHome = () => {
    window.location.href = '/main'
  }

  const handleReload = () => {
    window.location.reload()
  }

  // 에러 메시지를 사용자 친화적으로 변환
  const getUserFriendlyMessage = (error: Error): string => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return '네트워크 연결에 문제가 발생했습니다'
    }
    
    if (message.includes('timeout')) {
      return '요청 시간이 초과되었습니다'
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return '이 페이지에 접근할 권한이 없습니다'
    }
    
    if (message.includes('not found')) {
      return '요청한 정보를 찾을 수 없습니다'
    }
    
    return '페이지를 불러오는 중 오류가 발생했습니다'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            오류가 발생했습니다
          </h1>
          
          <p className="mt-4 text-lg text-gray-600">
            {getUserFriendlyMessage(error)}
          </p>
          
          <p className="mt-2 text-sm text-gray-500">
            다시 시도하거나 홈페이지로 돌아가 주세요.
          </p>
          
          {error.digest && (
            <p className="mt-2 text-xs text-gray-400">
              오류 ID: {error.digest}
            </p>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                개발자 정보 보기
              </summary>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">에러 메시지:</h4>
                  <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                    {error.toString()}
                  </pre>
                </div>
                
                {error.stack && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">스택 트레이스:</h4>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            다시 시도
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReload}
            className="w-full"
          >
            페이지 새로고침
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2"
          >
            <HomeIcon className="h-5 w-5" />
            홈으로 가기
          </Button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            문제가 지속되면 관리자에게 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}