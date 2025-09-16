'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, Clock, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { StudentAttendanceCardProps, AttendanceStatus } from '@/types/student-attendance.types'

export function StudentAttendanceCard({ student, onStatusChange }: StudentAttendanceCardProps) {
  const getStatusColor = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present': return 'success'
      case 'absent': return 'destructive'
      case 'late': return 'warning'
      case 'early_leave': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusText = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present': return '출석'
      case 'absent': return '결석'
      case 'late': return '지각'
      case 'early_leave': return '조퇴'
      default: return '미체크'
    }
  }

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* 학생 정보 */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={student.profile_image || undefined} />
              <AvatarFallback>
                {student.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{student.name}</h3>
              <p className="text-sm text-muted-foreground">
                {student.student_number} • {student.grade_level || '학년 미정'}
              </p>
              {student.attendance_reason && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  사유: {student.attendance_reason}
                </p>
              )}
            </div>
          </div>

          {/* 현재 상태 배지 */}
          <Badge variant={getStatusColor(student.attendance_status)} className="shrink-0">
            {getStatusText(student.attendance_status)}
          </Badge>
        </div>

        {/* 출석 버튼들 */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <Button
            size="sm"
            variant={student.attendance_status === 'present' ? 'default' : 'outline'}
            onClick={() => onStatusChange('present')}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            출석
          </Button>
          <Button
            size="sm"
            variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
            onClick={() => onStatusChange('absent')}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            결석
          </Button>
          <Button
            size="sm"
            variant={student.attendance_status === 'late' ? 'secondary' : 'outline'}
            onClick={() => onStatusChange('late')}
            className="text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            지각
          </Button>
          <Button
            size="sm"
            variant={student.attendance_status === 'early_leave' ? 'secondary' : 'outline'}
            onClick={() => onStatusChange('early_leave')}
            className="text-xs"
          >
            <LogOut className="h-3 w-3 mr-1" />
            조퇴
          </Button>
        </div>

        {/* 마지막 체크 시간 */}
        {student.attendance_checked_at && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {format(new Date(student.attendance_checked_at), "HH:mm", { locale: ko })} 체크됨
          </p>
        )}
      </CardContent>
    </Card>
  )
}