/**
 * @file index.ts
 * @description React Query hooks 통합 내보내기
 * @module T-V2-012
 */

// Instructors Query Hooks
export * from './useInstructors'
export * from './useInstructor' 
export * from './useCreateInstructor'
export * from './useUpdateInstructor'
export * from './useDeleteInstructor'

// Alias exports for backward compatibility
export { useInstructor as useInstructorDetail } from './useInstructor'
export { useInstructorsWithFilters } from './useInstructors'
export { useInstructorStats, useInstructorSearch } from './useInstructor'

// Re-export types for convenience
export type { 
  Instructor, 
  InstructorFilters,
  CreateInstructorRequest,
  UpdateInstructorRequest 
} from '@/types/instructor.types'