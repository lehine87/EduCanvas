'use client'

import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentCard, StudentCardData } from '../StudentCard';
import { User, MapPin, Calendar, Users, Plus } from 'lucide-react';

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


  // Student grid styles based on variant
  const studentGridStyles = cn(
    'gap-3',
    variant === 'grid' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    variant === 'list' && 'space-y-2',
    variant === 'compact' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  );

  const getCapacityColor = () => {
    if (capacityInfo.isFull) return 'text-destructive';
    if (capacityInfo.isNearFull) return 'text-orange-600';
    return 'text-primary';
  };

  return (
    <Card className={cn('relative transition-all duration-200 hover:shadow-lg', 
      isSelected && 'ring-2 ring-primary border-primary/30',
      isDropTarget && 'border-dashed border-2 border-primary bg-primary/5',
      isOver && 'border-primary bg-primary/10 shadow-lg',
      capacityInfo.isFull && 'border-destructive/30 bg-destructive/5',
      className
    )} data-testid={`class-container-${classData.id}`}>
      {/* Header */}
      <CardHeader 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
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
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {classData.name}
                </h3>
                {classData.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {classData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Class info */}
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {classData.instructor && (
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {classData.instructor}
                </span>
              )}
              {classData.room && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {classData.room}
                </span>
              )}
              {classData.schedule && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {classData.schedule}
                </span>
              )}
            </div>
          </div>

          {/* Capacity indicator */}
          <div className="flex-shrink-0 text-right">
            <Badge 
              variant={capacityInfo.isFull ? 'destructive' : capacityInfo.isNearFull ? 'secondary' : 'default'}
              className="text-sm font-semibold"
            >
              {capacityInfo.currentCount} / {capacityInfo.capacity}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">학생</div>
            
            {/* Capacity bar */}
            <div className="w-16 h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  capacityInfo.isFull && 'bg-destructive',
                  capacityInfo.isNearFull && !capacityInfo.isFull && 'bg-orange-500',
                  !capacityInfo.isNearFull && 'bg-primary'
                )}
                style={{ width: `${Math.min(capacityInfo.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Student list */}
      <CardContent className="p-4">
        {students.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
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
                {...({
                  student,
                  onClick: handleStudentClick,
                  onSelectionChange: handleStudentSelectionChange,
                  compact: variant === 'compact',
                  showDragHandle: showDragHandles,
                  showSelection: showStudentSelection,
                  isSelected: selectedStudents.has(student.id)
                } as any)}
              />
            ))}
          </div>
        )}

        {/* Drop zone indicator */}
        {isDropTarget && isOver && (
          <div className="absolute inset-4 border-2 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Plus className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-primary font-medium">여기에 놓기</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ClassContainer.displayName = 'ClassContainer';