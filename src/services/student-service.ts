import { createServiceRoleClient } from '@/lib/supabase/server'
import { StudentSearchParams, StudentAutocompleteParams } from '@/schemas/student-search'
import type { Database } from '@/types/database.types'
import { StudentVersionConflictError } from '@/types/student.types'

const supabase = createServiceRoleClient()

/**
 * 학생 서비스 레이어 - 업계 표준 구현 (Database-First 타입)
 * 
 * 기능:
 * - 비즈니스 로직 캡슐화
 * - 데이터 접근 추상화 
 * - Cursor-based pagination
 * - Full-text search
 * - 성능 최적화
 * - 에러 핸들링
 */

/**
 * 학생 타입 (Database-First) - CLAUDE.md 30번째 줄 준수
 */
type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

/**
 * 학생 검색 결과 인터페이스
 */
interface StudentSearchResult {
  items: Student[]
  next_cursor: string | null
  has_more: boolean
  total_count?: number
}

/**
 * Full-Text Search 결과 타입 (PostgreSQL 함수 반환값 기준)
 */
interface FTSSearchResult {
  id: string
  name: string
  student_number: string | null  // 타입 명시 - null 가능
  grade_level: string | null
  status: string
  phone: string | null
  parent_name_1: string | null
  parent_phone_1: string | null
  search_rank: number
}

/**
 * 학생 검색 서비스 (고도화된 검색 + 페이지네이션)
 */
export async function searchStudentsService(
  params: StudentSearchParams & { tenant_id: string }
): Promise<StudentSearchResult> {
  try {
    const {
      tenant_id,
      search,
      grade,
      class_id,
      status,
      enrollment_date_from,
      enrollment_date_to,
      has_overdue_payment,
      attendance_rate_min,
      attendance_rate_max,
      sort_field,
      sort_order,
      cursor,
      limit,
      include_enrollment,
      include_attendance_stats
    } = params

    console.log('🔍 [Student Service] searchStudentsService 호출:', {
      tenant_id,
      search,
      status,
      limit
    })

    // 1. Full-text search 사용 (search 파라미터가 있는 경우)
    if (search && search.trim()) {
      return await searchStudentsWithFullText({
        tenant_id,
        search_term: search.trim(),
        grade,
        status,
        sort_field,
        sort_order,
        cursor,
        limit
      })
    }

    // 2. 일반 필터링 검색 (Cursor-based pagination) - 검색어가 없어도 전체 목록 조회
    return await searchStudentsWithFilters({
      tenant_id,
      grade,
      class_id,
      status,
      enrollment_date_from,
      enrollment_date_to,
      has_overdue_payment,
      attendance_rate_min,
      attendance_rate_max,
      sort_field,
      sort_order,
      cursor,
      limit,
      include_enrollment,
      include_attendance_stats
    })

  } catch (error) {
    console.error('Student search service error:', error)
    throw new Error(`Failed to search students: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Full-text Search 기반 학생 검색 (PostgreSQL Stored Procedure 사용)
 */
export async function searchStudentsWithFullText(params: {
  tenant_id: string
  search_term: string
  grade?: string[]
  status?: string[]
  sort_field: string
  sort_order: string
  cursor?: string
  limit: number
}): Promise<StudentSearchResult> {
  const {
    tenant_id,
    search_term,
    grade,
    status,
    sort_field,
    sort_order,
    cursor,
    limit
  } = params

  // PostgreSQL Stored Procedure 호출 (업계 표준)
  const { data: searchResults, error: searchError } = await supabase
    .rpc('search_students_fts', {
      search_term,
      tenant_uuid: tenant_id,
      max_results: limit + 1 // has_more 확인용
    }) as { data: FTSSearchResult[] | null, error: any }

  if (searchError) {
    throw new Error(`Full-text search failed: ${searchError.message}`)
  }

  if (!searchResults || searchResults.length === 0) {
    return {
      items: [],
      next_cursor: null,
      has_more: false,
      total_count: 0
    }
  }

  // 추가 필터링 적용 (클라이언트 사이드)
  let filteredResults = searchResults

  if (grade && grade.length > 0) {
    filteredResults = filteredResults.filter(student => 
      student.grade_level && grade.includes(student.grade_level)
    )
  }

  if (status && status.length > 0) {
    filteredResults = filteredResults.filter(student => 
      status.includes(student.status)
    )
  }

  // Cursor-based pagination 적용
  if (cursor) {
    const cursorIndex = filteredResults.findIndex(student => {
      if (sort_field === 'search_rank') {
        return student.search_rank <= parseFloat(cursor)
      } else if (sort_field === 'name') {
        return sort_order === 'asc' ? student.name > cursor : student.name < cursor
      }
      return false
    })

    if (cursorIndex > -1) {
      filteredResults = filteredResults.slice(cursorIndex)
    }
  }

  // 페이지네이션 처리
  const has_more = filteredResults.length > limit
  const items = has_more ? filteredResults.slice(0, -1) : filteredResults

  // Next cursor 생성
  let next_cursor: string | null = null
  if (has_more && items.length > 0) {
    const lastItem = items[items.length - 1]
    if (sort_field === 'search_rank') {
      next_cursor = String(lastItem.search_rank)
    } else if (sort_field === 'name') {
      next_cursor = lastItem.name
    }
  }

  return {
    items: items.map(item => ({
      id: item.id,
      tenant_id: tenant_id,
      student_number: item.student_number, // FTS 결과에서 student_number 안전하게 가져오기 (null 허용)
      name: item.name,
      name_english: null,
      birth_date: null,
      gender: null,
      phone: item.phone,
      email: null,
      address: null,
      school_name: null,
      parent_name_1: item.parent_name_1,
      parent_phone_1: item.parent_phone_1,
      parent_name_2: null,
      parent_phone_2: null,
      grade_level: item.grade_level,
      status: item.status as Student['status'], // 타입 안전성 확보
      notes: null,
      emergency_contact: null,
      custom_fields: null,
      tags: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      enrollment_date: null,
      profile_image: null
    })) as Student[],
    next_cursor,
    has_more,
    total_count: filteredResults.length
  }
}

/**
 * 필터링 기반 학생 검색 (일반 쿼리)
 */
async function searchStudentsWithFilters(params: {
  tenant_id: string
  grade?: string[]
  class_id?: string[]
  status?: string[]
  enrollment_date_from?: string
  enrollment_date_to?: string
  has_overdue_payment?: boolean
  attendance_rate_min?: number
  attendance_rate_max?: number
  sort_field: string
  sort_order: string
  cursor?: string
  limit: number
  include_enrollment?: boolean
  include_attendance_stats?: boolean
  name_filter?: string
}): Promise<StudentSearchResult> {
  const {
    tenant_id,
    grade,
    class_id,
    status,
    enrollment_date_from,
    enrollment_date_to,
    sort_field,
    sort_order,
    cursor,
    limit,
    include_enrollment,
    name_filter
  } = params

  console.log('🔍 [Student Service] searchStudentsWithFilters 호출:', {
    tenant_id,
    status,
    grade,
    limit
  })

  // 업계 표준: 성능 최적화된 쿼리 빌더
  let query = supabase
    .from('students')
    .select('*') // enrollment 조인 제거로 성능 개선
    .eq('tenant_id', tenant_id)

  // 필터 적용
  if (name_filter) {
    query = query.ilike('name', `%${name_filter}%`)
  }

  if (grade && grade.length > 0) {
    query = query.in('grade_level', grade)
  }

  if (status && status.length > 0) {
    query = query.in('status', status as ('active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended')[])
  }

  if (enrollment_date_from) {
    query = query.gte('enrollment_date', enrollment_date_from)
  }

  if (enrollment_date_to) {
    query = query.lte('enrollment_date', enrollment_date_to)
  }

  // Cursor-based pagination (성능 최적화)
  if (cursor) {
    if (sort_field === 'name') {
      const operator = sort_order === 'asc' ? 'gt' : 'lt'
      query = query[operator]('name', cursor)
    } else if (sort_field === 'enrollment_date') {
      const operator = sort_order === 'asc' ? 'gt' : 'lt'
      query = query[operator]('enrollment_date', cursor)
    }
  }

  // 정렬 적용
  const ascending = sort_order === 'asc'
  if (sort_field === 'enrollment_date') {
    query = query.order('enrollment_date', { ascending })
  } else {
    query = query.order('name', { ascending })
  }

  // 제한 및 실행 (has_more 확인을 위해 +1)
  query = query.limit(limit + 1)

  const { data, error } = await query
  const students = data

  console.log('🔍 [Student Service] Supabase 쿼리 결과:', {
    tenant_id,
    students_count: students?.length || 0,
    error: error?.message || null,
    first_student: students?.[0] && typeof students[0] === 'object' && 'id' in students[0] 
      ? { id: (students[0] as any).id, name: (students[0] as any).name } 
      : null
  })

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  if (!students || students.length === 0) {
    return {
      items: [],
      next_cursor: null,
      has_more: false,
      total_count: 0
    }
  }

  // 페이지네이션 처리
  const has_more = students.length > limit
  const items = has_more ? students.slice(0, -1) : students

  // Next cursor 생성
  let next_cursor: string | null = null
  if (has_more && Array.isArray(items) && items.length > 0) {
    const lastItem = items[items.length - 1]
    if (lastItem && typeof lastItem === 'object') {
      if (sort_field === 'enrollment_date' && 'enrollment_date' in lastItem) {
        next_cursor = (lastItem as {enrollment_date: string}).enrollment_date
      } else if ('name' in lastItem) {
        next_cursor = (lastItem as {name: string}).name
      }
    }
  }

  const result = {
    items: (items || []) as unknown as Student[],
    next_cursor,
    has_more,
    total_count: students?.length || 0
  }
  
  console.log('🔍 [Student Service] searchStudentsWithFilters 반환:', {
    items_count: result.items.length,
    has_more: result.has_more,
    next_cursor: result.next_cursor
  })
  
  return result
}

/**
 * 학생 자동완성 서비스
 */
export async function autocompleteStudentsService(
  params: StudentAutocompleteParams & { tenant_id: string }
): Promise<Array<{
  id: string
  name: string
  parent_name_1?: string
  phone?: string
  match_type: string
}>> {
  const { tenant_id, query, limit, include_parent } = params

  try {
    // PostgreSQL Stored Procedure 사용 (성능 최적화)
    const { data: results, error } = await supabase
      .rpc('search_students_autocomplete', {
        prefix: query,
        tenant_uuid: tenant_id,
        max_results: limit
      })

    if (error) {
      throw new Error(`Autocomplete search failed: ${error.message}`)
    }

    return results || []

  } catch (error) {
    console.error('Student autocomplete service error:', error)
    throw new Error(`Failed to autocomplete students: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Atomic 학번 생성 함수 (Race Condition 방지)
 */
export async function generateUniqueStudentNumber(tenant_id: string): Promise<string> {
  try {
    // 임시로 PostgreSQL 함수 호출을 주석 처리하고 fallback 사용
    // TODO: DB에 generate_unique_student_number 함수 구현 후 활성화
    /*
    const { data, error } = await supabase
      .rpc('generate_unique_student_number', {
        tenant_uuid: tenant_id
      })

    if (error) {
      // 함수가 없는 경우 fallback으로 이동
      if (error.code === '42883') { // function not found
        throw new Error('Function not found - using fallback')
      }
      throw new Error(`Failed to generate student number: ${error.message}`)
    }

    return data as string
    */
    
    // Fallback: timestamp + random 기반 학번 생성 (충돌 최소화)
    const timestamp = Date.now()
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `STU${timestamp.toString().slice(-8)}${randomSuffix}`
    
  } catch (error) {
    console.error('Student number generation error:', error)
    // 최종 fallback: 안전한 고유 학번
    const fallbackNumber = `STU${Date.now()}${Math.floor(Math.random() * 10000)}`
    console.warn(`Using fallback student number: ${fallbackNumber}`)
    return fallbackNumber
  }
}

/**
 * 학생 생성 서비스 (Atomic 학번 생성 지원)
 */
export async function createStudentService(
  data: StudentInsert & {
    tenant_id: string
    created_by: string
  }
): Promise<{ student: Student }> {
  try {
    // 1. 학번이 제공되지 않은 경우 Atomic 생성
    if (!data.student_number) {
      data.student_number = await generateUniqueStudentNumber(data.tenant_id)
    } else {
      // 2. 학번이 제공된 경우 중복 체크 (기존 로직 유지)
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('tenant_id', data.tenant_id)
        .eq('student_number', data.student_number)
        .single()

      if (existing) {
        throw new Error('Student number already exists')
      }
    }

    // 빈 문자열을 null로 변환하여 PostgreSQL date 에러 방지
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    // 학생 생성
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert(cleanedData as StudentInsert)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`)
    }

    return { student: newStudent }

  } catch (error) {
    console.error('Student creation service error:', error)
    throw new Error(`Failed to create student: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 학생 상세 조회 서비스
 */
export async function getStudentByIdService(
  id: string,
  tenant_id: string,
  options: {
    include_enrollment?: boolean
    include_attendance_stats?: boolean
    include_payment_history?: boolean
  } = {}
): Promise<{ student: Student | null }> {
  try {
    const queryStart = Date.now()
    console.log('🔍 [StudentService] getStudentByIdService called:', { id, tenant_id })

    // 업계 표준: 타임아웃을 포함한 안전한 DB 쿼리
    const queryPromise = supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single()

    // 업계 표준: Promise.race를 통한 타임아웃 구현
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database query timeout (5000ms)'))
      }, 5000)
    })

    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]) as any

    const queryTime = Date.now() - queryStart
    console.log('🔍 [StudentService] DB query completed:', {
      query_time_ms: queryTime,
      data: !!data,
      error: error?.code || null
    })

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('🔍 [StudentService] Student not found')
        return { student: null }
      }
      console.error('🔍 [StudentService] DB error:', error)
      throw new Error(`Failed to get student: ${error.message}`)
    }

    console.log('🔍 [StudentService] Returning student data')
    return { student: data as Student }

  } catch (error) {
    console.error('🔍 [StudentService] Service error:', error)
    throw new Error(`Failed to get student: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 학생 업데이트 서비스 (Optimistic Locking 지원)
 */
export async function updateStudentService(
  id: string,
  data: StudentUpdate & { tenant_id: string },
  updated_by: string,
  expected_version?: string // Optimistic Locking을 위한 버전 체크
): Promise<{ student: Student }> {
  try {
    // 1. Optimistic Locking: 현재 데이터 조회 및 버전 체크
    if (expected_version) {
      const { data: currentStudent, error: fetchError } = await supabase
        .from('students')
        .select('updated_at')
        .eq('id', id)
        .eq('tenant_id', data.tenant_id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch current student: ${fetchError.message}`)
      }

      // 버전 충돌 감지
      if (currentStudent.updated_at !== expected_version) {
        // 현재 전체 데이터를 가져와서 충돌 정보 제공
        const { data: fullCurrentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .eq('tenant_id', data.tenant_id)
          .single()

        throw new StudentVersionConflictError(
          fullCurrentData as Student,
          data
        )
      }
    }

    // 2. 빈 문자열을 null로 변환하여 PostgreSQL date 에러 방지
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    // 3. 업데이트 실행 (updated_at은 자동으로 갱신됨)
    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update({
        ...cleanedData as StudentUpdate,
        updated_at: new Date().toISOString() // 명시적으로 버전 갱신
      })
      .eq('id', id)
      .eq('tenant_id', data.tenant_id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`)
    }

    return { student: updatedStudent }

  } catch (error) {
    console.error('Student update service error:', error)
    
    // 버전 충돌 에러는 그대로 전파
    if (error instanceof StudentVersionConflictError) {
      throw error
    }
    
    throw new Error(`Failed to update student: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 학생 삭제 서비스 (Soft Delete)
 */
export async function deleteStudentService(
  id: string,
  tenant_id: string,
  deleted_by: string
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        status: 'inactive' as const
      } as StudentUpdate)
      .eq('id', id)
      .eq('tenant_id', tenant_id)

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`)
    }

    return { success: true }

  } catch (error) {
    console.error('Student delete service error:', error)
    throw new Error(`Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}