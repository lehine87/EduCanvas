'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StudentInfoSkeletonProps {
  className?: string
  animate?: boolean
}

/**
 * 학생 기본정보 스켈레톤 컴포넌트
 * 선택된 학생 정보 로딩 중 표시
 */
export function StudentInfoSkeleton({ className, animate = true }: StudentInfoSkeletonProps) {
  const SkeletonBar = ({ width, height = "h-3", className: barClassName }: { 
    width: string
    height?: string 
    className?: string 
  }) => (
    <div className={cn(
      "bg-neutral-200 dark:bg-neutral-700 rounded",
      height,
      width,
      animate && "animate-pulse",
      barClassName
    )} />
  )

  const SkeletonCircle = ({ size = "h-12 w-12" }: { size?: string }) => (
    <div className={cn(
      "bg-neutral-200 dark:bg-neutral-700 rounded-full",
      size,
      animate && "animate-pulse"
    )} />
  )

  const content = (
    <Card className={cn(
      "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-800/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <SkeletonBar width="w-20" height="h-4" />
          <SkeletonBar width="w-12" height="h-5" className="rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* 아바타 + 이름 영역 */}
        <div className="flex items-center gap-3 mb-3">
          <SkeletonCircle />
          <div className="space-y-2">
            <SkeletonBar width="w-24" height="h-4" />
            <SkeletonBar width="w-32" height="h-3" />
          </div>
        </div>
        
        {/* 연락처 정보 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded" />
            <SkeletonBar width="w-28" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded" />
            <SkeletonBar width="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded" />
            <SkeletonBar width="w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded" />
            <SkeletonBar width="w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!animate) {
    return content
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </motion.div>
  )
}

/**
 * 검색 결과 리스트 아이템 스켈레톤
 */
export function StudentListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-white/50 dark:bg-neutral-900/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full w-12 animate-pulse" />
          </div>
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/**
 * 검색 결과 없음 상태
 */
export function SearchEmptyState() {
  return (
    <div className="p-6 text-center">
      <div className="h-12 w-12 mx-auto mb-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mx-auto mb-1 animate-pulse" />
      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-40 mx-auto animate-pulse" />
    </div>
  )
}