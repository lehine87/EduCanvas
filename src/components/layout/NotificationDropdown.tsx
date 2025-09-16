'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  BellIcon,
  CheckIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import type { NotificationItem, NotificationDropdownProps } from './types'

/**
 * 알림 드롭다운 컴포넌트
 * @description 사용자 알림을 표시하는 드롭다운
 */
export function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  // 알림 클릭 핸들러
  const handleNotificationClick = useCallback((notification: NotificationItem) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    setIsOpen(false)
  }, [onMarkAsRead])

  // 모두 읽음 처리
  const handleMarkAllAsRead = useCallback(() => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead()
    }
  }, [onMarkAllAsRead])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors',
          isOpen && 'bg-gray-100 text-gray-500'
        )}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개 안읽음)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-5 w-5" />
        ) : (
          <BellIcon className="h-5 w-5" />
        )}
        
        {/* 알림 배지 */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-text-100 text-xs font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                알림
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({unreadCount}개 안읽음)
                  </span>
                )}
              </h3>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && onMarkAllAsRead && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    모두 읽음
                  </button>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                      !notification.read && 'bg-blue-50 hover:bg-blue-100'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 아이콘 */}
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          getNotificationIcon(notification.type)
                        )}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm',
                          !notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
                        )}>
                          {notification.title}
                        </p>
                        
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(notification.timestamp, { 
                              addSuffix: true,
                              locale: ko 
                            })}
                          </span>
                          
                          {notification.actionLabel && (
                            <span className="text-xs text-blue-600 hover:text-blue-700">
                              {notification.actionLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 읽음 표시 */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  새로운 알림이 없습니다
                </p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && onViewAll && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => {
                  onViewAll()
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                모든 알림 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 샘플 알림 데이터 생성 (개발용)
 */
export function generateSampleNotifications(): NotificationItem[] {
  return [
    {
      id: '1',
      type: 'info',
      title: '새로운 학생 등록',
      message: '김민수 학생이 수학반에 등록되었습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
      read: false,
      actionUrl: '/admin/students',
      actionLabel: '확인하기'
    },
    {
      id: '2',
      type: 'success',
      title: '결제 완료',
      message: '이영희 학부모님의 수강료 결제가 완료되었습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
      read: false,
      actionUrl: '/admin/payments',
      actionLabel: '상세보기'
    },
    {
      id: '3',
      type: 'warning',
      title: '출결 확인 필요',
      message: '오늘 수업의 출결 체크가 아직 완료되지 않았습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
      read: true,
      actionUrl: '/admin/attendance',
      actionLabel: '출결 체크'
    },
    {
      id: '4',
      type: 'error',
      title: '시스템 오류',
      message: '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
      read: true
    }
  ]
}