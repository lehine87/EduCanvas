'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3 } from 'lucide-react'
import { AttendanceComparisonCard } from './AttendanceComparisonCard'
import { AttendanceClassCard } from './AttendanceClassCard'
import { EmptyAttendanceDay } from './EmptyAttendanceDay'
import { useDailyAttendanceComparison, useTodayClassesWithAttendance } from '@/hooks/queries/useAttendance'
import { subDays } from 'date-fns'

interface AttendanceOverviewProps {
  selectedDate: Date
  onClassSelect: (classId: string) => void
}

export function AttendanceOverview({
  selectedDate,
  onClassSelect
}: AttendanceOverviewProps) {
  const { data: dailyComparison, isLoading: isComparisonLoading } = useDailyAttendanceComparison(selectedDate)
  const { data: todayClasses, isLoading: isClassesLoading } = useTodayClassesWithAttendance(selectedDate)

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* 전일/당일 출석 현황 비교 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            출석 현황 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isComparisonLoading ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <AttendanceComparisonCard
                date={subDays(selectedDate, 1)}
                title="어제"
                data={dailyComparison?.yesterday}
                variant="secondary"
              />
              <AttendanceComparisonCard
                date={selectedDate}
                title="오늘"
                data={dailyComparison?.today}
                variant="primary"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 당일 출석체크 클래스 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">오늘의 출석체크</h2>
          <Badge variant="outline">
            {todayClasses?.length || 0}개 클래스
          </Badge>
        </div>

        {isClassesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : todayClasses && todayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todayClasses.map((classData) => (
              <AttendanceClassCard
                key={classData.id}
                classData={classData}
                onClick={() => onClassSelect(classData.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyAttendanceDay selectedDate={selectedDate} />
        )}
      </div>
    </div>
  )
}