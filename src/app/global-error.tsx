'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 글로벌 에러를 Sentry에 리포트
    console.error('Global Error occurred:', error)
    
    Sentry.withScope((scope) => {
      scope.setLevel('fatal') // 글로벌 에러는 치명적 레벨
      scope.setTag('errorBoundary', 'global')
      scope.setContext('globalError', {
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      })
      
      // 에러 fingerprint 설정 (그룹핑)
      scope.setFingerprint(['global-error', error.name, error.message])
      
      Sentry.captureException(error)
    })
  }, [error])

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/admin'
  }

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>
              
              <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
                치명적 오류
              </h1>
              
              <p className="mt-4 text-lg text-gray-600">
                애플리케이션에서 예상치 못한 심각한 오류가 발생했습니다.
              </p>
              
              <p className="mt-2 text-sm text-gray-500">
                문제가 지속되면 관리자에게 문의해 주세요.
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
                        <pre className="text-xs text-gray-600 overflow-auto max-h-60">
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
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <ArrowPathIcon className="h-5 w-5" />
                애플리케이션 다시 시작
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
                이 오류는 자동으로 개발팀에 보고됩니다.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}