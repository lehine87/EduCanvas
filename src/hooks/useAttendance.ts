import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  AttendanceRecord, 
  AttendanceFilters, 
  AttendanceListResponse,
  CheckInRequest, 
  CheckInResponse,
  CheckOutRequest, 
  CheckOutResponse,
  AttendanceStats,
  QRCodeRequest,
  QRCodeResponse
} from '@/types/attendance.types'

// 근태 관리 API 함수들
const attendanceApi = {
  // 근태 기록 목록 조회
  getAttendanceRecords: async (filters: AttendanceFilters = {}): Promise<AttendanceListResponse> => {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value.toString())
      }
    })
    
    const response = await fetch(`/api/attendance?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '근태 기록 조회에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 출근 체크인
  checkIn: async (request: CheckInRequest): Promise<CheckInResponse> => {
    const response = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '출근 체크인에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 퇴근 체크아웃
  checkOut: async (request: CheckOutRequest): Promise<CheckOutResponse> => {
    const response = await fetch('/api/attendance/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '퇴근 체크아웃에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 근태 기록 생성/수정 (관리자용)
  createOrUpdateRecord: async (record: {
    membership_id: string
    date: string
    check_in?: string
    check_out?: string
    status?: string
    notes?: string
  }): Promise<{ record: AttendanceRecord }> => {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '근태 기록 저장에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // QR 코드 생성
  generateQRCode: async (request: QRCodeRequest): Promise<QRCodeResponse> => {
    const response = await fetch('/api/attendance/qr-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'QR 코드 생성에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 오늘 근태 기록 조회
  getTodayRecord: async (): Promise<{ record: AttendanceRecord | null }> => {
    const today = new Date().toISOString().split('T')[0]
    const response = await fetch(`/api/attendance/today?date=${today}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '오늘 근태 기록 조회에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 근태 통계 조회
  getAttendanceStats: async (params: {
    membership_id?: string
    start_date?: string
    end_date?: string
  }): Promise<{ stats: AttendanceStats }> => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value)
      }
    })
    
    const response = await fetch(`/api/attendance/stats?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '근태 통계 조회에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  }
}

// Query Keys
export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  records: () => [...attendanceQueryKeys.all, 'records'] as const,
  record: (filters: AttendanceFilters) => [...attendanceQueryKeys.records(), filters] as const,
  todayRecord: () => [...attendanceQueryKeys.all, 'today'] as const,
  stats: (params: any) => [...attendanceQueryKeys.all, 'stats', params] as const,
  qrCode: (action: string) => [...attendanceQueryKeys.all, 'qr-code', action] as const,
}

// 근태 기록 목록 조회 훅
export function useAttendanceRecords(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: attendanceQueryKeys.record(filters),
    queryFn: () => attendanceApi.getAttendanceRecords(filters),
    staleTime: 2 * 60 * 1000, // 2분
    refetchOnWindowFocus: true
  })
}

// 오늘 근태 기록 조회 훅
export function useTodayAttendance() {
  return useQuery({
    queryKey: attendanceQueryKeys.todayRecord(),
    queryFn: attendanceApi.getTodayRecord,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 새로고침
    refetchOnWindowFocus: true
  })
}

// 출근 체크인 훅
export function useCheckIn() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: (data) => {
      // 오늘 기록 캐시 갱신
      queryClient.setQueryData(attendanceQueryKeys.todayRecord(), { record: data.record })
      
      // 근태 기록 목록 새로고침
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.records() })
      
      console.log('출근 체크인 완료:', data.check_in_time)
    },
    onError: (error) => {
      console.error('출근 체크인 실패:', error)
    }
  })
}

// 퇴근 체크아웃 훅
export function useCheckOut() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: (data) => {
      // 오늘 기록 캐시 갱신
      queryClient.setQueryData(attendanceQueryKeys.todayRecord(), { record: data.record })
      
      // 근태 기록 목록 새로고침
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.records() })
      
      console.log('퇴근 체크아웃 완료:', data.check_out_time, '근무시간:', data.work_hours)
    },
    onError: (error) => {
      console.error('퇴근 체크아웃 실패:', error)
    }
  })
}

// 근태 기록 생성/수정 훅 (관리자용)
export function useCreateOrUpdateAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceApi.createOrUpdateRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.records() })
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.todayRecord() })
    },
    onError: (error) => {
      console.error('근태 기록 저장 실패:', error)
    }
  })
}

// QR 코드 생성 훅
export function useGenerateQRCode() {
  return useMutation({
    mutationFn: attendanceApi.generateQRCode,
    onError: (error) => {
      console.error('QR 코드 생성 실패:', error)
    }
  })
}

// 근태 통계 조회 훅
export function useAttendanceStats(params: {
  membership_id?: string
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: attendanceQueryKeys.stats(params),
    queryFn: () => attendanceApi.getAttendanceStats(params),
    enabled: !!(params.start_date && params.end_date),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 실시간 출석 상태 훅
export function useAttendanceStatus() {
  const { data: todayData, isLoading } = useTodayAttendance()
  
  const record = todayData?.record
  
  const status = !record 
    ? 'not_started' 
    : !record.check_in 
    ? 'not_started'
    : !record.check_out 
    ? 'working' 
    : 'completed'
  
  const workingHours = record?.check_in && !record.check_out 
    ? calculateCurrentWorkHours(record.check_in)
    : record?.check_in && record.check_out
    ? calculateWorkHours(record.check_in, record.check_out)
    : 0

  return {
    record,
    status,
    workingHours,
    isLoading
  }
}

// 위치 정보 가져오기 훅
export function useGeolocation() {
  const getCurrentLocation = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('브라우저에서 위치 정보를 지원하지 않습니다.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          let message = '위치 정보를 가져올 수 없습니다.'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '위치 정보 접근이 거부되었습니다.'
              break
            case error.POSITION_UNAVAILABLE:
              message = '위치 정보를 사용할 수 없습니다.'
              break
            case error.TIMEOUT:
              message = '위치 정보 요청이 시간 초과되었습니다.'
              break
          }
          
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  return { getCurrentLocation }
}

// 유틸리티 함수들
function calculateCurrentWorkHours(checkInTime: string): number {
  const now = new Date()
  const currentTime = now.toTimeString().split(' ')[0].slice(0, 5) // HH:MM
  return calculateWorkHours(checkInTime, currentTime)
}

function calculateWorkHours(checkIn: string, checkOut: string): number {
  const [inHour, inMinute] = checkIn.split(':').map(Number)
  const [outHour, outMinute] = checkOut.split(':').map(Number)
  
  const inMinutes = inHour * 60 + inMinute
  const outMinutes = outHour * 60 + outMinute
  
  const workMinutes = outMinutes - inMinutes
  return Math.round((workMinutes / 60) * 10) / 10 // 소수점 1자리
}

// 근태 상태별 색상 및 레이블 헬퍼
export const ATTENDANCE_STATUS_CONFIG = {
  '정상': {
    label: '정상',
    color: 'text-growth-600 bg-growth-50 border-growth-200 dark:bg-growth-950 dark:border-growth-800',
    icon: '✓'
  },
  '지각': {
    label: '지각',
    color: 'text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950 dark:border-warning-800',
    icon: '⏰'
  },
  '조퇴': {
    label: '조퇴',
    color: 'text-wisdom-600 bg-wisdom-50 border-wisdom-200 dark:bg-wisdom-950 dark:border-wisdom-800',
    icon: '↗'
  },
  '결근': {
    label: '결근',
    color: 'text-destructive bg-destructive/10 border-destructive/20',
    icon: '✗'
  },
  '휴가': {
    label: '휴가',
    color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    icon: '🏖'
  }
} as const