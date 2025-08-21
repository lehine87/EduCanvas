'use client'

import { useEffect } from 'react'

/**
 * 클라이언트 사이드에서만 실행되는 초기화 컴포넌트
 * SSR hydration 문제를 방지하기 위해 분리
 */
export function ClientInitializer() {
  useEffect(() => {
    // 개발 환경에서만 Debug Interface 초기화
    if (process.env.NODE_ENV === 'development') {
      import('@/dev-tools/init').catch(() => {
        // 개발 도구 로드 실패는 무시
      })
    }

    // 글로벌 에러 핸들러 초기화
    import('@/lib/errors/globalErrorHandler').then(({ initGlobalErrorHandler }) => {
      initGlobalErrorHandler()
    }).catch(() => {
      console.warn('Failed to initialize global error handler')
    })
  }, [])

  // 이 컴포넌트는 렌더링하지 않음
  return null
}