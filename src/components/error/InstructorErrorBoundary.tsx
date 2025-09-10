/**
 * @file InstructorErrorBoundary.tsx
 * @description 강사 관리 전용 에러 바운더리
 * @module T-V2-012
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { logError, type AppError } from '@/lib/api/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

/**
 * 강사 관리 전용 에러 바운더리
 * React 컴포넌트에서 발생하는 JavaScript 에러를 캐치
 */
export class InstructorErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // 에러가 발생하면 상태를 업데이트하여 fallback UI를 보여줌
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    const errorContext = {
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'InstructorErrorBoundary',
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    logError(error, errorContext)

    // 부모 컴포넌트에 에러 알림
    this.props.onError?.(error, errorInfo)

    // 프로덕션 환경에서 에러 모니터링 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry 등 에러 모니터링 서비스 연동
      console.error('Production error captured:', { error, errorInfo, errorContext })
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount += 1
      
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
      })

      this.props.onRetry?.()
    } else {
      // 최대 재시도 횟수 초과 시 페이지 새로고침
      window.location.reload()
    }
  }

  handleGoBack = () => {
    // 브라우저 히스토리로 뒤로 가기
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // 히스토리가 없으면 강사 목록으로 이동
      window.location.href = '/main/instructors'
    }
  }

  override render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">문제가 발생했습니다</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                강사 관리 페이지에서 예상치 못한 오류가 발생했습니다.
              </p>

              {/* 에러 상세 정보 (개발 환경에서만) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    에러 상세 정보 (개발용)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-xs font-mono break-all">
                      <strong>Error:</strong> {this.state.error.message}
                    </p>
                    {this.state.errorId && (
                      <p className="text-xs font-mono break-all mt-1">
                        <strong>ID:</strong> {this.state.errorId}
                      </p>
                    )}
                  </div>
                </details>
              )}

              {/* 재시도 횟수 표시 */}
              {this.retryCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  재시도 {this.retryCount}/{this.maxRetries}
                </p>
              )}

              {/* 액션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={this.handleGoBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전 페이지로
                </Button>
                
                <Button 
                  onClick={this.handleRetry}
                  disabled={this.retryCount >= this.maxRetries}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {this.retryCount >= this.maxRetries ? '페이지 새로고침' : '다시 시도'}
                </Button>
              </div>

              {/* 도움말 텍스트 */}
              <p className="text-xs text-muted-foreground">
                문제가 지속되면 관리자에게 문의해주세요.
                {this.state.errorId && ` (오류 ID: ${this.state.errorId})`}
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 함수형 컴포넌트 래퍼
 */
export function withInstructorErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
    onRetry?: () => void
  }
) {
  return function WrappedComponent(props: T) {
    return (
      <InstructorErrorBoundary
        fallback={options?.fallback}
        onError={options?.onError}
        onRetry={options?.onRetry}
      >
        <Component {...props} />
      </InstructorErrorBoundary>
    )
  }
}

/**
 * Hook 형태의 에러 바운더리 (React Query와 함께 사용)
 */
export function useInstructorErrorHandler() {
  const handleError = React.useCallback((error: unknown, context?: string) => {
    logError(error, { context, component: 'InstructorErrorHandler' })
  }, [])

  const handleQueryError = React.useCallback((error: unknown) => {
    // React Query 에러 처리
    logError(error, { context: 'ReactQuery', component: 'InstructorErrorHandler' })
  }, [])

  return {
    handleError,
    handleQueryError,
  }
}