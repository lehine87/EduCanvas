'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttendanceClassCardProps } from '@/types/student-attendance.types'

export function AttendanceClassCard({ classData, onClick }: AttendanceClassCardProps) {
  const getCardVariant = () => {
    if (!classData.attendance_status) return 'default' // 미시작 (흰색)
    if (classData.attendance_status.absent_count > 0) return 'destructive' // 결석자 있음 (빨간색)
    if (classData.attendance_status.is_completed) return 'success' // 완료 (초록색)
    return 'default'
  }

  const getStatusIcon = () => {
    const variant = getCardVariant()
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'destructive':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    if (!classData.attendance_status) return '출석체크 대기'
    if (classData.attendance_status.is_completed && classData.attendance_status.absent_count === 0) {
      return '출석체크 완료'
    }
    if (classData.attendance_status.absent_count > 0) {
      return `결석자 ${classData.attendance_status.absent_count}명`
    }
    return '출석체크 진행중'
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
        // 다크모드 고려 배경색
        getCardVariant() === 'success' &&
          "bg-success/10 border-success/20 hover:bg-success/15 dark:bg-success/5 dark:border-success/10",
        getCardVariant() === 'destructive' &&
          "bg-destructive/10 border-destructive/20 hover:bg-destructive/15 dark:bg-destructive/5 dark:border-destructive/10"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {classData.start_time}
            </Badge>
            {getStatusIcon()}
          </div>
          <Button variant="ghost" size="sm" className="h-auto p-1">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h3 className="font-medium text-sm mb-1 line-clamp-1">
          {classData.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {classData.instructor_name} • {classData.room}
        </p>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">총인원</span>
              <span className="font-medium">{classData.total_students}명</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-success">출석</span>
              <span className="font-medium text-success">
                {classData.attendance_status?.present_count || 0}명
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-destructive">결석</span>
              <span className="font-medium text-destructive">
                {classData.attendance_status?.absent_count || 0}명
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-warning">지각</span>
              <span className="font-medium text-warning">
                {classData.attendance_status?.late_count || 0}명
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}