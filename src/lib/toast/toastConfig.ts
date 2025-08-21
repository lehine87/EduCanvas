import toast, { Toast, ToastOptions, Renderable } from 'react-hot-toast'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { APIError } from '@/lib/errors/apiErrors'
import React from 'react'

/**
 * Toast 기본 설정
 */
export const toastConfig: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  
  // 기본 스타일
  style: {
    borderRadius: '8px',
    background: '#363636',
    color: '#fff',
    padding: '12px 16px',
    fontSize: '14px',
    maxWidth: '500px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  
}

/**
 * 커스텀 토스트 컴포넌트
 */
interface CustomToastProps {
  t: Toast
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
}

export function CustomToast({ t, message, type, action }: CustomToastProps) {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }
  
  const colors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }
  
  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }
  
  const Icon = icons[type]
  
  return React.createElement(
    'div',
    {
      className: `
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-md w-full ${backgrounds[type]} border rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5
      `,
    },
    [
      // 아이콘
      React.createElement(
        'div',
        {
          key: 'icon',
          className: 'flex-shrink-0 pt-0.5',
        },
        React.createElement(Icon, {
          className: `h-5 w-5 ${colors[type]}`,
          'aria-hidden': 'true',
        })
      ),
      
      // 메시지
      React.createElement(
        'div',
        {
          key: 'content',
          className: 'ml-3 w-0 flex-1 pt-0.5',
        },
        [
          React.createElement(
            'p',
            {
              key: 'message',
              className: `text-sm font-medium ${type === 'success' ? 'text-green-900' : type === 'error' ? 'text-red-900' : type === 'warning' ? 'text-yellow-900' : 'text-blue-900'}`,
            },
            message
          ),
          
          // 액션 버튼
          action &&
            React.createElement(
              'div',
              {
                key: 'action',
                className: 'mt-2',
              },
              React.createElement(
                'button',
                {
                  className: `text-sm ${colors[type]} hover:opacity-75 font-medium`,
                  onClick: action.onClick,
                },
                action.label
              )
            ),
        ]
      ),
      
      // 닫기 버튼
      React.createElement(
        'div',
        {
          key: 'close',
          className: 'ml-4 flex-shrink-0 flex',
        },
        React.createElement(
          'button',
          {
            className: `inline-flex ${type === 'success' ? 'text-green-400 hover:text-green-500' : type === 'error' ? 'text-red-400 hover:text-red-500' : type === 'warning' ? 'text-yellow-400 hover:text-yellow-500' : 'text-blue-400 hover:text-blue-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'success' ? 'focus:ring-green-500' : type === 'error' ? 'focus:ring-red-500' : type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}`,
            onClick: () => toast.dismiss(t.id),
          },
          React.createElement(
            'span',
            { className: 'sr-only' },
            '닫기'
          ),
          React.createElement(
            'svg',
            {
              className: 'h-5 w-5',
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 20 20',
              fill: 'currentColor',
              'aria-hidden': 'true',
            },
            React.createElement('path', {
              fillRule: 'evenodd',
              d: 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z',
              clipRule: 'evenodd',
            })
          )
        )
      ),
    ]
  )
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  // APIError 인스턴스
  if (error instanceof APIError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return '입력하신 정보를 확인해 주세요'
      case 'AUTH_ERROR':
        return '로그인이 필요합니다'
      case 'AUTHORIZATION_ERROR':
        return '이 작업을 수행할 권한이 없습니다'
      case 'NOT_FOUND':
        return '요청하신 정보를 찾을 수 없습니다'
      case 'CONFLICT':
        return '이미 존재하는 데이터입니다'
      case 'RATE_LIMIT_EXCEEDED':
        return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해 주세요'
      case 'DATABASE_ERROR':
        return '데이터 처리 중 오류가 발생했습니다'
      case 'INTERNAL_SERVER_ERROR':
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요'
      default:
        return error.message || '알 수 없는 오류가 발생했습니다'
    }
  }
  
  // 일반 Error
  if (error instanceof Error) {
    // 네트워크 에러
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return '네트워크 연결을 확인해 주세요'
    }
    
    // 타임아웃
    if (error.message.includes('timeout')) {
      return '요청 시간이 초과되었습니다'
    }
    
    return error.message
  }
  
  // 문자열 에러
  if (typeof error === 'string') {
    return error
  }
  
  return '알 수 없는 오류가 발생했습니다'
}

/**
 * 토스트 헬퍼 함수들
 */
export const toastHelpers = {
  // 성공 메시지
  success: (message: string, action?: { label: string; onClick: () => void }) => {
    if (action) {
      return toast.custom((t) =>
        React.createElement(CustomToast, {
          t,
          message,
          type: 'success',
          action,
        })
      )
    }
    return toast.success(message, toastConfig)
  },
  
  // 에러 메시지
  error: (error: unknown, action?: { label: string; onClick: () => void }) => {
    const message = getErrorMessage(error)
    
    if (action) {
      return toast.custom((t) =>
        React.createElement(CustomToast, {
          t,
          message,
          type: 'error',
          action,
        })
      )
    }
    return toast.error(message, toastConfig)
  },
  
  // 경고 메시지
  warning: (message: string, action?: { label: string; onClick: () => void }) => {
    return toast.custom((t) =>
      React.createElement(CustomToast, {
        t,
        message,
        type: 'warning',
        action,
      })
    )
  },
  
  // 정보 메시지
  info: (message: string, action?: { label: string; onClick: () => void }) => {
    return toast.custom((t) =>
      React.createElement(CustomToast, {
        t,
        message,
        type: 'info',
        action,
      })
    )
  },
  
  // 로딩 메시지
  loading: (message: string = '처리 중...') => {
    return toast.loading(message, toastConfig)
  },
  
  // 로딩 메시지 업데이트
  updateLoading: (toastId: string, message: string) => {
    toast.loading(message, { id: toastId })
  },
  
  // 로딩을 성공으로 변경
  loadingToSuccess: (toastId: string, message: string) => {
    toast.success(message, { id: toastId })
  },
  
  // 로딩을 에러로 변경
  loadingToError: (toastId: string, error: unknown) => {
    const message = getErrorMessage(error)
    toast.error(message, { id: toastId })
  },
  
  // 특정 토스트 닫기
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId)
  },
  
  // 모든 토스트 닫기
  dismissAll: () => {
    toast.dismiss()
  },
  
  // Promise 처리
  promise: async <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    })
  },
}

/**
 * 에러 핸들링을 위한 React Hook
 */
export function useErrorToast() {
  return {
    showError: toastHelpers.error,
    showSuccess: toastHelpers.success,
    showWarning: toastHelpers.warning,
    showInfo: toastHelpers.info,
    handleError: (error: unknown) => {
      console.error('Toast Error:', error)
      toastHelpers.error(error)
    },
    handleAsyncError: async (asyncFn: () => Promise<void>, loadingMessage?: string) => {
      const toastId = loadingMessage ? toastHelpers.loading(loadingMessage) : undefined
      
      try {
        await asyncFn()
        if (toastId) {
          toastHelpers.loadingToSuccess(toastId, '완료되었습니다')
        }
      } catch (error) {
        if (toastId) {
          toastHelpers.loadingToError(toastId, error)
        } else {
          toastHelpers.error(error)
        }
        throw error // 에러를 다시 던져서 호출자가 처리할 수 있게 함
      }
    },
  }
}