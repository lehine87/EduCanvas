import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  Home,
  GraduationCap,
  Users,
  User,
  BookOpen,
  Calendar,
  BarChart3,
  ClipboardCheck
} from 'lucide-react'
import type { TabItem, UserRole, NavigationStore, SubTabCategory } from '@/types/navigation'
import { useSearchStore } from './searchStore'

/**
 * 전체 탭 정의 (권한별 필터링 전)
 * T-V2-005: 모든 href를 /main 기반으로 통일 (레거시 /admin 제거)
 * 서브탭 hover 메뉴 지원
 */
const ALL_TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: Home,
    href: '/main',
    searchContext: 'dashboard',
    requiredRoles: [], // 모든 사용자 접근 가능
    description: '메인 대시보드',
    subtabs: [
      {
        id: 'overview',
        label: '대시보드',
        items: [
          { id: 'overview', label: '전체 현황', href: '/main', description: '학원 전체 현황 대시보드' },
          { id: 'analytics', label: '분석 리포트', href: '/main/analytics', description: '데이터 분석 및 통계' }
        ]
      },
      {
        id: 'system',
        label: '시스템',
        items: [
          { id: 'notifications', label: '알림 센터', href: '/main/notifications', description: '시스템 알림 및 공지' },
          { id: 'settings', label: '설정', href: '/main/settings', description: '학원 기본 설정' }
        ]
      }
    ]
  },
  {
    id: 'students',
    label: '학생관리',
    icon: GraduationCap,
    href: '/main/students',
    searchContext: 'students',
    requiredRoles: [], // 모든 사용자 접근 가능
    description: '학생 정보 관리',
    subtabs: [
      {
        id: 'management',
        label: '학생 관리',
        items: [
          { id: 'list', label: '학생 목록', href: '/main/students', description: '전체 학생 조회 및 관리' },
          { id: 'enrollment', label: '등록 관리', href: '/main/students/enrollment', description: '신규 학생 등록' }
        ]
      },
      {
        id: 'academic',
        label: '학사 관리',
        items: [
          { id: 'grades', label: '성적 관리', href: '/main/students/grades', description: '학생 성적 입력 및 조회' },
          { id: 'attendance', label: '출결 관리', href: '/main/students/attendance', description: '출석 현황 및 관리' }
        ]
      }
    ]
  },
  {
    id: 'attendance',
    label: '출결관리',
    icon: ClipboardCheck,
    href: '/main/attendance',
    searchContext: 'attendance',
    requiredRoles: [], // 모든 사용자 접근 가능
    description: '학생 출석 및 결석 관리',
    subtabs: [
      {
        id: 'attendance-check',
        label: '출결 체크',
        items: [
          { id: 'check', label: '출석체크', href: '/main/attendance', description: '실시간 학생 출석 체크' },
          { id: 'history', label: '출결 이력', href: '/main/attendance/history', description: '출석 기록 조회' }
        ]
      },
      {
        id: 'attendance-reports',
        label: '출결 통계',
        items: [
          { id: 'stats', label: '출석 통계', href: '/main/attendance/stats', description: '출석률 및 통계 분석' },
          { id: 'reports', label: '출결 리포트', href: '/main/attendance/reports', description: '출결 현황 리포트' }
        ]
      }
    ]
  },
  {
    id: 'classes',
    label: '수업관리',
    icon: Users,
    href: '/main/classes',
    searchContext: 'classes',
    requiredRoles: ['system_admin', 'tenant_admin', 'admin', 'instructor'],
    description: '수업 및 반 관리',
    subtabs: [
      {
        id: 'class-management',
        label: '수업 관리',
        items: [
          { id: 'list', label: '수업 목록', href: '/main/classes', description: '전체 수업 조회 및 관리' },
          { id: 'create', label: '수업 개설', href: '/main/classes/create', description: '새로운 수업 개설' }
        ]
      },
      {
        id: 'resources',
        label: '수업 자원',
        items: [
          { id: 'schedule', label: '수업 일정', href: '/main/classes/schedule', description: '수업 시간표 관리' },
          { id: 'materials', label: '교재 관리', href: '/main/classes/materials', description: '수업 교재 및 자료' }
        ]
      }
    ]
  },
  {
    id: 'staff',
    label: '직원관리',
    icon: User,
    href: '/main/staff',
    searchContext: 'staff',
    requiredRoles: ['system_admin', 'tenant_admin', 'admin'],
    description: '직원 정보 관리',
    subtabs: [
      {
        id: 'personnel',
        label: '인사 관리',
        items: [
          { id: 'staff-list', label: '직원 목록', href: '/main/staff', description: '전체 직원 조회' },
          { id: 'instructors', label: '강사 관리', href: '/main/staff/instructors', description: '강사 정보 및 관리' }
        ]
      },
      {
        id: 'administration',
        label: '인사 행정',
        items: [
          { id: 'permissions', label: '권한 관리', href: '/main/staff/permissions', description: '직원 권한 설정' },
          { id: 'payroll', label: '급여 관리', href: '/main/staff/payroll', description: '급여 및 정산' }
        ]
      }
    ]
  },
  {
    id: 'courses',
    label: '과정관리',
    icon: BookOpen,
    href: '/main/courses',
    searchContext: 'dashboard', // 추후 확장 예정
    requiredRoles: ['system_admin', 'tenant_admin', 'admin'],
    description: '수강 과정 및 패키지 관리',
    subtabs: [
      {
        id: 'course-management',
        label: '과정 관리',
        items: [
          { id: 'programs', label: '과정 목록', href: '/main/courses', description: '전체 과정 조회' },
          { id: 'curriculum', label: '커리큘럼', href: '/main/courses/curriculum', description: '과정별 커리큘럼' }
        ]
      },
      {
        id: 'packages',
        label: '수강 패키지',
        items: [
          { id: 'packages', label: '패키지 관리', href: '/main/courses/packages', description: '수강 패키지 관리' }
        ]
      }
    ]
  },
  {
    id: 'schedules',
    label: '시간표',
    icon: Calendar,
    href: '/main/schedules',
    searchContext: 'schedule',
    requiredRoles: [], // 모든 사용자 접근 가능
    description: '수업 시간표',
    subtabs: [
      {
        id: 'schedule-view',
        label: '시간표 보기',
        items: [
          { id: 'weekly', label: '주간 시간표', href: '/main/schedules', description: '주간 수업 일정' },
          { id: 'monthly', label: '월간 달력', href: '/main/schedules/monthly', description: '월간 수업 달력' }
        ]
      },
      {
        id: 'facility',
        label: '시설 관리',
        items: [
          { id: 'rooms', label: '강의실 관리', href: '/main/schedules/rooms', description: '강의실 배정 현황' }
        ]
      }
    ]
  },
  {
    id: 'reports',
    label: '리포트',
    icon: BarChart3,
    href: '/main/reports',
    searchContext: 'dashboard', // 추후 확장 예정
    requiredRoles: ['system_admin', 'tenant_admin', 'admin'],
    description: '통계 및 분석 리포트',
    subtabs: [
      {
        id: 'academic-reports',
        label: '학사 리포트',
        items: [
          { id: 'dashboard', label: '대시보드', href: '/main/reports', description: '종합 통계 대시보드' },
          { id: 'attendance', label: '출석 현황', href: '/main/reports/attendance', description: '출석 통계 및 분석' },
          { id: 'performance', label: '성과 분석', href: '/main/reports/performance', description: '학습 성과 리포트' }
        ]
      },
      {
        id: 'business-reports',
        label: '경영 리포트',
        items: [
          { id: 'financial', label: '재무 리포트', href: '/main/reports/financial', description: '매출 및 수익 분석' }
        ]
      }
    ]
  }
]

/**
 * 사용자 역할에 따라 접근 가능한 탭을 필터링
 */
const getVisibleTabsForRole = (userRole: UserRole): TabItem[] => {
  return ALL_TABS.filter(tab => {
    // 권한 요구사항이 없으면 모든 사용자 접근 가능
    if (tab.requiredRoles.length === 0) return true
    
    // 사용자 역할이 필요 권한에 포함되는지 확인
    return tab.requiredRoles.includes(userRole)
  })
}

/**
 * URL 경로에서 탭 ID 추출
 */
const getTabIdFromPath = (pathname: string): string => {
  // /main/students -> students
  // /main -> dashboard  
  // /admin/students -> students (legacy)
  // /admin -> dashboard (legacy)
  const segments = pathname.split('/').filter(Boolean)
  
  // /main 또는 /admin 으로 시작하는 경로 처리
  if (segments.length >= 1 && (segments[0] === 'main' || segments[0] === 'admin')) {
    // 단일 경로: /main 또는 /admin
    if (segments.length === 1) {
      return 'dashboard'
    }
    
    // 하위 경로: /main/students, /admin/students 등
    if (segments.length >= 2) {
      const tabId = segments[1]
      // 유효한 탭인지 확인
      const isValidTab = ALL_TABS.some(tab => tab.id === tabId)
      return isValidTab ? tabId : 'dashboard'
    }
  }
  
  return 'dashboard'
}

/**
 * 페이지 접근 권한 검증
 */
export const validatePageAccess = (pathname: string, userRole: UserRole | null): boolean => {
  if (!userRole) return false
  
  const tabId = getTabIdFromPath(pathname)
  const tab = ALL_TABS.find(t => t.id === tabId)
  
  if (!tab) return false
  
  // 권한 요구사항이 없으면 접근 허용
  if (tab.requiredRoles.length === 0) return true
  
  // 사용자 역할이 필요 권한에 포함되는지 확인
  return tab.requiredRoles.includes(userRole)
}

/**
 * 초기 상태
 */
const initialState = {
  currentTab: 'dashboard',
  allTabs: ALL_TABS,
  visibleTabs: ALL_TABS, // 초기에는 모든 탭 표시
  userRole: null as UserRole | null
}

/**
 * 네비게이션 스토어 생성
 */
export const useNavigationStore = create<NavigationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        setCurrentTab: (tabId: string) => {
          const { visibleTabs } = get()
          const tab = visibleTabs.find(t => t.id === tabId)
          
          if (tab) {
            set({ currentTab: tabId })
            
            // SearchSidebar 컨텍스트 동기화
            const searchStore = useSearchStore.getState()
            searchStore.setContext(tab.searchContext)
          }
        },

        updateVisibleTabs: (userRole: UserRole) => {
          const visibleTabs = getVisibleTabsForRole(userRole)
          const { currentTab } = get()
          
          // 현재 탭이 보이는 탭 목록에 없으면 첫 번째 탭으로 이동
          const isCurrentTabVisible = visibleTabs.some(tab => tab.id === currentTab)
          const firstVisibleTab = visibleTabs[0]
          const newCurrentTab = isCurrentTabVisible ? currentTab : (firstVisibleTab?.id ?? 'dashboard')
          
          set({ 
            userRole, 
            visibleTabs,
            currentTab: newCurrentTab
          })
          
          // 새로운 현재 탭에 맞춰 SearchSidebar 컨텍스트 동기화
          if (newCurrentTab !== currentTab) {
            const newTab = visibleTabs.find(t => t.id === newCurrentTab)
            if (newTab) {
              const searchStore = useSearchStore.getState()
              searchStore.setContext(newTab.searchContext)
            }
          }
        },

        updateTabBadge: (tabId: string, badge: number | undefined) => {
          set((state) => ({
            allTabs: state.allTabs.map(tab => 
              tab.id === tabId ? { ...tab, badge } : tab
            ),
            visibleTabs: state.visibleTabs.map(tab => 
              tab.id === tabId ? { ...tab, badge } : tab
            )
          }))
        },

        syncWithSearchContext: () => {
          const { currentTab, visibleTabs } = get()
          const tab = visibleTabs.find(t => t.id === currentTab)
          
          if (tab) {
            const searchStore = useSearchStore.getState()
            searchStore.setContext(tab.searchContext)
          }
        },

        reset: () => {
          set(initialState)
        }
      }),
      {
        name: 'navigation-store',
        partialize: (state) => ({
          currentTab: state.currentTab,
          userRole: state.userRole
        })
      }
    ),
    {
      name: 'NavigationStore'
    }
  )
)

/**
 * 현재 경로에서 탭 ID 추출하여 스토어 동기화
 */
export const syncTabWithPath = (pathname: string) => {
  const tabId = getTabIdFromPath(pathname)
  const store = useNavigationStore.getState()
  
  if (store.currentTab !== tabId) {
    store.setCurrentTab(tabId)
  }
}

/**
 * 선택자 훅들 (성능 최적화)
 */
export const useCurrentTab = () => useNavigationStore(state => state.currentTab)
export const useVisibleTabs = () => useNavigationStore(state => state.visibleTabs)
export const useUserRole = () => useNavigationStore(state => state.userRole)
export const useTabBadges = () => useNavigationStore(state => 
  state.visibleTabs.reduce((acc, tab) => {
    if (tab.badge !== undefined) {
      acc[tab.id] = tab.badge
    }
    return acc
  }, {} as Record<string, number>)
)