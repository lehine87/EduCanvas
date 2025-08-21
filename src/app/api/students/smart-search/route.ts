import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'
import type { Student } from '@/types/student.types'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// 스마트 검색 파라미터 스키마
const smartSearchSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  query: z.string().min(1, '검색어는 필수입니다'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  searchType: z.enum(['smart', 'exact', 'fuzzy', 'phone']).default('smart'),
  includeInactive: z.boolean().default(false),
  sortBy: z.enum(['relevance', 'name', 'recent', 'grade']).default('relevance'),
  filters: z.object({
    status: z.array(z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended'])).optional(),
    grade_level: z.array(z.string()).optional(),
    class_id: z.array(z.string().uuid()).optional()
  }).optional()
})

type SmartSearchParams = z.infer<typeof smartSearchSchema>

interface SmartSearchResult {
  students: Student[]
  suggestions: string[]
  totalCount: number
  searchLatency: number
  searchType: string
  confidence: number
  relatedActions: Array<{
    id: string
    label: string
    count: number
  }>
}

/**
 * 스마트 학생 검색 API
 * GET /api/students/smart-search?query=김민수&tenantId=xxx&limit=50
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const startTime = performance.now()
      
      logApiStart('smart-search-students', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        query: searchParams.get('query'),
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        searchType: searchParams.get('searchType') || 'smart',
        includeInactive: searchParams.get('includeInactive') === 'true',
        sortBy: searchParams.get('sortBy') || 'relevance',
        filters: searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : undefined
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        smartSearchSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: SmartSearchParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 학생 정보에 접근할 권한이 없습니다.')
      }

      // 검색어 전처리
      const processedQuery = preprocessQuery(params.query)
      
      // 스마트 검색 실행
      const searchResult = await executeSmartSearch(supabase, params, processedQuery)
      
      // 검색 결과 후처리
      const finalResult = await postProcessResults(searchResult, params, userProfile!.id)
      
      // 성능 메트릭 계산
      const searchLatency = performance.now() - startTime
      
      const response: SmartSearchResult = {
        students: finalResult.students,
        suggestions: finalResult.suggestions,
        totalCount: finalResult.totalCount,
        searchLatency,
        searchType: params.searchType,
        confidence: finalResult.confidence,
        relatedActions: finalResult.relatedActions
      }

      logApiSuccess('smart-search-students', { 
        resultCount: response.students.length,
        searchLatency: Math.round(searchLatency),
        searchType: params.searchType
      })

      return createSuccessResponse(response)
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 검색어 전처리
 */
function preprocessQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s가-힣0-9-]/g, '') // 특수문자 제거 (한글, 영문, 숫자, 하이픈만 허용)
}

/**
 * 스마트 검색 실행
 */
async function executeSmartSearch(
  supabase: SupabaseClient<Database>,
  params: SmartSearchParams,
  processedQuery: string
) {
  const { tenantId, searchType, includeInactive, filters } = params
  
  // 기본 쿼리 구성
  let query = supabase
    .from('students')
    .select(`
      *,
      classes:class_id (
        id,
        name,
        grade,
        course
      )
    `)
    .eq('tenant_id', tenantId)

  // 상태 필터링
  if (!includeInactive) {
    query = query.neq('status', 'withdrawn')
  }

  if (filters?.status && filters.status.length > 0) {
    // 유횤한 status 값만 필터링 (데이터베이스 스키마에 맞춘)
    const validStatuses = filters.status.filter((status: string) => 
      ['active', 'inactive', 'graduated', 'withdrawn', 'suspended'].includes(status)
    ) as ('active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended')[]
    if (validStatuses.length > 0) {
      query = query.in('status', validStatuses)
    }
  }

  if (filters?.grade_level && filters.grade_level.length > 0) {
    query = query.in('grade_level', filters.grade_level)
  }

  if (filters?.class_id && filters.class_id.length > 0) {
    query = query.in('class_id', filters.class_id)
  }

  // 검색 타입별 처리
  switch (searchType) {
    case 'exact':
      query = query.or(`name.eq.${processedQuery},student_number.eq.${processedQuery}`)
      break
      
    case 'phone':
      query = query.or(`parent_phone_1.like.%${processedQuery}%,parent_phone_2.like.%${processedQuery}%,phone.like.%${processedQuery}%`)
      break
      
    case 'fuzzy':
      query = query.or(`name.ilike.%${processedQuery}%,student_number.ilike.%${processedQuery}%`)
      break
      
    case 'smart':
    default:
      // 다중 필드 스마트 검색
      const searchConditions = [
        `name.ilike.%${processedQuery}%`,
        `student_number.ilike.%${processedQuery}%`,
        `parent_phone_1.like.%${processedQuery}%`,
        `parent_phone_2.like.%${processedQuery}%`,
        `phone.like.%${processedQuery}%`,
        `school_name.ilike.%${processedQuery}%`
      ]
      query = query.or(searchConditions.join(','))
      break
  }

  // 결과 제한
  query = query.range(params.offset, params.offset + params.limit - 1)

  // 정렬 적용
  switch (params.sortBy) {
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'recent':
      query = query.order('updated_at', { ascending: false })
      break
    case 'grade':
      query = query.order('grade_level', { ascending: true })
      break
    case 'relevance':
    default:
      // 관련성 순: 정확한 일치 > 접두사 일치 > 포함
      query = query.order('name', { ascending: true })
      break
  }

  const { data: students, error, count } = await query

  if (error) {
    console.error('❌ 스마트 검색 실패:', error)
    throw new Error(`스마트 검색 실패: ${error.message}`)
  }

  return {
    students: students || [],
    totalCount: count || 0
  }
}

/**
 * 검색 결과 후처리
 */
async function postProcessResults(
  searchResult: { students: Student[]; totalCount: number },
  params: SmartSearchParams,
  userId: string
) {
  const { students } = searchResult

  // 관련성 점수 계산 및 재정렬
  const scoredStudents = calculateRelevanceScores(students, params.query)

  // 검색 제안 생성
  const suggestions = generateSearchSuggestions(students, params.query)

  // 신뢰도 계산
  const confidence = calculateSearchConfidence(scoredStudents, params.query)

  // 관련 액션 생성
  const relatedActions = generateRelatedActions(students, params)

  // 사용자 검색 기록 업데이트 (비동기)
  updateSearchHistory(userId, params.query, students.length).catch(console.error)

  return {
    students: scoredStudents,
    suggestions,
    totalCount: searchResult.totalCount,
    confidence,
    relatedActions
  }
}

/**
 * 관련성 점수 계산
 */
function calculateRelevanceScores(students: Student[], query: string): Student[] {
  const queryLower = query.toLowerCase()
  
  return students
    .map(student => ({
      ...student,
      _relevanceScore: calculateStudentRelevance(student, queryLower)
    }))
    .sort((a: Student & { _relevanceScore: number }, b: Student & { _relevanceScore: number }) => b._relevanceScore - a._relevanceScore)
    .map(({ _relevanceScore, ...student }) => student) // 임시 스코어 제거
}

/**
 * 개별 학생 관련성 계산
 */
function calculateStudentRelevance(student: Student, queryLower: string): number {
  let score = 0

  // 정확한 일치 (최고점)
  if (student.name.toLowerCase() === queryLower) score += 100
  if (student.student_number.toLowerCase() === queryLower) score += 95

  // 접두사 일치
  if (student.name.toLowerCase().startsWith(queryLower)) score += 80
  if (student.student_number.toLowerCase().startsWith(queryLower)) score += 75

  // 포함
  if (student.name.toLowerCase().includes(queryLower)) score += 60
  if (student.student_number.toLowerCase().includes(queryLower)) score += 55

  // 연락처 일치
  if (student.parent_phone_1?.includes(queryLower)) score += 70
  if (student.parent_phone_2?.includes(queryLower)) score += 70
  if (student.phone?.includes(queryLower)) score += 65

  // 학교명 일치
  if (student.school_name?.toLowerCase().includes(queryLower)) score += 40

  // 활성 상태 보너스
  if (student.status === 'active') score += 10

  return score
}

/**
 * 검색 제안 생성
 */
function generateSearchSuggestions(students: Student[], query: string): string[] {
  const suggestions = new Set<string>()
  const queryLower = query.toLowerCase()

  // 부분 일치하는 이름들 수집
  students.forEach(student => {
    if (student.name.toLowerCase().includes(queryLower) && 
        student.name.length > query.length) {
      suggestions.add(student.name)
    }
  })

  // 최대 8개까지만 반환
  return Array.from(suggestions).slice(0, 8)
}

/**
 * 검색 신뢰도 계산
 */
function calculateSearchConfidence(students: Student[], query: string): number {
  if (students.length === 0) return 0
  
  const queryLower = query.toLowerCase()
  let exactMatches = 0
  let strongMatches = 0

  students.forEach(student => {
    if (student.name.toLowerCase() === queryLower || 
        student.student_number.toLowerCase() === queryLower) {
      exactMatches++
    } else if (student.name.toLowerCase().startsWith(queryLower) ||
               student.student_number.toLowerCase().startsWith(queryLower)) {
      strongMatches++
    }
  })

  // 신뢰도 계산 로직
  if (exactMatches > 0) return Math.min(0.95, 0.8 + (exactMatches * 0.05))
  if (strongMatches > 0) return Math.min(0.8, 0.6 + (strongMatches * 0.1))
  if (students.length === 1) return 0.7
  if (students.length <= 5) return 0.6
  
  return 0.4
}

/**
 * 관련 액션 생성
 */
function generateRelatedActions(students: Student[], params: SmartSearchParams) {
  const actions = []

  if (students.length > 1) {
    actions.push({
      id: 'bulk_message',
      label: `${students.length}명에게 일괄 메시지`,
      count: students.length
    })
  }

  const activeStudents = students.filter(s => s.status === 'active')
  if (activeStudents.length > 0) {
    actions.push({
      id: 'attendance_check',
      label: '출석 체크',
      count: activeStudents.length
    })
  }

  const graduatedStudents = students.filter(s => s.status === 'graduated')
  if (graduatedStudents.length > 0) {
    actions.push({
      id: 'alumni_contact',
      label: '졸업생 연락',
      count: graduatedStudents.length
    })
  }

  return actions
}

/**
 * 검색 기록 업데이트
 */
async function updateSearchHistory(userId: string, query: string, resultCount: number): Promise<void> {
  try {
    // 실제 구현에서는 별도 테이블에 검색 로그 저장
    console.log(`검색 기록 저장: ${userId} - "${query}" (${resultCount}개 결과)`)
  } catch (error) {
    console.error('검색 기록 저장 실패:', error)
  }
}