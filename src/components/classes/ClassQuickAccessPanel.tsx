'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useClasses } from '@/hooks/queries/useClasses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import type { Class } from '@/types/class.types'

interface ClassQuickAccessPanelProps {
  selectedClass: Class | null
  onClassSelect: (classItem: Class) => void
  className?: string
}

// 즐겨찾기 클래스 타입 (localStorage용)
interface FavoriteClass {
  id: string
  name: string
  instructor_name?: string
  status: 'active' | 'inactive' | 'completed' | 'cancelled' | null | undefined
  student_count: number
  addedAt: number
}

// 최근 본 클래스 타입 (localStorage용)
interface RecentClass {
  id: string
  name: string
  instructor_name?: string
  status: 'active' | 'inactive' | 'completed' | 'cancelled' | null | undefined
  student_count: number
  viewedAt: number
}

export default function ClassQuickAccessPanel({ 
  selectedClass, 
  onClassSelect, 
  className = '' 
}: ClassQuickAccessPanelProps) {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [favoriteClasses, setFavoriteClasses] = useState<FavoriteClass[]>([])
  const [recentClasses, setRecentClasses] = useState<RecentClass[]>([])
  
  const tenantId = profile?.tenant_id

  // localStorage 키
  const FAVORITES_KEY = `educanvas_favorite_classes_${tenantId}`
  const RECENTS_KEY = `educanvas_recent_classes_${tenantId}`

  // 컴포넌트 마운트 시 localStorage에서 데이터 로드
  useEffect(() => {
    if (!tenantId) return

    try {
      const savedFavorites = localStorage.getItem(FAVORITES_KEY)
      if (savedFavorites) {
        setFavoriteClasses(JSON.parse(savedFavorites))
      }

      const savedRecents = localStorage.getItem(RECENTS_KEY)
      if (savedRecents) {
        setRecentClasses(JSON.parse(savedRecents))
      }
    } catch (error) {
      console.error('Failed to load quick access data:', error)
    }
  }, [tenantId, FAVORITES_KEY, RECENTS_KEY])

  // 선택된 클래스가 변경될 때 최근 본 클래스에 추가
  useEffect(() => {
    if (!selectedClass || !tenantId) return

    const recentClass: RecentClass = {
      id: selectedClass.id,
      name: selectedClass.name,
      instructor_name: selectedClass.instructor?.name,
      status: selectedClass.is_active ? 'active' : 'inactive',
      student_count: selectedClass.student_count || 0,
      viewedAt: Date.now()
    }

    setRecentClasses(prev => {
      // 중복 제거 및 최대 10개까지만 유지
      const filtered = prev.filter(item => item.id !== selectedClass.id)
      const updated = [recentClass, ...filtered].slice(0, 10)
      
      // localStorage에 저장
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save recent classes:', error)
      }
      
      return updated
    })
  }, [selectedClass, tenantId, RECENTS_KEY])

  // 즐겨찾기 토글
  const toggleFavorite = (classItem: Class) => {
    if (!tenantId) return

    const favoriteClass: FavoriteClass = {
      id: classItem.id,
      name: classItem.name,
      instructor_name: classItem.instructor?.name,
      status: classItem.is_active ? 'active' : 'inactive',
      student_count: classItem.student_count || 0,
      addedAt: Date.now()
    }

    setFavoriteClasses(prev => {
      const isAlreadyFavorite = prev.some(item => item.id === classItem.id)
      let updated: FavoriteClass[]
      
      if (isAlreadyFavorite) {
        updated = prev.filter(item => item.id !== classItem.id)
      } else {
        updated = [favoriteClass, ...prev].slice(0, 20) // 최대 20개
      }

      // localStorage에 저장
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save favorite classes:', error)
      }
      
      return updated
    })
  }

  // 클래스 선택 및 데이터 로드
  const handleClassSelect = async (classData: FavoriteClass | RecentClass) => {
    try {
      // 캐시에서 전체 클래스 데이터 조회 시도
      const cachedClass = queryClient.getQueryData(['classes', classData.id]) as Class | undefined
      
      if (cachedClass) {
        onClassSelect(cachedClass)
      } else {
        // 캐시에 없으면 최소한의 데이터로 Class 객체 생성
        const classItem: Class = {
          id: classData.id,
          name: classData.name,
          tenant_id: tenantId || '',
          is_active: classData.status === 'active',
          instructor: classData.instructor_name ? { name: classData.instructor_name } : null,
          student_count: classData.student_count,
          status: classData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        onClassSelect(classItem)
      }
    } catch (error) {
      console.error('Failed to select class:', error)
    }
  }

  const isFavorite = (classId: string) => {
    return favoriteClasses.some(item => item.id === classId)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 즐겨찾기 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <StarSolidIcon className="w-4 h-4 text-yellow-500" />
            <span>즐겨찾기 클래스</span>
            <Badge variant="secondary" className="text-xs">
              {favoriteClasses.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {favoriteClasses.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <StarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">즐겨찾기한 클래스가 없습니다</p>
              <p className="text-xs mt-1">클래스 선택 후 ⭐ 버튼을 눌러보세요</p>
            </div>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {favoriteClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleClassSelect(classItem)}
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-educanvas-100 text-educanvas-700">
                        <AcademicCapIcon className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {classItem.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {classItem.instructor_name || '강사 미배정'} • {classItem.student_count}명
                      </p>
                    </div>
                    <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {classItem.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 최근 본 클래스 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-blue-500" />
            <span>최근 본 클래스</span>
            <Badge variant="secondary" className="text-xs">
              {recentClasses.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentClasses.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">최근 본 클래스가 없습니다</p>
            </div>
          ) : (
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {recentClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleClassSelect(classItem)}
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-educanvas-100 text-educanvas-700">
                        <AcademicCapIcon className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {classItem.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {classItem.instructor_name || '강사 미배정'} • {classItem.student_count}명
                      </p>
                    </div>
                    <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {classItem.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 빠른 액세스 버튼들 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">빠른 액세스</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // 오늘 수업 필터링 로직
              console.log('오늘 수업 보기')
            }}
          >
            <CalendarDaysIcon className="w-4 h-4 mr-2" />
            오늘 수업
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // 활성 클래스 필터링 로직
              console.log('활성 클래스 보기')
            }}
          >
            <ChartBarIcon className="w-4 h-4 mr-2" />
            활성 클래스
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // 수강생 많은 클래스 정렬 로직
              console.log('인기 클래스 보기')
            }}
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            인기 클래스
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // 주의 필요 클래스 보기 로직
              console.log('주의 필요 클래스 보기')
            }}
          >
            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
            주의 필요
          </Button>
        </CardContent>
      </Card>

      {/* 선택된 클래스 즐겨찾기 토글 */}
      {selectedClass && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">선택된 클래스</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedClass.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedClass.instructor?.name || '강사 미배정'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(selectedClass)}
                className="flex-shrink-0"
              >
                {isFavorite(selectedClass.id) ? (
                  <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                ) : (
                  <StarIcon className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}