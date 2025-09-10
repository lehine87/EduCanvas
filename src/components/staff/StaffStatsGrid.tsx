'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  UsersIcon, 
  AcademicCapIcon, 
  ClockIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { InstructorDashboardStats } from '@/types/staff.types'

interface InstructorStatsGridProps {
  stats?: InstructorDashboardStats | null
  isLoading?: boolean
  className?: string
}

export default function InstructorStatsGrid({ 
  stats, 
  isLoading = false,
  className 
}: InstructorStatsGridProps) {
  
  const statsCards = [
    {
      title: '전체 강사',
      value: stats?.total || 0,
      icon: UsersIcon,
      description: '등록된 전체 강사 수',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: '활동 중',
      value: stats?.active || 0,
      icon: AcademicCapIcon,
      description: '현재 수업 중인 강사',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: '오늘 수업',
      value: stats?.todayClasses || 0,
      icon: CalendarDaysIcon,
      description: '오늘 진행되는 총 수업',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    {
      title: '월 평균 시간',
      value: `${stats?.monthlyHours || 0}h`,
      icon: ClockIcon,
      description: '강사당 월평균 수업시간',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    }
  ]

  // 고용 형태별 분포
  const employmentDistribution = [
    {
      label: '정규직',
      value: stats?.byEmploymentType?.fullTime || 0,
      percentage: stats?.total && stats?.byEmploymentType?.fullTime ? 
        Math.round((stats.byEmploymentType.fullTime / stats.total) * 100) : 0
    },
    {
      label: '계약직',
      value: stats?.byEmploymentType?.contract || 0,
      percentage: stats?.total && stats?.byEmploymentType?.contract ? 
        Math.round((stats.byEmploymentType.contract / stats.total) * 100) : 0
    },
    {
      label: '파트타임',
      value: stats?.byEmploymentType?.partTime || 0,
      percentage: stats?.total && stats?.byEmploymentType?.partTime ? 
        Math.round((stats.byEmploymentType.partTime / stats.total) * 100) : 0
    }
  ]

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 주요 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 고용 형태별 분포 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            고용 형태별 분포
          </CardTitle>
          <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employmentDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.value}명
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 부서별 분포 */}
      {stats?.byDepartment && Object.keys(stats.byDepartment).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              부서별 강사 현황
            </CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.byDepartment).map(([dept, count]) => (
                <div key={dept} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground">{dept}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}