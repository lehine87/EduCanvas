// EduCanvas 애플리케이션 레벨 타입들 (v4.1)
// 비즈니스 로직, ClassFlow, 비디오 학습, 분석 등 특화 타입 정의
// @version v4.1
// @since 2025-08-12

import type { Database } from './database'
import type { Student } from './student.types'

// ================================================================
// 1. ClassFlow 드래그앤드롭 시스템 타입들
// ================================================================

/**
 * ClassFlow용 확장된 Student 타입
 */
export interface ClassFlowStudent extends Student {
  // 드래그앤드롭 상태
  position?: { x: number; y: number }
  isDragging?: boolean
  isSelected?: boolean
  isHighlighted?: boolean
  dragIndex?: number
  originalClass?: string
  
  // 애니메이션 상태
  isAnimating?: boolean
  transitionDuration?: number
  
  // 임시 상태 (네트워크 동기화 전)
  isPending?: boolean
  lastMoved?: number
}

/**
 * ClassFlow용 확장된 Class 타입
 */
type BaseClassRow = Database['public']['Tables']['classes']['Row']

export interface ClassFlowClass extends BaseClassRow {
  students: ClassFlowStudent[]
  
  // 드롭존 상태
  isDropZone?: boolean
  isHighlighted?: boolean
  dragOverCount?: number
  
  // 레이아웃 정보
  position?: { 
    x: number
    y: number
    width: number
    height: number 
  }
  
  // 성능 최적화용
  isDirty?: boolean // 변경사항 있음
  lastSynced?: number
  version?: number // 충돌 해결용
}

/**
 * 드래그 작업 정의
 */
export interface DragOperation {
  id: string
  type: 'move' | 'copy' | 'swap' | 'reorder'
  studentId: string
  sourceClassId: string | null
  targetClassId: string | null
  sourcePosition: number
  targetPosition: number
  reason?: string
  timestamp: number
  userId: string
  
  // 롤백을 위한 정보
  rollbackData?: {
    originalClassId: string | null
    originalPosition: number
  }
}

/**
 * ClassFlow 전역 상태
 */
export interface ClassFlowState {
  // 데이터
  classes: ClassFlowClass[]
  unassignedStudents: ClassFlowStudent[]
  
  // UI 상태
  selectedStudentIds: Set<string>
  draggedStudentId: string | null
  hoveredClassId: string | null
  
  // 작업 상태
  currentOperation: DragOperation | null
  pendingOperations: DragOperation[]
  
  // 시스템 상태
  isDragging: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  
  // 성능 관련
  lastSyncTime: number
  version: number
  
  // 설정
  settings: {
    enableAnimations: boolean
    autoSave: boolean
    syncInterval: number
    maxUndoHistory: number
  }
}

/**
 * ClassFlow 성능 메트릭스
 */
export interface ClassFlowPerformanceMetrics {
  fps: number
  dragLatency: number // ms
  renderTime: number // ms
  memoryUsage: number // MB
  syncLatency: number // ms
  operationCount: number
  errorCount: number
  timestamp: number
}

// ================================================================
// 2. 비디오 학습 시스템 타입들
// ================================================================

/**
 * 비디오 시청 세션 상세 정보
 */
export interface VideoWatchSession {
  id: string
  studentId: string
  videoId: string
  
  // 시간 정보
  startTime: number
  endTime: number
  watchedDuration: number
  totalDuration: number
  
  // 인터랙션 정보
  pauseCount: number
  seekCount: number
  rewindCount: number
  forwardCount: number
  speedChanges: Array<{
    timestamp: number
    from: number
    to: number
  }>
  
  // 품질 정보
  quality: string
  qualityChanges: Array<{
    timestamp: number
    quality: string
    reason: 'manual' | 'automatic' | 'network'
  }>
  
  // 환경 정보
  fullScreenDuration: number
  deviceInfo: {
    type: 'desktop' | 'tablet' | 'mobile'
    browser: string
    os: string
    screenResolution: string
  }
  
  // 위치 정보 (선택적)
  locationInfo?: {
    country: string
    city: string
    timezone: string
  }
  
  // 세션 메타데이터
  timestamp: string
  ipAddress?: string
  sessionId: string
}

/**
 * 학생별 비디오 학습 통계
 */
export interface VideoLearningStats {
  studentId: string
  videoId: string
  
  // 기본 통계
  totalWatchTime: number
  completionRate: number
  averageSessionLength: number
  totalSessions: number
  lastWatchedAt: string
  firstWatchedAt: string
  
  // 참여도 지표
  engagementScore: number // 0-100
  attentionScore: number // 집중도
  comprehensionScore?: number // 이해도 (퀴즈 결과 기반)
  
  // 시청 패턴
  preferredQuality: string
  averageSpeed: number
  commonPausePoints: Array<{
    timestamp: number
    frequency: number
    averageDuration: number
  }>
  strugglingSegments: Array<{
    start: number
    end: number
    rewindCount: number
    pauseCount: number
  }>
  
  // 학습 진도
  masteredSegments: Array<{
    start: number
    end: number
    masteryLevel: number // 0-1
  }>
  
  // 예측 정보
  predictedCompletion?: string
  recommendedSpeed?: number
  suggestedBreakPoints?: number[]
}

/**
 * 비디오별 참여도 메트릭스
 */
export interface VideoEngagementMetrics {
  videoId: string
  title: string
  duration: number
  
  // 시청 통계
  totalViews: number
  uniqueViewers: number
  averageWatchTime: number
  completionRate: number
  retentionRate: Array<{
    timestamp: number
    percentage: number
  }>
  
  // 이탈 지점
  dropOffPoints: Array<{
    timestamp: number
    percentage: number
    studentCount: number
    commonReason?: 'difficult' | 'boring' | 'technical' | 'external'
  }>
  
  // 인기 구간
  popularSegments: Array<{
    startTime: number
    endTime: number
    rewatchCount: number
    avgRating?: number
  }>
  
  // 기술적 메트릭스
  qualityDistribution: Record<string, number>
  deviceDistribution: Record<string, number>
  browserDistribution: Record<string, number>
  
  // 학습 효과
  averageQuizScore?: number
  improvementRate?: number
  
  // 시간대별 분석
  hourlyDistribution: Array<{
    hour: number
    viewCount: number
    completionRate: number
  }>
  
  // 업데이트 정보
  lastCalculated: string
  calculationVersion: string
}

// ================================================================
// 3. 분석 및 리포팅 시스템 타입들
// ================================================================

/**
 * 분석 시간 범위
 */
export interface AnalyticsTimeRange {
  start: string
  end: string
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  timezone?: string
}

/**
 * 테넌트 종합 분석 데이터
 */
export interface TenantAnalytics {
  tenantId: string
  timeRange: AnalyticsTimeRange
  
  // 핵심 메트릭스
  metrics: {
    // 학생 관련
    totalStudents: number
    activeStudents: number
    newStudents: number
    retainedStudents: number
    churnedStudents: number
    
    // 클래스 관련
    totalClasses: number
    activeClasses: number
    averageClassSize: number
    capacityUtilization: number
    
    // 비디오 관련
    totalVideos: number
    totalWatchHours: number
    averageEngagement: number
    completionRate: number
    
    // 재무 관련
    totalRevenue: number
    monthlyRecurringRevenue: number
    averageRevenuePerStudent: number
    
    // 출석 관련
    overallAttendanceRate: number
    onTimeRate: number
    
    // 성과 관련
    averageGrade: number
    passRate: number
    satisfactionScore: number
  }
  
  // 트렌드 데이터
  trends: {
    studentGrowth: Array<{ date: string; count: number; growth: number }>
    revenueGrowth: Array<{ date: string; amount: number; growth: number }>
    engagementTrend: Array<{ date: string; score: number; change: number }>
    attendanceTrend: Array<{ date: string; rate: number; change: number }>
    videoConsumption: Array<{ date: string; hours: number; sessions: number }>
  }
  
  // 상위 성과자
  topPerformers: {
    students: Array<{
      studentId: string
      name: string
      score: number
      improvement: number
      category: 'attendance' | 'engagement' | 'performance' | 'overall'
    }>
    videos: Array<{
      videoId: string
      title: string
      engagementScore: number
      completionRate: number
      category: 'popular' | 'effective' | 'challenging'
    }>
    classes: Array<{
      classId: string
      name: string
      performance: number
      retention: number
      category: 'high_performing' | 'improving' | 'needs_attention'
    }>
    instructors: Array<{
      instructorId: string
      name: string
      rating: number
      studentSatisfaction: number
      category: 'excellence' | 'consistency' | 'innovation'
    }>
  }
  
  // 문제 영역 식별
  concerns: Array<{
    type: 'low_attendance' | 'poor_engagement' | 'high_churn' | 'technical_issues'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    affectedCount: number
    trend: 'improving' | 'stable' | 'worsening'
    recommendations: string[]
  }>
  
  // 예측 정보
  predictions: {
    nextMonthStudents: number
    nextMonthRevenue: number
    churnRisk: Array<{
      studentId: string
      riskScore: number // 0-1
      factors: string[]
    }>
    capacityForecast: Array<{
      classId: string
      predictedCapacity: number
      recommendedAction: string
    }>
  }
}

/**
 * 리포트 설정
 */
export interface ReportConfiguration {
  id?: string
  name: string
  description?: string
  
  // 리포트 타입
  type: 
    | 'student_progress'
    | 'class_analytics'
    | 'instructor_performance'
    | 'video_engagement'
    | 'financial_summary'
    | 'attendance_report'
    | 'parent_communication'
    | 'compliance_audit'
  
  // 파라미터
  parameters: {
    timeRange: AnalyticsTimeRange
    includeInactive: boolean
    groupBy: string[]
    metrics: string[]
    filters: Record<string, unknown>
    aggregation: 'sum' | 'average' | 'count' | 'median'
    comparison?: {
      enabled: boolean
      period: 'previous_period' | 'year_over_year' | 'custom'
      customRange?: AnalyticsTimeRange
    }
  }
  
  // 출력 설정
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html'
  template?: string
  branding?: {
    logo?: string
    colors?: Record<string, string>
    footer?: string
  }
  
  // 자동화 설정
  schedule?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    dayOfWeek?: number // 0-6
    dayOfMonth?: number // 1-31
    time: string // HH:mm format
    timezone: string
    recipients: Array<{
      email: string
      name: string
      role: string
    }>
    conditions?: Array<{
      metric: string
      operator: '>' | '<' | '==' | '>=' | '<='
      value: number
      action: 'send' | 'skip' | 'alert'
    }>
  }
  
  // 메타데이터
  createdBy: string
  createdAt: string
  updatedAt: string
  version: number
  tags: string[]
}

// ================================================================
// 4. 기능 플래그 시스템 타입들
// ================================================================

/**
 * 기능 플래그 정의
 */
export interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  
  // 롤아웃 설정
  rollout: {
    percentage: number // 0-100
    strategy: 'percentage' | 'whitelist' | 'blacklist' | 'ring' | 'canary'
    rings?: Array<{
      name: string
      percentage: number
      criteria: Record<string, unknown>
    }>
  }
  
  // 조건
  conditions: {
    tenantTiers?: string[]
    userRoles?: string[]
    minVersion?: string
    maxVersion?: string
    countries?: string[]
    customRules?: Array<{
      field: string
      operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
      value: string | number | boolean
    }>
  }
  
  // 변형 (A/B 테스트용)
  variants?: Array<{
    key: string
    name: string
    weight: number
    payload?: Record<string, unknown>
  }>
  
  // 메타데이터
  owner: string
  tags: string[]
  dependencies?: string[] // 다른 플래그들
  mutuallyExclusive?: string[]
  
  // 생명주기
  createdAt: string
  updatedAt: string
  scheduledChanges?: Array<{
    date: string
    action: 'enable' | 'disable' | 'update'
    changes: Record<string, unknown>
  }>
}

/**
 * 기능 플래그 평가 컨텍스트
 */
export interface FeatureFlagContext {
  userId: string
  tenantId: string
  tenantTier: string
  userRole: string
  version: string
  country?: string
  
  // 커스텀 속성
  customAttributes: Record<string, unknown>
  
  // 세션 정보
  sessionId: string
  timestamp: string
}

/**
 * 기능 플래그 평가 결과
 */
export interface FeatureFlagResult {
  enabled: boolean
  variant?: string
  payload?: Record<string, unknown>
  reason: string
  ruleEvaluations: Array<{
    rule: string
    matched: boolean
    reason: string
  }>
}

// ================================================================
// 5. 이벤트 시스템 타입들
// ================================================================

/**
 * 애플리케이션 이벤트 기본 타입
 */
export interface AppEvent<T = unknown> {
  id: string
  type: string
  payload: T
  timestamp: number
  source: string
  version: string
  
  // 메타데이터
  metadata: {
    userId?: string
    tenantId?: string
    sessionId?: string
    correlationId?: string
    parentEventId?: string
  }
  
  // 추적 정보
  trace: {
    userAgent?: string
    ipAddress?: string
    referer?: string
    location?: {
      country: string
      city: string
    }
  }
}

/**
 * 시스템 이벤트
 */
export interface SystemEvent extends AppEvent {
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: 'security' | 'performance' | 'availability' | 'data' | 'user' | 'system'
  component: string
  
  // 경고 정보
  alerting?: {
    shouldAlert: boolean
    channels: ('email' | 'slack' | 'sms' | 'webhook')[]
    escalation: 'immediate' | 'delayed' | 'scheduled'
  }
  
  // 복구 정보
  recovery?: {
    autoRecoverable: boolean
    recoveryAction?: string
    maxRetries?: number
  }
}

/**
 * 사용자 이벤트
 */
export interface UserEvent extends AppEvent {
  action: string
  category: 'navigation' | 'interaction' | 'form' | 'error' | 'performance'
  
  // A/B 테스트 정보
  experiments?: Array<{
    id: string
    variant: string
  }>
  
  // 개인정보 보호
  anonymized: boolean
  piiRemoved: boolean
}

// ================================================================
// 6. 유틸리티 타입들
// ================================================================

/**
 * 테넌트 정보가 포함된 타입
 */
export type WithTenant<T> = T & { tenant_id: string }

/**
 * 타임스탬프가 포함된 타입
 */
export type WithTimestamps<T> = T & {
  created_at: string
  updated_at: string
}

/**
 * 버전 정보가 포함된 타입
 */
export type WithVersion<T> = T & {
  version: number
  version_hash?: string
}

/**
 * 소프트 삭제를 지원하는 타입
 */
export type WithSoftDelete<T> = T & {
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string
}

/**
 * 감사 로그를 위한 타입
 */
export type WithAudit<T> = T & {
  created_by?: string
  updated_by?: string
  audit_log_id?: string
}

/**
 * 선택적 필드를 지정하는 타입
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 필수 필드를 지정하는 타입
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * 타입 가드 정의
 */
export type TypeGuard<T> = (value: unknown) => value is T

/**
 * 딥 파셜 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 딥 리드온리 타입
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// ================================================================
// 7. 상수 및 ENUM 재정의
// ================================================================

/**
 * ClassFlow 액션 타입
 */
export const CLASSFLOW_ACTIONS = {
  DRAG_START: 'DRAG_START',
  DRAG_MOVE: 'DRAG_MOVE',
  DRAG_END: 'DRAG_END',
  SELECT_STUDENT: 'SELECT_STUDENT',
  DESELECT_STUDENT: 'DESELECT_STUDENT',
  BULK_MOVE: 'BULK_MOVE',
  SYNC_START: 'SYNC_START',
  SYNC_SUCCESS: 'SYNC_SUCCESS',
  SYNC_FAILURE: 'SYNC_FAILURE',
  UNDO: 'UNDO',
  REDO: 'REDO'
} as const

export type ClassFlowAction = typeof CLASSFLOW_ACTIONS[keyof typeof CLASSFLOW_ACTIONS]

/**
 * 비디오 이벤트 타입
 */
export const VIDEO_EVENTS = {
  PLAY: 'video_play',
  PAUSE: 'video_pause',
  SEEK: 'video_seek',
  SPEED_CHANGE: 'video_speed_change',
  QUALITY_CHANGE: 'video_quality_change',
  FULLSCREEN: 'video_fullscreen',
  EXIT_FULLSCREEN: 'video_exit_fullscreen',
  COMPLETE: 'video_complete',
  ERROR: 'video_error'
} as const

export type VideoEvent = typeof VIDEO_EVENTS[keyof typeof VIDEO_EVENTS]