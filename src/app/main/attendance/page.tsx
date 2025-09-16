'use client'

import { useState } from 'react'
import { AttendancePageLayout } from '@/components/attendance/AttendancePageLayout'
import { AttendanceTimeSidebar } from '@/components/attendance/AttendanceTimeSidebar'
import { AttendanceMainArea } from '@/components/attendance/AttendanceMainArea'

/**
 * 출석체크 메인 페이지
 * T-V2-014: 출석 관리 시스템 v2
 */

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  return (
    <AttendancePageLayout>
      <div className="flex h-full">
        {/* 사이드바 - 날짜 선택 + 시간대별 클래스 */}
        <AttendanceTimeSidebar
          selectedDate={selectedDate}
          selectedClassId={selectedClassId}
          onDateChange={setSelectedDate}
          onClassSelect={setSelectedClassId}
        />

        {/* 메인 영역 - 출석 현황 + 클래스 카드뷰 또는 출석체크 상세 */}
        <AttendanceMainArea
          selectedDate={selectedDate}
          selectedClassId={selectedClassId}
          onClassSelect={setSelectedClassId}
        />
      </div>
    </AttendancePageLayout>
  )
}