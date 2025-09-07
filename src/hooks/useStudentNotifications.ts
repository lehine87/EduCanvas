'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStudentRealtime } from './useStudentRealtime'
import { 
  studentNotifications, 
  type StudentNotification,
  type UseStudentNotificationsReturn 
} from '@/lib/notifications/studentNotificationSystem'

/**
 * 학생 실시간 업데이트 + 알림 시스템 통합 훅
 * 
 * 기능:
 * - 실시간 학생 데이터 변경사항을 알림으로 자동 변환
 * - 토스트 알림 표시 (선택사항)
 * - 알림 상태 관리
 * - 테넌트별 알림 필터링
 */

interface UseStudentNotificationsOptions {
  tenantId: string
  enabled?: boolean
  showToast?: boolean
  autoMarkRead?: boolean
}

export function useStudentNotifications({
  tenantId,
  enabled = true,
  showToast = true,
  autoMarkRead = false
}: UseStudentNotificationsOptions): UseStudentNotificationsReturn {
  const [notifications, setNotifications] = useState<StudentNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // 알림 상태 업데이트 함수
  const updateNotificationState = useCallback(() => {
    const allNotifications = studentNotifications.getNotifications(tenantId)
    setNotifications(allNotifications)
    setUnreadCount(studentNotifications.getUnreadCount(tenantId))
  }, [tenantId])

  // 실시간 업데이트 구독
  const { isConnected } = useStudentRealtime({
    tenantId,
    enabled,
    onStudentInsert: (student) => {
      const notification = studentNotifications.notifyStudentCreated(student)
      
      if (showToast) {
        showToastNotification(notification)
      }
      
      updateNotificationState()
    },
    onStudentUpdate: (oldStudent, newStudent) => {
      // 상태 변경인지 확인
      if (oldStudent.status !== newStudent.status) {
        const notification = studentNotifications.notifyStudentStatusChanged(oldStudent, newStudent)
        
        if (showToast) {
          showToastNotification(notification)
        }
      } else {
        const notification = studentNotifications.notifyStudentUpdated(oldStudent, newStudent)
        
        if (showToast) {
          showToastNotification(notification)
        }
      }
      
      updateNotificationState()
    },
    onStudentDelete: (student) => {
      const notification = studentNotifications.notifyStudentDeleted(student)
      
      if (showToast) {
        showToastNotification(notification)
      }
      
      updateNotificationState()
    },
    onError: (error) => {
      console.error('Student realtime error:', error)
      // 에러 알림도 추가할 수 있음
    }
  })

  // 알림 액션 함수들
  const markAsRead = useCallback((id: string) => {
    studentNotifications.markAsRead(id)
    updateNotificationState()
  }, [updateNotificationState])

  const markAllAsRead = useCallback(() => {
    studentNotifications.markAllAsRead(tenantId)
    updateNotificationState()
  }, [tenantId, updateNotificationState])

  const removeNotification = useCallback((id: string) => {
    studentNotifications.removeNotification(id)
    updateNotificationState()
  }, [updateNotificationState])

  const clear = useCallback(() => {
    studentNotifications.clear(tenantId)
    updateNotificationState()
  }, [tenantId, updateNotificationState])

  // 초기 알림 로드
  useEffect(() => {
    updateNotificationState()
  }, [updateNotificationState])

  // 전역 알림 리스너 등록
  useEffect(() => {
    const unsubscribe = studentNotifications.addListener((notification) => {
      // 현재 테넌트의 알림만 처리
      if (notification.tenantId === tenantId) {
        updateNotificationState()
        
        // 자동 읽음 처리
        if (autoMarkRead) {
          setTimeout(() => {
            studentNotifications.markAsRead(notification.id)
            updateNotificationState()
          }, 3000)
        }
      }
    })

    return unsubscribe
  }, [tenantId, autoMarkRead, updateNotificationState])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clear
  }
}

/**
 * 토스트 알림 표시 (shadcn/ui toast와 연동 예정)
 */
function showToastNotification(notification: StudentNotification) {
  // 현재는 콘솔 로그로 대체
  // 추후 shadcn/ui toast 컴포넌트와 연동
  console.log(`🔔 [NOTIFICATION] ${notification.title}: ${notification.message}`)
  
  // Browser Notification API 사용 (권한이 있는 경우)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'high'
    })
  }
}

/**
 * 브라우저 알림 권한 요청 유틸리티
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}