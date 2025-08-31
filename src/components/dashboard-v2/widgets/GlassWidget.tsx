'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getGlowShadowStyle } from '../backgrounds'
import { useDarkMode } from '@/hooks/useDarkMode'

export type GlassOpacity = 'ambient' | 'focus' | 'critical' | 'solid'
export type GlassSize = 'sm' | 'md' | 'lg' | 'xl'

export interface GlassWidgetProps {
  children: React.ReactNode
  className?: string
  opacity?: GlassOpacity
  size?: GlassSize
  glow?: boolean
  float?: boolean
  animate?: boolean
  loading?: boolean
  error?: boolean
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  onClick?: () => void
}

// Glassmorphism 스타일 매핑
const glassStyles: Record<GlassOpacity, string> = {
  // 주변 정보용 - 높은 투명도
  ambient: 'backdrop-blur-sm bg-white/15 dark:bg-black/15 border border-white/20 dark:border-white/10',
  
  // 주요 데이터용 - 중간 투명도  
  focus: 'backdrop-blur-sm bg-white/25 dark:bg-black/25 border border-white/25 dark:border-white/15',
  
  // 중요 알림용 - 낮은 투명도
  critical: 'backdrop-blur-sm bg-white/35 dark:bg-black/35 border border-white/30 dark:border-white/20',
  
  // 솔리드 (긴급 상황)
  solid: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
}

// 크기별 스타일
const sizeStyles: Record<GlassSize, string> = {
  sm: 'p-4 rounded-lg text-sm',
  md: 'p-6 rounded-xl text-base', 
  lg: 'p-8 rounded-2xl text-lg',
  xl: 'p-10 rounded-3xl text-xl'
}

// Glow 효과 스타일은 이제 중앙 시스템에서 관리됨 (getGlowShadowStyle 함수 사용)

// Float 효과 스타일 
const floatStyles = 'transform-gpu'

export function GlassWidget({
  children,
  className = '',
  opacity = 'focus',
  size = 'md',
  glow = true,
  float = false,
  animate = true,
  loading = false,
  error = false,
  title,
  subtitle,
  icon,
  actions,
  onClick
}: GlassWidgetProps) {
  
  const baseClasses = 'relative overflow-hidden transition-all duration-300'
  
  // 다크모드 상태 감지
  const isDark = useDarkMode()
  
  const glassClass = glassStyles[opacity]
  const sizeClass = sizeStyles[size]  
  const glowClass = glow ? getGlowShadowStyle(opacity, isDark) : ''
  const floatClass = float ? floatStyles : ''
  const interactiveClass = onClick ? 'cursor-pointer' : '' // hover는 중앙 시스템에서 관리
  const errorClass = error ? 'border-red-500/50 bg-red-500/10' : ''
  
  const finalClassName = cn(
    baseClasses,
    glassClass,
    sizeClass,
    glowClass,
    floatClass,
    interactiveClass,
    errorClass,
    className
  )

  // 애니메이션 variants - Layout shift 방지를 위해 scale 최소화
  const widgetVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      scale: loading ? 1 : 0.98, // 로딩 중에는 스케일 변화 없음
      filter: 'blur(5px)'
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        duration: 0.4
      }
    },
    loading: {
      opacity: 1,
      y: 0,
      scale: 1, // 로딩 상태에서는 크기 고정
      filter: 'blur(0px)'
    },
    hover: {
      y: float ? -3 : 0,
      scale: onClick ? 1.01 : 1, // hover 효과 최소화
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.99,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  }

  const loadingVariants = {
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const WidgetContent = () => (
    <>
      {/* Header */}
      {(title || subtitle || icon || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0 text-neutral-600 dark:text-neutral-400">
                {icon}
              </div>
            )}
            {(title || subtitle) && (
              <div>
                {title && (
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <LoadingSkeleton size={size} />
        ) : error ? (
          <ErrorState />
        ) : (
          children
        )}
      </div>

      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-br from-white/5 to-transparent dark:from-white/2 pointer-events-none" />
      
      {/* Border highlight */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/10 pointer-events-none" 
           style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'subtract' }} />
    </>
  )

  if (!animate) {
    return (
      <div className={finalClassName} onClick={onClick}>
        <WidgetContent />
      </div>
    )
  }

  return (
    <motion.div
      className={finalClassName}
      variants={widgetVariants}
      initial="hidden"
      animate={loading ? "loading" : "visible"}
      whileHover="hover" 
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
      layout={false} // layout 자동 애니메이션 비활성화로 layout shift 방지
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            variants={loadingVariants}
            animate="pulse"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          />
        )}
      </AnimatePresence>
      
      <WidgetContent />
    </motion.div>
  )
}

// Loading Skeleton Component - Fixed size to prevent layout shift
function LoadingSkeleton({ size }: { size: GlassSize }) {
  const skeletonConfigs = {
    sm: { 
      containerHeight: 'min-h-[80px]',
      lines: 2, 
      lineHeight: 'h-3',
      spacing: 'space-y-2'
    },
    md: { 
      containerHeight: 'min-h-[120px]',
      lines: 3, 
      lineHeight: 'h-4',
      spacing: 'space-y-3'
    },
    lg: { 
      containerHeight: 'min-h-[160px]',
      lines: 4, 
      lineHeight: 'h-5',
      spacing: 'space-y-4'
    },
    xl: { 
      containerHeight: 'min-h-[200px]',
      lines: 5, 
      lineHeight: 'h-6',
      spacing: 'space-y-5'
    }
  }
  
  const config = skeletonConfigs[size]
  
  return (
    <div className={cn('flex flex-col justify-center', config.containerHeight)}>
      <div className={cn('animate-pulse', config.spacing)}>
        {Array.from({ length: config.lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 rounded-md',
              config.lineHeight,
              index === config.lines - 1 && 'w-3/4' // 마지막 줄은 짧게
            )}
          />
        ))}
      </div>
    </div>
  )
}

// Error State Component  
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm text-red-600 dark:text-red-400">데이터를 불러올 수 없습니다</p>
    </div>
  )
}

// 프리셋 위젯들
export function AmbientGlassWidget(props: Omit<GlassWidgetProps, 'opacity'>) {
  return <GlassWidget {...props} opacity="ambient" />
}

export function FocusGlassWidget(props: Omit<GlassWidgetProps, 'opacity'>) {
  return <GlassWidget {...props} opacity="focus" />
}

export function CriticalGlassWidget(props: Omit<GlassWidgetProps, 'opacity'>) {
  return <GlassWidget {...props} opacity="critical" />
}

export function SolidWidget(props: Omit<GlassWidgetProps, 'opacity'>) {
  return <GlassWidget {...props} opacity="solid" />
}

export default GlassWidget