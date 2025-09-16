import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateCursor, parseCursor } from '@/lib/api-response'
import type { 
  ClassSearchParams, 
  ClassCreateData, 
  ClassUpdateData, 
  ClassDeleteData,
  ClassMoveStudentData 
} from '@/schemas/class-search'
import type { Class } from '@/types/class.types'

/**
 * 클래스 검색 결과 인터페이스
 */
export interface ClassSearchResult {
  items: Class[]
  next_cursor: string | null
  has_more: boolean
  total_count?: number
}

/**
 * 클래스 상세 조회 결과 인터페이스
 */
export interface ClassDetailResult {
  class: Class | null
  error?: string
}

/**
 * 클래스 생성/수정 결과 인터페이스
 */
export interface ClassMutationResult {
  class?: Class
  error?: string
  success: boolean
}

/**
 * 클래스 검색 서비스 (통합)
 * Full-text search와 필터링 검색을 자동으로 선택
 */
export async function searchClassService(
  params: ClassSearchParams
): Promise<ClassSearchResult> {
  try {
    console.log('🔍 [ClassService] 검색 시작:', params)

    // 검색어가 있는 경우 Full-text search 사용
    if (params.search?.trim()) {
      console.log('🔍 [ClassService] Full-text search 실행')
      return await searchClassWithFullText(params)
    }

    // 일반 필터링 검색
    console.log('🔍 [ClassService] 필터링 검색 실행')
    return await searchClassWithFilters(params)

  } catch (error) {
    console.error('❌ [ClassService] 검색 서비스 에러:', error)
    throw new Error(`클래스 검색 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

/**
 * Full-text search를 이용한 클래스 검색 (업계 표준 구현)
 * PostgreSQL GIN 인덱스 및 Stored Procedure 활용
 */
async function searchClassWithFullText(
  params: ClassSearchParams
): Promise<ClassSearchResult> {
  const supabase = createServiceRoleClient()
  
  console.log('🔍 [ClassService] Full-text search 실행:', params.search)
  
  // PostgreSQL Stored Procedure 호출 (최적화된 검색)
  const { data: searchResults, error: ftsError } = await supabase
    .rpc('search_classes_fts', {
      search_term: params.search!,
      tenant_uuid: params.tenant_id!,
      max_results: params.limit + 1 // has_more 판단용
    })

  if (ftsError) {
    console.error('❌ [ClassService] FTS 에러:', ftsError)
    // FTS 실패 시 fallback to basic search
    return await searchClassWithFallback(params)
  }

  console.log('✅ [ClassService] FTS 결과:', searchResults?.length)

  // 추가 필터 적용 (FTS 결과에서)
  let filteredResults: any[] = searchResults || []
  
  if (params.status !== 'all') {
    const isActive = params.status === 'active'
    filteredResults = filteredResults.filter((cls: any) => cls.is_active === isActive)
  }
  
  if (params.grade) {
    filteredResults = filteredResults.filter((cls: any) => cls.grade === params.grade)
  }
  
  if (params.course) {
    filteredResults = filteredResults.filter((cls: any) => cls.course === params.course)
  }
  
  if (params.subject) {
    filteredResults = filteredResults.filter((cls: any) => cls.subject === params.subject)
  }
  
  if (params.instructor_id) {
    filteredResults = filteredResults.filter((cls: any) => cls.instructor_id === params.instructor_id)
  }

  // 정렬 적용 (search_rank는 이미 FTS에서 적용됨)
  if (params.sort_field !== 'name') {
    filteredResults.sort((a: any, b: any) => {
      let aValue: any, bValue: any
      
      switch (params.sort_field) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'grade':
          aValue = a.grade || ''
          bValue = b.grade || ''
          break
        default:
          return 0
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return params.sort_order === 'asc' ? comparison : -comparison
    })
  }

  // 페이지네이션 처리
  const has_more = filteredResults.length > params.limit
  const items = has_more ? filteredResults.slice(0, -1) : filteredResults

  // 강사 정보 추가 (FTS 결과에는 instructor_id만 있음)
  const enrichedItems = await enrichWithInstructorInfo(items, params.tenant_id!)
  
  // 학생 수 정보 추가
  const itemsWithStudentCount = await enrichWithStudentCount(enrichedItems, params.tenant_id!)

  return {
    items: itemsWithStudentCount as Class[],
    next_cursor: has_more ? generateCursor(itemsWithStudentCount[itemsWithStudentCount.length - 1]) : null,
    has_more,
    total_count: filteredResults.length
  }
}

/**
 * FTS 실패 시 fallback 검색
 */
async function searchClassWithFallback(
  params: ClassSearchParams
): Promise<ClassSearchResult> {
  console.log('⚠️ [ClassService] FTS fallback 검색 실행')
  
  const supabase = createServiceRoleClient()
  
  let query = supabase
    .from('classes')
    .select('*')
    .eq('tenant_id', params.tenant_id!)

  // 기본 LIKE 검색
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  // 공통 필터 적용
  query = applyCommonFilters(query, params)

  // 정렬 및 제한
  const sortField = params.sort_field === 'student_count' ? 'created_at' : params.sort_field
  query = query
    .order(sortField, { ascending: params.sort_order === 'asc' })
    .limit(params.limit + 1)

  const { data, error } = await query

  if (error) {
    throw new Error(`Fallback 검색 실패: ${error.message}`)
  }

  // 강사 정보 추가
  const enrichedItems = await enrichWithInstructorInfo(data || [], params.tenant_id!)
  
  // 학생 수 정보 추가
  const itemsWithStudentCount = await enrichWithStudentCount(enrichedItems, params.tenant_id!)

  // 페이지네이션 처리
  const has_more = itemsWithStudentCount.length > params.limit
  const items = has_more ? itemsWithStudentCount.slice(0, -1) : itemsWithStudentCount

  return {
    items: items as Class[],
    next_cursor: has_more ? generateCursor(items[items.length - 1]) : null,
    has_more,
    total_count: itemsWithStudentCount.length
  }
}

/**
 * 필터링을 이용한 클래스 검색
 */
async function searchClassWithFilters(
  params: ClassSearchParams
): Promise<ClassSearchResult> {
  const supabase = createServiceRoleClient()

  console.log('🔍 [ClassService] RPC를 사용한 필터링 검색 시작:', params)

  // RPC 함수 호출로 관계 충돌 문제 우회 (업계 표준 접근법)
  const { data, error } = await supabase.rpc('search_classes_simple', {
    p_tenant_id: params.tenant_id!,
    p_limit: params.limit + 1 // has_more 판단용
  })

  if (error) {
    console.error('❌ [ClassService] RPC 검색 실패:', error)
    throw new Error(`RPC 검색 실패: ${error.message}`)
  }

  console.log('✅ [ClassService] RPC 검색 성공:', data?.length || 0)

  // 클라이언트 사이드에서 추가 필터링 적용
  let filteredData = (data as Class[]) || []

  // 상태 필터
  if (params.status !== 'all') {
    const isActive = params.status === 'active'
    filteredData = filteredData.filter(cls => cls.is_active === isActive)
  }

  // 기타 필터들
  if (params.grade) {
    filteredData = filteredData.filter(cls => cls.grade === params.grade)
  }
  
  if (params.course) {
    filteredData = filteredData.filter(cls => cls.course === params.course)
  }
  
  if (params.subject) {
    filteredData = filteredData.filter(cls => cls.subject === params.subject)
  }
  
  if (params.instructor_id) {
    filteredData = filteredData.filter(cls => cls.instructor_id === params.instructor_id)
  }

  if (params.classroom_id) {
    filteredData = filteredData.filter(cls => cls.classroom_id === params.classroom_id)
  }

  // 검색어 필터 (RPC에서는 기본적으로 모든 데이터를 가져오므로)
  if (params.search?.trim()) {
    const searchTerm = params.search.toLowerCase().trim()
    filteredData = filteredData.filter(cls => 
      cls.name?.toLowerCase().includes(searchTerm) ||
      cls.description?.toLowerCase().includes(searchTerm) ||
      cls.subject?.toLowerCase().includes(searchTerm) ||
      cls.course?.toLowerCase().includes(searchTerm)
    )
  }

  // 정렬 적용
  const sortField = params.sort_field || 'name'
  const sortOrder = params.sort_order || 'asc'
  
  filteredData.sort((a, b) => {
    let aValue: unknown, bValue: unknown
    
    switch (sortField) {
      case 'created_at':
        aValue = new Date(a.created_at || 0).getTime()
        bValue = new Date(b.created_at || 0).getTime()
        break
      case 'name':
        aValue = a.name || ''
        bValue = b.name || ''
        break
      case 'grade':
        aValue = a.grade || ''
        bValue = b.grade || ''
        break
      default:
        // 안전한 타입 캐스팅을 위한 인덱스 시그니처 처리
        aValue = (a as unknown as Record<string, string | number | null>)[sortField] || ''
        bValue = (b as unknown as Record<string, string | number | null>)[sortField] || ''
    }
    
    if (sortOrder === 'desc') {
      return (aValue as string | number) < (bValue as string | number) ? 1 : (aValue as string | number) > (bValue as string | number) ? -1 : 0
    } else {
      return (aValue as string | number) > (bValue as string | number) ? 1 : (aValue as string | number) < (bValue as string | number) ? -1 : 0
    }
  })

  // Cursor-based pagination 처리 (간단한 offset 방식으로 대체)
  let startIndex = 0
  if (params.cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(params.cursor, 'base64').toString())
      startIndex = parsed.offset || 0
    } catch (error) {
      console.warn('⚠️ [ClassService] 잘못된 커서 형식:', params.cursor)
    }
  }

  const endIndex = startIndex + params.limit
  const paginatedData = filteredData.slice(startIndex, endIndex + 1)

  // 페이지네이션 처리
  const has_more = paginatedData.length > params.limit
  const items = has_more ? paginatedData.slice(0, -1) : paginatedData

  // 다음 커서 생성
  const next_cursor = has_more 
    ? generateCursor({ id: String(endIndex), created_at: new Date().toISOString() })
    : null

  // 기본 instructor와 student_count 추가 (나중에 별도 함수로 enrichment 가능)
  const itemsWithDefaults = items.map(cls => ({
    ...cls,
    instructor: null,
    student_count: 0
  }))

  return {
    items: itemsWithDefaults as Class[],
    next_cursor,
    has_more
  }
}

/**
 * 공통 필터 적용 헬퍼
 */
function applyCommonFilters(query: any, params: ClassSearchParams): any {
  // 상태 필터링
  if (params.status !== 'all') {
    query = query.eq('is_active', params.status === 'active')
  }

  // 학년 필터링
  if (params.grade) {
    query = query.eq('grade', params.grade)
  }

  // 과정 필터링
  if (params.course) {
    query = query.eq('course', params.course)
  }

  // 과목 필터링
  if (params.subject) {
    query = query.eq('subject', params.subject)
  }

  // 강사 필터링
  if (params.instructor_id) {
    query = query.eq('instructor_id', params.instructor_id)
  }

  // 교실 필터링
  if (params.classroom_id) {
    query = query.eq('classroom_id', params.classroom_id)
  }

  return query
}

/**
 * 강사 정보 추가 (FTS 결과용)
 */
async function enrichWithInstructorInfo(classes: any[], tenant_id: string): Promise<any[]> {
  if (classes.length === 0) return classes

  const supabase = createServiceRoleClient()
  const instructorIds = classes
    .map(cls => cls.instructor_id)
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index) // 중복 제거

  if (instructorIds.length === 0) {
    return classes.map(cls => ({ ...cls, instructor: null }))
  }

  // 강사 정보 조회 - 멤버십만 먼저 조회
  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_memberships')
    .select('id, user_id')
    .in('id', instructorIds)
    .eq('tenant_id', tenant_id)
    .eq('status', 'active')

  if (membershipError) {
    console.warn('⚠️ [ClassService] 멤버십 조회 실패:', membershipError)
    return classes.map(cls => ({ ...cls, instructor: null }))
  }

  if (!memberships || memberships.length === 0) {
    return classes.map(cls => ({ ...cls, instructor: null }))
  }

  // 사용자 프로필 별도 조회
  const userIds = memberships.map(m => m.user_id).filter(Boolean) as string[]
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, name, email')
    .in('id', userIds)

  if (error) {
    console.warn('⚠️ [ClassService] 프로필 조회 실패:', error)
    return classes.map(cls => ({ ...cls, instructor: null }))
  }

  // 멤버십 ID와 사용자 정보 매핑 생성
  const membershipUserMap: Record<string, any> = {}
  memberships.forEach(membership => {
    if (membership.user_id) {
      const profile = profiles?.find(p => p.id === membership.user_id)
      if (profile) {
        membershipUserMap[membership.id] = {
          id: profile.id,
          name: profile.name,
          email: profile.email
        }
      }
    }
  })

  // 클래스 정보에 강사 정보 추가
  return classes.map(cls => ({
    ...cls,
    instructor: cls.instructor_id ? membershipUserMap[cls.instructor_id] || null : null
  }))
}

/**
 * 학생 수 정보 추가 (성능 최적화)
 */
async function enrichWithStudentCount(classes: any[], tenant_id: string): Promise<any[]> {
  if (classes.length === 0) return classes

  const supabase = createServiceRoleClient()
  const classIds = classes.map(cls => cls.id).filter(Boolean)

  if (classIds.length === 0) return classes

  // 클래스별 학생 수 집계
  const { data: enrollmentCounts, error } = await supabase
    .from('student_enrollments')
    .select('class_id')
    .in('class_id', classIds)
    .eq('status', 'active')

  if (error) {
    console.warn('⚠️ [ClassService] 학생 수 조회 실패:', error)
    return classes.map(cls => ({ ...cls, student_count: 0 }))
  }

  // 클래스별 학생 수 맵 생성
  const studentCountMap: Record<string, number> = {}
  enrollmentCounts?.forEach(enrollment => {
    if (enrollment.class_id) {
      studentCountMap[enrollment.class_id] = (studentCountMap[enrollment.class_id] || 0) + 1
    }
  })

  // 클래스 정보에 학생 수 추가
  return classes.map(cls => ({
    ...cls,
    student_count: studentCountMap[cls.id] || 0
  }))
}

/**
 * 클래스 상세 조회 서비스
 */
export async function getClassByIdService(
  classId: string,
  tenant_id: string,
  options: {
    include_students?: boolean
    include_schedules?: boolean
  } = {}
): Promise<ClassDetailResult> {
  try {
    const supabase = createServiceRoleClient()

    let selectFields = '*'

    if (options.include_schedules) {
      selectFields += ', schedules:class_schedules (*)'
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .select(selectFields)
      .eq('id', classId)
      .eq('tenant_id', tenant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { class: null, error: '클래스를 찾을 수 없습니다' }
      }
      throw new Error(`클래스 조회 실패: ${error.message}`)
    }

    // 강사 정보 추가
    const enrichedWithInstructor = await enrichWithInstructorInfo([classData], tenant_id)
    
    // 학생 수 정보 추가
    const enrichedClass = await enrichWithStudentCount(enrichedWithInstructor, tenant_id)

    return {
      class: enrichedClass[0] as unknown as Class
    }

  } catch (error) {
    console.error('❌ [ClassService] 상세 조회 에러:', error)
    return {
      class: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 클래스 생성 서비스
 */
export async function createClassService(
  data: ClassCreateData,
  created_by: string
): Promise<ClassMutationResult> {
  try {
    const supabase = createServiceRoleClient()

    // 클래스명 중복 확인
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('tenant_id', data.tenant_id)
      .eq('name', data.name)
      .single()

    if (existingClass) {
      return {
        success: false,
        error: '이미 존재하는 클래스명입니다'
      }
    }

    // 강사 존재 확인 (instructor_id가 제공된 경우)
    if (data.instructor_id) {
      const { data: membership, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('id')
        .eq('id', data.instructor_id)
        .eq('tenant_id', data.tenant_id)
        .eq('job_function', 'instructor')
        .eq('status', 'active')
        .single()

      if (!membership || membershipError) {
        return {
          success: false,
          error: '유효하지 않은 강사입니다'
        }
      }
    }

    // 빈 문자열과 'none' 값을 null로 변환
    const cleanedData = {
      ...data,
      instructor_id: data.instructor_id === '' ? null : data.instructor_id,
      classroom_id: data.classroom_id === '' || data.classroom_id === 'none' ? null : data.classroom_id,
      start_date: data.start_date === '' ? null : data.start_date,
      end_date: data.end_date === '' ? null : data.end_date,
      color: data.color === '' ? null : data.color,
      description: data.description === '' ? null : data.description,
      main_textbook: data.main_textbook === '' ? null : data.main_textbook,
      supplementary_textbook: data.supplementary_textbook === '' ? null : data.supplementary_textbook,
      grade: data.grade === '' ? null : data.grade,
      course: data.course === '' ? null : data.course,
      subject: data.subject === '' ? null : data.subject
    }

    // 클래스 생성
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        ...cleanedData,
        tenant_id: data.tenant_id,
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`클래스 생성 실패: ${error.message}`)
    }

    console.log('✅ [ClassService] 클래스 생성 성공:', newClass.id)

    return {
      success: true,
      class: newClass as unknown as Class
    }

  } catch (error) {
    console.error('❌ [ClassService] 생성 에러:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 클래스 수정 서비스
 */
export async function updateClassService(
  classId: string,
  data: ClassUpdateData,
  tenant_id: string,
  updated_by: string
): Promise<ClassMutationResult> {
  try {
    const supabase = createServiceRoleClient()

    // 클래스 존재 확인
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('tenant_id', tenant_id)
      .single()

    if (!existingClass) {
      return {
        success: false,
        error: '클래스를 찾을 수 없습니다'
      }
    }

    // 클래스명 중복 확인 (다른 클래스와)
    if (data.name) {
      const { data: duplicateClass } = await supabase
        .from('classes')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('name', data.name)
        .neq('id', classId)
        .single()

      if (duplicateClass) {
        return {
          success: false,
          error: '이미 존재하는 클래스명입니다'
        }
      }
    }

    // 빈 문자열을 null로 변환
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    // 클래스 수정
    const { data: updatedClass, error } = await supabase
      .from('classes')
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', classId)
      .eq('tenant_id', tenant_id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`클래스 수정 실패: ${error.message}`)
    }

    console.log('✅ [ClassService] 클래스 수정 성공:', classId)

    return {
      success: true,
      class: updatedClass as unknown as Class
    }

  } catch (error) {
    console.error('❌ [ClassService] 수정 에러:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 클래스 삭제 서비스 (Soft Delete)
 */
export async function deleteClassService(
  classId: string,
  tenant_id: string,
  deleted_by: string
): Promise<ClassMutationResult> {
  try {
    const supabase = createServiceRoleClient()

    // 클래스 존재 확인
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', classId)
      .eq('tenant_id', tenant_id)
      .single()

    if (!existingClass) {
      return {
        success: false,
        error: '클래스를 찾을 수 없습니다'
      }
    }

    // 등록된 학생 확인
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('status', 'active')

    if (enrollments && enrollments.length > 0) {
      return {
        success: false,
        error: '등록된 학생이 있는 클래스는 삭제할 수 없습니다'
      }
    }

    // Soft delete 또는 hard delete (정책에 따라)
    const { error } = await supabase
      .from('classes')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', classId)
      .eq('tenant_id', tenant_id)

    if (error) {
      throw new Error(`클래스 삭제 실패: ${error.message}`)
    }

    console.log('✅ [ClassService] 클래스 삭제 성공:', classId)

    return {
      success: true
    }

  } catch (error) {
    console.error('❌ [ClassService] 삭제 에러:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 학생 클래스 이동 서비스
 */
export async function moveStudentBetweenClassesService(
  data: ClassMoveStudentData,
  moved_by: string
): Promise<ClassMutationResult> {
  try {
    // 임시 구현: RPC 함수가 아직 정의되지 않았으므로 기본 SQL로 처리
    console.log('⚠️ [ClassService] 학생 이동 기능은 추후 구현 예정')
    
    return {
      success: false,
      error: '학생 이동 기능은 개발 중입니다'
    }

  } catch (error) {
    console.error('❌ [ClassService] 학생 이동 에러:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}