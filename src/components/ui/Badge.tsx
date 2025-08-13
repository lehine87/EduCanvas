'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import type { 
  BaseComponentProps, 
  ComponentVariant, 
  ComponentSize 
} from './types'

export interface BadgeProps extends BaseComponentProps {
  variant?: ComponentVariant | 'success' | 'warning' | 'error' | 'info'
  size?: ComponentSize
  removable?: boolean
  onRemove?: () => void
  icon?: React.ReactNode
  dot?: boolean
  style?: React.CSSProperties
}

export function Badge({ 
  className, 
  children,
  variant = 'secondary',
  size = 'sm',
  removable = false,
  onRemove,
  icon,
  dot = false,
  style,
  'data-testid': testId,
  ...props
}: BadgeProps) {
  const baseClasses = cn(
    'inline-flex items-center font-medium rounded-full',
    'transition-colors duration-200'
  )
  
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    ghost: 'bg-transparent text-gray-600 border border-gray-300',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-200'
  }
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
    xl: 'px-4 py-2 text-base'
  }

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3'
  }

  const dotColors = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    ghost: 'bg-gray-400',
    outline: 'bg-gray-600',
    info: 'bg-blue-600'
  }

  return (
    <span 
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        removable && 'pr-1',
        className
      )}
      style={style}
      data-testid={testId}
      {...props}
    >
      {dot && (
        <span 
          className={cn(
            'rounded-full mr-1.5',
            dotSizes[size],
            dotColors[variant]
          )}
          aria-hidden="true"
        />
      )}
      
      {icon && (
        <span className={cn('mr-1', size === 'xs' ? 'w-3 h-3' : 'w-4 h-4')} aria-hidden="true">
          {icon}
        </span>
      )}
      
      {children}
      
      {removable && (
        <button
          type="button"
          className={cn(
            'ml-1 -mr-1 flex-shrink-0 rounded-full p-0.5',
            'hover:bg-black hover:bg-opacity-10',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-opacity-75',
            'transition-colors duration-150'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          aria-label="제거"
        >
          <svg 
            className={cn('w-3 h-3', size === 'xs' && 'w-2.5 h-2.5')} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

// Status Badge - specialized badge for status indication
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'success' | 'warning' | 'error'
}

export function StatusBadge({ 
  status, 
  children,
  ...props 
}: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as const, text: children || '활성', dot: true },
    inactive: { variant: 'secondary' as const, text: children || '비활성', dot: true },
    pending: { variant: 'warning' as const, text: children || '대기중', dot: true },
    suspended: { variant: 'error' as const, text: children || '정지', dot: true },
    success: { variant: 'success' as const, text: children || '성공', dot: true },
    warning: { variant: 'warning' as const, text: children || '경고', dot: true },
    error: { variant: 'error' as const, text: children || '오류', dot: true }
  }

  const config = statusConfig[status]

  return (
    <Badge 
      variant={config.variant}
      dot={config.dot}
      {...props}
    >
      {config.text}
    </Badge>
  )
}

// Count Badge - for displaying counts (notifications, etc.)
export interface CountBadgeProps extends Omit<BadgeProps, 'children' | 'size'> {
  count: number
  max?: number
  showZero?: boolean
}

export function CountBadge({ 
  count, 
  max = 99,
  showZero = false,
  variant = 'error',
  className,
  ...props 
}: CountBadgeProps) {
  if (count === 0 && !showZero) {
    return null
  }

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge 
      variant={variant}
      size="xs"
      className={cn(
        'min-w-[1.25rem] h-5 px-1',
        'text-center justify-center',
        'font-semibold',
        className
      )}
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

// Tag Badge - for tagging/labeling
export interface TagBadgeProps extends BadgeProps {
  color?: string
}

export function TagBadge({ 
  color,
  variant = 'secondary',
  className,
  style,
  ...props 
}: TagBadgeProps) {
  const customStyle = color ? {
    backgroundColor: `${color}15`, // 15% opacity
    borderColor: `${color}30`, // 30% opacity  
    color: color,
    ...style
  } : style

  return (
    <Badge 
      variant={variant}
      className={cn(
        !color && 'hover:bg-opacity-80',
        className
      )}
      style={customStyle}
      {...props}
    />
  )
}