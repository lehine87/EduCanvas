import { QueryClient } from '@tanstack/react-query'

/**
 * React Query 기본 설정
 * 업계 표준 캐싱 전략 적용
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 데이터가 stale 상태가 되는 시간 (5분)
      staleTime: 5 * 60 * 1000,
      
      // 캐시에서 완전히 제거되는 시간 (10분)
      gcTime: 10 * 60 * 1000,
      
      // 재시도 횟수 (3회)
      retry: 3,
      
      // 재시도 지연 시간 (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // 윈도우 포커스 시 자동 refetch 비활성화
      refetchOnWindowFocus: false,
      
      // 재연결 시 자동 refetch
      refetchOnReconnect: 'always',
    },
    mutations: {
      // mutation 재시도 (1회만)
      retry: 1,
      
      // mutation 재시도 지연
      retryDelay: 1000,
    },
  },
})

/**
 * 🚀 성능 최적화: 대시보드 전용 캐시 설정
 * 대시보드 데이터는 자주 업데이트되므로 더 짧은 캐시 시간 적용
 */
export const dashboardQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 대시보드 데이터는 30초마다 stale 상태
      staleTime: 30 * 1000,
      
      // 캐시에서 2분 후 제거
      gcTime: 2 * 60 * 1000,
      
      // 빠른 재시도 (2회)
      retry: 2,
      
      // 짧은 재시도 지연
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
      
      // 포커스시 자동 새로고침 (대시보드는 최신 데이터 중요)
      refetchOnWindowFocus: true,
      
      // 재연결시 즉시 새로고침
      refetchOnReconnect: true,
      
      // 백그라운드에서 자동 새로고침 (1분마다)
      refetchInterval: 60 * 1000,
      
      // 탭이 활성화되어있을 때만 백그라운드 새로고침
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 500,
    },
  },
})

/**
 * Query Key 팩토리 - 확장된 학생 모듈용
 * 일관된 쿼리 키 관리를 위한 헬퍼
 */
export const studentQueryKeys = {
  // 전체 학생 관련 쿼리
  all: ['students'] as const,
  
  // 목록 쿼리 (필터별)
  lists: () => [...studentQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => 
    [...studentQueryKeys.lists(), filters] as const,
    
  // 고도화된 필터링 쿼리 (T-V2-009)
  listsWithFilters: () => [...studentQueryKeys.all, 'listWithFilters'] as const,
  listWithFilters: (filters: Record<string, any>) => 
    [...studentQueryKeys.listsWithFilters(), filters] as const,
  
  // 개별 학생 쿼리
  details: () => [...studentQueryKeys.all, 'detail'] as const,
  detail: (id: string, options?: Record<string, any>) => 
    [...studentQueryKeys.details(), id, options] as const,
  
  // 검색 쿼리
  searches: () => [...studentQueryKeys.all, 'search'] as const,
  search: (query: string, filters?: Record<string, any>) => 
    [...studentQueryKeys.searches(), query, filters] as const,
  
  // 통계 쿼리
  stats: () => [...studentQueryKeys.all, 'stats'] as const,
  
  // 자동완성 쿼리
  autocomplete: (query: string) => 
    [...studentQueryKeys.all, 'autocomplete', query] as const,
  
  // 무한 스크롤 쿼리 (Phase 3 대비)
  infinite: (filters?: Record<string, any>) => 
    [...studentQueryKeys.all, 'infinite', filters] as const,
} as const

// 기존 호환성을 위한 별칭
export const queryKeys = studentQueryKeys

/**
 * Query Key 팩토리 - 강사 모듈용
 * 일관된 쿼리 키 관리를 위한 헬퍼
 */
export const instructorQueryKeys = {
  // 전체 강사 관련 쿼리
  all: ['instructors'] as const,
  
  // 목록 쿼리 (필터별)
  lists: () => [...instructorQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => 
    [...instructorQueryKeys.lists(), filters] as const,
    
  // 고도화된 필터링 쿼리
  listsWithFilters: () => [...instructorQueryKeys.all, 'listWithFilters'] as const,
  listWithFilters: (filters: Record<string, any>) => 
    [...instructorQueryKeys.listsWithFilters(), filters] as const,
  
  // 개별 강사 쿼리
  details: () => [...instructorQueryKeys.all, 'detail'] as const,
  detail: (id: string, options?: Record<string, any>) => 
    [...instructorQueryKeys.details(), id, options] as const,
  
  // 검색 쿼리
  searches: () => [...instructorQueryKeys.all, 'search'] as const,
  search: (query: string, filters?: Record<string, any>) => 
    [...instructorQueryKeys.searches(), query, filters] as const,
  
  // 통계 쿼리
  stats: () => [...instructorQueryKeys.all, 'stats'] as const,
  
  // 자동완성 쿼리
  autocomplete: (query: string) => 
    [...instructorQueryKeys.all, 'autocomplete', query] as const,
  
  // 무한 스크롤 쿼리
  infinite: (filters?: Record<string, any>) => 
    [...instructorQueryKeys.all, 'infinite', filters] as const,
} as const

/**
 * 🚀 성능 최적화: 대시보드 전용 쿼리 키
 */
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: (tenantId: string) => [...dashboardQueryKeys.all, 'stats', tenantId] as const,
  attendance: (tenantId: string) => [...dashboardQueryKeys.all, 'attendance', tenantId] as const,
  insights: (tenantId: string) => [...dashboardQueryKeys.all, 'insights', tenantId] as const,
  revenue: (tenantId: string) => [...dashboardQueryKeys.all, 'revenue', tenantId] as const,
  alerts: (tenantId: string) => [...dashboardQueryKeys.all, 'alerts', tenantId] as const,
} as const

/**
 * 캐시 무효화 헬퍼 함수 - 확장된 학생 모듈용
 */
export const studentCacheUtils = {
  // 전체 학생 캐시 무효화
  invalidateAllStudents: () => {
    return queryClient.invalidateQueries({ 
      queryKey: studentQueryKeys.all 
    })
  },
  
  // 학생 목록 캐시 무효화
  invalidateStudentsList: () => {
    return queryClient.invalidateQueries({ 
      queryKey: studentQueryKeys.lists() 
    })
  },
  
  // 특정 학생 상세 캐시 무효화
  invalidateStudentDetail: (studentId: string) => {
    return queryClient.invalidateQueries({ 
      queryKey: studentQueryKeys.details(),
      predicate: (query) => {
        const [, , , id] = query.queryKey
        return id === studentId
      }
    })
  },
  
  // 검색 캐시 무효화
  invalidateStudentSearches: () => {
    return queryClient.invalidateQueries({ 
      queryKey: studentQueryKeys.searches() 
    })
  },
  
  // 통계 캐시 무효화
  invalidateStudentStats: () => {
    return queryClient.invalidateQueries({ 
      queryKey: studentQueryKeys.stats() 
    })
  },
  
  // 특정 학생 데이터를 캐시에 직접 설정 (Optimistic Updates용)
  setStudentInCache: (studentId: string, studentData: any) => {
    queryClient.setQueryData(
      studentQueryKeys.detail(studentId),
      studentData
    )
    
    // 목록 캐시도 업데이트
    queryClient.setQueriesData(
      { queryKey: studentQueryKeys.lists() },
      (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          items: oldData.items?.map((item: any) => 
            item.id === studentId ? { ...item, ...studentData } : item
          ) || []
        }
      }
    )
  },
  
  // 새 학생을 목록 캐시에 추가
  addStudentToCache: (newStudent: any) => {
    queryClient.setQueriesData(
      { queryKey: studentQueryKeys.lists() },
      (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          items: [newStudent, ...(oldData.items || [])],
          pagination: {
            ...oldData.pagination,
            total_count: (oldData.pagination?.total_count || 0) + 1
          }
        }
      }
    )
  },
  
  // 캐시에서 학생 제거
  removeStudentFromCache: (studentId: string) => {
    // 상세 캐시 제거
    queryClient.removeQueries({ 
      queryKey: studentQueryKeys.detail(studentId) 
    })
    
    // 목록 캐시에서 제거
    queryClient.setQueriesData(
      { queryKey: studentQueryKeys.lists() },
      (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          items: oldData.items?.filter((item: any) => item.id !== studentId) || [],
          pagination: {
            ...oldData.pagination,
            total_count: Math.max((oldData.pagination?.total_count || 1) - 1, 0)
          }
        }
      }
    )
  }
}

// 기존 호환성을 위한 별칭
export const invalidateQueries = {
  all: studentCacheUtils.invalidateAllStudents,
  lists: studentCacheUtils.invalidateStudentsList,
  detail: studentCacheUtils.invalidateStudentDetail,
} as const

/**
 * 🚀 성능 최적화: 대시보드 캐시 무효화 헬퍼
 */
export const invalidateDashboardQueries = {
  // 모든 대시보드 데이터 무효화
  all: () => dashboardQueryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
  
  // 특정 테넌트의 모든 대시보드 데이터 무효화
  tenant: (tenantId: string) => dashboardQueryClient.invalidateQueries({ 
    queryKey: [...dashboardQueryKeys.all, tenantId] 
  }),
  
  // 개별 위젯 데이터 무효화
  stats: (tenantId: string) => dashboardQueryClient.invalidateQueries({ 
    queryKey: dashboardQueryKeys.stats(tenantId) 
  }),
  attendance: (tenantId: string) => dashboardQueryClient.invalidateQueries({ 
    queryKey: dashboardQueryKeys.attendance(tenantId) 
  }),
  insights: (tenantId: string) => dashboardQueryClient.invalidateQueries({ 
    queryKey: dashboardQueryKeys.insights(tenantId) 
  }),
} as const

/**
 * Prefetch 헬퍼 함수
 */
export const prefetchQueries = {
  // 학생 상세 정보 prefetch
  studentDetail: async (id: string, fetcher: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.detail(id),
      queryFn: fetcher,
      staleTime: 5 * 60 * 1000,
    })
  },
}