'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { studentQueryKeys } from '@/lib/react-query'
import { fetchStudentById } from '@/lib/api/students.api'
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
import type { Student } from '@/types/student.types'

interface QuickAccessPanelProps {
  selectedStudent: Student | null
  onStudentSelect: (student: Student) => void
  className?: string
}

// 즐겨찾기 학생 타입 (localStorage용)
interface FavoriteStudent {
  id: string
  name: string
  grade_level?: string
  status: string
  avatar_url?: string
  addedAt: number
}

// 최근 본 학생 타입 (localStorage용)
interface RecentStudent {
  id: string
  name: string
  grade_level?: string
  status: string
  avatar_url?: string
  viewedAt: number
}

// 빠른 통계 타입
interface QuickStats {
  totalStudents: number
  activeStudents: number
  todayEnrollments: number
  todayAttendance: number
}

// 알림 항목 타입
interface AlertItem {
  id: string
  type: 'overdue' | 'absence' | 'consultation' | 'enrollment'
  title: string
  count: number
  priority: 'high' | 'medium' | 'low'
}

export default function QuickAccessPanel({ 
  selectedStudent, 
  onStudentSelect,
  className = ''
}: QuickAccessPanelProps) {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [favoriteStudents, setFavoriteStudents] = useState<FavoriteStudent[]>([])
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalStudents: 0,
    activeStudents: 0,
    todayEnrollments: 0,
    todayAttendance: 0
  })
  const [alertItems, setAlertItems] = useState<AlertItem[]>([])

  // localStorage에서 즐겨찾기 학생 로드
  useEffect(() => {
    const stored = localStorage.getItem('favorite-students')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFavoriteStudents(parsed)
      } catch (error) {
        console.error('Failed to parse favorite students:', error)
      }
    }
  }, [])

  // localStorage에서 최근 본 학생 로드
  useEffect(() => {
    const stored = localStorage.getItem('recent-students')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // 최근 7일 내 기록만 유지
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const filtered = parsed.filter((s: RecentStudent) => s.viewedAt > oneWeekAgo)
        setRecentStudents(filtered.slice(0, 5)) // 최대 5개만
      } catch (error) {
        console.error('Failed to parse recent students:', error)
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
          totalStudents: 0,
          activeStudents: 0,
          todayEnrollments: 0,
          todayAttendance: 0
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

  // 선택된 학생이 변경될 때 최근 본 목록에 추가
  useEffect(() => {
    if (selectedStudent) {
      const recentStudent: RecentStudent = {
        id: selectedStudent.id,
        name: selectedStudent.name,
        grade_level: selectedStudent.grade_level || undefined,
        status: selectedStudent.status || 'active',
        avatar_url: selectedStudent.profile_image || undefined,
        viewedAt: Date.now()
      }

      setRecentStudents(prev => {
        // 중복 제거
        const filtered = prev.filter(s => s.id !== selectedStudent.id)
        const updated = [recentStudent, ...filtered].slice(0, 5)
        
        // localStorage에 저장
        try {
          localStorage.setItem('recent-students', JSON.stringify(updated))
        } catch (error) {
          console.error('Failed to save recent students:', error)
        }
        
        return updated
      })
    }
  }, [selectedStudent])

  // 즐겨찾기 토글
  const toggleFavorite = (student: Student | RecentStudent | FavoriteStudent) => {
    const studentId = student.id
    const isCurrentlyFavorite = favoriteStudents.some(s => s.id === studentId)
    
    if (isCurrentlyFavorite) {
      // 즐겨찾기에서 제거
      const updated = favoriteStudents.filter(s => s.id !== studentId)
      setFavoriteStudents(updated)
      localStorage.setItem('favorite-students', JSON.stringify(updated))
    } else {
      // 즐겨찾기에 추가
      const favoriteStudent: FavoriteStudent = {
        id: student.id,
        name: student.name,
        grade_level: 'grade_level' in student ? student.grade_level || undefined : undefined,
        status: student.status || 'active',
        avatar_url: 'avatar_url' in student ? student.avatar_url || undefined : 'profile_image' in student ? student.profile_image || undefined : undefined,
        addedAt: Date.now()
      }
      const updated = [...favoriteStudents, favoriteStudent].slice(0, 10) // 최대 10개
      setFavoriteStudents(updated)
      localStorage.setItem('favorite-students', JSON.stringify(updated))
    }
  }

  // 상태별 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '재학중'
      case 'inactive': return '휴학'
      case 'graduated': return '졸업'
      case 'withdrawn': return '자퇴'
      case 'suspended': return '정학'
      default: return status
    }
  }

  // 상태별 배지 색상
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'graduated': return 'outline'
      case 'withdrawn': return 'destructive'
      case 'suspended': return 'destructive'
      default: return 'secondary'
    }
  }

  // 알림 아이콘 가져오기
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return CurrencyDollarIcon
      case 'absence': return CalendarDaysIcon
      case 'consultation': return UserGroupIcon
      case 'enrollment': return AcademicCapIcon
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
      {/* 즐겨찾기 학생들 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <StarSolidIcon className="h-4 w-4 mr-2 text-yellow-500" />
            즐겨찾기 ({favoriteStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favoriteStudents.length === 0 ? (
            <div className="text-center py-4">
              <StarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                자주 확인하는 학생을<br />즐겨찾기에 추가하세요
              </p>
            </div>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {favoriteStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={async () => {
                      // API에서 전체 학생 정보 가져오기
                      if (profile?.tenant_id) {
                        try {
                          const result = await queryClient.fetchQuery({
                            queryKey: studentQueryKeys.detail(student.id),
                            queryFn: () => fetchStudentById(student.id, profile.tenant_id!)
                          })
                          if (result?.student) {
                            onStudentSelect(result.student)
                          }
                        } catch (error) {
                          console.error('Failed to fetch favorite student:', error)
                        }
                      }
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {student.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.grade_level || '학년 미상'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(student)
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

      {/* 최근 본 학생들 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
            최근 본 학생 ({recentStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <div className="text-center py-4">
              <EyeIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                최근 확인한 학생들이<br />여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentStudents.map((student) => {
                const isFromToday = Date.now() - student.viewedAt < 24 * 60 * 60 * 1000
                const timeAgo = isFromToday ? 
                  `${Math.floor((Date.now() - student.viewedAt) / (60 * 1000))}분 전` :
                  `${Math.floor((Date.now() - student.viewedAt) / (24 * 60 * 60 * 1000))}일 전`

                return (
                  <div
                    key={student.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={async () => {
                      // API에서 전체 학생 정보 가져오기
                      if (profile?.tenant_id) {
                        try {
                          const result = await queryClient.fetchQuery({
                            queryKey: studentQueryKeys.detail(student.id),
                            queryFn: () => fetchStudentById(student.id, profile.tenant_id!)
                          })
                          if (result?.student) {
                            onStudentSelect(result.student)
                          }
                        } catch (error) {
                          console.error('Failed to fetch recent student:', error)
                        }
                      }
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {student.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {student.name}
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
                        toggleFavorite(student)
                      }}
                    >
                      {favoriteStudents.some(f => f.id === student.id) ? (
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
                {quickStats.activeStudents}
              </p>
              <p className="text-blue-600 dark:text-blue-400">출석중</p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="font-semibold text-green-700 dark:text-green-300">
                {quickStats.todayEnrollments}
              </p>
              <p className="text-green-600 dark:text-green-400">신규등록</p>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              총 {quickStats.totalStudents}명 재학중
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}