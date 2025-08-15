'use client'

import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { StudentCard, StudentCardData } from './StudentCard';

/**
 * Class container data interface
 */
export interface ClassContainerData {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  currentCount: number;
  color?: string;
  instructor?: string;
  schedule?: string;
  room?: string;
}

/**
 * ClassContainer component props interface
 */
export interface ClassContainerProps {
  /** Class data */
  classData: ClassContainerData;
  /** Students in this class */
  students: StudentCardData[];
  /** Whether this container is a valid drop target */
  isDropTarget?: boolean;
  /** Whether something is being dragged over */
  isOver?: boolean;
  /** Whether the container is selected */
  isSelected?: boolean;
  /** Container layout variant */
  variant?: 'grid' | 'list' | 'compact';
  /** Maximum height for scrollable content */
  maxHeight?: number;
  /** Student card click handler */
  onStudentClick?: (student: StudentCardData) => void;
  /** Student selection change handler */
  onStudentSelectionChange?: (studentId: string, selected: boolean) => void;
  /** Container click handler */
  onContainerClick?: (classData: ClassContainerData) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show student selection checkboxes */
  showStudentSelection?: boolean;
  /** Whether to show drag handles on student cards */
  showDragHandles?: boolean;
  /** Selected student IDs */
  selectedStudents?: Set<string>;
}

/**
 * ClassContainer component for ClassFlow drag-and-drop interface
 * Optimized for performance with large student lists using virtualization when needed
 * 
 * @example
 * ```tsx
 * <ClassContainer
 *   classData={classInfo}
 *   students={students}
 *   isDropTarget={isValidDropTarget}
 *   onStudentClick={handleStudentClick}
 *   variant="grid"
 * />
 * ```
 */
export const ClassContainer = memo<ClassContainerProps>(({
  classData,
  students,
  isDropTarget = false,
  isOver = false,
  isSelected = false,
  variant = 'grid',
  maxHeight = 400,
  onStudentClick,
  onStudentSelectionChange,
  onContainerClick,
  className,
  showStudentSelection = false,
  showDragHandles = true,
  selectedStudents = new Set(),
}) => {
  const handleContainerClick = useCallback(() => {
    onContainerClick?.(classData);
  }, [onContainerClick, classData]);

  const handleStudentClick = useCallback((student: StudentCardData) => {
    onStudentClick?.(student);
  }, [onStudentClick]);

  const handleStudentSelectionChange = useCallback((studentId: string, selected: boolean) => {
    onStudentSelectionChange?.(studentId, selected);
  }, [onStudentSelectionChange]);

  // Memoized capacity calculation
  const capacityInfo = useMemo(() => {
    const currentCount = students.length;
    const capacity = classData.capacity;
    const percentage = capacity > 0 ? (currentCount / capacity) * 100 : 0;
    const isFull = currentCount >= capacity;
    const isNearFull = percentage >= 80;

    return {
      currentCount,
      capacity,
      percentage,
      isFull,
      isNearFull,
    };
  }, [students.length, classData.capacity]);

  // Container styles
  const containerStyles = cn(
    // Base styles
    'relative bg-white border rounded-xl shadow-card transition-all duration-200',
    // Interactive states
    'hover:shadow-card-hover',
    // Selection state
    isSelected && 'ring-2 ring-brand-500 border-brand-300',
    // Drop target state
    isDropTarget && 'border-dashed border-2 border-brand-400 bg-brand-50',
    // Drop over state
    isOver && 'border-success-400 bg-success-50 shadow-dropdown',
    // Capacity-based styling
    capacityInfo.isFull && 'border-error-200 bg-error-50',
    className
  );

  // Student grid styles based on variant
  const studentGridStyles = cn(
    'gap-3',
    variant === 'grid' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    variant === 'list' && 'space-y-2',
    variant === 'compact' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  );

  const getCapacityColor = () => {
    if (capacityInfo.isFull) return 'text-error-600';
    if (capacityInfo.isNearFull) return 'text-warning-600';
    return 'text-success-600';
  };

  return (
    <div className={containerStyles} data-testid={`class-container-${classData.id}`}>
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
        onClick={handleContainerClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              {/* Color indicator */}
              {classData.color && (
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: classData.color }}
                />
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {classData.name}
                </h3>
                {classData.description && (
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {classData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Class info */}
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              {classData.instructor && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {classData.instructor}
                </span>
              )}
              {classData.room && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                  </svg>
                  {classData.room}
                </span>
              )}
              {classData.schedule && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {classData.schedule}
                </span>
              )}
            </div>
          </div>

          {/* Capacity indicator */}
          <div className="flex-shrink-0 text-right">
            <div className={cn('text-lg font-semibold', getCapacityColor())}>
              {capacityInfo.currentCount} / {capacityInfo.capacity}
            </div>
            <div className="text-xs text-gray-400">학생</div>
            
            {/* Capacity bar */}
            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  capacityInfo.isFull && 'bg-error-500',
                  capacityInfo.isNearFull && !capacityInfo.isFull && 'bg-warning-500',
                  !capacityInfo.isNearFull && 'bg-success-500'
                )}
                style={{ width: `${Math.min(capacityInfo.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student list */}
      <div className="p-4">
        {students.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <svg 
              className="mx-auto h-12 w-12 text-gray-300 mb-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            <p className="text-gray-500 text-sm">
              {isDropTarget ? '학생을 여기로 드래그하세요' : '배정된 학생이 없습니다'}
            </p>
          </div>
        ) : (
          // Student cards
          <div 
            className={studentGridStyles}
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={handleStudentClick}
                onSelectionChange={handleStudentSelectionChange}
                compact={variant === 'compact'}
                showDragHandle={showDragHandles}
                showSelection={showStudentSelection}
                isSelected={selectedStudents.has(student.id)}
              />
            ))}
          </div>
        )}

        {/* Drop zone indicator */}
        {isDropTarget && isOver && (
          <div className="absolute inset-4 border-2 border-dashed border-success-400 bg-success-50 bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-success-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-success-600 font-medium">여기에 놓기</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ClassContainer.displayName = 'ClassContainer';