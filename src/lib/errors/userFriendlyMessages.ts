/**
 * 사용자 친화적 에러 메시지 변환 시스템
 * 기술적인 에러를 사용자가 이해하기 쉬운 메시지로 변환
 */

export interface ErrorMessage {
  title: string
  description: string
  actionText?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  canRetry: boolean
  suggestions?: string[]
}

export interface ErrorContext {
  component?: string
  action?: string
  userRole?: string
  feature?: string
}

/**
 * 에러 타입별 메시지 매핑
 */
const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // 네트워크 에러
  'NetworkError': {
    title: '인터넷 연결 문제',
    description: '인터넷 연결이 불안정합니다. 연결 상태를 확인해주세요.',
    actionText: '다시 시도',
    severity: 'warning',
    canRetry: true,
    suggestions: [
      'Wi-Fi 또는 모바일 데이터 연결을 확인해주세요',
      '잠시 후 다시 시도해주세요',
      '문제가 지속되면 관리자에게 문의하세요'
    ]
  },

  'fetch-failed': {
    title: '서버 연결 실패',
    description: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    actionText: '새로고침',
    severity: 'error',
    canRetry: true,
    suggestions: [
      '페이지를 새로고침해주세요',
      '잠시 후 다시 시도해주세요'
    ]
  },

  // 권한 에러
  'PermissionError': {
    title: '접근 권한 없음',
    description: '이 작업을 수행할 권한이 없습니다.',
    actionText: '이전 페이지로',
    severity: 'warning',
    canRetry: false,
    suggestions: [
      '권한이 필요한 작업입니다',
      '관리자에게 권한 요청을 해주세요'
    ]
  },

  'Unauthorized': {
    title: '로그인 필요',
    description: '로그인이 필요한 서비스입니다.',
    actionText: '로그인',
    severity: 'info',
    canRetry: false,
    suggestions: [
      '로그인 후 다시 시도해주세요'
    ]
  },

  'Forbidden': {
    title: '접근 거부',
    description: '이 페이지에 접근할 권한이 없습니다.',
    actionText: '홈으로',
    severity: 'warning',
    canRetry: false,
    suggestions: [
      '관리자에게 권한을 요청해주세요',
      '로그인 상태를 확인해주세요'
    ]
  },

  // 데이터 에러
  'NotFound': {
    title: '페이지를 찾을 수 없음',
    description: '요청하신 페이지를 찾을 수 없습니다.',
    actionText: '홈으로',
    severity: 'info',
    canRetry: false,
    suggestions: [
      'URL을 다시 확인해주세요',
      '페이지가 이동되었거나 삭제되었을 수 있습니다'
    ]
  },

  'ValidationError': {
    title: '입력 정보 오류',
    description: '입력하신 정보에 문제가 있습니다.',
    actionText: '수정',
    severity: 'warning',
    canRetry: true,
    suggestions: [
      '필수 항목을 모두 입력해주세요',
      '올바른 형식으로 입력해주세요'
    ]
  },

  // 시스템 에러
  'InternalServerError': {
    title: '서버 오류',
    description: '서버에서 일시적인 오류가 발생했습니다.',
    actionText: '다시 시도',
    severity: 'error',
    canRetry: true,
    suggestions: [
      '잠시 후 다시 시도해주세요',
      '문제가 지속되면 관리자에게 문의하세요'
    ]
  },

  'TimeoutError': {
    title: '응답 시간 초과',
    description: '요청 처리 시간이 너무 오래 걸리고 있습니다.',
    actionText: '다시 시도',
    severity: 'warning',
    canRetry: true,
    suggestions: [
      '잠시 후 다시 시도해주세요',
      '네트워크 연결 상태를 확인해주세요'
    ]
  },

  // React/UI 에러
  'ChunkLoadError': {
    title: '페이지 로딩 실패',
    description: '페이지의 일부 구성요소를 불러올 수 없습니다.',
    actionText: '새로고침',
    severity: 'warning',
    canRetry: true,
    suggestions: [
      '페이지를 새로고침해주세요',
      '브라우저 캐시를 지워보세요'
    ]
  },

  'RenderError': {
    title: '화면 표시 오류',
    description: '페이지를 올바르게 표시할 수 없습니다.',
    actionText: '새로고침',
    severity: 'error',
    canRetry: true,
    suggestions: [
      '페이지를 새로고침해주세요',
      '다른 브라우저를 사용해보세요'
    ]
  },

  // 기본 에러
  'default': {
    title: '알 수 없는 오류',
    description: '예상치 못한 오류가 발생했습니다.',
    actionText: '다시 시도',
    severity: 'error',
    canRetry: true,
    suggestions: [
      '페이지를 새로고침해주세요',
      '문제가 지속되면 관리자에게 문의하세요'
    ]
  }
}

/**
 * 컨텍스트별 메시지 커스터마이징
 */
const CONTEXT_SPECIFIC_MESSAGES: Record<string, Partial<ErrorMessage>> = {
  // 학생 관리 관련
  'students': {
    title: '학생 정보 처리 오류',
    description: '학생 정보를 처리하는 중 오류가 발생했습니다.',
    suggestions: [
      '학생 정보 입력을 다시 확인해주세요',
      '필수 정보가 누락되지 않았는지 확인해주세요'
    ]
  },

  // 클래스 관리 관련
  'classes': {
    title: '클래스 관리 오류',
    description: '클래스 정보를 처리하는 중 오류가 발생했습니다.',
    suggestions: [
      '클래스 정보를 다시 확인해주세요',
      '학생 배정 상태를 확인해주세요'
    ]
  },

  // 결제 관련
  'payments': {
    title: '결제 처리 오류',
    description: '결제 정보를 처리하는 중 오류가 발생했습니다.',
    actionText: '결제 다시 시도',
    severity: 'error',
    suggestions: [
      '결제 정보를 다시 확인해주세요',
      '결제 수단을 변경해보세요',
      '관리자에게 문의해주세요'
    ]
  },

  // 로그인/인증 관련
  'auth': {
    title: '인증 오류',
    description: '로그인 정보를 확인할 수 없습니다.',
    actionText: '다시 로그인',
    suggestions: [
      '이메일과 비밀번호를 다시 확인해주세요',
      '계정이 활성화되어 있는지 확인해주세요'
    ]
  }
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getUserFriendlyErrorMessage(
  error: Error | string,
  context?: ErrorContext
): ErrorMessage {
  const errorString = error instanceof Error ? error.message : String(error)
  const errorName = error instanceof Error ? error.name : 'UnknownError'

  // 에러 타입 감지
  let detectedType = 'default'

  // 에러 메시지 패턴 매칭
  if (errorString.includes('fetch') || errorString.includes('network')) {
    detectedType = 'NetworkError'
  } else if (errorString.includes('permission') || errorString.includes('unauthorized')) {
    detectedType = 'PermissionError'
  } else if (errorString.includes('not found') || errorString.includes('404')) {
    detectedType = 'NotFound'
  } else if (errorString.includes('timeout')) {
    detectedType = 'TimeoutError'
  } else if (errorString.includes('validation')) {
    detectedType = 'ValidationError'
  } else if (errorString.includes('chunk') || errorString.includes('loading')) {
    detectedType = 'ChunkLoadError'
  } else if (errorName in ERROR_MESSAGES) {
    detectedType = errorName
  }

  // 기본 메시지 가져오기
  let errorMessage = { ...ERROR_MESSAGES[detectedType] }

  // 컨텍스트별 커스터마이징 적용
  if (context?.feature && context.feature in CONTEXT_SPECIFIC_MESSAGES) {
    const contextMessage = CONTEXT_SPECIFIC_MESSAGES[context.feature]
    errorMessage = { ...errorMessage, ...contextMessage }
  }

  // 심각도 조정 (컨텍스트에 따라)
  if (context?.action === 'payment' || context?.feature === 'payments') {
    errorMessage.severity = 'critical'
  }

  return errorMessage
}

/**
 * 에러 심각도에 따른 스타일 클래스 반환
 */
export function getErrorSeverityClass(severity: ErrorMessage['severity']): string {
  const classes = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900'
  }

  return classes[severity]
}

/**
 * 에러 심각도에 따른 아이콘 반환
 */
export function getErrorSeverityIcon(severity: ErrorMessage['severity']): string {
  const icons = {
    info: '💙',
    warning: '⚠️',
    error: '❌',
    critical: '🚨'
  }

  return icons[severity]
}

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(error: Error | string): boolean {
  const errorString = error instanceof Error ? error.message : String(error)
  
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /fetch/i,
    /connection/i,
    /server error/i,
    /internal error/i
  ]

  const nonRetryablePatterns = [
    /permission/i,
    /unauthorized/i,
    /forbidden/i,
    /not found/i,
    /validation/i
  ]

  // 재시도 불가능한 패턴이 있으면 false
  if (nonRetryablePatterns.some(pattern => pattern.test(errorString))) {
    return false
  }

  // 재시도 가능한 패턴이 있으면 true
  return retryablePatterns.some(pattern => pattern.test(errorString))
}

/**
 * 에러 발생 시 추천 액션 반환
 */
export function getRecommendedActions(
  error: Error | string,
  context?: ErrorContext
): string[] {
  const errorMessage = getUserFriendlyErrorMessage(error, context)
  const baseActions = errorMessage.suggestions || []

  // 컨텍스트별 추가 액션
  const contextActions: string[] = []

  if (context?.userRole === 'admin') {
    contextActions.push('시스템 로그를 확인하세요')
  }

  if (context?.component === 'ClassFlow') {
    contextActions.push('학생 배정 상태를 확인하세요')
  }

  return [...baseActions, ...contextActions]
}