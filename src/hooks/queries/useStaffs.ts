/**
 * @file useInstructors.ts
 * @description 강사 목록 조회를 위한 React Query Hook
 * @module T-V2-012
 */

import { useQuery } from '@tanstack/react-query'
import { fetchInstructors, type FetchInstructorsParams } from '@/lib/api/staff.api'
import { useAuthStore } from '@/store/useAuthStore'
import type { Instructor, InstructorFilters } from '@/types/staff.types'

// Query Keys
export const instructorKeys = {
  all: ['instructors'] as const,
  lists: () => [...instructorKeys.all, 'list'] as const,
  list: (filters: InstructorFilters) => [...instructorKeys.lists(), filters] as const,
  details: () => [...instructorKeys.all, 'detail'] as const,
  detail: (id: string) => [...instructorKeys.details(), id] as const,
}

/**
 * 강사 목록 조회 Hook
 */
interface UseInstructorsOptions extends Omit<FetchInstructorsParams, 'tenantId'> {
  enabled?: boolean
}

export function useInstructors(options: UseInstructorsOptions = {}) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  const {
    page = 1,
    limit = 20,
    search,
    status,
    employment_type,
    department,
    sort_by = 'name',
    sort_order = 'asc',
    enabled = true,
  } = options

  const filters: InstructorFilters = {
    search,
    status: status as any,
    employment_type: employment_type as any,
    department,
    sort_field: sort_by as any,
    sort_order: sort_order as any,
    limit,
  }

  return useQuery({
    queryKey: instructorKeys.list(filters),
    queryFn: ({ signal }) => {
      if (!tenantId) throw new Error('No tenant ID found')
      
      return fetchInstructors({
        tenantId,
        page,
        limit,
        search,
        status,
        employment_type,
        department,
        sort_by,
        sort_order,
        signal,
      })
    },
    enabled: enabled && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
    retry: (failureCount, error: any) => {
      // 인증 오류는 재시도하지 않음
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * 활성 강사 목록 조회 Hook (간편 버전)
 */
export function useActiveInstructors() {
  return useInstructors({
    status: 'active',
    limit: 100, // 대부분의 강사를 가져옴
  })
}

/**
 * 부서별 강사 목록 조회 Hook
 */
export function useInstructorsByDepartment(department: string) {
  return useInstructors({
    department,
    status: 'active',
  })
}

/**
 * 필터링된 강사 목록 조회 Hook (검색 사이드바용)
 */
export function useInstructorsWithFilters(filters: InstructorFilters = {}) {
  return useInstructors({
    search: filters.search,
    status: filters.status,
    employment_type: filters.employment_type,
    department: filters.department,
    sort_by: filters.sort_field || 'name',
    sort_order: filters.sort_order || 'asc',
    limit: filters.limit || 100, // 사이드바에서는 많은 수의 강사를 보여줌
  })
}