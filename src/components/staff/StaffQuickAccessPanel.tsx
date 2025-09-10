'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useInstructor } from '@/hooks/queries'
import { instructorQueryKeys } from '@/lib/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  StarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid'
import type { Instructor, StaffInfo } from '@/types/staff.types'

interface StaffQuickAccessPanelProps {
  selectedInstructor: Instructor | null
  onInstructorSelect: (instructor: Instructor) => void
  className?: string
}

// 즐겨찾기 강사 타입 (localStorage용)
interface FavoriteInstructor {
  id: string
  name: string
  department?: string
  status: string
  avatar_url?: string
  addedAt: number
}

// 최근 본 강사 타입 (localStorage용)
interface RecentInstructor {
  id: string
  name: string
  department?: string
  status: string
  avatar_url?: string
  viewedAt: number
}

// 빠른 통계 타입
interface QuickStats {
  totalInstructors: number
  activeInstructors: number
  todayClasses: number
  avgWorkingHours: number
}

// 알림 항목 타입
interface AlertItem {
  id: string
  type: 'schedule' | 'absence' | 'evaluation' | 'contract'
  title: string
  count: number
  priority: 'high' | 'medium' | 'low'
}

export default function StaffQuickAccessPanel({ 
  selectedInstructor, 
  onInstructorSelect,
  className = ''
}: StaffQuickAccessPanelProps) {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [favoriteInstructors, setFavoriteInstructors] = useState<FavoriteInstructor[]>([])
  const [recentInstructors, setRecentInstructors] = useState<RecentInstructor[]>([])
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalInstructors: 0,
    activeInstructors: 0,
    todayClasses: 0,
    avgWorkingHours: 0
  })
  const [alertItems, setAlertItems] = useState<AlertItem[]>([])

  // localStorage에서 즐겨찾기 강사 로드
  useEffect(() => {
    const stored = localStorage.getItem('favorite-instructors')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFavoriteInstructors(parsed)
      } catch (error) {
        console.error('Failed to parse favorite instructors:', error)
      }
    }
  }, [])

  // localStorage에서 최근 본 강사 로드
  useEffect(() => {
    const stored = localStorage.getItem('recent-instructors')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // 최근 7일 내 기록만 유지
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const filtered = parsed.filter((s: RecentInstructor) => s.viewedAt > oneWeekAgo)
        setRecentInstructors(filtered.slice(0, 5)) // 최대 5개만
      } catch (error) {
        console.error('Failed to parse recent instructors:', error)
      }
    }
  }, [])

  // 빠른 통계 로드
  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        // TODO: 실제 API 연동
        // 현재는 기본값 사용
        setQuickStats({
          totalInstructors: 0,
          activeInstructors: 0,
          todayClasses: 0,
          avgWorkingHours: 0
        })
      } catch (error) {
        console.error('Failed to fetch quick stats:', error)
      }
    }

    fetchQuickStats()
  }, [])

  // 알림 항목 로드  
  useEffect(() => {
    const fetchAlertItems = async () => {
      try {
        // TODO: 실제 API 연동
        // 현재는 빈 배열 사용
        setAlertItems([])
      } catch (error) {
        console.error('Failed to fetch alert items:', error)
      }
    }

    fetchAlertItems()
  }, [])

  // 선택된 강사가 변경될 때 최근 본 목록에 추가
  useEffect(() => {
    if (selectedInstructor) {
      const recentInstructor: RecentInstructor = {
        id: selectedInstructor.id,
        name: selectedInstructor.user?.name || '이름 없음',
        department: (selectedInstructor.staff_info as StaffInfo)?.department || undefined,
        status: selectedInstructor.status || 'active',
        avatar_url: selectedInstructor.user?.avatar_url || undefined,
        viewedAt: Date.now()
      }

      setRecentInstructors(prev => {
        // 중복 제거
        const filtered = prev.filter(s => s.id !== selectedInstructor.id)
        const updated = [recentInstructor, ...filtered].slice(0, 5)
        
        // localStorage에 저장
        try {
          localStorage.setItem('recent-instructors', JSON.stringify(updated))
        } catch (error) {
          console.error('Failed to save recent instructors:', error)
        }
        
        return updated
      })
    }
  }, [selectedInstructor])

  // 즐겨찾기 토글
  const toggleFavorite = (instructor: Instructor | RecentInstructor | FavoriteInstructor) => {
    const instructorId = instructor.id
    const isCurrentlyFavorite = favoriteInstructors.some(s => s.id === instructorId)
    
    if (isCurrentlyFavorite) {
      // 즐겨찾기에서 제거
      const updated = favoriteInstructors.filter(s => s.id !== instructorId)
      setFavoriteInstructors(updated)
      localStorage.setItem('favorite-instructors', JSON.stringify(updated))
    } else {
      // 즐겨찾기에 추가
      const favoriteInstructor: FavoriteInstructor = {
        id: instructor.id,
        name: ('user' in instructor && instructor.user?.name) || ('name' in instructor && instructor.name) || '이름 없음',
        department: 'department' in instructor ? instructor.department || undefined : 'staff_info' in instructor ? (instructor.staff_info as StaffInfo)?.department : undefined,
        status: instructor.status || 'active',
        avatar_url: ('avatar_url' in instructor ? instructor.avatar_url : 'user' in instructor ? instructor.user?.avatar_url : undefined) || undefined,
        addedAt: Date.now()
      }
      const updated = [...favoriteInstructors, favoriteInstructor].slice(0, 10) // 최대 10개
      setFavoriteInstructors(updated)
      localStorage.setItem('favorite-instructors', JSON.stringify(updated))
    }
  }

  // 상태별 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'pending': return '대기중'
      default: return status
    }
  }

  // 상태별 배지 색상
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'pending': return 'outline'
      default: return 'secondary'
    }
  }

  // 알림 아이콘 가져오기
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'schedule': return CalendarDaysIcon
      case 'absence': return ExclamationTriangleIcon
      case 'evaluation': return AcademicCapIcon
      case 'contract': return CurrencyDollarIcon
      default: return ExclamationTriangleIcon
    }
  }

  // 알림 우선순위별 색상
  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950'
      case 'medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-950'
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 즐겨찾기 강사들 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <StarSolidIcon className="h-4 w-4 mr-2 text-yellow-500" />
            즐겨찾기 ({favoriteInstructors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favoriteInstructors.length === 0 ? (
            <div className="text-center py-4">
              <StarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                자주 확인하는 강사를<br />즐겨찾기에 추가하세요
              </p>
            </div>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {favoriteInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={async () => {
                      // API에서 전체 강사 정보 가져오기
                      if (profile?.tenant_id) {
                        try {
                          // TODO: Implement proper instructor fetch - for now use the queryClient to get cached data
                          const cachedData = queryClient.getQueryData(instructorQueryKeys.listsWithFilters())
                          if (cachedData) {
                            const fullInstructor = (cachedData as any).instructors?.find((i: Instructor) => i.id === instructor.id)
                            if (fullInstructor) {
                              onInstructorSelect(fullInstructor)
                            }
                          }
                        } catch (error) {
                          console.error('Failed to fetch favorite instructor:', error)
                        }
                      }
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={instructor.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {instructor.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {instructor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {instructor.department || '부서 미상'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(instructor)
                      }}
                    >
                      <StarSolidIcon className="h-3 w-3 text-yellow-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 최근 본 강사들 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
            최근 본 강사 ({recentInstructors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentInstructors.length === 0 ? (
            <div className="text-center py-4">
              <EyeIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                최근 확인한 강사들이<br />여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInstructors.map((instructor) => {
                const isFromToday = Date.now() - instructor.viewedAt < 24 * 60 * 60 * 1000
                const timeAgo = isFromToday ? 
                  `${Math.floor((Date.now() - instructor.viewedAt) / (60 * 1000))}분 전` :
                  `${Math.floor((Date.now() - instructor.viewedAt) / (24 * 60 * 60 * 1000))}일 전`

                return (
                  <div
                    key={instructor.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={async () => {
                      // API에서 전체 강사 정보 가져오기
                      if (profile?.tenant_id) {
                        try {
                          // TODO: Implement proper instructor fetch - for now use the queryClient to get cached data
                          const cachedData = queryClient.getQueryData(instructorQueryKeys.listsWithFilters())
                          if (cachedData) {
                            const fullInstructor = (cachedData as any).instructors?.find((i: Instructor) => i.id === instructor.id)
                            if (fullInstructor) {
                              onInstructorSelect(fullInstructor)
                            }
                          }
                        } catch (error) {
                          console.error('Failed to fetch recent instructor:', error)
                        }
                      }
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={instructor.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {instructor.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {instructor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {timeAgo}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(instructor)
                      }}
                    >
                      {favoriteInstructors.some(f => f.id === instructor.id) ? (
                        <StarSolidIcon className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <StarIcon className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 처리 필요 알림 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-red-500" />
            처리 필요 ({alertItems.reduce((sum, item) => sum + item.count, 0)}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alertItems.map((alert) => {
              const Icon = getAlertIcon(alert.type)
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:opacity-80 ${getAlertColor(alert.priority)}`}
                  onClick={() => {
                    // TODO: 해당 알림 타입별 액션 처리
                    console.log('Handle alert:', alert.type)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{alert.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {alert.count}명
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 빠른 통계 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-2 text-green-500" />
            오늘의 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                {quickStats.activeInstructors}
              </p>
              <p className="text-blue-600 dark:text-blue-400">근무중</p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="font-semibold text-green-700 dark:text-green-300">
                {quickStats.todayClasses}
              </p>
              <p className="text-green-600 dark:text-green-400">오늘 수업</p>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              총 {quickStats.totalInstructors}명 등록
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}