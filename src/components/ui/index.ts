/**
 * EduCanvas UI Components Library
 * 
 * Centralized exports for all UI components to enable easy UI replacement
 * When replacing the UI library, only this file needs to be updated.
 * 
 * Usage:
 * import { Button, Input, Modal } from '@/components/ui';
 */

// =============================================================================
// BASIC UI COMPONENTS
// =============================================================================

// Button Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Input Components
export { Input, Textarea } from './Input';
export type { InputProps, TextareaProps } from './Input';

// Modal Components
export { Modal, ConfirmModal } from './Modal';
export type { ModalProps, ConfirmModalProps } from './Modal';

// Table Components
export { Table, SimpleTable } from './Table';
export type { TableProps, Column } from './Table';

// =============================================================================
// CLASSFLOW SPECIFIC COMPONENTS
// =============================================================================

// Drag Handle Component
export { DragHandle } from './classflow/DragHandle';
export type { DragHandleProps } from './classflow/DragHandle';

// Student Card Component
export { StudentCard } from './classflow/StudentCard';
export type { StudentCardProps, StudentCardData } from './classflow/StudentCard';

// Class Container Component
export { ClassContainer } from './classflow/ClassContainer';
export type { ClassContainerProps, ClassContainerData } from './classflow/ClassContainer';

// Loading Placeholder Components
export { 
  LoadingPlaceholder,
  StudentCardLoader,
  ClassContainerLoader,
  TableRowLoader 
} from './classflow/LoadingPlaceholder';
export type { LoadingPlaceholderProps } from './classflow/LoadingPlaceholder';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Common Types and Interfaces
export type {
  BaseComponentProps,
  InteractiveComponentProps,
  ComponentSize,
  ComponentVariant,
  ComponentAlignment,
  StatusType,
  FormFieldState,
  AnimationProps,
  DragDropProps,
  LoadingProps,
  ErrorProps,
  EmptyProps,
  PaginationProps,
  FilterProps,
  SearchProps,
  
  // ClassFlow Types
  StudentData,
  ClassData,
  ClassFlowContainerProps,
  
  // Component-specific Types
  CardProps,
  BadgeProps,
  TooltipProps,
  DropdownProps
} from './types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Re-export cn utility for convenience
export { cn } from '@/lib/utils';

// =============================================================================
// COMPONENT GROUPS FOR ORGANIZED IMPORTS
// =============================================================================

/**
 * Basic UI Components
 * For standard form elements and basic interactions
 */
// export const BasicComponents = {
//   Button,
//   Input,
//   Textarea,
//   Modal,
//   ConfirmModal,
//   Table,
//   SimpleTable,
// } as const;

/**
 * ClassFlow Components
 * Specialized components for drag-and-drop student management
 */
// export const ClassFlowComponents = {
//   DragHandle,
//   StudentCard,
//   ClassContainer,
//   LoadingPlaceholder,
//   StudentCardLoader,
//   ClassContainerLoader,
//   TableRowLoader,
// } as const;

// =============================================================================
// VERSION INFORMATION
// =============================================================================

/**
 * UI Library Version
 * Update this when making breaking changes to component APIs
 */
export const UI_VERSION = '1.0.0' as const;

/**
 * UI Library Metadata
 */
export const UI_METADATA = {
  version: UI_VERSION,
  lastUpdated: '2025-08-09',
  framework: 'React 19 + TypeScript',
  styling: 'TailwindCSS 4',
  designSystem: 'EduCanvas Design System',
  performance: {
    targetFPS: 60,
    maxStudents: 10000,
    virtualizationThreshold: 100,
  },
  accessibility: 'WCAG 2.1 AA Compliant',
} as const;

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Component Registry for Development and Testing
 * Useful for Storybook, documentation, and debugging
 */
export const COMPONENT_REGISTRY = {
  basic: [
    'Button',
    'Input', 
    'Textarea',
    'Modal',
    'ConfirmModal',
    'Table',
    'SimpleTable',
  ],
  classflow: [
    'DragHandle',
    'StudentCard', 
    'ClassContainer',
    'LoadingPlaceholder',
    'StudentCardLoader',
    'ClassContainerLoader',
    'TableRowLoader',
  ],
} as const;

/**
 * Check if component exists in registry
 */
export const hasComponent = (componentName: string): boolean => {
  return [
    ...COMPONENT_REGISTRY.basic,
    ...COMPONENT_REGISTRY.classflow,
  ].includes(componentName);
};

/**
 * Get component category
 */
export const getComponentCategory = (componentName: string): 'basic' | 'classflow' | null => {
  if (COMPONENT_REGISTRY.basic.includes(componentName)) return 'basic';
  if (COMPONENT_REGISTRY.classflow.includes(componentName)) return 'classflow';
  return null;
};

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

/**
 * Migration utilities for future UI library replacements
 * These help track component usage and breaking changes
 */
export const MIGRATION_UTILS = {
  /**
   * Get all exported component names
   */
  getComponentNames: () => [
    ...COMPONENT_REGISTRY.basic,
    ...COMPONENT_REGISTRY.classflow,
  ],
  
  /**
   * Check for breaking changes between versions
   */
  checkBreakingChanges: (fromVersion: string, toVersion: string) => {
    // Implementation for version compatibility checking
    console.warn(`Migration check: ${fromVersion} -> ${toVersion}`);
    return [];
  },
  
  /**
   * Generate component usage report
   */
  generateUsageReport: () => {
    // This would be implemented to scan codebase for component usage
    console.log('Generating component usage report...');
    return {
      totalComponents: COMPONENT_REGISTRY.basic.length + COMPONENT_REGISTRY.classflow.length,
      basicComponents: COMPONENT_REGISTRY.basic.length,
      classflowComponents: COMPONENT_REGISTRY.classflow.length,
    };
  },
} as const;

// =============================================================================
// EXAMPLES AND DOCUMENTATION
// =============================================================================

/**
 * Example Usage Patterns
 * 
 * @example
 * // Basic form with validation
 * import { Button, Input } from '@/components/ui';
 * 
 * <form>
 *   <Input
 *     label="Email"
 *     type="email"
 *     error={errors.email}
 *     required
 *   />
 *   <Button type="submit" loading={isSubmitting}>
 *     Submit
 *   </Button>
 * </form>
 * 
 * @example
 * // ClassFlow drag-and-drop
 * import { ClassContainer, StudentCard } from '@/components/ui';
 * 
 * <ClassContainer
 *   classData={classInfo}
 *   students={students}
 *   onStudentClick={handleStudentClick}
 *   variant="grid"
 * />
 * 
 * @example
 * // Data table with virtualization
 * import { Table } from '@/components/ui';
 * 
 * <Table
 *   data={largeDataset}
 *   columns={columns}
 *   virtualized
 *   height={400}
 *   selectable
 * />
 */