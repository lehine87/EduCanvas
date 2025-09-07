/**
 * Component Variants Type Definitions
 * 
 * CVA(Class Variance Authority)를 사용한 컴포넌트 변형 타입 정의
 */

import { cva, type VariantProps } from 'class-variance-authority';

// =============================================================================
// Button Variants
// =============================================================================

/** 버튼 변형 정의 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-educanvas-500 text-educanvas-contrast hover:bg-educanvas-600",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-neutral-300 bg-transparent hover:bg-neutral-50",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900",
        link: "text-educanvas-500 underline-offset-4 hover:underline",
        success: "bg-green-500 text-white hover:bg-green-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

// =============================================================================
// Badge Variants
// =============================================================================

/** 배지 변형 정의 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-educanvas-100 text-educanvas-800",
        secondary: "border-transparent bg-neutral-100 text-neutral-900",
        destructive: "border-transparent bg-red-100 text-red-800",
        outline: "text-neutral-950",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-yellow-100 text-yellow-800",
        wisdom: "border-transparent bg-wisdom-100 text-wisdom-800",
        growth: "border-transparent bg-growth-100 text-growth-800",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

// =============================================================================
// Card Variants
// =============================================================================

/** 카드 변형 정의 */
export const cardVariants = cva(
  "rounded-lg border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white border-neutral-200",
        elevated: "bg-white border-neutral-200 shadow-sm",
        outlined: "bg-transparent border-2 border-neutral-300",
        filled: "bg-neutral-50 border-neutral-200",
        glass: "backdrop-blur-sm bg-white/30 border border-white/20 shadow-xl",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      hoverable: {
        true: "hover:shadow-md transition-shadow",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hoverable: false,
    },
  }
);

export type CardVariantProps = VariantProps<typeof cardVariants>;

// =============================================================================
// Input Variants
// =============================================================================

/** 입력 필드 변형 정의 */
export const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-neutral-300",
        filled: "bg-neutral-50 border-transparent",
        outline: "border-2 border-educanvas-200 focus-visible:border-educanvas-400",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-3",
        lg: "h-11 px-4 text-base",
      },
      state: {
        default: "",
        error: "border-red-300 focus-visible:ring-red-500",
        success: "border-green-300 focus-visible:ring-green-500",
        warning: "border-yellow-300 focus-visible:ring-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

export type InputVariantProps = VariantProps<typeof inputVariants>;

// =============================================================================
// Alert Variants
// =============================================================================

/** 알림 변형 정의 */
export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
        success: "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600",
        info: "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type AlertVariantProps = VariantProps<typeof alertVariants>;

// =============================================================================
// Loading Variants
// =============================================================================

/** 로딩 변형 정의 */
export const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
      },
      variant: {
        spinner: "animate-spin",
        dots: "animate-pulse",
        bars: "animate-bounce",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "spinner",
    },
  }
);

export type LoadingVariantProps = VariantProps<typeof loadingVariants>;

// =============================================================================
// Status Variants
// =============================================================================

/** 상태 표시 변형 정의 */
export const statusVariants = cva(
  "inline-flex items-center gap-2 text-sm font-medium",
  {
    variants: {
      status: {
        active: "text-green-700",
        inactive: "text-neutral-500",
        pending: "text-yellow-700",
        success: "text-green-700",
        error: "text-red-700",
        warning: "text-yellow-700",
      },
      showDot: {
        true: "before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-current",
        false: "",
      },
    },
    defaultVariants: {
      status: "active",
      showDot: true,
    },
  }
);

export type StatusVariantProps = VariantProps<typeof statusVariants>;

// =============================================================================
// Table Variants
// =============================================================================

/** 테이블 변형 정의 */
export const tableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      variant: {
        default: "",
        striped: "[&>tbody>tr:nth-child(odd)]:bg-neutral-50",
        bordered: "border border-neutral-200",
      },
      size: {
        sm: "[&>thead>tr>th]:px-2 [&>thead>tr>th]:py-2 [&>tbody>tr>td]:px-2 [&>tbody>tr>td]:py-2",
        default: "[&>thead>tr>th]:px-4 [&>thead>tr>th]:py-3 [&>tbody>tr>td]:px-4 [&>tbody>tr>td]:py-3",
        lg: "[&>thead>tr>th]:px-6 [&>thead>tr>th]:py-4 [&>tbody>tr>td]:px-6 [&>tbody>tr>td]:py-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type TableVariantProps = VariantProps<typeof tableVariants>;

// =============================================================================
// Navigation Variants
// =============================================================================

/** 네비게이션 변형 정의 */
export const navigationVariants = cva(
  "flex",
  {
    variants: {
      orientation: {
        horizontal: "flex-row space-x-2",
        vertical: "flex-col space-y-1",
      },
      variant: {
        default: "p-1 bg-neutral-100 rounded-lg",
        pills: "space-x-2",
        underline: "border-b border-neutral-200",
        sidebar: "space-y-1",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      variant: "default",
    },
  }
);

export type NavigationVariantProps = VariantProps<typeof navigationVariants>;

// =============================================================================
// Modal Variants
// =============================================================================

/** 모달 변형 정의 */
export const modalVariants = cva(
  "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  {
    variants: {
      size: {
        sm: "w-full max-w-sm",
        default: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
        "2xl": "w-full max-w-2xl",
        "3xl": "w-full max-w-3xl",
        full: "w-full h-full max-w-none",
      },
      variant: {
        default: "rounded-lg",
        sheet: "rounded-none",
        drawer: "rounded-t-lg bottom-0 top-auto translate-y-0",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export type ModalVariantProps = VariantProps<typeof modalVariants>;

// =============================================================================
// Utility Functions
// =============================================================================

/** 모든 변형 Props를 합친 타입 */
export type AllVariantProps = 
  & ButtonVariantProps
  & BadgeVariantProps
  & CardVariantProps
  & InputVariantProps
  & AlertVariantProps
  & LoadingVariantProps
  & StatusVariantProps
  & TableVariantProps
  & NavigationVariantProps
  & ModalVariantProps;

/** 변형별 기본값 (cva의 defaultVariants는 직접 접근 불가하므로 별도 정의) */
export const variantDefaults = {
  button: { variant: "default" as const, size: "default" as const },
  badge: { variant: "default" as const, size: "default" as const },
  card: { variant: "default" as const, padding: "md" as const, hoverable: false as const },
  input: { variant: "default" as const, size: "default" as const, state: "default" as const },
  alert: { variant: "default" as const },
  loading: { size: "default" as const, variant: "spinner" as const },
  status: { status: "active" as const, showDot: true as const },
  table: { variant: "default" as const, size: "default" as const },
  navigation: { orientation: "horizontal" as const, variant: "default" as const },
  modal: { size: "default" as const, variant: "default" as const },
} as const;