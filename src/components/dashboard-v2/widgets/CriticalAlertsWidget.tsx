'use client'

import React from 'react'
import { motion } from 'framer-motion'

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

interface CriticalAlertsWidgetProps {
  stats: DashboardStats | null
}

export default function CriticalAlertsWidget({ stats }: CriticalAlertsWidgetProps) {
  const alerts = stats?.urgent_actions || 0
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {alerts}
        </div>
        <motion.div
          animate={{ 
            scale: alerts > 0 ? [1, 1.1, 1] : 1,
            opacity: alerts > 0 ? [1, 0.7, 1] : 1
          }}
          transition={{ 
            duration: 2, 
            repeat: alerts > 0 ? Infinity : 0 
          }}
          className="w-3 h-3 bg-red-500 rounded-full"
        />
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">미납금</span>
          <span className="font-medium">{stats?.unpaid_students || 0}명</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">장기결석</span>
          <span className="font-medium">2명</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">상담요청</span>
          <span className="font-medium">3건</span>
        </div>
      </div>
    </div>
  )
}