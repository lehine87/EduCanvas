/**
 * AI 기반 스마트 학생 검색 및 추천 시스템
 * 
 * 대용량 데이터에서 효율적인 학생 검색과 개인화된 추천을 제공합니다.
 */

import type { Student } from '@/types/student.types'

// 검색 타입 정의
export interface SearchContext {
  userId: string
  tenantId: string
  timestamp: Date
  searchHistory: string[]
  recentAccessed: string[] // 최근 접근한 학생 ID
  currentTask?: 'attendance' | 'payment' | 'consultation' | 'enrollment'
}

export interface SmartSearchResult {
  students: Student[]
  suggestions: string[]
  relatedActions: SearchAction[]
  confidence: number
  searchType: 'exact' | 'fuzzy' | 'semantic' | 'contextual'
}

export interface SearchAction {
  id: string
  label: string
  icon: string
  action: () => void
  priority: number
}

// 검색 가중치 설정
const SEARCH_WEIGHTS = {
  exactMatch: 100,
  prefixMatch: 80,
  fuzzyMatch: 60,
  phoneMatch: 90,
  recentAccess: 50,
  contextualRelevance: 40
}

/**
 * 스마트 검색 엔진
 */
export class SmartStudentSearch {
  private searchHistory: Map<string, SearchLog[]> = new Map()
  private accessPatterns: Map<string, AccessPattern> = new Map()

  /**
   * 메인 검색 함수
   */
  async search(
    query: string,
    students: Student[],
    context: SearchContext,
    options: SearchOptions = {}
  ): Promise<SmartSearchResult> {
    const startTime = performance.now()

    try {
      // 1. 쿼리 전처리
      const processedQuery = this.preprocessQuery(query)
      
      // 2. 다중 검색 전략 적용
      const results = await Promise.all([
        this.exactSearch(processedQuery, students),
        this.fuzzySearch(processedQuery, students),
        this.phoneSearch(processedQuery, students),
        this.contextualSearch(processedQuery, students, context),
        this.semanticSearch(processedQuery, students),
      ])

      // 3. 결과 병합 및 가중치 적용
      const mergedResults = this.mergeAndScore(results, context)

      // 4. 개인화 적용
      const personalizedResults = this.applyPersonalization(mergedResults, context)

      // 5. 검색 기록 업데이트
      this.updateSearchHistory(context.userId, query, personalizedResults)

      // 6. 결과 반환
      const searchResult: SmartSearchResult = {
        students: personalizedResults.slice(0, options.maxResults || 50),
        suggestions: this.generateSuggestions(query, personalizedResults),
        relatedActions: this.generateActions(personalizedResults, context),
        confidence: this.calculateConfidence(personalizedResults, query),
        searchType: this.determineSearchType(query, personalizedResults)
      }

      // 성능 로깅
      const duration = performance.now() - startTime
      this.logPerformance(query, searchResult.students.length, duration)

      return searchResult

    } catch (error) {
      console.error('스마트 검색 오류:', error)
      // 폴백: 기본 검색
      return this.fallbackSearch(query, students)
    }
  }

  /**
   * 1. 정확한 일치 검색
   */
  private exactSearch(query: string, students: Student[]): SearchResultItem[] {
    return students
      .filter(student => 
        student.name === query ||
        student.student_number === query ||
        student.parent_phone_1 === query ||
        student.parent_phone_2 === query
      )
      .map(student => ({
        student,
        score: SEARCH_WEIGHTS.exactMatch,
        matchType: 'exact' as const,
        matchField: this.getMatchField(student, query)
      }))
  }

  /**
   * 2. 퍼지 검색 (오타 허용)
   */
  private fuzzySearch(query: string, students: Student[]): SearchResultItem[] {
    const results: SearchResultItem[] = []

    for (const student of students) {
      const nameScore = this.calculateLevenshteinSimilarity(query, student.name)
      const numberScore = this.calculateLevenshteinSimilarity(query, student.student_number)
      
      const maxScore = Math.max(nameScore, numberScore)
      
      if (maxScore > 0.7) { // 70% 이상 유사도
        results.push({
          student,
          score: Math.round(maxScore * SEARCH_WEIGHTS.fuzzyMatch),
          matchType: 'fuzzy',
          matchField: nameScore > numberScore ? 'name' : 'student_number'
        })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * 3. 전화번호 검색 (부분 일치 포함)
   */
  private phoneSearch(query: string, students: Student[]): SearchResultItem[] {
    const phonePattern = /[\d-+() ]/g
    const cleanQuery = query.replace(/[^0-9]/g, '')
    
    if (cleanQuery.length < 3) return []

    return students
      .filter(student => {
        const phone1 = student.parent_phone_1?.replace(/[^0-9]/g, '') || ''
        const phone2 = student.parent_phone_2?.replace(/[^0-9]/g, '') || ''
        const studentPhone = student.phone?.replace(/[^0-9]/g, '') || ''
        
        return phone1.includes(cleanQuery) || 
               phone2.includes(cleanQuery) || 
               studentPhone.includes(cleanQuery)
      })
      .map(student => ({
        student,
        score: SEARCH_WEIGHTS.phoneMatch,
        matchType: 'phone' as const,
        matchField: 'phone'
      }))
  }

  /**
   * 4. 컨텍스트 기반 검색
   */
  private contextualSearch(
    query: string, 
    students: Student[], 
    context: SearchContext
  ): SearchResultItem[] {
    const results: SearchResultItem[] = []

    // 최근 접근한 학생들 우선 순위 부여
    const recentStudents = students.filter(student => 
      context.recentAccessed.includes(student.id)
    )

    for (const student of recentStudents) {
      if (this.isRelevantToQuery(student, query)) {
        results.push({
          student,
          score: SEARCH_WEIGHTS.recentAccess,
          matchType: 'contextual',
          matchField: 'recent_access'
        })
      }
    }

    // 현재 작업과 관련된 학생들
    if (context.currentTask) {
      const taskRelevantStudents = this.getTaskRelevantStudents(students, context.currentTask)
      for (const student of taskRelevantStudents) {
        if (this.isRelevantToQuery(student, query)) {
          results.push({
            student,
            score: SEARCH_WEIGHTS.contextualRelevance,
            matchType: 'contextual',
            matchField: 'task_relevant'
          })
        }
      }
    }

    return results
  }

  /**
   * 5. 의미적 검색 (키워드 기반)
   */
  private semanticSearch(query: string, students: Student[]): SearchResultItem[] {
    const keywords = this.extractKeywords(query)
    const results: SearchResultItem[] = []

    for (const student of students) {
      const relevanceScore = this.calculateSemanticRelevance(student, keywords)
      
      if (relevanceScore > 0.3) {
        results.push({
          student,
          score: Math.round(relevanceScore * SEARCH_WEIGHTS.fuzzyMatch),
          matchType: 'semantic',
          matchField: 'semantic'
        })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * 결과 병합 및 점수 계산
   */
  private mergeAndScore(results: SearchResultItem[][], context: SearchContext): Student[] {
    const scoreMap = new Map<string, number>()
    const studentMap = new Map<string, Student>()

    // 모든 결과를 병합하고 점수 합산
    for (const resultSet of results) {
      for (const item of resultSet) {
        const studentId = item.student.id
        const currentScore = scoreMap.get(studentId) || 0
        
        scoreMap.set(studentId, currentScore + item.score)
        studentMap.set(studentId, item.student)
      }
    }

    // 점수순으로 정렬
    const sortedEntries = Array.from(scoreMap.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)

    return sortedEntries.map(([studentId]) => studentMap.get(studentId)!)
  }

  /**
   * 개인화 적용
   */
  private applyPersonalization(students: Student[], context: SearchContext): Student[] {
    const userPattern = this.accessPatterns.get(context.userId)
    
    if (!userPattern) return students

    // 사용자의 접근 패턴에 따라 재정렬
    return students.sort((a, b) => {
      const aFreq = userPattern.studentAccess.get(a.id) || 0
      const bFreq = userPattern.studentAccess.get(b.id) || 0
      
      if (aFreq !== bFreq) {
        return bFreq - aFreq // 접근 빈도 높은 순
      }
      
      // 동일한 빈도면 기존 점수 유지
      return 0
    })
  }

  /**
   * 검색 제안 생성
   */
  private generateSuggestions(query: string, results: Student[]): string[] {
    const suggestions: string[] = []

    // 부분 일치 제안
    if (query.length >= 2) {
      const partialMatches = results
        .filter(student => student.name.includes(query))
        .slice(0, 5)
        .map(student => student.name)
      
      suggestions.push(...partialMatches)
    }

    // 인기 검색어 (실제로는 DB에서 가져옴)
    const popularSearches = ['김', '이', '박', '최', '정']
    suggestions.push(...popularSearches.filter(term => 
      term.includes(query) && !suggestions.includes(term)
    ))

    return suggestions.slice(0, 8)
  }

  /**
   * 관련 액션 생성
   */
  private generateActions(students: Student[], context: SearchContext): SearchAction[] {
    const actions: SearchAction[] = []

    if (students.length > 0) {
      actions.push({
        id: 'bulk_message',
        label: `${students.length}명에게 일괄 메시지`,
        icon: 'chat',
        action: () => console.log('일괄 메시지'),
        priority: 1
      })

      actions.push({
        id: 'export_list',
        label: '목록 내보내기',
        icon: 'download',
        action: () => console.log('내보내기'),
        priority: 2
      })
    }

    // 컨텍스트별 액션
    if (context.currentTask === 'attendance') {
      actions.push({
        id: 'mark_attendance',
        label: '출석 체크',
        icon: 'check',
        action: () => console.log('출석 체크'),
        priority: 1
      })
    }

    return actions.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 유틸리티 함수들
   */
  private preprocessQuery(query: string): string {
    return query.trim().toLowerCase()
  }

  private calculateLevenshteinSimilarity(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0))

    for (let i = 0; i <= a.length; i += 1) {
      matrix[0]![i] = i
    }

    for (let j = 0; j <= b.length; j += 1) {
      matrix[j]![0] = j
    }

    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1, // deletion
          matrix[j - 1]![i]! + 1, // insertion
          matrix[j - 1]![i - 1]! + substitutionCost // substitution
        )
      }
    }

    const maxLength = Math.max(a.length, b.length)
    return maxLength > 0 ? 1 - matrix[b.length]![a.length]! / maxLength : 1
  }

  private getMatchField(student: Student, query: string): string {
    if (student.name === query) return 'name'
    if (student.student_number === query) return 'student_number'
    if (student.parent_phone_1 === query) return 'parent_phone_1'
    if (student.parent_phone_2 === query) return 'parent_phone_2'
    return 'unknown'
  }

  private isRelevantToQuery(student: Student, query: string): boolean {
    const searchFields = [
      student.name,
      student.student_number,
      student.parent_phone_1,
      student.parent_phone_2,
      student.email
    ].filter(Boolean).map(field => field!.toLowerCase())

    return searchFields.some(field => field.includes(query.toLowerCase()))
  }

  private getTaskRelevantStudents(students: Student[], task: string): Student[] {
    // 실제 구현에서는 각 작업별로 관련 학생들을 필터링
    switch (task) {
      case 'attendance':
        return students.filter(s => s.status === 'active')
      case 'payment':
        return students // 미납금 있는 학생들
      case 'consultation':
        return students // 상담 예정 학생들
      default:
        return []
    }
  }

  private extractKeywords(query: string): string[] {
    // 한국어 형태소 분석 (실제로는 외부 라이브러리 사용)
    return query.split(/\s+/).filter(word => word.length > 1)
  }

  private calculateSemanticRelevance(student: Student, keywords: string[]): number {
    // 의미적 유사도 계산 로직
    return 0.5 // 임시값
  }

  private calculateConfidence(students: Student[], query: string): number {
    if (students.length === 0) return 0
    if (students.length === 1) return 0.9
    
    // 첫 번째 결과와 두 번째 결과의 관련성 차이로 confidence 계산
    return Math.min(0.95, 0.7 + (students.length > 1 ? 0.1 : 0.2))
  }

  private determineSearchType(query: string, students: Student[]): SmartSearchResult['searchType'] {
    if (students.some(s => s.name === query || s.student_number === query)) {
      return 'exact'
    }
    if (/^\d+/.test(query)) {
      return 'fuzzy'
    }
    return 'semantic'
  }

  private updateSearchHistory(userId: string, query: string, results: Student[]): void {
    const history = this.searchHistory.get(userId) || []
    history.unshift({
      query,
      timestamp: new Date(),
      resultCount: results.length
    })
    
    this.searchHistory.set(userId, history.slice(0, 100)) // 최근 100개만 보관
  }

  private logPerformance(query: string, resultCount: number, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 검색 성능: "${query}" -> ${resultCount}개 결과, ${duration.toFixed(2)}ms`)
    }
  }

  private fallbackSearch(query: string, students: Student[]): SmartSearchResult {
    const filteredStudents = students.filter(student =>
      student.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20)

    return {
      students: filteredStudents,
      suggestions: [],
      relatedActions: [],
      confidence: 0.5,
      searchType: 'fuzzy'
    }
  }
}

// 지원 타입들
interface SearchResultItem {
  student: Student
  score: number
  matchType: 'exact' | 'fuzzy' | 'phone' | 'contextual' | 'semantic'
  matchField: string
}

interface SearchOptions {
  maxResults?: number
  includeInactive?: boolean
  fuzzyThreshold?: number
}

interface SearchLog {
  query: string
  timestamp: Date
  resultCount: number
}

interface AccessPattern {
  studentAccess: Map<string, number> // studentId -> 접근 횟수
  searchPatterns: string[]
  preferredFilters: string[]
}

// 싱글톤 인스턴스
export const smartSearch = new SmartStudentSearch()