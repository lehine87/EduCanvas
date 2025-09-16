'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AttendanceComparisonCardProps, DailyAttendanceData } from '@/types/student-attendance.types'

export function AttendanceComparisonCard({
  date,
  title,
  data,
  variant
}: AttendanceComparisonCardProps) {
  const attendanceRate = data?.attendance_rate || 0

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-success'
    if (rate >= 80) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-colors",
        variant === 'primary'
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3
            className={cn(
              "font-medium",
              variant === 'primary' ? "text-primary" : "text-muted-foreground"
            )}
          >
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(date, "M월 d일 (E)", { locale: ko })}
          </p>
        </div>
        <div className="text-right">
          <div className={cn("text-2xl font-bold", getRateColor(attendanceRate))}>
            {attendanceRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {data ? `${data.present + data.late + data.excused}/${data.total}명` : '데이터 없음'}
          </p>
        </div>
      </div>

      {data && data.total > 0 && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-success h-2 rounded-full transition-all"
              style={{ width: `${(data.present / data.total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>출석 {data.present}</span>
            <span>지각 {data.late}</span>
            <span>결석 {data.absent}</span>
          </div>
        </div>
      )}

      {(!data || data.total === 0) && (
        <div className="text-center text-sm text-muted-foreground py-2">
          해당 날짜에 수업이 없었습니다
        </div>
      )}
    </div>
  )
}