import { createServiceRoleClient } from '@/lib/supabase/server'
import { StudentSearchParams, StudentAutocompleteParams } from '@/schemas/student-search'
import type { Database } from '@/types/database.types'

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

    // 2. 일반 필터링 검색 (Cursor-based pagination)
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
async function searchStudentsWithFullText(params: {
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
    })

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
      grade.includes(student.grade_level)
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
      student_number: '',  // FTS 결과에는 없으므로 빈 문자열
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
      status: item.status,
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

  // 동적 쿼리 빌더 (업계 표준 패턴)
  let query = supabase
    .from('students')
    .select(include_enrollment ? 
      `*, student_enrollments(*)` : 
      '*'
    )
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

  return {
    items: (students || []) as unknown as Student[],
    next_cursor,
    has_more
  }
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
 * 학생 생성 서비스 (Database-First 타입)
 */
export async function createStudentService(
  data: StudentInsert & {
    tenant_id: string
    created_by: string
  }
): Promise<{ student: Student }> {
  try {
    // 학번 중복 체크 (비즈니스 로직)
    if (data.student_number) {
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

    // 학생 생성
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
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
    const { include_enrollment, include_attendance_stats, include_payment_history } = options

    let selectQuery = `
      *
      ${include_enrollment ? `,
        enrollments:student_enrollments(*)
      ` : ''}
    `

    const { data, error } = await supabase
      .from('students')
      .select(selectQuery)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single()
    
    const student = data

    if (error) {
      if (error.code === 'PGRST116') {
        return { student: null }
      }
      throw new Error(`Failed to get student: ${error.message}`)
    }

    return { student: student as unknown as Student | null }

  } catch (error) {
    console.error('Get student service error:', error)
    throw new Error(`Failed to get student: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 학생 업데이트 서비스 (Database-First 타입)
 */
export async function updateStudentService(
  id: string,
  data: StudentUpdate & { tenant_id: string },
  updated_by: string
): Promise<{ student: Student }> {
  try {
    // 빈 문자열을 null로 변환하여 PostgreSQL date 에러 방지
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString()
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
        status: 'inactive',
        updated_at: new Date().toISOString(),
        // deleted_at: new Date().toISOString(), // 필요시 추가
        // deleted_by // 필요시 추가
      })
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