/**
 * @file useStaffCache.ts
 * @description 직원 관리 고도화된 캐싱 전략
 * @module T-V2-012 Day 5
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { instructorQueryKeys } from '@/lib/react-query'
import { fetchInstructors, fetchInstructorById } from '@/lib/api/staff.api'
import type { Instructor, InstructorFilters } from '@/types/staff.types'

/**
 * 고도화된 직원 캐싱 전략
 * 
 * 성능 최적화:
 * - 지능형 프리패칭 (Intelligent Prefetching)
 * - 적응적 캐시 만료 (Adaptive Cache Expiration)
 * - 부분 업데이트 최적화 (Partial Update Optimization)
 * - 메모리 사용량 모니터링
 */

interface UseStaffCacheOptions {
  enablePrefetching?: boolean
  enableMemoryOptimization?: boolean
  cacheStrategy?: 'aggressive' | 'balanced' | 'minimal'
}

interface CacheMetrics {
  hitCount: number
  missCount: number
  memoryUsage: number
  lastAccessed: Date
}

const CACHE_STRATEGIES = {
  aggressive: {
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000,   // 30분
    prefetchThreshold: 5,      // 5초 전에 프리패치
  },
  balanced: {
    staleTime: 5 * 60 * 1000,  // 5분
    gcTime: 15 * 60 * 1000,   // 15분
    prefetchThreshold: 3,      // 3초 전에 프리패치
  },
  minimal: {
    staleTime: 2 * 60 * 1000,  // 2분
    gcTime: 5 * 60 * 1000,    // 5분
    prefetchThreshold: 1,      // 1초 전에 프리패치
  },
}

/**
 * 지능형 직원 목록 캐싱 Hook
 */
export function useStaffListCache(
  filters?: InstructorFilters,
  options: UseStaffCacheOptions = {}
) {
  const queryClient = useQueryClient()
  const {
    enablePrefetching = true,
    enableMemoryOptimization = true,
    cacheStrategy = 'balanced'
  } = options

  const strategy = CACHE_STRATEGIES[cacheStrategy]

  // 필터 기반 캐시 키 생성
  const cacheKey = useMemo(() => {
    return instructorQueryKeys.lists(filters)
  }, [filters])

  // 메모리 사용량 모니터링
  const cacheMetrics = useMemo((): CacheMetrics => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    const staffQueries = queries.filter(q => 
      q.queryKey[0] === 'instructors'
    )

    return {
      hitCount: staffQueries.reduce((acc, q) => acc + (q as any).fetchCount || 0, 0),
      missCount: staffQueries.reduce((acc, q) => acc + (q as any).errorCount || 0, 0),
      memoryUsage: staffQueries.length * 1024, // 대략적인 추정
      lastAccessed: new Date()
    }
  }, [queryClient])

  // 지능형 프리패칭 로직
  const prefetchRelatedData = useCallback(async (instructors: Instructor[]) => {
    if (!enablePrefetching) return

    // 상위 3개 직원의 상세 정보 프리패치
    const topInstructors = instructors.slice(0, 3)
    
    const prefetchPromises = topInstructors.map(instructor =>
      queryClient.prefetchQuery({
        queryKey: instructorQueryKeys.detail(instructor.id),
        queryFn: () => fetchInstructorById(instructor.id),
        staleTime: strategy.staleTime,
        gcTime: strategy.gcTime,
      })
    )

    try {
      await Promise.allSettled(prefetchPromises)
      console.log('🚀 [StaffCache] 프리패치 완료:', topInstructors.length, '개 항목')
    } catch (error) {
      console.warn('⚠️ [StaffCache] 프리패치 실패:', error)
    }
  }, [queryClient, enablePrefetching, strategy])

  // 메모리 최적화 함수
  const optimizeMemory = useCallback(() => {
    if (!enableMemoryOptimization) return

    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 30분 이상 사용되지 않은 직원 상세 캐시 제거
    const cutoffTime = Date.now() - (30 * 60 * 1000)
    
    queries.forEach(query => {
      if (
        query.queryKey[0] === 'instructors' &&
        query.queryKey[1] === 'detail' &&
        query.state.dataUpdatedAt < cutoffTime
      ) {
        queryClient.removeQueries({ queryKey: query.queryKey })
      }
    })

    console.log('🧹 [StaffCache] 메모리 최적화 완료')
  }, [queryClient, enableMemoryOptimization])

  // 주 쿼리 설정
  const queryOptions: UseQueryOptions<any, Error> = {
    queryKey: cacheKey,
    queryFn: ({ signal }) => fetchInstructors(filters, signal),
    staleTime: strategy.staleTime,
    gcTime: strategy.gcTime,
    retry: (failureCount, error: any) => {
      // 네트워크 에러는 재시도, 인증 에러는 재시도 안함
      if (error?.status === 401 || error?.status === 403) return false
      return failureCount < 3
    },
    refetchOnWindowFocus: false, // 불필요한 리패치 방지
    refetchOnMount: true,
    select: (data) => {
      // 데이터 정규화 및 최적화
      if (!data?.instructors) return data

      const optimizedInstructors = data.instructors.map((instructor: Instructor) => ({
        ...instructor,
        // 자주 사용되는 필드들 미리 계산
        displayName: instructor.user?.name || '이름 없음',
        statusText: getStatusText(instructor.status || 'active'),
        employeeId: (instructor.staff_info as any)?.employee_id || '사번 없음',
      }))

      return {
        ...data,
        instructors: optimizedInstructors
      }
    },
    onSuccess: (data) => {
      // 성공적으로 데이터를 받아온 경우 프리패칭 실행
      if (data?.instructors) {
        prefetchRelatedData(data.instructors)
      }
    },
  }

  const query = useQuery(queryOptions)

  // 캐시 관리 함수들
  const cacheUtils = useMemo(() => ({
    // 수동 캐시 무효화
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: instructorQueryKeys.all })
    },

    // 특정 직원 캐시 업데이트
    updateInstructor: (instructorId: string, updates: Partial<Instructor>) => {
      queryClient.setQueryData(cacheKey, (oldData: any) => {
        if (!oldData?.instructors) return oldData

        return {
          ...oldData,
          instructors: oldData.instructors.map((instructor: Instructor) =>
            instructor.id === instructorId ? { ...instructor, ...updates } : instructor
          )
        }
      })
    },

    // 캐시에서 직원 제거
    removeInstructor: (instructorId: string) => {
      queryClient.setQueryData(cacheKey, (oldData: any) => {
        if (!oldData?.instructors) return oldData

        return {
          ...oldData,
          instructors: oldData.instructors.filter(
            (instructor: Instructor) => instructor.id !== instructorId
          ),
          pagination: {
            ...oldData.pagination,
            total: Math.max(0, oldData.pagination.total - 1)
          }
        }
      })
    },

    // 메모리 정리
    cleanup: optimizeMemory,

    // 캐시 메트릭 조회
    getMetrics: () => cacheMetrics,

    // 프리패치 강제 실행
    forcePrefetch: (instructors: Instructor[]) => prefetchRelatedData(instructors),
  }), [queryClient, cacheKey, optimizeMemory, cacheMetrics, prefetchRelatedData])

  return {
    ...query,
    cacheUtils,
    metrics: cacheMetrics,
    strategy: cacheStrategy,
  }
}

/**
 * 적응적 직원 상세 캐싱 Hook
 */
export function useStaffDetailCache(
  instructorId: string | undefined,
  options: UseStaffCacheOptions = {}
) {
  const queryClient = useQueryClient()
  const { cacheStrategy = 'balanced' } = options
  const strategy = CACHE_STRATEGIES[cacheStrategy]

  return useQuery({
    queryKey: instructorQueryKeys.detail(instructorId || ''),
    queryFn: ({ signal }) => {
      if (!instructorId) throw new Error('Instructor ID is required')
      return fetchInstructorById(instructorId, signal)
    },
    enabled: !!instructorId,
    staleTime: strategy.staleTime,
    gcTime: strategy.gcTime,
    retry: 2,
    select: (data) => {
      // 상세 데이터 최적화
      if (!data?.instructor) return data

      return {
        ...data,
        instructor: {
          ...data.instructor,
          displayName: data.instructor.user?.name || '이름 없음',
          statusText: getStatusText(data.instructor.status || 'active'),
        }
      }
    },
    onSuccess: (data) => {
      // 목록 캐시에 상세 정보 백필
      if (data?.instructor) {
        queryClient.setQueryData(
          instructorQueryKeys.lists(),
          (oldData: any) => {
            if (!oldData?.instructors) return oldData

            return {
              ...oldData,
              instructors: oldData.instructors.map((instructor: Instructor) =>
                instructor.id === data.instructor.id 
                  ? { ...instructor, ...data.instructor }
                  : instructor
              )
            }
          }
        )
      }
    },
  })
}

/**
 * 캐시 성능 모니터링 Hook
 */
export function useStaffCacheMetrics() {
  const queryClient = useQueryClient()

  return useMemo(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    const staffQueries = queries.filter(q => 
      Array.isArray(q.queryKey) && q.queryKey[0] === 'instructors'
    )

    const metrics = {
      totalQueries: staffQueries.length,
      activeQueries: staffQueries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: staffQueries.filter(q => q.isStale()).length,
      errorQueries: staffQueries.filter(q => q.state.status === 'error').length,
      memoryEstimate: staffQueries.length * 2048, // KB 단위 추정
      hitRate: 0, // 실제 구현에서는 더 정확한 계산 필요
    }

    return metrics
  }, [queryClient])
}

/**
 * 상태 텍스트 변환 헬퍼
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'active': return '활성'
    case 'inactive': return '비활성'  
    case 'pending': return '대기중'
    default: return status
  }
}

/**
 * 사용법:
 * 
 * function StaffList() {
 *   const { 
 *     data, 
 *     isLoading, 
 *     cacheUtils, 
 *     metrics 
 *   } = useStaffListCache(filters, {
 *     cacheStrategy: 'aggressive',
 *     enablePrefetching: true,
 *     enableMemoryOptimization: true
 *   })
 *   
 *   // 캐시 메트릭 확인
 *   console.log('Cache hit rate:', metrics.hitCount)
 *   
 *   return <div>...</div>
 * }
 */