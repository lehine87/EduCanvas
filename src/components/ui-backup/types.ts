/**
 * Common UI Component Types and Interfaces
 * 
 * This file contains standardized type definitions for UI components
 * to ensure consistency across the EduCanvas application.
 */

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

/**
 * Base component props that all UI components should extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Component children */
  children?: ReactNode;
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * Interactive component props for clickable elements
 */
export interface InteractiveProps {
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Accessibility props for WCAG 2.1 AA compliance
 */
export interface AccessibilityProps {
  /** Accessible name for screen readers */
  'aria-label'?: string;
  /** ID of element that describes this element */
  'aria-describedby'?: string;
  /** Indicates if element is expanded (for collapsible elements) */
  'aria-expanded'?: boolean;
  /** ARIA role override */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Common size variants used across components
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Common color variants for UI components
 */
export type ComponentVariant = 
  | 'default'
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'destructive'
  | 'ghost' 
  | 'outline';

/**
 * Common alignment options
 */
export type ComponentAlignment = 'left' | 'center' | 'right';

/**
 * Status types used in the application
 */
export type StatusType = 'active' | 'inactive' | 'pending' | 'suspended' | 'success' | 'warning' | 'error';

/**
 * Form field state interface
 */
export interface FormFieldState {
  /** Field value */
  value?: string | number | boolean;
  /** Error message */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Helper text */
  helperText?: string;
  /** Success state */
  success?: boolean;
}

/**
 * Extended button props with common variants
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseComponentProps>, BaseComponentProps {
  /** Button visual variant */
  variant?: ComponentVariant;
  /** Button size */
  size?: ComponentSize;
  /** Loading state */
  loading?: boolean;
  /** Icon before text */
  leftIcon?: ReactNode;
  /** Icon after text */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Extended input props with validation
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseComponentProps | 'size'>, BaseComponentProps {
  /** Input label */
  label?: string;
  /** Field state */
  fieldState?: FormFieldState;
  /** Input size */
  size?: ComponentSize;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Wrapper CSS classes */
  wrapperClassName?: string;
}

/**
 * Modal/Dialog props interface
 */
export interface ModalProps extends BaseComponentProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: ComponentSize | 'full';
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether escape key closes modal */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom header */
  header?: ReactNode;
  /** Custom footer */
  footer?: ReactNode;
}

/**
 * Table column definition interface
 */
export interface TableColumn<T = Record<string, unknown>> {
  /** Column identifier */
  key: keyof T | string;
  /** Column header text */
  header: string;
  /** Column width */
  width?: number;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function */
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  /** Cell CSS class function */
  cellClassName?: (value: T[keyof T], row: T) => string;
  /** Header CSS classes */
  headerClassName?: string;
  /** Column alignment */
  align?: ComponentAlignment;
}

/**
 * Table props interface
 */
export interface TableProps<T = Record<string, unknown>> extends BaseComponentProps {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Enable virtualization */
  virtualized?: boolean;
  /** Table height (for virtualization) */
  height?: number;
  /** Row height (for virtualization) */
  rowHeight?: number;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row indices */
  selectedRows?: Set<number>;
  /** Selection change handler */
  onSelectionChange?: (selectedRows: Set<number>) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
}

/**
 * Card component props interface
 */
export interface CardProps extends BaseComponentProps {
  /** Card padding */
  padding?: ComponentSize;
  /** Whether card is hoverable */
  hoverable?: boolean;
  /** Whether card is clickable */
  clickable?: boolean;
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated';
  /** Card header */
  header?: ReactNode;
  /** Card footer */
  footer?: ReactNode;
}

/**
 * Badge/Chip component props
 */
export interface BadgeProps extends BaseComponentProps {
  /** Badge variant */
  variant?: ComponentVariant;
  /** Badge size */
  size?: ComponentSize;
  /** Whether badge is removable */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Badge icon */
  icon?: ReactNode;
}

/**
 * Tooltip props interface
 */
export interface TooltipProps extends BaseComponentProps {
  /** Tooltip content */
  content: ReactNode;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Trigger element */
  trigger: ReactNode;
  /** Show delay in ms */
  showDelay?: number;
  /** Hide delay in ms */
  hideDelay?: number;
}

/**
 * Dropdown/Select props interface
 */
export interface DropdownProps<T = unknown> extends BaseComponentProps {
  /** Available options */
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
  }>;
  /** Selected value */
  value?: T;
  /** Selection change handler */
  onChange: (value: T) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether dropdown is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Multi-select mode */
  multiple?: boolean;
  /** Searchable dropdown */
  searchable?: boolean;
  /** Custom option renderer */
  renderOption?: (option: { value: T; label: string; icon?: ReactNode }) => ReactNode;
}

/**
 * Animation props for components
 */
export interface AnimationProps {
  /** Animation type */
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
  /** Animation duration */
  animationDuration?: number;
  /** Animation delay */
  animationDelay?: number;
}

/**
 * Drag and drop props interface
 */
export interface DragDropProps {
  /** Whether element is draggable */
  draggable?: boolean;
  /** Whether element is a drop target */
  droppable?: boolean;
  /** Drag start handler */
  onDragStart?: (event: DragEvent) => void;
  /** Drag end handler */
  onDragEnd?: (event: DragEvent) => void;
  /** Drop handler */
  onDrop?: (event: DragEvent) => void;
  /** Drag over handler */
  onDragOver?: (event: DragEvent) => void;
}

/**
 * ClassFlow specific types
 */

/**
 * Student data interface for ClassFlow components
 */
export interface StudentData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: StatusType;
  avatar?: string;
  grade?: string;
  enrollmentDate?: string;
  classId?: string;
}

/**
 * Class data interface for ClassFlow components
 */
export interface ClassData {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  currentCount: number;
  color?: string;
  instructor?: string;
  schedule?: string;
  room?: string;
}

/**
 * ClassFlow container props
 */
export interface ClassFlowContainerProps extends BaseComponentProps {
  /** Class information */
  classData: ClassData;
  /** Students in this class */
  students: StudentData[];
  /** Whether this is a valid drop target */
  isDropTarget?: boolean;
  /** Whether something is being dragged over */
  isOver?: boolean;
  /** Container layout variant */
  variant?: 'grid' | 'list' | 'compact';
  /** Student card click handler */
  onStudentClick?: (student: StudentData) => void;
  /** Container click handler */
  onContainerClick?: (classData: ClassData) => void;
}

/**
 * Loading state props
 */
export interface LoadingProps {
  /** Loading state */
  loading: boolean;
  /** Loading text */
  loadingText?: string;
  /** Loading component */
  LoadingComponent?: React.ComponentType;
  /** Skeleton configuration */
  skeleton?: {
    count?: number;
    height?: number;
    animation?: 'pulse' | 'shimmer' | 'wave';
  };
}

/**
 * Error state props
 */
export interface ErrorProps {
  /** Error object */
  error?: Error | string | null;
  /** Error message */
  errorMessage?: string;
  /** Error component */
  ErrorComponent?: React.ComponentType<{ error: Error | string }>;
  /** Retry handler */
  onRetry?: () => void;
}

/**
 * Empty state props
 */
export interface EmptyProps {
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state component */
  EmptyComponent?: React.ComponentType;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Empty state action */
  emptyAction?: ReactNode;
}

/**
 * Pagination props
 */
export interface PaginationProps extends BaseComponentProps {
  /** Current page (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Items per page */
  itemsPerPage?: number;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Available page sizes */
  pageSizes?: number[];
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Filter props interface
 */
export interface FilterProps<T = Record<string, unknown>> extends BaseComponentProps {
  /** Available filters */
  filters: Array<{
    key: keyof T;
    label: string;
    type: 'text' | 'select' | 'date' | 'range';
    options?: Array<{ value: unknown; label: string }>;
  }>;
  /** Current filter values */
  values: Partial<Record<keyof T, unknown>>;
  /** Filter change handler */
  onChange: (values: Partial<Record<keyof T, unknown>>) => void;
  /** Reset handler */
  onReset: () => void;
}

/**
 * Search props interface
 */
export interface SearchProps extends BaseComponentProps {
  /** Search query */
  query: string;
  /** Query change handler */
  onQueryChange: (query: string) => void;
  /** Search handler */
  onSearch: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Search suggestions */
  suggestions?: string[];
  /** Loading state */
  loading?: boolean;
  /** Debounce delay in ms */
  debounceDelay?: number;
}