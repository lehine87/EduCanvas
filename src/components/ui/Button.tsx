'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import type { 
  BaseComponentProps, 
  InteractiveProps, 
  AccessibilityProps, 
  ComponentVariant, 
  ComponentSize 
} from './types'

export interface ButtonProps extends 
  BaseComponentProps, 
  InteractiveProps,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseComponentProps | keyof InteractiveProps | 'aria-expanded'> {
  variant?: ComponentVariant
  size?: ComponentSize
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  permission?: { resource: string; action: string }
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  role?: string
  tabIndex?: number
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  permission,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  role,
  tabIndex,
  ...props
}, ref) => {
  // 권한 체크 (추후 권한 컨텍스트와 연동)
  if (permission) {
    // TODO: usePermissions 훅과 연동
    // const { hasPermission } = usePermissions()
    // if (!hasPermission(permission.resource, permission.action)) {
    //   return null
    // }
  }

  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'
  )
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus-visible:ring-gray-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus-visible:ring-green-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus-visible:ring-yellow-500',
    error: 'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-500'
  }
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-md',
    xl: 'px-8 py-4 text-lg rounded-lg'
  }

  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      role={role}
      tabIndex={tabIndex}
      data-testid={testId}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {leftIcon && !loading && (
        <span className="mr-2" aria-hidden="true">{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span className="ml-2" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button';