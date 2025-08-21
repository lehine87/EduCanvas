'use client'

import React from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, MoreVertical, Menu } from 'lucide-react';

/**
 * DragHandle component props interface
 */
export interface DragHandleProps {
  /** Whether the handle is currently being dragged */
  isDragging?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Drag handle variant */
  variant?: 'dots' | 'lines' | 'grip';
  /** Size of the drag handle */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * DragHandle component for ClassFlow drag-and-drop interactions
 * Optimized for 60fps performance with minimal re-renders
 * 
 * @example
 * ```tsx
 * <DragHandle
 *   isDragging={isDragging}
 *   variant="dots"
 *   size="md"
 *   ariaLabel="Drag to move student"
 * />
 * ```
 */
export const DragHandle = React.memo<DragHandleProps>(({
  isDragging = false,
  className,
  variant = 'dots',
  size = 'md',
  ariaLabel = 'Drag handle',
}) => {
  const baseStyles = 'inline-flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-150 select-none';
  
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const renderIcon = () => {
    const iconSize = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4', 
      lg: 'h-5 w-5',
    };

    const iconColor = isDragging ? 'text-primary' : 'text-muted-foreground hover:text-foreground';

    const commonProps = {
      className: cn(iconSize[size], iconColor),
      'aria-hidden': true
    };

    switch (variant) {
      case 'lines':
        return <MoreVertical {...commonProps} />;
      
      case 'grip':
        return <GripVertical {...commonProps} />;
      
      default: // dots
        return <Menu {...commonProps} />;
    }
  };

  return (
    <div
      className={cn(
        baseStyles,
        sizeStyles[size],
        isDragging && 'opacity-50',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      data-testid="drag-handle"
    >
      {renderIcon()}
    </div>
  );
});

DragHandle.displayName = 'DragHandle';