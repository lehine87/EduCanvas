'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  TimeFilteredClasses,
  ClassWithAttendance,
  DailyAttendanceComparison,
  AttendanceCheckRequest,
  BulkAttendanceUpdate,
  StudentWithAttendance,
  AttendanceStats
} from '@/types/student-attendance.types'

// API 호출 함수들
const attendanceApi = {
  // 시간 필터링된 클래스 목록 조회
  getTimeFilteredClasses: async (date: Date): Promise<TimeFilteredClasses> => {
    const dateString = date.toISOString().split('T')[0]
    const response = await fetch(`/api/student-attendance/classes-today?date=${dateString}&time_filter=all`)

    if (!response.ok) {
      throw new Error('클래스 목록을 불러올 수 없습니다')
    }

    const data = await response.json()
    const classes = data.data.classes || []

    // 현재 시간 기준 ±30분 클래스 필터링
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const current = classes.filter((cls: any) => {
      const [startHour, startMin] = cls.start_time.split(':').map(Number)
      const classTime = startHour * 60 + startMin
      return Math.abs(classTime - currentMinutes) <= 30
    })

    return {
      current,
      all: classes,
      currentTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }
  },

  // 오늘의 클래스 목록과 출석 현황
  getTodayClassesWithAttendance: async (date: Date): Promise<ClassWithAttendance[]> => {
    const dateString = date.toISOString().split('T')[0]
    const response = await fetch(`/api/student-attendance/classes-today?date=${dateString}`)

    if (!response.ok) {
      throw new Error('클래스 출석 현황을 불러올 수 없습니다')
    }

    const data = await response.json()
    return data.data.classes || []
  },

  // 일일 출석 비교 데이터
  getDailyAttendanceComparison: async (date: Date): Promise<DailyAttendanceComparison> => {
    const dateString = date.toISOString().split('T')[0]
    const response = await fetch(`/api/student-attendance/daily-comparison?date=${dateString}`)

    if (!response.ok) {
      throw new Error('출석 비교 데이터를 불러올 수 없습니다')
    }

    const data = await response.json()
    return data.data
  },

  // 클래스의 학생 목록과 출석 현황
  getClassStudentsWithAttendance: async (classId: string, date: Date): Promise<StudentWithAttendance[]> => {
    const dateString = date.toISOString().split('T')[0]
    const response = await fetch(`/api/student-attendance?class_id=${classId}&attendance_date=${dateString}`)

    if (!response.ok) {
      throw new Error('학생 출석 현황을 불러올 수 없습니다')
    }

    const data = await response.json()
    // API 응답 데이터를 StudentWithAttendance 형태로 변환
    return data.data.map((record: any) => ({
      id: record.students?.id,
      name: record.students?.name,
      student_number: record.students?.student_number,
      grade_level: record.students?.grade_level,
      profile_image: record.students?.profile_image,
      attendance_status: record.status,
      attendance_reason: record.reason,
      attendance_checked_at: record.updated_at,
      attendance_checked_by: record.checked_by
    }))
  },

  // 클래스 출석 통계
  getClassAttendanceStatus: async (classId: string, date?: Date): Promise<AttendanceStats> => {
    let url = `/api/student-attendance/stats?class_id=${classId}`
    if (date) {
      const dateString = date.toISOString().split('T')[0]
      url += `&attendance_date=${dateString}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('출석 통계를 불러올 수 없습니다')
    }

    const data = await response.json()
    return data.data
  },

  // 출석 체크 (개별)
  checkAttendance: async (request: AttendanceCheckRequest): Promise<any> => {
    const response = await fetch('/api/student-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '출석 체크에 실패했습니다')
    }

    return response.json()
  },

  // 벌크 출석 업데이트
  bulkUpdateAttendance: async (request: BulkAttendanceUpdate): Promise<any> => {
    const response = await fetch('/api/student-attendance/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '출석 일괄 처리에 실패했습니다')
    }

    return response.json()
  }
}

// React Query Hooks

export function useTimeFilteredClasses(date: Date) {
  return useQuery({
    queryKey: ['attendance', 'time-filtered-classes', date.toDateString()],
    queryFn: () => attendanceApi.getTimeFilteredClasses(date),
    staleTime: 1 * 60 * 1000, // 1분간 캐시
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  })
}

export function useTodayClassesWithAttendance(date: Date) {
  return useQuery({
    queryKey: ['attendance', 'today-classes', date.toDateString()],
    queryFn: () => attendanceApi.getTodayClassesWithAttendance(date),
    staleTime: 2 * 60 * 1000, // 2분간 캐시
  })
}

export function useDailyAttendanceComparison(date: Date) {
  return useQuery({
    queryKey: ['attendance', 'daily-comparison', date.toDateString()],
    queryFn: () => attendanceApi.getDailyAttendanceComparison(date),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  })
}

export function useClassStudentsWithAttendance(classId: string, date: Date) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['attendance', 'class-students', classId, date.toDateString()],
    queryFn: () => attendanceApi.getClassStudentsWithAttendance(classId, date),
    enabled: !!classId,
    staleTime: 1 * 60 * 1000, // 1분간 캐시
  })

  const checkAttendanceMutation = useMutation({
    mutationFn: attendanceApi.checkAttendance,
    onSuccess: (data, variables) => {
      // 관련 쿼리들 무효화하여 실시간 업데이트
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'class-students', classId]
      })
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'today-classes']
      })
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'daily-comparison']
      })

      toast.success('출석 체크가 완료되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: attendanceApi.bulkUpdateAttendance,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'class-students', classId]
      })
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'today-classes']
      })
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'daily-comparison']
      })

      toast.success('출석 일괄 처리가 완료되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    ...query,
    checkAttendance: checkAttendanceMutation.mutateAsync,
    bulkUpdateAttendance: bulkUpdateMutation.mutateAsync,
    isChecking: checkAttendanceMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  }
}

export function useClassAttendanceStatus(classId: string, date?: Date) {
  return useQuery({
    queryKey: ['attendance', 'class-status', classId, date?.toDateString()],
    queryFn: () => attendanceApi.getClassAttendanceStatus(classId, date),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000, // 2분간 캐시
  })
}