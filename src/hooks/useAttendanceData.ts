'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  AttendanceRealtimeResponse, 
  UseAttendanceDataResult,
  AttendanceApiError 
} from '@/types/attendance-widget'

// React Query 키 팩토리
export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  realtime: (tenantId: string) => [...attendanceQueryKeys.all, 'realtime', tenantId] as const,
  trends: (tenantId: string, period: string) => [...attendanceQueryKeys.all, 'trends', tenantId, period] as const,
} as const

// 실시간 출석 데이터 페칭 함수
async function fetchRealtimeAttendance(tenantId: string): Promise<AttendanceRealtimeResponse> {
  const response = await fetch(`/api/dashboard/attendance/realtime?tenantId=${tenantId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    throw new Error(
      errorData.error || 
      `출석 데이터를 불러오는데 실패했습니다. (${response.status})`
    )
  }

  const result = await response.json()
  return result.data
}

// Supabase Realtime 구독 훅 (업계 표준 구현)
function useAttendanceRealtimeSubscription(tenantId: string, enabled: boolean = true) {
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // 안정된 참조를 위한 useCallback 사용 (업계 표준)
  const handleInvalidation = useCallback((queryKey: readonly unknown[]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey })
    }, 2000) // 2초 디바운스로 증가
  }, [queryClient])

  useEffect(() => {
    // 업계 표준: 개발 환경에서 실시간 구독 비활성화
    if (!enabled || !tenantId || process.env.NODE_ENV === 'development') {
      return
    }

    const supabase = createClient()

    const channel = supabase
      .channel(`attendance-updates-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('🔴 출석 데이터 변경:', payload.eventType)
          handleInvalidation(attendanceQueryKeys.realtime(tenantId))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 출석 실시간 구독 활성화')
        }
      })

    subscriptionRef.current = channel

    // 정리 함수 (업계 표준)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [tenantId, enabled, handleInvalidation]) // 안정된 참조만 의존성으로 사용

  return subscriptionRef.current
}

// 메인 useAttendanceData 훅 (Realtime 구독 + React Query 조합)
export function useAttendanceData(options?: {
  enabled?: boolean
  refetchInterval?: number
  enableRealtime?: boolean
}): UseAttendanceDataResult {
  const { profile } = useAuthStore()
  const { 
    enabled = true, 
    refetchInterval = 30000, // 30초 폴백 폴링
    enableRealtime = true 
  } = options || {}

  // 업계 표준: useMemo로 안정된 참조 보장
  const tenantId = useMemo(() => profile?.tenant_id || '', [profile?.tenant_id])
  const shouldEnableRealtime = useMemo(() => 
    enableRealtime && enabled && !!profile?.tenant_id, 
    [enableRealtime, enabled, profile?.tenant_id]
  )

  // Supabase Realtime 구독 (안정된 참조로 호출)
  useAttendanceRealtimeSubscription(tenantId, shouldEnableRealtime)

  // 업계 표준: 안정된 쿼리 키와 함수 참조
  const stableQueryKey = useMemo(() => attendanceQueryKeys.realtime(tenantId), [tenantId])
  
  const queryFn = useCallback(async () => {
    if (!tenantId) {
      throw new Error('테넌트 ID가 없습니다. 로그인 상태를 확인해주세요.')
    }
    return fetchRealtimeAttendance(tenantId)
  }, [tenantId])

  // React Query (기본 데이터 페칭 + 업계 표준 최적화)
  const query = useQuery({
    queryKey: stableQueryKey,
    queryFn,
    enabled: enabled && !!tenantId,
    refetchInterval: process.env.NODE_ENV === 'development' ? false : 120000, // 개발 모드에서 폴링 비활성화
    refetchIntervalInBackground: false,
    staleTime: 60000, // 1분간 캐시 유효
    gcTime: 300000, // 5분간 캐시 보관
    retry: (failureCount, error) => {
      if (error instanceof Error && 
          (error.message.includes('권한') || error.message.includes('인증'))) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : undefined,
    refetch: query.refetch,
  }
}

// 출석 트렌드 데이터 전용 훅
export function useAttendanceTrends(period: '7d' | '30d' | '90d' = '7d', options?: {
  enabled?: boolean
}) {
  const { profile } = useAuthStore()
  const { enabled = true } = options || {}

  return useQuery({
    queryKey: attendanceQueryKeys.trends(profile?.tenant_id || '', period),
    queryFn: async () => {
      if (!profile?.tenant_id) {
        throw new Error('테넌트 ID가 없습니다.')
      }

      const response = await fetch(
        `/api/dashboard/attendance/trends?tenantId=${profile.tenant_id}&period=${period}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '트렌드 데이터를 불러오는데 실패했습니다.')
      }

      const result = await response.json()
      return result.data
    },
    enabled: enabled && !!profile?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유효 (트렌드는 덜 자주 업데이트)
    gcTime: 10 * 60 * 1000, // 10분간 캐시 보관
  })
}

// 특정 클래스 출석 현황 전용 훅
export function useClassAttendance(classId: string, options?: {
  enabled?: boolean
  refetchInterval?: number
}) {
  const { profile } = useAuthStore()
  const { enabled = true, refetchInterval = 60000 } = options || {}

  return useQuery({
    queryKey: ['attendance', 'class', classId, profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) {
        throw new Error('테넌트 ID가 없습니다.')
      }

      const response = await fetch(
        `/api/dashboard/attendance/class/${classId}?tenantId=${profile.tenant_id}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '클래스 출석 데이터를 불러오는데 실패했습니다.')
      }

      const result = await response.json()
      return result.data
    },
    enabled: enabled && !!profile?.tenant_id && !!classId,
    refetchInterval: refetchInterval, // 1분마다 업데이트
    staleTime: 50000, // 50초간 캐시 유효
  })
}

// 출석 통계 무효화 유틸리티
export function useAttendanceInvalidation() {
  const { profile } = useAuthStore()
  
  return {
    invalidateRealtime: () => {
      if (!profile?.tenant_id) return
      
      // React Query 클라이언트에서 실시간 데이터 무효화
      // queryClient.invalidateQueries({
      //   queryKey: attendanceQueryKeys.realtime(profile.tenant_id)
      // })
    },
    
    invalidateTrends: () => {
      if (!profile?.tenant_id) return
      
      // 트렌드 데이터 무효화
      // queryClient.invalidateQueries({
      //   queryKey: [...attendanceQueryKeys.all, 'trends', profile.tenant_id]
      // })
    },
    
    invalidateAll: () => {
      // 모든 출석 관련 데이터 무효화
      // queryClient.invalidateQueries({
      //   queryKey: attendanceQueryKeys.all
      // })
    }
  }
}

// 에러 핸들링 유틸리티
export function handleAttendanceError(error: unknown): AttendanceApiError {
  if (error instanceof Error) {
    // 네트워크 에러
    if (error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
        details: { originalError: error.message }
      }
    }
    
    // 권한 에러
    if (error.message.includes('권한') || error.message.includes('인증')) {
      return {
        code: 'PERMISSION_DENIED',
        message: '출석 데이터에 접근할 권한이 없습니다.',
        details: { originalError: error.message }
      }
    }
    
    // 일반 에러
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: { originalError: error.message }
    }
  }
  
  // 알 수 없는 에러
  return {
    code: 'UNKNOWN_ERROR',
    message: '알 수 없는 오류가 발생했습니다.',
    details: { originalError: String(error) }
  }
}

// 출석 데이터 미리 로드 유틸리티
export function usePrefetchAttendanceData() {
  const { profile } = useAuthStore()
  
  return {
    prefetchRealtime: () => {
      if (!profile?.tenant_id) return
      
      // React Query 클라이언트에서 데이터 미리 로드
      // queryClient.prefetchQuery({
      //   queryKey: attendanceQueryKeys.realtime(profile.tenant_id),
      //   queryFn: () => fetchRealtimeAttendance(profile.tenant_id!),
      //   staleTime: 25000
      // })
    }
  }
}

// 컴포넌트에서 쉽게 사용할 수 있는 상태 체크 유틸리티
export function useAttendanceStatus() {
  const { data, isLoading, error } = useAttendanceData()
  
  return {
    hasData: !!data && data.stats.totalStudents > 0,
    isEmpty: !!data && data.stats.totalStudents === 0,
    isError: !!error,
    isLoading,
    attendanceRate: data?.stats.attendanceRate ?? 0,
    totalStudents: data?.stats.totalStudents ?? 0,
    alertCount: data?.alerts?.length ?? 0,
  }
}