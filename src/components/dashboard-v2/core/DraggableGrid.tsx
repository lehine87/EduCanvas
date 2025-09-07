'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { GripVertical, Settings, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// React-Grid-Layout 반응형 그리드
const ResponsiveGridLayout = WidthProvider(Responsive)

// 위젯 크기 타입
type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'extra-wide' | 'tall'

// React-Grid-Layout 레이아웃 타입
interface GridLayoutItem {
  i: string  // 위젯 ID
  x: number  // 그리드 x 위치
  y: number  // 그리드 y 위치
  w: number  // 너비 (그리드 단위)
  h: number  // 높이 (그리드 단위)
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  isDraggable?: boolean
  isResizable?: boolean
}

interface DraggableWidgetProps {
  id: string
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  size: WidgetSize
  isEditMode?: boolean
  onSizeChange?: (newSize: WidgetSize) => void
  className?: string
}

interface DraggableGridProps {
  widgets: Array<{
    id: string
    title: string
    subtitle?: string
    icon?: React.ReactNode
    component: React.ComponentType<any>
    props: any
    size: WidgetSize
    priority: number
  }>
  onLayoutChange?: (layout: GridLayoutItem[]) => void
  onSizeChange?: (widgetId: string, newSize: WidgetSize) => void
  onReorder?: (newOrder: any) => void
  className?: string
}

// 위젯 크기별 그리드 단위 매핑 (React-Grid-Layout 기준)
const sizeToGridUnits: Record<WidgetSize, { w: number; h: number; minW: number; minH: number }> = {
  small: { w: 3, h: 2, minW: 2, minH: 1 },        // 3x2 그리드 (작은 위젯)
  medium: { w: 6, h: 3, minW: 3, minH: 2 },       // 6x3 그리드 (중간 위젯)
  large: { w: 6, h: 4, minW: 4, minH: 3 },        // 6x4 그리드 (큰 위젯)
  wide: { w: 12, h: 3, minW: 6, minH: 2 },        // 12x3 그리드 (전체 너비)
  'extra-wide': { w: 12, h: 5, minW: 8, minH: 3 }, // 12x5 그리드 (초대형)
  tall: { w: 4, h: 6, minW: 3, minH: 4 }          // 4x6 그리드 (세로형)
}

// 사이즈 옵션
const sizeOptions: Array<{
  value: WidgetSize
  label: string
  icon: string
}> = [
  { value: 'small', label: '소형 (3x2)', icon: '◻️' },
  { value: 'medium', label: '중형 (6x3)', icon: '▬' },
  { value: 'large', label: '대형 (6x4)', icon: '◼️' },
  { value: 'wide', label: '가로형 (12x3)', icon: '🔲' },
  { value: 'extra-wide', label: '초대형 (12x5)', icon: '⬛' },
  { value: 'tall', label: '세로형 (4x6)', icon: '▮' }
]

// React-Grid-Layout 브레이크포인트 설정
const breakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
}

const cols = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
}

// React-Grid-Layout 기반 위젯 컴포넌트
function DraggableWidget({
  id,
  title,
  subtitle,
  icon,
  children,
  size,
  isEditMode = false,
  onSizeChange,
  className
}: DraggableWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  
  const gridUnits = sizeToGridUnits[size]

  return (
    <div
      className={cn(
        'relative h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden',
        isEditMode && 'cursor-move',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 편집 모드 오버레이 */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-xl z-30 flex items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-3">
              {/* 드래그 힌트 */}
              <div className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg">
                <GripVertical className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>

              {/* 사이즈 조절 버튼 */}
              {onSizeChange && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSizeMenu(!showSizeMenu)}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    크기 조절
                  </Button>

                  <AnimatePresence>
                    {showSizeMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]">
                          {sizeOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                onSizeChange(option.value)
                                setShowSizeMenu(false)
                              }}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2',
                                size === option.value
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                            >
                              <span className="text-lg">{option.icon}</span>
                              <span className="text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 위젯 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="text-gray-600 dark:text-gray-400">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {`${gridUnits.w}×${gridUnits.h}`}
            </Badge>
            {isEditMode && (
              <div className="p-1 bg-white/20 dark:bg-gray-800/20 rounded backdrop-blur-sm">
                <GripVertical className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 위젯 콘텐츠 */}
      <div className="h-full pt-16">
        {children}
      </div>

      {/* 호버 시 드래그 힌트 (편집 모드 아닐 때) */}
      <AnimatePresence>
        {isHovered && !isEditMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-3 right-3 z-20"
          >
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg border border-white/20">
              <GripVertical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// React-Grid-Layout 기반 대시보드 그리드
export function DraggableGrid({
  widgets,
  onLayoutChange,
  onSizeChange,
  className
}: DraggableGridProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  
  // 초기 레이아웃 생성
  const initialLayout = useMemo(() => {
    const layouts: Record<string, GridLayoutItem[]> = {}
    
    // 각 브레이크포인트별 레이아웃 생성
    Object.keys(cols).forEach((breakpoint) => {
      const maxCols = cols[breakpoint as keyof typeof cols]
      let currentX = 0
      let currentY = 0
      
      layouts[breakpoint] = widgets.map((widget, index) => {
        const gridUnits = sizeToGridUnits[widget.size]
        
        // 브레이크포인트별 크기 조정
        const adjustedW = Math.min(gridUnits.w, maxCols)
        
        // 현재 행에 공간이 부족하면 다음 행으로
        if (currentX + adjustedW > maxCols) {
          currentX = 0
          currentY += gridUnits.h
        }
        
        const layoutItem: GridLayoutItem = {
          i: widget.id,
          x: currentX,
          y: currentY,
          w: adjustedW,
          h: gridUnits.h,
          minW: gridUnits.minW,
          minH: gridUnits.minH,
          isDraggable: true,
          isResizable: true
        }
        
        currentX += adjustedW
        return layoutItem
      })
    })
    
    return layouts
  }, [widgets])
  
  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((currentLayout: GridLayoutItem[], allLayouts: any) => {
    onLayoutChange?.(currentLayout)
  }, [onLayoutChange])

  // 위젯 크기 변경 핸들러
  const handleSizeChange = useCallback((widgetId: string, newSize: WidgetSize) => {
    onSizeChange?.(widgetId, newSize)
  }, [onSizeChange])

  return (
    <div className={cn('space-y-6', className)}>
      {/* 편집 모드 토글 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          대시보드 위젯
        </h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            편집 모드
          </span>
          <Switch
            checked={isEditMode}
            onCheckedChange={setIsEditMode}
          />
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditMode ? '완료' : '편집'}
          </Button>
        </div>
      </div>

      {/* React-Grid-Layout 컨테이너 */}
      <div className={cn(
        'transition-all duration-300',
        isEditMode && 'bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-2xl'
      )}>
        <ResponsiveGridLayout
          className="layout"
          layouts={initialLayout}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          preventCollision={false}
          compactType="vertical"
          onLayoutChange={handleLayoutChange}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <DraggableWidget
                id={widget.id}
                title={widget.title}
                subtitle={widget.subtitle}
                icon={widget.icon}
                size={widget.size}
                isEditMode={isEditMode}
                onSizeChange={(newSize) => handleSizeChange(widget.id, newSize)}
              >
                <widget.component {...widget.props} />
              </DraggableWidget>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* 편집 모드 안내 */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="text-blue-500">
                <GripVertical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  업계 표준 대시보드 편집
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  <strong>React-Grid-Layout</strong>을 사용한 프로페셔널 드래그앤드롭! 
                  위젯을 드래그하여 재배치하고 모서리를 드래그하여 크기를 조절하세요.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DraggableGrid