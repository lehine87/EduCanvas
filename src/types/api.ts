// EduCanvas v4.1 API 타입 시스템 (완전 체계화)
// API 요청/응답, 에러 처리, 비즈니스 로직 관련 타입 정의
// @version v4.1
// @since 2025-08-12

import type { Database } from './database'
import type { 
  UserProfile, Tenant, AuthenticatedUser, LoginRequest, LoginResponse,
  JWTPayload, SecurityContext, PermissionCheckResult 
} from './auth.types'
import type { 
  Student, StudentWithRelations, StudentStatus, StudentFilters 
} from './student.types'

// ================================================================
// 1. 기본 API 응답 타입들 (표준화)
// ================================================================

/**
 * 기본 API 응답 구조
 * 모든 API 엔드포인트에서 일관되게 사용
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  request_id?: string
}

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  page: number
  limit: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * 페이지네이션된 API 응답
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_more: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }
}

/**
 * API 메타데이터
 */
export interface ApiMetadata {
  version: string
  execution_time_ms: number
  cache_hit?: boolean
  rate_limit?: {
    remaining: number
    reset_at: string
  }
}

/**
 * 완전한 API 응답 (메타데이터 포함)
 */
export interface FullApiResponse<T> extends ApiResponse<T> {
  meta: ApiMetadata
}

// ================================================================
// 2. 에러 처리 타입들 (상세화)
// ================================================================

/**
 * API 에러 코드 상수
 */
export const API_ERROR_CODES = {
  // 인증/인가 에러 (4xxx)
  UNAUTHORIZED: 'AUTH_401_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_403_FORBIDDEN',
  TOKEN_EXPIRED: 'AUTH_401_TOKEN_EXPIRED',
  INVALID_TOKEN: 'AUTH_401_INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'AUTH_403_INSUFFICIENT_PERMISSIONS',
  
  // 요청 에러 (4xxx)
  BAD_REQUEST: 'REQ_400_BAD_REQUEST',
  VALIDATION_ERROR: 'REQ_400_VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'REQ_404_NOT_FOUND',
  DUPLICATE_RESOURCE: 'REQ_409_DUPLICATE',
  RATE_LIMITED: 'REQ_429_RATE_LIMITED',
  
  // 비즈니스 로직 에러 (4xxx)
  BUSINESS_RULE_VIOLATION: 'BIZ_400_RULE_VIOLATION',
  INSUFFICIENT_BALANCE: 'BIZ_402_INSUFFICIENT_BALANCE',
  ENROLLMENT_FULL: 'BIZ_409_ENROLLMENT_FULL',
  SCHEDULE_CONFLICT: 'BIZ_409_SCHEDULE_CONFLICT',
  
  // 서버 에러 (5xxx)
  INTERNAL_ERROR: 'SRV_500_INTERNAL_ERROR',
  DATABASE_ERROR: 'SRV_500_DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'SRV_502_EXTERNAL_SERVICE',
  SERVICE_UNAVAILABLE: 'SRV_503_SERVICE_UNAVAILABLE',
  
  // 테넌트 관련 에러 (4xxx)
  TENANT_NOT_FOUND: 'TNT_404_NOT_FOUND',
  TENANT_INACTIVE: 'TNT_403_INACTIVE',
  TENANT_LIMIT_EXCEEDED: 'TNT_402_LIMIT_EXCEEDED',
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

/**
 * 상세 API 에러 정보
 */
export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
  timestamp: string
  request_id?: string
  suggestions?: string[]
}

/**
 * 유효성 검사 에러
 */
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
  constraints?: Record<string, unknown>
}

/**
 * 비즈니스 규칙 위반 에러
 */
export interface BusinessRuleViolation {
  rule: string
  message: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  recovery_suggestions?: string[]
}

/**
 * 완전한 에러 응답
 */
export interface ApiErrorResponse extends ApiResponse<never> {
  error: ApiError
  validation_errors?: ValidationError[]
  business_violations?: BusinessRuleViolation[]
  stack_trace?: string // development only
}

// ================================================================
// 3. 학생 관리 API 타입들
// ================================================================

/**
 * 학생 생성 요청
 * v4.1 스키마 기준으로 업데이트
 */
export interface CreateStudentRequest {
  name: string
  student_number: string // v4.1: Required
  phone?: string
  email?: string // v4.1: New field
  parent_name?: string
  parent_phone_1?: string // v4.1: Primary parent contact
  parent_phone_2?: string // v4.1: Secondary parent contact
  grade_level?: string
  school_name?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  emergency_contact?: {
    name: string
    relationship: string
    phone: string
  }
  enrollment_date?: string
  status?: StudentStatus
  tags?: string[]
  custom_fields?: Record<string, unknown>
  memo?: string
}

/**
 * 학생 업데이트 요청
 */
export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  id: string
}

/**
 * 학생 조회 요청
 */
export interface GetStudentsRequest extends PaginationParams {
  filters?: StudentFilters
  include_relations?: ('class' | 'enrollments' | 'payments' | 'attendance')[]
  search?: string
  export_format?: 'json' | 'excel' | 'csv'
}

/**
 * 학생 이동 요청 (ClassFlow)
 */
export interface MoveStudentRequest {
  student_id: string
  source_class_id?: string
  target_class_id: string
  new_position?: number
  reason?: string
  effective_date?: string
  create_history_entry?: boolean
}

/**
 * 대량 학생 업데이트 요청
 */
export interface BulkStudentUpdateRequest {
  student_ids: string[]
  updates: Partial<UpdateStudentRequest>
  options?: {
    skip_validation?: boolean
    continue_on_error?: boolean
    send_notifications?: boolean
  }
}

/**
 * 학생 상세 정보 (관계 데이터 포함)
 */
export interface StudentDetailResponse extends StudentWithRelations {
  attendance_summary?: {
    total_sessions: number
    present_count: number
    absent_count: number
    late_count: number
    attendance_rate: number
    recent_streak: number
  }
  payment_summary?: {
    total_paid: number
    outstanding_balance: number
    next_due_date?: string
    overdue_amount: number
    payment_history_count: number
  }
  academic_progress?: {
    current_level: string
    progress_percentage: number
    recent_grades: Array<{
      subject: string
      score: number
      date: string
    }>
  }
}

// ================================================================
// 4. 클래스 관리 API 타입들
// ================================================================

/**
 * 클래스 타입 (v4.1 스키마 기준)
 */
export type Class = Database['public']['Tables']['classes']['Row']
export type ClassInsert = Database['public']['Tables']['classes']['Insert']
export type ClassUpdate = Database['public']['Tables']['classes']['Update']

/**
 * 클래스 생성 요청
 */
export interface CreateClassRequest {
  name: string
  subject?: string
  grade?: string // v4.1: Updated field
  course?: string // v4.1: New field
  level?: string
  description?: string
  max_students?: number
  min_students?: number
  instructor_id?: string // References user_profiles.id
  classroom_id?: string
  color?: string
  is_active?: boolean
  start_date?: string
  end_date?: string
  schedule_config?: {
    days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
    start_time: string
    end_time: string
    recurrence: 'weekly' | 'biweekly' | 'monthly'
  }
  custom_fields?: Record<string, unknown>
}

/**
 * 클래스 업데이트 요청
 */
export interface UpdateClassRequest extends Partial<CreateClassRequest> {
  id: string
}

/**
 * 클래스 조회 요청
 */
export interface GetClassesRequest extends PaginationParams {
  filters?: {
    search?: string
    grade?: string | 'all'
    course?: string | 'all' 
    subject?: string | 'all'
    instructor_id?: string | 'all'
    is_active?: boolean | 'all'
    has_capacity?: boolean
  }
  include_relations?: ('instructor' | 'students' | 'course_packages' | 'schedule')[]
}

/**
 * 클래스 상세 정보
 */
export interface ClassDetailResponse extends Class {
  instructor?: UserProfile
  students?: StudentDetailResponse[]
  statistics?: {
    total_students: number
    active_students: number
    capacity_utilization: number
    average_attendance_rate: number
    retention_rate: number
    revenue_total: number
    revenue_monthly: number
  }
  schedule?: {
    regular_schedule: Array<{
      day: string
      start_time: string
      end_time: string
    }>
    exceptions: Array<{
      date: string
      type: 'cancelled' | 'moved' | 'extra'
      reason?: string
    }>
    next_sessions: Array<{
      date: string
      start_time: string
      end_time: string
    }>
  }
}

// ================================================================
// 5. 출결 관리 API 타입들
// ================================================================

/**
 * 출석 타입 (데이터베이스 기준)
 */
export type Attendance = Database['public']['Tables']['attendances']['Row']
export type AttendanceInsert = Database['public']['Tables']['attendances']['Insert']
export type AttendanceStatus = Database['public']['Enums']['attendance_status']

/**
 * 출석 생성 요청
 */
export interface CreateAttendanceRequest {
  student_id: string
  class_id: string
  enrollment_id?: string
  attendance_date: string
  status: AttendanceStatus
  check_in_time?: string
  check_out_time?: string
  actual_hours?: number
  late_minutes?: number
  notes?: string
}

/**
 * 대량 출석 처리 요청
 */
export interface BulkAttendanceRequest {
  class_id: string
  attendance_date: string
  attendances: Array<{
    student_id: string
    status: AttendanceStatus
    check_in_time?: string
    late_minutes?: number
    notes?: string
  }>
  options?: {
    auto_calculate_hours?: boolean
    send_notifications?: boolean
  }
}

/**
 * 출석 조회 요청
 */
export interface GetAttendanceRequest extends PaginationParams {
  filters?: {
    student_id?: string
    class_id?: string
    enrollment_id?: string
    date_from: string
    date_to: string
    status?: AttendanceStatus | 'all'
  }
  include_relations?: ('student' | 'class' | 'enrollment')[]
  group_by?: 'student' | 'class' | 'date'
}

/**
 * 출석 통계
 */
export interface AttendanceStatsResponse {
  period: {
    from: string
    to: string
  }
  overall_stats: {
    total_sessions: number
    present_count: number
    absent_count: number
    late_count: number
    excused_count: number
    attendance_rate: number
  }
  by_student?: Record<string, {
    name: string
    total_sessions: number
    present_count: number
    attendance_rate: number
    consecutive_absences: number
  }>
  by_class?: Record<string, {
    name: string
    total_sessions: number
    average_attendance_rate: number
    low_attendance_students: number
  }>
  trends: Array<{
    date: string
    attendance_rate: number
    total_sessions: number
  }>
}

// ================================================================
// 6. 결제 관리 API 타입들
// ================================================================

/**
 * 결제 타입들 (데이터베이스 기준)
 */
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentStatus = Database['public']['Enums']['payment_status']

/**
 * 결제 생성 요청
 */
export interface CreatePaymentRequest {
  student_id: string
  enrollment_id?: string
  amount: number
  due_date: string
  payment_method?: string
  memo?: string
  installment_config?: {
    count: number
    interval: 'monthly' | 'weekly'
    start_date: string
  }
}

/**
 * 결제 처리 요청
 */
export interface ProcessPaymentRequest {
  payment_id: string
  payment_date: string
  payment_method: string
  receipt_number?: string
  actual_amount?: number
  transaction_metadata?: Record<string, unknown>
}

/**
 * 결제 조회 요청
 */
export interface GetPaymentsRequest extends PaginationParams {
  filters?: {
    student_id?: string
    enrollment_id?: string
    status?: PaymentStatus | 'all'
    payment_method?: string | 'all'
    due_date_from?: string
    due_date_to?: string
    overdue_only?: boolean
    amount_min?: number
    amount_max?: number
  }
  include_relations?: ('student' | 'enrollment')[]
}

/**
 * 결제 상세 정보
 */
export interface PaymentDetailResponse extends Payment {
  student?: Student
  enrollment?: {
    id: string
    course_package_name: string
    class_name?: string
    period: {
      start: string
      end: string
    }
  }
  installments?: Payment[] // 분할 결제인 경우
  refund_history?: Array<{
    id: string
    amount: number
    reason: string
    processed_at: string
    processed_by: string
  }>
}

// ================================================================
// 7. 수강 등록 API 타입들
// ================================================================

/**
 * 수강 등록 타입들
 */
export type StudentEnrollment = Database['public']['Tables']['student_enrollments']['Row']
export type StudentEnrollmentInsert = Database['public']['Tables']['student_enrollments']['Insert']

/**
 * 수강 등록 생성 요청
 */
export interface CreateEnrollmentRequest {
  student_id: string
  package_id: string
  class_id?: string
  start_date: string
  end_date?: string
  original_price: number
  discount_amount?: number
  final_price: number
  payment_plan?: 'full' | 'monthly' | 'custom'
  sessions_total?: number
  hours_total?: number
  notes?: string
}

/**
 * 수강 등록 업데이트 요청
 */
export interface UpdateEnrollmentRequest extends Partial<CreateEnrollmentRequest> {
  id: string
  status?: string
  expires_at?: string
}

/**
 * 수강 등록 조회 요청
 */
export interface GetEnrollmentsRequest extends PaginationParams {
  filters?: {
    student_id?: string
    package_id?: string
    class_id?: string
    status?: string | 'all'
    expiring_within_days?: number
    start_date_from?: string
    start_date_to?: string
  }
  include_relations?: ('student' | 'package' | 'class' | 'payments')[]
}

// ================================================================
// 8. 대시보드 API 타입들
// ================================================================

/**
 * 대시보드 통계 요청
 */
export interface GetDashboardStatsRequest {
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year'
  compare_previous?: boolean
  include_trends?: boolean
}

/**
 * 대시보드 통계 응답
 */
export interface DashboardStatsResponse {
  students: {
    total: number
    active: number
    new_this_period: number
    retention_rate: number
    growth_rate: number
  }
  classes: {
    total: number
    active: number
    average_capacity: number
    total_capacity: number
  }
  revenue: {
    total: number
    collected: number
    outstanding: number
    overdue: number
    growth_rate: number
  }
  attendance: {
    overall_rate: number
    today_rate?: number
    trend: 'up' | 'down' | 'stable'
    sessions_today: number
  }
}

/**
 * 최근 활동 정보
 */
export interface RecentActivitiesResponse {
  recent_enrollments: Array<{
    student_name: string
    class_name: string
    enrolled_at: string
    amount: number
  }>
  overdue_payments: Array<{
    student_name: string
    amount: number
    days_overdue: number
    due_date: string
  }>
  attendance_alerts: Array<{
    student_name: string
    class_name: string
    issue: 'consecutive_absences' | 'low_rate' | 'no_show'
    severity: 'low' | 'medium' | 'high'
    days_count: number
  }>
  expiring_enrollments: Array<{
    student_name: string
    class_name: string
    expires_at: string
    days_remaining: number
  }>
}

// ================================================================
// 9. 검색 및 필터 API 타입들
// ================================================================

/**
 * 전역 검색 요청
 */
export interface GlobalSearchRequest {
  query: string
  filters?: {
    entity_types?: ('student' | 'class' | 'instructor' | 'payment')[]
    date_range?: {
      from: string
      to: string
    }
    tenant_id?: string
  }
  options?: {
    limit?: number
    include_inactive?: boolean
    exact_match_priority?: boolean
  }
}

/**
 * 전역 검색 응답
 */
export interface GlobalSearchResponse {
  results: {
    students: Array<{
      id: string
      name: string
      student_number: string
      class_name?: string
      status: string
      match_fields: string[]
    }>
    classes: Array<{
      id: string
      name: string
      instructor_name?: string
      student_count: number
      match_fields: string[]
    }>
    instructors: Array<{
      id: string
      name: string
      email: string
      class_count: number
      match_fields: string[]
    }>
    payments: Array<{
      id: string
      student_name: string
      amount: number
      status: string
      due_date: string
      match_fields: string[]
    }>
  }
  total_found: number
  search_time_ms: number
  suggestions?: string[]
}

// ================================================================
// 10. 대량 작업 API 타입들
// ================================================================

/**
 * 대량 작업 요청
 */
export interface BulkOperationRequest<T = unknown> {
  operation: 'create' | 'update' | 'delete'
  entity_type: 'student' | 'class' | 'attendance' | 'payment' | 'enrollment'
  data: T[]
  options?: {
    skip_validation?: boolean
    continue_on_error?: boolean
    batch_size?: number
    send_notifications?: boolean
    dry_run?: boolean
  }
}

/**
 * 대량 작업 응답
 */
export interface BulkOperationResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  total_records: number
  processed_records: number
  successful_records: number
  failed_records: number
  errors: Array<{
    row_index: number
    record_id?: string
    error_code: string
    error_message: string
    data?: unknown
  }>
  progress_percentage: number
  started_at: string
  completed_at?: string
  estimated_completion?: string
}

// ================================================================
// 11. 실시간 업데이트 API 타입들
// ================================================================

/**
 * WebSocket 메시지 타입
 */
export interface WebSocketMessage<T = unknown> {
  type: 'attendance_update' | 'payment_received' | 'enrollment_created' | 'class_update' | 'system_notification'
  data: T
  timestamp: string
  tenant_id: string
  user_id?: string
  channel?: string
}

/**
 * 실시간 출석 업데이트
 */
export interface AttendanceUpdateMessage {
  type: 'attendance_update'
  data: {
    class_id: string
    attendance_date: string
    updated_attendances: Array<{
      student_id: string
      student_name: string
      status: AttendanceStatus
      check_in_time?: string
    }>
    class_stats: {
      present_count: number
      absent_count: number
      late_count: number
      attendance_rate: number
    }
  }
}

/**
 * 실시간 결제 알림
 */
export interface PaymentReceivedMessage {
  type: 'payment_received'
  data: {
    payment_id: string
    student_id: string
    student_name: string
    amount: number
    payment_method: string
    processed_at: string
  }
}

// ================================================================
// 12. 외부 연동 API 타입들
// ================================================================

/**
 * SMS 알림 요청
 */
export interface SendSMSRequest {
  recipients: Array<{
    phone: string
    name: string
    variables?: Record<string, string>
  }>
  template_id?: string
  message?: string
  scheduled_at?: string
  options?: {
    priority: 'low' | 'normal' | 'high'
    retry_count: number
  }
}

/**
 * 이메일 알림 요청
 */
export interface SendEmailRequest {
  recipients: Array<{
    email: string
    name: string
    variables?: Record<string, unknown>
  }>
  template_id: string
  subject?: string
  scheduled_at?: string
  attachments?: Array<{
    filename: string
    content_base64: string
    content_type: string
  }>
}

// ================================================================
// 13. 보고서 및 분석 API 타입들
// ================================================================

/**
 * 보고서 생성 요청
 */
export interface GenerateReportRequest {
  report_type: 'student_list' | 'attendance_summary' | 'payment_report' | 'revenue_analysis' | 'instructor_performance'
  parameters: {
    date_range?: {
      from: string
      to: string
    }
    filters?: Record<string, unknown>
    group_by?: string[]
    include_charts?: boolean
  }
  format: 'excel' | 'pdf' | 'csv' | 'json'
  delivery?: {
    method: 'download' | 'email'
    recipients?: string[]
  }
}

/**
 * 보고서 생성 응답
 */
export interface GenerateReportResponse {
  report_id: string
  status: 'generating' | 'completed' | 'failed'
  download_url?: string
  file_size?: number
  generated_at?: string
  expires_at?: string
}

// ================================================================
// 14. 헬퍼 타입들
// ================================================================

/**
 * API 엔드포인트별 매핑 타입
 */
export type ApiEndpointMap = {
  // 인증
  'POST /auth/login': { request: LoginRequest; response: LoginResponse }
  'POST /auth/logout': { request: {}; response: ApiResponse }
  'POST /auth/refresh': { request: { refresh_token: string }; response: { access_token: string } }
  
  // 학생 관리
  'GET /students': { request: GetStudentsRequest; response: PaginatedApiResponse<StudentDetailResponse> }
  'POST /students': { request: CreateStudentRequest; response: ApiResponse<Student> }
  'PUT /students/{id}': { request: UpdateStudentRequest; response: ApiResponse<Student> }
  'DELETE /students/{id}': { request: {}; response: ApiResponse }
  
  // 클래스 관리
  'GET /classes': { request: GetClassesRequest; response: PaginatedApiResponse<ClassDetailResponse> }
  'POST /classes': { request: CreateClassRequest; response: ApiResponse<Class> }
  'PUT /classes/{id}': { request: UpdateClassRequest; response: ApiResponse<Class> }
  
  // 출석 관리
  'GET /attendance': { request: GetAttendanceRequest; response: PaginatedApiResponse<Attendance> }
  'POST /attendance': { request: CreateAttendanceRequest; response: ApiResponse<Attendance> }
  'POST /attendance/bulk': { request: BulkAttendanceRequest; response: BulkOperationResponse }
  
  // 결제 관리
  'GET /payments': { request: GetPaymentsRequest; response: PaginatedApiResponse<PaymentDetailResponse> }
  'POST /payments': { request: CreatePaymentRequest; response: ApiResponse<Payment> }
  'POST /payments/{id}/process': { request: ProcessPaymentRequest; response: ApiResponse<Payment> }
  
  // 대시보드
  'GET /dashboard/stats': { request: GetDashboardStatsRequest; response: DashboardStatsResponse }
  'GET /dashboard/activities': { request: {}; response: RecentActivitiesResponse }
  
  // 검색
  'GET /search': { request: GlobalSearchRequest; response: GlobalSearchResponse }
  
  // 대량 작업
  'POST /bulk/{entity}': { request: BulkOperationRequest; response: BulkOperationResponse }
  'GET /bulk/{job_id}': { request: {}; response: BulkOperationResponse }
}

/**
 * API 클라이언트 타입 헬퍼
 */
export type ApiClient = {
  [K in keyof ApiEndpointMap]: (
    params: ApiEndpointMap[K]['request']
  ) => Promise<ApiEndpointMap[K]['response']>
}

/**
 * 타입 안전한 API 호출을 위한 유틸리티 타입
 */
export type ExtractApiRequest<T> = T extends { request: infer R } ? R : never
export type ExtractApiResponse<T> = T extends { response: infer R } ? R : never