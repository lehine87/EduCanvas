'use client'

import React, { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './Badge'
import { STUDENT_STATUS_COLORS, STUDENT_STATUS_TEXT, getStudentStatusStyles } from '@/constants/studentConstants'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { useARIAAttributes } from '@/hooks/useAccessibility'
import type { BaseComponentProps, AccessibilityProps } from './types'

/**
 * 통합 학생 데이터 타입 (기존 타입들을 통합)
 */
export interface StudentCardData {
  id: string
  name: string
  phone?: string
  email?: string
  parent_phone_1?: string
  parent_phone_2?: string
  status: 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended' | 'pending'
  avatar_url?: string
  grade_level?: string
  grade?: string // 호환성을 위한 별칭
  tags?: string[]
  enrollmentDate?: string
  created_at?: string
  student_number?: string
  school_name?: string
  position_in_class?: number
  
  // ClassFlow 관련 속성
  position?: { x: number; y: number }
  isDragging?: boolean
  isSelected?: boolean
  isHighlighted?: boolean
  dragIndex?: number
  originalClass?: string
}

/**
 * DragHandle 컴포넌트 Props
 */
interface DragHandleProps {
  isDragging?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dots' | 'lines' | 'grip'
  ariaLabel?: string
  className?: string
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
}

/**
 * 최적화된 DragHandle 컴포넌트
 */
const DragHandle = memo<DragHandleProps>(({
  isDragging = false,
  size = 'md',
  variant = 'dots',
  ariaLabel,
  className,
  dragHandleProps
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const iconClasses = cn(
    sizeClasses[size],
    isDragging ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600',
    'transition-colors duration-150'
  )

  const renderIcon = () => {
    switch (variant) {
      case 'lines':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        )
      case 'grip':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H9zm-1 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          </svg>
        )
      default: // dots
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="4" cy="4" r="1.5" />
            <circle cx="4" cy="10" r="1.5" />
            <circle cx="4" cy="16" r="1.5" />
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        )
    }
  }

  return (
    <div
      {...dragHandleProps}
      className={cn(
        'flex-shrink-0 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'select-none transition-colors duration-150',
        isDragging && 'opacity-50',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || '드래그 핸들'}
      data-testid="drag-handle"
    >
      {renderIcon()}
    </div>
  )
})

DragHandle.displayName = 'DragHandle'

/**
 * StudentCard Props
 */
export interface StudentCardProps extends BaseComponentProps, AccessibilityProps {
  /** 학생 데이터 */
  student: StudentCardData
  /** 드래그 중 여부 */
  isDragging?: boolean
  /** 선택 여부 */
  isSelected?: boolean
  /** 드롭존 위에 있는지 여부 */
  isOverDropZone?: boolean
  /** 클릭 핸들러 */
  onClick?: (student: StudentCardData) => void
  /** 선택 변경 핸들러 */
  onSelectionChange?: (studentId: string, selected: boolean) => void
  /** 편집 핸들러 */
  onEdit?: (student: StudentCardData) => void
  /** 카드 변형 */
  variant?: 'default' | 'compact' | 'detailed'
  /** 드래그 핸들 표시 여부 */
  showDragHandle?: boolean
  /** 선택 체크박스 표시 여부 */
  showSelection?: boolean
  /** 드래그 관련 props */
  draggableProps?: React.HTMLAttributes<HTMLElement>
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
}

/**
 * 통합된 StudentCard 컴포넌트
 * 최적화된 성능, 접근성, 다양한 사용 사례를 지원
 */
export const StudentCard = memo<StudentCardProps>(({
  student,
  isDragging = false,
  isSelected = false,
  isOverDropZone = false,
  onClick,
  onSelectionChange,
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
  // 성능 모니터링 (개발 환경에서만)
  const { renderCount } = usePerformanceMonitor(`StudentCard-${student.id}`, process.env.NODE_ENV === 'development')
  
  // ARIA 속성 관리
  const { generateAriaLabel, generateARIAProps } = useARIAAttributes()
  // 이벤트 핸들러들
  const handleClick = useCallback(() => {
    onClick?.(student)
  }, [onClick, student])

  const handleDoubleClick = useCallback(() => {
    onEdit?.(student)
  }, [onEdit, student])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // 접근성 개선: 더 많은 키보드 상호작용 지원
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (event.shiftKey) {
          handleDoubleClick() // Shift+Enter로 편집
        } else {
          handleClick() // Enter로 선택
        }
        break
      case ' ': // 스페이스바로 선택
        event.preventDefault()
        handleClick()
        break
      case 'e': // 'e' 키로 편집 (빠른 접근)
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          handleDoubleClick()
        }
        break
      case 's': // 's' 키로 선택 토글 (빠른 접근)
        if ((event.ctrlKey || event.metaKey) && showSelection) {
          event.preventDefault()
          onSelectionChange?.(student.id, !isSelected)
        }
        break
    }
  }, [handleClick, handleDoubleClick, onSelectionChange, student.id, isSelected, showSelection])

  const handleSelectionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    onSelectionChange?.(student.id, event.target.checked)
  }, [onSelectionChange, student.id])

  // 유틸리티 함수들 - useMemo로 최적화
  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }, [])

  const formatPhone = useCallback((phone?: string) => {
    if (!phone) return null
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }, [])

  // 자주 계산되는 값들을 메모이제이션
  const computedValues = React.useMemo(() => {
    const displayGrade = student.grade_level || student.grade
    const displayAvatar = student.avatar_url
    const statusStyles = getStudentStatusStyles(student.status as any)
    const hasPhone = !!(student.phone || student.parent_phone_1)
    const hasEmail = !!student.email
    
    return {
      displayGrade,
      displayAvatar,
      statusStyles,
      hasPhone,
      hasEmail,
      initials: getInitials(student.name)
    }
  }, [student.grade_level, student.grade, student.avatar_url, student.status, student.phone, student.parent_phone_1, student.email, student.name, getInitials])
  
  // 접근성을 위한 동적 ARIA 라벨 생성 - 메모이제이션
  const dynamicAriaLabel = React.useMemo(() => {
    return generateAriaLabel(
      ariaLabel || `학생 ${student.name}`,
      {
        isSelected,
        isDisabled: isDragging,
        status: computedValues.statusStyles.text,
        grade: computedValues.displayGrade,
        hasPhone: computedValues.hasPhone,
        hasEmail: computedValues.hasEmail
      }
    )
  }, [ariaLabel, student.name, isSelected, isDragging, computedValues, generateAriaLabel])
  
  // ARIA 속성 생성 - 메모이제이션
  const ariaProps = React.useMemo(() => {
    return generateARIAProps({
      label: dynamicAriaLabel,
      describedBy: ariaDescribedBy ? [ariaDescribedBy] : undefined,
      selected: showSelection ? isSelected : undefined,
      disabled: isDragging
    })
  }, [dynamicAriaLabel, ariaDescribedBy, showSelection, isSelected, isDragging, generateARIAProps])

  // 카드 스타일
  const cardClasses = cn(
    // 기본 스타일
    'relative bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 select-none',
    'hover:shadow-md hover:border-gray-300 cursor-pointer',
    // 포커스 스타일
    'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50',
    // 상태별 스타일
    isSelected && 'ring-2 ring-blue-500 border-blue-300 bg-blue-50',
    isDragging && 'opacity-50 rotate-2 scale-105 shadow-lg z-50',
    isOverDropZone && 'ring-2 ring-green-400 border-green-300',
    // 크기 변형
    variant === 'compact' && 'p-3',
    variant !== 'compact' && 'p-4',
    className
  )

  // 컴팩트 모드 렌더링
  const renderCompactCard = () => (
    <div className="flex items-center space-x-3">
      {showSelection && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectionChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${student.name} 선택`}
        />
      )}
      
      {/* 아바타 */}
      <div className="flex-shrink-0">
        {computedValues.displayAvatar ? (
          <img
            src={computedValues.displayAvatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
            {computedValues.initials}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {student.name}
          </p>
          {computedValues.displayGrade && (
            <span className="text-xs text-gray-500">
              {computedValues.displayGrade}
            </span>
          )}
        </div>
        <div className="mt-1">
          <Badge 
            variant="outline" 
            size="xs" 
            className={computedValues.statusStyles.colors}
          >
            {computedValues.statusStyles.text}
          </Badge>
        </div>
      </div>

      {showDragHandle && (
        <DragHandle
          isDragging={isDragging}
          size="sm"
          ariaLabel={`${student.name} 이동`}
          dragHandleProps={dragHandleProps}
        />
      )}
    </div>
  )

  // 기본 모드 렌더링
  const renderDefaultCard = () => (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {showSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectionChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${student.name} 선택`}
            />
          )}
          
          {/* 아바타 */}
          <div className="flex-shrink-0">
            {computedValues.displayAvatar ? (
              <img
                src={computedValues.displayAvatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                {computedValues.initials}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {student.name}
            </h3>
            {computedValues.displayGrade && (
              <p className="text-sm text-gray-500">
                {computedValues.displayGrade}
              </p>
            )}
            {student.student_number && (
              <p className="text-xs text-gray-400">
                학번: {student.student_number}
              </p>
            )}
          </div>
        </div>

        {showDragHandle && (
          <DragHandle
            isDragging={isDragging}
            size="md"
            ariaLabel={`${student.name} 이동`}
            dragHandleProps={dragHandleProps}
          />
        )}
      </div>

      {/* 태그 */}
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

      {/* 연락처 정보 */}
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

      {/* 상태 및 등록일 */}
      <div className="flex items-center justify-between mt-4">
        <Badge 
          variant="outline" 
          className={computedValues.statusStyles.colors}
        >
          {computedValues.statusStyles.text}
        </Badge>
        {(student.enrollmentDate || student.created_at) && (
          <span className="text-xs text-gray-400">
            {new Date(student.enrollmentDate || student.created_at || '').toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>
    </>
  )

  // 상세 모드 렌더링
  const renderDetailedCard = () => (
    <>
      {renderDefaultCard()}
      
      {/* 추가 상세 정보 */}
      {(student.email || student.parent_phone_2 || student.school_name) && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          {student.email && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {student.email}
            </div>
          )}
          {student.parent_phone_2 && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              학부모2: {formatPhone(student.parent_phone_2)}
            </div>
          )}
          {student.school_name && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z" />
              </svg>
              {student.school_name}
            </div>
          )}
        </div>
      )}
      
      {/* 성능 디버깅 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && renderCount > 5 && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          ⚠️ 많은 리렌더링 감지: {renderCount}회
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
      {...ariaProps}
      data-testid={testId || `student-card-${student.id}`}
      data-student-id={student.id}
      data-student-status={student.status}
      {...props}
    >
      {variant === 'compact' && renderCompactCard()}
      {variant === 'default' && renderDefaultCard()}
      {variant === 'detailed' && renderDetailedCard()}
      
      {/* 드래그 오버레이 */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </div>
  )
})

StudentCard.displayName = 'StudentCard'

// 호환성을 위한 타입 export
export type { StudentCardData as ClassFlowStudent }