'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import type { BaseComponentProps, ComponentSize } from './types'

interface LoadingProps extends BaseComponentProps {
  size?: ComponentSize
  overlay?: boolean
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
}

export function Loading({ 
  className,
  size = 'md',
  overlay = false,
  text,
  variant = 'spinner',
  'data-testid': testId,
  ...props
}: LoadingProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const LoadingSpinner = () => (
    <svg 
      className={cn('animate-spin', sizeClasses[size], className)}
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
  )

  const LoadingDots = () => {
    const dotSize = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5', 
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4'
    }

    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-current rounded-full animate-pulse',
              dotSize[size]
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }

  const LoadingPulse = () => (
    <div 
      className={cn(
        'bg-current rounded-full animate-pulse',
        sizeClasses[size],
        className
      )}
    />
  )

  const LoadingBars = () => {
    const barHeight = {
      xs: 'h-2',
      sm: 'h-3',
      md: 'h-4', 
      lg: 'h-6',
      xl: 'h-8'
    }

    return (
      <div className={cn('flex items-end space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-1 bg-current animate-bounce',
              barHeight[size]
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
    )
  }

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots />
      case 'pulse':
        return <LoadingPulse />
      case 'bars':
        return <LoadingBars />
      case 'spinner':
      default:
        return <LoadingSpinner />
    }
  }

  const content = (
    <div 
      className="flex flex-col items-center justify-center space-y-2"
      data-testid={testId}
      {...props}
    >
      {renderLoader()}
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {content}
        </div>
      </div>
    )
  }

  return content
}

// Skeleton Loading Component
interface SkeletonProps extends BaseComponentProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
  lines?: number
}

export function Skeleton({ 
  className,
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1,
  'data-testid': testId,
  ...props 
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' && 'animate-pulse', // Can be enhanced with wave animation
    className
  )

  const variantClasses = {
    text: 'rounded-sm',
    rectangular: '',
    circular: 'rounded-full',
    rounded: 'rounded-md'
  }

  if (lines > 1 && variant === 'text') {
    return (
      <div className="space-y-2" data-testid={testId} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant]
            )}
            style={{
              width: i === lines - 1 ? '80%' : width,
              height: height
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant]
      )}
      style={{ width, height }}
      data-testid={testId}
      {...props}
    />
  )
}

// Card Skeleton - for loading card layouts
export function CardSkeleton({ className, ...props }: BaseComponentProps) {
  return (
    <div className={cn('p-6 border rounded-lg space-y-4', className)} {...props}>
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton height="1rem" width="60%" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height="0.75rem" lines={3} />
      </div>
      <div className="flex space-x-2">
        <Skeleton height="2rem" width="5rem" variant="rounded" />
        <Skeleton height="2rem" width="5rem" variant="rounded" />
      </div>
    </div>
  )
}

// Table Skeleton - for loading table layouts  
interface TableSkeletonProps extends BaseComponentProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ 
  className, 
  rows = 5, 
  columns = 4,
  ...props 
}: TableSkeletonProps) {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)} {...props}>
      {/* Header */}
      <div className="bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="0.875rem" width="60%" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} height="0.875rem" width={j === 0 ? '80%' : '60%'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// List Skeleton - for loading list layouts
interface ListSkeletonProps extends BaseComponentProps {
  items?: number
  showAvatar?: boolean
}

export function ListSkeleton({ 
  className, 
  items = 5,
  showAvatar = true,
  ...props 
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && (
            <Skeleton variant="circular" width={32} height={32} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton height="0.875rem" width="70%" />
            <Skeleton height="0.75rem" width="50%" />
          </div>
        </div>
      ))}
    </div>
  )
}