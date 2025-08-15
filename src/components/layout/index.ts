/**
 * 레이아웃 컴포넌트 Export
 * @description EduCanvas 레이아웃 시스템의 모든 컴포넌트
 */

// 메인 레이아웃
export { MainLayout, MinimalLayout, FullscreenLayout } from './MainLayout'
export { AdminLayout } from './AdminLayout'

// 헤더 및 네비게이션
export { Header, PageHeader } from './Header'
export { Sidebar, useFilteredNavigation, QuickNavigation } from './Sidebar'
export { SidebarItem, SidebarItemGroup } from './SidebarItem'

// 브레드크럼
export { Breadcrumbs, generateBreadcrumbs, MobileBreadcrumbs } from './Breadcrumbs'

// 드롭다운 컴포넌트
export { NotificationDropdown, generateSampleNotifications } from './NotificationDropdown'
export { UserProfileDropdown, MobileUserMenu } from './UserProfileDropdown'

// 타입 정의
export type {
  LayoutProps,
  BreadcrumbItem,
  NavigationItem,
  SidebarProps,
  HeaderProps,
  PageHeaderProps,
  NotificationItem,
  NotificationDropdownProps,
  UserProfileDropdownProps,
  UserMenuItem,
  SidebarItemProps,
  MobileMenuProps,
  LayoutContextType,
  LayoutConfig,
  LayoutVariant,
  LayoutTheme,
  Breakpoints,
  AnimationConfig
} from './types'