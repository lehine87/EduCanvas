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

interface StudentOverviewWidgetProps {
  stats: DashboardStats | null
}

export default function StudentOverviewWidget({ stats }: StudentOverviewWidgetProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats?.active_students || 0}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">활동중</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.new_registrations_this_month || 0}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">신규</div>
        </div>
      </div>
      <div className="h-16 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg flex items-center justify-center">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">학생 현황 차트</div>
      </div>
    </div>
  )
}