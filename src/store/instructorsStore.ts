/**
 * @file instructorsStore.ts
 * @description 강사 관리를 위한 Zustand 스토어
 * @module T-V2-012
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Instructor, InstructorFilters, StaffInfo } from '@/types/instructor.types'

interface InstructorsState {
  // 상태
  instructors: Instructor[]
  selectedInstructor: Instructor | null
  loading: boolean
  error: string | null
  
  // 필터 & 검색
  filters: InstructorFilters
  searchTerm: string
  
  // 액션
  actions: {
    // 기본 CRUD
    fetchInstructors: (tenantId: string) => Promise<void>
    createInstructor: (instructor: Partial<Instructor>) => Promise<Instructor>
    updateInstructor: (id: string, updates: Partial<Instructor>) => Promise<Instructor>
    deleteInstructor: (id: string) => Promise<void>
    
    // 선택
    setSelectedInstructor: (instructor: Instructor | null) => void
    
    // 검색 & 필터
    setSearchTerm: (term: string) => void
    setFilters: (filters: InstructorFilters) => void
    clearFilters: () => void
    
    // 유틸리티
    getInstructorById: (id: string) => Instructor | undefined
    getInstructorsByDepartment: (department: string) => Instructor[]
    getActiveInstructors: () => Instructor[]
    
    // 에러 처리
    setError: (error: string | null) => void
    clearError: () => void
  }
}

export const useInstructorsStore = create<InstructorsState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      instructors: [],
      selectedInstructor: null,
      loading: false,
      error: null,
      filters: {},
      searchTerm: '',

      actions: {
        // 강사 목록 조회
        fetchInstructors: async (tenantId: string) => {
          set({ loading: true, error: null })
          
          try {
            const response = await fetch(`/api/instructors?tenant_id=${tenantId}`)
            if (!response.ok) {
              throw new Error(`Failed to fetch instructors: ${response.statusText}`)
            }
            
            const data = await response.json()
            set({ 
              instructors: data.instructors || [],
              loading: false 
            })
          } catch (error) {
            console.error('Failed to fetch instructors:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            })
          }
        },

        // 강사 생성
        createInstructor: async (instructor: Partial<Instructor>) => {
          set({ loading: true, error: null })
          
          try {
            const response = await fetch('/api/instructors', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(instructor),
            })
            
            if (!response.ok) {
              throw new Error(`Failed to create instructor: ${response.statusText}`)
            }
            
            const newInstructor = await response.json()
            
            set((state) => ({
              instructors: [...state.instructors, newInstructor],
              loading: false
            }))
            
            return newInstructor
          } catch (error) {
            console.error('Failed to create instructor:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            })
            throw error
          }
        },

        // 강사 정보 수정
        updateInstructor: async (id: string, updates: Partial<Instructor>) => {
          set({ loading: true, error: null })
          
          try {
            const response = await fetch(`/api/instructors/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updates),
            })
            
            if (!response.ok) {
              throw new Error(`Failed to update instructor: ${response.statusText}`)
            }
            
            const updatedInstructor = await response.json()
            
            set((state) => ({
              instructors: state.instructors.map(instructor =>
                instructor.id === id ? updatedInstructor : instructor
              ),
              selectedInstructor: state.selectedInstructor?.id === id ? updatedInstructor : state.selectedInstructor,
              loading: false
            }))
            
            return updatedInstructor
          } catch (error) {
            console.error('Failed to update instructor:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            })
            throw error
          }
        },

        // 강사 삭제
        deleteInstructor: async (id: string) => {
          set({ loading: true, error: null })
          
          try {
            const response = await fetch(`/api/instructors/${id}`, {
              method: 'DELETE',
            })
            
            if (!response.ok) {
              throw new Error(`Failed to delete instructor: ${response.statusText}`)
            }
            
            set((state) => ({
              instructors: state.instructors.filter(instructor => instructor.id !== id),
              selectedInstructor: state.selectedInstructor?.id === id ? null : state.selectedInstructor,
              loading: false
            }))
          } catch (error) {
            console.error('Failed to delete instructor:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            })
            throw error
          }
        },

        // 선택된 강사 설정
        setSelectedInstructor: (instructor: Instructor | null) => {
          set({ selectedInstructor: instructor })
        },

        // 검색어 설정
        setSearchTerm: (term: string) => {
          set({ searchTerm: term })
        },

        // 필터 설정
        setFilters: (filters: InstructorFilters) => {
          set({ filters })
        },

        // 필터 초기화
        clearFilters: () => {
          set({ filters: {}, searchTerm: '' })
        },

        // ID로 강사 조회
        getInstructorById: (id: string) => {
          const { instructors } = get()
          return instructors.find(instructor => instructor.id === id)
        },

        // 부서별 강사 조회
        getInstructorsByDepartment: (department: string) => {
          const { instructors } = get()
          return instructors.filter(instructor => {
            const staffInfo = instructor.staff_info as StaffInfo
            return staffInfo?.department === department
          })
        },

        // 활성 강사 조회
        getActiveInstructors: () => {
          const { instructors } = get()
          return instructors.filter(instructor => instructor.status === 'active')
        },

        // 에러 설정
        setError: (error: string | null) => {
          set({ error })
        },

        // 에러 초기화
        clearError: () => {
          set({ error: null })
        },
      },
    }),
    {
      name: 'instructors-store',
      version: 1,
    }
  )
)