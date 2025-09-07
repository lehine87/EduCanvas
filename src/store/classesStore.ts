import { create } from 'zustand'
import { produce } from 'immer'
import { subscribeWithSelector } from 'zustand/middleware'
import { Database } from '@/types/database'
import { UserProfile } from '@/types/auth.types'

type Class = Database['public']['Tables']['classes']['Row']
type ClassInsert = Database['public']['Tables']['classes']['Insert'] 
type ClassUpdate = Database['public']['Tables']['classes']['Update']

// 클래스 필터 및 정렬 옵션
export interface ClassFilters {
  status: 'all' | 'active' | 'inactive'
  grade?: string
  course?: string
  instructorId?: string
  search?: string
}

export interface ClassSortOptions {
  sortBy: 'name' | 'created_at' | 'updated_at' | 'student_count'
  sortOrder: 'asc' | 'desc'
}

// 클래스 통계 정보
export interface ClassStats {
  totalClasses: number
  activeClasses: number
  inactiveClasses: number
  totalStudents: number
  averageStudentsPerClass: number
}

// API 응답 타입
export interface ClassWithRelations extends Class {
  instructor?: Pick<UserProfile, 'id' | 'name' | 'email'>
  student_count?: number
  students?: Array<{
    id: string
    name: string
    student_number: string
    status: string
    grade?: string
    phone?: string
    email?: string
  }>
}

// 상태 인터페이스
export interface ClassesState {
  // 데이터
  classes: ClassWithRelations[]
  selectedClass: ClassWithRelations | null
  
  // UI 상태
  loading: boolean
  error: string | null
  view: 'grouped'
  groupBy: 'instructor' | 'subject' | 'grade'
  subGroupBy: 'none' | 'instructor' | 'subject' | 'grade'
  groupViewMode: 'list' | 'cards'
  
  // 필터링 및 정렬
  filters: ClassFilters
  sort: ClassSortOptions
  
  // 통계
  stats: ClassStats | null
  
  // 선택된 클래스들 (일괄 작업용)
  selectedClasses: string[]
  
  // 선택 모드 (체크박스 표시 vs 상세보기 클릭)
  selectionMode: boolean
  
  // 모달 및 패널 상태
  modals: {
    create: boolean
    edit: boolean
    delete: boolean
    bulkActions: boolean
  }
  
  // Sheet 상태 (상세보기)
  detailSheet: {
    isOpen: boolean
    classId: string | null
  }
}

// 액션 인터페이스
export interface ClassesActions {
  // 데이터 관리
  fetchClasses: (tenantId: string, options?: Partial<ClassFilters & ClassSortOptions>) => Promise<void>
  fetchClassById: (classId: string, tenantId: string, includeStudents?: boolean) => Promise<void>
  createClass: (classData: ClassInsert, tenantId: string, accessToken?: string) => Promise<ClassWithRelations | null>
  updateClass: (classId: string, classData: ClassUpdate, tenantId: string) => Promise<ClassWithRelations | null>
  deleteClass: (classId: string, tenantId: string, forceDelete?: boolean) => Promise<boolean>
  
  // 학생 이동
  moveStudent: (studentId: string, targetClassId: string | null, tenantId: string, reason?: string) => Promise<boolean>
  
  // UI 상태 관리
  setView: (view: ClassesState['view']) => void
  setGroupBy: (groupBy: ClassesState['groupBy']) => void
  setSubGroupBy: (subGroupBy: ClassesState['subGroupBy']) => void
  setGroupViewMode: (mode: ClassesState['groupViewMode']) => void
  setFilters: (filters: Partial<ClassFilters>) => void
  setSort: (sort: Partial<ClassSortOptions>) => void
  setSelectedClass: (classData: ClassWithRelations | null) => void
  
  // Sheet 관리
  openDetailSheet: (classId: string) => void
  closeDetailSheet: () => void
  
  // 선택 관리
  toggleClassSelection: (classId: string) => void
  selectAllClasses: () => void
  clearSelection: () => void
  
  // 선택 모드 관리
  toggleSelectionMode: () => void
  setSelectionMode: (enabled: boolean) => void
  
  // 모달 관리
  openModal: (modal: keyof ClassesState['modals']) => void
  closeModal: (modal: keyof ClassesState['modals']) => void
  closeAllModals: () => void
  
  // 통계 관리
  calculateStats: () => void
  
  // 에러 관리
  setError: (error: string | null) => void
  clearError: () => void
  
  // 데이터 초기화
  reset: () => void
}

// 초기 상태
const initialState: ClassesState = {
  classes: [],
  selectedClass: null,
  loading: false,
  error: null,
  view: 'grouped',
  groupBy: 'instructor',
  subGroupBy: 'none',
  groupViewMode: 'cards',
  filters: {
    status: 'all'
  },
  sort: {
    sortBy: 'name',
    sortOrder: 'asc'
  },
  stats: null,
  selectedClasses: [],
  selectionMode: false,
  modals: {
    create: false,
    edit: false,
    delete: false,
    bulkActions: false
  },
  detailSheet: {
    isOpen: false,
    classId: null
  }
}

// 통계 계산 함수
const calculateClassStats = (classes: ClassWithRelations[]): ClassStats => {
  const totalClasses = classes.length
  const activeClasses = classes.filter((cls: ClassWithRelations) => cls.is_active).length
  const inactiveClasses = totalClasses - activeClasses
  const totalStudents = classes.reduce((sum: number, cls: ClassWithRelations) => sum + (cls.student_count || 0), 0)
  const averageStudentsPerClass = totalClasses > 0 ? totalStudents / totalClasses : 0

  return {
    totalClasses,
    activeClasses,
    inactiveClasses,
    totalStudents,
    averageStudentsPerClass: Math.round(averageStudentsPerClass * 10) / 10
  }
}

// API 호출 함수들
const fetchClassesAPI = async (
  tenantId: string, 
  options: Partial<ClassFilters & ClassSortOptions> = {}
): Promise<{ classes: ClassWithRelations[], total: number }> => {
  const params = new URLSearchParams({
    tenantId,
    includeStudents: 'true',
    ...options
  } as Record<string, string>)

  const response = await fetch(`/api/classes?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    } as HeadersInit
  })

  if (!response.ok) {
    throw new Error(`클래스 목록 조회 실패: ${response.statusText}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '클래스 목록 조회 실패')
  }

  return result.data
}

const fetchClassByIdAPI = async (
  classId: string, 
  tenantId: string, 
  includeStudents = true
): Promise<ClassWithRelations> => {
  const params = new URLSearchParams({
    tenantId,
    includeStudents: includeStudents.toString()
  })

  const response = await fetch(`/api/classes/${classId}?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    } as HeadersInit
  })

  if (!response.ok) {
    throw new Error(`클래스 조회 실패: ${response.statusText}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '클래스 조회 실패')
  }

  return result.data.class
}

const createClassAPI = async (classData: ClassInsert, tenantId: string, accessToken: string): Promise<ClassWithRelations> => {
  console.log('🚀 클래스 생성 API 호출:', { classData, tenantId, hasToken: !!accessToken })
  
  const response = await fetch('/api/classes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    } as HeadersInit,
    body: JSON.stringify({ ...classData, tenantId })
  })

  console.log('📡 클래스 생성 응답 상태:', response.status, response.statusText)

  if (!response.ok) {
    const errorData = await response.json()
    console.error('❌ 클래스 생성 API 오류:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    })
    
    // Zod 검증 오류인 경우 상세 정보 출력
    if (errorData.details) {
      console.error('🔍 Zod 검증 오류 상세:', errorData.details)
    }
    
    throw new Error(`클래스 생성 실패: ${response.status} ${response.statusText} - ${errorData.error || '알 수 없는 오류'}`)
  }

  const result = await response.json()
  console.log('✅ 클래스 생성 성공 응답:', result)
  
  if (!result.success) {
    throw new Error(result.error || '클래스 생성 실패')
  }

  return result.data.class
}

const updateClassAPI = async (
  classId: string, 
  classData: ClassUpdate, 
  tenantId: string
): Promise<ClassWithRelations> => {
  const response = await fetch(`/api/classes/${classId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    } as HeadersInit,
    body: JSON.stringify({ ...classData, tenantId })
  })

  if (!response.ok) {
    throw new Error(`클래스 수정 실패: ${response.statusText}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '클래스 수정 실패')
  }

  return result.data.class
}

const deleteClassAPI = async (
  classId: string, 
  tenantId: string, 
  forceDelete = false
): Promise<boolean> => {
  const params = new URLSearchParams({
    tenantId,
    forceDelete: forceDelete.toString()
  })

  const response = await fetch(`/api/classes/${classId}?${params}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    } as HeadersInit
  })

  if (!response.ok) {
    throw new Error(`클래스 삭제 실패: ${response.statusText}`)
  }

  const result = await response.json()
  return result.success
}

const moveStudentAPI = async (
  studentId: string,
  targetClassId: string | null,
  tenantId: string,
  reason?: string
): Promise<boolean> => {
  const response = await fetch('/api/classes/move-student', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    } as HeadersInit,
    body: JSON.stringify({
      tenantId,
      studentId,
      targetClassId,
      moveReason: reason
    })
  })

  if (!response.ok) {
    throw new Error(`학생 이동 실패: ${response.statusText}`)
  }

  const result = await response.json()
  return result.success
}

// Zustand 스토어 생성
export const useClassesStore = create<ClassesState & ClassesActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // 데이터 관리
    fetchClasses: async (tenantId: string, options = {}) => {
      set({ loading: true, error: null })
      
      try {
        const { classes } = await fetchClassesAPI(tenantId, options)
        
        set(produce((draft) => {
          draft.classes = classes
          draft.loading = false
          draft.stats = calculateClassStats(classes)
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '클래스 목록 조회 실패',
          loading: false 
        })
      }
    },

    fetchClassById: async (classId: string, tenantId: string, includeStudents = true) => {
      set({ loading: true, error: null })
      
      try {
        const classData = await fetchClassByIdAPI(classId, tenantId, includeStudents)
        
        set(produce((draft) => {
          draft.selectedClass = classData
          
          // 기존 목록에서도 업데이트
          const index = draft.classes.findIndex((cls: ClassWithRelations) => cls.id === classId)
          if (index !== -1) {
            draft.classes[index] = classData
          }
          
          draft.loading = false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '클래스 조회 실패',
          loading: false 
        })
      }
    },

    createClass: async (classData: ClassInsert, tenantId: string, accessToken?: string) => {
      set({ loading: true, error: null })
      
      try {
        // accessToken이 제공되지 않으면 localStorage에서 가져오기 (fallback)
        const token = accessToken || localStorage.getItem('access_token') || ''
        
        if (!token) {
          throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        }
        
        console.log('🎯 createClass 시작:', { classData, tenantId, hasToken: !!token })
        
        const newClass = await createClassAPI(classData, tenantId, token)
        
        console.log('🎉 클래스 생성 성공:', newClass)
        
        set(produce((draft) => {
          draft.classes.unshift(newClass)
          draft.stats = calculateClassStats(draft.classes)
          draft.modals.create = false
          draft.loading = false
        }))
        
        return newClass
      } catch (error) {
        console.error('💥 createClass 에러:', error)
        const errorMessage = error instanceof Error ? error.message : '클래스 생성 실패'
        
        set({ 
          error: errorMessage,
          loading: false 
        })
        
        // 에러를 다시 throw해서 UI 컴포넌트에서 처리할 수 있도록 함
        throw error
      }
    },

    updateClass: async (classId: string, classData: ClassUpdate, tenantId: string) => {
      set({ loading: true, error: null })
      
      try {
        const updatedClass = await updateClassAPI(classId, classData, tenantId)
        
        set(produce((draft) => {
          const index = draft.classes.findIndex((cls: ClassWithRelations) => cls.id === classId)
          if (index !== -1) {
            draft.classes[index] = updatedClass
          }
          
          if (draft.selectedClass?.id === classId) {
            draft.selectedClass = updatedClass
          }
          
          draft.stats = calculateClassStats(draft.classes)
          draft.modals.edit = false
          draft.loading = false
        }))
        
        return updatedClass
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '클래스 수정 실패',
          loading: false 
        })
        return null
      }
    },

    deleteClass: async (classId: string, tenantId: string, forceDelete = false) => {
      set({ loading: true, error: null })
      
      try {
        const success = await deleteClassAPI(classId, tenantId, forceDelete)
        
        if (success) {
          set(produce((draft) => {
            if (forceDelete) {
              // 하드 삭제: 목록에서 완전 제거
              draft.classes = draft.classes.filter((cls: ClassWithRelations) => cls.id !== classId)
            } else {
              // 소프트 삭제: is_active를 false로 변경
              const index = draft.classes.findIndex((cls: ClassWithRelations) => cls.id === classId)
              if (index !== -1) {
                draft.classes[index].is_active = false
              }
            }
            
            if (draft.selectedClass?.id === classId) {
              draft.selectedClass = null
            }
            
            const index = draft.selectedClasses.indexOf(classId)
            if (index > -1) {
              draft.selectedClasses.splice(index, 1)
            }
            draft.stats = calculateClassStats(draft.classes)
            draft.modals.delete = false
            draft.loading = false
          }))
        }
        
        return success
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '클래스 삭제 실패',
          loading: false 
        })
        return false
      }
    },

    moveStudent: async (studentId: string, targetClassId: string | null, tenantId: string, reason) => {
      try {
        const success = await moveStudentAPI(studentId, targetClassId, tenantId, reason)
        
        if (success) {
          // 클래스 목록 새로고침 (학생 수 업데이트를 위해)
          const { fetchClasses } = get()
          await fetchClasses(tenantId)
        }
        
        return success
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '학생 이동 실패'
        })
        return false
      }
    },

    // UI 상태 관리
    setView: (view) => set({ view }),
    
    setGroupBy: (groupBy) => set({ groupBy }),
    
    setSubGroupBy: (subGroupBy) => set({ subGroupBy }),
    
    setGroupViewMode: (mode) => set({ groupViewMode: mode }),

    setFilters: (filters) => set(produce((draft) => {
      draft.filters = { ...draft.filters, ...filters }
    })),

    setSort: (sort) => set(produce((draft) => {
      draft.sort = { ...draft.sort, ...sort }
    })),

    setSelectedClass: (classData) => set({ selectedClass: classData }),
    
    // Sheet 관리
    openDetailSheet: (classId) => set(produce((draft) => {
      draft.detailSheet.isOpen = true
      draft.detailSheet.classId = classId
      const selectedClass = draft.classes.find((cls: ClassWithRelations) => cls.id === classId)
      if (selectedClass) {
        draft.selectedClass = selectedClass
      }
    })),
    
    closeDetailSheet: () => set(produce((draft) => {
      draft.detailSheet.isOpen = false
      draft.detailSheet.classId = null
    })),

    // 선택 관리
    toggleClassSelection: (classId) => set(produce((draft) => {
      const index = draft.selectedClasses.indexOf(classId)
      if (index > -1) {
        draft.selectedClasses.splice(index, 1)
      } else {
        draft.selectedClasses.push(classId)
      }
    })),

    selectAllClasses: () => set(produce((draft) => {
      draft.selectedClasses = draft.classes.map((cls: ClassWithRelations) => cls.id)
    })),

    clearSelection: () => set(produce((draft) => {
      draft.selectedClasses = []
    })),

    // 선택 모드 관리
    toggleSelectionMode: () => set(produce((draft) => {
      draft.selectionMode = !draft.selectionMode
      // 선택 모드 비활성화 시 선택된 클래스들 초기화
      if (!draft.selectionMode) {
        draft.selectedClasses = []
      }
    })),

    setSelectionMode: (enabled) => set(produce((draft) => {
      draft.selectionMode = enabled
      // 선택 모드 비활성화 시 선택된 클래스들 초기화
      if (!enabled) {
        draft.selectedClasses = []
      }
    })),

    // 모달 관리
    openModal: (modal) => set(produce((draft) => {
      draft.modals[modal] = true
    })),

    closeModal: (modal) => set(produce((draft) => {
      draft.modals[modal] = false
    })),

    closeAllModals: () => set(produce((draft) => {
      Object.keys(draft.modals).forEach(key => {
        draft.modals[key as keyof typeof draft.modals] = false
      })
    })),

    // 통계 관리
    calculateStats: () => set(produce((draft) => {
      draft.stats = calculateClassStats(draft.classes)
    })),

    // 에러 관리
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // 데이터 초기화
    reset: () => set(initialState)
  }))
)