/**
 * API 클라이언트 유틸리티
 *
 * 업계 표준에 따른 일관된 API 호출 패턴 제공
 * - StandardApiResponse 형식 자동 처리
 * - 타입 안전성 보장
 * - 에러 처리 표준화
 * - 재시도 로직 내장
 */

import type { StandardApiResponse } from './api-response'

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
  retry?: number
  retryDelay?: number
}

export interface OnboardingFormData {
  name: string
  phone: string
  specialization?: string
  bio?: string
  emergency_contact?: string
  tenant_id: string
}

export interface TenantSearchParams {
  searchType: 'code' | 'name'
  searchQuery: string
}

export interface EmailCheckParams {
  email: string
}

export interface Tenant {
  id: string
  name: string
  tenant_code: string
  address?: string
  contact_phone?: string
}

export class ApiError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly details?: unknown[]

  constructor(message: string, code: string, status: number, details?: unknown[]) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * 타입 안전한 API 클라이언트
 */
export class ApiClient {
  private static instance: ApiClient
  private baseUrl: string = ''
  public auth?: {
    onboarding: (data: OnboardingFormData) => Promise<{ message: string }>
    searchTenants: (params: TenantSearchParams) => Promise<{ results: Tenant[], count: number }>
    checkEmail: (params: EmailCheckParams) => Promise<{ exists: boolean }>
  }

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  /**
   * GET 요청
   */
  public async get<T = unknown>(
    endpoint: string,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    })
  }

  /**
   * POST 요청
   */
  public async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
  }

  /**
   * PUT 요청
   */
  public async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
  }

  /**
   * PATCH 요청
   */
  public async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
  }

  /**
   * DELETE 요청
   */
  public async delete<T = unknown>(
    endpoint: string,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    })
  }

  /**
   * 실제 요청 처리
   */
  private async request<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { params, retry = 0, retryDelay = 1000, ...fetchOptions } = options

    // URL 구성
    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    // 재시도 로직
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const response = await fetch(url, fetchOptions)

        // 응답 파싱
        const result = await response.json() as StandardApiResponse<T>

        // 성공 응답 처리
        if (response.ok && result.success) {
          return result.data as T
        }

        // 에러 응답 처리
        if (!response.ok || !result.success) {
          throw new ApiError(
            result.error?.message || 'Unknown error occurred',
            result.error?.code || 'UNKNOWN_ERROR',
            response.status,
            result.error?.details
          )
        }

        return result.data as T
      } catch (error) {
        lastError = error as Error

        // 네트워크 에러나 파싱 에러는 재시도
        if (attempt < retry) {
          await this.delay(retryDelay * Math.pow(2, attempt)) // Exponential backoff
          continue
        }

        // 마지막 시도에서도 실패하면 에러 throw
        if (error instanceof ApiError) {
          throw error
        }

        throw new ApiError(
          lastError.message || 'Network error occurred',
          'NETWORK_ERROR',
          0
        )
      }
    }

    throw lastError || new Error('Unknown error occurred')
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 싱글톤 인스턴스 export
 */
export const apiClient = ApiClient.getInstance()

/**
 * React Query와 통합을 위한 헬퍼 함수들
 */

/**
 * GET 요청을 위한 쿼리 함수 생성
 */
export function createQueryFn<T = unknown>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): () => Promise<T> {
  return () => apiClient.get<T>(endpoint, { params })
}

/**
 * 동적 파라미터를 위한 쿼리 함수 생성
 */
export function createDynamicQueryFn<T = unknown>(
  endpointFn: () => string,
  paramsFn?: () => Record<string, string | number | boolean>
): () => Promise<T> {
  return () => {
    const endpoint = endpointFn()
    const params = paramsFn?.()
    return apiClient.get<T>(endpoint, { params })
  }
}

/**
 * Mutation 함수 생성
 */
export function createMutationFn<TData = unknown, TVariables = unknown>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpointFn: (variables: TVariables) => string
): (variables: TVariables) => Promise<TData> {
  return async (variables: TVariables) => {
    const endpoint = endpointFn(variables)

    switch (method) {
      case 'POST':
        return apiClient.post<TData>(endpoint, variables)
      case 'PUT':
        return apiClient.put<TData>(endpoint, variables)
      case 'PATCH':
        return apiClient.patch<TData>(endpoint, variables)
      case 'DELETE':
        return apiClient.delete<TData>(endpoint)
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  }
}

/**
 * 에러 처리 유틸리티
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export function getErrorCode(error: unknown): string {
  if (isApiError(error)) {
    return error.code
  }
  return 'UNKNOWN_ERROR'
}

/**
 * 타입 가드 유틸리티
 */
export function hasData<T>(
  response: { data?: T } | undefined | null
): response is { data: T } {
  return response !== null && response !== undefined && 'data' in response
}

/**
 * 쿼리 키 빌더 (React Query용)
 */
export const queryKeys = {
  all: ['api'] as const,

  students: () => [...queryKeys.all, 'students'] as const,
  student: (id: string) => [...queryKeys.students(), id] as const,
  studentClasses: (studentId: string, filters?: Record<string, unknown>) =>
    [...queryKeys.student(studentId), 'classes', filters] as const,
  studentsDashboardStats: () => [...queryKeys.students(), 'dashboard-stats'] as const,

  classes: () => [...queryKeys.all, 'classes'] as const,
  class: (id: string) => [...queryKeys.classes(), id] as const,
  classStudents: (classId: string, filters?: Record<string, unknown>) =>
    [...queryKeys.class(classId), 'students', filters] as const,
  classesList: (filters?: Record<string, unknown>) =>
    [...queryKeys.classes(), 'list', filters] as const,
  classesDashboardStats: () => [...queryKeys.classes(), 'dashboard-stats'] as const,
  classesSearch: (filters?: Record<string, unknown>) =>
    [...queryKeys.classes(), 'search', filters] as const,

  staff: () => [...queryKeys.all, 'staff'] as const,
  staffMember: (id: string) => [...queryKeys.staff(), id] as const,

  enrollments: () => [...queryKeys.all, 'enrollments'] as const,
  enrollment: (id: string) => [...queryKeys.enrollments(), id] as const,

  auth: () => [...queryKeys.all, 'auth'] as const,
  tenantSearch: (filters?: Record<string, unknown>) =>
    [...queryKeys.auth(), 'tenant-search', filters] as const,
  emailCheck: (email: string) => [...queryKeys.auth(), 'email-check', email] as const,
} as const

/**
 * 페이지네이션 헬퍼
 */
export interface PaginationParams {
  limit?: number
  offset?: number
  cursor?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export function buildPaginationParams(
  params: PaginationParams
): Record<string, string | number> {
  const result: Record<string, string | number> = {}

  if (params.limit !== undefined) result.limit = params.limit
  if (params.offset !== undefined) result.offset = params.offset
  if (params.cursor) result.cursor = params.cursor
  if (params.search) result.search = params.search
  if (params.sort) result.sort = params.sort
  if (params.order) result.order = params.order

  return result
}

/**
 * 인증 관련 편의 메소드들
 */

// 인증 관련 API 메소드들을 apiClient에 추가
apiClient.auth = {
  /**
   * 온보딩 요청
   */
  async onboarding(data: OnboardingFormData) {
    return apiClient.post<{ message: string }>('/api/auth/onboarding', data)
  },

  /**
   * 테넌트 검색
   */
  async searchTenants(params: TenantSearchParams) {
    return apiClient.post<{ results: Tenant[], count: number }>('/api/auth/search-tenants', params)
  },

  /**
   * 이메일 중복 체크
   */
  async checkEmail(params: EmailCheckParams) {
    return apiClient.post<{ exists: boolean }>('/api/auth/check-email', params)
  }
}