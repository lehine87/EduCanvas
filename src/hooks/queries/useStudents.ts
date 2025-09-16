'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys } from '@/lib/api-client'
import type { Student, StudentFilters } from '@/types/student.types'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * 학생 목록 조회 훅 - API Client 패턴 적용
 */
interface UseStudentsOptions {
  page?: number
  limit?: number
  search?: string
  status?: string[]
  class_id?: string[]
  grade_level?: string
  sort_by?: string
  sort_order?: string
  enabled?: boolean
}

export function useStudents(options: UseStudentsOptions = {}) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  const {
    page = 0,
    limit = 50,
    search,
    status,
    class_id,
    grade_level,
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
    class_id,
    grade_level,
    sort_by,
    sort_order
  }

  return useQuery({
    queryKey: [...queryKeys.students(), 'list', filters],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required')

      const params: Record<string, string | number> = {
        limit,
        offset: page * limit,
        sort_by,
        sort_order
      }

      if (search) params.search = search
      if (status && status.length > 0 && !['all', ''].includes(status[0])) {
        params.status = status[0]
      }
      if (class_id && class_id.length > 0) {
        params.class_id = class_id[0]
      }
      if (grade_level) params.grade_level = grade_level

      return apiClient.get<{ students: Student[], pagination: any }>('/api/students', { params })
    },
    enabled: enabled && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000, // 10분 보관
  })
}

/**
 * 고도화된 학생 필터링 훅
 */
export function useStudentsWithFilters(filters: StudentFilters = {}) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useQuery({
    queryKey: [...queryKeys.students(), 'filtered', filters],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required')

      const params: Record<string, string | number> = {
        limit: filters.limit || 100,
        offset: filters.offset || 0
      }

      if (filters.search) params.search = filters.search
      if (filters.status && filters.status.length > 0) {
        params.status = filters.status[0]
      }
      if (filters.class_id && filters.class_id.length > 0) {
        params.class_id = filters.class_id[0]
      }
      if (filters.grade_level) params.grade_level = filters.grade_level
      if (filters.sort_field) params.sort_by = filters.sort_field
      if (filters.sort_order) params.sort_order = filters.sort_order

      return apiClient.get<{ students: Student[], pagination: any }>('/api/students', { params })
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 단일 학생 조회 훅
 */
export function useStudent(studentId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useQuery({
    queryKey: queryKeys.student(studentId),
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required')
      return apiClient.get<{ student: Student }>(`/api/students/${studentId}`, {
        params: { tenantId }
      })
    },
    enabled: enabled && !!tenantId && !!studentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 학생 검색 훅 (검색 전용)
 */
export function useStudentSearch({
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
    queryKey: [...queryKeys.students(), 'search', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {
        search: search || '',
        limit
      }

      return apiClient.get<{ students: Student[] }>('/api/students/search', { params })
    },
    enabled: enabled && !!tenantId && !!search && search.length >= 2,
    staleTime: 2 * 60 * 1000, // 검색은 짧은 캐시
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * 활성 학생 목록 조회 (간편 버전)
 */
export function useActiveStudents() {
  return useStudents({
    status: ['active'],
    limit: 100,
  })
}

/**
 * 학급별 학생 목록 조회
 */
export function useStudentsByClass(classId: string) {
  return useStudents({
    class_id: [classId],
    status: ['active'],
  })
}

/**
 * 학년별 학생 목록 조회
 */
export function useStudentsByGrade(gradeLevel: string) {
  return useStudents({
    grade_level: gradeLevel,
    status: ['active'],
  })
}

/**
 * 학생 대시보드 통계 조회 훅
 */
export function useStudentDashboardStats() {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useQuery({
    queryKey: queryKeys.studentsDashboardStats(),
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required')

      return apiClient.get<{
        total_students: number
        active_students: number
        inactive_students: number
        graduated_students: number
        withdrawn_students: number
        suspended_students: number
        new_registrations_this_month: number
      }>('/api/students/dashboard-stats', {
        params: { tenantId }
      })
    },
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000, // 10분 캐싱 - 통계는 자주 변하지 않음
    gcTime: 30 * 60 * 1000, // 30분 보관
  })
}