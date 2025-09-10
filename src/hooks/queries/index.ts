/**
 * @file index.ts
 * @description React Query hooks 통합 내보내기
 * @module T-V2-012
 */

// Staff Query Hooks
export * from './useStaffs'
export * from './useStaff' 
export * from './useCreateStaff'
export * from './useUpdateStaff'
export * from './useDeleteStaff'

// Alias exports for backward compatibility
export { useStaff as useInstructorDetail, useStaff as useInstructor } from './useStaff'
export { useStaffsWithFilters as useInstructorsWithFilters } from './useStaffs'
export { useStaffStats as useInstructorStats, useStaffSearch as useInstructorSearch } from './useStaff'

// Re-export types for convenience
export type { 
  Instructor, 
  InstructorFilters,
  CreateInstructorRequest,
  UpdateInstructorRequest 
} from '@/types/staff.types'