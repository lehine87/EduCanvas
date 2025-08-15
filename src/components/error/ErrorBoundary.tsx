'use client'

import React, { Component, PropsWithChildren, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { ErrorFallback, ErrorFallbackProps } from './ErrorFallback'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
  enableAnalytics?: boolean
  showDetails?: boolean
}

export class ErrorBoundary extends Component<
  PropsWithChildren<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  private resetTimeoutId: NodeJS.Timeout | null = null
  private retryCount = 0
  private readonly maxRetries = 3

  constructor(props: PropsWithChildren<ErrorBoundaryProps>) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 에러 ID 생성 (Sentry와 동기화)
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableAnalytics = true, level = 'component' } = this.props

    // 상태 업데이트
    this.setState({
      error,
      errorInfo,
    })

    // 커스텀 에러 핸들러 실행
    if (onError) {
      onError(error, errorInfo)
    }

    // Sentry에 에러 리포트
    if (enableAnalytics && process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        // 에러 레벨 설정
        scope.setLevel(level === 'page' ? 'error' : 'warning')
        
        // 에러 ID 태그
        scope.setTag('errorBoundary', true)
        scope.setTag('errorBoundary.level', level)
        scope.setTag('errorId', this.state.errorId)
        
        // 컴포넌트 스택 추가
        scope.setContext('errorBoundary', {
          componentStack: errorInfo.componentStack,
          props: this.props,
          retryCount: this.retryCount,
        })
        
        // 에러 fingerprint 설정 (그룹핑 개선)
        scope.setFingerprint([
          '{{ default }}',
          String(error.name),
          String(level),
        ])
        
        Sentry.captureException(error)
      })
    }

    // 개발 환경에서 상세 로그
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Error Boundary Caught [${level}]`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error ID:', this.state.errorId)
      console.groupEnd()
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    // resetKeys가 변경되면 에러 상태 리셋
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys![idx]
      )
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
    
    // props 변경 시 자동 리셋
    if (hasError && resetOnPropsChange) {
      // children 변경 감지를 위해 resetKeys 사용
      const prevChildren = React.Children.toArray((prevProps as PropsWithChildren<ErrorBoundaryProps>).children)
      const currentChildren = React.Children.toArray(this.props.children)
      
      if (prevChildren.length !== currentChildren.length) {
        this.resetErrorBoundary()
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    this.retryCount += 1
    
    // 최대 재시도 횟수 초과 시
    if (this.retryCount > this.maxRetries) {
      console.error('Max retry attempts reached. Not resetting error boundary.')
      return
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
    
    // 일정 시간 후 재시도 카운트 리셋
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
    
    this.resetTimeoutId = setTimeout(() => {
      this.retryCount = 0
    }, 10000) // 10초 후 리셋
  }

  override render() {
    const { hasError, error, errorInfo, errorId } = this.state
    const { 
      fallback: FallbackComponent = ErrorFallback, 
      isolate = true,
      level = 'component',
      showDetails = process.env.NODE_ENV === 'development',
    } = this.props

    if (hasError && error) {
      const errorProps: ErrorFallbackProps = {
        error,
        errorInfo,
        resetErrorBoundary: this.resetErrorBoundary,
        errorId,
        level,
        showDetails,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      }

      // 격리 모드: 에러를 해당 컴포넌트 영역에만 국한
      if (isolate) {
        return (
          <div className="error-boundary-wrapper" data-error-level={level}>
            <FallbackComponent {...errorProps} />
          </div>
        )
      }

      // 비격리 모드: 전체 화면 에러
      return <FallbackComponent {...errorProps} />
    }

    return this.props.children
  }
}

// HOC for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: ErrorBoundaryProps
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for error handling
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Error handled by useErrorHandler:', error)
    
    // Sentry에 수동으로 에러 리포트
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error)
    }
    
    // 에러를 상위 Error Boundary로 전파
    throw error
  }
}