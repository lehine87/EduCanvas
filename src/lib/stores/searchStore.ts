import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type SearchContext = 'dashboard' | 'students' | 'classes' | 'staff' | 'schedule'

export interface SearchFilters {
  // 공통 필터
  dateRange?: { start: Date; end: Date }
  status?: string[]
  
  // 학생관리 필터
  grade?: string[]
  class?: string[]
  attendanceRate?: [number, number]
  
  // 직원관리 필터
  role?: string[]
  department?: string[]
  
  // 수업/시간표 필터
  instructor?: string[]
  room?: string[]
  dayOfWeek?: string[]
}

export interface SearchResult {
  id: string
  type: 'student' | 'class' | 'staff' | 'schedule'
  title: string
  subtitle?: string
  description?: string
  metadata?: {
    // 공통 필드
    status?: string
    avatar?: string
    
    // 학생 전용 필드
    student_number?: string
    grade?: string
    class_name?: string
    phone?: string
    email?: string
    parent_phone?: string
    attendance_rate?: number
    
    // 직원 전용 필드
    role?: string
    department?: string
    hire_date?: string
    
    // 수업 전용 필드
    instructor?: string
    location?: string
    room?: string
    time?: string
    schedule?: string
    students_count?: number
    
    // 확장 가능한 추가 필드 (검색 메타데이터용)
    [key: string]: string | number | boolean | string[] | undefined
  }
  actions?: {
    label: string
    onClick: () => void
  }[]
  matchScore?: number
}

interface SearchHistory {
  query: string
  context: SearchContext
  timestamp: number
}

interface SearchStore {
  // State
  isOpen: boolean
  query: string
  context: SearchContext
  filters: SearchFilters
  results: SearchResult[]
  loading: boolean
  error: string | null
  history: SearchHistory[]
  suggestions: string[]
  
  // Actions
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  setQuery: (query: string) => void
  setContext: (context: SearchContext) => void
  setFilters: (filters: SearchFilters) => void
  updateFilter: (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => void
  clearFilters: () => void
  setResults: (results: SearchResult[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addToHistory: (query: string) => void
  clearHistory: () => void
  setSuggestions: (suggestions: string[]) => void
  clearResults: () => void
  reset: () => void
}

const initialState = {
  isOpen: false,
  query: '',
  context: 'dashboard' as SearchContext,
  filters: {},
  results: [],
  loading: false,
  error: null,
  history: [],
  suggestions: []
}

export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Sidebar control actions
        toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
        openSidebar: () => set({ isOpen: true }),
        closeSidebar: () => set({ isOpen: false }),

        // Query and context actions
        setQuery: (query) => set({ query }),
        setContext: (context) => set({ context, filters: {} }), // Reset filters on context change

        // Filter actions
        setFilters: (filters) => set({ filters }),
        updateFilter: (key, value) => set((state) => ({
          filters: { ...state.filters, [key]: value }
        })),
        clearFilters: () => set({ filters: {} }),

        // Results and loading actions
        setResults: (results) => set({ results, error: null }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error, loading: false }),
        clearResults: () => set({ results: [], error: null }),

        // History actions
        addToHistory: (query) => {
          const { context, history } = get()
          const newHistory: SearchHistory = {
            query,
            context,
            timestamp: Date.now()
          }
          
          // Remove duplicates and limit to 10 items
          const updatedHistory = [
            newHistory,
            ...history.filter(h => h.query !== query || h.context !== context)
          ].slice(0, 10)
          
          set({ history: updatedHistory })
        },
        clearHistory: () => set({ history: [] }),

        // Suggestions actions
        setSuggestions: (suggestions) => set({ suggestions }),

        // Reset action
        reset: () => set(initialState)
      }),
      {
        name: 'search-store',
        partialize: (state) => ({
          history: state.history,
          context: state.context
        })
      }
    ),
    {
      name: 'SearchStore'
    }
  )
)

// Selector hooks for better performance
export const useSearchQuery = () => useSearchStore((state) => state.query)
export const useSearchResults = () => useSearchStore((state) => state.results)
export const useSearchLoading = () => useSearchStore((state) => state.loading)
export const useSearchIsOpen = () => useSearchStore((state) => state.isOpen)
export const useSearchContext = () => useSearchStore((state) => state.context)
export const useSearchFilters = () => useSearchStore((state) => state.filters)
export const useSearchHistory = () => useSearchStore((state) => state.history)