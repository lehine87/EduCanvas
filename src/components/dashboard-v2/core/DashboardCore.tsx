'use client'

import React, { Suspense } from 'react'
import { AttendanceRealtimeWidget } from '../widgets/attendance/AttendanceRealtimeWidget'

// 대시보드 핵심 컨텐츠 컴포넌트 (순환 참조 해결)
const DashboardCore = React.memo(() => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        EduCanvas 대시보드
      </h1>
      
      {/* 핵심 통계 카드들 - 즉시 로드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">활성 학생</h2>
          <div className="text-3xl font-bold text-blue-600">24</div>
        </div>
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">오늘 수업</h2>
          <div className="text-3xl font-bold text-green-600">8</div>
        </div>
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">이번 달 수익</h2>
          <div className="text-3xl font-bold text-purple-600">₩2,400,000</div>
        </div>
      </div>

      {/* 고급 위젯들 - Lazy Loading */}
      <Suspense fallback={<div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>}>
        <AttendanceRealtimeWidget />
      </Suspense>
    </div>
  )
})

DashboardCore.displayName = 'DashboardCore'

export default DashboardCore