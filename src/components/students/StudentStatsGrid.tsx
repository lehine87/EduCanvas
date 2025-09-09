'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import type { Student } from '@/types/student.types'

interface StudentStatsGridProps {
  students: Student[]
  totalStudents: number
  className?: string
}

interface StatCard {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StudentStatsGrid({
  students,
  totalStudents,
  className = ''
}: StudentStatsGridProps) {
  
  // 통계 계산
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length
    const inactiveStudents = students.filter(s => s.status === 'inactive').length
    const graduatedStudents = students.filter(s => s.status === 'graduated').length
    
    // 최근 등록 학생 (30일 이내)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentEnrollments = students.filter(s => 
      s.enrollment_date && new Date(s.enrollment_date) > thirtyDaysAgo
    ).length

    // 학년별 분포
    const gradeDistribution = students.reduce((acc, student) => {
      const grade = student.grade_level || '미상'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topGrade = Object.entries(gradeDistribution)
      .sort(([,a], [,b]) => b - a)[0]

    return {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      graduated: graduatedStudents,
      recentEnrollments,
      topGrade: topGrade ? `${topGrade[0]} (${topGrade[1]}명)` : '데이터 없음',
      gradeDistribution
    }
  }, [students, totalStudents])

  // 통계 카드 데이터
  const statCards: StatCard[] = [
    {
      title: '총 학생 수',
      value: stats.total,
      subtitle: `활성: ${stats.active}명`,
      icon: UserGroupIcon,
      color: 'blue',
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: '재학중',
      value: stats.active,
      subtitle: `전체의 ${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`,
      icon: AcademicCapIcon,
      color: 'green'
    },
    {
      title: '휴학/정지',
      value: stats.inactive,
      subtitle: stats.inactive > 0 ? '관리 필요' : '양호',
      icon: ClockIcon,
      color: stats.inactive > 0 ? 'yellow' : 'green'
    },
    {
      title: '졸업',
      value: stats.graduated,
      subtitle: '완료된 과정',
      icon: AcademicCapIcon,
      color: 'indigo'
    },
    {
      title: '최근 등록',
      value: stats.recentEnrollments,
      subtitle: '30일 이내',
      icon: CalendarDaysIcon,
      color: 'purple',
      trend: {
        value: 25,
        isPositive: true
      }
    },
    {
      title: '최다 학년',
      value: stats.topGrade,
      subtitle: '학년별 분포',
      icon: ArrowTrendingUpIcon,
      color: 'blue'
    }
  ]

  // 색상별 스타일
  const getCardStyles = (color: StatCard['color']) => {
    const styles = {
      blue: {
        icon: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
        value: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-950'
      },
      green: {
        icon: 'text-green-600 bg-green-100 dark:bg-green-900', 
        value: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50 dark:bg-green-950'
      },
      yellow: {
        icon: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
        value: 'text-yellow-700 dark:text-yellow-300', 
        border: 'border-yellow-200 dark:border-yellow-800',
        bg: 'bg-yellow-50 dark:bg-yellow-950'
      },
      red: {
        icon: 'text-red-600 bg-red-100 dark:bg-red-900',
        value: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50 dark:bg-red-950'
      },
      purple: {
        icon: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
        value: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800', 
        bg: 'bg-purple-50 dark:bg-purple-950'
      },
      indigo: {
        icon: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900',
        value: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        bg: 'bg-indigo-50 dark:bg-indigo-950'
      }
    }
    return styles[color]
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}>
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon
        const isAlert = stat.color === 'yellow' || stat.color === 'red'

        return (
          <div
            key={index}
            className={`
              relative overflow-hidden rounded-xl p-3
              backdrop-blur-sm bg-white/30 dark:bg-black/30 
              border border-white/20 dark:border-white/10
              shadow-xl dark:shadow-none
              hover:bg-white/40 dark:hover:bg-black/40
              transition-all duration-200 cursor-pointer
              ${isAlert ? 'ring-1 ring-orange-200 dark:ring-orange-800' : ''}
            `}
          >
            {/* 배경 그라디언트 */}
            <div className={`
              absolute inset-0 opacity-5
              ${stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : ''}
              ${stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' : ''}
              ${stat.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : ''}
              ${stat.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' : ''}
              ${stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : ''}
              ${stat.color === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : ''}
            `} />

            {/* 아이콘 */}
            <div className={`
              inline-flex p-2 rounded-lg mb-2
              ${stat.color === 'blue' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
              ${stat.color === 'green' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : ''}
              ${stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : ''}
              ${stat.color === 'red' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : ''}
              ${stat.color === 'purple' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : ''}
              ${stat.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : ''}
            `}>
              <IconComponent className="h-4 w-4" />
            </div>
            
            {/* 제목 */}
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {stat.title}
            </p>
            
            {/* 값 */}
            <p className={`
              text-lg font-bold mb-1
              ${stat.color === 'blue' ? 'text-blue-700 dark:text-blue-300' : ''}
              ${stat.color === 'green' ? 'text-green-700 dark:text-green-300' : ''}
              ${stat.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' : ''}
              ${stat.color === 'red' ? 'text-red-700 dark:text-red-300' : ''}
              ${stat.color === 'purple' ? 'text-purple-700 dark:text-purple-300' : ''}
              ${stat.color === 'indigo' ? 'text-indigo-700 dark:text-indigo-300' : ''}
            `}>
              {stat.value}
            </p>
            
            {/* 부제목 */}
            {stat.subtitle && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {stat.subtitle}
              </p>
            )}
            
            {/* 트렌드 */}
            {stat.trend && (
              <div className="flex items-center space-x-1">
                <ArrowTrendingUpIcon 
                  className={`h-3 w-3 ${
                    stat.trend.isPositive 
                      ? 'text-green-500' 
                      : 'text-red-500 rotate-180'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium ${
                    stat.trend.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* 주의 필요 항목들 */}
      {(stats.inactive > 0) && (
        <div className="col-span-2 md:col-span-3 lg:col-span-6">
          <div className="
            relative overflow-hidden rounded-xl p-4
            backdrop-blur-sm bg-orange-50/40 dark:bg-orange-950/40
            border border-orange-200/30 dark:border-orange-800/30
            shadow-xl dark:shadow-none
          ">
            {/* 배경 그라디언트 */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            
            <div className="relative flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400">
                <ExclamationTriangleIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                  주의 필요 항목
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.inactive > 0 && (
                    <div className="
                      px-2 py-1 rounded-md text-xs font-medium
                      bg-orange-500/20 text-orange-800 dark:text-orange-200
                      border border-orange-300/30 dark:border-orange-700/30
                    ">
                      휴학생 {stats.inactive}명 관리 필요
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}