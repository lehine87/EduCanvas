import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DragHandle } from './DragHandle';

/**
 * Student basic info interface
 */
export interface StudentCardData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  avatar?: string;
  grade?: string;
  enrollmentDate?: string;
}

/**
 * StudentCard component props interface
 */
export interface StudentCardProps {
  /** Student data */
  student: StudentCardData;
  /** Whether the card is being dragged */
  isDragging?: boolean;
  /** Whether the card is selected */
  isSelected?: boolean;
  /** Whether the card is in a drop zone */
  isOverDropZone?: boolean;
  /** Compact view mode */
  compact?: boolean;
  /** Card click handler */
  onClick?: (student: StudentCardData) => void;
  /** Selection change handler */
  onSelectionChange?: (studentId: string, selected: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether drag handle is visible */
  showDragHandle?: boolean;
  /** Whether selection checkbox is visible */
  showSelection?: boolean;
}

/**
 * StudentCard component optimized for ClassFlow 60fps performance
 * Uses React.memo and useCallback to minimize re-renders
 * 
 * @example
 * ```tsx
 * <StudentCard
 *   student={student}
 *   isDragging={isDragging}
 *   onClick={handleStudentClick}
 *   showDragHandle
 * />
 * ```
 */
export const StudentCard = memo<StudentCardProps>(({
  student,
  isDragging = false,
  isSelected = false,
  isOverDropZone = false,
  compact = false,
  onClick,
  onSelectionChange,
  className,
  showDragHandle = true,
  showSelection = false,
}) => {
  const handleClick = useCallback(() => {
    onClick?.(student);
  }, [onClick, student]);

  const handleSelectionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onSelectionChange?.(student.id, event.target.checked);
  }, [onSelectionChange, student.id]);

  const getStatusColor = (status: StudentCardData['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'suspended':
        return 'bg-error-100 text-error-800 border-error-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: StudentCardData['status']) => {
    switch (status) {
      case 'active':
        return '활동중';
      case 'inactive':
        return '비활성';
      case 'pending':
        return '대기중';
      case 'suspended':
        return '정지됨';
      default:
        return '알 수 없음';
    }
  };

  const cardStyles = cn(
    // Base styles
    'relative bg-white border border-gray-200 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 select-none',
    // Interactive states
    'cursor-pointer hover:border-gray-300',
    // Selection state
    isSelected && 'ring-2 ring-brand-500 border-brand-300 bg-brand-50',
    // Dragging state
    isDragging && 'opacity-50 rotate-3 scale-105 shadow-lg z-50',
    // Drop zone state
    isOverDropZone && 'ring-2 ring-success-400 border-success-300',
    // Size variants
    compact ? 'p-3' : 'p-4',
    className
  );

  return (
    <div 
      className={cardStyles}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      data-testid={`student-card-${student.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header with drag handle and selection */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {showSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectionChange}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          {/* Avatar or Initials */}
          <div className="flex-shrink-0">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={`${student.name}의 프로필`}
                className={cn(
                  'rounded-full object-cover',
                  compact ? 'w-8 h-8' : 'w-10 h-10'
                )}
              />
            ) : (
              <div 
                className={cn(
                  'rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-medium',
                  compact ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
                )}
              >
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-medium text-gray-900 truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {student.name}
            </h3>
            {!compact && student.grade && (
              <p className="text-sm text-gray-500 truncate">{student.grade}</p>
            )}
          </div>
        </div>

        {/* Drag Handle */}
        {showDragHandle && (
          <DragHandle
            isDragging={isDragging}
            size={compact ? 'sm' : 'md'}
            ariaLabel={`${student.name} 이동`}
          />
        )}
      </div>

      {/* Contact Info (only in non-compact mode) */}
      {!compact && (student.phone || student.email) && (
        <div className="space-y-1 mb-3">
          {student.phone && (
            <p className="text-xs text-gray-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {student.phone}
            </p>
          )}
          {student.email && (
            <p className="text-xs text-gray-500 flex items-center truncate">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {student.email}
            </p>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
          getStatusColor(student.status)
        )}>
          {getStatusText(student.status)}
        </span>
        
        {/* Enrollment Date (compact mode only) */}
        {compact && student.enrollmentDate && (
          <span className="text-xs text-gray-400">
            {new Date(student.enrollmentDate).toLocaleDateString('ko-KR', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        )}
      </div>

      {/* Enrollment Date (non-compact mode) */}
      {!compact && student.enrollmentDate && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            등록일: {new Date(student.enrollmentDate).toLocaleDateString('ko-KR')}
          </p>
        </div>
      )}
      
      {/* Drag overlay (visible during drag) */}
      {isDragging && (
        <div className="absolute inset-0 bg-brand-500 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
});

StudentCard.displayName = 'StudentCard';