'use client'

import React, { memo, useCallback, useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'
import type { BaseComponentProps, AccessibilityProps } from './types'

export interface DropZoneProps extends BaseComponentProps, AccessibilityProps {
  /** Whether the drop zone is currently accepting drops */
  isActive?: boolean
  /** Whether something is currently being dragged over this zone */
  isOver?: boolean
  /** Whether the dragged item can be dropped here */
  canDrop?: boolean
  /** Drop event handler */
  onDrop?: (event: React.DragEvent, data?: any) => void
  /** Drag enter event handler */
  onDragEnter?: (event: React.DragEvent) => void
  /** Drag leave event handler */
  onDragLeave?: (event: React.DragEvent) => void
  /** Drag over event handler */
  onDragOver?: (event: React.DragEvent) => void
  /** Drop zone variant */
  variant?: 'default' | 'compact' | 'list' | 'grid'
  /** Drop zone size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show visual feedback */
  showFeedback?: boolean
  /** Custom placeholder content */
  placeholder?: React.ReactNode
  /** Accepted drop types */
  accepts?: string[]
  /** Maximum number of items that can be dropped */
  maxItems?: number
  /** Current number of items in the zone */
  currentCount?: number
  /** Whether the zone is disabled */
  disabled?: boolean
  /** Custom validation function */
  validator?: (data: any) => boolean | string
  /** Drop zone title */
  title?: string
  /** Drop zone description */
  description?: string
  /** Icon to display */
  icon?: React.ReactNode
}

export const DropZone = memo<DropZoneProps>(({
  className,
  children,
  isActive = false,
  isOver = false,
  canDrop = true,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragOver,
  variant = 'default',
  size = 'md',
  showFeedback = true,
  placeholder,
  accepts = ['student'],
  maxItems,
  currentCount = 0,
  disabled = false,
  validator,
  title,
  description,
  icon,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  role = 'region',
  tabIndex = 0,
  ...props
}) => {
  const [dragCounter, setDragCounter] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const isAtCapacity = maxItems !== undefined && currentCount >= maxItems
  const effectiveCanDrop = canDrop && !disabled && !isAtCapacity

  // Handle drag enter with counter to prevent flickering
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setDragCounter(prev => prev + 1)
    onDragEnter?.(event)
  }, [onDragEnter])

  // Handle drag leave with counter
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount === 0) {
        setValidationError(null)
        onDragLeave?.(event)
      }
      return newCount
    })
  }, [onDragLeave])

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (!effectiveCanDrop) {
      event.dataTransfer.dropEffect = 'none'
      return
    }

    event.dataTransfer.dropEffect = 'move'
    onDragOver?.(event)
  }, [effectiveCanDrop, onDragOver])

  // Handle drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setDragCounter(0)
    setValidationError(null)

    if (!effectiveCanDrop) {
      return
    }

    try {
      const dragData = event.dataTransfer.getData('application/json')
      const data = dragData ? JSON.parse(dragData) : null

      // Validate drop type
      if (data?.type && !accepts.includes(data.type)) {
        setValidationError(`이 영역은 ${accepts.join(', ')} 타입만 허용합니다`)
        return
      }

      // Custom validation
      if (validator && data) {
        const validationResult = validator(data)
        if (validationResult !== true) {
          setValidationError(typeof validationResult === 'string' ? validationResult : '유효하지 않은 항목입니다')
          return
        }
      }

      onDrop?.(event, data)
    } catch (error) {
      console.error('Drop error:', error)
      setValidationError('드롭 처리 중 오류가 발생했습니다')
    }
  }, [effectiveCanDrop, accepts, validator, onDrop])

  // Handle keyboard interactions
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      // Can be extended for keyboard-based drop operations
    }
  }, [])

  // Clear validation error after some time
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => setValidationError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [validationError])

  // Determine current state
  const isDragActive = dragCounter > 0
  const showPlaceholder = !children || (Array.isArray(children) && children.length === 0)

  const sizeClasses = {
    sm: 'min-h-24 p-3',
    md: 'min-h-32 p-4',
    lg: 'min-h-40 p-6'
  }

  const variantClasses = {
    default: 'rounded-lg border-2 border-dashed',
    compact: 'rounded border border-dashed',
    list: 'rounded-md border border-dashed',
    grid: 'rounded-lg border-2 border-dashed'
  }

  const baseClasses = cn(
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-50',
    sizeClasses[size],
    variantClasses[variant]
  )

  const stateClasses = cn(
    // Default state
    !isDragActive && !isActive && 'border-gray-300 bg-gray-50',
    
    // Active state (when zone is highlighted)
    isActive && 'border-blue-400 bg-blue-50',
    
    // Drag active state
    isDragActive && effectiveCanDrop && 'border-green-400 bg-green-50 scale-105',
    isDragActive && !effectiveCanDrop && 'border-red-400 bg-red-50',
    
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    
    // At capacity state
    isAtCapacity && 'border-orange-400 bg-orange-50',
    
    // Error state
    validationError && 'border-red-500 bg-red-50'
  )

  const renderPlaceholder = () => {
    if (placeholder) return placeholder

    const getPlaceholderContent = () => {
      if (validationError) {
        return {
          icon: (
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: '오류',
          description: validationError
        }
      }

      if (disabled) {
        return {
          icon: (
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
            </svg>
          ),
          title: '비활성화됨',
          description: '이 영역은 현재 사용할 수 없습니다'
        }
      }

      if (isAtCapacity) {
        return {
          icon: (
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          title: '최대 용량 도달',
          description: `최대 ${maxItems}개 항목까지만 허용됩니다`
        }
      }

      if (isDragActive && effectiveCanDrop) {
        return {
          icon: (
            <svg className="w-8 h-8 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          ),
          title: '여기에 놓으세요',
          description: '항목을 이곳에 드롭할 수 있습니다'
        }
      }

      if (isDragActive && !effectiveCanDrop) {
        return {
          icon: (
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
            </svg>
          ),
          title: '드롭 불가',
          description: '이곳에는 놓을 수 없습니다'
        }
      }

      return {
        icon: icon || (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ),
        title: title || '드래그 앤 드롭',
        description: description || '항목을 여기로 드래그하세요'
      }
    }

    const content = getPlaceholderContent()

    return (
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        {content.icon}
        <div>
          <h3 className={cn(
            'font-medium',
            validationError ? 'text-red-600' :
            disabled ? 'text-gray-400' :
            isAtCapacity ? 'text-orange-600' :
            isDragActive && effectiveCanDrop ? 'text-green-600' :
            isDragActive ? 'text-red-600' :
            'text-gray-600'
          )}>
            {content.title}
          </h3>
          {content.description && (
            <p className={cn(
              'text-sm mt-1',
              validationError ? 'text-red-500' :
              disabled ? 'text-gray-400' :
              isAtCapacity ? 'text-orange-500' :
              isDragActive && effectiveCanDrop ? 'text-green-500' :
              isDragActive ? 'text-red-500' :
              'text-gray-500'
            )}>
              {content.description}
            </p>
          )}
        </div>
        
        {maxItems && !isAtCapacity && (
          <div className="text-xs text-gray-400">
            {currentCount} / {maxItems}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={dropZoneRef}
      className={cn(baseClasses, stateClasses, className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      role={role}
      tabIndex={disabled ? -1 : tabIndex}
      aria-label={ariaLabel || title || '드롭 영역'}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      data-testid={testId || 'drop-zone'}
      data-accepts={accepts.join(',')}
      data-can-drop={effectiveCanDrop}
      data-drag-active={isDragActive}
      {...props}
    >
      {showPlaceholder ? renderPlaceholder() : children}
    </div>
  )
})

DropZone.displayName = 'DropZone'

// ClassFlowDropZone - Specialized drop zone for student management
export interface ClassFlowDropZoneProps extends Omit<DropZoneProps, 'accepts' | 'variant'> {
  /** Class or group ID this drop zone represents */
  classId?: string
  /** Class name */
  className?: string
  /** Current students in this class */
  students?: Array<{ id: string; name: string }>
  /** Maximum capacity for the class */
  maxCapacity?: number
  /** Whether this is an unassigned students area */
  isUnassigned?: boolean
  /** Callback when students are moved to this class */
  onStudentsMove?: (studentIds: string[], classId?: string) => void
}

export const ClassFlowDropZone = memo<ClassFlowDropZoneProps>(({
  classId,
  className,
  students = [],
  maxCapacity,
  isUnassigned = false,
  onStudentsMove,
  onDrop,
  title,
  description,
  ...props
}) => {
  const handleDrop = useCallback((event: React.DragEvent, data?: any) => {
    if (data?.type === 'student') {
      const studentIds = Array.isArray(data.studentIds) ? data.studentIds : [data.studentId].filter(Boolean)
      onStudentsMove?.(studentIds, classId)
    }
    onDrop?.(event, data)
  }, [classId, onStudentsMove, onDrop])

  const validator = useCallback((data: any) => {
    if (data?.type !== 'student') {
      return '학생만 이 영역으로 이동할 수 있습니다'
    }

    const studentIds = Array.isArray(data.studentIds) ? data.studentIds : [data.studentId].filter(Boolean)
    
    if (maxCapacity && students.length + studentIds.length > maxCapacity) {
      return `최대 ${maxCapacity}명까지만 배정할 수 있습니다`
    }

    return true
  }, [maxCapacity, students.length])

  const effectiveTitle = title || (isUnassigned ? '미배정 학생' : `클래스 ${classId || ''}`)
  const effectiveDescription = description || 
    (isUnassigned ? '클래스에 배정되지 않은 학생들' : '학생을 이 클래스에 드래그하세요')

  return (
    <DropZone
      {...props}
      className={cn('classflow-dropzone', className)}
      accepts={['student']}
      variant="list"
      onDrop={handleDrop}
      validator={validator}
      title={effectiveTitle}
      description={effectiveDescription}
      maxItems={maxCapacity}
      currentCount={students.length}
      icon={
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      }
    />
  )
})

ClassFlowDropZone.displayName = 'ClassFlowDropZone'