// EduCanvas v2.0 Type Definitions Index
// 모든 타입 정의를 통합 export

// ================================================================
// 1. DATABASE TYPES (데이터베이스 기본 타입들)
// ================================================================
export * from './database';

// ================================================================  
// 2. BILLING SYSTEM TYPES (요금제 시스템)
// ================================================================
export * from './billing';

// ================================================================
// 3. SALARY SYSTEM TYPES (급여 시스템)
// ================================================================
export * from './salary';

// ================================================================
// 4. API TYPES (API 및 비즈니스 로직)
// ================================================================
export * from './api';

// ================================================================
// 5. COMMON UTILITY TYPES (공통 유틸리티 타입)
// ================================================================

// Date utilities
export type DateString = string; // YYYY-MM-DD format
export type DateTimeString = string; // ISO 8601 format
export type TimeString = string; // HH:MM format

// Color utilities
export type HexColor = string; // #RRGGBB format
export type StatusColor = 'success' | 'warning' | 'error' | 'info';

// File upload
export interface FileUpload {
  file: File;
  filename: string;
  content_type: string;
  size: number;
}

export interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

// Form utilities
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export type FormMode = 'create' | 'edit' | 'view';

// ================================================================
// 6. UI COMPONENT TYPES (프론트엔드 컴포넌트)
// ================================================================

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
  onRowClick?: (record: T) => void;
}

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  width?: string;
  children: React.ReactNode;
}

export interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: string | number;
  children: React.ReactNode;
}

// ================================================================
// 7. NAVIGATION TYPES (네비게이션)
// ================================================================

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  permissions?: string[];
  badge?: {
    count: number;
    color?: StatusColor;
  };
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// ================================================================
// 8. THEME TYPES (테마 설정)
// ================================================================

export interface ThemeConfig {
  primaryColor: HexColor;
  secondaryColor: HexColor;
  successColor: HexColor;
  warningColor: HexColor;
  errorColor: HexColor;
  textColor: HexColor;
  backgroundColor: HexColor;
  borderColor: HexColor;
  borderRadius: number;
  fontSize: {
    small: number;
    medium: number;
    large: number;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

// ================================================================
// 9. NOTIFICATION TYPES (알림 시스템)
// ================================================================

export interface NotificationConfig {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  closable?: boolean;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export interface ToastConfig {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

// ================================================================
// 10. CHART TYPES (차트 및 통계)
// ================================================================

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: HexColor;
}

export interface LineChartData {
  label: string;
  data: ChartDataPoint[];
  color?: HexColor;
  strokeWidth?: number;
}

export interface BarChartData {
  label: string;
  value: number;
  color?: HexColor;
}

export interface PieChartData {
  label: string;
  value: number;
  color?: HexColor;
  percentage?: number;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  responsive?: boolean;
}

// ================================================================
// 11. FILTER TYPES (필터링)
// ================================================================

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface DateRangeFilter {
  from: DateString;
  to: DateString;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface NumberRangeFilter {
  min: number;
  max: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiSelect' | 'dateRange' | 'numberRange' | 'search';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
}

// ================================================================
// 12. EXPORT TYPES (데이터 내보내기)
// ================================================================

export interface ExportConfig {
  format: 'excel' | 'csv' | 'pdf';
  filename?: string;
  columns?: string[];
  filters?: Record<string, any>;
  options?: {
    includeHeader?: boolean;
    dateFormat?: string;
    numberFormat?: string;
  };
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  created_at: string;
  expires_at: string;
}

// ================================================================
// 13. PRINT TYPES (인쇄)
// ================================================================

export interface PrintConfig {
  template: 'student_list' | 'attendance_report' | 'payment_receipt' | 'enrollment_certificate';
  data: any;
  options?: {
    orientation?: 'portrait' | 'landscape';
    paperSize?: 'A4' | 'A5' | 'Letter';
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    includeHeader?: boolean;
    includeFooter?: boolean;
    watermark?: string;
  };
}

// ================================================================
// 14. PERMISSION TYPES (권한 관리)
// ================================================================

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | '*';
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  is_system_role: boolean;
}

export interface UserPermissions {
  user_id: string;
  role: Role;
  additional_permissions?: Permission[];
  denied_permissions?: Permission[];
}

// ================================================================
// 15. AUDIT TYPES (감사 로그)
// ================================================================

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: DateTimeString;
}

export interface AuditQuery {
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  date_from?: DateString;
  date_to?: DateString;
  limit?: number;
  offset?: number;
}

// ================================================================
// 16. SYSTEM CONFIGURATION TYPES (시스템 설정)
// ================================================================

export interface SystemConfig {
  academy_name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: string;
  academic_year_start_month: number;
  default_class_duration: number; // minutes
  attendance_grace_period: number; // minutes
  payment_due_reminder_days: number;
  max_students_per_class: number;
}

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  templates: {
    enrollment_confirmation: boolean;
    payment_reminder: boolean;
    attendance_alert: boolean;
    class_cancellation: boolean;
  };
}

// ================================================================
// 17. INTEGRATION TYPES (외부 연동)
// ================================================================

export interface IntegrationConfig {
  payment_providers: {
    toss: {
      enabled: boolean;
      client_key: string;
      secret_key: string;
    };
    kakao_pay: {
      enabled: boolean;
      admin_key: string;
    };
  };
  notification_providers: {
    kakao_alimtalk: {
      enabled: boolean;
      sender_key: string;
      api_key: string;
    };
    sms: {
      enabled: boolean;
      provider: string;
      api_key: string;
    };
  };
}

// ================================================================
// TYPE GUARDS (타입 가드)
// ================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/-/g, ''));
};

export const isValidHexColor = (color: string): color is HexColor => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

export const isDateString = (date: string): date is DateString => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date) && !isNaN(Date.parse(date));
};

// ================================================================
// CONSTANTS (상수)
// ================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_DEBOUNCE_DELAY = 300;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const STATUS_COLORS: Record<StudentStatus, StatusColor> = {
  active: 'success',
  waiting: 'warning', 
  inactive: 'info',
  graduated: 'info'
};

export const GRADE_OPTIONS = [
  { value: '초1', label: '초등 1학년' },
  { value: '초2', label: '초등 2학년' },
  { value: '초3', label: '초등 3학년' },
  { value: '초4', label: '초등 4학년' },
  { value: '초5', label: '초등 5학년' },
  { value: '초6', label: '초등 6학년' },
  { value: '중1', label: '중학 1학년' },
  { value: '중2', label: '중학 2학년' },
  { value: '중3', label: '중학 3학년' },
  { value: '고1', label: '고등 1학년' },
  { value: '고2', label: '고등 2학년' },
  { value: '고3', label: '고등 3학년' },
  { value: '재수', label: '재수생' }
] as const;