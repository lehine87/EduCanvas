// EduCanvas UI 컴포넌트 타입 시스템 (완전 체계화)
// UI 컴포넌트, 폼, 테마, 레이아웃 관련 타입 정의
// @version v4.1
// @since 2025-08-12

import type { ReactNode, ComponentProps, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

// ================================================================
// 1. 기본 UI 컴포넌트 타입들
// ================================================================

/**
 * 공통 컴포넌트 Props 기본 타입
 */
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  id?: string
  testId?: string
}

/**
 * 크기 변형 타입
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * 색상 변형 타입
 */
export type ComponentVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'neutral'
  | 'outline'
  | 'ghost'
  | 'link'

/**
 * 로딩 상태 타입
 */
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  loadingSpinner?: ReactNode
}

/**
 * 에러 상태 타입
 */
export interface ErrorState {
  hasError: boolean
  errorMessage?: string
  errorDetails?: string
  canRetry?: boolean
  onRetry?: () => void
}

// ================================================================
// 2. 버튼 컴포넌트 타입들
// ================================================================

/**
 * 버튼 Props 타입
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>, BaseComponentProps, LoadingState {
  variant?: ComponentVariant
  size?: ComponentSize
  fullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  href?: string // 링크로 사용할 때
  external?: boolean // 외부 링크 여부
}

/**
 * 아이콘 버튼 Props 타입
 */
export interface IconButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon' | 'children'> {
  icon: ReactNode
  label: string // 접근성용 aria-label
  tooltip?: string
}

/**
 * 버튼 그룹 Props 타입
 */
export interface ButtonGroupProps extends BaseComponentProps {
  size?: ComponentSize
  variant?: ComponentVariant
  fullWidth?: boolean
  orientation?: 'horizontal' | 'vertical'
  spacing?: ComponentSize
}

// ================================================================
// 3. 입력 컴포넌트 타입들
// ================================================================

/**
 * 기본 입력 필드 Props 타입
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseComponentProps, ErrorState {
  label?: string
  helperText?: string
  required?: boolean
  size?: ComponentSize
  variant?: 'outlined' | 'filled' | 'standard'
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  fullWidth?: boolean
}

/**
 * 텍스트 영역 Props 타입
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseComponentProps, ErrorState {
  label?: string
  helperText?: string
  required?: boolean
  size?: ComponentSize
  variant?: 'outlined' | 'filled' | 'standard'
  autoResize?: boolean
  minRows?: number
  maxRows?: number
}

/**
 * 선택 필드 옵션 타입
 */
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
  icon?: ReactNode
}

/**
 * 선택 필드 Props 타입
 */
export interface SelectProps<T = string> extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  options: SelectOption<T>[]
  value?: T
  onChange?: (value: T) => void
  placeholder?: string
  searchable?: boolean
  multiple?: boolean
  loading?: boolean
  onSearch?: (query: string) => void
}

/**
 * 체크박스 Props 타입
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, BaseComponentProps {
  label?: string
  size?: ComponentSize
  indeterminate?: boolean
}

/**
 * 라디오 버튼 Props 타입
 */
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, BaseComponentProps {
  label?: string
  size?: ComponentSize
}

/**
 * 라디오 그룹 Props 타입
 */
export interface RadioGroupProps extends BaseComponentProps {
  name: string
  value?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  size?: ComponentSize
}

/**
 * 스위치 Props 타입
 */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, BaseComponentProps {
  label?: string
  size?: ComponentSize
  labelPosition?: 'start' | 'end'
}

// ================================================================
// 4. 데이터 디스플레이 컴포넌트 타입들
// ================================================================

/**
 * 테이블 컬럼 정의 타입
 */
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string
  header: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, row: T, index: number) => ReactNode
  headerRender?: () => ReactNode
  align?: 'left' | 'center' | 'right'
  sticky?: 'left' | 'right'
}

/**
 * 테이블 Props 타입
 */
export interface TableProps<T = Record<string, unknown>> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  empty?: ReactNode
  sortable?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (column: string, order: 'asc' | 'desc') => void
  selectable?: boolean
  selectedRows?: (keyof T)[]
  onRowSelect?: (selectedRows: (keyof T)[]) => void
  rowKey?: keyof T | ((row: T) => string)
  onRowClick?: (row: T, index: number) => void
  pagination?: {
    page: number
    limit: number
    total: number
    onChange: (page: number, limit: number) => void
  }
  stickyHeader?: boolean
  maxHeight?: string | number
}

/**
 * 카드 Props 타입
 */
export interface CardProps extends BaseComponentProps {
  variant?: 'outlined' | 'elevated' | 'filled'
  padding?: ComponentSize | 'none'
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
}

/**
 * 카드 헤더 Props 타입
 */
export interface CardHeaderProps extends BaseComponentProps {
  title?: ReactNode
  subtitle?: ReactNode
  avatar?: ReactNode
  action?: ReactNode
}

/**
 * 카드 콘텐츠 Props 타입
 */
export interface CardContentProps extends BaseComponentProps {
  component?: React.ElementType
}

/**
 * 카드 액션 Props 타입
 */
export interface CardActionsProps extends BaseComponentProps {
  align?: 'left' | 'center' | 'right' | 'space-between'
}

// ================================================================
// 5. 피드백 컴포넌트 타입들
// ================================================================

/**
 * 알림 메시지 타입
 */
export type AlertSeverity = 'info' | 'success' | 'warning' | 'error'

/**
 * 알림 Props 타입
 */
export interface AlertProps extends BaseComponentProps {
  severity: AlertSeverity
  title?: string
  message: string
  closable?: boolean
  onClose?: () => void
  action?: ReactNode
}

/**
 * 토스트 메시지 타입
 */
export interface ToastMessage {
  id: string
  type: AlertSeverity
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * 로딩 스피너 Props 타입
 */
export interface SpinnerProps extends BaseComponentProps {
  size?: ComponentSize | number
  color?: string
  thickness?: number
}

/**
 * 스켈레톤 Props 타입
 */
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  lines?: number
  animated?: boolean
}

/**
 * 진행 바 Props 타입
 */
export interface ProgressProps extends BaseComponentProps {
  value: number
  max?: number
  size?: ComponentSize
  variant?: 'linear' | 'circular'
  color?: ComponentVariant
  showLabel?: boolean
  label?: string
}

// ================================================================
// 6. 네비게이션 컴포넌트 타입들
// ================================================================

/**
 * 탭 아이템 타입
 */
export interface TabItem {
  key: string
  label: string
  content?: ReactNode
  disabled?: boolean
  icon?: ReactNode
  badge?: string | number
}

/**
 * 탭 Props 타입
 */
export interface TabsProps extends BaseComponentProps {
  items: TabItem[]
  activeTab?: string
  onChange?: (tabKey: string) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'standard' | 'outlined' | 'pills'
  size?: ComponentSize
  fullWidth?: boolean
}

/**
 * 브레드크럼 아이템 타입
 */
export interface BreadcrumbItem {
  key: string
  label: string
  href?: string
  icon?: ReactNode
  active?: boolean
}

/**
 * 브레드크럼 Props 타입
 */
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  maxItems?: number
}

/**
 * 페이지네이션 Props 타입
 */
export interface PaginationProps extends BaseComponentProps {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
  size?: ComponentSize
  variant?: 'outlined' | 'filled'
  showFirstLast?: boolean
  showPrevNext?: boolean
  showPageInfo?: boolean
  siblingCount?: number
}

// ================================================================
// 7. 오버레이 컴포넌트 타입들
// ================================================================

/**
 * 모달 Props 타입
 */
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose?: (event?: Event, reason?: 'backdropClick' | 'escapeKeyDown') => void
  size?: ComponentSize | 'fullscreen'
  centered?: boolean
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  zIndex?: number
}

/**
 * 다이얼로그 Props 타입
 */
export interface DialogProps extends ModalProps {
  title?: ReactNode
  content?: ReactNode
  actions?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  danger?: boolean
}

/**
 * 드로어 Props 타입
 */
export interface DrawerProps extends BaseComponentProps {
  open: boolean
  onClose?: () => void
  placement?: 'left' | 'right' | 'top' | 'bottom'
  size?: ComponentSize | number | string
  title?: ReactNode
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
}

/**
 * 팝오버 Props 타입
 */
export interface PopoverProps extends BaseComponentProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  arrow?: boolean
  offset?: number
  delay?: number
  content: ReactNode
}

/**
 * 툴팁 Props 타입
 */
export interface TooltipProps extends BaseComponentProps {
  title: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  arrow?: boolean
  delay?: number
  disabled?: boolean
}

// ================================================================
// 8. 레이아웃 컴포넌트 타입들
// ================================================================

/**
 * 컨테이너 Props 타입
 */
export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | number
  centered?: boolean
  padding?: ComponentSize | 'none'
}

/**
 * 그리드 시스템 Props 타입
 */
export interface GridProps extends BaseComponentProps {
  container?: boolean
  item?: boolean
  spacing?: ComponentSize | number
  columns?: number
  xs?: number | 'auto'
  sm?: number | 'auto'
  md?: number | 'auto'
  lg?: number | 'auto'
  xl?: number | 'auto'
}

/**
 * 스택 Props 타입
 */
export interface StackProps extends BaseComponentProps {
  direction?: 'row' | 'column'
  spacing?: ComponentSize | number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
  wrap?: boolean
  divider?: ReactNode
}

/**
 * 디바이더 Props 타입
 */
export interface DividerProps extends BaseComponentProps {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'solid' | 'dashed' | 'dotted'
  textAlign?: 'left' | 'center' | 'right'
}

// ================================================================
// 9. 폼 관련 타입들
// ================================================================

/**
 * 폼 필드 타입
 */
export type FormFieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'file'

/**
 * 폼 필드 정의 타입
 */
export interface FormField {
  name: string
  type: FormFieldType
  label: string
  placeholder?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  options?: SelectOption[] // select, radio 용
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: unknown) => boolean | string
  }
  conditional?: {
    dependsOn: string
    condition: (value: unknown) => boolean
  }
  defaultValue?: unknown
}

/**
 * 폼 Props 타입
 */
export interface FormProps extends BaseComponentProps {
  fields: FormField[]
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  submitText?: string
  resetText?: string
  showReset?: boolean
  initialValues?: Record<string, unknown>
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit'
}

/**
 * 폼 섹션 Props 타입
 */
export interface FormSectionProps extends BaseComponentProps {
  title?: string
  description?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ================================================================
// 10. 특수 컴포넌트 타입들
// ================================================================

/**
 * 파일 업로드 Props 타입
 */
export interface FileUploadProps extends BaseComponentProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // bytes
  maxFiles?: number
  onUpload: (files: File[]) => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  preview?: boolean
  dragAndDrop?: boolean
  uploadText?: string
  dragText?: string
}

/**
 * 이미지 Props 타입
 */
export interface ImageProps extends BaseComponentProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  loading?: 'lazy' | 'eager'
  placeholder?: ReactNode
  fallback?: ReactNode
  onLoad?: () => void
  onError?: () => void
}

/**
 * 아바타 Props 타입
 */
export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt?: string
  name?: string // 이니셜 생성용
  size?: ComponentSize | number
  shape?: 'circle' | 'square'
  variant?: 'filled' | 'outlined'
  color?: string
  badge?: {
    content?: ReactNode
    color?: ComponentVariant
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  }
}

/**
 * 배지 Props 타입
 */
export interface BadgeProps extends BaseComponentProps {
  content?: ReactNode
  variant?: ComponentVariant
  size?: ComponentSize
  shape?: 'circle' | 'rounded'
  dot?: boolean
  max?: number // 숫자 표시 최댓값
  showZero?: boolean
}

// ================================================================
// 11. 애니메이션 및 트랜지션 타입들
// ================================================================

/**
 * 트랜지션 Props 타입
 */
export interface TransitionProps {
  in?: boolean
  timeout?: number | { enter?: number; exit?: number }
  appear?: boolean
  enter?: boolean
  exit?: boolean
  onEnter?: () => void
  onEntering?: () => void
  onEntered?: () => void
  onExit?: () => void
  onExiting?: () => void
  onExited?: () => void
}

/**
 * 페이드 트랜지션 Props 타입
 */
export interface FadeProps extends TransitionProps, BaseComponentProps {}

/**
 * 슬라이드 트랜지션 Props 타입
 */
export interface SlideProps extends TransitionProps, BaseComponentProps {
  direction?: 'up' | 'down' | 'left' | 'right'
}

/**
 * 콜랩스 트랜지션 Props 타입
 */
export interface CollapseProps extends TransitionProps, BaseComponentProps {
  collapsedSize?: number | string
}

// ================================================================
// 12. 테마 및 스타일 타입들
// ================================================================

/**
 * 색상 팔레트 타입
 */
export interface ColorPalette {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

/**
 * 테마 색상 타입
 */
export interface ThemeColors {
  primary: ColorPalette
  secondary: ColorPalette
  success: ColorPalette
  warning: ColorPalette
  error: ColorPalette
  info: ColorPalette
  neutral: ColorPalette
  background: {
    default: string
    paper: string
    elevated: string
  }
  text: {
    primary: string
    secondary: string
    disabled: string
    inverse: string
  }
  border: {
    default: string
    light: string
    dark: string
  }
}

/**
 * 타이포그래피 타입
 */
export interface Typography {
  fontFamily: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
  }
  fontWeight: {
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
    extrabold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
}

/**
 * 스페이싱 타입
 */
export interface Spacing {
  0: string
  1: string
  2: string
  3: string
  4: string
  5: string
  6: string
  8: string
  10: string
  12: string
  16: string
  20: string
  24: string
  32: string
  40: string
  48: string
  56: string
  64: string
}

/**
 * 브레이크포인트 타입
 */
export interface Breakpoints {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

/**
 * 그림자 타입
 */
export interface Shadows {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

/**
 * 테마 타입
 */
export interface Theme {
  colors: ThemeColors
  typography: Typography
  spacing: Spacing
  breakpoints: Breakpoints
  shadows: Shadows
  radii: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
  zIndex: {
    dropdown: number
    sticky: number
    fixed: number
    modal: number
    popover: number
    tooltip: number
  }
}

// ================================================================
// 13. 이벤트 핸들러 타입들
// ================================================================

/**
 * 클릭 이벤트 핸들러 타입
 */
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void

/**
 * 변경 이벤트 핸들러 타입
 */
export type ChangeHandler<T = string> = (value: T, event?: React.ChangeEvent) => void

/**
 * 포커스 이벤트 핸들러 타입
 */
export type FocusHandler = (event: React.FocusEvent<HTMLElement>) => void

/**
 * 키보드 이벤트 핸들러 타입
 */
export type KeyboardHandler = (event: React.KeyboardEvent<HTMLElement>) => void

// ================================================================
// 14. 유틸리티 타입들
// ================================================================

/**
 * 조건부 Props 타입
 */
export type ConditionalProps<T, K extends keyof T> = T[K] extends true
  ? Required<Pick<T, K>>
  : Partial<Pick<T, K>>

/**
 * 폴리모픽 Props 타입 (as prop 지원)
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T
} & ComponentProps<T>

/**
 * Ref 포워딩을 위한 타입
 */
export type ForwardRefComponent<T, P = Record<string, unknown>> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<T>
>

/**
 * 컴포넌트 디스플레이 이름을 위한 타입
 */
export type ComponentDisplayName = string

/**
 * 반응형 Props 타입
 */
export type ResponsiveValue<T> = T | {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}

/**
 * CSS 속성 타입 (스타일링용)
 */
export type CSSProperties = React.CSSProperties