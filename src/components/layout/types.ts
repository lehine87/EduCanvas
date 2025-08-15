/**
 * 레이아웃 컴포넌트 타입 정의
 * @description EduCanvas 레이아웃 시스템의 모든 타입 정의
 * @version 1.0.0
 */

import type { ReactNode, ComponentType } from 'react'
import type { UserRole } from '@/types/auth.types'

/**
 * 메인 레이아웃 Props
 */
export interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  sidebar?: boolean
  sidebarCollapsed?: boolean
  showHeader?: boolean
  containerClassName?: string
  mainClassName?: string
}

/**
 * 브레드크럼 아이템
 */
export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
  icon?: ComponentType<{ className?: string }>
}

/**
 * 네비게이션 아이템
 */
export interface NavigationItem {
  name: string
  href: string
  icon: ComponentType<{ className?: string }>
  requiredRoles?: UserRole[]
  requiredPermissions?: string[]
  badge?: string | number
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  description?: string
  children?: NavigationItem[]
  isActive?: (pathname: string) => boolean
  onClick?: () => void
}

/**
 * 사이드바 Props
 */
export interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
  open?: boolean
  onClose?: () => void
}

/**
 * 헤더 Props
 */
export interface HeaderProps {
  title?: string
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
  actions?: ReactNode
  showNotifications?: boolean
  showUserMenu?: boolean
}

/**
 * 페이지 헤더 Props
 */
export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  backButton?: {
    label: string
    href: string
  }
}

/**
 * 알림 아이템
 */
export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  avatar?: string
}

/**
 * 알림 드롭다운 Props
 */
export interface NotificationDropdownProps {
  notifications?: NotificationItem[]
  unreadCount?: number
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onViewAll?: () => void
}

/**
 * 사용자 프로필 드롭다운 Props
 */
export interface UserProfileDropdownProps {
  user?: {
    email: string
    name?: string
    avatar?: string
    role?: string
  }
  menuItems?: UserMenuItem[]
  onSignOut?: () => void
}

/**
 * 사용자 메뉴 아이템
 */
export interface UserMenuItem {
  name: string
  href?: string
  icon?: ComponentType<{ className?: string }>
  onClick?: () => void
  show?: boolean
  divider?: boolean
  variant?: 'default' | 'danger'
}

/**
 * 사이드바 아이템 Props
 */
export interface SidebarItemProps {
  item: NavigationItem
  depth?: number
  isActive?: boolean
  collapsed?: boolean
  onClick?: () => void
}

/**
 * 모바일 메뉴 Props
 */
export interface MobileMenuProps {
  open: boolean
  onClose: () => void
  navigation: NavigationItem[]
}

/**
 * 레이아웃 컨텍스트 타입
 */
export interface LayoutContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  pageTitle: string
  setPageTitle: (title: string) => void
}

/**
 * 레이아웃 설정
 */
export interface LayoutConfig {
  defaultSidebarCollapsed?: boolean
  sidebarWidth?: string
  sidebarCollapsedWidth?: string
  headerHeight?: string
  mobileBreakpoint?: number
  animation?: {
    duration?: number
    easing?: string
  }
  theme?: {
    sidebar?: {
      background?: string
      text?: string
      activeBackground?: string
      activeText?: string
      hoverBackground?: string
    }
    header?: {
      background?: string
      text?: string
      borderColor?: string
    }
  }
}

/**
 * 레이아웃 변형
 */
export type LayoutVariant = 'default' | 'compact' | 'minimal' | 'fullscreen'

/**
 * 레이아웃 테마
 */
export type LayoutTheme = 'light' | 'dark' | 'system'

/**
 * 반응형 브레이크포인트
 */
export interface Breakpoints {
  sm: number  // 640px
  md: number  // 768px
  lg: number  // 1024px
  xl: number  // 1280px
  '2xl': number  // 1536px
}

/**
 * 레이아웃 애니메이션 설정
 */
export interface AnimationConfig {
  sidebarToggle: {
    duration: number
    easing: string
  }
  mobileMenu: {
    duration: number
    easing: string
  }
  dropdown: {
    duration: number
    easing: string
  }
}