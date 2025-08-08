// EduCanvas v2.0 API & Business Logic Types
// API 응답, 비즈니스 로직, 실시간 기능 관련 타입 정의

import type { 
  User, Student, Class, Instructor, Attendance, Payment, 
  StudentStatus, UserRole, PaginationParams, PaginationResult,
  StudentEnrollment, CoursePackage, SalaryCalculation 
} from './database';
import type { BillingCalculationResult, DiscountPolicy } from './billing';
import type { SalaryCalculationResult, InstructorPerformanceMetrics } from './salary';

// ================================================================
// 1. COMMON API TYPES (공통 API 타입)
// ================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

// ================================================================
// 2. AUTHENTICATION API TYPES (인증 API)
// ================================================================

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse extends ApiResponse<{
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse extends ApiResponse<{
  access_token: string;
  expires_in: number;
}> {}

export interface LogoutRequest {
  refresh_token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ================================================================
// 3. STUDENT API TYPES (학생 관리 API)
// ================================================================

export interface CreateStudentRequest {
  name: string;
  phone?: string;
  parent_name?: string;
  parent_phone: string;
  grade?: string;
  class_id?: string;
  enrollment_date?: string;
  memo?: string;
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  status?: StudentStatus;
  graduation_date?: string;
  display_color?: string;
  position_in_class?: number;
}

export interface MoveStudentRequest {
  student_id: string;
  target_class_id: string;
  new_position: number;
  reason?: string;
}

export interface BulkUpdateStudentsRequest {
  student_ids: string[];
  updates: Partial<UpdateStudentRequest>;
}

export interface GetStudentsRequest extends PaginationParams {
  search?: string;
  status?: StudentStatus | 'all';
  class_id?: string;
  grade?: string;
  enrollment_date_from?: string;
  enrollment_date_to?: string;
  include_class?: boolean;
  include_enrollment?: boolean;
}

export interface StudentWithDetails extends Student {
  class?: Class;
  instructor?: Instructor;
  current_enrollment?: StudentEnrollment;
  attendance_stats?: {
    attendance_rate: number;
    total_days: number;
    present_count: number;
  };
  payment_status?: {
    current_balance: number;
    overdue_amount: number;
    next_due_date?: string;
  };
}

// ================================================================
// 4. CLASS API TYPES (클래스 관리 API)
// ================================================================

export interface CreateClassRequest {
  name: string;
  subject?: string;
  grade_level?: string;
  max_students: number;
  instructor_id?: string;
  classroom?: string;
  color?: string;
  start_date?: string;
  end_date?: string;
  memo?: string;
}

export interface UpdateClassRequest extends Partial<CreateClassRequest> {
  status?: StudentStatus;
  order_index?: number;
}

export interface GetClassesRequest extends PaginationParams {
  search?: string;
  status?: StudentStatus | 'all';
  instructor_id?: string;
  subject?: string;
  include_instructor?: boolean;
  include_students?: boolean;
  include_stats?: boolean;
}

export interface ClassWithDetails extends Class {
  instructor?: Instructor;
  students?: StudentWithDetails[];
  course_packages?: CoursePackage[];
  stats?: {
    occupancy_rate: number;
    total_revenue: number;
    average_attendance_rate: number;
    student_retention_rate: number;
  };
}

// ================================================================
// 5. ATTENDANCE API TYPES (출결 관리 API)
// ================================================================

export interface CreateAttendanceRequest {
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  check_in_time?: string;
  check_out_time?: string;
  temperature?: number;
  memo?: string;
}

export interface BulkAttendanceRequest {
  class_id: string;
  attendance_date: string;
  attendances: Array<{
    student_id: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    check_in_time?: string;
    temperature?: number;
    memo?: string;
  }>;
}

export interface GetAttendanceRequest extends PaginationParams {
  student_id?: string;
  class_id?: string;
  date_from: string;
  date_to: string;
  status?: 'present' | 'late' | 'absent' | 'excused' | 'all';
  include_student?: boolean;
  include_class?: boolean;
}

export interface AttendanceStats {
  student_id?: string;
  class_id?: string;
  period: {
    from: string;
    to: string;
  };
  total_days: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  attendance_rate: number;
  trends: Array<{
    date: string;
    rate: number;
  }>;
}

// ================================================================
// 6. PAYMENT API TYPES (결제 관리 API)
// ================================================================

export interface CreatePaymentRequest {
  student_id: string;
  enrollment_id?: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'mobile';
  payment_date: string;
  due_date: string;
  installment_count?: number;
  memo?: string;
}

export interface ProcessPaymentRequest {
  payment_id: string;
  transaction_id?: string;
  receipt_number?: string;
  actual_amount?: number;
  payment_date?: string;
}

export interface GetPaymentsRequest extends PaginationParams {
  student_id?: string;
  status?: 'pending' | 'completed' | 'overdue' | 'cancelled' | 'all';
  payment_method?: 'cash' | 'card' | 'transfer' | 'mobile' | 'all';
  due_date_from?: string;
  due_date_to?: string;
  overdue_only?: boolean;
  include_student?: boolean;
  include_enrollment?: boolean;
}

export interface PaymentWithDetails extends Payment {
  student?: Student;
  enrollment?: StudentEnrollment;
  installments?: Payment[]; // 분납인 경우 전체 할부 정보
}

export interface PaymentStats {
  period: {
    from: string;
    to: string;
  };
  total_amount: number;
  completed_amount: number;
  pending_amount: number;
  overdue_amount: number;
  overdue_count: number;
  collection_rate: number;
  trends: Array<{
    date: string;
    amount: number;
    status: 'completed' | 'pending' | 'overdue';
  }>;
}

// ================================================================
// 7. ENROLLMENT API TYPES (수강권 등록 API)
// ================================================================

export interface CreateEnrollmentRequest {
  student_id: string;
  course_package_id: string;
  start_date: string;
  discount_policy_ids?: string[];
  custom_discount?: {
    name: string;
    discount_rate?: number;
    discount_amount?: number;
    reason?: string;
  };
  auto_renewal?: boolean;
  memo?: string;
}

export interface UpdateEnrollmentRequest {
  status?: StudentStatus;
  auto_renewal?: boolean;
  memo?: string;
}

export interface GetEnrollmentsRequest extends PaginationParams {
  student_id?: string;
  course_package_id?: string;
  status?: StudentStatus | 'all';
  start_date_from?: string;
  start_date_to?: string;
  expiring_soon?: boolean; // 만료 임박
  include_student?: boolean;
  include_package?: boolean;
}

export interface EnrollmentWithDetails extends StudentEnrollment {
  student?: Student;
  course_package?: CoursePackage;
  class?: Class;
  usage_history?: Array<{
    date: string;
    sessions_used: number;
    hours_used: number;
    remaining_sessions: number;
    remaining_hours: number;
  }>;
  payment_history?: PaymentWithDetails[];
}

// ================================================================
// 8. DASHBOARD API TYPES (대시보드 API)
// ================================================================

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    new_this_month: number;
    retention_rate: number;
  };
  classes: {
    total: number;
    active: number;
    average_occupancy: number;
  };
  revenue: {
    this_month: number;
    last_month: number;
    growth_percentage: number;
    outstanding: number;
  };
  attendance: {
    today_rate: number;
    this_week_average: number;
    trend: 'up' | 'down' | 'stable';
  };
  instructors: {
    total: number;
    active: number;
    average_performance: number;
  };
}

export interface RecentActivities {
  new_enrollments: StudentWithDetails[];
  recent_payments: PaymentWithDetails[];
  overdue_payments: PaymentWithDetails[];
  attendance_alerts: Array<{
    student: Student;
    class: Class;
    issue: 'consecutive_absences' | 'low_attendance_rate' | 'late_streak';
    days: number;
  }>;
  expiring_enrollments: EnrollmentWithDetails[];
}

export interface GetDashboardRequest {
  period?: 'today' | 'week' | 'month' | 'quarter';
  include_activities?: boolean;
  include_charts?: boolean;
}

// ================================================================
// 9. ANALYTICS API TYPES (분석 API)
// ================================================================

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters?: Record<string, any>;
  date_range: {
    from: string;
    to: string;
  };
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface AnalyticsResult {
  data: Array<{
    dimensions: Record<string, any>;
    metrics: Record<string, number>;
    timestamp?: string;
  }>;
  summary: {
    total_records: number;
    date_range: {
      from: string;
      to: string;
    };
  };
}

export interface ReportRequest {
  report_type: 'student_performance' | 'revenue_analysis' | 'instructor_performance' | 'attendance_summary';
  parameters: Record<string, any>;
  format?: 'json' | 'excel' | 'pdf';
  date_range: {
    from: string;
    to: string;
  };
}

// ================================================================
// 10. REAL-TIME API TYPES (실시간 기능)
// ================================================================

export interface WebSocketMessage {
  type: 'attendance_update' | 'payment_received' | 'enrollment_created' | 'system_notification';
  data: any;
  timestamp: string;
  user_id?: string;
  class_id?: string;
}

export interface AttendanceUpdateMessage {
  type: 'attendance_update';
  data: {
    class_id: string;
    student_id: string;
    attendance: Attendance;
    stats_update: AttendanceStats;
  };
}

export interface PaymentReceivedMessage {
  type: 'payment_received';
  data: {
    payment: PaymentWithDetails;
    student_id: string;
    amount: number;
  };
}

export interface SystemNotificationMessage {
  type: 'system_notification';
  data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    action_required?: boolean;
    related_entity?: {
      type: 'student' | 'class' | 'payment' | 'enrollment';
      id: string;
    };
  };
}

// ================================================================
// 11. SEARCH API TYPES (검색 기능)
// ================================================================

export interface GlobalSearchRequest {
  query: string;
  filters?: {
    entity_types?: ('student' | 'class' | 'instructor' | 'payment')[];
    date_range?: {
      from: string;
      to: string;
    };
  };
  limit?: number;
}

export interface GlobalSearchResult {
  students: StudentWithDetails[];
  classes: ClassWithDetails[];
  instructors: Instructor[];
  payments: PaymentWithDetails[];
  total_found: number;
  search_time_ms: number;
}

export interface SuggestionRequest {
  query: string;
  entity_type: 'student' | 'class' | 'instructor';
  limit?: number;
}

export interface SuggestionResult {
  suggestions: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    highlight?: string;
  }>;
}

// ================================================================
// 12. BULK OPERATIONS API TYPES (대량 작업)
// ================================================================

export interface BulkOperationRequest {
  operation: 'create' | 'update' | 'delete';
  entity_type: 'student' | 'class' | 'attendance' | 'payment';
  data: any[];
  options?: {
    skip_validation?: boolean;
    continue_on_error?: boolean;
  };
}

export interface BulkOperationResult {
  total_processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    row_index: number;
    error_message: string;
    data: any;
  }>;
  processing_time_ms: number;
}

// ================================================================
// 13. INTEGRATION API TYPES (외부 연동)
// ================================================================

export interface ExternalPaymentProvider {
  provider_name: string;
  provider_id: string;
  api_key: string;
  webhook_url: string;
  supported_methods: string[];
  is_active: boolean;
}

export interface PaymentWebhookPayload {
  provider: string;
  transaction_id: string;
  payment_id: string;
  amount: number;
  status: 'completed' | 'failed' | 'cancelled';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SMSNotificationRequest {
  recipients: Array<{
    phone: string;
    name: string;
  }>;
  message: string;
  template_id?: string;
  variables?: Record<string, string>;
}

export interface EmailNotificationRequest {
  recipients: Array<{
    email: string;
    name: string;
  }>;
  subject: string;
  template_id: string;
  variables: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    content_type: string;
  }>;
}

// ================================================================
// 14. ERROR HANDLING TYPES (에러 처리)
// ================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface BusinessRuleViolation {
  rule: string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse extends ApiResponse {
  error_code: string;
  error_message: string;
  validation_errors?: ValidationError[];
  business_rule_violations?: BusinessRuleViolation[];
  stack_trace?: string; // development only
}