'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { ClassTimeCard } from './ClassTimeCard'
import { useTimeFilteredClasses } from '@/hooks/queries/useAttendance'
import type { AttendanceTimeSidebarProps } from '@/types/student-attendance.types'

export function AttendanceTimeSidebar({
  selectedDate,
  selectedClassId,
  onDateChange,
  onClassSelect
}: AttendanceTimeSidebarProps) {
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current')
  const { data: timeFilteredClasses, isLoading } = useTimeFilteredClasses(selectedDate)

  const currentClasses = timeFilteredClasses?.current || []
  const allClasses = timeFilteredClasses?.all || []
  const displayClasses = viewMode === 'current' ? currentClasses : allClasses

  return (
    <div className="w-80 border-r border-border bg-background p-6">
      {/* 날짜 선택 */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">출석 체크 날짜</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 시간대 필터 토글 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">수업 목록</h3>
          <Badge variant="outline" className="text-xs">
            {currentClasses.length}/{allClasses.length}
          </Badge>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'current' ? 'default' : 'ghost'}
            onClick={() => setViewMode('current')}
            className="flex-1 text-xs"
          >
            현재 시간대
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            onClick={() => setViewMode('all')}
            className="flex-1 text-xs"
          >
            전체
          </Button>
        </div>
      </div>

      {/* 클래스 목록 */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : displayClasses.length > 0 ? (
            displayClasses.map((cls) => (
              <ClassTimeCard
                key={cls.id}
                classData={cls}
                isActive={cls.id === selectedClassId}
                onClick={() => onClassSelect(cls.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {viewMode === 'current'
                  ? '현재 시간대 수업이 없습니다'
                  : '예정된 수업이 없습니다'
                }
              </p>
              {viewMode === 'current' && allClasses.length > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setViewMode('all')}
                  className="mt-2"
                >
                  전체 수업 보기
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 현재 시간 표시 */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">현재 시간</p>
          <p className="text-sm font-medium">
            {format(new Date(), 'HH:mm', { locale: ko })}
          </p>
        </div>
      </div>
    </div>
  )
}