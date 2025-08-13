'use client'

import React, { forwardRef, useState } from 'react'
import { cn } from '@/utils/cn'
import type { 
  BaseComponentProps, 
  AccessibilityProps, 
  ComponentSize 
} from './types'

export interface InputProps extends 
  BaseComponentProps,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseComponentProps | 'size' | 'aria-expanded'> {
  size?: ComponentSize
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  required?: boolean
  loading?: boolean
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  role?: string
  tabIndex?: number
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  size = 'md',
  error,
  hint,
  leftIcon,
  rightIcon,
  label,
  required = false,
  loading = false,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint ? `${inputId}-hint` : undefined
  const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(' ')

  const baseClasses = cn(
    'block w-full border rounded-md shadow-sm',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'placeholder:text-gray-400'
  )
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
    xl: 'px-5 py-4 text-lg'
  }

  const stateClasses = error 
    ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500'
    : 'border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-500'

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            required && 'after:content-["*"] after:ml-0.5 after:text-red-500'
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400" aria-hidden="true">
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseClasses,
            sizeClasses[size],
            stateClasses,
            leftIcon && 'pl-10',
            (rightIcon || loading) && 'pr-10',
            error && 'border-red-300',
            isFocused && 'ring-2',
            className
          )}
          aria-label={ariaLabel}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          data-testid={testId}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
        
        {(rightIcon || loading) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
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
            ) : (
              <span className="text-gray-400" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </div>
        )}
      </div>
      
      {hint && !error && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center" role="alert">
          <svg
            className="h-4 w-4 mr-1 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Textarea component with same styling as Input
export interface TextareaProps extends 
  BaseComponentProps,
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseComponentProps | 'aria-expanded'> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  role?: string
  tabIndex?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  required = false,
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2)}`
  const errorId = error ? `${textareaId}-error` : undefined
  const hintId = hint ? `${textareaId}-hint` : undefined
  const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(' ')

  const baseClasses = cn(
    'block w-full border rounded-md shadow-sm',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
    'px-3 py-2 text-sm'
  )
  
  const stateClasses = error 
    ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500'
    : 'border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-500'

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={textareaId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            required && 'after:content-["*"] after:ml-0.5 after:text-red-500'
          )}
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          baseClasses,
          stateClasses,
          error && 'border-red-300',
          className
        )}
        aria-label={ariaLabel}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        data-testid={testId}
        {...props}
      />
      
      {hint && !error && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center" role="alert">
          <svg
            className="h-4 w-4 mr-1 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'