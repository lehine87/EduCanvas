'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ClassAttendance } from '@/types/attendance-widget'

export interface ClassAttendanceTableProps {
  classes: ClassAttendance[]
  maxHeight?: number
  showStatus?: boolean
  onClassClick?: (classId: string) => void
  className?: string
}

type SortField = 'scheduledTime' | 'attendanceRate' | 'totalStudents' | 'className'
type SortDirection = 'asc' | 'desc'

export function ClassAttendanceTable({
  classes,
  maxHeight = 400,
  showStatus = true,
  onClassClick,
  className
}: ClassAttendanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('scheduledTime')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // 정렬된 클래스 데이터
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'scheduledTime':
          aValue = new Date(a.scheduledTime).getTime()
          bValue = new Date(b.scheduledTime).getTime()
          break
        case 'attendanceRate':
          aValue = a.attendanceRate
          bValue = b.attendanceRate
          break
        case 'totalStudents':
          aValue = a.totalStudents
          bValue = b.totalStudents
          break
        case 'className':
          aValue = a.className.toLowerCase()
          bValue = b.className.toLowerCase()
          break
        default:
          aValue = 0
          bValue = 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [classes, sortField, sortDirection])

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 테이블 헤더 컴포넌트
  const TableHeader = () => (
    <div className="flex items-center py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-medium text-neutral-600 dark:text-neutral-400">
      <SortButton
        field="className"
        currentField={sortField}
        direction={sortDirection}
        onClick={() => handleSort('className')}
        className="flex-1 min-w-0"
      >
        클래스명
      </SortButton>
      
      <SortButton
        field="scheduledTime"
        currentField={sortField}
        direction={sortDirection}
        onClick={() => handleSort('scheduledTime')}
        className="w-16 text-center"
      >
        시간
      </SortButton>
      
      <SortButton
        field="totalStudents"
        currentField={sortField}
        direction={sortDirection}
        onClick={() => handleSort('totalStudents')}
        className="w-16 text-center"
      >
        인원
      </SortButton>
      
      <SortButton
        field="attendanceRate"
        currentField={sortField}
        direction={sortDirection}
        onClick={() => handleSort('attendanceRate')}
        className="w-16 text-center"
      >
        출석률
      </SortButton>
      
      {showStatus && (
        <div className="w-16 text-center">
          상태
        </div>
      )}
    </div>
  )

  // 가상화된 행 컴포넌트
  const Row = ({ index, style }: ListChildComponentProps) => {
    const classData = sortedClasses[index]
    
    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className={cn(
          "flex items-center py-3 px-4 border-b border-neutral-100 dark:border-neutral-800",
          "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
          onClassClick && "cursor-pointer"
        )}
        onClick={() => onClassClick?.(classData.classId)}
      >
        {/* 클래스명 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {classData.className}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            ID: {classData.classId.slice(0, 8)}
          </p>
        </div>
        
        {/* 시간 */}
        <div className="w-16 text-center text-sm text-neutral-700 dark:text-neutral-300">
          {new Date(classData.scheduledTime).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        
        {/* 인원 */}
        <div className="w-16 text-center">
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {classData.presentCount}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            /{classData.totalStudents}
          </div>
        </div>
        
        {/* 출석률 */}
        <div className="w-16 text-center">
          <AttendanceRateBadge rate={classData.attendanceRate} />
        </div>
        
        {/* 상태 */}
        {showStatus && (
          <div className="w-16 text-center">
            <ClassStatusBadge status={classData.status} />
          </div>
        )}
      </motion.div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <div className="text-neutral-400 dark:text-neutral-600">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">
            진행 중인 클래스가 없습니다
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            오늘 예정된 수업이 없거나 모든 수업이 완료되었습니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden", className)}>
      <TableHeader />
      
      {/* 가상화된 리스트 */}
      <div style={{ height: maxHeight }}>
        <List
          height={maxHeight}
          itemCount={sortedClasses.length}
          itemSize={64} // 각 행의 높이
          overscanCount={5} // 성능 최적화를 위한 오버스캔
        >
          {Row}
        </List>
      </div>

      {/* 테이블 푸터 */}
      <div className="flex items-center justify-between py-2 px-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400">
        <span>총 {classes.length}개 클래스</span>
        <span>
          평균 출석률: {Math.round(
            classes.reduce((sum, cls) => sum + cls.attendanceRate, 0) / classes.length
          )}%
        </span>
      </div>
    </div>
  )
}

// 정렬 버튼 컴포넌트
interface SortButtonProps {
  field: SortField
  currentField: SortField
  direction: SortDirection
  onClick: () => void
  children: React.ReactNode
  className?: string
}

function SortButton({
  field,
  currentField,
  direction,
  onClick,
  children,
  className
}: SortButtonProps) {
  const isActive = currentField === field
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto p-1 font-medium justify-center",
        "hover:bg-neutral-200 dark:hover:bg-neutral-700",
        isActive && "text-neutral-900 dark:text-neutral-100",
        className
      )}
    >
      <span className="mr-1">{children}</span>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            {direction === 'asc' ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}

// 출석률 배지 컴포넌트
function AttendanceRateBadge({ rate }: { rate: number }) {
  const getVariant = () => {
    if (rate >= 90) return 'default' // 우수 (success 색상)
    if (rate >= 75) return 'secondary' // 보통 (warning 색상)
    return 'destructive' // 주의 (destructive 색상)
  }

  return (
    <Badge 
      variant={getVariant()}
      className={cn(
        "text-xs font-medium min-w-[2.5rem] justify-center",
        rate >= 90 && "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 border-success-200 dark:border-success-800",
        rate >= 75 && rate < 90 && "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 border-warning-200 dark:border-warning-800"
      )}
    >
      {rate}%
    </Badge>
  )
}

// 클래스 상태 배지 컴포넌트
function ClassStatusBadge({ status }: { status: 'ongoing' | 'completed' | 'upcoming' }) {
  const getConfig = () => {
    switch (status) {
      case 'ongoing':
        return {
          variant: 'default' as const,
          text: '진행중',
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        }
      case 'completed':
        return {
          variant: 'secondary' as const,
          text: '완료',
          className: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
        }
      case 'upcoming':
        return {
          variant: 'outline' as const,
          text: '예정',
          className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        }
      default:
        return {
          variant: 'secondary' as const,
          text: '알 수 없음',
          className: ''
        }
    }
  }

  const config = getConfig()
  
  return (
    <Badge 
      variant={config.variant}
      className={cn("text-xs font-medium", config.className)}
    >
      {config.text}
    </Badge>
  )
}

export default React.memo(ClassAttendanceTable)