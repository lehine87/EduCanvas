'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * 학생 실시간 업데이트 훅 - 업계 표준 구현
 * 
 * 기능:
 * - Supabase Realtime으로 학생 데이터 변경사항 실시간 감지
 * - INSERT/UPDATE/DELETE 이벤트 처리
 * - 테넌트별 데이터 필터링
 * - 자동 재연결 및 에러 처리
 * - TypeScript 완전 지원
 */

type Student = Database['public']['Tables']['students']['Row']

interface StudentRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Student
  old?: Student
  timestamp: string
}

interface UseStudentRealtimeOptions {
  tenantId: string
  enabled?: boolean
  onStudentInsert?: (student: Student) => void
  onStudentUpdate?: (oldStudent: Student, newStudent: Student) => void
  onStudentDelete?: (student: Student) => void
  onError?: (error: Error) => void
}

interface UseStudentRealtimeReturn {
  isConnected: boolean
  lastEvent: StudentRealtimeEvent | null
  connectionError: string | null
  reconnect: () => void
}

export function useStudentRealtime({
  tenantId,
  enabled = true,
  onStudentInsert,
  onStudentUpdate,
  onStudentDelete,
  onError
}: UseStudentRealtimeOptions): UseStudentRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<StudentRealtimeEvent | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const handleRealtimeEvent = useCallback((
    payload: RealtimePostgresChangesPayload<Student>
  ) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload
      
      // 테넌트 ID 필터링 (보안 강화)
      const recordTenantId = (newRecord && 'tenant_id' in newRecord ? newRecord.tenant_id : null) || 
                             (oldRecord && 'tenant_id' in oldRecord ? oldRecord.tenant_id : null)
      if (recordTenantId !== tenantId) {
        return
      }

      const event: StudentRealtimeEvent = {
        eventType,
        new: (newRecord && 'id' in newRecord) ? newRecord as Student : undefined,
        old: (oldRecord && 'id' in oldRecord) ? oldRecord as Student : undefined,
        timestamp: new Date().toISOString()
      }

      setLastEvent(event)

      // 이벤트별 콜백 실행
      switch (eventType) {
        case 'INSERT':
          if (newRecord && 'id' in newRecord && onStudentInsert) {
            onStudentInsert(newRecord as Student)
          }
          break

        case 'UPDATE':
          if (oldRecord && 'id' in oldRecord && newRecord && 'id' in newRecord && onStudentUpdate) {
            onStudentUpdate(oldRecord as Student, newRecord as Student)
          }
          break

        case 'DELETE':
          if (oldRecord && 'id' in oldRecord && onStudentDelete) {
            onStudentDelete(oldRecord as Student)
          }
          break
      }

      setConnectionError(null)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionError(errorMessage)
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage))
      }
    }
  }, [tenantId, onStudentInsert, onStudentUpdate, onStudentDelete, onError])

  const setupRealtime = useCallback(() => {
    if (!enabled || !tenantId) return

    try {
      const channel = supabase
        .channel('student-updates')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE 모두 감지
            schema: 'public',
            table: 'students',
            filter: `tenant_id=eq.${tenantId}` // 테넌트별 필터링
          },
          handleRealtimeEvent
        )
        .subscribe((status) => {
          console.log('Student realtime status:', status)
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setConnectionError(null)
          } else if (status === 'CLOSED') {
            setIsConnected(false)
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false)
            setConnectionError('Failed to subscribe to realtime updates')
          }
        })

      return () => {
        supabase.removeChannel(channel)
        setIsConnected(false)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup realtime'
      setConnectionError(errorMessage)
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage))
      }
      return undefined
    }
  }, [enabled, tenantId, supabase, handleRealtimeEvent, onError])

  const reconnect = useCallback(() => {
    setConnectionError(null)
    setIsConnected(false)
    
    // 기존 연결 정리 후 재연결
    supabase.removeAllChannels()
    setupRealtime()
  }, [supabase, setupRealtime])

  useEffect(() => {
    const cleanup = setupRealtime()
    
    return () => {
      if (cleanup) cleanup()
    }
  }, [setupRealtime])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      supabase.removeAllChannels()
    }
  }, [supabase])

  return {
    isConnected,
    lastEvent,
    connectionError,
    reconnect
  }
}

/**
 * 학생 목록 실시간 동기화 훅
 * 
 * 실제 학생 배열을 실시간으로 동기화합니다.
 */
interface UseStudentListRealtimeOptions {
  tenantId: string
  initialStudents: Student[]
  enabled?: boolean
}

interface UseStudentListRealtimeReturn {
  students: Student[]
  isConnected: boolean
  lastUpdated: string | null
  reconnect: () => void
}

export function useStudentListRealtime({
  tenantId,
  initialStudents,
  enabled = true
}: UseStudentListRealtimeOptions): UseStudentListRealtimeReturn {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const { isConnected, reconnect } = useStudentRealtime({
    tenantId,
    enabled,
    onStudentInsert: (newStudent) => {
      setStudents(prev => {
        // 중복 방지
        if (prev.find(s => s.id === newStudent.id)) {
          return prev
        }
        return [...prev, newStudent]
      })
      setLastUpdated(new Date().toISOString())
    },
    onStudentUpdate: (oldStudent, newStudent) => {
      setStudents(prev => 
        prev.map(s => s.id === newStudent.id ? newStudent : s)
      )
      setLastUpdated(new Date().toISOString())
    },
    onStudentDelete: (deletedStudent) => {
      setStudents(prev => 
        prev.filter(s => s.id !== deletedStudent.id)
      )
      setLastUpdated(new Date().toISOString())
    }
  })

  // 초기 데이터 업데이트
  useEffect(() => {
    setStudents(initialStudents)
  }, [initialStudents])

  return {
    students,
    isConnected,
    lastUpdated,
    reconnect
  }
}