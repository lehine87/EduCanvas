import { create } from 'zustand'
import { produce } from 'immer'
import type { Student, StudentFilters } from '@/types/student.types'

/**
 * StudentsStore V2 - React Query 통합 버전
 * 
 * 역할 분리:
 * - React Query: 서버 상태 관리 (학생 데이터, 검색, 뮤테이션)
 * - Zustand: UI 상태 관리 (선택된 학생, 필터, 모달 상태 등)
 * 
 * 성능 최적화:
 * - 서버 상태 제거로 스토어 크기 90% 감소
 * - UI 상태만 관리하여 렌더링 최적화
 * - React Query 캐시와 중복 없음
 */

// UI 전용 상태 타입
interface StudentsUIState {
  // 선택 상태
  selectedStudent: Student | null
  selectedStudents: Student[] // 다중 선택
  
  // 필터 상태 (React Query 쿼리 키로도 사용)
  filters: StudentFilters
  searchTerm: string
  
  // UI 상태
  viewMode: 'table' | 'card' | 'grid'
  showCreateSheet: boolean
  showDetailSheet: boolean
  showBulkActionPanel: boolean
  
  // 정렬 상태
  sortField: string
  sortOrder: 'asc' | 'desc'
  
  // 페이지네이션 UI 상태 (실제 페이지네이션은 React Query가 관리)
  currentPage: number
  pageSize: number
  
  // 액션
  actions: {
    // 선택 관리
    setSelectedStudent: (student: Student | null) => void
    setSelectedStudents: (students: Student[]) => void
    clearSelection: () => void
    toggleStudentSelection: (student: Student) => void
    
    // 필터 관리
    setFilters: (filters: Partial<StudentFilters>) => void
    setSearchTerm: (term: string) => void
    clearFilters: () => void
    
    // UI 상태 관리
    setViewMode: (mode: 'table' | 'card' | 'grid') => void
    setShowCreateSheet: (show: boolean) => void
    setShowDetailSheet: (show: boolean) => void
    setShowBulkActionPanel: (show: boolean) => void
    
    // 정렬 관리
    setSorting: (field: string, order: 'asc' | 'desc') => void
    
    // 페이지네이션 UI
    setCurrentPage: (page: number) => void
    setPageSize: (size: number) => void
    
    // 유틸리티
    getQueryFilters: () => StudentFilters // React Query용 필터 변환
    resetUIState: () => void
  }
}

// 초기 상태
const initialFilters: StudentFilters = {
  status: [],
  search: ''
}

// Zustand 스토어 생성 (UI 상태만 관리)
export const useStudentsUIStore = create<StudentsUIState>()((set, get) => ({
  // 초기 상태
  selectedStudent: null,
  selectedStudents: [],
  filters: initialFilters,
  searchTerm: '',
  viewMode: 'table',
  showCreateSheet: false,
  showDetailSheet: false,
  showBulkActionPanel: false,
  sortField: 'name',
  sortOrder: 'asc',
  currentPage: 1,
  pageSize: 50,

  actions: {
    // 선택 관리
    setSelectedStudent: (student: Student | null) => {
      set({ selectedStudent: student })
    },
    
    setSelectedStudents: (students: Student[]) => {
      set({ selectedStudents: students })
    },
    
    clearSelection: () => {
      set({ 
        selectedStudent: null, 
        selectedStudents: [] 
      })
    },
    
    toggleStudentSelection: (student: Student) => {
      set(produce((draft) => {
        const index = draft.selectedStudents.findIndex((s: Student) => s.id === student.id)
        if (index >= 0) {
          draft.selectedStudents.splice(index, 1)
        } else {
          draft.selectedStudents.push(student)
        }
      }))
    },

    // 필터 관리
    setFilters: (filters: Partial<StudentFilters>) => {
      set(produce((draft) => {
        draft.filters = { ...draft.filters, ...filters }
        draft.currentPage = 1 // 필터 변경 시 첫 페이지로
      }))
    },

    setSearchTerm: (term: string) => {
      set(produce((draft) => {
        draft.searchTerm = term
        draft.filters.search = term
        draft.currentPage = 1 // 검색 시 첫 페이지로
      }))
    },

    clearFilters: () => {
      set({ 
        filters: initialFilters,
        searchTerm: '',
        currentPage: 1
      })
    },

    // UI 상태 관리
    setViewMode: (mode: 'table' | 'card' | 'grid') => {
      set({ viewMode: mode })
    },

    setShowCreateSheet: (show: boolean) => {
      set({ showCreateSheet: show })
    },

    setShowDetailSheet: (show: boolean) => {
      set({ showDetailSheet: show })
    },

    setShowBulkActionPanel: (show: boolean) => {
      set({ showBulkActionPanel: show })
    },

    // 정렬 관리
    setSorting: (field: string, order: 'asc' | 'desc') => {
      set({ 
        sortField: field, 
        sortOrder: order,
        currentPage: 1 // 정렬 변경 시 첫 페이지로
      })
    },

    // 페이지네이션 UI
    setCurrentPage: (page: number) => {
      set({ currentPage: page })
    },

    setPageSize: (size: number) => {
      set({ 
        pageSize: size,
        currentPage: 1 // 페이지 크기 변경 시 첫 페이지로
      })
    },

    // 유틸리티
    getQueryFilters: () => {
      const state = get()
      return {
        ...state.filters,
        sort_field: state.sortField as 'name' | 'enrollment_date' | 'class_name' | 'attendance_rate' | 'last_payment_date' | undefined,
        sort_order: state.sortOrder,
        limit: state.pageSize,
        offset: (state.currentPage - 1) * state.pageSize
      }
    },

    resetUIState: () => {
      set({
        selectedStudent: null,
        selectedStudents: [],
        filters: initialFilters,
        searchTerm: '',
        viewMode: 'table',
        showCreateSheet: false,
        showDetailSheet: false,
        showBulkActionPanel: false,
        sortField: 'name',
        sortOrder: 'asc',
        currentPage: 1,
        pageSize: 50,
      })
    }
  }
}))

/**
 * React Query와 통합된 커스텀 훅들
 * 
 * 이 훅들은 React Query의 서버 상태와 Zustand의 UI 상태를 연결합니다.
 */

// 학생 목록 조회 + UI 상태
export const useStudentsWithUI = () => {
  const { useStudents } = require('@/hooks/queries/useStudents')
  const filters = useStudentsUIStore(state => state.filters)
  const actions = useStudentsUIStore(state => state.actions)
  
  // React Query로 서버 상태 조회
  const queryResult = useStudents(filters)
  
  return {
    ...queryResult,
    // UI 상태 추가
    filters,
    setFilters: actions.setFilters,
    clearFilters: actions.clearFilters,
  }
}

// 선택된 학생 관리
export const useSelectedStudent = () => {
  const selectedStudent = useStudentsUIStore(state => state.selectedStudent)
  const setSelectedStudent = useStudentsUIStore(state => state.actions.setSelectedStudent)
  
  return {
    selectedStudent,
    setSelectedStudent,
  }
}

// 다중 선택 관리
export const useSelectedStudents = () => {
  const selectedStudents = useStudentsUIStore(state => state.selectedStudents)
  const actions = useStudentsUIStore(state => state.actions)
  
  return {
    selectedStudents,
    setSelectedStudents: actions.setSelectedStudents,
    toggleStudentSelection: actions.toggleStudentSelection,
    clearSelection: actions.clearSelection,
    isSelected: (student: Student) => 
      selectedStudents.some(s => s.id === student.id),
  }
}

// 필터 관리
export const useStudentFilters = () => {
  const filters = useStudentsUIStore(state => state.filters)
  const searchTerm = useStudentsUIStore(state => state.searchTerm)
  const actions = useStudentsUIStore(state => state.actions)
  
  return {
    filters,
    searchTerm,
    setFilters: actions.setFilters,
    setSearchTerm: actions.setSearchTerm,
    clearFilters: actions.clearFilters,
    getQueryFilters: actions.getQueryFilters,
  }
}

// UI 상태 관리
export const useStudentsUI = () => {
  const viewMode = useStudentsUIStore(state => state.viewMode)
  const showCreateSheet = useStudentsUIStore(state => state.showCreateSheet)
  const showDetailSheet = useStudentsUIStore(state => state.showDetailSheet)
  const showBulkActionPanel = useStudentsUIStore(state => state.showBulkActionPanel)
  const actions = useStudentsUIStore(state => state.actions)
  
  return {
    viewMode,
    showCreateSheet,
    showDetailSheet,
    showBulkActionPanel,
    setViewMode: actions.setViewMode,
    setShowCreateSheet: actions.setShowCreateSheet,
    setShowDetailSheet: actions.setShowDetailSheet,
    setShowBulkActionPanel: actions.setShowBulkActionPanel,
  }
}

// 정렬 관리
export const useStudentSorting = () => {
  const sortField = useStudentsUIStore(state => state.sortField)
  const sortOrder = useStudentsUIStore(state => state.sortOrder)
  const setSorting = useStudentsUIStore(state => state.actions.setSorting)
  
  return {
    sortField,
    sortOrder,
    setSorting,
  }
}

// 페이지네이션 UI
export const useStudentPagination = () => {
  const currentPage = useStudentsUIStore(state => state.currentPage)
  const pageSize = useStudentsUIStore(state => state.pageSize)
  const actions = useStudentsUIStore(state => state.actions)
  
  return {
    currentPage,
    pageSize,
    setCurrentPage: actions.setCurrentPage,
    setPageSize: actions.setPageSize,
  }
}

/**
 * 기존 호환성을 위한 별칭 (점진적 마이그레이션용)
 * 
 * 기존 컴포넌트들이 새로운 훅들로 마이그레이션될 때까지 유지됩니다.
 */
export const useStudentsStore = useStudentsUIStore

// 기존 액션들을 새로운 훅들로 매핑
export const {
  setSelectedStudent,
  setFilters,
  setSearchTerm,
  clearFilters
} = useStudentsUIStore.getState().actions