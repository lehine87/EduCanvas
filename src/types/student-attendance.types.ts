/**
 * 학생 출석 관리 시스템 타입 정의
 * T-V2-014: 출석 관리 시스템 v2 전용
 */

import { Database } from './database.types';

// 데이터베이스 타입에서 추출
type AttendanceRow = Database['public']['Tables']['attendances']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendances']['Insert'];
type AttendanceUpdate = Database['public']['Tables']['attendances']['Update'];

// 출석 상태 타입
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'excused';

// 기본 출석 레코드
export interface StudentAttendanceRecord {
  id: string;
  tenant_id: string;
  student_id: string;
  class_id: string;
  enrollment_id: string | null;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  actual_hours: number | null;
  reason: string | null; // 결석/지각/조퇴 사유
  late_minutes: number | null;
  checked_by: string | null; // 체크한 직원 ID
  created_at: string;
  updated_at: string | null;
}

// 학생 정보가 조인된 출석 레코드
export interface StudentWithAttendance {
  id: string;
  name: string;
  student_number: string;
  grade_level: string | null;
  profile_image: string | null;
  attendance_status: AttendanceStatus | null;
  attendance_reason: string | null;
  attendance_checked_at: string | null;
  attendance_checked_by: string | null;
}

// 클래스 정보가 포함된 출석 데이터
export interface ClassWithAttendance {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  instructor_name: string;
  instructor_id: string;
  room: string;
  total_students: number;
  attendance_status?: {
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    early_leave_count: number;
    excused_count: number;
    attendance_rate: number;
    is_completed: boolean;
  };
}

// 출석 체크 요청
export interface AttendanceCheckRequest {
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  reason?: string;
  check_in_time?: string;
  checked_by?: string;
}

// 벌크 출석 체크 요청
export interface BulkAttendanceUpdate {
  class_id: string;
  attendance_date: string;
  updates: {
    student_id: string;
    status: AttendanceStatus;
    reason?: string;
  }[];
  checked_by?: string;
}

// 출석 통계
export interface AttendanceStats {
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  early_leave_count: number;
  excused_count: number;
  attendance_rate: number;
  is_completed: boolean;
}

// 일일 출석 현황 비교
export interface DailyAttendanceData {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  early_leave: number;
  excused: number;
  attendance_rate: number;
}

export interface DailyAttendanceComparison {
  yesterday: DailyAttendanceData;
  today: DailyAttendanceData;
}

// 클래스 스케줄 정보 (시간 필터링용)
export interface ClassSchedule {
  id: string;
  name: string;
  start_time: string; // "HH:MM" 형태
  end_time: string;
  instructor_name: string;
  instructor_id: string;
  room: string;
  color: string | null;
  // 출석 상태 (옵셔널)
  attendance_status?: AttendanceStats;
}

// 시간 필터링된 클래스 목록
export interface TimeFilteredClasses {
  current: ClassSchedule[]; // ±30분 내 클래스
  all: ClassSchedule[];     // 전체 클래스
  currentTime: string;      // 현재 시간 "HH:MM"
}

// 출석 체크 필터
export interface AttendanceFilters {
  class_id?: string;
  student_id?: string;
  start_date?: string;
  end_date?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

// 출석 체크 API 응답
export interface AttendanceCheckResponse {
  success: boolean;
  data: StudentAttendanceRecord;
  message?: string;
}

export interface AttendanceListResponse {
  success: boolean;
  data: StudentWithAttendance[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AttendanceStatsResponse {
  success: boolean;
  data: AttendanceStats;
}

// 출석 알림 설정
export interface AttendanceNotificationSettings {
  id: string;
  tenant_id: string;
  student_id: string;
  notification_types: string[]; // ['absence', 'late', 'early_leave']
  enabled: boolean;
  created_at: string;
}

// 알림 전송 요청
export interface AttendanceNotificationRequest {
  student_id: string;
  type: 'absence' | 'late' | 'early_leave';
  message: string;
  channels: ('sms' | 'email' | 'push')[];
}

// 리포트 생성 파라미터
export interface AttendanceReportParams {
  start_date: string;
  end_date: string;
  class_ids?: string[];
  student_ids?: string[];
  format: 'daily' | 'weekly' | 'monthly';
}

// 출석 리포트 데이터
export interface AttendanceReportData {
  period: {
    start_date: string;
    end_date: string;
    format: 'daily' | 'weekly' | 'monthly';
  };
  summary: AttendanceStats;
  details: {
    date: string;
    class_name: string;
    student_name: string;
    status: AttendanceStatus;
    reason: string | null;
  }[];
  trends: {
    date: string;
    attendance_rate: number;
    present_count: number;
    absent_count: number;
  }[];
}

// React 컴포넌트 Props 타입들
export interface AttendanceTimeSidebarProps {
  selectedDate: Date;
  selectedClassId: string | null;
  onDateChange: (date: Date) => void;
  onClassSelect: (classId: string) => void;
}

export interface AttendanceMainAreaProps {
  selectedDate: Date;
  selectedClassId: string | null;
  onClassSelect: (classId: string | null) => void;
}

export interface AttendanceCheckDetailProps {
  classId: string;
  date: Date;
}

export interface StudentAttendanceCardProps {
  student: StudentWithAttendance;
  onStatusChange: (status: AttendanceStatus) => void;
}

export interface AttendanceReasonModalProps {
  isOpen: boolean;
  studentName: string;
  status: AttendanceStatus;
  onSubmit: (reason?: string) => void;
  onClose: () => void;
}

export interface AttendanceClassCardProps {
  classData: ClassWithAttendance;
  onClick: () => void;
}

export interface AttendanceComparisonCardProps {
  date: Date;
  title: string;
  data?: DailyAttendanceData;
  variant: 'primary' | 'secondary';
}

// Hook 타입들
export interface UseTimeFilteredClassesResult {
  data: TimeFilteredClasses | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface UseClassAttendanceStatusResult {
  data: AttendanceStats | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface UseAttendanceCheckResult {
  checkAttendance: (request: AttendanceCheckRequest) => Promise<void>;
  bulkUpdateAttendance: (request: BulkAttendanceUpdate) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// 유틸리티 타입들
export type AttendanceStatusColor = 'success' | 'destructive' | 'warning' | 'secondary' | 'outline';

export interface AttendanceStatusInfo {
  text: string;
  color: AttendanceStatusColor;
  icon: string;
}

// 키보드 단축키
export interface AttendanceShortcuts {
  '1': 'present';
  '2': 'absent';
  '3': 'late';
  '4': 'early_leave';
}

// 빠른 선택 사유 템플릿
export interface ReasonTemplates {
  absent: string[];
  late: string[];
  early_leave: string[];
}

// 에러 타입들
export interface AttendanceError {
  code: string;
  message: string;
  field?: string;
}

export interface AttendanceValidationError extends AttendanceError {
  field: string;
  value: any;
}

// 상수들
export const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: '출석' },
  { value: 'absent', label: '결석' },
  { value: 'late', label: '지각' },
  { value: 'early_leave', label: '조퇴' },
  { value: 'excused', label: '공결' },
];

export const TIME_FILTER_THRESHOLD = 30; // ±30분

export const DEFAULT_REASON_TEMPLATES: ReasonTemplates = {
  absent: ['몸이 아파서', '가정사로 인해', '교통사고/지연', '기타 개인사정'],
  late: ['교통 지연', '늦잠', '가정사로 인해', '기타 사정'],
  early_leave: ['몸이 아파서', '가정사로 인해', '다른 일정 때문에', '기타 사정'],
};

export const ATTENDANCE_SHORTCUTS: AttendanceShortcuts = {
  '1': 'present',
  '2': 'absent',
  '3': 'late',
  '4': 'early_leave',
};