'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  BellIcon,
  PhoneIcon,
  UserPlusIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// 알림 타입 정의
export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  category: 'student' | 'class' | 'payment' | 'attendance' | 'system'
  timestamp: Date
  read: boolean
  actionable?: boolean
  actions?: NotificationAction[]
  studentId?: string
  classId?: string
  urgent?: boolean
}

export interface NotificationAction {
  label: string
  type: 'primary' | 'secondary' | 'danger'
  action: () => void | Promise<void>
}

// 알림 스토어
class NotificationStore {
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(newNotification)
    this.notifyListeners()

    // 자동 toast 표시
    this.showToast(newNotification)
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.notifyListeners()
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notifyListeners()
  }

  getNotifications() {
    return this.notifications
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  private showToast(notification: Notification) {
    const icon = this.getIcon(notification.type)
    
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.5 }}
        className={cn(
          'max-w-md w-full backdrop-blur-xl rounded-lg shadow-2xl border p-4',
          'bg-white/90 dark:bg-neutral-900/90',
          'border-neutral-200/50 dark:border-neutral-800/50',
          notification.urgent && 'ring-2 ring-red-500/50 border-red-500/50'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            notification.type === 'success' && 'bg-green-100 dark:bg-green-900/30',
            notification.type === 'error' && 'bg-red-100 dark:bg-red-900/30',
            notification.type === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/30',
            notification.type === 'info' && 'bg-blue-100 dark:bg-blue-900/30'
          )}>
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                {notification.title}
              </h4>
              {notification.urgent && (
                <Badge variant="destructive" className="text-xs">긴급</Badge>
              )}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {notification.message}
            </p>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.type === 'primary' ? 'default' : 'outline'}
                    onClick={async () => {
                      toast.dismiss(t.id)
                      await action.action()
                    }}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6"
            onClick={() => toast.dismiss(t.id)}
          >
            <XCircleIcon className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    ), {
      duration: notification.urgent ? 8000 : 4000,
      position: 'top-right'
    })
  }

  private getIcon(type: Notification['type']) {
    const className = "h-4 w-4"
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={cn(className, 'text-green-600 dark:text-green-400')} />
      case 'error':
        return <XCircleIcon className={cn(className, 'text-red-600 dark:text-red-400')} />
      case 'warning':
        return <ExclamationTriangleIcon className={cn(className, 'text-yellow-600 dark:text-yellow-400')} />
      case 'info':
        return <InformationCircleIcon className={cn(className, 'text-blue-600 dark:text-blue-400')} />
      default:
        return <BellIcon className={cn(className, 'text-neutral-600 dark:text-neutral-400')} />
    }
  }
}

// 전역 알림 스토어 인스턴스
export const notificationStore = new NotificationStore()

// 알림 벨 컴포넌트
interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(setNotifications)
    setNotifications(notificationStore.getNotifications())
    return () => {
      unsubscribe()
    }
  }, [])

  const unreadCount = notificationStore.getUnreadCount()

  const handleMarkAllRead = () => {
    notificationStore.markAllAsRead()
  }

  const handleRemoveNotification = (id: string) => {
    notificationStore.removeNotification(id)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', className)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto
                     bg-white dark:bg-neutral-900 rounded-lg shadow-xl border
                     border-neutral-200 dark:border-neutral-800 z-50"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  알림 ({unreadCount})
                </h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                    모두 읽음
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                  <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>새로운 알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => handleRemoveNotification(notification.id)}
                    onMarkRead={() => notificationStore.markAsRead(notification.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// 개별 알림 아이템 컴포넌트
interface NotificationItemProps {
  notification: Notification
  onRemove: () => void
  onMarkRead: () => void
}

function NotificationItem({ notification, onRemove, onMarkRead }: NotificationItemProps) {
  const icon = getCategoryIcon(notification.category)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        'cursor-pointer transition-colors',
        !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
      )}
      onClick={() => !notification.read && onMarkRead()}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          'bg-neutral-100 dark:bg-neutral-800'
        )}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={cn(
              'font-medium text-sm',
              notification.read 
                ? 'text-neutral-600 dark:text-neutral-400' 
                : 'text-neutral-900 dark:text-neutral-100'
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2">
              {notification.urgent && (
                <Badge variant="destructive" className="text-xs">긴급</Badge>
              )}
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatTimeAgo(notification.timestamp)}
              </span>
            </div>
          </div>
          
          <p className={cn(
            'text-sm mt-1',
            notification.read 
              ? 'text-neutral-500 dark:text-neutral-500'
              : 'text-neutral-600 dark:text-neutral-300'
          )}>
            {notification.message}
          </p>

          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.type === 'primary' ? 'default' : 'outline'}
                  onClick={async (e) => {
                    e.stopPropagation()
                    await action.action()
                  }}
                  className="h-7 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-6 w-6 opacity-50 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <XCircleIcon className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// 카테고리별 아이콘
function getCategoryIcon(category: Notification['category']) {
  const className = "h-4 w-4 text-neutral-600 dark:text-neutral-400"
  
  switch (category) {
    case 'student':
      return <UserPlusIcon className={className} />
    case 'class':
      return <CalendarIcon className={className} />
    case 'payment':
      return <CheckCircleIcon className={className} />
    case 'attendance':
      return <BellIcon className={className} />
    default:
      return <InformationCircleIcon className={className} />
  }
}

// 시간 포매팅 함수
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

// 유틸리티 함수들
export const notifications = {
  success: (title: string, message: string, actions?: NotificationAction[]) => {
    notificationStore.addNotification({
      title,
      message,
      type: 'success',
      category: 'system',
      actions
    })
  },

  error: (title: string, message: string, actions?: NotificationAction[]) => {
    notificationStore.addNotification({
      title,
      message,
      type: 'error',
      category: 'system',
      urgent: true,
      actions
    })
  },

  warning: (title: string, message: string, actions?: NotificationAction[]) => {
    notificationStore.addNotification({
      title,
      message,
      type: 'warning',
      category: 'system',
      actions
    })
  },

  info: (title: string, message: string, actions?: NotificationAction[]) => {
    notificationStore.addNotification({
      title,
      message,
      type: 'info',
      category: 'system',
      actions
    })
  },

  studentUpdate: (studentName: string, action: string, studentId?: string, actions?: NotificationAction[]) => {
    notificationStore.addNotification({
      title: '학생 정보 업데이트',
      message: `${studentName} 학생 ${action}`,
      type: 'info',
      category: 'student',
      studentId,
      actions
    })
  },

  attendanceAlert: (studentName: string, status: string, urgent = false, actions?: NotificationAction[]) => {
    notificationStore.addNotification({
      title: '출석 알림',
      message: `${studentName} 학생 ${status}`,
      type: urgent ? 'warning' : 'info',
      category: 'attendance',
      urgent,
      actions
    })
  }
}