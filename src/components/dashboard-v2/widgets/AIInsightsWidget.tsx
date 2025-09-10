'use client'

import React from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function AIInsightsWidget() {
  const insights = [
    "수학 클래스 출석률이 10% 증가했습니다",
    "3명의 학생이 레벨업 대상입니다", 
    "김민수 학생의 학부모 상담이 필요합니다"
  ]
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <SparklesIcon className="w-5 h-5 text-purple-500" />
        <span className="font-medium text-purple-600 dark:text-purple-400">AI 인사이트</span>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start space-x-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}