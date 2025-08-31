/**
 * Component Props Type Definitions
 * 
 * EduCanvas v2에서 사용되는 컴포넌트의 공통 Props 타입 정의
 */

import { type VariantProps } from 'class-variance-authority';
import type { Database } from './database.types';

// =============================================================================
// Base Types
// =============================================================================

/** 기본 컴포넌트 Props */
export interface BaseComponentProps extends React.HTMLAttributes<HTMLElement> {
  /** 추가 CSS 클래스명 */
  className?: string;
  /** 자식 요소 */
  children?: React.ReactNode;
}

/** 포워드 레퍼런스가 필요한 컴포넌트 Props */
export interface ForwardRefComponentProps<T = HTMLElement> 
  extends Omit<React.HTMLAttributes<T>, 'ref'> {
  className?: string;
  children?: React.ReactNode;
}

// =============================================================================
// Database Entity Types
// =============================================================================

/** 데이터베이스 테이블 타입 단축형 */
export type Student = Database['public']['Tables']['students']['Row'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type TenantMembership = Database['public']['Tables']['tenant_memberships']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];

/** Insert 타입 (생성 시 사용) */
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type ClassInsert = Database['public']['Tables']['classes']['Insert'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];

/** Update 타입 (수정 시 사용) */
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type ClassUpdate = Database['public']['Tables']['classes']['Update'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

// =============================================================================
// Component Variant Types
// =============================================================================

/** 컴포넌트 크기 변형 */
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

/** 컴포넌트 색상 변형 */
export type ComponentVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'link';

/** 상태 표시 변형 */
export type StatusVariant = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'success' 
  | 'error' 
  | 'warning';

// =============================================================================
// Form Component Props
// =============================================================================

/** 폼 필드 기본 Props */
export interface FormFieldProps {
  /** 필드 라벨 */
  label?: string;
  /** 도움말 텍스트 */
  description?: string;
  /** 필수 필드 여부 */
  required?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 비활성화 상태 */
  disabled?: boolean;
}

/** 입력 컴포넌트 Props */
export interface InputProps 
  extends React.InputHTMLAttributes<HTMLInputElement>, 
    FormFieldProps {
  /** 입력 크기 */
  size?: ComponentSize;
  /** 입력 변형 */
  variant?: 'default' | 'filled' | 'outline';
}

/** 선택 컴포넌트 Props */
export interface SelectProps extends FormFieldProps {
  /** 선택 옵션들 */
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  /** 선택된 값 */
  value?: string;
  /** 값 변경 핸들러 */
  onValueChange?: (value: string) => void;
  /** 플레이스홀더 */
  placeholder?: string;
}

// =============================================================================
// Card Component Props
// =============================================================================

/** 카드 컴포넌트 Props */
export interface CardProps extends BaseComponentProps {
  /** 카드 변형 */
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  /** 호버 효과 */
  hoverable?: boolean;
  /** 클릭 가능 여부 */
  clickable?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

/** 학생 카드 Props */
export interface StudentCardProps extends CardProps {
  /** 학생 데이터 */
  student: Student;
  /** 카드 크기 */
  size?: 'compact' | 'default' | 'expanded';
  /** 수정 핸들러 */
  onEdit?: (student: Student) => void;
  /** 삭제 핸들러 */
  onDelete?: (student: Student) => void;
  /** 상세보기 핸들러 */
  onViewDetails?: (student: Student) => void;
}

/** 클래스 카드 Props */
export interface ClassCardProps extends CardProps {
  /** 클래스 데이터 */
  class: Class;
  /** 카드 크기 */
  size?: 'compact' | 'default' | 'expanded';
  /** 수정 핸들러 */
  onEdit?: (classData: Class) => void;
  /** 삭제 핸들러 */
  onDelete?: (classData: Class) => void;
}

// =============================================================================
// Table Component Props
// =============================================================================

/** 테이블 열 정의 */
export interface TableColumn<T> {
  /** 열 키 */
  key: keyof T;
  /** 열 제목 */
  title: string;
  /** 열 너비 */
  width?: number | string;
  /** 정렬 가능 여부 */
  sortable?: boolean;
  /** 렌더링 함수 */
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

/** 테이블 Props */
export interface TableProps<T> extends BaseComponentProps {
  /** 테이블 데이터 */
  data: T[];
  /** 테이블 열 정의 */
  columns: TableColumn<T>[];
  /** 로딩 상태 */
  loading?: boolean;
  /** 빈 상태 메시지 */
  emptyText?: string;
  /** 행 클릭 핸들러 */
  onRowClick?: (record: T, index: number) => void;
  /** 페이지네이션 설정 */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

// =============================================================================
// Modal Component Props
// =============================================================================

/** 모달 크기 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** 모달 Props */
export interface ModalProps extends BaseComponentProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 모달 제목 */
  title?: string;
  /** 모달 크기 */
  size?: ModalSize;
  /** 외부 클릭으로 닫기 비활성화 */
  disableOutsideClick?: boolean;
  /** ESC 키로 닫기 비활성화 */
  disableEscapeKey?: boolean;
  /** 푸터 영역 */
  footer?: React.ReactNode;
}

// =============================================================================
// Search Component Props
// =============================================================================

/** 검색 옵션 */
export interface SearchOption {
  /** 옵션 값 */
  value: string;
  /** 옵션 라벨 */
  label: string;
  /** 옵션 설명 */
  description?: string;
  /** 카테고리 */
  category?: string;
}

/** 검색 컴포넌트 Props */
export interface SearchProps extends BaseComponentProps {
  /** 검색어 */
  value?: string;
  /** 검색어 변경 핸들러 */
  onChange?: (value: string) => void;
  /** 검색 실행 핸들러 */
  onSearch?: (query: string) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 로딩 상태 */
  loading?: boolean;
  /** 검색 제안 */
  suggestions?: SearchOption[];
  /** 최근 검색어 */
  recentSearches?: string[];
  /** 자동 완성 비활성화 */
  disableAutocomplete?: boolean;
}

// =============================================================================
// Navigation Component Props
// =============================================================================

/** 네비게이션 아이템 */
export interface NavigationItem {
  /** 아이템 키 */
  key: string;
  /** 아이템 라벨 */
  label: string;
  /** 아이템 아이콘 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 링크 URL */
  href?: string;
  /** 활성 상태 */
  active?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 뱃지 */
  badge?: string | number;
  /** 하위 아이템들 */
  children?: NavigationItem[];
}

/** 네비게이션 Props */
export interface NavigationProps extends BaseComponentProps {
  /** 네비게이션 아이템들 */
  items: NavigationItem[];
  /** 수직/수평 레이아웃 */
  orientation?: 'horizontal' | 'vertical';
  /** 현재 활성 아이템 */
  activeKey?: string;
  /** 아이템 클릭 핸들러 */
  onItemClick?: (item: NavigationItem) => void;
}

// =============================================================================
// Loading Component Props
// =============================================================================

/** 로딩 컴포넌트 Props */
export interface LoadingProps extends BaseComponentProps {
  /** 로딩 크기 */
  size?: ComponentSize;
  /** 로딩 텍스트 */
  text?: string;
  /** 중앙 정렬 */
  centered?: boolean;
  /** 전체 화면 오버레이 */
  overlay?: boolean;
}

// =============================================================================
// Error Component Props
// =============================================================================

/** 에러 컴포넌트 Props */
export interface ErrorProps extends BaseComponentProps {
  /** 에러 메시지 */
  message?: string;
  /** 에러 제목 */
  title?: string;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 에러 타입 */
  type?: 'network' | 'permission' | 'not-found' | 'server' | 'client';
}

// =============================================================================
// Utility Types
// =============================================================================

/** 옵셔널 Props 타입 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 필수 Props 타입 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** 이벤트 핸들러 타입 */
export type EventHandler<T = void> = (data: T) => void;

/** 비동기 이벤트 핸들러 타입 */
export type AsyncEventHandler<T = void> = (data: T) => Promise<void>;