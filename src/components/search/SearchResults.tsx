'use client'

import { useState, useRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { 
  User, 
  School, 
  Users, 
  Calendar,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSearchStore, useSearchResults } from '@/lib/stores/searchStore'
import SearchResultCard from './SearchResultCard'
import SearchSkeleton from './SearchSkeleton'
import type { SearchResult } from '@/lib/stores/searchStore'

interface SearchResultsProps {
  selectedIndex?: number
}

export default function SearchResults({ selectedIndex = -1 }: SearchResultsProps) {
  const results = useSearchResults()
  const { loading, error, query } = useSearchStore()
  const [displayCount, setDisplayCount] = useState(20)
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Load more results when scrolling to bottom
  useEffect(() => {
    if (inView && displayCount < results.length) {
      setDisplayCount(prev => Math.min(prev + 20, results.length))
    }
  }, [inView, displayCount, results.length])

  // Reset display count when results change
  useEffect(() => {
    setDisplayCount(20)
  }, [results])

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Get icon for result type
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'student':
        return <User className="h-4 w-4" />
      case 'class':
        return <School className="h-4 w-4" />
      case 'staff':
        return <Users className="h-4 w-4" />
      case 'schedule':
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Get label for result type
  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'student':
        return '학생'
      case 'class':
        return '수업'
      case 'staff':
        return '직원'
      case 'schedule':
        return '시간표'
      default:
        return '기타'
    }
  }

  // Loading state
  if (loading && results.length === 0) {
    return <SearchSkeleton count={5} />
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-error-500 dark:text-error-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          검색 중 오류가 발생했습니다
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm">
          {error}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </Button>
      </div>
    )
  }

  // No results state
  if (!loading && results.length === 0 && query.length >= 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          검색 결과가 없습니다
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm">
          &quot;{query}&quot;에 대한 검색 결과를 찾을 수 없습니다.
          다른 검색어를 시도해보세요.
        </p>
      </div>
    )
  }

  // Results display
  return (
    <div className="space-y-4 pb-4">
      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
        <span>총 {results.length}개 결과</span>
        <span className="text-xs">
          {Object.keys(groupedResults).length}개 카테고리
        </span>
      </div>

      {/* Grouped results */}
      {Object.entries(groupedResults).map(([type, typeResults]) => (
        <div key={type} className="space-y-2">
          {/* Group header */}
          <div className="flex items-center gap-2 py-2 sticky top-0 bg-white dark:bg-neutral-950 z-10">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {getTypeIcon(type as SearchResult['type'])}
              <span>{getTypeLabel(type as SearchResult['type'])}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {typeResults.length}
            </Badge>
          </div>

          {/* Group results */}
          <div className="space-y-1">
            {typeResults
              .slice(0, displayCount)
              .map((result, index) => {
                // Calculate the global index for this result
                const globalIndex = results.indexOf(result)
                const isSelected = globalIndex === selectedIndex
                
                return (
                  <SearchResultCard
                    key={`${result.type}-${result.id}-${index}`}
                    result={result}
                    isSelected={isSelected}
                  />
                )
              })}
          </div>

          {/* Show more button for this group */}
          {typeResults.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={() => {
                // TODO: Navigate to filtered view
                console.log(`Show all ${type} results`)
              }}
            >
              {getTypeLabel(type as SearchResult['type'])} 전체 보기
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      ))}

      {/* Infinite scroll trigger */}
      {displayCount < results.length && (
        <div ref={loadMoreRef} className="py-2">
          <SearchSkeleton count={2} />
        </div>
      )}

      {/* End of results */}
      {displayCount >= results.length && results.length > 20 && (
        <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
          모든 결과를 표시했습니다
        </div>
      )}
    </div>
  )
}