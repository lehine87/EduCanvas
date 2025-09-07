'use client'

import React, { Suspense, lazy } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

// 업계 표준: 안정된 lazy import 패턴 (순환 참조 방지)
const DashboardCore = lazy(() => import('./core/DashboardCore'))
const UnifiedBackgroundSystem = lazy(() => import('./backgrounds/UnifiedBackgroundSystem'))

// 로딩 스피너 컴포넌트
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-neutral-600 dark:text-neutral-400">대시보드 로딩 중...</p>
    </div>
  </div>
))

// 경량화된 대시보드 스켈레톤
const DashboardSkeleton = React.memo(() => (
  <div className="p-6 space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        ))}
      </div>
    </div>
  </div>
))

// 최적화된 메인 대시보드
const DashboardV2Optimized = React.memo(() => {
  const { profile } = useAuthStore()
  
  // 인증 상태 체크
  if (!profile) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <UnifiedBackgroundSystem config={{ type: 'none' }} />
      </Suspense>
      
      <div className="relative z-10">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardCore />
        </Suspense>
      </div>
    </div>
  )
})

// 순환 참조 제거: DashboardCore는 이제 별도 파일에서 import

DashboardV2Optimized.displayName = 'DashboardV2Optimized'

export default DashboardV2Optimized