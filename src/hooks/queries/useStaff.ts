/**
 * @file useInstructor.ts
 * @description 강사 상세 조회를 위한 React Query Hook
 * @module T-V2-012
 */

import { useQuery } from '@tanstack/react-query'
import { fetchInstructorById } from '@/lib/api/staff.api'
import { instructorKeys } from './useStaffs'
import type { Instructor } from '@/types/staff.types'

/**
 * 강사 상세 조회 Hook
 */
interface UseInstructorOptions {
  enabled?: boolean
}

export function useInstructor(
  instructorId: string | undefined, 
  options: UseInstructorOptions = {}
) {
  const { enabled = true } = options

  return useQuery({
    queryKey: instructorKeys.detail(instructorId || ''),
    queryFn: ({ signal }) => {
      if (!instructorId) throw new Error('Instructor ID is required')
      return fetchInstructorById(instructorId, signal)
    },
    enabled: enabled && !!instructorId,
    staleTime: 2 * 60 * 1000, // 2분 (상세 정보는 더 자주 업데이트)
    gcTime: 5 * 60 * 1000, // 5분
    retry: (failureCount, error: any) => {
      // 404 에러는 재시도하지 않음 (강사가 삭제된 경우)
      if (error?.status === 404) {
        return false
      }
      // 인증 오류는 재시도하지 않음
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * 여러 강사 상세 정보를 동시에 조회하는 Hook
 */
export function useInstructors2(instructorIds: string[]) {
  return useQuery({
    queryKey: ['instructors-multiple', instructorIds],
    queryFn: async ({ signal }) => {
      const promises = instructorIds.map(id => fetchInstructorById(id, signal))
      const results = await Promise.allSettled(promises)
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value.instructor
        } else {
          console.warn(`Failed to fetch instructor ${instructorIds[index]}:`, result.reason)
          return null
        }
      }).filter(Boolean) as Instructor[]
    },
    enabled: instructorIds.length > 0,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

/**
 * 강사 기본 정보만 가져오는 경량 Hook
 */
export function useInstructorBasic(instructorId: string | undefined) {
  return useQuery({
    queryKey: [...instructorKeys.detail(instructorId || ''), 'basic'],
    queryFn: async ({ signal }) => {
      if (!instructorId) throw new Error('Instructor ID is required')
      
      const result = await fetchInstructorById(instructorId, signal)
      
      // 기본 정보만 추출
      return {
        id: result.instructor.id,
        name: result.instructor.user?.name,
        email: result.instructor.user?.email,
        phone: result.instructor.user?.phone,
        avatar_url: result.instructor.user?.avatar_url,
        department: (result.instructor.staff_info as any)?.department,
        position: (result.instructor.staff_info as any)?.position,
        employment_type: (result.instructor.staff_info as any)?.employment_type,
        status: result.instructor.status,
      }
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000, // 기본 정보는 더 오래 캐시
    select: (data) => data, // 이미 필터링된 데이터 반환
  })
}

/**
 * 강사 통계 정보 조회 Hook (상세 페이지용)
 */
export function useInstructorStats(instructorId: string | undefined) {
  return useQuery({
    queryKey: [...instructorKeys.detail(instructorId || ''), 'stats'],
    queryFn: async ({ signal }) => {
      if (!instructorId) throw new Error('Instructor ID is required')
      
      // 실제로는 별도 API 엔드포인트가 있을 것
      const result = await fetchInstructorById(instructorId, signal)
      
      // 현재는 기본 통계만 반환
      return {
        class_count: (result.instructor as any).stats?.class_count || 0,
        attendance_count: (result.instructor as any).stats?.attendance_count || 0,
        work_days_this_month: (result.instructor as any).stats?.work_days_this_month || 0,
        student_count: 0, // TODO: 실제 학생 수 조회
        avg_rating: 0, // TODO: 평균 평점 조회
      }
    },
    enabled: !!instructorId,
    staleTime: 1 * 60 * 1000, // 통계는 1분마다 갱신
  })
}

/**
 * 강사 검색 Hook (검색 사이드바용)
 */
export function useInstructorSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['instructors-search', query],
    queryFn: async ({ signal }) => {
      if (!query || query.length < 2) return { instructors: [] }
      
      // 실제로는 searchInstructors API 사용
      try {
        const { searchInstructors } = await import('@/lib/api/staff.api')
        const results = await searchInstructors(query, 20, signal)
        return { instructors: results }
      } catch (error) {
        console.warn('Search API not available, returning empty results')
        return { instructors: [] }
      }
    },
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30초
    retry: 1,
  })
}