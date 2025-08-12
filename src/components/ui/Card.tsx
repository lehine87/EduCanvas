'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import type { BaseComponentProps } from './types'

interface CardProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  hover?: boolean
  variant?: 'default' | 'outlined' | 'elevated'
}

export function Card({ 
  className, 
  children, 
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
  variant = 'default',
  'data-testid': testId,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg'
  }

  const variantClasses = {
    default: 'bg-white',
    outlined: 'bg-white border-2',
    elevated: 'bg-white shadow-md'
  }

  return (
    <div 
      className={cn(
        'rounded-lg',
        variantClasses[variant],
        paddingClasses[padding],
        shadow !== 'none' && shadowClasses[shadow],
        border && variant !== 'outlined' && 'border border-gray-200',
        hover && 'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        className
      )}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ 
  className, 
  children, 
  'data-testid': testId,
  ...props 
}: BaseComponentProps) {
  return (
    <div 
      className={cn('flex flex-col space-y-1.5 pb-4', className)} 
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  'data-testid': testId,
  ...props
}: BaseComponentProps) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  'data-testid': testId,
  ...props
}: BaseComponentProps) {
  return (
    <p
      className={cn('text-sm text-gray-500', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardBody({ 
  className, 
  children, 
  'data-testid': testId,
  ...props 
}: BaseComponentProps) {
  return (
    <div 
      className={cn('pt-0', className)} 
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardFooter({ 
  className, 
  children, 
  'data-testid': testId,
  ...props 
}: BaseComponentProps) {
  return (
    <div 
      className={cn('flex items-center pt-4', className)} 
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
}