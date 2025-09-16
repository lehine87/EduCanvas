import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys } from '@/lib/api-client'
import type { Class, ClassListResponse, ClassSearchParams } from '@/types/class.types'
import type { StandardApiResponse } from '@/lib/api-response'

// 클래스 목록 조회
export function useClasses({
  tenantId,
  search = '',
  status = 'all',
  instructor_id,
  subject_id,
  course_id,
  page = 0,
  limit = 50,
  sort_by = 'name',
  sort_order = 'asc',
  enabled = true
}: ClassSearchParams & {
  tenantId: string
  enabled?: boolean
}) {
  const filters = {
    tenantId,
    search,
    status,
    instructor_id,
    subject_id,
    course_id,
    page,
    limit,
    sort_by,
    sort_order
  }

  return useQuery({
    queryKey: queryKeys.classesList(filters),
    queryFn: async () => {
      // API는 StandardApiResponse 형식으로 반환
      const response = await apiClient.get<StandardApiResponse<{
        items: Class[],
        pagination: any,
        metadata: any
      }>>('/api/classes', {
        params: {
          search: search || undefined,
          status: status !== 'all' ? status : undefined,
          instructor_id: instructor_id || undefined,
          subject_id: subject_id || undefined,
          course_id: course_id || undefined,
          page,
          limit,
          sort_by,
          sort_order
        }
      })
      return response
    },
    enabled: enabled && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
    select: (response) => ({
      items: response.data.items || [],
      pagination: response.data.pagination,
      metadata: response.data.metadata
    })
  })
}

// 단일 클래스 조회
export function useClass(classId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.class(classId),
    queryFn: () => apiClient.get<StandardApiResponse<{ class: Class }>>(`/api/classes/${classId}`),
    enabled: enabled && !!classId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (response) => response.data.class
  })
}

// 클래스 검색 (검색 전용)
export function useClassSearch({
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
    queryKey: queryKeys.classesSearch(filters),
    queryFn: () => apiClient.get<StandardApiResponse<{ classes: Class[], total: number }>>('/api/classes/search', {
      params: {
        tenantId,
        search: search || undefined,
        limit
      }
    }),
    enabled: enabled && !!tenantId && !!search && search.length >= 2,
    staleTime: 2 * 60 * 1000, // 2분 (검색은 짧은 캐시)
    gcTime: 5 * 60 * 1000,
    select: (response) => response.data
  })
}

// 클래스별 대시보드 통계
export function useClassesDashboardStats(tenantId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.classesDashboardStats(),
    queryFn: () => apiClient.get<StandardApiResponse<any>>(`/api/classes/dashboard-stats`, {
      params: { tenantId }
    }),
    enabled: enabled && !!tenantId,
    staleTime: 10 * 60 * 1000, // 10분 (통계는 긴 캐시)
    gcTime: 30 * 60 * 1000, // 30분
    select: (response) => response.data
  })
}

// 강사별 클래스 목록 조회
export function useClassesByInstructor({
  tenantId,
  instructorId,
  enabled = true
}: {
  tenantId: string
  instructorId: string
  enabled?: boolean
}) {
  const filters = { tenantId, instructorId }

  return useQuery({
    queryKey: queryKeys.classesList(filters),
    queryFn: () => apiClient.get<StandardApiResponse<{
      items: Class[],
      pagination: any,
      metadata: any
    }>>('/api/classes', {
      params: {
        tenantId,
        instructor_id: instructorId,
        limit: 100 // 강사별 조회는 모든 클래스 가져오기
      }
    }),
    enabled: enabled && !!tenantId && !!instructorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (response) => response.data
  })
}

// 활성 클래스 목록만 조회 (간단한 선택 옵션용)
export function useActiveClassesOptions(tenantId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const filters = { tenantId, status: 'active', simple: true }

  return useQuery({
    queryKey: queryKeys.classesList(filters),
    queryFn: () => apiClient.get<StandardApiResponse<{ classes: Pick<Class, 'id' | 'name' | 'subject' | 'grade'>[] }>>('/api/classes', {
      params: {
        tenantId,
        status: 'active',
        limit: 1000,
        fields: 'id,name,subject,grade' // 필요한 필드만 조회
      }
    }),
    enabled: enabled && !!tenantId,
    staleTime: 10 * 60 * 1000, // 옵션 데이터는 긴 캐시
    gcTime: 30 * 60 * 1000,
    select: (response) => response.data.classes
  })
}