import { create } from 'zustand'
import { produce } from 'immer'
import type { Student, StudentFormData, StudentFilters, StudentStats } from '@/types/student.types'
import { 
  createApiError, 
  logError, 
  getErrorMessage,
  DuplicateStudentNumberError,
  StudentNotFoundError 
} from '@/types/error.types'
import { createClient } from '@/lib/supabase/client'

// API 응답 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface StudentListResponse {
  students: Student[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

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
  }
}

// 초기 상태
const initialFilters: StudentFilters = {
  status: ['active'],
  search: ''
}

const initialPagination = {
  total: 0,
  limit: 50,
  offset: 0,
  hasMore: false
}

// API 호출 유틸리티 함수 (에러 처리 강화 + 인증 헤더 추가)
const apiCall = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Supabase 세션 가져오기
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // 인증 헤더 구성
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    // 세션이 있으면 Authorization 헤더 추가
    if (session?.access_token) {
      (headers as any)['Authorization'] = `Bearer ${session.access_token}`
    }
    
    // AbortController로 타임아웃 설정
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃
    
    try {
      console.log('🌐 [API-CALL] 요청 시작:', {
        url,
        method: options.method || 'GET',
        headers,
        hasBody: !!options.body
      })

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log('🌐 [API-CALL] 응답 수신:', {
        url,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('🌐 [API-CALL] 응답 에러:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw createApiError(url, response.status, errorData.message || response.statusText, {
          component: 'studentsStore',
          action: 'apiCall'
        })
      }

      const result: ApiResponse<T> = await response.json()
      
      if (!result.success) {
        throw createApiError(url, 400, result.message || 'API 호출 실패', {
          component: 'studentsStore',
          action: 'apiCall'
        })
      }

      return result.data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // AbortError 처리
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw createApiError(url, 408, 'API 요청 시간이 초과되었습니다.', {
          component: 'studentsStore',
          action: 'apiCall'
        })
      }
      
      throw fetchError
    }
  } catch (error) {
    // 에러 로깅
    logError(error, {
      component: 'studentsStore',
      action: 'apiCall'
    })
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
      set({ loading: true, error: null })
      
      try {
        const currentFilters = { ...get().filters, ...filters }
        const params = new URLSearchParams({
          // 🔧 시스템 관리자 지원: tenantId가 undefined여도 파라미터에 포함
          limit: get().pagination.limit.toString(),
          offset: '0',
          ...(currentFilters.status && currentFilters.status.length > 0 && 
             !['all', ''].includes(currentFilters.status[0] || '') && { status: currentFilters.status[0] }),
          ...(currentFilters.class_id && currentFilters.class_id.length > 0 && 
             { classId: currentFilters.class_id[0] }),
          ...(currentFilters.search && { search: currentFilters.search })
        })
        
        // tenantId는 별도로 처리 (undefined여도 추가)
        if (tenantId) {
          params.set('tenantId', tenantId)
        }

        const data = await apiCall<StudentListResponse>(`/api/students?${params}`)
        
        set(produce((draft) => {
          draft.students = data.students
          draft.pagination = data.pagination
          draft.filters = currentFilters
          draft.loading = false
        }))
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        logError(error, { component: 'studentsStore', action: 'fetchStudents' })
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
             { classId: filters.class_id[0] }),
          ...(filters.search && { search: filters.search })
        })
        
        // tenantId는 별도로 처리 (undefined여도 추가)
        if (tenantId) {
          params.set('tenantId', tenantId)
        }

        const data = await apiCall<StudentListResponse>(`/api/students?${params}`)
        
        set(produce((draft) => {
          draft.students.push(...data.students)
          draft.pagination = data.pagination
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
      set({ loading: true, error: null })
      
      try {
        const params = new URLSearchParams({ tenantId })
        const data = await apiCall<{ student: Student }>(`/api/students/${studentId}?${params}`)
        
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
      set({ loading: true, error: null })
      
      try {
        const requestBody = { ...updates, tenantId }
        console.log('🔄 [STUDENTS-STORE] API 요청 시작:', {
          url: `/api/students/${studentId}`,
          method: 'PUT',
          body: requestBody
        })

        const data = await apiCall<{ student: Student }>(`/api/students/${studentId}`, {
          method: 'PUT',
          body: JSON.stringify(requestBody)
        })

        console.log('✅ [STUDENTS-STORE] API 응답 성공:', data)
        
        set(produce((draft) => {
          // 목록 업데이트
          const index = draft.students.findIndex((s: Student) => s.id === studentId)
          if (index !== -1) {
            draft.students[index] = data.student
          }
          
          // 선택된 학생도 선택된 학생이면 업데이트
          if (draft.selectedStudent?.id === studentId) {
            draft.selectedStudent = data.student
          }
          
          draft.loading = false
        }))
        
        return data.student
      } catch (error) {
        console.error('❌ [STUDENTS-STORE] API 요청 실패:', {
          error,
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
          studentId,
          updates,
          tenantId
        })
        
        set({ 
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
  fetchStudentStats
} = useStudentsStore.getState().actions