import { useQuery, useInfiniteQuery, useQueryClient, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { fetchStudents, fetchStudentById, searchStudents } from '@/lib/api/students.api'
import { queryKeys } from '@/lib/react-query'
import type { Student, StudentFilters } from '@/types/student.types'
import type { PaginatedData } from '@/lib/api-response'

/**
 * 학생 목록 조회 Hook
 * 캐싱, 자동 재검증, 에러 처리가 포함된 업계 표준 구현
 */
export function useStudentsList(
  tenantId: string | undefined,
  filters?: Partial<StudentFilters>,
  options?: Omit<UseQueryOptions<PaginatedData<Student>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedData<Student>>({
    queryKey: queryKeys.list({ tenantId, ...filters }),
    queryFn: ({ signal }) => {
      if (!tenantId) throw new Error('Tenant ID is required')
      return fetchStudents({ tenantId, filters, signal })
    },
    enabled: !!tenantId,
    ...options
  })
}

/**
 * 학생 상세 조회 Hook
 */
export function useStudentDetail(
  studentId: string | undefined,
  tenantId: string | undefined,
  options?: Omit<UseQueryOptions<{ student: Student }>, 'queryKey' | 'queryFn'>
) {
  return useQuery<{ student: Student }>({
    queryKey: queryKeys.detail(studentId || ''),
    queryFn: ({ signal }) => {
      if (!studentId || !tenantId) throw new Error('Student ID and Tenant ID are required')
      return fetchStudentById(studentId, tenantId, signal)
    },
    enabled: !!studentId && !!tenantId,
    ...options
  })
}

/**
 * 학생 검색 Hook (실시간 검색용)
 */
export function useStudentsSearch(
  query: string,
  tenantId: string | undefined,
  options?: Omit<UseQueryOptions<Student[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Student[]>({
    queryKey: ['students', 'search', query, tenantId],
    queryFn: ({ signal }) => {
      if (!tenantId) throw new Error('Tenant ID is required')
      if (!query || query.length < 2) return []
      return searchStudents(query, tenantId, 20, signal)
    },
    enabled: !!tenantId && query.length >= 2,
    // 검색은 stale time을 짧게 설정
    staleTime: 30 * 1000, // 30초
    ...options
  })
}

// 무한 스크롤 Hook은 임시 제거 (타입 이슈 해결 후 추가)

/**
 * Prefetch 헬퍼 Hook
 * 학생 목록에서 hover 시 상세 정보를 미리 로드
 */
export function usePrefetchStudent() {
  const queryClient = useQueryClient()
  
  return (studentId: string, tenantId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.detail(studentId),
      queryFn: () => fetchStudentById(studentId, tenantId),
      staleTime: 5 * 60 * 1000, // 5분
    })
  }
}