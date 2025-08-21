/**
 * 민감한 정보 필터링 및 보안 유틸리티
 */

// 민감한 정보 패턴
const SENSITIVE_PATTERNS = {
  // 비밀번호 관련
  password: /password\s*[=:]\s*['"`]?[^'"`\s]+['"`]?/gi,
  
  // 토큰 관련
  token: /(?:access_token|refresh_token|jwt|bearer)\s*[=:]\s*['"`]?[^'"`\s]+['"`]?/gi,
  
  // API 키
  apiKey: /(?:api_key|apikey|key)\s*[=:]\s*['"`]?[^'"`\s]+['"`]?/gi,
  
  // 시크릿
  secret: /(?:secret|private_key)\s*[=:]\s*['"`]?[^'"`\s]+['"`]?/gi,
  
  // 이메일 (부분 마스킹)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // 전화번호 (한국)
  phone: /(?:\+82|0)?1[0-9]{1}[0-9]{3,4}[0-9]{4}/g,
  
  // 신용카드 번호
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // 주민등록번호
  ssn: /\b\d{6}-[1-4]\d{6}\b/g,
  
  // IPv4 주소 (일부 마스킹)
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
}

// 민감한 필드명
const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'private_key',
  'access_token',
  'refresh_token',
  'session_id',
  'csrf_token',
  'authorization',
  'x-api-key',
  'x-auth-token',
  'cookie',
  'set-cookie',
]

// 완전히 제거할 민감한 환경변수
const SENSITIVE_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'DATABASE_URL',
  'SENTRY_AUTH_TOKEN',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'AWS_SECRET_ACCESS_KEY',
]

/**
 * 문자열에서 민감한 정보 마스킹
 */
export function maskSensitiveString(input: string): string {
  let masked = input

  // 패턴 기반 마스킹
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    if (type === 'email') {
      // 이메일은 부분 마스킹
      masked = masked.replace(pattern, (match) => {
        const [local, domain] = match.split('@')
        if (!local || !domain) return match
        const maskedLocal = local.length > 2 
          ? local.substring(0, 2) + '*'.repeat(Math.max(1, local.length - 2))
          : local
        return `${maskedLocal}@${domain}`
      })
    } else if (type === 'phone') {
      // 전화번호는 중간 부분 마스킹
      masked = masked.replace(pattern, (match) => {
        if (match.length > 6) {
          return match.substring(0, 3) + '*'.repeat(match.length - 6) + match.substring(match.length - 3)
        }
        return '***-****'
      })
    } else if (type === 'ipv4') {
      // IP 주소는 마지막 옥텟만 마스킹
      masked = masked.replace(pattern, (match) => {
        const parts = match.split('.')
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
      })
    } else {
      // 기타 민감한 정보는 완전 마스킹
      masked = masked.replace(pattern, '[REDACTED]')
    }
  })

  return masked
}

/**
 * 객체에서 민감한 정보 필터링
 */
export function filterSensitiveObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const filtered = { ...obj } as Record<string, unknown>

  Object.keys(filtered).forEach(key => {
    const lowerKey = key.toLowerCase()
    
    // 민감한 필드명인지 확인
    const isSensitiveField = SENSITIVE_FIELD_NAMES.some(sensitiveField => 
      lowerKey.includes(sensitiveField)
    )
    
    if (isSensitiveField) {
      filtered[key] = '[REDACTED]'
    } else if (typeof filtered[key] === 'string') {
      // 문자열 값에서 민감한 정보 마스킹
      filtered[key] = maskSensitiveString(filtered[key] as string)
    } else if (Array.isArray(filtered[key])) {
      // 배열 처리
      filtered[key] = (filtered[key] as unknown[]).map((item: unknown) => 
        typeof item === 'object' && item !== null ? filterSensitiveObject(item as Record<string, unknown>) : 
        typeof item === 'string' ? maskSensitiveString(item) : item
      )
    } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      // 중첩 객체 재귀 처리
      filtered[key] = filterSensitiveObject(filtered[key] as Record<string, unknown>)
    }
  })

  return filtered as T
}

/**
 * 환경변수에서 민감한 정보 필터링
 */
export function filterEnvironmentVariables(env: Record<string, string | undefined>): Record<string, string | undefined> {
  const filtered = { ...env }

  Object.keys(filtered).forEach(key => {
    const isSensitive = SENSITIVE_ENV_VARS.includes(key) ||
      SENSITIVE_FIELD_NAMES.some(pattern => key.toLowerCase().includes(pattern))
    
    if (isSensitive) {
      filtered[key] = '[REDACTED]'
    }
  })

  return filtered
}

/**
 * HTTP 헤더에서 민감한 정보 필터링
 */
export function filterHttpHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
  const filtered = { ...headers }

  Object.keys(filtered).forEach(key => {
    const lowerKey = key.toLowerCase()
    
    if (lowerKey === 'authorization' || 
        lowerKey === 'cookie' || 
        lowerKey === 'set-cookie' ||
        lowerKey.startsWith('x-api-') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key')) {
      filtered[key] = '[REDACTED]'
    }
  })

  return filtered
}

/**
 * URL에서 민감한 쿼리 파라미터 제거
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // 민감한 파라미터 제거
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key', 'access_token']
    
    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]')
      }
    })
    
    return urlObj.toString()
  } catch {
    // URL 파싱 실패 시 원본 반환
    return maskSensitiveString(url)
  }
}

/**
 * 스택 트레이스에서 민감한 정보 제거
 */
export function sanitizeStackTrace(stackTrace: string): string {
  let sanitized = stackTrace

  // 파일 경로에서 사용자 정보 제거
  sanitized = sanitized.replace(/\/Users\/[^\/]+\//g, '/Users/[USER]/')
  sanitized = sanitized.replace(/C:\\Users\\[^\\]+\\/g, 'C:\\Users\\[USER]\\')
  
  // 민감한 정보 마스킹
  sanitized = maskSensitiveString(sanitized)
  
  return sanitized
}

/**
 * 에러 객체 전체 정리
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (!error) return {}

  const sanitized: Record<string, unknown> = {
    name: (error as Error)?.name || 'UnknownError',
    message: (error as Error)?.message ? maskSensitiveString((error as Error).message) : 'Unknown error',
    stack: (error as Error)?.stack ? sanitizeStackTrace((error as Error).stack!) : undefined,
  }

  // 추가 속성이 있다면 필터링
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>
    Object.keys(errorObj).forEach(key => {
      if (!['name', 'message', 'stack'].includes(key)) {
        const value = errorObj[key]
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = filterSensitiveObject(value as Record<string, unknown>)
        } else if (typeof value === 'string') {
          sanitized[key] = maskSensitiveString(value)
        } else {
          sanitized[key] = value
        }
      }
    })
  }

  return sanitized
}

/**
 * 요청 데이터 정리
 */
export function sanitizeRequestData(data: {
  url?: string
  method?: string
  headers?: Record<string, string | string[]>
  body?: Record<string, unknown>
  query?: Record<string, unknown>
}): Record<string, unknown> {
  return {
    url: data.url ? sanitizeUrl(data.url) : undefined,
    method: data.method,
    headers: data.headers ? filterHttpHeaders(data.headers) : {},
    body: data.body ? filterSensitiveObject(data.body) : {},
    query: data.query ? filterSensitiveObject(data.query) : {},
  }
}

/**
 * 로그 데이터 정리 (개발 환경용)
 */
export function sanitizeLogData(data: unknown): unknown {
  if (process.env.NODE_ENV === 'production') {
      // 프로덕션에서는 추가 보안 적용
    if (typeof data === 'object' && data !== null) {
      return filterSensitiveObject(data as Record<string, unknown>)
    }
    return data
  }

  // 개발 환경에서는 덜 엄격하게 적용
  if (typeof data === 'string') {
    return maskSensitiveString(data)
  }

  if (typeof data === 'object' && data !== null) {
    return filterSensitiveObject(data as Record<string, unknown>)
  }

  return data
}

/**
 * 보안 검증 함수
 */
export function validateSecuritySettings(): {
  isSecure: boolean
  warnings: string[]
  recommendations: string[]
} {
  const warnings: string[] = []
  const recommendations: string[] = []

  // NODE_ENV 확인
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    warnings.push('개발 모드에서 실행 중입니다')
    recommendations.push('프로덕션 배포 시 NODE_ENV=production으로 설정하세요')
  }

  // 민감한 환경변수가 노출되어 있는지 확인
  if (typeof window !== 'undefined') {
    const exposedVars = Object.keys(process.env).filter(key => 
      SENSITIVE_ENV_VARS.includes(key) && key.startsWith('NEXT_PUBLIC_')
    )
    
    if (exposedVars.length > 0) {
      warnings.push(`클라이언트에 노출된 민감한 환경변수: ${exposedVars.join(', ')}`)
      recommendations.push('민감한 환경변수는 NEXT_PUBLIC_ 접두어를 사용하지 마세요')
    }
  }

  // HTTPS 확인 (프로덕션)
  if (typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'production' && 
      !window.location.protocol.startsWith('https')) {
    warnings.push('HTTPS를 사용하지 않고 있습니다')
    recommendations.push('프로덕션에서는 반드시 HTTPS를 사용하세요')
  }

  return {
    isSecure: warnings.length === 0,
    warnings,
    recommendations,
  }
}