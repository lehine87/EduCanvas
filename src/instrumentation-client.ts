// Sentry 클라이언트 설정 (Next.js 15 권장 방식)
// 브라우저에서 실행되는 코드의 에러를 추적합니다
// Moved from sentry.client.config.ts as per Next.js 15 + Turbopack requirements
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // 환경 설정
  environment: process.env.NODE_ENV,
  enabled: !!SENTRY_DSN && process.env.NODE_ENV === 'production', // 프로덕션 환경에서만 활성화
  
  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 프로덕션에서는 10%만 샘플링
  
  // 세션 리플레이 (사용자 행동 재현)
  replaysSessionSampleRate: 0.1, // 10% 세션 리플레이
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 리플레이
  
  // 디버그 설정
  debug: process.env.NODE_ENV === 'development',
  
  // 민감 정보 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event)
      console.error('Error:', hint.originalException || hint.syntheticException)
    }
    
    // 개인정보 제거
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
      delete event.user.username
    }
    
    // 민감한 에러 메시지 필터링
    const sensitivePatterns = ['password', 'token', 'secret', 'api_key', 'apiKey']
    const message = event.message?.toLowerCase() || ''
    
    for (const pattern of sensitivePatterns) {
      if (message.includes(pattern)) {
        event.fingerprint = ['sensitive-data-filtered']
        event.message = 'Sensitive data was filtered from this error message'
        break
      }
    }
    
    // 쿠키 정보 제거
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    
    // 특정 에러 무시
    const error = hint.originalException
    
    // 청크 로드 에러 무시 (네트워크 문제로 자주 발생)
    if (error instanceof Error && error.message?.includes('ChunkLoadError')) {
      return null
    }
    
    // 취소된 요청 무시
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }
    
    // ResizeObserver 에러 무시 (브라우저 버그)
    if (error instanceof Error && error.message?.includes('ResizeObserver')) {
      return null
    }
    
    return event
  },
  
  // 통합 설정
  integrations: [
    // 세션 리플레이
    Sentry.replayIntegration({
      maskAllText: true, // 모든 텍스트 마스킹
      blockAllMedia: true, // 미디어 차단
      maskAllInputs: true, // 입력 필드 마스킹
      
      // 민감한 클래스명 마스킹
      mask: ['.password', '.secret', '.token', '.sensitive'],
      
      // 네트워크 요청 기록 (민감한 헤더 제외)
      networkDetailAllowUrls: typeof window !== 'undefined' ? [window.location.origin] : [],
      networkRequestHeaders: ['content-type'],
      networkResponseHeaders: ['content-type'],
    }),
    
    // 브라우저 추적
    Sentry.browserTracingIntegration({
      // 네트워크 요청 추적
      traceFetch: true,
      traceXHR: true,
    }),
  ],
  
  // 에러 그룹핑 개선
  beforeBreadcrumb(breadcrumb) {
    // 콘솔 로그 제외
    if (breadcrumb.category === 'console') {
      return null
    }
    
    // 민감한 URL 파라미터 제거
    if (breadcrumb.category === 'navigation') {
      const url = breadcrumb.data?.to
      if (url && typeof window !== 'undefined') {
        try {
          const urlObj = new URL(url, window.location.origin)
          // 민감한 파라미터 제거
          const sensitiveParams = ['token', 'key', 'secret', 'password']
          sensitiveParams.forEach(param => urlObj.searchParams.delete(param))
          breadcrumb.data!.to = urlObj.toString()
        } catch {
          // URL 파싱 실패 시 무시
        }
      }
    }
    
    return breadcrumb
  },
  
  // 에러 태그
  initialScope: {
    tags: {
      component: 'frontend',
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    },
  },
})

// 사용자 컨텍스트 설정 헬퍼 함수
export function setSentryUser(user: { id: string; role?: string; tenant_id?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      // role과 tenant_id는 컨텍스트로 설정 (PII가 아님)
      ...(user.role && { segment: user.role }),
    })
    
    // 추가 컨텍스트 설정
    if (user.tenant_id) {
      Sentry.setContext('tenant', {
        id: user.tenant_id,
      })
    }
    
    if (user.role) {
      Sentry.setTag('user.role', user.role)
    }
  } else {
    Sentry.setUser(null)
    Sentry.setContext('tenant', null)
  }
}

// 추가 컨텍스트 설정 헬퍼
export function setSentryContext(key: string, context: Record<string, unknown>) {
  Sentry.setContext(key, context)
}

// 에러 리포팅 헬퍼
export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error('Error captured:', error)
  
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key] as Record<string, unknown>)
      })
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

// 메시지 로깅 헬퍼
export function logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}]`, message)
  }
  
  if (level === 'error') {
    Sentry.captureMessage(message, 'error')
  } else if (level === 'warning') {
    Sentry.captureMessage(message, 'warning')
  }
}

// Next.js 라우터 전환 추적
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart