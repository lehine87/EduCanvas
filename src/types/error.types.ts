// EduCanvas 에러 처리 타입 시스템 (완전 체계화)
// 에러 정의, 분류, 핸들링, 복구 전략 관련 타입들
// @version v4.1
// @since 2025-08-12

// ================================================================
// 1. 기본 에러 분류 시스템
// ================================================================

/**
 * 에러 심각도 레벨
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * 에러 카테고리
 */
export type ErrorCategory = 
  | 'validation'      // 입력 검증 에러
  | 'authentication' // 인증 에러
  | 'authorization'  // 인가 에러
  | 'network'        // 네트워크 에러
  | 'database'       // 데이터베이스 에러
  | 'business'       // 비즈니스 로직 에러
  | 'system'         // 시스템 에러
  | 'external'       // 외부 서비스 에러
  | 'ui'            // UI/UX 에러
  | 'security'       // 보안 에러
  | 'performance'    // 성능 에러

/**
 * 에러 발생 위치
 */
export type ErrorContext = 
  | 'frontend'
  | 'backend'
  | 'database'
  | 'external_api'
  | 'middleware'
  | 'auth_layer'
  | 'business_logic'

// ================================================================
// 2. 기본 에러 타입 정의
// ================================================================

/**
 * 기본 에러 정보
 */
export interface BaseError {
  // 식별 정보
  id: string
  code: string
  message: string
  
  // 분류 정보
  severity: ErrorSeverity
  category: ErrorCategory
  context: ErrorContext
  
  // 메타데이터
  timestamp: string
  stack?: string
  cause?: Error | BaseError
  
  // 추적 정보
  correlationId?: string
  requestId?: string
  userId?: string
  tenantId?: string
  sessionId?: string
}

/**
 * 상세 에러 정보
 */
export interface DetailedError extends BaseError {
  // 상세 정보
  details: Record<string, unknown>
  metadata: {
    component?: string
    function?: string
    file?: string
    line?: number
    userAgent?: string
    url?: string
    method?: string
    params?: Record<string, unknown>
  }
  
  // 영향도 분석
  impact: {
    userFacing: boolean
    dataLoss: boolean
    securityBreach: boolean
    serviceDisruption: boolean
    affectedUsers?: number
    affectedTenants?: number
  }
  
  // 복구 정보
  recovery: {
    recoverable: boolean
    autoRecovery: boolean
    retryable: boolean
    maxRetries?: number
    retryInterval?: number
    fallbackAction?: string
    manualSteps?: string[]
  }
  
  // 알림 설정
  notification: {
    shouldNotify: boolean
    channels: ('email' | 'slack' | 'sms' | 'webhook')[]
    urgency: 'immediate' | 'within_hour' | 'daily' | 'weekly'
    recipients?: string[]
  }
}

// ================================================================
// 3. 특화된 에러 타입들
// ================================================================

/**
 * 유효성 검사 에러
 */
export interface ValidationError extends BaseError {
  category: 'validation'
  field: string
  value: unknown
  constraint: string
  expectedType?: string
  allowedValues?: unknown[]
  validationRules?: Array<{
    rule: string
    message: string
    passed: boolean
  }>
}

/**
 * 인증 에러
 */
export interface AuthenticationError extends BaseError {
  category: 'authentication'
  reason: 
    | 'invalid_credentials'
    | 'token_expired'
    | 'token_invalid'
    | 'token_missing'
    | 'account_locked'
    | 'account_disabled'
    | 'mfa_required'
    | 'session_expired'
  
  authDetails: {
    email?: string
    provider?: string
    lastLoginAttempt?: string
    failedAttempts?: number
    lockoutUntil?: string
  }
}

/**
 * 인가 에러
 */
export interface AuthorizationError extends BaseError {
  category: 'authorization'
  reason: 
    | 'insufficient_permissions'
    | 'role_required'
    | 'tenant_access_denied'
    | 'resource_forbidden'
    | 'subscription_required'
    | 'feature_disabled'
  
  authzDetails: {
    requiredRole?: string
    requiredPermissions?: string[]
    currentRole?: string
    currentPermissions?: string[]
    resourceType?: string
    resourceId?: string
  }
}

/**
 * 네트워크 에러
 */
export interface NetworkError extends BaseError {
  category: 'network'
  networkDetails: {
    url?: string
    method?: string
    status?: number
    statusText?: string
    timeout?: boolean
    connectionLost?: boolean
    retryCount?: number
    lastRetryAt?: string
  }
}

/**
 * 데이터베이스 에러
 */
export interface DatabaseError extends BaseError {
  category: 'database'
  dbDetails: {
    query?: string
    table?: string
    operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
    constraint?: string
    foreignKey?: string
    duplicateKey?: string
    connectionPool?: {
      active: number
      idle: number
      waiting: number
    }
  }
}

/**
 * 비즈니스 로직 에러
 */
export interface BusinessError extends BaseError {
  category: 'business'
  businessRule: string
  entityType: string
  entityId?: string
  businessDetails: {
    rule: string
    violated: boolean
    conditions: Array<{
      condition: string
      met: boolean
      actualValue?: unknown
      expectedValue?: unknown
    }>
    suggestions?: string[]
  }
}

/**
 * 시스템 에러
 */
export interface SystemError extends BaseError {
  category: 'system'
  systemDetails: {
    service?: string
    version?: string
    environment?: string
    memoryUsage?: number
    cpuUsage?: number
    diskUsage?: number
    healthCheck?: Record<string, boolean>
  }
}

/**
 * 외부 서비스 에러
 */
export interface ExternalServiceError extends BaseError {
  category: 'external'
  service: string
  externalDetails: {
    provider: string
    endpoint?: string
    apiVersion?: string
    rateLimit?: {
      remaining: number
      resetAt: string
    }
    maintenance?: boolean
    deprecated?: boolean
  }
}

/**
 * UI/UX 에러
 */
export interface UIError extends BaseError {
  category: 'ui'
  uiDetails: {
    component?: string
    action?: string
    expectedBehavior?: string
    actualBehavior?: string
    userAgent?: string
    screenResolution?: string
    viewport?: {
      width: number
      height: number
    }
    accessibility?: {
      screenReader: boolean
      highContrast: boolean
      motionReduced: boolean
    }
  }
}

/**
 * 보안 에러
 */
export interface SecurityError extends BaseError {
  category: 'security'
  securityDetails: {
    attackType?: 
      | 'brute_force'
      | 'sql_injection'
      | 'xss'
      | 'csrf'
      | 'unauthorized_access'
      | 'data_breach'
      | 'suspicious_activity'
    
    ipAddress?: string
    userAgent?: string
    location?: {
      country: string
      city: string
    }
    
    blocked: boolean
    reportedToAuthorities: boolean
    mitigation: string[]
  }
}

/**
 * 성능 에러
 */
export interface PerformanceError extends BaseError {
  category: 'performance'
  performanceDetails: {
    metric: 'response_time' | 'memory_usage' | 'cpu_usage' | 'database_query' | 'render_time'
    threshold: number
    actual: number
    unit: string
    duration?: number
    affectedOperations?: string[]
    optimization?: string[]
  }
}

// ================================================================
// 4. 에러 집계 및 통계 타입들
// ================================================================

/**
 * 에러 통계
 */
export interface ErrorStats {
  timeRange: {
    start: string
    end: string
  }
  
  // 전체 통계
  total: number
  unique: number
  resolved: number
  unresolved: number
  
  // 심각도별
  bySeverity: Record<ErrorSeverity, number>
  
  // 카테고리별
  byCategory: Record<ErrorCategory, number>
  
  // 컨텍스트별
  byContext: Record<ErrorContext, number>
  
  // 시간대별
  hourlyDistribution: Array<{
    hour: number
    count: number
    severity: Record<ErrorSeverity, number>
  }>
  
  // 사용자별
  byUser: Array<{
    userId: string
    count: number
    mostCommon: string
  }>
  
  // 테넌트별
  byTenant: Array<{
    tenantId: string
    count: number
    criticalCount: number
  }>
  
  // 상위 에러들
  topErrors: Array<{
    code: string
    message: string
    count: number
    firstOccurrence: string
    lastOccurrence: string
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
}

/**
 * 에러 트렌드 분석
 */
export interface ErrorTrendAnalysis {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  trends: Array<{
    date: string
    total: number
    critical: number
    resolved: number
    newErrors: number
    recurringErrors: number
  }>
  
  // 패턴 분석
  patterns: {
    peakHours: number[]
    commonCauses: Array<{
      cause: string
      frequency: number
      impact: ErrorSeverity
    }>
    seasonality: {
      detected: boolean
      cycle: 'daily' | 'weekly' | 'monthly'
      confidence: number
    }
  }
  
  // 예측
  predictions: {
    nextWeekTotal: number
    riskFactors: Array<{
      factor: string
      probability: number
      impact: ErrorSeverity
    }>
    recommendations: string[]
  }
}

// ================================================================
// 5. 에러 처리 및 복구 타입들
// ================================================================

/**
 * 에러 핸들러 설정
 */
export interface ErrorHandler {
  id: string
  name: string
  description: string
  
  // 적용 조건
  conditions: {
    categories?: ErrorCategory[]
    severities?: ErrorSeverity[]
    codes?: string[]
    contexts?: ErrorContext[]
    customRules?: Array<{
      field: string
      operator: 'equals' | 'contains' | 'matches'
      value: unknown
    }>
  }
  
  // 처리 액션
  actions: Array<{
    type: 'log' | 'notify' | 'retry' | 'fallback' | 'redirect' | 'custom'
    config: Record<string, unknown>
    order: number
    enabled: boolean
  }>
  
  // 메타데이터
  priority: number
  enabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * 에러 복구 전략
 */
export interface ErrorRecoveryStrategy {
  id: string
  name: string
  errorPattern: {
    categories: ErrorCategory[]
    codes?: string[]
    conditions?: Record<string, unknown>
  }
  
  // 복구 단계
  steps: Array<{
    id: string
    name: string
    type: 'automatic' | 'manual' | 'user_prompted'
    action: string
    timeout?: number
    retries?: number
    rollback?: boolean
    dependencies?: string[]
  }>
  
  // 성공/실패 조건
  successCriteria: Array<{
    check: string
    expected: unknown
    timeout: number
  }>
  
  failureCriteria: Array<{
    check: string
    condition: unknown
    action: 'abort' | 'escalate' | 'retry'
  }>
  
  // 메트릭스
  metrics: {
    successRate: number
    averageRecoveryTime: number
    lastUsed?: string
    timesUsed: number
  }
}

/**
 * 에러 리포트
 */
export interface ErrorReport {
  id: string
  title: string
  summary: string
  
  // 시간 정보
  reportPeriod: {
    start: string
    end: string
  }
  generatedAt: string
  
  // 통계 요약
  overview: {
    totalErrors: number
    criticalErrors: number
    newErrors: number
    resolvedErrors: number
    outstandingErrors: number
  }
  
  // 상세 분석
  analysis: {
    trends: ErrorTrendAnalysis
    rootCauses: Array<{
      cause: string
      errorCount: number
      impact: ErrorSeverity
      affectedUsers: number
      resolution?: string
    }>
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low'
      category: string
      description: string
      estimatedEffort: 'low' | 'medium' | 'high'
      expectedImpact: string
    }>
  }
  
  // 액션 아이템
  actionItems: Array<{
    id: string
    title: string
    description: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    assignee?: string
    dueDate?: string
    status: 'open' | 'in_progress' | 'completed' | 'cancelled'
    estimatedHours?: number
  }>
  
  // 메타데이터
  createdBy: string
  recipients: string[]
  format: 'pdf' | 'html' | 'json'
  confidential: boolean
}

// ================================================================
// 6. 에러 모니터링 타입들
// ================================================================

/**
 * 에러 모니터링 설정
 */
export interface ErrorMonitoringConfig {
  // 수집 설정
  collection: {
    enabled: boolean
    sampleRate: number // 0-1
    bufferSize: number
    flushInterval: number // seconds
    includeStackTrace: boolean
    includeRequestData: boolean
    includeUserData: boolean
    anonymizeData: boolean
  }
  
  // 필터링
  filters: {
    excludePatterns: string[]
    includePatterns: string[]
    minSeverity: ErrorSeverity
    excludeCategories?: ErrorCategory[]
    maxDuplicates: number
  }
  
  // 저장 설정
  storage: {
    retention: number // days
    compression: boolean
    encryption: boolean
    backupEnabled: boolean
  }
  
  // 알림 설정
  alerting: {
    enabled: boolean
    thresholds: {
      errorRate: number // errors per minute
      criticalErrors: number
      newErrorTypes: number
    }
    cooldown: number // minutes
    escalation: {
      levels: Array<{
        threshold: number
        recipients: string[]
        channels: string[]
      }>
    }
  }
}

/**
 * 실시간 에러 모니터링
 */
export interface ErrorMonitoringDashboard {
  timestamp: string
  
  // 실시간 메트릭스
  realtime: {
    currentErrorRate: number // per minute
    activeIncidents: number
    systemHealth: 'healthy' | 'degraded' | 'critical'
    lastUpdate: string
  }
  
  // 현재 상태
  current: {
    errors: DetailedError[]
    alerts: Array<{
      id: string
      type: string
      message: string
      severity: ErrorSeverity
      triggered: string
      acknowledged: boolean
    }>
  }
  
  // 서비스 상태
  services: Array<{
    name: string
    status: 'operational' | 'degraded' | 'outage'
    errorRate: number
    responseTime: number
    lastCheck: string
  }>
  
  // 인프라 메트릭스
  infrastructure: {
    cpu: number
    memory: number
    disk: number
    database: {
      connections: number
      slow_queries: number
      errors: number
    }
  }
}

// ================================================================
// 7. 유틸리티 타입들
// ================================================================

/**
 * 에러 타입 통합
 */
export type AppError = 
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NetworkError
  | DatabaseError
  | BusinessError
  | SystemError
  | ExternalServiceError
  | UIError
  | SecurityError
  | PerformanceError

/**
 * 에러 생성 팩토리 타입
 */
export type ErrorFactory<T extends BaseError> = (
  message: string,
  options?: Partial<Omit<T, 'id' | 'timestamp' | 'message'>>
) => T

/**
 * 에러 핸들러 함수 타입
 */
export type ErrorHandlerFunction = (error: AppError, context?: Record<string, unknown>) => Promise<void> | void

/**
 * 에러 복구 함수 타입
 */
export type ErrorRecoveryFunction = (error: AppError) => Promise<boolean>

/**
 * 에러 변환 함수 타입
 */
export type ErrorTransformFunction<T extends BaseError = BaseError> = (error: unknown) => T

// ================================================================
// 8. 에러 코드 상수들
// ================================================================

/**
 * 표준 에러 코드
 */
export const ERROR_CODES = {
  // Validation (1000-1999)
  VALIDATION_FAILED: 'ERR_1000',
  REQUIRED_FIELD_MISSING: 'ERR_1001',
  INVALID_FORMAT: 'ERR_1002',
  VALUE_OUT_OF_RANGE: 'ERR_1003',
  DUPLICATE_VALUE: 'ERR_1004',
  
  // Authentication (2000-2999)
  AUTH_FAILED: 'ERR_2000',
  INVALID_CREDENTIALS: 'ERR_2001',
  TOKEN_EXPIRED: 'ERR_2002',
  TOKEN_INVALID: 'ERR_2003',
  ACCOUNT_LOCKED: 'ERR_2004',
  MFA_REQUIRED: 'ERR_2005',
  
  // Authorization (3000-3999)
  FORBIDDEN: 'ERR_3000',
  INSUFFICIENT_PERMISSIONS: 'ERR_3001',
  ROLE_REQUIRED: 'ERR_3002',
  TENANT_ACCESS_DENIED: 'ERR_3003',
  SUBSCRIPTION_REQUIRED: 'ERR_3004',
  
  // Network (4000-4999)
  NETWORK_ERROR: 'ERR_4000',
  TIMEOUT: 'ERR_4001',
  CONNECTION_FAILED: 'ERR_4002',
  DNS_ERROR: 'ERR_4003',
  
  // Database (5000-5999)
  DATABASE_ERROR: 'ERR_5000',
  CONNECTION_POOL_EXHAUSTED: 'ERR_5001',
  QUERY_TIMEOUT: 'ERR_5002',
  CONSTRAINT_VIOLATION: 'ERR_5003',
  DEADLOCK: 'ERR_5004',
  
  // Business Logic (6000-6999)
  BUSINESS_RULE_VIOLATION: 'ERR_6000',
  INSUFFICIENT_BALANCE: 'ERR_6001',
  ENROLLMENT_FULL: 'ERR_6002',
  SCHEDULE_CONFLICT: 'ERR_6003',
  
  // System (7000-7999)
  SYSTEM_ERROR: 'ERR_7000',
  SERVICE_UNAVAILABLE: 'ERR_7001',
  MAINTENANCE_MODE: 'ERR_7002',
  RATE_LIMIT_EXCEEDED: 'ERR_7003',
  
  // External Services (8000-8999)
  EXTERNAL_SERVICE_ERROR: 'ERR_8000',
  PAYMENT_PROVIDER_ERROR: 'ERR_8001',
  EMAIL_SERVICE_ERROR: 'ERR_8002',
  SMS_SERVICE_ERROR: 'ERR_8003',
  
  // UI/UX (9000-9999)
  UI_ERROR: 'ERR_9000',
  RENDER_ERROR: 'ERR_9001',
  STATE_CORRUPTION: 'ERR_9002',
  COMPONENT_ERROR: 'ERR_9003'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]