'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, Command, ArrowRight, Clock, User, School, Users, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSearchStore } from '@/lib/stores/searchStore'
import { useDebounce } from '@/components/search/hooks/useDebounce'
import { useAuthStore } from '@/store/useAuthStore'
import type { SearchResult } from '@/lib/stores/searchStore'

interface SpotlightSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function SpotlightSearch({ isOpen, onClose }: SpotlightSearchProps) {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 150) // 더 빠른 응답을 위해 150ms

  // 비로그인 상태 체크 및 리다이렉트
  useEffect(() => {
    if (isOpen && !user) {
      console.log('🔒 비로그인 상태 감지 - 로그인 페이지로 리다이렉트')
      onClose()
      router.push('/auth/login')
      return
    }
  }, [isOpen, user, onClose, router])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search handler
  const handleSearch = useCallback(async (searchQuery: string) => {
    // 비로그인 상태 체크
    if (!user) {
      console.log('🔒 비로그인 상태 - 검색 중단')
      return
    }

    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    console.log('Spotlight: Searching for:', searchQuery)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          query: searchQuery,
          context: 'dashboard', // 전역 검색은 모든 컨텍스트
          limit: 8 // Spotlight는 적은 수의 결과만 표시
        })
      })

      console.log('Spotlight: Response status:', response.status)
      const data = await response.json()
      console.log('Spotlight: Response data:', data)

      if (response.ok) {
        setResults(data.results || [])
        setSelectedIndex(0)
        
        // 학생 데이터 프리페치: 검색 결과에서 학생 정보를 미리 캐시
        const studentResults = (data.results || []).filter((r: SearchResult) => r.type === 'student')
        console.log('🔍 검색 결과 확인:', {
          totalResults: data.results?.length || 0,
          studentResults: studentResults.length,
          hasFullStudent: studentResults.map((r: SearchResult) => !!r.metadata?.fullStudent)
        })
        
        if (studentResults.length > 0) {
          console.log('🚀 프리페치: 학생 데이터 캐싱 시작', studentResults.length + '명')
          
          // 검색 결과에서 전체 학생 데이터를 추출하여 스토어에 프리캐시
          const studentsToCache = studentResults
            .filter((result: SearchResult) => {
              console.log('🔍 학생 데이터 체크:', {
                id: result.id,
                title: result.title,
                hasMetadata: !!result.metadata,
                hasFullStudent: !!result.metadata?.fullStudent
              })
              return result.metadata?.fullStudent
            })
            .map((result: SearchResult) => {
              const fullStudent = result.metadata?.fullStudent as any
              console.log('📦 프리캐시할 학생 데이터:', {
                id: fullStudent.id,
                name: fullStudent.name,
                tenant_id: fullStudent.tenant_id || profile?.tenant_id
              })
              return {
                ...fullStudent,
                tenant_id: fullStudent.tenant_id || profile?.tenant_id || '',
              }
            })
          
          console.log('📊 프리캐시 대상:', studentsToCache.length + '명')
          
          if (studentsToCache.length > 0) {
            // 동적 import로 스토어 불러오기 (순환 의존성 방지)
            import('@/store/studentsStore').then(({ precacheStudents }) => {
              console.log('✅ 프리캐시 실행:', studentsToCache.length + '명')
              precacheStudents(studentsToCache)
            })
          }
        }
      } else {
        console.error('Spotlight: API error:', data)
        setResults([])
      }
    } catch (error) {
      console.error('Spotlight search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Debounced search
  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery, handleSearch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, results, selectedIndex])

  // Handle result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    onClose()
    
    // ✅ 업계 표준: Next.js 클라이언트 사이드 라우팅 사용 (깜빡거림 없음)
    setTimeout(() => {
      switch (result.type) {
        case 'student':
          router.push(`/main/students/${result.id}`)
          break
        case 'class':
          router.push(`/main/classes?selected=${result.id}`)
          break
        case 'staff':
          router.push(`/main/staff?selected=${result.id}`)
          break
        case 'schedule':
          router.push(`/main/schedule?selected=${result.id}`)
          break
      }
    }, 100)
  }, [onClose, router])

  // Get type icon
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'student':
        return <User className="h-4 w-4 text-blue-500" />
      case 'class':
        return <School className="h-4 w-4 text-green-500" />
      case 'staff':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'schedule':
        return <Calendar className="h-4 w-4 text-orange-500" />
    }
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            role="button"
            tabIndex={-1}
            aria-label="검색창 닫기"
          />

          {/* Modal */}
          <div 
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose()
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="
                w-full max-w-2xl mx-4
                backdrop-blur-sm bg-white/60 dark:bg-black/40 
                border border-white/30 shadow-xl dark:shadow-none
                rounded-xl
                overflow-hidden
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/20">
                <Search className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="EduCanvas 전체 검색..."
                  className="
                    flex-1 border-0 bg-white/30 dark:bg-black/30 text-lg
                    placeholder:text-neutral-600 dark:placeholder:text-neutral-400
                    text-neutral-900 dark:text-neutral-100
                    focus:ring-0 focus:outline-none
                    rounded-md px-2 py-1
                  "
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/40 dark:bg-black/40 rounded text-xs border border-white/30">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-white/40 dark:bg-black/40 rounded text-xs border border-white/30">Space</kbd>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/40 dark:bg-black/40 rounded text-xs border border-white/30">ESC</kbd>
                    <span>닫기</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <ScrollArea className="max-h-96">
                {loading && query.length >= 2 && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-educanvas-500 border-t-transparent" />
                      <span>검색 중...</span>
                    </div>
                  </div>
                )}

                {!loading && query.length < 2 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Command className="h-8 w-8 text-neutral-400 dark:text-neutral-500 mb-3" />
                    <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      빠른 검색
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      학생, 강사, 수업, 일정을 빠르게 찾아보세요
                    </p>
                  </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-neutral-400 dark:text-neutral-500 mb-3" />
                    <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      검색 결과 없음
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      "{query}"에 대한 결과를 찾을 수 없습니다
                    </p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="py-1">
                    {results.map((result, index) => (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`
                          flex items-center gap-3 px-4 py-3 cursor-pointer
                          transition-colors duration-150 rounded-lg mx-2 my-1
                          ${selectedIndex === index 
                            ? 'bg-white/50 dark:bg-black/50 border-l-2 border-educanvas-500' 
                            : 'hover:bg-white/25 dark:hover:bg-black/25'
                          }
                        `}
                        onClick={() => handleSelectResult(result)}
                      >
                        {/* Avatar/Icon */}
                        <div className="flex-shrink-0">
                          {result.metadata?.avatar ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={result.metadata.avatar} alt={result.title} />
                              <AvatarFallback className="text-xs">
                                {getInitials(result.title)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              {getTypeIcon(result.type)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                              {result.title}
                            </h4>
                            {result.metadata?.status && (
                              <Badge
                                variant={result.metadata.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {result.metadata.status === 'active' ? '활성' : '비활성'}
                              </Badge>
                            )}
                          </div>
                          {result.subtitle && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                      </motion.div>
                    ))}

                    {results.length >= 8 && (
                      <div className="px-4 py-2 text-center">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          더 많은 결과를 보려면 각 페이지에서 세부 검색을 이용하세요
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}