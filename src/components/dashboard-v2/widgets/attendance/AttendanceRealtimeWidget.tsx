'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, UserCheck, UserX, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceCircularChart } from './AttendanceCircularChart'
import { ClassAttendanceTable } from './ClassAttendanceTable'
import { AttendanceTrendChart } from './AttendanceTrendChart'
import { useAttendanceData } from '@/hooks/useAttendanceData'
import { cn } from '@/lib/utils'

interface AttendanceRealtimeWidgetProps {
  className?: string
}

export function AttendanceRealtimeWidget({ 
  className 
}: AttendanceRealtimeWidgetProps) {
  const { 
    data: attendanceData, 
    isLoading, 
    error,
    lastUpdated 
  } = useAttendanceData({
    enabled: true,
    refetchInterval: 120000, // 2분 간격 (성능 최적화)
    enableRealtime: false // 개발 중 실시간 기능 비활성화
  })

  if (isLoading) {
    return <AttendanceWidgetSkeleton />
  }

  if (error) {
    return <AttendanceErrorState error={error} />
  }

  if (!attendanceData) {
    return <AttendanceEmptyState />
  }

  const {
    stats,
    classesByTime,
    trends,
    alerts
  } = attendanceData

  return (
    <div className={cn("space-y-4", className)}>
      {/* 메인 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 원형 출석률 차트 */}
        <div className="flex items-center justify-center">
          <AttendanceCircularChart
            attendanceRate={stats.attendanceRate}
            totalStudents={stats.totalStudents}
            presentStudents={stats.presentStudents}
            size="large"
            showAnimation={true}
          />
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="총 학생 수"
            value={stats.totalStudents}
            icon={Users}
            className="bg-neutral-50 dark:bg-neutral-800/50"
          />
          <StatCard
            title="출석"
            value={stats.presentStudents}
            icon={UserCheck}
            className="bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300"
          />
          <StatCard
            title="결석"
            value={stats.absentStudents}
            icon={UserX}
            className="bg-destructive-50 dark:bg-destructive-900/20 text-destructive-700 dark:text-destructive-300"
          />
          <StatCard
            title="지각"
            value={stats.lateStudents}
            icon={Clock}
            className="bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300"
          />
        </div>
      </div>

      {/* 실시간 상태 표시 */}
      <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
          <span>실시간 업데이트</span>
        </div>
        {lastUpdated && (
          <span>
            마지막 업데이트: {new Date(lastUpdated).toLocaleTimeString('ko-KR')}
          </span>
        )}
      </div>

      {/* 알림 표시 */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Badge 
                variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                className="w-full justify-start p-2"
              >
                {alert.message}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* 클래스별 출석 현황 */}
      {classesByTime && classesByTime.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">클래스별 출석 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassAttendanceTable
              classes={classesByTime}
              maxHeight={300}
              showStatus={true}
            />
          </CardContent>
        </Card>
      )}

      {/* 출석 트렌드 차트 */}
      {trends && trends.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">출석률 트렌드</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceTrendChart
              data={trends}
              height={200}
              showGrid={true}
              animate={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 통계 카드 컴포넌트
interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

function StatCard({ title, value, icon: Icon, className }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-3 rounded-lg border transition-colors",
        "border-neutral-200 dark:border-neutral-700",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-70">{title}</p>
          <motion.p 
            key={value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="text-xl font-bold mt-1"
          >
            {value.toLocaleString()}
          </motion.p>
        </div>
        <Icon className="h-5 w-5 opacity-60" />
      </div>
    </motion.div>
  )
}

// 로딩 스켈레톤
function AttendanceWidgetSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

// 에러 상태
function AttendanceErrorState({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-destructive-100 dark:bg-destructive-900/30 flex items-center justify-center">
        <UserX className="w-6 h-6 text-destructive-500" />
      </div>
      <div>
        <p className="font-medium text-destructive-700 dark:text-destructive-300">
          출석 데이터를 불러올 수 없습니다
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {error.message}
        </p>
      </div>
    </div>
  )
}

// 빈 상태
function AttendanceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <Users className="w-6 h-6 text-neutral-500" />
      </div>
      <div>
        <p className="font-medium text-neutral-700 dark:text-neutral-300">
          출석 데이터가 없습니다
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          오늘 수업이 없거나 데이터가 아직 생성되지 않았습니다
        </p>
      </div>
    </div>
  )
}

export default AttendanceRealtimeWidget