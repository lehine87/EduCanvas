'use client'

import React from 'react'

interface DashboardStats {
  total_students: number
  active_students: number
  inactive_students: number
  graduated_students: number
  withdrawn_students: number
  suspended_students: number
  urgent_actions: number
  today_attendance: number
  unpaid_students: number
  consultation_scheduled: number
  new_registrations_this_month: number
  recent_activities: Array<{
    id: string
    student_name: string
    action: string
    timestamp: string
  }>
}

interface RevenueAnalyticsWidgetProps {
  stats: DashboardStats | null
}

export default function RevenueAnalyticsWidget({ stats }: RevenueAnalyticsWidgetProps) {
  const revenue = stats ? stats.active_students * 150000 : 0 // 평균 수강료 가정
  const growth = '+12.5%'
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          ₩{revenue.toLocaleString()}
        </div>
        <div className="text-sm text-emerald-600 dark:text-emerald-400">
          {growth} vs 지난달
        </div>
      </div>
      <div className="h-20 bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-lg flex items-end justify-center">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">매출 차트 영역</div>
      </div>
    </div>
  )
}