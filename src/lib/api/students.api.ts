import { createClient } from '@/lib/supabase/client'
import type { Student, StudentFilters } from '@/types/student.types'
import type { PaginatedData, StandardApiResponse } from '@/lib/api-response'

/**
 * 학생 API 함수들
 * Zustand 스토어에서 분리하여 React Query와 함께 사용
 */

// API 요청 옵션 타입
interface ApiRequestOptions extends RequestInit {
  signal?: AbortSignal
}

// API 에러 클래스
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 기본 API 호출 함수 (개발 환경 인증 우회 + 쿠키 기반 인증)
async function apiCall<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  
  // 개발 환경에서 임시 인증 토큰 사용 (업계 표준 패턴)
  // 클라이언트에서는 window.location.hostname으로 개발 환경 감지
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  // 개발 환경에서 편의성을 위한 인증 우회 활성화
  const enableDevAuth = true // 실제 배포 시 false로 변경
  
  if (isDevelopment && enableDevAuth) {
    headers['Authorization'] = 'Bearer test-token'
  }
  
  // 프로덕션에서는 쿠키 기반 인증 사용
  // Supabase는 자동으로 쿠키에서 인증 정보를 읽음
  
  // AbortController가 없으면 기본 타임아웃 설정
  const controller = options.signal ? undefined : new AbortController()
  const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : undefined
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller?.signal,
    })
    
    if (timeoutId) clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorData.message || response.statusText,
        errorData.code,
        errorData.details
      )
    }
    
    const result: StandardApiResponse<T> = await response.json()
    
    if (!result.success) {
      throw new ApiError(
        400,
        result.error?.message || 'API 호출 실패',
        result.error?.code
      )
    }
    
    return result.data as T
  } catch (error) {
    if (controller && timeoutId) clearTimeout(timeoutId)
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'API 요청 시간이 초과되었습니다.', 'TIMEOUT')
    }
    
    throw new ApiError(500, '알 수 없는 오류가 발생했습니다.', 'UNKNOWN')
  }
}

/**
 * 학생 목록 조회
 */
export interface FetchStudentsParams {
  tenantId: string
  filters?: Partial<StudentFilters>
  limit?: number
  offset?: number
  signal?: AbortSignal
}

export async function fetchStudents({
  tenantId,
  filters = {},
  limit = 50,
  offset = 0,
  signal
}: FetchStudentsParams): Promise<PaginatedData<Student>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(filters.status && filters.status.length > 0 && 
       !['all', ''].includes(filters.status[0] || '') && { status: filters.status[0] }),
    ...(filters.class_id && filters.class_id.length > 0 && 
       { class_id: filters.class_id[0] }),
    ...(filters.search && { search: filters.search })
  })
  
  return apiCall<PaginatedData<Student>>(
    `/api/students?${params}`,
    { signal }
  )
}

/**
 * 학생 상세 조회
 */
export async function fetchStudentById(
  id: string,
  tenantId: string,
  signal?: AbortSignal
): Promise<{ student: Student }> {
  return apiCall<{ student: Student }>(
    `/api/students/${id}?tenantId=${tenantId}`,
    { signal }
  )
}

/**
 * 학생 생성
 */
export async function createStudent(
  data: Partial<Student>,
  tenantId: string
): Promise<{ student: Student }> {
  return apiCall<{ student: Student }>('/api/students', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 학생 수정
 */
export async function updateStudent(
  id: string,
  updates: Partial<Student>,
  tenantId: string
): Promise<{ student: Student }> {
  return apiCall<{ student: Student }>(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...updates, tenantId })
  })
}

/**
 * 학생 삭제
 */
export async function deleteStudent(
  id: string,
  tenantId: string,
  forceDelete = false
): Promise<{ success: boolean }> {
  const params = new URLSearchParams({
    tenantId,
    ...(forceDelete && { force: 'true' })
  })
  
  return apiCall<{ success: boolean }>(`/api/students/${id}?${params}`, {
    method: 'DELETE'
  })
}

/**
 * 학생 검색 (전문 검색)
 */
export async function searchStudents(
  query: string,
  tenantId: string,
  limit = 20,
  signal?: AbortSignal
): Promise<Student[]> {
  const params = new URLSearchParams({
    q: query,
    tenantId,
    limit: limit.toString()
  })
  
  const response = await apiCall<{ students: Student[] }>(
    `/api/students/search?${params}`,
    { signal }
  )
  
  return response.students
}