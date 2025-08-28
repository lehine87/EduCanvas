'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchStore } from '@/lib/stores/searchStore'
import { useDebounce } from '@/components/search/hooks/useDebounce'

interface SearchInputProps {
  placeholder?: string
  context?: 'students' | 'classes' | 'staff' | 'schedule' | 'dashboard'
}

export default function SearchInput({ 
  placeholder = '이름, 전화번호, 학번으로 검색...',
  context: propContext
}: SearchInputProps = {}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { 
    query, 
    setQuery, 
    loading, 
    setLoading,
    setResults,
    addToHistory,
    context: storeContext,
    filters 
  } = useSearchStore()
  
  // Use prop context if provided, otherwise use store context
  const context = propContext || storeContext
  
  const [localQuery, setLocalQuery] = useState(query)
  const debouncedQuery = useDebounce(localQuery, 300)

  // Focus input when sidebar opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Search handler
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) return

    setLoading(true)
    
    try {
      const requestBody = JSON.stringify({
        query: searchQuery,
        context,
        filters: filters,
        limit: 20
      })
      

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: requestBody
      })


      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`)
      }

      const data = await response.json()
      
      setResults(data.results || [])
      
      // Add to history if it's a meaningful search
      if (searchQuery.length >= 3) {
        addToHistory(searchQuery)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [context, setLoading, setResults, addToHistory, filters])

  // Sync debounced query with store and trigger search
  useEffect(() => {
    if (debouncedQuery !== query) {
      setQuery(debouncedQuery)
      
      if (debouncedQuery.length >= 2) {
        handleSearch(debouncedQuery)
      } else {
        setResults([])
      }
    }
  }, [debouncedQuery, query, handleSearch, setResults])

  // Re-search when filters change
  useEffect(() => {
    if (query.length >= 2) {
      handleSearch(query)
    }
  }, [filters, handleSearch, query])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value)
  }, [])

  // Clear search
  const handleClear = useCallback(() => {
    setLocalQuery('')
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }, [setQuery, setResults])

  // Handle Enter key (other keys are handled by SearchSidebar)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle Enter key, let other keys bubble up to SearchSidebar
    if (e.key === 'Enter' && localQuery.length >= 2) {
      e.preventDefault()
      handleSearch(localQuery)
    }
    // Don't prevent default for arrow keys - let SearchSidebar handle them
  }, [localQuery, handleSearch])

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10
            bg-neutral-50 dark:bg-neutral-900
            border-neutral-300 dark:border-neutral-700
            focus:ring-2 focus:ring-educanvas-500 dark:focus:ring-educanvas-400
            placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            text-neutral-900 dark:text-neutral-100
          "
          aria-label="검색어 입력"
          aria-describedby="search-hint"
          autoComplete="off"
          spellCheck={false}
        />
        
        {/* Loading indicator or Clear button */}
        <div className="absolute right-3 flex items-center">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-educanvas-500 dark:text-educanvas-400" />
          ) : localQuery ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-6 w-6 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
              aria-label="검색어 지우기"
            >
              <X className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Search hint */}
      <p id="search-hint" className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {localQuery.length === 0 && '최소 2글자 이상 입력하세요'}
        {localQuery.length === 1 && `${2 - localQuery.length}글자 더 입력하세요`}
        {localQuery.length >= 2 && loading && '검색 중...'}
      </p>
    </div>
  )
}