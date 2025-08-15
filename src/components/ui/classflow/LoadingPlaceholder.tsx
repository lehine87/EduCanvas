'use client'

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * LoadingPlaceholder component props interface
 */
export interface LoadingPlaceholderProps {
  /** Type of content being loaded */
  type?: 'student-card' | 'class-container' | 'table-row' | 'custom';
  /** Number of placeholder items to show */
  count?: number;
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'wave';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Custom height for skeleton */
  height?: number;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
}

/**
 * Skeleton component for individual loading elements
 */
interface SkeletonProps {
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'wave';
}

const Skeleton = memo<SkeletonProps>(({ className, animation = 'pulse' }) => {
  const animationStyles = {
    pulse: 'animate-pulse-gentle',
    shimmer: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    wave: 'animate-pulse',
  };

  return (
    <div 
      className={cn('bg-gray-200 rounded', animationStyles[animation], className)}
      role="status"
      aria-label="Loading..."
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * LoadingPlaceholder component for ClassFlow loading states
 * Provides consistent skeleton loading UI across the application
 * 
 * @example
 * ```tsx
 * <LoadingPlaceholder
 *   type="student-card"
 *   count={6}
 *   animation="shimmer"
 * />
 * ```
 */
export const LoadingPlaceholder = memo<LoadingPlaceholderProps>(({
  type = 'custom',
  count = 1,
  animation = 'pulse',
  size = 'md',
  className,
  height,
  direction = 'vertical',
}) => {
  const containerStyles = cn(
    direction === 'horizontal' ? 'flex space-x-4' : 'space-y-4',
    className
  );

  const StudentCardSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {/* Avatar skeleton */}
          <Skeleton className="w-10 h-10 rounded-full" animation={animation} />
          
          <div className="flex-1 space-y-2">
            {/* Name skeleton */}
            <Skeleton className="h-4 w-24" animation={animation} />
            {/* Grade skeleton */}
            <Skeleton className="h-3 w-16" animation={animation} />
          </div>
        </div>
        
        {/* Drag handle skeleton */}
        <Skeleton className="w-5 h-5" animation={animation} />
      </div>

      {/* Contact info skeleton */}
      <div className="space-y-1 mb-3">
        <Skeleton className="h-3 w-28" animation={animation} />
        <Skeleton className="h-3 w-32" animation={animation} />
      </div>

      {/* Status and date skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16 rounded-full" animation={animation} />
        <Skeleton className="h-3 w-20" animation={animation} />
      </div>
    </div>
  );

  const ClassContainerSkeleton = () => (
    <div className="bg-white border rounded-xl shadow-card">
      {/* Header skeleton */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="w-4 h-4 rounded-full" animation={animation} />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" animation={animation} />
              <Skeleton className="h-4 w-48" animation={animation} />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-6 w-12" animation={animation} />
            <Skeleton className="h-1.5 w-16 rounded-full" animation={animation} />
          </div>
        </div>
        
        <div className="mt-2 flex space-x-4">
          <Skeleton className="h-4 w-20" animation={animation} />
          <Skeleton className="h-4 w-16" animation={animation} />
          <Skeleton className="h-4 w-24" animation={animation} />
        </div>
      </div>

      {/* Student cards skeleton */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <StudentCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );

  const TableRowSkeleton = () => {
    const sizeStyles = {
      sm: 'py-2',
      md: 'py-3',
      lg: 'py-4',
    };

    return (
      <tr className={cn('border-b border-gray-200', sizeStyles[size])}>
        <td className="px-4">
          <Skeleton className="h-4 w-8" animation={animation} />
        </td>
        <td className="px-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" animation={animation} />
            <Skeleton className="h-4 w-24" animation={animation} />
          </div>
        </td>
        <td className="px-4">
          <Skeleton className="h-4 w-32" animation={animation} />
        </td>
        <td className="px-4">
          <Skeleton className="h-4 w-16" animation={animation} />
        </td>
        <td className="px-4">
          <Skeleton className="h-6 w-16 rounded-full" animation={animation} />
        </td>
        <td className="px-4">
          <Skeleton className="h-4 w-20" animation={animation} />
        </td>
      </tr>
    );
  };

  const CustomSkeleton = () => {
    const sizeStyles = {
      sm: 'h-16',
      md: 'h-24',
      lg: 'h-32',
    };

    return (
      <Skeleton 
        className={cn(sizeStyles[size], height && `h-[${height}px]`)} 
        animation={animation} 
      />
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'student-card':
        return Array.from({ length: count }).map((_, index) => (
          <StudentCardSkeleton key={index} />
        ));
        
      case 'class-container':
        return Array.from({ length: count }).map((_, index) => (
          <ClassContainerSkeleton key={index} />
        ));
        
      case 'table-row':
        return (
          <table className="min-w-full bg-white">
            <tbody>
              {Array.from({ length: count }).map((_, index) => (
                <TableRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        );
        
      default:
        return Array.from({ length: count }).map((_, index) => (
          <CustomSkeleton key={index} />
        ));
    }
  };

  if (type === 'table-row') {
    return <>{renderContent()}</>;
  }

  return (
    <div className={containerStyles} role="status" aria-label="Loading content...">
      {renderContent()}
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

/**
 * Pre-configured loading components for common use cases
 */
export const StudentCardLoader = memo<Omit<LoadingPlaceholderProps, 'type'>>(
  (props) => <LoadingPlaceholder type="student-card" {...props} />
);

export const ClassContainerLoader = memo<Omit<LoadingPlaceholderProps, 'type'>>(
  (props) => <LoadingPlaceholder type="class-container" {...props} />
);

export const TableRowLoader = memo<Omit<LoadingPlaceholderProps, 'type'>>(
  (props) => <LoadingPlaceholder type="table-row" {...props} />
);

StudentCardLoader.displayName = 'StudentCardLoader';
ClassContainerLoader.displayName = 'ClassContainerLoader';
TableRowLoader.displayName = 'TableRowLoader';