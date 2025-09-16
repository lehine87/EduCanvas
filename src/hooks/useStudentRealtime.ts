'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { studentQueryKeys, studentCacheUtils } from '@/lib/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'

/**
 * 학생 실시간 업데이트 훅 - Enterprise급 구현 v2.0
 * 
 * 기능:
 * - Supabase Realtime으로 학생 데이터 변경사항 실시간 감지
 * - INSERT/UPDATE/DELETE 이벤트 처리
 * - 테넌트별 데이터 필터링 및 보안 강화
 * - 다중 사용자 충돌 감지 및 해결
 * - React Query 캐시와 완벽 통합
 * - Optimistic Updates와 실시간 동기화 조화
 * - 자동 재연결, 에러 복구, 메모리 최적화
 * - 실시간 알림 시스템 통합
 * - TypeScript 완전 지원 + 타입 안전성
 * 
 * @version v2.0 - Enterprise Integration
 */

type Student = Database['public']['Tables']['students']['Row']

interface StudentRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Student
  old?: Student
  timestamp: string
  userId?: string
  conflictResolved?: boolean
}

interface StudentConflict {
  studentId: string
  localVersion: string
  remoteVersion: string
  localData: Partial<Student>
  remoteData: Student
  conflictType: 'version' | 'concurrent' | 'optimistic'
}

interface UseStudentRealtimeOptions {
  tenantId?: string
  studentId?: string
  enabled?: boolean
  autoResolveConflicts?: boolean
  onStudentInsert?: (student: Student) => void
  onStudentUpdate?: (oldStudent: Student, newStudent: Student) => void
  onStudentDelete?: (student: Student) => void
  onConflict?: (conflict: StudentConflict) => Promise<void> | void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

interface UseStudentRealtimeReturn {
  isConnected: boolean
  lastEvent: StudentRealtimeEvent | null
  connectionError: string | null
  reconnect: () => void
  disconnect: () => void
  conflictsDetected: number
  eventsProcessed: number
}

export function useStudentRealtime({
  tenantId: propTenantId,
  studentId,
  enabled = true,
  autoResolveConflicts = true,
  onStudentInsert,
  onStudentUpdate,
  onStudentDelete,
  onConflict,
  onError,
  onConnectionChange
}: UseStudentRealtimeOptions): UseStudentRealtimeReturn {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const resolvedTenantId = propTenantId || profile?.tenant_id

  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<StudentRealtimeEvent | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [conflictsDetected, setConflictsDetected] = useState(0)
  const [eventsProcessed, setEventsProcessed] = useState(0)
  
  const [supabase] = useState(() => createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 충돌 감지 및 해결 로직
  const handleConflict = useCallback(async (conflict: StudentConflict) => {
    console.warn('🔄 [Realtime] Student conflict detected:', conflict)
    setConflictsDetected(prev => prev + 1)
    
    if (onConflict) {
      await onConflict(conflict)
    } else if (autoResolveConflicts) {
      // 기본 충돌 해결: 최신 데이터 우선 + 사용자 알림
      toast.error(
        `학생 "${conflict.remoteData.name}" 정보가 다른 사용자에 의해 수정되었습니다. 최신 정보로 업데이트됩니다.`,
        { 
          duration: 5000,
          id: `conflict-${conflict.studentId}` // 중복 알림 방지
        }
      )
      
      // 캐시를 최신 데이터로 업데이트
      studentCacheUtils.setStudentInCache(conflict.studentId, conflict.remoteData)
    }
  }, [onConflict, autoResolveConflicts])

  // 실시간 이벤트 처리 (Enterprise급 로직)
  const handleRealtimeEvent = useCallback(async (
    payload: RealtimePostgresChangesPayload<Student>
  ) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload

      console.log('📡 [Realtime] Raw event received:', {
        eventType,
        newRecord: newRecord ? { id: newRecord.id, tenant_id: newRecord.tenant_id } : null,
        oldRecord: oldRecord ? { id: oldRecord.id, tenant_id: oldRecord.tenant_id } : null,
        resolvedTenantId
      })

      // 타입 가드 및 빈 객체 체크
      const isValidNewRecord = newRecord && typeof newRecord === 'object' && Object.keys(newRecord).length > 0 && 'id' in newRecord
      const isValidOldRecord = oldRecord && typeof oldRecord === 'object' && Object.keys(oldRecord).length > 0 && 'id' in oldRecord

      // 테넌트 ID 필터링 (보안 강화)
      const recordTenantId = (isValidNewRecord && 'tenant_id' in newRecord ? newRecord.tenant_id : null) ||
                             (isValidOldRecord && 'tenant_id' in oldRecord ? oldRecord.tenant_id : null)

      if (recordTenantId !== resolvedTenantId) {
        console.log('📡 [Realtime] Filtered out - tenant mismatch:', { recordTenantId, resolvedTenantId })
        return
      }

      // 개별 학생 필터링 (선택적)
      if (studentId) {
        const recordId = (isValidNewRecord ? newRecord.id : null) ||
                        (isValidOldRecord ? oldRecord.id : null)
        if (recordId !== studentId) {
          console.log('📡 [Realtime] Filtered out - student ID mismatch:', { recordId, studentId })
          return
        }
      }

      setEventsProcessed(prev => prev + 1)

      const event: StudentRealtimeEvent = {
        eventType,
        new: isValidNewRecord ? newRecord as Student : undefined,
        old: isValidOldRecord ? oldRecord as Student : undefined,
        timestamp: new Date().toISOString()
      }

      console.log('📡 [Realtime] Student event received:', {
        eventType,
        studentId: event.new?.id || event.old?.id,
        studentName: event.new?.name || event.old?.name,
        tenantId: resolvedTenantId
      })

      setLastEvent(event)

      // 이벤트별 처리 및 충돌 감지
      switch (eventType) {
        case 'INSERT':
          if (isValidNewRecord) {
            const student = newRecord as Student

            // 캐시에 추가
            studentCacheUtils.addStudentToCache(student)

            // 성공 알림
            toast.success(`새 학생 "${student.name}"이 등록되었습니다`, {
              duration: 4000,
              icon: '👤'
            })

            onStudentInsert?.(student)
          }
          break

        case 'UPDATE':
          if (isValidOldRecord && isValidNewRecord) {
            const oldStudent = oldRecord as Student
            const newStudent = newRecord as Student

            // 충돌 감지: 현재 캐시 데이터와 비교
            const cachedStudent = queryClient.getQueryData(
              studentQueryKeys.detail(newStudent.id)
            ) as Student | undefined

            if (cachedStudent && cachedStudent.updated_at !== oldStudent.updated_at) {
              // 충돌 발생
              const conflict: StudentConflict = {
                studentId: newStudent.id,
                localVersion: cachedStudent.updated_at || '',
                remoteVersion: newStudent.updated_at || '',
                localData: cachedStudent,
                remoteData: newStudent,
                conflictType: 'version'
              }

              await handleConflict(conflict)
              setLastEvent({ ...event, conflictResolved: true })
            } else {
              // 정상 업데이트
              studentCacheUtils.setStudentInCache(newStudent.id, newStudent)

              toast.success(`학생 "${newStudent.name}" 정보가 업데이트되었습니다`, {
                duration: 3000,
                icon: '📝'
              })
            }

            onStudentUpdate?.(oldStudent, newStudent)
          }
          break

        case 'DELETE':
          if (isValidOldRecord) {
            const deletedStudent = oldRecord as Student

            // 캐시에서 제거
            studentCacheUtils.removeStudentFromCache(deletedStudent.id)

            // 알림
            toast(`학생 "${deletedStudent.name}"이 삭제되었습니다`, {
              duration: 4000,
              icon: '🗑️'
            })

            onStudentDelete?.(deletedStudent)
          }
          break
      }

      // 관련 캐시 무효화
      await invalidateRelatedCaches(event)
      setConnectionError(null)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionError(errorMessage)
      
      console.error('❌ [Realtime] Error handling student event:', error)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [resolvedTenantId, studentId, queryClient, handleConflict, onStudentInsert, onStudentUpdate, onStudentDelete, onError])

  // 관련 캐시 무효화 로직
  const invalidateRelatedCaches = useCallback(async (event: StudentRealtimeEvent) => {
    // 개별 학생 상세 캐시 무효화
    if (event.new?.id) {
      studentCacheUtils.invalidateStudentDetail(event.new.id)
    }
    if (event.old?.id) {
      studentCacheUtils.invalidateStudentDetail(event.old.id)
    }

    // 목록 캐시는 INSERT/DELETE 시에만 무효화 (UPDATE는 개별 업데이트)
    if (event.eventType === 'INSERT' || event.eventType === 'DELETE') {
      studentCacheUtils.invalidateStudentsList()
      studentCacheUtils.invalidateStudentStats()
    }

    // 클래스별 학생 목록 무효화 (student_enrollments를 통해 관리됨)
    queryClient.invalidateQueries({
      queryKey: ['classes', 'students']
    })
  }, [queryClient])

  // 연결 상태 변경 처리
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected)
    onConnectionChange?.(connected)
    
    if (connected) {
      console.log('✅ [Realtime] Successfully connected to student updates')
      toast.success('실시간 연결이 복원되었습니다', {
        duration: 2000,
        id: 'realtime-reconnected'
      })
    } else {
      console.log('⚠️ [Realtime] Disconnected from student updates')
    }
  }, [onConnectionChange])

  // 고급 연결 설정 (Enterprise급) - 무한 루프 방지 개선
  const setupRealtime = useCallback(() => {
    console.log('🔌 [Realtime] setupRealtime called:', { enabled, resolvedTenantId, studentId })

    if (!enabled || !resolvedTenantId) {
      console.log('🔌 [Realtime] Skipping setup:', {
        enabled,
        resolvedTenantId,
        reason: !enabled ? 'not enabled' : 'no tenant ID'
      })
      return
    }

    // 기존 채널이 이미 연결되어 있으면 재설정하지 않음
    if (channelRef.current) {
      console.log('🔌 [Realtime] Channel already exists, skipping setup')
      return
    }

    try {
      // 채널 이름 생성 (고유성 보장)
      const channelName = studentId
        ? `student-${studentId}-${resolvedTenantId}`
        : `students-${resolvedTenantId}`

      console.log('🔌 [Realtime] Setting up channel:', channelName, {
        filter: studentId ? `id=eq.${studentId}` : `tenant_id=eq.${resolvedTenantId}`
      })

      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: profile?.id || 'anonymous' },
            broadcast: { self: false },
            private: false
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE 모두 감지
            schema: 'public',
            table: 'students',
            filter: studentId 
              ? `id=eq.${studentId}` 
              : `tenant_id=eq.${resolvedTenantId}` // 테넌트별 또는 개별 학생 필터링
          },
          handleRealtimeEvent
        )
        .subscribe((status, error) => {
          console.log(`📡 [Realtime] Channel ${channelName} status:`, status, error)

          switch (status) {
            case 'SUBSCRIBED':
              handleConnectionChange(true)
              setConnectionError(null)
              // 재연결 타임아웃 정리
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
              }
              break

            case 'CLOSED':
              handleConnectionChange(false)
              setConnectionError('Connection closed')
              // CLOSED는 정상적인 종료 상태이므로 재연결하지 않음
              console.log('📡 [Realtime] Channel closed gracefully')

              // 채널 참조 정리
              if (channelRef.current) {
                channelRef.current = null
              }
              break

            case 'CHANNEL_ERROR':
              handleConnectionChange(false)
              const errorMsg = error?.message || 'Failed to subscribe to realtime updates'
              setConnectionError(errorMsg)
              onError?.(new Error(errorMsg))

              // 재연결 시도 (5초 후, 한 번만)
              if (!reconnectTimeoutRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                  console.log('🔄 [Realtime] Retrying after error...')
                  reconnectTimeoutRef.current = null
                  setupRealtime()
                }, 5000)
              }
              break

            case 'TIMED_OUT':
              handleConnectionChange(false)
              setConnectionError('Connection timed out')

              // 재연결 시도 (2초 후, 한 번만)
              if (!reconnectTimeoutRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                  console.log('🔄 [Realtime] Retrying after timeout...')
                  reconnectTimeoutRef.current = null
                  setupRealtime()
                }, 2000)
              }
              break
          }
        })

      channelRef.current = channel

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        setIsConnected(false)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup realtime'
      setConnectionError(errorMessage)
      
      console.error('❌ [Realtime] Setup error:', error)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      return undefined
    }
  }, [enabled, resolvedTenantId, studentId])

  // 수동 재연결
  const reconnect = useCallback(() => {
    console.log('🔄 [Realtime] Manual reconnect requested')
    setConnectionError(null)
    setIsConnected(false)
    
    // 기존 타임아웃 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // 기존 연결 정리 후 재연결
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    // 새 연결 설정
    setupRealtime()
  }, [setupRealtime])

  // 연결 해제
  const disconnect = useCallback(() => {
    console.log('🔌 [Realtime] Manual disconnect requested')
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setConnectionError(null)
  }, [])

  // 실시간 연결 설정 - 안정적인 의존성 관리
  useEffect(() => {
    if (!enabled || !resolvedTenantId) {
      return
    }

    const cleanup = setupRealtime()

    return () => {
      if (cleanup) cleanup()
    }
  }, [enabled, resolvedTenantId, studentId])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [])

  return {
    isConnected,
    lastEvent,
    connectionError,
    reconnect,
    disconnect,
    conflictsDetected,
    eventsProcessed
  }
}

/**
 * 개별 학생 실시간 동기화 훅 (단축 버전)
 */
export function useStudentRealtimeSync(studentId: string, options: Omit<UseStudentRealtimeOptions, 'studentId'> = {}) {
  return useStudentRealtime({ ...options, studentId, enabled: true })
}

/**
 * 전체 학생 목록 실시간 동기화 훅 (테넌트 범위)
 */
export function useStudentsRealtimeSync(options: UseStudentRealtimeOptions = {}) {
  return useStudentRealtime(options)
}

/**
 * 학생 목록 실시간 동기화 훅 (Enterprise급 v2.0)
 * 
 * 실제 학생 배열을 실시간으로 동기화하며 성능 최적화 적용
 */
interface UseStudentListRealtimeOptionsV2 {
  tenantId?: string
  initialStudents: Student[]
  enabled?: boolean
  sortBy?: 'name' | 'enrollment_date' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

interface UseStudentListRealtimeReturnV2 {
  students: Student[]
  isConnected: boolean
  lastUpdated: string | null
  conflictsDetected: number
  eventsProcessed: number
  reconnect: () => void
  disconnect: () => void
}

export function useStudentListRealtime({
  tenantId: propTenantId,
  initialStudents,
  enabled = true,
  sortBy = 'name',
  sortOrder = 'asc'
}: UseStudentListRealtimeOptionsV2): UseStudentListRealtimeReturnV2 {
  const { profile } = useAuthStore()
  const resolvedTenantId = propTenantId || profile?.tenant_id
  
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // 정렬 함수
  const sortStudents = useCallback((studentList: Student[]) => {
    return [...studentList].sort((a, b) => {
      let valueA: string | number = ''
      let valueB: string | number = ''
      
      switch (sortBy) {
        case 'name':
          valueA = a.name || ''
          valueB = b.name || ''
          break
        case 'enrollment_date':
          valueA = a.enrollment_date || '0000-00-00'
          valueB = b.enrollment_date || '0000-00-00'
          break
        case 'updated_at':
          valueA = a.updated_at || '0000-00-00'
          valueB = b.updated_at || '0000-00-00'
          break
      }
      
      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
      }
    })
  }, [sortBy, sortOrder])

  const { isConnected, conflictsDetected, eventsProcessed, reconnect, disconnect } = useStudentRealtime({
    tenantId: resolvedTenantId || '',
    enabled,
    autoResolveConflicts: true,
    onStudentInsert: (newStudent) => {
      setStudents(prev => {
        // 중복 방지
        if (prev.find(s => s.id === newStudent.id)) {
          return prev
        }
        const updated = sortStudents([...prev, newStudent])
        return updated
      })
      setLastUpdated(new Date().toISOString())
    },
    onStudentUpdate: (oldStudent, newStudent) => {
      setStudents(prev => {
        const updated = prev.map(s => s.id === newStudent.id ? newStudent : s)
        return sortStudents(updated)
      })
      setLastUpdated(new Date().toISOString())
    },
    onStudentDelete: (deletedStudent) => {
      setStudents(prev => 
        prev.filter(s => s.id !== deletedStudent.id)
      )
      setLastUpdated(new Date().toISOString())
    },
    onConflict: async (conflict) => {
      console.log('📋 [StudentList] Handling conflict:', conflict)
      // 충돌이 해결되면 목록을 다시 정렬
      setStudents(prev => sortStudents(prev))
    }
  })

  // 초기 데이터 업데이트 및 정렬
  useEffect(() => {
    setStudents(sortStudents(initialStudents))
  }, [initialStudents, sortStudents])

  // 정렬 방식 변경 시 재정렬
  useEffect(() => {
    setStudents(prev => sortStudents(prev))
  }, [sortBy, sortOrder, sortStudents])

  return {
    students,
    isConnected,
    lastUpdated,
    conflictsDetected,
    eventsProcessed,
    reconnect,
    disconnect
  }
}

/**
 * 학생 관리 페이지용 통합 실시간 훅 - 안정화된 버전
 */
export function useStudentPageRealtime() {
  const { profile } = useAuthStore()

  return useStudentRealtime({
    tenantId: profile?.tenant_id || '',
    enabled: !!profile?.tenant_id,
    autoResolveConflicts: true,
    onConflict: (conflict) => {
      console.log('📋 [Page] Handling student conflict:', conflict)
    },
    onConnectionChange: (connected) => {
      if (!connected) {
        toast.error('실시간 연결이 끊어졌습니다. 자동으로 재연결을 시도합니다.', {
          duration: 3000,
          id: 'realtime-disconnected'
        })
      } else {
        console.log('📋 [Page] Realtime connection established successfully')
      }
    },
    onError: (error) => {
      console.error('📋 [Page] Realtime error:', error)
      toast.error('실시간 연결에 문제가 발생했습니다.', {
        duration: 5000,
        id: 'realtime-error'
      })
    }
  })
}

/**
 * 실시간 연결 상태 모니터링 훅
 */
export function useStudentRealtimeMonitor() {
  const [connectionMetrics, setConnectionMetrics] = useState({
    totalConnections: 0,
    totalDisconnections: 0,
    totalConflicts: 0,
    totalEvents: 0,
    averageReconnectTime: 0,
    lastConnectionTime: null as string | null,
    lastDisconnectionTime: null as string | null
  })

  const updateMetrics = useCallback((type: 'connect' | 'disconnect' | 'conflict' | 'event') => {
    setConnectionMetrics(prev => {
      const now = new Date().toISOString()
      
      switch (type) {
        case 'connect':
          return {
            ...prev,
            totalConnections: prev.totalConnections + 1,
            lastConnectionTime: now
          }
        case 'disconnect':
          return {
            ...prev,
            totalDisconnections: prev.totalDisconnections + 1,
            lastDisconnectionTime: now
          }
        case 'conflict':
          return {
            ...prev,
            totalConflicts: prev.totalConflicts + 1
          }
        case 'event':
          return {
            ...prev,
            totalEvents: prev.totalEvents + 1
          }
        default:
          return prev
      }
    })
  }, [])

  return {
    connectionMetrics,
    updateMetrics
  }
}

/**
 * 타입 내보내기
 */
export type {
  UseStudentRealtimeOptions,
  UseStudentRealtimeReturn,
  StudentRealtimeEvent,
  StudentConflict,
  UseStudentListRealtimeOptionsV2 as UseStudentListRealtimeOptions,
  UseStudentListRealtimeReturnV2 as UseStudentListRealtimeReturn
}