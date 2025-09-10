import { create } from 'zustand'
import { produce } from 'immer'
import type { Student, StudentFormData, StudentFilters, StudentStats } from '@/types/student.types'
import { 
  createApiError, 
  getErrorMessage,
  DuplicateStudentNumberError,
  StudentNotFoundError 
} from '@/types/error.types'
import { createClient } from '@/lib/supabase/client'

// API 응답 타입 (표준 API 응답 구조에 맞게 수정)
interface StandardApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
  timestamp: string
  request_id?: string
}

interface PaginatedData<T> {
  items: T[]
  pagination: {
    cursor: string | null
    has_more: boolean
    total_count?: number
    per_page: number
  }
  metadata: {
    filters_applied: string[]
    sort_applied: string
    search_query?: string
    execution_time_ms?: number
  }
}

type StudentListApiResponse = StandardApiResponse<PaginatedData<Student>>

// Store 상태 타입
interface StudentsState {
  // 기본 상태
  students: Student[]
  selectedStudent: Student | null
  loading: boolean
  error: string | null
  
  // 필터 상태
  filters: StudentFilters
  searchTerm: string
  
  // 페이지네이션
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  
  // 통계
  stats: StudentStats | null
  
  // 액션
  actions: {
    // 학생 목록 관련
    fetchStudents: (tenantId?: string, filters?: Partial<StudentFilters>) => Promise<void>
    loadMoreStudents: (tenantId?: string) => Promise<void>
    refreshStudents: (tenantId?: string) => Promise<void>
    
    // 개별 학생 관련
    fetchStudent: (studentId: string, tenantId: string) => Promise<Student | null>
    createStudent: (studentData: StudentFormData, tenantId: string) => Promise<Student>
    updateStudent: (studentId: string, updates: Partial<Student>, tenantId: string) => Promise<Student>
    deleteStudent: (studentId: string, tenantId: string, forceDelete?: boolean) => Promise<void>
    
    // 선택 관련
    setSelectedStudent: (student: Student | null) => void
    
    // 필터 관련
    setFilters: (filters: Partial<StudentFilters>) => void
    setSearchTerm: (term: string) => void
    clearFilters: () => void
    
    // 상태 관련
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void
    
    // 통계
    fetchStudentStats: (tenantId?: string) => Promise<void>
    
    // 유틸리티
    getStudentById: (studentId: string) => Student | undefined
    updateStudentInList: (studentId: string, updates: Partial<Student>) => void
    removeStudentFromList: (studentId: string) => void
    
    // 프리캐시
    precacheStudents: (students: Student[]) => void
  }
}

// 초기 상태 (모든 상태의 학생 표시)
const initialFilters: StudentFilters = {
  status: [], // 빈 배열로 모든 상태 표시
  search: ''
}

const initialPagination = {
  total: 0,
  limit: 50,
  offset: 0,
  hasMore: false
}

// API 호출 유틸리티 함수 (성능 최적화 + 간소화된 로깅)
const apiCall = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Supabase 세션 가져오기 (캐시된 세션 사용)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // 인증 헤더 구성 (간소화)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (session?.access_token) {
      (headers as any)['Authorization'] = `Bearer ${session.access_token}`
    }
    
    // 타임아웃 최적화 (5초로 단축)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // 개발 환경에서만 에러 로깅
        if (process.env.NODE_ENV === 'development') {
          console.error('API 에러:', {
            url,
            status: response.status,
            message: errorData.message
          })
        }
        throw new Error(errorData.message || response.statusText)
      }

      const result: StandardApiResponse<T> = await response.json()
      
      if (!result.success) {
        const errorMessage = result.error?.message || 'API 호출 실패'
        throw new Error(errorMessage)
      }

      if (!result.data) {
        throw new Error('API 응답 데이터가 없습니다.')
      }

      return result.data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('요청 시간 초과')
      }
      
      throw fetchError
    }
  } catch (error) {
    // 개발 환경에서만 에러 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('API 호출 에러:', error)
    }
    throw error
  }
}

// Zustand 스토어 생성
export const useStudentsStore = create<StudentsState>()((set, get) => ({
  // 초기 상태
  students: [],
  selectedStudent: null,
  loading: false,
  error: null,
  filters: initialFilters,
  searchTerm: '',
  pagination: initialPagination,
  stats: null,

  actions: {
    // 학생 목록 조회
    fetchStudents: async (tenantId?: string, filters?: Partial<StudentFilters>) => {
      console.log('🚀 [STUDENTS-STORE] fetchStudents 호출:', { tenantId, filters })
      
      // 이미 로딩 중이면 중복 호출 방지
      if (get().loading) {
        console.log('⏭️ [STUDENTS-STORE] 이미 로딩 중이므로 요청 스킵')
        return
      }
      
      set({ loading: true, error: null })
      
      try {
        const currentFilters = { ...get().filters, ...filters }
        const currentPagination = get().pagination
        
        // 안전한 limit 값 설정
        const limit = currentPagination.limit || 50
        
        console.log('📊 [STUDENTS-STORE] 요청 파라미터:', {
          currentFilters,
          limit,
          pagination: currentPagination
        })
        
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: '0',
          ...(currentFilters.status && currentFilters.status.length > 0 && 
             !['all', ''].includes(currentFilters.status[0] || '') && { status: currentFilters.status[0] }),
          ...(currentFilters.class_id && currentFilters.class_id.length > 0 && 
             { class_id: currentFilters.class_id[0] }),
          ...(currentFilters.search && { search: currentFilters.search })
        })

        const response = await apiCall<PaginatedData<Student>>(`/api/students?${params}`)
        
        console.log('✅ [STUDENTS-STORE] API 응답 수신:', {
          itemsCount: response.items?.length || 0,
          items: response.items?.slice(0, 2) || [], // 처음 2개만 로깅
          pagination: response.pagination,
          metadata: response.metadata
        })
        
        set(produce((draft) => {
          // 표준 API 응답에서 데이터 추출
          draft.students = response.items || []
          draft.filters = currentFilters
          draft.loading = false
          
          // pagination 정보 업데이트 (안전한 기본값 설정)
          draft.pagination = {
            total: response.pagination?.total_count || 0,
            limit: response.pagination?.per_page || limit,
            offset: 0,
            hasMore: response.pagination?.has_more || false
          }
          
          console.log('🏪 [STUDENTS-STORE] 스토어 업데이트 완료:', {
            studentsCount: draft.students.length,
            pagination: draft.pagination,
            loading: draft.loading
          })
        }))
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        console.error('❌ [STUDENTS-STORE] fetchStudents 실패:', error)
        set({ 
          error: errorMessage,
          loading: false 
        })
      }
    },

    // 더 많은 학생 로드 (페이지네이션)
    loadMoreStudents: async (tenantId?: string) => {
      const { pagination, filters, loading } = get()
      
      if (loading || !pagination.hasMore) return
      
      set({ loading: true })
      
      try {
        const params = new URLSearchParams({
          limit: pagination.limit.toString(),
          offset: (pagination.offset + pagination.limit).toString(),
          ...(filters.status && filters.status.length > 0 && 
             filters.status[0] && filters.status[0] !== 'active' && { status: filters.status[0] }),
          ...(filters.class_id && filters.class_id.length > 0 && 
             { class_id: filters.class_id[0] }),
          ...(filters.search && { search: filters.search })
        })

        const data = await apiCall<PaginatedData<Student>>(`/api/students?${params}`)
        
        set(produce((draft) => {
          draft.students.push(...data.items)
          draft.pagination = {
            total: data.pagination?.total_count || draft.pagination.total,
            limit: data.pagination?.per_page || draft.pagination.limit,
            offset: draft.pagination.offset + draft.pagination.limit,
            hasMore: data.pagination?.has_more || false
          }
          draft.loading = false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '더 많은 학생 로드 실패',
          loading: false 
        })
      }
    },

    // 학생 목록 새로고침
    refreshStudents: async (tenantId?: string) => {
      await get().actions.fetchStudents(tenantId, get().filters)
    },

    // 개별 학생 조회
    fetchStudent: async (studentId: string, tenantId: string) => {
      console.log('🔍 [STUDENTS-STORE] fetchStudent 호출:', { studentId, tenantId })
      set({ loading: true, error: null })
      
      try {
        // API는 인증 헤더에서 tenant 정보를 가져오므로 쿼리 파라미터 제거
        const data = await apiCall<{ student: Student }>(`/api/students/${studentId}`)
        
        console.log('✅ [STUDENTS-STORE] 학생 상세 조회 성공:', data.student)
        
        set(produce((draft) => {
          draft.selectedStudent = data.student
          draft.loading = false
          
          // 목록도 업데이트
          const index = draft.students.findIndex((s: Student) => s.id === studentId)
          if (index !== -1) {
            draft.students[index] = data.student
          }
        }))
        
        return data.student
      } catch (error) {
        console.error('❌ [STUDENTS-STORE] 학생 상세 조회 실패:', error)
        set({ 
          error: error instanceof Error ? error.message : '학생 조회 실패',
          loading: false 
        })
        return null
      }
    },

    // 학생 생성
    createStudent: async (studentData: StudentFormData, tenantId: string) => {
      set({ loading: true, error: null })
      
      try {
        const data = await apiCall<{ student: Student }>('/api/students', {
          method: 'POST',
          body: JSON.stringify({ ...studentData, tenantId })
        })
        
        set(produce((draft) => {
          draft.students.unshift(data.student) // 새 학생을 목록 맨 위에 추가
          draft.pagination.total += 1
          draft.loading = false
        }))
        
        return data.student
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '학생 생성 실패',
          loading: false 
        })
        throw error
      }
    },

    // 학생 수정
    updateStudent: async (studentId: string, updates: Partial<Student>, tenantId: string) => {
      // 이전 상태 백업 (롤백용)
      const previousStudents = get().students
      const previousSelected = get().selectedStudent
      
      // Optimistic Update: UI 즉시 업데이트 (로딩 없이)
      set(produce((draft) => {
        const index = draft.students.findIndex((s: Student) => s.id === studentId)
        if (index !== -1) {
          draft.students[index] = { ...draft.students[index], ...updates }
        }
        
        if (draft.selectedStudent?.id === studentId) {
          draft.selectedStudent = { ...draft.selectedStudent, ...updates }
        }
        
        draft.error = null
      }))
      
      try {
        const requestBody = { ...updates, tenantId }
        console.log('🔄 [STUDENTS-STORE] API 요청 시작 (Optimistic):', {
          url: `/api/students/${studentId}`,
          method: 'PUT',
          body: requestBody
        })

        const data = await apiCall<{ student: Student }>(`/api/students/${studentId}`, {
          method: 'PUT',
          body: JSON.stringify(requestBody)
        })

        console.log('✅ [STUDENTS-STORE] API 응답 성공:', data)
        
        // 서버 응답으로 최종 업데이트
        set(produce((draft) => {
          const index = draft.students.findIndex((s: Student) => s.id === studentId)
          if (index !== -1) {
            draft.students[index] = data.student
          }
          
          if (draft.selectedStudent?.id === studentId) {
            draft.selectedStudent = data.student
          }
        }))
        
        return data.student
      } catch (error) {
        // 실패 시 롤백
        console.error('❌ [STUDENTS-STORE] API 요청 실패, 롤백:', {
          error,
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
          studentId
        })
        
        set({ 
          students: previousStudents,
          selectedStudent: previousSelected,
          error: error instanceof Error ? error.message : '학생 수정 실패',
          loading: false 
        })
        throw error
      }
    },

    // 학생 삭제
    deleteStudent: async (studentId: string, tenantId: string, forceDelete = false) => {
      set({ loading: true, error: null })
      
      try {
        const params = new URLSearchParams({ 
          tenantId,
          forceDelete: forceDelete.toString()
        })
        
        await apiCall(`/api/students/${studentId}?${params}`, {
          method: 'DELETE'
        })
        
        set(produce((draft) => {
          if (forceDelete) {
            // 완전 삭제: 목록에서 제거
            draft.students = draft.students.filter((s: Student) => s.id !== studentId)
            draft.pagination.total -= 1
          } else {
            // 소프트 삭제: 상태를 'withdrawn'으로 변경
            const index = draft.students.findIndex((s: Student) => s.id === studentId)
            if (index !== -1) {
              draft.students[index].status = 'withdrawn'
            }
          }
          
          // 선택된 학생이 삭제된 학생이면 선택 해제
          if (draft.selectedStudent?.id === studentId) {
            draft.selectedStudent = null
          }
          
          draft.loading = false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '학생 삭제 실패',
          loading: false 
        })
        throw error
      }
    },

    // 선택된 학생 설정
    setSelectedStudent: (student: Student | null) => {
      set({ selectedStudent: student })
    },

    // 필터 설정
    setFilters: (filters: Partial<StudentFilters>) => {
      set(produce((draft) => {
        draft.filters = { ...draft.filters, ...filters }
      }))
    },

    // 검색어 설정
    setSearchTerm: (term: string) => {
      set(produce((draft) => {
        draft.searchTerm = term
        draft.filters.search = term
      }))
    },

    // 필터 초기화
    clearFilters: () => {
      set({ 
        filters: initialFilters,
        searchTerm: ''
      })
    },

    // 로딩 상태 설정
    setLoading: (loading: boolean) => {
      set({ loading })
    },

    // 에러 설정
    setError: (error: string | null) => {
      set({ error })
    },

    // 에러 초기화
    clearError: () => {
      set({ error: null })
    },

    // 학생 통계 조회
    fetchStudentStats: async (tenantId?: string) => {
      try {
        // 실제로는 API 엔드포인트가 있어야 하지만 임시로 계산
        const { students } = get()
        
        const stats: StudentStats = {
          total: students.length,
          active: students.filter((s: Student) => s.status === 'active').length,
          inactive: students.filter((s: Student) => s.status === 'inactive').length,
          graduated: students.filter((s: Student) => s.status === 'graduated').length,
          withdrawn: students.filter((s: Student) => s.status === 'withdrawn').length,
          suspended: students.filter((s: Student) => s.status === 'suspended').length,
          byGrade: {},
          byClass: {}
        }
        
        // 학년별 통계
        students.forEach((student: Student) => {
          if (student.grade_level) {
            stats.byGrade[student.grade_level] = (stats.byGrade[student.grade_level] || 0) + 1
          }
        })
        
        // 클래스별 통계 (추후 구현)
        
        set({ stats })
      } catch (error) {
        console.error('학생 통계 계산 실패:', error)
      }
    },

    // 유틸리티: ID로 학생 찾기
    getStudentById: (studentId: string) => {
      return get().students.find((s: Student) => s.id === studentId)
    },

    // 유틸리티: 목록에서 학생 정보 업데이트
    updateStudentInList: (studentId: string, updates: Partial<Student>) => {
      set(produce((draft) => {
        const index = draft.students.findIndex((s: Student) => s.id === studentId)
        if (index !== -1) {
          Object.assign(draft.students[index], updates)
        }
      }))
    },

    // 유틸리티: 목록에서 학생 제거
    removeStudentFromList: (studentId: string) => {
      set(produce((draft) => {
        draft.students = draft.students.filter((s: Student) => s.id !== studentId)
        draft.pagination.total -= 1
      }))
    },

    // 프리캐시: 검색 결과에서 학생 데이터 미리 저장
    precacheStudents: (students: Student[]) => {
      set(produce((draft) => {
        students.forEach(student => {
          const existingIndex = draft.students.findIndex((s: Student) => s.id === student.id)
          if (existingIndex !== -1) {
            // 기존 데이터 업데이트 (더 상세한 정보로)
            draft.students[existingIndex] = { ...draft.students[existingIndex], ...student }
          } else {
            // 새로운 학생 데이터 추가
            draft.students.unshift(student)
          }
        })
      }))
      console.log('✅ [STUDENTS-STORE] 프리캐시 완료:', students.length + '명')
    }
  }
}))

// 편의성을 위한 액션 추출
export const {
  fetchStudents,
  loadMoreStudents,
  refreshStudents,
  fetchStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  setSelectedStudent,
  setFilters,
  setSearchTerm,
  clearFilters,
  fetchStudentStats,
  precacheStudents
} = useStudentsStore.getState().actions