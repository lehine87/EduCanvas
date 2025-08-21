'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  X,
  User,
  Phone,
  Hash,
  GraduationCap
} from 'lucide-react'
import type { Student } from '@/types/student.types'

// 🎯 UX 가이드: 검색 결과 타입 정의
interface SearchResult {
  id: string
  name: string
  student_number?: string
  phone?: string
  parent_phone_1?: string
  grade_level?: string
  status: string
  avatar_url?: string
  matchType: 'name' | 'phone' | 'student_id' | 'class' // 어떤 필드에서 매치되었는지
  matchText: string // 매치된 텍스트
}

interface EnhancedSearchBoxProps {
  value: string
  onChange: (value: string) => void
  onStudentSelect: (student: Student) => void
  students: Student[]
  className?: string
  placeholder?: string
  loading?: boolean
}

// 🎯 UX 가이드: 규모별 검색 전략
const getSearchStrategy = (totalStudents: number) => {
  if (totalStudents <= 300) {
    return {
      type: 'realtime' as const,
      showInstant: true,
      maxResults: 10,
      description: '실시간 검색'
    }
  } else if (totalStudents <= 3000) {
    return {
      type: 'hybrid' as const,
      showInstant: true,
      maxResults: 15,
      description: '빠른 검색 + 전체 결과'
    }
  } else {
    return {
      type: 'traditional' as const,
      showInstant: false,
      maxResults: 20,
      description: '검색 후 결과 페이지'
    }
  }
}

// 🎯 UX 가이드: 다중 필드 검색 함수
const searchStudents = (students: Student[], query: string): SearchResult[] => {
  if (!query.trim() || query.length < 2) return []
  
  const normalizedQuery = query.toLowerCase().trim()
  const results: SearchResult[] = []
  
  students.forEach(student => {
    const searchResult: Partial<SearchResult> = {
      id: student.id,
      name: student.name,
      student_number: student.student_number,
      phone: student.phone ?? undefined,
      parent_phone_1: student.parent_phone_1 ?? undefined,
      grade_level: (student as any).grade_level ?? undefined,
      status: student.status as string,
      avatar_url: (student as any).avatar_url ?? undefined
    }
    
    // 1. 학생 이름으로 검색
    if (student.name.toLowerCase().includes(normalizedQuery)) {
      results.push({
        ...searchResult as SearchResult,
        matchType: 'name',
        matchText: student.name
      })
      return
    }
    
    // 2. 전화번호 뒤 4자리로 검색
    const phoneNumbers = [student.phone, student.parent_phone_1, student.parent_phone_2].filter(Boolean)
    for (const phone of phoneNumbers) {
      if (phone && phone.slice(-4).includes(normalizedQuery)) {
        results.push({
          ...searchResult as SearchResult,
          matchType: 'phone',
          matchText: phone.slice(-4)
        })
        return
      }
    }
    
    // 3. 학생 ID/학번으로 검색
    if (student.student_number && student.student_number.toLowerCase().includes(normalizedQuery)) {
      results.push({
        ...searchResult as SearchResult,
        matchType: 'student_id',
        matchText: student.student_number
      })
      return
    }
    
    // 4. 학년/반으로 검색 (추후 확장 가능)
    if (student.grade_level && student.grade_level.toLowerCase().includes(normalizedQuery)) {
      results.push({
        ...searchResult as SearchResult,
        matchType: 'class',
        matchText: student.grade_level
      })
      return
    }
  })
  
  return results
}

// 검색 결과 아이템 컴포넌트
const SearchResultItem = ({ 
  result, 
  onClick,
  isHighlighted 
}: { 
  result: SearchResult
  onClick: () => void
  isHighlighted: boolean
}) => {
  const getMatchIcon = (matchType: SearchResult['matchType']) => {
    switch (matchType) {
      case 'name': return <User className="h-4 w-4 text-blue-500" />
      case 'phone': return <Phone className="h-4 w-4 text-green-500" />
      case 'student_id': return <Hash className="h-4 w-4 text-purple-500" />
      case 'class': return <GraduationCap className="h-4 w-4 text-orange-500" />
      default: return <User className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const getMatchLabel = (matchType: SearchResult['matchType']) => {
    switch (matchType) {
      case 'name': return '이름'
      case 'phone': return '전화번호'
      case 'student_id': return '학번'
      case 'class': return '학년'
      default: return ''
    }
  }
  
  return (
    <div
      className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors duration-150 ${
        isHighlighted ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
      }`}
      onClick={onClick}
      role="option"
      aria-selected={isHighlighted}
    >
      {/* 프로필 사진 */}
      <div className="flex-shrink-0">
        {result.avatar_url ? (
          <img 
            src={result.avatar_url} 
            alt={`${result.name} 프로필`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground font-medium">
              {result.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      {/* 학생 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-foreground truncate">{result.name}</h4>
          <div className="flex items-center space-x-1">
            {getMatchIcon(result.matchType)}
            <Badge variant="secondary" className="text-xs">
              {getMatchLabel(result.matchType)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          {result.student_number && (
            <span className="text-sm text-muted-foreground">#{result.student_number}</span>
          )}
          {result.grade_level && (
            <span className="text-sm text-muted-foreground">{result.grade_level}</span>
          )}
          <span className={`inline-block w-2 h-2 rounded-full ${
            result.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'
          }`} />
        </div>
      </div>
      
      {/* 매치된 텍스트 강조 */}
      <div className="flex-shrink-0">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {result.matchText}
        </span>
      </div>
    </div>
  )
}

export const EnhancedSearchBox = ({
  value,
  onChange,
  onStudentSelect,
  students,
  className = '',
  placeholder = '학생 이름 또는 전화번호 뒤 4자리 입력...',
  loading = false
}: EnhancedSearchBoxProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 🎯 UX 가이드: 규모별 검색 전략 결정
  const searchStrategy = useMemo(() => getSearchStrategy(students.length), [students.length])
  
  // 🎯 UX 가이드: 다중 필드 검색 결과
  const searchResults = useMemo(() => {
    if (value.length < 2) return []
    const results = searchStudents(students, value)
    return results.slice(0, searchStrategy.maxResults)
  }, [value, students, searchStrategy.maxResults])
  
  // 검색창 포커스 시 드롭다운 열기
  const handleFocus = useCallback(() => {
    if (searchResults.length > 0 || value.length >= 2) {
      setIsOpen(true)
    }
  }, [searchResults.length, value.length])
  
  // 검색창 블러 시 드롭다운 닫기 (약간의 지연을 두어 클릭 이벤트 처리)
  const handleBlur = useCallback(() => {
    setTimeout(() => setIsOpen(false), 150)
  }, [])
  
  // 검색어 변경 처리
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setHighlightedIndex(-1)
    
    if (newValue.length >= 2) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [onChange])
  
  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
        
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          const selectedResult = searchResults[highlightedIndex]
          if (selectedResult) {
            const student = students.find(s => s.id === selectedResult.id)
            if (student) {
              onStudentSelect(student)
              onChange('')
              setIsOpen(false)
              setHighlightedIndex(-1)
            }
          }
        }
        break
        
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, searchResults, highlightedIndex, students, onStudentSelect, onChange])
  
  // 결과 항목 클릭 처리
  const handleResultClick = useCallback((result: SearchResult) => {
    const student = students.find(s => s.id === result.id)
    if (student) {
      onStudentSelect(student)
      onChange('')
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }, [students, onStudentSelect, onChange])
  
  // 검색창 초기화
  const handleClear = useCallback(() => {
    onChange('')
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }, [onChange])
  
  return (
    <div className={`relative ${className}`}>
      {/* 메인 검색창 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-12 pr-12 h-14 text-lg border-2 border-border focus:border-primary rounded-xl shadow-sm"
          aria-label="학생 검색 - 이름, 전화번호, 학번으로 검색"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        
        {/* 검색창 우측 아이콘들 */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
          {value && !loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-muted rounded-full"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* 검색 전략 힌트 */}
      <div className="mt-2 text-center">
        <span className="text-sm text-muted-foreground">
          {searchStrategy.description} • 총 {students.length}명 등록
          {value.length >= 2 && ` • ${searchResults.length}개 결과`}
        </span>
      </div>
      
      {/* 자동완성 드롭다운 */}
      {isOpen && value.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-hidden shadow-lg border border-gray-200">
          <CardContent className="p-0">
            {searchResults.length > 0 ? (
              <>
                <div 
                  ref={dropdownRef}
                  className="max-h-80 overflow-y-auto"
                  role="listbox"
                  aria-label="검색 결과"
                >
                  {searchResults.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={() => handleResultClick(result)}
                      isHighlighted={index === highlightedIndex}
                    />
                  ))}
                </div>
                
                {/* 🎯 UX 가이드: 하이브리드 전략에서 전체 결과 보기 버튼 */}
                {searchStrategy.type === 'hybrid' && searchResults.length >= searchStrategy.maxResults && (
                  <div className="border-t p-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // TODO: 전체 결과 페이지로 이동하는 로직 구현
                        console.log('전체 결과 보기:', value)
                        setIsOpen(false)
                      }}
                    >
                      전체 {students.filter(s => 
                        s.name.toLowerCase().includes(value.toLowerCase()) ||
                        s.phone?.includes(value) ||
                        s.parent_phone_1?.includes(value) ||
                        s.student_number?.includes(value)
                      ).length}개 결과 보기
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>&quot;{value}&quot;에 대한 검색 결과가 없습니다</p>
                <p className="text-sm mt-1">
                  학생 이름, 전화번호 뒤 4자리, 학번으로 검색해보세요
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedSearchBox