'use client'

import { Button } from '@/components/ui/button'
import { CalendarX } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface EmptyAttendanceDayProps {
  selectedDate: Date
}

export function EmptyAttendanceDay({ selectedDate }: EmptyAttendanceDayProps) {
  return (
    <div className="text-center py-12">
      <CalendarX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">출석체크할 수업이 없습니다</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}에 예정된 수업이 없습니다
      </p>
      <Button variant="outline" onClick={() => window.location.href = '/main/classes'}>
        수업 일정 관리
      </Button>
    </div>
  )
}