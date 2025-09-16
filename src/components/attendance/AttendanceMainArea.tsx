'use client'

import { AttendanceCheckDetail } from './AttendanceCheckDetail'
import { AttendanceOverview } from './AttendanceOverview'
import type { AttendanceMainAreaProps } from '@/types/student-attendance.types'

export function AttendanceMainArea({
  selectedDate,
  selectedClassId,
  onClassSelect
}: AttendanceMainAreaProps) {
  if (selectedClassId) {
    return (
      <AttendanceCheckDetail
        classId={selectedClassId}
        date={selectedDate}
        onBack={() => onClassSelect(null)}
      />
    )
  }

  return (
    <AttendanceOverview
      selectedDate={selectedDate}
      onClassSelect={onClassSelect}
    />
  )
}