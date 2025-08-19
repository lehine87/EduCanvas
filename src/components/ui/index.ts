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
export { Input } from './Input';
export type { InputProps } from './Input';

// Textarea Components
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

// Select Components
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './Select';
export type { SelectProps, SelectTriggerProps, SelectContentProps, SelectItemProps, SelectValueProps } from './Select';

// Label Components
export { Label } from './Label';
export type { LabelProps } from './Label';

// Card Components
export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

// Modal Components
export { Modal, ConfirmModal, AlertModal } from './Modal';
export type { ModalProps } from './Modal';

// Table Components
export { Table } from './Table';
export type { TableProps, TableColumn } from './Table';

// Badge Components
export { Badge, StatusBadge, CountBadge, TagBadge } from './Badge';
export type { BadgeProps, StatusBadgeProps, CountBadgeProps, TagBadgeProps } from './Badge';

// Loading Components
export { 
  Loading,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton
} from './Loading';
export type { LoadingProps, SkeletonProps, TableSkeletonProps, ListSkeletonProps } from './Loading';

// =============================================================================
// CLASSFLOW SPECIFIC COMPONENTS
// =============================================================================

// Student Card Component
export { StudentCard } from './StudentCard';
export type { StudentCardProps, ClassFlowStudent } from './StudentCard';

// Drop Zone Components
export { DropZone, ClassFlowDropZone } from './DropZone';
export type { DropZoneProps, ClassFlowDropZoneProps } from './DropZone';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Common Types and Interfaces
export type {
  BaseComponentProps,
  AccessibilityProps,
  ComponentSize,
  ComponentVariant
} from './types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Re-export cn utility for convenience
export { cn } from '@/utils/cn';

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
  lastUpdated: '2025-08-11',
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
    'Select',
    'Label',
    'Card',
    'Modal',
    'Table',
    'Badge',
    'Loading',
  ],
  classflow: [
    'StudentCard', 
    'DropZone',
    'ClassFlowDropZone',
  ],
} as const;

/**
 * Check if component exists in registry
 */
type ComponentName = typeof COMPONENT_REGISTRY.basic[number] | typeof COMPONENT_REGISTRY.classflow[number];

export const hasComponent = (componentName: string): componentName is ComponentName => {
  return (
    COMPONENT_REGISTRY.basic.includes(componentName as typeof COMPONENT_REGISTRY.basic[number]) ||
    COMPONENT_REGISTRY.classflow.includes(componentName as typeof COMPONENT_REGISTRY.classflow[number])
  );
};

/**
 * Get component category
 */
export const getComponentCategory = (componentName: string): 'basic' | 'classflow' | null => {
  if (COMPONENT_REGISTRY.basic.includes(componentName as typeof COMPONENT_REGISTRY.basic[number])) return 'basic';
  if (COMPONENT_REGISTRY.classflow.includes(componentName as typeof COMPONENT_REGISTRY.classflow[number])) return 'classflow';
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