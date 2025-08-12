'use client'

import React, { memo, useCallback } from 'react'
import { cn } from '@/utils/cn'
import { Badge, StatusBadge } from './Badge'
import type { BaseComponentProps, AccessibilityProps } from './types'

// ClassFlow에서 사용할 학생 데이터 타입
export interface ClassFlowStudent {
  id: string
  name: string
  phone?: string
  email?: string
  parent_phone_1?: string
  parent_phone_2?: string
  status: 'active' | 'inactive' | 'graduated' | 'transferred'
  avatar?: string
  grade?: string
  tags?: string[]
  enrollmentDate?: string
  position_in_class?: number
}

interface StudentCardProps extends BaseComponentProps, AccessibilityProps {
  student: ClassFlowStudent
  isDragging?: boolean
  isSelected?: boolean
  onSelect?: (student: ClassFlowStudent) => void
  onEdit?: (student: ClassFlowStudent) => void
  variant?: 'default' | 'compact' | 'detailed'
  showDragHandle?: boolean
  showSelection?: boolean
  draggableProps?: any
  dragHandleProps?: any
}

export const StudentCard = memo<StudentCardProps>(({ 
  student, 
  isDragging = false,
  isSelected = false,
  onSelect,
  onEdit,
  variant = 'default',
  showDragHandle = true,
  showSelection = false,
  draggableProps,
  dragHandleProps,
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(student)
  }, [onSelect, student])

  const handleDoubleClick = useCallback(() => {
    onEdit?.(student)
  }, [onEdit, student])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    } else if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      handleDoubleClick()
    }
  }, [handleClick, handleDoubleClick])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return null
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }

  // Drag Handle Component
  const DragHandle = () => (
    <div
      {...dragHandleProps}
      className={cn(
        'flex-shrink-0 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
      )}
      tabIndex={0}
      aria-label={`${student.name} 드래그`}
    >
      <svg 
        className="w-4 h-4 text-gray-400" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <circle cx="4" cy="4" r="1.5" />
        <circle cx="4" cy="10" r="1.5" />
        <circle cx="4" cy="16" r="1.5" />
        <circle cx="10" cy="4" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="10" cy="16" r="1.5" />
      </svg>
    </div>
  )

  const cardClasses = cn(
    'relative bg-white border rounded-lg shadow-sm transition-all duration-200',
    'hover:shadow-md hover:border-gray-300',
    'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50',
    isSelected && 'ring-2 ring-blue-500 border-blue-300 bg-blue-50',
    isDragging && 'opacity-50 rotate-2 scale-105 shadow-lg z-50',
    variant === 'compact' && 'p-3',
    variant !== 'compact' && 'p-4',
    className
  )

  const renderCompactCard = () => (
    <div className="flex items-center space-x-3">
      {showSelection && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleClick()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${student.name} 선택`}
        />
      )}
      
      {/* Avatar */}
      <div className="flex-shrink-0">
        {student.avatar ? (
          <img
            src={student.avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
            {getInitials(student.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {student.name}
          </p>
          {student.grade && (
            <span className="text-xs text-gray-500">
              {student.grade}
            </span>
          )}
        </div>
        <StatusBadge status={student.status} size="xs" />
      </div>

      {showDragHandle && <DragHandle />}
    </div>
  )

  const renderDefaultCard = () => (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {showSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleClick()}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${student.name} 선택`}
            />
          )}
          
          {/* Avatar */}
          <div className="flex-shrink-0">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                {getInitials(student.name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {student.name}
            </h3>
            {student.grade && (
              <p className="text-sm text-gray-500">
                {student.grade}
              </p>
            )}
          </div>
        </div>

        {showDragHandle && <DragHandle />}
      </div>

      {/* Tags */}
      {student.tags && student.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {student.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" size="xs">
              {tag}
            </Badge>
          ))}
          {student.tags.length > 3 && (
            <Badge variant="ghost" size="xs">
              +{student.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Contact Info */}
      {(student.phone || student.parent_phone_1) && (
        <div className="mt-3 space-y-1">
          {student.phone && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              학생: {formatPhone(student.phone)}
            </div>
          )}
          {student.parent_phone_1 && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              학부모: {formatPhone(student.parent_phone_1)}
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between mt-4">
        <StatusBadge status={student.status} />
        {student.enrollmentDate && (
          <span className="text-xs text-gray-400">
            {new Date(student.enrollmentDate).toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>
    </>
  )

  const renderDetailedCard = () => (
    <>
      {renderDefaultCard()}
      
      {/* Additional Details */}
      {student.email && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            {student.email}
          </div>
        </div>
      )}

      {student.parent_phone_2 && (
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          학부모2: {formatPhone(student.parent_phone_2)}
        </div>
      )}
    </>
  )

  return (
    <div
      {...draggableProps}
      className={cardClasses}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel || `학생 ${student.name}${isSelected ? ' (선택됨)' : ''}`}
      aria-describedby={ariaDescribedBy}
      data-testid={testId || `student-card-${student.id}`}
      {...props}
    >
      {variant === 'compact' && renderCompactCard()}
      {variant === 'default' && renderDefaultCard()}
      {variant === 'detailed' && renderDetailedCard()}
      
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </div>
  )
})

StudentCard.displayName = 'StudentCard'