'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon,
  ClockIcon,
  PhoneIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function QuickActionsWidget() {
  const actions = [
    { label: '신규 등록', icon: UserGroupIcon, color: 'text-blue-500' },
    { label: '출석 체크', icon: ClockIcon, color: 'text-green-500' },
    { label: '상담 예약', icon: PhoneIcon, color: 'text-purple-500' },
    { label: '수강료 관리', icon: CurrencyDollarIcon, color: 'text-yellow-500' }
  ]
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg bg-white/50 dark:bg-black/50 border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-black/70 transition-colors"
          >
            <Icon className={`w-5 h-5 ${action.color} mb-1 mx-auto`} />
            <div className="text-xs font-medium text-center">{action.label}</div>
          </motion.button>
        )
      })}
    </div>
  )
}