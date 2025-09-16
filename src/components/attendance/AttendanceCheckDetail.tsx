'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { StudentAttendanceCard } from './StudentAttendanceCard'
import { AttendanceReasonModal } from './AttendanceReasonModal'
import { useClassStudentsWithAttendance } from '@/hooks/queries/useAttendance'
import type { AttendanceStatus } from '@/types/student-attendance.types'

interface AttendanceCheckDetailProps {
  classId: string
  date: Date
  onBack: () => void
}

interface ReasonModalState {
  isOpen: boolean
  studentId: string
  studentName: string
  status: AttendanceStatus
}

export function AttendanceCheckDetail({ classId, date, onBack }: AttendanceCheckDetailProps) {
  const { data: students, isLoading, checkAttendance } = useClassStudentsWithAttendance(classId, date)
  const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null)

  // 가짜 클래스 정보 (실제로는 별도 API에서 가져와야 함)
  const classInfo = {
    name: '수학 기초반',
    start_time: '09:00',
    end_time: '10:30',
    instructor_name: '김선생',
    room: '201호'
  }

  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    if (['absent', 'late', 'early_leave'].includes(status)) {
      const student = students?.find(s => s.id === studentId)
      setReasonModal({
        isOpen: true,
        studentId,
        studentName: student?.name || '',
        status
      })
    } else {
      // 출석의 경우 바로 처리
      await checkAttendance({
        student_id: studentId,
        class_id: classId,
        attendance_date: date.toISOString().split('T')[0],
        status,
        check_in_time: new Date().toISOString()
      })
    }
  }

  const handleReasonSubmit = async (reason?: string) => {
    if (reasonModal) {
      await checkAttendance({
        student_id: reasonModal.studentId,
        class_id: classId,
        attendance_date: date.toISOString().split('T')[0],
        status: reasonModal.status,
        reason: reason || undefined,
        check_in_time: reasonModal.status === 'present' ? new Date().toISOString() : undefined
      })
      setReasonModal(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{classInfo.name}</h1>
          <p className="text-sm text-muted-foreground">
            {format(date, "yyyy년 M월 d일 (E)", { locale: ko })} •
            {classInfo.start_time} ~ {classInfo.end_time} •
            {classInfo.instructor_name} • {classInfo.room}
          </p>
        </div>
      </div>

      {/* 출석 통계 요약 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{students?.length || 0}</div>
              <div className="text-sm text-muted-foreground">총인원</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {students?.filter(s => s.attendance_status === 'present').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">출석</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {students?.filter(s => s.attendance_status === 'absent').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">결석</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {students?.filter(s => s.attendance_status === 'late').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">지각</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 반응형 학생 리스트 (최대 2열) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {students?.map((student) => (
          <StudentAttendanceCard
            key={student.id}
            student={student}
            onStatusChange={(status) => handleStatusChange(student.id, status)}
          />
        ))}
      </div>

      {/* 사유 입력 모달 */}
      {reasonModal && (
        <AttendanceReasonModal
          isOpen={reasonModal.isOpen}
          studentName={reasonModal.studentName}
          status={reasonModal.status}
          onSubmit={handleReasonSubmit}
          onClose={() => setReasonModal(null)}
        />
      )}
    </div>
  )
}