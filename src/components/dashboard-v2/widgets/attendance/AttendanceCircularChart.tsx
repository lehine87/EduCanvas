'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export interface AttendanceCircularChartProps {
  attendanceRate: number
  totalStudents: number
  presentStudents: number
  size?: 'small' | 'medium' | 'large'
  showAnimation?: boolean
  onClick?: () => void
  className?: string
}

export function AttendanceCircularChart({
  attendanceRate,
  totalStudents,
  presentStudents,
  size = 'medium',
  showAnimation = true,
  onClick,
  className
}: AttendanceCircularChartProps) {
  
  // 차트 데이터 계산
  const chartData = useMemo(() => {
    const absentStudents = totalStudents - presentStudents
    
    return [
      {
        name: '출석',
        value: presentStudents,
        color: '#10b981', // success-500
        percentage: attendanceRate
      },
      {
        name: '결석',
        value: absentStudents,
        color: '#f3f4f6', // neutral-100 (light) / neutral-700 (dark)
        percentage: 100 - attendanceRate
      }
    ]
  }, [attendanceRate, totalStudents, presentStudents])

  // 크기별 설정
  const sizeConfig = {
    small: {
      containerSize: 'w-24 h-24',
      chartSize: 96,
      innerRadius: 28,
      outerRadius: 40,
      textSize: 'text-lg',
      labelSize: 'text-xs'
    },
    medium: {
      containerSize: 'w-32 h-32',
      chartSize: 128,
      innerRadius: 40,
      outerRadius: 56,
      textSize: 'text-xl',
      labelSize: 'text-sm'
    },
    large: {
      containerSize: 'w-40 h-40',
      chartSize: 160,
      innerRadius: 50,
      outerRadius: 70,
      textSize: 'text-2xl',
      labelSize: 'text-base'
    }
  }

  const config = sizeConfig[size]

  // 색상 선택 함수
  const getSegmentColor = (index: number) => {
    if (index === 0) return '#10b981' // success-500 (출석)
    return 'currentColor' // 다크모드 대응을 위해 currentColor 사용
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "relative flex items-center justify-center",
          config.containerSize,
          onClick && "cursor-pointer"
        )}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.95 } : undefined}
        onClick={onClick}
      >
        {/* 차트 컨테이너 */}
        <div className="absolute inset-0 text-neutral-300 dark:text-neutral-600">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={config.innerRadius}
                outerRadius={config.outerRadius}
                startAngle={90}
                endAngle={450}
                dataKey="value"
                animationBegin={showAnimation ? 0 : undefined}
                animationDuration={showAnimation ? 800 : 0}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getSegmentColor(index)}
                    stroke="none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 중앙 텍스트 */}
        <div className="relative z-10 text-center">
          <motion.div
            key={attendanceRate}
            initial={showAnimation ? { scale: 1.2, opacity: 0 } : undefined}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
              delay: showAnimation ? 0.4 : 0
            }}
            className={cn(
              "font-bold text-neutral-900 dark:text-neutral-100",
              config.textSize
            )}
          >
            {attendanceRate}%
          </motion.div>
          <motion.div
            initial={showAnimation ? { opacity: 0, y: 5 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: showAnimation ? 0.6 : 0,
              duration: 0.3
            }}
            className={cn(
              "font-medium text-neutral-600 dark:text-neutral-400",
              config.labelSize
            )}
          >
            출석률
          </motion.div>
        </div>

        {/* 글로우 효과 (높은 출석률일 때) */}
        {attendanceRate >= 85 && showAnimation && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 0 rgba(16, 185, 129, 0)',
                '0 0 20px rgba(16, 185, 129, 0.3)',
                '0 0 0 rgba(16, 185, 129, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>

      {/* 상세 정보 툴팁 */}
      {size === 'large' && (
        <motion.div
          initial={showAnimation ? { opacity: 0, y: 10 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showAnimation ? 0.8 : 0 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        >
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            <span className="text-success-600 dark:text-success-400 font-medium">
              {presentStudents}명 출석
            </span>
            <span className="mx-1">/</span>
            <span>총 {totalStudents}명</span>
          </div>
        </motion.div>
      )}

      {/* 성능 인디케이터 */}
      <AttendancePerformanceIndicator 
        attendanceRate={attendanceRate}
        className="absolute -top-2 -right-2"
      />
    </div>
  )
}

// 출석률 성능 인디케이터
interface AttendancePerformanceIndicatorProps {
  attendanceRate: number
  className?: string
}

function AttendancePerformanceIndicator({ 
  attendanceRate, 
  className 
}: AttendancePerformanceIndicatorProps) {
  const getIndicatorConfig = () => {
    if (attendanceRate >= 90) {
      return {
        color: 'bg-success-500',
        label: '우수',
        pulseColor: 'bg-success-300'
      }
    } else if (attendanceRate >= 75) {
      return {
        color: 'bg-warning-500',
        label: '보통',
        pulseColor: 'bg-warning-300'
      }
    } else {
      return {
        color: 'bg-destructive-500',
        label: '주의',
        pulseColor: 'bg-destructive-300'
      }
    }
  }

  const config = getIndicatorConfig()

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.6, type: "spring" }}
      className={cn("relative", className)}
      title={`출석률 ${config.label}: ${attendanceRate}%`}
    >
      {/* 펄스 효과 */}
      <div className={cn(
        "absolute inset-0 rounded-full animate-ping opacity-30",
        config.pulseColor
      )} />
      
      {/* 메인 인디케이터 */}
      <div className={cn(
        "relative w-3 h-3 rounded-full",
        config.color
      )} />
    </motion.div>
  )
}

// 메모이제이션된 컴포넌트 내보내기
export default React.memo(AttendanceCircularChart)