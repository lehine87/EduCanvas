'use client'

import React from 'react';
import { cn } from '@/lib/utils';

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

    const iconColor = isDragging ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600';

    switch (variant) {
      case 'lines':
        return (
          <svg
            className={cn(iconSize[size], iconColor)}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        );
      
      case 'grip':
        return (
          <svg
            className={cn(iconSize[size], iconColor)}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H9zm-1 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          </svg>
        );
      
      default: // dots
        return (
          <svg
            className={cn(iconSize[size], iconColor)}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <circle cx="4" cy="4" r="2" />
            <circle cx="4" cy="10" r="2" />
            <circle cx="4" cy="16" r="2" />
            <circle cx="10" cy="4" r="2" />
            <circle cx="10" cy="10" r="2" />
            <circle cx="10" cy="16" r="2" />
          </svg>
        );
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