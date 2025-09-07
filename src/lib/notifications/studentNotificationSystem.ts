/**
 * 학생 관리 시스템 알림 라이브러리 - 업계 표준 구현
 * 
 * 기능:
 * - 실시간 학생 데이터 변경 알림
 * - 토스트 알림 시스템 연동 준비
 * - 사용자별 알림 필터링
 * - 알림 히스토리 관리
 * - TypeScript 완전 지원
 */

import { Database } from '@/types/database.types'

type Student = Database['public']['Tables']['students']['Row']

export type StudentNotificationType = 
  | 'student_created'
  | 'student_updated' 
  | 'student_deleted'
  | 'student_status_changed'
  | 'student_class_changed'

export interface StudentNotification {
  id: string
  type: StudentNotificationType
  title: string
  message: string
  student: Student
  oldData?: Partial<Student>
  timestamp: string
  tenantId: string
  userId?: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
}

export interface StudentNotificationOptions {
  showToast?: boolean
  playSound?: boolean
  persist?: boolean
  autoRead?: boolean
  duration?: number
}

/**
 * 학생 알림 생성기 클래스
 */
export class StudentNotificationSystem {
  private notifications: StudentNotification[] = []
  private listeners: Array<(notification: StudentNotification) => void> = []
  private options: Required<StudentNotificationOptions>

  constructor(options: StudentNotificationOptions = {}) {
    this.options = {
      showToast: true,
      playSound: false,
      persist: true,
      autoRead: false,
      duration: 5000,
      ...options
    }
  }

  /**
   * 학생 생성 알림
   */
  notifyStudentCreated(student: Student): StudentNotification {
    const notification: StudentNotification = {
      id: `student_created_${student.id}_${Date.now()}`,
      type: 'student_created',
      title: '새 학생 등록',
      message: `${student.name}님이 등록되었습니다.`,
      student,
      timestamp: new Date().toISOString(),
      tenantId: student.tenant_id || '',
      isRead: this.options.autoRead,
      priority: 'medium',
      actionUrl: `/students/${student.id}`
    }

    return this.addNotification(notification)
  }

  /**
   * 학생 정보 수정 알림
   */
  notifyStudentUpdated(oldStudent: Student, newStudent: Student): StudentNotification {
    const changes = this.getStudentChanges(oldStudent, newStudent)
    const changeText = changes.length > 0 
      ? changes.join(', ')
      : '기본 정보'

    const notification: StudentNotification = {
      id: `student_updated_${newStudent.id}_${Date.now()}`,
      type: 'student_updated',
      title: '학생 정보 수정',
      message: `${newStudent.name}님의 ${changeText}가 수정되었습니다.`,
      student: newStudent,
      oldData: oldStudent,
      timestamp: new Date().toISOString(),
      tenantId: newStudent.tenant_id || '',
      isRead: this.options.autoRead,
      priority: this.getPriorityByChanges(changes),
      actionUrl: `/students/${newStudent.id}`
    }

    return this.addNotification(notification)
  }

  /**
   * 학생 삭제 알림
   */
  notifyStudentDeleted(student: Student): StudentNotification {
    const notification: StudentNotification = {
      id: `student_deleted_${student.id}_${Date.now()}`,
      type: 'student_deleted',
      title: '학생 삭제',
      message: `${student.name}님이 삭제되었습니다.`,
      student,
      timestamp: new Date().toISOString(),
      tenantId: student.tenant_id || '',
      isRead: this.options.autoRead,
      priority: 'high'
    }

    return this.addNotification(notification)
  }

  /**
   * 학생 상태 변경 알림
   */
  notifyStudentStatusChanged(oldStudent: Student, newStudent: Student): StudentNotification {
    const statusMap: Record<string, string> = {
      'active': '활성',
      'waiting': '대기',
      'inactive': '비활성',
      'graduated': '졸업'
    }

    const oldStatus = oldStudent.status ? (statusMap[oldStudent.status] || oldStudent.status) : '알 수 없음'
    const newStatus = newStudent.status ? (statusMap[newStudent.status] || newStudent.status) : '알 수 없음'

    const notification: StudentNotification = {
      id: `student_status_changed_${newStudent.id}_${Date.now()}`,
      type: 'student_status_changed',
      title: '학생 상태 변경',
      message: `${newStudent.name}님의 상태가 ${oldStatus}에서 ${newStatus}로 변경되었습니다.`,
      student: newStudent,
      oldData: { status: oldStudent.status },
      timestamp: new Date().toISOString(),
      tenantId: newStudent.tenant_id || '',
      isRead: this.options.autoRead,
      priority: 'high',
      actionUrl: `/students/${newStudent.id}`
    }

    return this.addNotification(notification)
  }

  /**
   * 알림 추가 및 리스너 실행
   */
  private addNotification(notification: StudentNotification): StudentNotification {
    if (this.options.persist) {
      this.notifications.unshift(notification)
      
      // 최대 100개까지만 보관
      if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100)
      }
    }

    // 모든 리스너에게 알림 전달
    this.listeners.forEach(listener => {
      try {
        listener(notification)
      } catch (error) {
        console.error('Notification listener error:', error)
      }
    })

    return notification
  }

  /**
   * 학생 데이터 변경사항 감지
   */
  private getStudentChanges(oldStudent: Student, newStudent: Student): string[] {
    const changes: string[] = []
    
    if (oldStudent.name !== newStudent.name) changes.push('이름')
    if (oldStudent.phone !== newStudent.phone) changes.push('전화번호')
    if (oldStudent.email !== newStudent.email) changes.push('이메일')
    if (oldStudent.grade_level !== newStudent.grade_level) changes.push('학년')
    if (oldStudent.status !== newStudent.status) changes.push('상태')
    if (oldStudent.parent_name_1 !== newStudent.parent_name_1) changes.push('학부모명')
    if (oldStudent.parent_phone_1 !== newStudent.parent_phone_1) changes.push('학부모 연락처')
    
    return changes
  }

  /**
   * 변경사항에 따른 알림 우선순위 결정
   */
  private getPriorityByChanges(changes: string[]): 'low' | 'medium' | 'high' {
    if (changes.includes('상태')) return 'high'
    if (changes.includes('전화번호') || changes.includes('학부모 연락처')) return 'medium'
    return 'low'
  }

  /**
   * 알림 리스너 추가
   */
  addListener(listener: (notification: StudentNotification) => void): () => void {
    this.listeners.push(listener)
    
    // 구독 해제 함수 반환
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  markAllAsRead(tenantId?: string): void {
    this.notifications.forEach(notification => {
      if (!tenantId || notification.tenantId === tenantId) {
        notification.isRead = true
      }
    })
  }

  /**
   * 알림 목록 조회
   */
  getNotifications(tenantId?: string, limit: number = 50): StudentNotification[] {
    let notifications = this.notifications
    
    if (tenantId) {
      notifications = notifications.filter(n => n.tenantId === tenantId)
    }
    
    return notifications.slice(0, limit)
  }

  /**
   * 읽지 않은 알림 개수
   */
  getUnreadCount(tenantId?: string): number {
    return this.getNotifications(tenantId).filter(n => !n.isRead).length
  }

  /**
   * 알림 삭제
   */
  removeNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId)
    if (index > -1) {
      this.notifications.splice(index, 1)
    }
  }

  /**
   * 알림 초기화
   */
  clear(tenantId?: string): void {
    if (tenantId) {
      this.notifications = this.notifications.filter(n => n.tenantId !== tenantId)
    } else {
      this.notifications = []
    }
  }
}

// 전역 인스턴스 (싱글톤 패턴)
export const studentNotifications = new StudentNotificationSystem()

/**
 * React Hook용 유틸리티 타입
 */
export interface UseStudentNotificationsReturn {
  notifications: StudentNotification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clear: () => void
}