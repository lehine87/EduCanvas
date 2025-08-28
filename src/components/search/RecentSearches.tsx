'use client'

import { Clock, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSearchStore, useSearchHistory } from '@/lib/stores/searchStore'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function RecentSearches() {
  const history = useSearchHistory()
  const { setQuery, clearHistory } = useSearchStore()

  // Get context label
  const getContextLabel = (context: string) => {
    switch (context) {
      case 'dashboard':
        return '대시보드'
      case 'students':
        return '학생'
      case 'classes':
        return '수업'
      case 'staff':
        return '직원'
      case 'schedule':
        return '시간표'
      default:
        return context
    }
  }

  // Handle search item click
  const handleSearchClick = (query: string) => {
    setQuery(query)
  }

  if (history.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
          검색을 시작하세요
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          이름, 전화번호, 학번 등으로 검색할 수 있습니다
        </p>
        
        {/* Quick search suggestions */}
        <div className="mt-6">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            빠른 검색
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSearchClick('김')}
            >
              김씨 성
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSearchClick('이')}
            >
              이씨 성
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSearchClick('박')}
            >
              박씨 성
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSearchClick('재학')}
            >
              재학생
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          최근 검색
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={clearHistory}
        >
          모두 지우기
        </Button>
      </div>

      {/* History list */}
      <div className="space-y-1">
        {history.map((item, index) => (
          <div
            key={`${item.query}-${item.timestamp}-${index}`}
            className="
              flex items-center justify-between p-2 rounded-lg
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              transition-colors duration-200 cursor-pointer group
            "
            onClick={() => handleSearchClick(item.query)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSearchClick(item.query)
              }
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Search className="h-4 w-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {item.query}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    {getContextLabel(item.context)}
                  </Badge>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Remove button (visible on hover) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                // Remove this specific item from history
                const newHistory = history.filter((h, i) => i !== index)
                useSearchStore.setState({ history: newHistory })
              }}
              aria-label="검색 기록 삭제"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Popular searches */}
      {history.length < 5 && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            인기 검색어
          </h4>
          <div className="flex flex-wrap gap-1">
            {['수학', '영어', '월요일', '강사', '신규'].map((term) => (
              <Badge
                key={term}
                variant="outline"
                className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => handleSearchClick(term)}
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}