import { useMemo, useCallback, useRef, useEffect } from 'react'

/**
 * 대용량 리스트 최적화 Hook
 * 가상화, 메모이제이션, 지연 로딩을 통한 성능 최적화
 */
export interface OptimizedListOptions<T> {
  /** 검색어 */
  searchTerm?: string
  /** 정렬 기준 */
  sortBy?: string
  /** 필터 조건 */
  filters?: Record<string, any>
  /** 가상화 임계값 (이 개수 이상일 때 가상화 적용) */
  virtualizationThreshold?: number
  /** 검색 디바운스 시간 (ms) */
  debounceMs?: number
  /** 청크 크기 (지연 로딩 시 한 번에 로드할 아이템 수) */
  chunkSize?: number
}

/**
 * 리스트 아이템 정렬 함수 타입
 */
type SortFunction<T> = (a: T, b: T) => number

/**
 * 리스트 아이템 필터 함수 타입
 */
type FilterFunction<T> = (item: T) => boolean

/**
 * 검색 함수 타입
 */
type SearchFunction<T> = (item: T, searchTerm: string) => boolean

/**
 * 최적화된 리스트 관리 Hook
 */
export function useOptimizedList<T extends { id: string }>(
  items: T[],
  options: OptimizedListOptions<T> = {}
) {
  const {
    searchTerm = '',
    sortBy = '',
    filters = {},
    virtualizationThreshold = 100,
    debounceMs = 300,
    chunkSize = 50
  } = options

  const debounceTimer = useRef<NodeJS.Timeout>()
  const lastSearchTerm = useRef('')
  const searchCache = useRef<Map<string, T[]>>(new Map())

  // 필터링된 아이템들 (캐시 적용)
  const filteredItems = useMemo(() => {
    // 캐시 키 생성
    const cacheKey = `${searchTerm}-${JSON.stringify(filters)}-${sortBy}`
    
    // 캐시에서 확인
    if (searchCache.current.has(cacheKey)) {
      return searchCache.current.get(cacheKey)!
    }

    let result = items

    // 검색 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(item => {
        // 기본 검색 로직 - 각 프로젝트에서 오버라이드 가능
        const searchableText = Object.values(item).join(' ').toLowerCase()
        return searchableText.includes(searchLower)
      })
    }

    // 필터 적용
    if (Object.keys(filters).length > 0) {
      result = result.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === '' || value === null || value === undefined) return true
          if (Array.isArray(value) && value.length === 0) return true
          
          const itemValue = (item as any)[key]
          if (Array.isArray(value)) {
            return value.includes(itemValue)
          }
          return itemValue === value
        })
      })
    }

    // 정렬 적용
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aValue = (a as any)[sortBy]
        const bValue = (b as any)[sortBy]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue, 'ko')
        }
        
        if (aValue < bValue) return -1
        if (aValue > bValue) return 1
        return 0
      })
    }

    // 캐시에 저장 (최대 10개까지만)
    if (searchCache.current.size >= 10) {
      const firstKey = searchCache.current.keys().next().value
      searchCache.current.delete(firstKey)
    }
    searchCache.current.set(cacheKey, result)

    return result
  }, [items, searchTerm, filters, sortBy])

  // 가상화 여부 결정
  const shouldVirtualize = useMemo(() => {
    return filteredItems.length >= virtualizationThreshold
  }, [filteredItems.length, virtualizationThreshold])

  // 청크 단위 로딩을 위한 상태
  const [visibleChunks, setVisibleChunks] = React.useState(1)
  const visibleItems = useMemo(() => {
    if (!shouldVirtualize) return filteredItems
    return filteredItems.slice(0, visibleChunks * chunkSize)
  }, [filteredItems, visibleChunks, chunkSize, shouldVirtualize])

  // 더 많은 아이템 로드
  const loadMoreItems = useCallback(() => {
    setVisibleChunks(prev => prev + 1)
  }, [])

  // 더 로드할 아이템이 있는지 확인
  const hasMoreItems = useMemo(() => {
    return visibleItems.length < filteredItems.length
  }, [visibleItems.length, filteredItems.length])

  // 검색어 변경 시 청크 리셋
  useEffect(() => {
    setVisibleChunks(1)
  }, [searchTerm, filters, sortBy])

  // 디바운스된 검색 핸들러
  const debouncedSearch = useCallback((term: string, callback?: (term: string) => void) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      lastSearchTerm.current = term
      callback?.(term)
    }, debounceMs)
  }, [debounceMs])

  // 캐시 정리
  const clearCache = useCallback(() => {
    searchCache.current.clear()
  }, [])

  // 성능 통계
  const performanceStats = useMemo(() => ({
    totalItems: items.length,
    filteredItems: filteredItems.length,
    visibleItems: visibleItems.length,
    shouldVirtualize,
    cacheSize: searchCache.current.size,
    filteringRatio: items.length > 0 ? (filteredItems.length / items.length * 100).toFixed(1) : '0'
  }), [items.length, filteredItems.length, visibleItems.length, shouldVirtualize])

  return {
    // 데이터
    filteredItems,
    visibleItems,
    
    // 상태
    shouldVirtualize,
    hasMoreItems,
    
    // 액션
    loadMoreItems,
    debouncedSearch,
    clearCache,
    
    // 통계
    performanceStats
  }
}

/**
 * 커스텀 필터링을 위한 Hook
 */
export function useOptimizedListWithCustomFilters<T extends { id: string }>(
  items: T[],
  searchFunction: SearchFunction<T>,
  filterFunction: FilterFunction<T>,
  sortFunction: SortFunction<T>,
  options: OptimizedListOptions<T> = {}
) {
  const {
    searchTerm = '',
    virtualizationThreshold = 100,
    chunkSize = 50
  } = options

  const filteredItems = useMemo(() => {
    let result = items

    // 커스텀 검색
    if (searchTerm.trim()) {
      result = result.filter(item => searchFunction(item, searchTerm))
    }

    // 커스텀 필터링
    result = result.filter(filterFunction)

    // 커스텀 정렬
    result = [...result].sort(sortFunction)

    return result
  }, [items, searchTerm, searchFunction, filterFunction, sortFunction])

  const shouldVirtualize = filteredItems.length >= virtualizationThreshold
  
  const [visibleChunks, setVisibleChunks] = React.useState(1)
  const visibleItems = useMemo(() => {
    if (!shouldVirtualize) return filteredItems
    return filteredItems.slice(0, visibleChunks * chunkSize)
  }, [filteredItems, visibleChunks, chunkSize, shouldVirtualize])

  const loadMoreItems = useCallback(() => {
    setVisibleChunks(prev => prev + 1)
  }, [])

  const hasMoreItems = visibleItems.length < filteredItems.length

  return {
    filteredItems,
    visibleItems,
    shouldVirtualize,
    hasMoreItems,
    loadMoreItems,
    performanceStats: {
      totalItems: items.length,
      filteredItems: filteredItems.length,
      visibleItems: visibleItems.length,
      shouldVirtualize,
      filteringRatio: items.length > 0 ? (filteredItems.length / items.length * 100).toFixed(1) : '0'
    }
  }
}