'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export interface GridBreakpoint {
  xs: number  // 320px+
  sm: number  // 640px+
  md: number  // 768px+
  lg: number  // 1024px+
  xl: number  // 1280px+
  '2xl': number // 1536px+
}

export interface WidgetSize {
  cols: GridBreakpoint
  rows?: number
  minHeight?: string
}

export interface SmartGridProps {
  children: React.ReactNode
  className?: string
  gap?: number
  maxColumns?: GridBreakpoint
  autoFlow?: 'row' | 'column' | 'dense'
  animate?: boolean
}

export interface GridItemProps {
  children: React.ReactNode
  size: WidgetSize
  order?: GridBreakpoint
  className?: string
  animate?: boolean
}

// 기본 그리드 설정
const defaultMaxColumns: GridBreakpoint = {
  xs: 1,
  sm: 2, 
  md: 3,
  lg: 4,
  xl: 6,
  '2xl': 8
}

// 반응형 그리드 컨테이너
export function SmartGrid({ 
  children, 
  className = '', 
  gap = 24,
  maxColumns = defaultMaxColumns,
  autoFlow = 'row',
  animate = true
}: SmartGridProps) {
  const gridClass = useMemo(() => {
    const baseClasses = 'grid w-full'
    
    const columnClasses = [
      `grid-cols-${maxColumns.xs}`,
      `sm:grid-cols-${maxColumns.sm}`,
      `md:grid-cols-${maxColumns.md}`,
      `lg:grid-cols-${maxColumns.lg}`,
      `xl:grid-cols-${maxColumns.xl}`,
      `2xl:grid-cols-${maxColumns['2xl']}`
    ].join(' ')
    
    const gapClass = `gap-${Math.floor(gap / 4)}`
    const flowClass = `grid-flow-${autoFlow}`
    
    return `${baseClasses} ${columnClasses} ${gapClass} ${flowClass} ${className}`
  }, [maxColumns, gap, autoFlow, className])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  if (animate) {
    return (
      <motion.div 
        className={gridClass}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    )
  }

  return <div className={gridClass}>{children}</div>
}

// 그리드 아이템 (위젯 컨테이너)
export function GridItem({ 
  children, 
  size, 
  order,
  className = '',
  animate = true
}: GridItemProps) {
  const itemClass = useMemo(() => {
    const baseClasses = 'relative w-full'
    
    // 컬럼 스팬 설정
    const spanClasses = [
      `col-span-${size.cols.xs}`,
      `sm:col-span-${size.cols.sm}`,
      `md:col-span-${size.cols.md}`,
      `lg:col-span-${size.cols.lg}`,
      `xl:col-span-${size.cols.xl}`,
      `2xl:col-span-${size.cols['2xl']}`
    ].join(' ')
    
    // 행 스팬 설정 (옵션)
    const rowSpan = size.rows ? `row-span-${size.rows}` : ''
    
    // 순서 설정 (옵션)
    const orderClasses = order ? [
      `order-${order.xs}`,
      `sm:order-${order.sm}`,
      `md:order-${order.md}`,
      `lg:order-${order.lg}`,
      `xl:order-${order.xl}`,
      `2xl:order-${order['2xl']}`
    ].join(' ') : ''
    
    // 최소 높이 설정
    const heightClass = size.minHeight || 'min-h-[200px]'
    
    return `${baseClasses} ${spanClasses} ${rowSpan} ${orderClasses} ${heightClass} ${className}`
  }, [size, order, className])

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  }

  if (animate) {
    return (
      <motion.div 
        className={itemClass}
        variants={itemVariants}
        layout
      >
        {children}
      </motion.div>
    )
  }

  return <div className={itemClass}>{children}</div>
}

// 위젯 크기 프리셋
export const WidgetSizes = {
  // 1x1 작은 위젯 (알림, 시계 등)
  small: {
    cols: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, '2xl': 1 },
    rows: 1,
    minHeight: '180px'
  } as WidgetSize,
  
  // 2x1 중간 위젯 (차트, 통계 등)
  medium: {
    cols: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, '2xl': 2 },
    rows: 1,
    minHeight: '220px'
  } as WidgetSize,
  
  // 2x2 큰 위젯 (상세 분석, 테이블 등)
  large: {
    cols: { xs: 1, sm: 2, md: 2, lg: 2, xl: 3, '2xl': 3 },
    rows: 2,
    minHeight: '320px'
  } as WidgetSize,
  
  // 전체 너비 위젯 (검색, 공지사항 등)
  wide: {
    cols: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6, '2xl': 8 },
    rows: 1,
    minHeight: '320px' // 실시간 출석 위젯을 위해 높이 증가
  } as WidgetSize,
  
  // 초대형 위젯 (실시간 출석 현황 전용)
  'extra-wide': {
    cols: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6, '2xl': 8 },
    rows: 2,
    minHeight: '480px'
  } as WidgetSize,
  
  // 높은 위젯 (세로 차트, 피드 등)
  tall: {
    cols: { xs: 1, sm: 1, md: 1, lg: 1, xl: 2, '2xl': 2 },
    rows: 3,
    minHeight: '480px'
  } as WidgetSize
}

// 역할별 그리드 설정
export const RoleGridConfigs = {
  admin: {
    maxColumns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6, '2xl': 8 } as GridBreakpoint,
    gap: 24,
    autoFlow: 'row' as const
  },
  instructor: {
    maxColumns: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 6 } as GridBreakpoint,
    gap: 20,
    autoFlow: 'row' as const
  },
  staff: {
    maxColumns: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 4 } as GridBreakpoint,
    gap: 16,
    autoFlow: 'row' as const
  }
}

// 자동 배치 유틸리티
export function optimizeLayout(
  widgets: Array<{ id: string; size: WidgetSize; priority: number }>,
  screenSize: keyof GridBreakpoint,
  maxCols: number
): Array<{ id: string; order: number }> {
  // 우선순위 기반 정렬
  const sortedWidgets = [...widgets].sort((a, b) => a.priority - b.priority)
  
  let currentRow = 0
  let currentCol = 0
  
  return sortedWidgets.map((widget) => {
    const colSpan = widget.size.cols[screenSize]
    
    // 현재 행에 공간이 부족하면 다음 행으로
    if (currentCol + colSpan > maxCols) {
      currentRow++
      currentCol = 0
    }
    
    const order = currentRow * maxCols + currentCol
    currentCol += colSpan
    
    return { id: widget.id, order }
  })
}

export default SmartGrid