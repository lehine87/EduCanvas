/**
 * 대용량 학생 데이터 최적화 Hook
 * 
 * 메모리 효율적인 학생 데이터 관리와 성능 최적화를 담당합니다.
 * EduCanvas 보안 철학에 따라 메모리 누수 방지와 민감데이터 보호를 우선시합니다.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { smartSearch, type SearchContext, type SmartSearchResult } from '@/lib/ai/smartSearch'
import type { Student, StudentFilters } from '@/types/student.types'

// 성능 설정
const PERFORMANCE_CONFIG = {
  MAX_MEMORY_ITEMS: 1000,      // 메모리에 유지할 최대 학생 수
  SEARCH_DEBOUNCE_MS: 300,     // 검색 디바운스 시간
  CACHE_TTL_MS: 5 * 60 * 1000, // 캐시 유효 시간 (5분)
  CLEANUP_INTERVAL_MS: 30 * 1000, // 메모리 정리 주기 (30초)
  VIRTUAL_BUFFER_SIZE: 50,     // 가상화 버퍼 크기
  MAX_SEARCH_RESULTS: 100      // 최대 검색 결과 수
}

interface OptimizedStudentDataState {
  // 검색 상태
  searchTerm: string
  searchResults: Student[]
  isSearching: boolean
  searchSuggestions: string[]
  
  // 데이터 상태  
  cachedStudents: Map<string, Student>
  lastUpdated: Date | null
  totalCount: number
  
  // 성능 메트릭
  memoryUsage: number
  searchLatency: number
  cacheHitRate: number
}

interface UseOptimizedStudentDataOptions {
  enableCache?: boolean
  enableVirtualization?: boolean
  maxCacheSize?: number
  searchDebounceMs?: number
}

/**
 * 최적화된 학생 데이터 관리 Hook
 */
export function useOptimizedStudentData(options: UseOptimizedStudentDataOptions = {}) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  // 옵션 설정
  const config = useMemo(() => ({
    enableCache: options.enableCache ?? true,
    enableVirtualization: options.enableVirtualization ?? true,
    maxCacheSize: options.maxCacheSize ?? PERFORMANCE_CONFIG.MAX_MEMORY_ITEMS,
    searchDebounceMs: options.searchDebounceMs ?? PERFORMANCE_CONFIG.SEARCH_DEBOUNCE_MS
  }), [options])

  // 상태 관리
  const [state, setState] = useState<OptimizedStudentDataState>({
    searchTerm: '',
    searchResults: [],
    isSearching: false,
    searchSuggestions: [],
    cachedStudents: new Map(),
    lastUpdated: null,
    totalCount: 0,
    memoryUsage: 0,
    searchLatency: 0,
    cacheHitRate: 0
  })

  // 레퍼런스들
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const memoryCleanupRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const performanceMetricsRef = useRef({
    searchCount: 0,
    cacheHits: 0,
    totalRequests: 0
  })

  // 검색 컨텍스트 생성
  const createSearchContext = useCallback((): SearchContext => ({
    userId: profile?.id || '',
    tenantId: tenantId || '',
    timestamp: new Date(),
    searchHistory: [], // 실제로는 localStorage에서 로드
    recentAccessed: [], // 실제로는 최근 접근 기록에서 로드
    currentTask: undefined
  }), [profile?.id, tenantId])

  /**
   * 메모리 최적화된 검색
   */
  const performOptimizedSearch = useCallback(async (
    searchTerm: string, 
    filters?: StudentFilters
  ): Promise<SmartSearchResult> => {
    const startTime = performance.now()
    
    try {
      setState(prev => ({ ...prev, isSearching: true }))
      
      // 1. 캐시에서 검색 (메모리 효율성)
      const cachedResults = searchInCache(state.cachedStudents, searchTerm, filters)
      if (cachedResults.length > 0 && config.enableCache) {
        performanceMetricsRef.current.cacheHits++
        
        const cacheResult: SmartSearchResult = {
          students: cachedResults.slice(0, PERFORMANCE_CONFIG.MAX_SEARCH_RESULTS),
          suggestions: generateQuickSuggestions(searchTerm, cachedResults),
          relatedActions: [],
          confidence: 0.8,
          searchType: 'exact'
        }
        
        setState(prev => ({
          ...prev,
          searchResults: cacheResult.students,
          searchSuggestions: cacheResult.suggestions,
          isSearching: false
        }))
        
        return cacheResult
      }

      // 2. API 검색 (필요한 경우에만)
      const searchContext = createSearchContext()
      const apiResults = await fetchStudentsFromAPI(searchTerm, filters, {
        limit: PERFORMANCE_CONFIG.MAX_SEARCH_RESULTS,
        tenantId: tenantId || ''
      })

      // 3. AI 스마트 검색 적용
      const smartResults = await smartSearch.search(
        searchTerm,
        apiResults,
        searchContext,
        { maxResults: PERFORMANCE_CONFIG.MAX_SEARCH_RESULTS }
      )

      // 4. 캐시 업데이트 (메모리 관리와 함께)
      if (config.enableCache) {
        updateCacheWithMemoryManagement(smartResults.students)
      }

      // 5. 상태 업데이트
      setState(prev => ({
        ...prev,
        searchResults: smartResults.students,
        searchSuggestions: smartResults.suggestions,
        isSearching: false,
        searchLatency: performance.now() - startTime
      }))

      return smartResults

    } catch (error) {
      console.error('최적화된 검색 실패:', error)
      setState(prev => ({ ...prev, isSearching: false }))
      
      // 폴백: 기본 검색
      return {
        students: [],
        suggestions: [],
        relatedActions: [],
        confidence: 0,
        searchType: 'fuzzy'
      }
    } finally {
      performanceMetricsRef.current.searchCount++
      performanceMetricsRef.current.totalRequests++
      updatePerformanceMetrics()
    }
  }, [state.cachedStudents, config, tenantId, createSearchContext])

  /**
   * 디바운스된 검색
   */
  const debouncedSearch = useCallback((
    searchTerm: string, 
    filters?: StudentFilters
  ) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performOptimizedSearch(searchTerm, filters)
      } else {
        setState(prev => ({
          ...prev,
          searchResults: [],
          searchSuggestions: [],
          searchTerm: searchTerm
        }))
      }
    }, config.searchDebounceMs)

    setState(prev => ({ ...prev, searchTerm }))
  }, [performOptimizedSearch, config.searchDebounceMs])

  /**
   * 메모리 관리 및 정리
   */
  const performMemoryCleanup = useCallback(() => {
    setState(prev => {
      const newCachedStudents = new Map(prev.cachedStudents)
      
      // 캐시 크기 제한
      if (newCachedStudents.size > config.maxCacheSize) {
        const entriesToRemove = newCachedStudents.size - config.maxCacheSize
        const keys = Array.from(newCachedStudents.keys())
        
        // 오래된 항목부터 제거 (LRU 방식)
        for (let i = 0; i < entriesToRemove; i++) {
          const key = keys[i]
          if (key !== undefined) {
            newCachedStudents.delete(key)
          }
        }
      }

      // 메모리 사용량 계산 (추정치)
      const memoryUsage = estimateMemoryUsage(newCachedStudents)

      return {
        ...prev,
        cachedStudents: newCachedStudents,
        memoryUsage
      }
    })

    // 가비지 컬렉션 힌트 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development' && global.gc) {
      global.gc()
    }
  }, [config.maxCacheSize])

  /**
   * 캐시 업데이트 (메모리 관리 포함)
   */
  const updateCacheWithMemoryManagement = useCallback((students: Student[]) => {
    setState(prev => {
      const newCachedStudents = new Map(prev.cachedStudents)
      
      // 새 학생들 추가
      for (const student of students) {
        newCachedStudents.set(student.id, student)
      }
      
      // 메모리 제한 확인
      if (newCachedStudents.size > config.maxCacheSize) {
        // LRU 정책으로 오래된 항목 제거
        const excess = newCachedStudents.size - config.maxCacheSize
        const keys = Array.from(newCachedStudents.keys())
        
        for (let i = 0; i < excess; i++) {
          const key = keys[i]
          if (key !== undefined) {
            newCachedStudents.delete(key)
          }
        }
      }

      return {
        ...prev,
        cachedStudents: newCachedStudents,
        lastUpdated: new Date(),
        memoryUsage: estimateMemoryUsage(newCachedStudents)
      }
    })
  }, [config.maxCacheSize])

  /**
   * 성능 메트릭 업데이트
   */
  const updatePerformanceMetrics = useCallback(() => {
    const metrics = performanceMetricsRef.current
    const cacheHitRate = metrics.totalRequests > 0 
      ? (metrics.cacheHits / metrics.totalRequests) * 100 
      : 0

    setState(prev => ({
      ...prev,
      cacheHitRate
    }))
  }, [])

  /**
   * 특정 학생 조회 (캐시 우선)
   */
  const getStudentById = useCallback(async (studentId: string): Promise<Student | null> => {
    // 1. 캐시에서 먼저 확인
    const cachedStudent = state.cachedStudents.get(studentId)
    if (cachedStudent) {
      performanceMetricsRef.current.cacheHits++
      updatePerformanceMetrics()
      return cachedStudent
    }

    // 2. API에서 조회
    try {
      const student = await fetchStudentByIdFromAPI(studentId, tenantId || '')
      if (student && config.enableCache) {
        // 캐시 업데이트
        setState(prev => ({
          ...prev,
          cachedStudents: new Map(prev.cachedStudents).set(studentId, student)
        }))
      }
      return student
    } catch (error) {
      console.error('학생 조회 실패:', error)
      return null
    }
  }, [state.cachedStudents, config.enableCache, tenantId])

  /**
   * 메모리 정리 스케줄링
   */
  useEffect(() => {
    if (config.enableCache) {
      memoryCleanupRef.current = setInterval(
        performMemoryCleanup,
        PERFORMANCE_CONFIG.CLEANUP_INTERVAL_MS
      )

      return () => {
        if (memoryCleanupRef.current) {
          clearInterval(memoryCleanupRef.current)
        }
      }
    }
    
    return undefined
  }, [config.enableCache, performMemoryCleanup])

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (memoryCleanupRef.current) {
        clearInterval(memoryCleanupRef.current)
      }
      
      // 메모리 정리 (보안 중심)
      setState(prev => ({
        ...prev,
        cachedStudents: new Map(), // 캐시 클리어
        searchResults: [],         // 검색 결과 클리어
        searchSuggestions: []      // 제안 클리어
      }))
    }
  }, [])

  /**
   * 성능 모니터링 (개발 환경)
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('🔍 학생 데이터 성능 메트릭:', {
          캐시크기: state.cachedStudents.size,
          메모리사용량: `${(state.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
          캐시적중률: `${state.cacheHitRate.toFixed(1)}%`,
          평균검색시간: `${state.searchLatency.toFixed(0)}ms`
        })
      }, 10000) // 10초마다

      return () => clearInterval(interval)
    }
    
    return undefined
  }, [state])

  // Public API
  return {
    // 검색 기능
    searchTerm: state.searchTerm,
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    searchSuggestions: state.searchSuggestions,
    search: debouncedSearch,
    
    // 데이터 조회
    getStudentById,
    
    // 상태 정보
    totalCount: state.totalCount,
    lastUpdated: state.lastUpdated,
    
    // 성능 메트릭
    performanceMetrics: {
      memoryUsage: state.memoryUsage,
      cacheHitRate: state.cacheHitRate,
      searchLatency: state.searchLatency,
      cachedItemsCount: state.cachedStudents.size
    },
    
    // 유틸리티
    clearCache: () => setState(prev => ({ 
      ...prev, 
      cachedStudents: new Map(),
      memoryUsage: 0 
    })),
    refreshData: () => performOptimizedSearch(state.searchTerm),
    forceCleanup: performMemoryCleanup
  }
}

/**
 * 유틸리티 함수들
 */

// 캐시에서 검색
function searchInCache(
  cache: Map<string, Student>, 
  searchTerm: string, 
  filters?: StudentFilters
): Student[] {
  const results: Student[] = []
  const searchLower = searchTerm.toLowerCase()

  for (const student of cache.values()) {
    // 기본 검색
    const matchesSearch = 
      student.name.toLowerCase().includes(searchLower) ||
      student.student_number.toLowerCase().includes(searchLower) ||
      student.parent_phone_1?.includes(searchTerm) ||
      student.parent_phone_2?.includes(searchTerm)

    if (!matchesSearch) continue

    // 필터 적용
    if (filters?.status && student.status && !filters.status.includes(student.status as 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended')) continue
    if (filters?.grade_level && !filters.grade_level.includes(student.grade_level || '')) continue

    results.push(student)
  }

  return results.slice(0, PERFORMANCE_CONFIG.MAX_SEARCH_RESULTS)
}

// 빠른 제안 생성
function generateQuickSuggestions(searchTerm: string, results: Student[]): string[] {
  const suggestions = new Set<string>()
  
  for (const student of results.slice(0, 10)) {
    if (student.name.toLowerCase().startsWith(searchTerm.toLowerCase())) {
      suggestions.add(student.name)
    }
  }
  
  return Array.from(suggestions).slice(0, 5)
}

// 메모리 사용량 추정
function estimateMemoryUsage(cache: Map<string, Student>): number {
  // 간단한 추정: 학생당 평균 2KB
  return cache.size * 2048
}

// API 함수들 (실제 구현에서는 별도 파일)
async function fetchStudentsFromAPI(
  searchTerm: string, 
  filters?: StudentFilters,
  options?: { limit?: number; tenantId: string }
): Promise<Student[]> {
  const params = new URLSearchParams({
    search: searchTerm || '',
    limit: (options?.limit || 100).toString(),
    tenantId: options?.tenantId || ''
  })

  if (filters?.status && filters.status.length > 0 && filters.status[0]) {
    params.append('status', filters.status[0])
  }

  const response = await fetch(`/api/students?${params}`)
  if (!response.ok) throw new Error('API 요청 실패')
  
  const data = await response.json()
  return data.students || []
}

async function fetchStudentByIdFromAPI(studentId: string, tenantId: string): Promise<Student | null> {
  const params = new URLSearchParams({ tenantId })
  const response = await fetch(`/api/students/${studentId}?${params}`)
  
  if (!response.ok) return null
  
  const data = await response.json()
  return data.student || null
}