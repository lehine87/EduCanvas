'use client'

import React from 'react'

export interface WidgetConfig {
  id: string
  component: React.ComponentType<any>
  props?: Record<string, any>
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall'
  priority: number
  roleCategories: string[]  // ['admin', 'instructor', 'staff'] 등 역할 카테고리
  permissions?: string[]    // ['students.read', 'payments.create'] 등 권한 기반
  title: string
  subtitle?: string
  icon?: React.ReactNode
}

export interface DashboardLayoutConfig {
  gridConfig: {
    maxColumns: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number }
    gap: number
    autoFlow: 'row' | 'column' | 'dense'
  }
  preferences: {
    theme: 'glass' | 'solid' | 'mixed'
    animations: boolean
    compactMode: boolean
  }
}

export interface UserRoleInfo {
  roleName: string        // 실제 역할명 (예: 'super_admin', 'instructor', 'staff')
  roleDisplayName: string // 표시명 (예: '슈퍼 관리자', '강사', '직원')
  roleCategory: string    // 카테고리 (예: 'admin', 'instructor', 'staff')
  permissions: string[]   // 사용자가 가진 권한 목록
  hierarchyLevel: number  // 역할 계층 레벨
}

// 역할 카테고리별 기본 레이아웃 설정
export const DefaultLayoutConfigs: Record<string, DashboardLayoutConfig> = {
  admin: {
    gridConfig: {
      maxColumns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6, '2xl': 8 },
      gap: 24,
      autoFlow: 'row'
    },
    preferences: {
      theme: 'mixed', // glass + solid 혼합
      animations: true,
      compactMode: false
    }
  },
  
  instructor: {
    gridConfig: {
      maxColumns: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 6 },
      gap: 20,
      autoFlow: 'row'
    },
    preferences: {
      theme: 'glass', // glassmorphism 위주
      animations: true,
      compactMode: false
    }
  },
  
  staff: {
    gridConfig: {
      maxColumns: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 4 },
      gap: 16,
      autoFlow: 'row'
    },
    preferences: {
      theme: 'solid', // 명확한 구분선
      animations: false,
      compactMode: true
    }
  },
  
  viewer: {
    gridConfig: {
      maxColumns: { xs: 1, sm: 2, md: 2, lg: 2, xl: 3, '2xl': 3 },
      gap: 12,
      autoFlow: 'row'
    },
    preferences: {
      theme: 'solid',
      animations: false,
      compactMode: true
    }
  }
}

// 역할 카테고리별 위젯 우선순위
export const CategoryWidgetPriorities: Record<string, Record<string, number>> = {
  admin: {
    // 관리자: 경영 지표 중심
    'revenue-analytics': 1,
    'student-overview': 2,
    'critical-alerts': 3,
    'attendance-check': 4,
    'quick-actions': 5,
    'ai-insights': 6
  },
  
  instructor: {
    // 강사: 교육 활동 중심
    'attendance-check': 1,
    'student-overview': 2,
    'critical-alerts': 3,
    'quick-actions': 4,
    'ai-insights': 5,
    'revenue-analytics': 6
  },
  
  staff: {
    // 직원: 운영 업무 중심
    'quick-actions': 1,
    'critical-alerts': 2,
    'attendance-check': 3,
    'student-overview': 4,
    'ai-insights': 5,
    'revenue-analytics': 6
  },
  
  viewer: {
    // 뷰어: 조회 중심
    'student-overview': 1,
    'attendance-check': 2,
    'ai-insights': 3
  }
}

// 위젯 필터링 (역할 카테고리 + 권한 기반)
export function filterWidgetsByRole(
  widgets: WidgetConfig[], 
  userRoleInfo: UserRoleInfo
): WidgetConfig[] {
  const priorities = CategoryWidgetPriorities[userRoleInfo.roleCategory] || {}
  
  return widgets
    .filter(widget => {
      // 1. 역할 카테고리 확인
      const hasRoleCategory = widget.roleCategories.includes(userRoleInfo.roleCategory)
      
      // 2. 권한 확인 (옵션)
      const hasPermissions = !widget.permissions || 
        widget.permissions.some(permission => userRoleInfo.permissions.includes(permission))
      
      return hasRoleCategory && hasPermissions
    })
    .map(widget => ({
      ...widget,
      priority: priorities[widget.id] || 999
    }))
    .sort((a, b) => a.priority - b.priority)
}

// 역할 카테고리별 테마 스타일 적용
export function getRoleTheme(roleCategory: string) {
  const config = DefaultLayoutConfigs[roleCategory] || DefaultLayoutConfigs.staff
  
  const themeStyles = {
    glass: {
      primary: 'focus',
      secondary: 'ambient',
      critical: 'critical'
    },
    solid: {
      primary: 'solid',
      secondary: 'solid', 
      critical: 'solid'
    },
    mixed: {
      primary: 'focus',
      secondary: 'ambient',
      critical: 'solid'
    }
  }
  
  return {
    styles: themeStyles[config.preferences.theme],
    animations: config.preferences.animations,
    compactMode: config.preferences.compactMode
  }
}

// 반응형 위젯 크기 조정
export function adaptWidgetSize(
  baseSize: WidgetConfig['size'],
  roleCategory: string,
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
): WidgetConfig['size'] {
  const config = DefaultLayoutConfigs[roleCategory] || DefaultLayoutConfigs.staff
  
  // 컴팩트 모드일 때 크기 축소
  if (config.preferences.compactMode) {
    const sizeMapping = {
      'wide': 'large',
      'large': 'medium', 
      'medium': 'small',
      'small': 'small',
      'tall': 'medium'
    } as const
    
    return sizeMapping[baseSize] || baseSize
  }
  
  // 작은 화면에서 크기 조정
  if (screenSize === 'xs' || screenSize === 'sm') {
    if (baseSize === 'wide' || baseSize === 'large') {
      return 'medium'
    }
  }
  
  return baseSize
}

// 위젯 자동 배치 최적화
export function optimizeWidgetLayout(
  widgets: WidgetConfig[],
  roleCategory: string,
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
) {
  const config = DefaultLayoutConfigs[roleCategory] || DefaultLayoutConfigs.staff
  const maxCols = config.gridConfig.maxColumns[screenSize]
  
  let currentRow = 0
  let currentCol = 0
  
  return widgets.map((widget) => {
    const adaptedSize = adaptWidgetSize(widget.size, roleCategory, screenSize)
    
    // 크기별 컬럼 스팬 계산
    const colSpans = {
      small: 1,
      medium: Math.min(2, maxCols),
      large: Math.min(3, maxCols), 
      wide: maxCols,
      tall: Math.min(2, maxCols)
    }
    
    const colSpan = colSpans[adaptedSize]
    
    // 현재 행에 공간 부족시 다음 행으로
    if (currentCol + colSpan > maxCols) {
      currentRow++
      currentCol = 0
    }
    
    const order = currentRow * maxCols + currentCol
    currentCol += colSpan
    
    return {
      ...widget,
      size: adaptedSize,
      order,
      colSpan
    }
  })
}

// 역할 카테고리별 배경색 및 액센트 색상
export function getRoleColors(roleCategory: string) {
  const colorMappings = {
    admin: {
      background: 'bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950',
      accent: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    instructor: {
      background: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
      accent: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    staff: {
      background: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950',
      accent: 'text-orange-600 dark:text-orange-400', 
      border: 'border-orange-200 dark:border-orange-800'
    },
    viewer: {
      background: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950',
      accent: 'text-gray-600 dark:text-gray-400', 
      border: 'border-gray-200 dark:border-gray-800'
    }
  }
  
  return colorMappings[roleCategory] || colorMappings.staff
}

// 역할명으로부터 카테고리 추론
export function inferRoleCategory(roleName: string): string {
  const roleNameLower = roleName.toLowerCase()
  
  if (roleNameLower.includes('admin') || roleNameLower.includes('manager') || roleNameLower.includes('원장')) {
    return 'admin'
  }
  if (roleNameLower.includes('instructor') || roleNameLower.includes('teacher') || roleNameLower.includes('강사')) {
    return 'instructor'
  }
  if (roleNameLower.includes('staff') || roleNameLower.includes('직원') || roleNameLower.includes('사무')) {
    return 'staff'
  }
  if (roleNameLower.includes('viewer') || roleNameLower.includes('readonly') || roleNameLower.includes('조회')) {
    return 'viewer'
  }
  
  // 기본값: staff
  return 'staff'
}

// Role Adapter Hook
export function useRoleAdapter(userRoleInfo: UserRoleInfo | null, widgets: WidgetConfig[]) {
  const [screenSize, setScreenSize] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md')
  
  // 화면 크기 감지
  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) setScreenSize('xs')
      else if (width < 768) setScreenSize('sm')
      else if (width < 1024) setScreenSize('md')
      else if (width < 1280) setScreenSize('lg')
      else if (width < 1536) setScreenSize('xl')
      else setScreenSize('2xl')
    }
    
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])
  
  // 기본값 설정 (권한 정보가 없을 때)
  const defaultRoleInfo: UserRoleInfo = {
    roleName: 'staff',
    roleDisplayName: '직원',
    roleCategory: 'staff',
    permissions: [],
    hierarchyLevel: 1
  }
  
  const roleInfo = userRoleInfo || defaultRoleInfo
  
  // 역할별 위젯 필터링 및 최적화
  const adaptedWidgets = React.useMemo(() => {
    const filteredWidgets = filterWidgetsByRole(widgets, roleInfo)
    return optimizeWidgetLayout(filteredWidgets, roleInfo.roleCategory, screenSize)
  }, [widgets, roleInfo, screenSize])
  
  // 역할별 설정
  const layoutConfig = DefaultLayoutConfigs[roleInfo.roleCategory] || DefaultLayoutConfigs.staff
  const theme = getRoleTheme(roleInfo.roleCategory)
  const colors = getRoleColors(roleInfo.roleCategory)
  
  return {
    widgets: adaptedWidgets,
    layoutConfig,
    theme,
    colors,
    screenSize,
    roleInfo
  }
}

export default useRoleAdapter