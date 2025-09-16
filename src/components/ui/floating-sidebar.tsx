'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface FloatingSidebarProps {
  children: React.ReactNode
  className?: string
  width?: 'sm' | 'md' | 'lg' | 'xl' // w-80, w-96, w-[28rem], w-[32rem]
  blur?: 'sm' | 'md' | 'lg' // backdrop-blur 강도
  transparency?: number // 10-95 (bg-white/{transparency})
  floating?: boolean // 플로팅 효과 on/off
}

const widthClasses = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[28rem]',
  xl: 'w-[32rem]'
}

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg'
}

/**
 * FloatingSidebar 컴포넌트
 *
 * Glassmorphism 효과를 적용한 플로팅 사이드바
 * 메인 영역 위에 떠있는 듯한 시각적 효과 제공
 *
 * @example
 * ```tsx
 * <FloatingSidebar width="md" blur="md">
 *   <YourSidebarContent />
 * </FloatingSidebar>
 * ```
 */
export function FloatingSidebar({
  children,
  className,
  width = 'md',
  blur = 'md',
  transparency = 80,
  floating = true
}: FloatingSidebarProps) {
  const transparencyClass = `bg-white/${transparency} dark:bg-neutral-950/${transparency}`

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        // 기본 크기
        widthClasses[width],
        'flex-shrink-0 h-full',

        // Glassmorphism 효과
        blurClasses[blur],
        transparencyClass,
        'border border-white/20 dark:border-neutral-700/30',

        // 플로팅 효과 (선택적)
        floating && [
          'rounded-2xl',
          'shadow-2xl dark:shadow-none',
          'overflow-hidden'
        ],

        // 내부 스크롤
        'flex flex-col',

        className
      )}
    >
      {/* 글래스 효과 강화를 위한 오버레이 (선택적) */}
      {floating && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}

      {/* 콘텐츠 영역 */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </motion.aside>
  )
}

/**
 * FloatingSidebarHeader 컴포넌트
 *
 * FloatingSidebar 내부 헤더 영역
 */
export function FloatingSidebarHeader({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'flex-shrink-0',
      'px-6 py-4',
      'border-b border-white/10 dark:border-neutral-800/50',
      'bg-gradient-to-b from-white/10 to-transparent dark:from-black/10',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * FloatingSidebarContent 컴포넌트
 *
 * FloatingSidebar 내부 콘텐츠 영역
 */
export function FloatingSidebarContent({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'flex-1 overflow-y-auto no-scrollbar',
      'px-4',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * FloatingSidebarFooter 컴포넌트
 *
 * FloatingSidebar 내부 푸터 영역
 */
export function FloatingSidebarFooter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'flex-shrink-0',
      'px-6 py-4',
      'border-t border-white/10 dark:border-neutral-800/50',
      'bg-gradient-to-t from-white/10 to-transparent dark:from-black/10',
      className
    )}>
      {children}
    </div>
  )
}