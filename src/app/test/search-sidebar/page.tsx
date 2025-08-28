'use client'

import { useState } from 'react'
import { Search, Settings, Users, School, Calendar, BarChart, Command, Sidebar, User, Building, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import SearchSidebar from '@/components/search/SearchSidebar'
import { 
  StudentSearchSidebar, 
  StaffSearchSidebar, 
  ClassSearchSidebar, 
  ScheduleSearchSidebar, 
  DashboardSearchSidebar,
  SearchSidebarUsageGuide
} from '@/components/search/context/SearchSidebarContexts'
import { useSearchStore } from '@/lib/stores/searchStore'
import { useGlobalSearch } from '@/components/search/SearchProvider'

export default function SearchSidebarTestPage() {
  const { openSidebar, setContext, toggleSidebar } = useSearchStore()
  const { openSpotlight, isSpotlightOpen } = useGlobalSearch()
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  // Test contexts with descriptions and components
  const contexts = [
    { 
      key: 'dashboard', 
      label: '대시보드', 
      icon: BarChart,
      description: '통합 검색 + 기본 필터',
      component: DashboardSearchSidebar,
      pattern: 'default'
    },
    { 
      key: 'students', 
      label: '학생관리', 
      icon: User,
      description: '인적사항 표시 중심',
      component: StudentSearchSidebar,
      pattern: 'detail'
    },
    { 
      key: 'classes', 
      label: '수업관리', 
      icon: School,
      description: '필터링 중심',
      component: ClassSearchSidebar,
      pattern: 'filter'
    },
    { 
      key: 'staff', 
      label: '직원관리', 
      icon: Building,
      description: '인적사항 표시 중심',
      component: StaffSearchSidebar,
      pattern: 'detail'
    },
    { 
      key: 'schedule', 
      label: '시간표', 
      icon: Clock,
      description: '날짜/시간 네비게이션',
      component: ScheduleSearchSidebar,
      pattern: 'navigation'
    }
  ] as const

  const handleContextTest = (contextKey: string) => {
    setActiveDemo(contextKey)
    setContext(contextKey as any)
    openSidebar()
  }

  const handleCloseDemo = () => {
    setActiveDemo(null)
  }

  // Pattern colors
  const patternColors = {
    default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    detail: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    filter: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    navigation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          T-V2-004: 통합 검색 사이드바 시스템 테스트
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          컨텍스트 어댑터 패턴을 적용한 통합 사이드바와 Spotlight 검색을 테스트할 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300">
            ✅ 공통 기반 레이어
          </Badge>
          <Badge className="bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300">
            ✅ 컨텍스트 어댑터
          </Badge>
          <Badge className="bg-info-100 text-info-800 dark:bg-info-900/20 dark:text-info-300">
            🔄 동적 콘텐츠 주입
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Dual Search System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spotlight Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Command className="h-5 w-5 text-purple-500" />
                Spotlight 검색
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  macOS Spotlight 스타일의 빠른 전역 검색
                </p>
                <Button
                  onClick={openSpotlight}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Command className="h-4 w-4 mr-2" />
                  Spotlight 검색 열기
                </Button>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                    Cmd/Ctrl + Space
                  </kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Page-specific Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sidebar className="h-5 w-5 text-blue-500" />
                페이지별 세부 검색
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  각 페이지별 필터링과 고급 검색 옵션
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={toggleSidebar}
                >
                  <Sidebar className="h-4 w-4 mr-2" />
                  사이드바 검색 열기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Context Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              컨텍스트별 사이드바 데모
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {contexts.map(({ key, label, icon: Icon, description, pattern }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{label}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={patternColors[pattern as keyof typeof patternColors]}>
                      {pattern === 'default' && '기본'}
                      {pattern === 'detail' && '상세정보'}
                      {pattern === 'filter' && '필터링'}
                      {pattern === 'navigation' && '네비게이션'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContextTest(key)}
                      className={activeDemo === key ? 'bg-educanvas-100 text-educanvas-700 dark:bg-educanvas-900/30' : ''}
                    >
                      {activeDemo === key ? '열림' : '테스트'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>키보드 단축키</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Spotlight 검색</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <span className="text-sm">Spotlight 열기/닫기</span>
                    <Badge variant="secondary">Cmd/Ctrl + Space</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <span className="text-sm">닫기</span>
                    <Badge variant="secondary">ESC</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">사이드바 검색</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">사이드바 닫기</span>
                    <Badge variant="secondary">ESC</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">결과 탐색</span>
                    <Badge variant="secondary">↑ / ↓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">결과 선택</span>
                    <Badge variant="secondary">Enter</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Queries */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 검색어</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">학생 검색</h4>
                <div className="flex flex-wrap gap-2">
                  {['김민수', '이지은', '박서준', 'ST2024', '010'].map((query) => (
                    <Badge
                      key={query}
                      variant="outline"
                      className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => {
                        setContext('students')
                        openSidebar()
                      }}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">수업 검색</h4>
                <div className="flex flex-wrap gap-2">
                  {['수학', '영어', '101호', '월요일', '14:00'].map((query) => (
                    <Badge
                      key={query}
                      variant="outline"
                      className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => {
                        setContext('classes')
                        openSidebar()
                      }}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">직원 검색</h4>
                <div className="flex flex-wrap gap-2">
                  {['김선생', '이선생', '강사', '수학과', '영어과'].map((query) => (
                    <Badge
                      key={query}
                      variant="outline"
                      className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => {
                        setContext('staff')
                        openSidebar()
                      }}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Features */}
        <Card>
          <CardHeader>
            <CardTitle>통합 사이드바 아키텍처</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">🏗️ 공통 기반 레이어</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mt-2">
                    <li>• SearchInput 컴포넌트</li>
                    <li>• 키보드 네비게이션</li>
                    <li>• 슬라이드 애니메이션</li>
                    <li>• 반응형 레이아웃</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200">🔄 컨텍스트 어댑터</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 mt-2">
                    <li>• context prop 기반 설정</li>
                    <li>• 자동 제목/설명 변경</li>
                    <li>• 조건부 필터 표시</li>
                    <li>• 동적 플레이스홀더</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200">🔌 확장 시스템</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 mt-2">
                    <li>• children prop 주입</li>
                    <li>• 커스텀 콘텐츠 지원</li>
                    <li>• 컴포넌트 재사용</li>
                    <li>• 타입 안전성</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>사용 패턴별 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">상세정보 패턴 (학생/직원 관리)</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 mb-2">목적: 선택한 사람의 상세 정보 표시</p>
                    <code className="block bg-white dark:bg-neutral-800 p-2 rounded text-xs">
                      {`<SearchSidebar context="students">
  <PersonDetailPanel />
</SearchSidebar>`}
                    </code>
                  </div>
                  <ul className="text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• showFilters: false</li>
                    <li>• 검색 → 선택 → 상세정보</li>
                    <li>• 빠른 액션 버튼</li>
                    <li>• 연락처, 상태 등 표시</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">필터링 패턴 (수업 관리)</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700 dark:text-green-300 mb-2">목적: 조건별 데이터 필터링</p>
                    <code className="block bg-white dark:bg-neutral-800 p-2 rounded text-xs">
                      {`<SearchSidebar context="classes">
  {/* children 없음 = 기본 필터 */}
</SearchSidebar>`}
                    </code>
                  </div>
                  <ul className="text-green-600 dark:text-green-300 space-y-1">
                    <li>• showFilters: true</li>
                    <li>• 메인 영역에 결과 반영</li>
                    <li>• 요일/강의실/강사별 필터</li>
                    <li>• 실시간 필터 적용</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10">
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">네비게이션 패턴 (일정 관리)</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-purple-700 dark:text-purple-300 mb-2">목적: 날짜/기간 선택 및 네비게이션</p>
                    <code className="block bg-white dark:bg-neutral-800 p-2 rounded text-xs">
                      {`<SearchSidebar context="schedule">
  <CalendarNavigation />
</SearchSidebar>`}
                    </code>
                  </div>
                  <ul className="text-purple-600 dark:text-purple-300 space-y-1">
                    <li>• 미니 캘린더 위젯</li>
                    <li>• 빠른 기간 선택</li>
                    <li>• 선택 날짜 일정 미리보기</li>
                    <li>• 일정 유형별 필터</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>성능 목표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">&lt; 300ms</div>
                <div className="text-sm text-green-700 dark:text-green-300">검색 응답</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">60fps</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">애니메이션</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">WCAG AA</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">접근성</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">1000+</div>
                <div className="text-sm text-orange-700 dark:text-orange-300">결과 처리</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Search Sidebar - renders based on active demo */}
      {activeDemo && (
        (() => {
          const activeContext = contexts.find(c => c.key === activeDemo)
          const SidebarComponent = activeContext?.component || SearchSidebar
          return activeContext ? <SidebarComponent /> : <SearchSidebar />
        })()
      )}
      
      {/* Default sidebar when no demo is active */}
      {!activeDemo && <SearchSidebar />}
    </div>
  )
}