/**
 * @file useStaffs.ts (구 useInstructors.ts)
 * @description 직원 목록 조회를 위한 React Query Hook
 * @module T-V2-012 - API Client 표준화 적용
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import type { Instructor, InstructorFilters } from '@/types/staff.types'

/**
 * 직원 목록 조회 Hook
 */
interface UseStaffsOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  employment_type?: string
  department?: string
  sort_by?: string
  sort_order?: string
  enabled?: boolean
}

export function useStaffs(options: UseStaffsOptions = {}) {
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

  const filters = {
    tenantId,
    page,
    limit,
    search,
    status,
    employment_type,
    department,
    sort_by,
    sort_order
  }

  return useQuery({
    queryKey: [...queryKeys.staff(), 'list', filters],
    queryFn: () => {
      if (!tenantId) throw new Error('No tenant ID found')

      const params: Record<string, string | number> = {
        page,
        limit,
        sort_by,
        sort_order
      }

      if (search) params.search = search
      if (status) params.status = status
      if (employment_type) params.employment_type = employment_type
      if (department) params.department = department

      return apiClient.get<{ instructors: Instructor[], pagination: any }>('/api/staff', { params })
    },
    enabled: enabled && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
  })
}

/**
 * 활성 직원 목록 조회 Hook (간편 버전)
 */
export function useActiveStaffs() {
  return useStaffs({
    status: 'active',
    limit: 100,
  })
}

/**
 * 부서별 직원 목록 조회 Hook
 */
export function useStaffsByDepartment(department: string) {
  return useStaffs({
    department,
    status: 'active',
  })
}

/**
 * 단일 직원 조회 Hook
 */
export function useStaff(staffId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useQuery({
    queryKey: queryKeys.staffMember(staffId),
    queryFn: () => {
      if (!tenantId) throw new Error('No tenant ID found')
      return apiClient.get<{ instructor: Instructor }>(`/api/staff/${staffId}`)
    },
    enabled: enabled && !!tenantId && !!staffId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 직원 검색 Hook (검색 전용)
 */
export function useStaffSearch({
  tenantId,
  search,
  limit = 20,
  enabled = true
}: {
  tenantId: string
  search?: string
  limit?: number
  enabled?: boolean
}) {
  const filters = { tenantId, search, limit }

  return useQuery({
    queryKey: [...queryKeys.staff(), 'search', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {
        q: search || '',
        limit
      }

      return apiClient.get<{ instructors: Instructor[] }>('/api/staff/search', { params })
    },
    enabled: enabled && !!tenantId && !!search && search.length >= 2,
    staleTime: 2 * 60 * 1000, // 검색은 짧은 캐시
    gcTime: 5 * 60 * 1000,
  })
}

// 호환성을 위한 별칭
export const useInstructors = useStaffs
export const useActiveInstructors = useActiveStaffs
export const useInstructorsByDepartment = useStaffsByDepartment