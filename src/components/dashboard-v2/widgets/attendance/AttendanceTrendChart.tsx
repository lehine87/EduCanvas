'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/lib/utils'
import type { AttendanceTrend } from '@/types/attendance-widget'

export interface AttendanceTrendChartProps {
  data: AttendanceTrend[]
  height?: number
  showGrid?: boolean
  animate?: boolean
  showAverage?: boolean
  className?: string
}

export function AttendanceTrendChart({
  data,
  height = 200,
  showGrid = true,
  animate = true,
  showAverage = true,
  className
}: AttendanceTrendChartProps) {
  const isDark = useDarkMode()

  // 차트 데이터 변환 및 평균 계산
  const { chartData, averageRate } = useMemo(() => {
    const formattedData = data.map((item) => ({
      ...item,
      formattedTime: formatTimeLabel(item.time),
      attendanceRateSmooth: item.attendanceRate, // 부드러운 라인을 위한 데이터
    }))

    const avg = data.length > 0 
      ? data.reduce((sum, item) => sum + item.attendanceRate, 0) / data.length 
      : 0

    return {
      chartData: formattedData,
      averageRate: Math.round(avg * 10) / 10
    }
  }, [data])

  // 다크모드 색상 설정
  const colors = {
    primary: '#10b981', // success-500
    secondary: '#3b82f6', // blue-500
    grid: isDark ? '#374151' : '#f3f4f6', // neutral-700 : neutral-100
    text: isDark ? '#d1d5db' : '#6b7280', // neutral-300 : neutral-500
    background: isDark ? '#1f2937' : '#ffffff', // neutral-800 : white
    average: '#f59e0b' // amber-500
  }

  // 시간 라벨 포맷 함수
  function formatTimeLabel(time: string): string {
    const date = new Date(time)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3"
      >
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {label}
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-success-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              출석률: <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {data.attendanceRate}%
              </span>
            </span>
          </div>
          {data.totalStudents && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              총 {data.totalStudents}명 중 {Math.round(data.totalStudents * data.attendanceRate / 100)}명 출석
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // 애니메이션 변형
  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-3 text-center">
        <div className="text-neutral-400 dark:text-neutral-600">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">
            트렌드 데이터가 없습니다
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            시간이 지나면 출석률 변화 추이를 확인할 수 있습니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      variants={animate ? chartVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
    >
      {/* 차트 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-success-500" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              출석률 추이
            </span>
          </div>
          {showAverage && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                평균: {averageRate}%
              </span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          최근 {data.length}개 시간대
        </div>
      </div>

      {/* 차트 컨테이너 */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            {/* 그리드 */}
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.grid}
                strokeOpacity={0.3}
                horizontal={true}
                vertical={false}
              />
            )}
            
            {/* X축 */}
            <XAxis
              dataKey="formattedTime"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: colors.text 
              }}
              interval="preserveStartEnd"
            />
            
            {/* Y축 */}
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: colors.text 
              }}
              tickFormatter={(value) => `${value}%`}
            />
            
            {/* 평균 참조선 */}
            {showAverage && (
              <ReferenceLine
                y={averageRate}
                stroke={colors.average}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
              />
            )}
            
            {/* 영역 차트 (배경) */}
            <Area
              type="monotone"
              dataKey="attendanceRate"
              fill={colors.primary}
              fillOpacity={0.1}
              stroke="none"
            />
            
            {/* 메인 라인 */}
            <Line
              type="monotone"
              dataKey="attendanceRate"
              stroke={colors.primary}
              strokeWidth={3}
              dot={{ 
                fill: colors.primary, 
                strokeWidth: 2, 
                stroke: colors.background,
                r: 4
              }}
              activeDot={{
                r: 6,
                fill: colors.primary,
                stroke: colors.background,
                strokeWidth: 2
              }}
              animationDuration={animate ? 1000 : 0}
              animationEasing="ease-out"
            />
            
            {/* 커스텀 툴팁 */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: colors.primary,
                strokeWidth: 1,
                strokeDasharray: '5 5'
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 인사이트 요약 */}
      <AttendanceInsights 
        data={data} 
        averageRate={averageRate}
        className="mt-4"
      />
    </motion.div>
  )
}

// 출석 인사이트 컴포넌트
interface AttendanceInsightsProps {
  data: AttendanceTrend[]
  averageRate: number
  className?: string
}

function AttendanceInsights({ 
  data, 
  averageRate, 
  className 
}: AttendanceInsightsProps) {
  const insights = useMemo(() => {
    if (data.length < 2) return []

    const insights: string[] = []
    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    const trend = latest.attendanceRate - previous.attendanceRate

    // 트렌드 분석
    if (Math.abs(trend) > 5) {
      if (trend > 0) {
        insights.push(`출석률이 ${trend.toFixed(1)}% 상승했습니다`)
      } else {
        insights.push(`출석률이 ${Math.abs(trend).toFixed(1)}% 하락했습니다`)
      }
    }

    // 평균 대비 분석
    if (latest.attendanceRate > averageRate + 5) {
      insights.push('평균보다 높은 출석률을 보이고 있습니다')
    } else if (latest.attendanceRate < averageRate - 5) {
      insights.push('평균보다 낮은 출석률입니다')
    }

    return insights.slice(0, 2) // 최대 2개의 인사이트만 표시
  }, [data, averageRate])

  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn("space-y-2", className)}
    >
      {insights.map((insight, index) => (
        <div
          key={index}
          className="flex items-start space-x-2 text-sm text-neutral-600 dark:text-neutral-400"
        >
          <div className="w-1 h-1 rounded-full bg-success-500 mt-2 flex-shrink-0" />
          <span>{insight}</span>
        </div>
      ))}
    </motion.div>
  )
}

export default React.memo(AttendanceTrendChart)