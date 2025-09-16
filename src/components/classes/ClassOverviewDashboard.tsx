'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useClassesDashboardStats, useClasses } from '@/hooks/queries/useClasses'
import { useAuthStore } from '@/store/useAuthStore'
import {
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import type { Class } from '@/types/class.types'

interface ClassOverviewDashboardProps {
  onClassSelect: (classItem: Class) => void
  onCreateClass: () => void
}

export default function ClassOverviewDashboard({ onClassSelect, onCreateClass }: ClassOverviewDashboardProps) {
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  const { data: stats, isLoading: isStatsLoading } = useClassesDashboardStats(tenantId || '', { enabled: !!tenantId })
  const { data: classesData, isLoading: isClassesLoading } = useClasses({ 
    tenantId: tenantId || '', 
    enabled: !!tenantId 
  })

  const classes = Array.isArray(classesData?.items) ? classesData.items : []

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              클래스 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              전체 클래스 현황을 확인하고 관리하세요
            </p>
          </div>
          <Button onClick={onCreateClass} size="lg" className="bg-educanvas-500 hover:bg-educanvas-600">
            <PlusIcon className="w-5 h-5 mr-2" />
            새 클래스 등록
          </Button>
        </div>

        {/* 통계 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 클래스</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {isStatsLoading ? '...' : stats?.totalClasses || 0}
                  </p>
                </div>
                <div className="p-3 bg-educanvas-100 dark:bg-educanvas-900 rounded-lg">
                  <AcademicCapIcon className="w-6 h-6 text-educanvas-600 dark:text-educanvas-400" />
                </div>
              </div>
              {stats?.activeClasses !== undefined && (
                <div className="mt-4 flex items-center text-sm">
                  <Badge variant="secondary" className="mr-2">
                    활성: {stats.activeClasses}개
                  </Badge>
                  <span className="text-gray-500 dark:text-gray-400">
                    비활성: {(stats.totalClasses || 0) - stats.activeClasses}개
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 수강생</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {isStatsLoading ? '...' : stats?.totalStudents || 0}
                  </p>
                </div>
                <div className="p-3 bg-wisdom-100 dark:bg-wisdom-900 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-wisdom-600 dark:text-wisdom-400" />
                </div>
              </div>
              {stats?.avgClassSize !== undefined && (
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    평균 {stats.avgClassSize}명/클래스
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">이번 달 수익</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {isStatsLoading ? '...' : `₩${(stats?.monthlyRevenue || 0).toLocaleString()}`}
                  </p>
                </div>
                <div className="p-3 bg-growth-100 dark:bg-growth-900 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-growth-600 dark:text-growth-400" />
                </div>
              </div>
              {stats?.revenueGrowth !== undefined && (
                <div className="mt-4 flex items-center text-sm">
                  {stats.revenueGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% 전월 대비
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 출석률</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {isStatsLoading ? '...' : `${stats?.avgAttendanceRate || 0}%`}
                  </p>
                </div>
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
              </div>
              {stats?.attendanceChange !== undefined && (
                <div className="mt-4 flex items-center text-sm">
                  {stats.attendanceChange >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={stats.attendanceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {stats.attendanceChange >= 0 ? '+' : ''}{stats.attendanceChange}% 지난 주 대비
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 전체 클래스 목록 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AcademicCapIcon className="w-5 h-5" />
                <span>전체 클래스 목록</span>
                <Badge variant="secondary" className="text-xs">
                  {classes.length}개
                </Badge>
              </div>
              {classes.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => console.log('전체보기')}>
                  전체보기
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClassesLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-educanvas-500 mx-auto mb-2"></div>
                <p>클래스 목록을 불러오는 중...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-2">등록된 클래스가 없습니다</p>
                <p className="text-xs mb-4">새 클래스를 등록하여 학원 관리를 시작하세요</p>
                <Button onClick={onCreateClass} className="bg-educanvas-500 hover:bg-educanvas-600">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  첫 번째 클래스 등록하기
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.slice(0, 6).map((classItem) => (
                  <Card 
                    key={classItem.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onClassSelect(classItem)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-educanvas-100 text-educanvas-700">
                            <AcademicCapIcon className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {classItem.name}
                            </h4>
                            <Badge 
                              variant={classItem.is_active ? 'default' : 'secondary'}
                              className="text-xs ml-2"
                            >
                              {classItem.is_active ? '활성' : '비활성'}
                            </Badge>
                          </div>
                          
                          {classItem.instructor?.name && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              강사: {classItem.instructor.name}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <UsersIcon className="h-3 w-3" />
                              <span>{classItem.student_count || 0}명</span>
                            </div>
                            {classItem.subject && (
                              <span>{classItem.subject}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {classes.length > 6 && (
              <div className="text-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => console.log('더 많은 클래스 보기')}
                  className="w-full sm:w-auto"
                >
                  더 많은 클래스 보기 ({classes.length - 6}개 더)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 액세스 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlusIcon className="w-5 h-5" />
                <span>빠른 시작</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={onCreateClass} 
                className="w-full justify-start h-12 bg-educanvas-50 hover:bg-educanvas-100 text-educanvas-700 border border-educanvas-200"
                variant="outline"
              >
                <AcademicCapIcon className="w-5 h-5 mr-3" />
                새 클래스 등록
              </Button>
              
              <Button 
                className="w-full justify-start h-12 bg-wisdom-50 hover:bg-wisdom-100 text-wisdom-700 border border-wisdom-200"
                variant="outline"
                onClick={() => console.log('클래스 템플릿 사용')}
              >
                <ClockIcon className="w-5 h-5 mr-3" />
                템플릿으로 빠른 생성
              </Button>
              
              <Button 
                className="w-full justify-start h-12 bg-growth-50 hover:bg-growth-100 text-growth-700 border border-growth-200"
                variant="outline"
                onClick={() => console.log('클래스 복사')}
              >
                <CalendarIcon className="w-5 h-5 mr-3" />
                기존 클래스 복사
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>최근 동향</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">새 클래스 등록</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">2시간 전</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">수강생 추가</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">4시간 전</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">시간표 변경</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">1일 전</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 도움말 섹션 */}
        <Card className="bg-gradient-to-r from-educanvas-50 to-wisdom-50 dark:from-educanvas-900/20 dark:to-wisdom-900/20 border-educanvas-200 dark:border-educanvas-700">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-educanvas-100 dark:bg-educanvas-800 rounded-lg">
                <AcademicCapIcon className="w-6 h-6 text-educanvas-600 dark:text-educanvas-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  클래스 관리 시작하기
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  왼쪽 사이드바에서 클래스를 검색하고 선택하여 상세 정보를 확인하세요. 
                  새로운 클래스를 등록하거나 기존 클래스를 수정할 수 있습니다.
                </p>
                <div className="flex space-x-3">
                  <Button size="sm" className="bg-educanvas-500 hover:bg-educanvas-600">
                    도움말 보기
                  </Button>
                  <Button size="sm" variant="outline">
                    비디오 튜토리얼
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}