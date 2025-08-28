import type { LucideIcon } from 'lucide-react'
import type { SearchContext } from '@/lib/stores/searchStore'

/**
 * 서브탭 아이템 인터페이스 (소분류)
 */
export interface SubTabItem {
  /** 서브탭 고유 식별자 */
  id: string
  /** 한글 표시명 */
  label: string
  /** 라우팅 경로 */
  href: string
  /** 서브탭 설명 */
  description: string
}

/**
 * 서브탭 카테고리 인터페이스 (중분류)
 */
export interface SubTabCategory {
  /** 카테고리 고유 식별자 */
  id: string
  /** 카테고리명 (논클릭커블) */
  label: string
  /** 이 카테고리에 속하는 서브탭들 */
  items: SubTabItem[]
}

/**
 * 네비게이션 탭 아이템 인터페이스
 */
export interface TabItem {
  /** 탭 고유 식별자 */
  id: string
  /** 한글 표시명 */
  label: string
  /** Lucide 아이콘 컴포넌트 */
  icon: LucideIcon
  /** 라우팅 경로 (/main/*) */
  href: string
  /** SearchSidebar 컨텍스트 */
  searchContext: SearchContext
  /** 알림 배지 카운트 */
  badge?: number
  /** 접근 필요 권한 (빈 배열 = 모든 사용자 접근 가능) */
  requiredRoles: string[]
  /** 탭 설명 (접근성용) */
  description?: string
  /** 서브탭 카테고리 목록 (hover 메뉴용) */
  subtabs?: SubTabCategory[]
}

/**
 * 사용자 역할 타입
 */
export type UserRole = 
  | 'system_admin' 
  | 'tenant_admin' 
  | 'admin' 
  | 'instructor' 
  | 'staff' 
  | 'viewer'

/**
 * 네비게이션 상태 인터페이스
 */
export interface NavigationState {
  /** 현재 활성화된 탭 ID */
  currentTab: string
  /** 전체 탭 정의 목록 */
  allTabs: TabItem[]
  /** 현재 사용자에게 보이는 탭 목록 */
  visibleTabs: TabItem[]
  /** 현재 사용자 역할 */
  userRole: UserRole | null
}

/**
 * 네비게이션 액션 인터페이스
 */
export interface NavigationActions {
  /** 현재 탭 설정 */
  setCurrentTab: (tabId: string) => void
  /** 사용자 권한 기반으로 보이는 탭 업데이트 */
  updateVisibleTabs: (userRole: UserRole) => void
  /** 특정 탭의 배지 카운트 업데이트 */
  updateTabBadge: (tabId: string, badge: number | undefined) => void
  /** SearchSidebar와 컨텍스트 동기화 */
  syncWithSearchContext: () => void
  /** 모든 상태 초기화 */
  reset: () => void
}

/**
 * 전체 네비게이션 스토어 타입
 */
export type NavigationStore = NavigationState & NavigationActions