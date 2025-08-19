'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// 스마트 액션 카드 타입
interface ActionCard {
  id: string
  title: string
  count: number
  priority: 'high' | 'medium' | 'low'
  icon: React.ReactNode
  color: string
  action: () => void
  description: string
}

// 대시보드 통계 타입
interface DashboardStats {
  total_students: number
  active_students: number
  inactive_students: number
  graduated_students: number
  withdrawn_students: number
  suspended_students: number
  urgent_actions: number
  today_attendance: number
  unpaid_students: number
  consultation_scheduled: number
  new_registrations_this_month: number
  recent_activities: Array<{
    id: string
    student_name: string
    action: string
    timestamp: string
  }>
}

// 빠른 접근 학생 타입
interface QuickAccessStudent {
  id: string
  name: string
  reason: '최근_수정' | '오늘_출석' | '미납금' | '상담_예정' | '신규_등록'
  timestamp: string
  priority: number
}

export default function StudentDashboard() {
  const { profile } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<QuickAccessStudent[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // 실제 데이터 로드
  const fetchDashboardStats = useCallback(async () => {
    if (!profile?.tenant_id) return

    setIsLoadingStats(true)
    try {
      const response = await fetch(`/api/students/dashboard-stats?tenantId=${profile.tenant_id}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('대시보드 통계 로드 실패:', error)
      // 에러 시 기본값 설정
      setStats({
        total_students: 0,
        active_students: 0,
        inactive_students: 0,
        graduated_students: 0,
        withdrawn_students: 0,
        suspended_students: 0,
        urgent_actions: 0,
        today_attendance: 0,
        unpaid_students: 0,
        consultation_scheduled: 0,
        new_registrations_this_month: 0,
        recent_activities: []
      })
    } finally {
      setIsLoadingStats(false)
    }
  }, [profile?.tenant_id])

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  // 스마트 액션 카드들 (실제 데이터 사용)
  const actionCards: ActionCard[] = useMemo(() => [
    {
      id: 'urgent_actions',
      title: '긴급 처리 필요',
      count: stats?.urgent_actions || 0,
      priority: 'high',
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: 'bg-red-500',
      description: '미납금, 장기결석, 상담요청',
      action: () => console.log('긴급 처리')
    },
    {
      id: 'today_attendance',
      title: '오늘 출석 관리',
      count: stats?.today_attendance || 0,
      priority: 'medium',
      icon: <ClockIcon className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: '출석체크, 지각/결석 처리',
      action: () => console.log('출석 관리')
    },
    {
      id: 'payment_due',
      title: '수강료 관리',
      count: stats?.unpaid_students || 0,
      priority: 'medium',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'bg-yellow-500',
      description: '납부예정, 연체, 환불',
      action: () => console.log('수강료 관리')
    },
    {
      id: 'consultations',
      title: '상담 일정',
      count: stats?.consultation_scheduled || 0,
      priority: 'low',
      icon: <PhoneIcon className="h-6 w-6" />,
      color: 'bg-green-500',
      description: '오늘 예정된 학부모 상담',
      action: () => console.log('상담 관리')
    },
    {
      id: 'class_management',
      title: '클래스 이동',
      count: 0, // TODO: 실제 클래스 이동 요청 수
      priority: 'low',
      icon: <AcademicCapIcon className="h-6 w-6" />,
      color: 'bg-purple-500',
      description: '레벨업, 반편성, 대기자',
      action: () => console.log('클래스 관리')
    },
    {
      id: 'analytics',
      title: '학습 분석',
      count: stats?.active_students || 0,
      priority: 'low',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'bg-indigo-500',
      description: '성취도, 진도, 학습패턴',
      action: () => console.log('분석 보기')
    }
  ], [stats])

  // 스마트 검색 핸들러
  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // 실제 구현시에는 백엔드 API 호출
    try {
      // 시뮬레이션: 다양한 검색 패턴 지원
      const mockResults: QuickAccessStudent[] = [
        { id: '1', name: '김민수', reason: '최근_수정' as const, timestamp: new Date().toISOString(), priority: 2 },
        { id: '2', name: '이수진', reason: '오늘_출석' as const, timestamp: new Date().toISOString(), priority: 1 },
        { id: '3', name: '박진우', reason: '미납금' as const, timestamp: new Date().toISOString(), priority: 3 },
      ].filter(item => 
        item.name.toLowerCase().includes(term.toLowerCase())
      )
      
      setTimeout(() => {
        setSearchResults(mockResults)
        setIsSearching(false)
      }, 300)
    } catch (error) {
      setIsSearching(false)
    }
  }, [])

  // 빠른 접근 학생 목록 (실제 데이터 기반)
  const quickAccessStudents: QuickAccessStudent[] = useMemo(() => {
    if (!stats?.recent_activities) return []
    
    return stats.recent_activities.map((activity, index) => ({
      id: activity.id,
      name: activity.student_name,
      reason: '최근_수정' as const,
      timestamp: new Date(activity.timestamp).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      priority: index + 1
    }))
  }, [stats?.recent_activities])

  const getReasonBadge = (reason: QuickAccessStudent['reason']) => {
    const styles = {
      '최근_수정': 'bg-blue-100 text-blue-800',
      '오늘_출석': 'bg-green-100 text-green-800',
      '미납금': 'bg-red-100 text-red-800',
      '상담_예정': 'bg-yellow-100 text-yellow-800',
      '신규_등록': 'bg-purple-100 text-purple-800'
    }
    
    const labels = {
      '최근_수정': '최근 수정',
      '오늘_출석': '출석',
      '미납금': '미납금',
      '상담_예정': '상담예정',
      '신규_등록': '신규'
    }

    return (
      <Badge className={styles[reason]}>
        {labels[reason]}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                스마트 학생관리 대시보드
              </h1>
              <p className="text-gray-600">
                검색과 AI로 효율적인 학생관리를 경험하세요
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchDashboardStats}
              disabled={isLoadingStats}
              className="flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
          
          {/* 통계 요약 */}
          {isLoadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">전체 학생</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_students.toLocaleString()}명</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">활동중</div>
                <div className="text-2xl font-bold text-green-600">{stats.active_students.toLocaleString()}명</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">이번달 신규</div>
                <div className="text-2xl font-bold text-blue-600">{stats.new_registrations_this_month.toLocaleString()}명</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">졸업생</div>
                <div className="text-2xl font-bold text-purple-600">{stats.graduated_students.toLocaleString()}명</div>
              </div>
            </div>
          )}
        </div>

        {/* 메인 검색 영역 */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <Input
                  placeholder="학생명, 학번, 연락처로 검색... (예: 김민수, ST2024001, 010-1234-5678)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  className="pl-12 text-lg h-14 text-center"
                />
              </div>
              <Button size="lg" className="h-14 px-8">
                고급 검색
              </Button>
            </div>

            {/* 검색 결과 */}
            {searchTerm && (
              <div className="mt-6 border-t pt-6">
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">검색 결과 ({searchResults.length}명)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-gray-600">{result.reason} 관련 학생</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 스마트 액션 카드들 */}
        <ErrorBoundary
          level="section"
          isolate={true}
          onError={(error) => console.error('Action cards error:', error)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {isLoadingStats ? (
              // 로딩 상태 스켈레톤
              [...Array(6)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              actionCards.map((card) => (
                <div
                  key={card.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={card.action}
                >
                  <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg text-white ${card.color}`}>
                        {card.icon}
                      </div>
                      <div className={`text-2xl font-bold ${
                        card.priority === 'high' ? 'text-red-600' :
                        card.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {card.count.toLocaleString()}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                    {card.count === 0 && (
                      <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                        현재 데이터가 없습니다
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              ))
            )}
          </div>
        </ErrorBoundary>

        {/* 빠른 접근 및 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 빠른 접근 학생 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                빠른 접근
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3">
                      <div className="animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="flex-1 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : quickAccessStudents.length > 0 ? (
                <div className="space-y-3">
                  {quickAccessStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getReasonBadge(student.reason)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>최근 활동한 학생이 없습니다.</p>
                  <p className="text-sm">학생 정보를 수정하면 여기에 표시됩니다.</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4">
                더 보기
              </Button>
            </CardContent>
          </Card>

          {/* 오늘의 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                오늘의 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-600">출석률</div>
                  <div className="text-xs text-green-600">+5% ↑</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">23</div>
                  <div className="text-sm text-gray-600">신규 등록</div>
                  <div className="text-xs text-green-600">+12% ↑</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">8</div>
                  <div className="text-sm text-gray-600">상담 완료</div>
                  <div className="text-xs text-gray-500">보통</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <div className="text-sm text-gray-600">미해결 이슈</div>
                  <div className="text-xs text-red-600">주의 필요</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">📊 AI 인사이트</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 수학 클래스 출석률이 10% 증가했습니다</li>
                  <li>• 3명의 학생이 레벨업 대상입니다</li>
                  <li>• 김민수 학생의 학부모 상담이 필요합니다</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 작업 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-16 flex flex-col">
            <UserGroupIcon className="h-6 w-6 mb-1" />
            <span>신규 등록</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <ClockIcon className="h-6 w-6 mb-1" />
            <span>출석 체크</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <PhoneIcon className="h-6 w-6 mb-1" />
            <span>상담 예약</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <CurrencyDollarIcon className="h-6 w-6 mb-1" />
            <span>수강료 관리</span>
          </Button>
        </div>
      </div>
    </div>
  )
}