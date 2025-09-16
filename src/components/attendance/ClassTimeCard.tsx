'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClassSchedule } from '@/types/student-attendance.types'

interface ClassTimeCardProps {
  classData: ClassSchedule
  isActive: boolean
  onClick: () => void
}

export function ClassTimeCard({ classData, isActive, onClick }: ClassTimeCardProps) {
  const getStatusColor = () => {
    if (!classData.attendance_status) return 'default'
    if (classData.attendance_status.absent_count > 0) return 'destructive'
    if (classData.attendance_status.is_completed) return 'success'
    return 'default'
  }

  const isCurrentTime = () => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [startHour, startMin] = classData.start_time.split(':').map(Number)
    const classTime = startHour * 60 + startMin
    return Math.abs(classTime - currentMinutes) <= 30
  }

  const getStatusVariant = (color: string) => {
    switch (color) {
      case 'success': return 'default'
      case 'destructive': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-sm",
        isActive && "ring-2 ring-primary",
        isCurrentTime() && "border-primary/50 bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(getStatusColor())} className="text-xs">
              {classData.start_time}
            </Badge>
            {isCurrentTime() && (
              <Badge variant="outline" className="text-xs animate-pulse">
                진행중
              </Badge>
            )}
          </div>
        </div>

        <h4 className="font-medium text-sm mb-1">{classData.name}</h4>
        <p className="text-xs text-muted-foreground mb-2">
          {classData.instructor_name} • {classData.room}
        </p>

        {classData.attendance_status && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              총 {classData.attendance_status.total_students}명
            </span>
            {classData.attendance_status.present_count > 0 && (
              <span className="text-success">
                출석 {classData.attendance_status.present_count}
              </span>
            )}
            {classData.attendance_status.absent_count > 0 && (
              <span className="text-destructive">
                결석 {classData.attendance_status.absent_count}
              </span>
            )}
            {classData.attendance_status.late_count > 0 && (
              <span className="text-warning">
                지각 {classData.attendance_status.late_count}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}