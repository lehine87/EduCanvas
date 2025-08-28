'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/store/useAuthStore'
import { 
  useNavigationStore, 
  useCurrentTab, 
  useVisibleTabs, 
  useUserRole,
  validatePageAccess
} from '@/lib/stores/navigationStore'
import { useNavigation } from '@/hooks/useNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Shield, 
  Navigation, 
  Layout,
  Settings,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { TabItem } from '@/components/navigation'
import { cn } from '@/lib/utils'

type TestUserRole = 'system_admin' | 'tenant_admin' | 'admin' | 'instructor' | 'staff' | 'viewer'

/**
 * T-V2-005 탭 네비게이션 시스템 테스트 페이지
 */
export default function TabNavigationTestPage() {
  const { profile } = useAuth()
  const currentTab = useCurrentTab()
  const visibleTabs = useVisibleTabs()
  const userRole = useUserRole()
  const { updateVisibleTabs, updateTabBadge, setCurrentTab } = useNavigationStore()
  const { navigateToTab, canAccessTab, hasRole } = useNavigation()

  // 테스트용 가상 역할
  const [testRole, setTestRole] = useState<TestUserRole>('admin')
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  // 전체 탭 정의 (테스트용)
  const allTabIds = ['dashboard', 'students', 'classes', 'staff', 'courses', 'schedules', 'reports']
  
  // 역할별 예상 탭 수
  const expectedTabCounts = {
    'system_admin': 7,
    'tenant_admin': 7,
    'admin': 7,
    'instructor': 4, // dashboard, students, classes, schedules
    'staff': 3,      // dashboard, students, schedules  
    'viewer': 3      // dashboard, students, schedules
  }

  // 테스트 실행
  const runTests = () => {
    const results: Record<string, boolean> = {}

    // 테스트 1: 권한별 탭 필터링
    const expectedCount = expectedTabCounts[testRole]
    results.tabFiltering = visibleTabs.length === expectedCount

    // 테스트 2: 현재 탭 상태
    results.currentTabState = currentTab !== ''

    // 테스트 3: 접근 권한 검증
    results.accessValidation = allTabIds.every(tabId => {
      const canAccess = canAccessTab(tabId)
      const shouldAccess = visibleTabs.some(tab => tab.id === tabId)
      return canAccess === shouldAccess
    })

    // 테스트 4: 역할 확인
    results.roleCheck = userRole === testRole || userRole === profile?.role

    setTestResults(results)
  }

  // 테스트 역할 변경
  const handleRoleChange = (role: TestUserRole) => {
    setTestRole(role)
    updateVisibleTabs(role)
  }

  // 배지 테스트
  const testBadges = () => {
    updateTabBadge('students', 5)
    updateTabBadge('classes', 12)
    updateTabBadge('reports', 3)
  }

  // 배지 초기화
  const clearBadges = () => {
    allTabIds.forEach(tabId => updateTabBadge(tabId, undefined))
  }

  useEffect(() => {
    runTests()
  }, [testRole, visibleTabs, currentTab, userRole])

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Layout className="h-8 w-8 text-educanvas-500" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            T-V2-005 탭 네비게이션 테스트
          </h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          현업 SaaS 스타일 헤더 UI + 권한 기반 동적 탭 메뉴 + 사용자 드롭다운 시스템을 테스트합니다.
        </p>
      </div>

      {/* 현재 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            현재 상태
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                실제 사용자 역할
              </p>
              <Badge variant="outline" className="w-fit">
                {profile?.role || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                테스트 역할
              </p>
              <Badge variant="secondary" className="w-fit">
                {testRole}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                현재 탭
              </p>
              <Badge variant="default" className="w-fit">
                {currentTab}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 역할별 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            역할별 탭 권한 테스트
          </CardTitle>
          <CardDescription>
            다양한 사용자 역할로 전환하여 탭 필터링을 테스트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 역할 선택 버튼 */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(expectedTabCounts).map((role) => (
              <Button
                key={role}
                variant={testRole === role ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleChange(role as TestUserRole)}
              >
                {role}
              </Button>
            ))}
          </div>

          {/* 현재 보이는 탭들 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              현재 보이는 탭 ({visibleTabs.length}개)
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleTabs.map((tab) => (
                <Badge
                  key={tab.id}
                  variant={currentTab === tab.id ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setCurrentTab(tab.id)}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-1 bg-growth-500 text-growth-contrast px-1 rounded-full text-xs">
                      {tab.badge}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* 예상 vs 실제 탭 수 */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">예상 탭 수:</span>
              <span className="text-sm">{expectedTabCounts[testRole]}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">실제 탭 수:</span>
              <span className="text-sm">{visibleTabs.length}개</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-medium">테스트 결과:</span>
              {testResults.tabFiltering ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기능 테스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 배지 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              배지 시스템 테스트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" onClick={testBadges}>
                배지 테스트
              </Button>
              <Button size="sm" variant="outline" onClick={clearBadges}>
                배지 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 페이지 접근 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              페이지 접근 권한 테스트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {allTabIds.map((tabId) => {
                const hasAccess = validatePageAccess(`/admin/${tabId}`, testRole)
                const canAccess = canAccessTab(tabId)
                const isConsistent = hasAccess === canAccess
                
                return (
                  <div key={tabId} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <span className="text-sm">/admin/{tabId}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={hasAccess ? 'default' : 'secondary'}>
                        {hasAccess ? '허용' : '차단'}
                      </Badge>
                      {isConsistent ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 전체 테스트 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            전체 테스트 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(testResults).map(([test, passed]) => (
              <div key={test} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                <span className="text-sm font-medium">
                  {test === 'tabFiltering' && '권한별 탭 필터링'}
                  {test === 'currentTabState' && '현재 탭 상태 관리'}  
                  {test === 'accessValidation' && '접근 권한 검증'}
                  {test === 'roleCheck' && '역할 확인'}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={passed ? 'default' : 'destructive'}>
                    {passed ? '통과' : '실패'}
                  </Badge>
                  {passed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 전체 결과 */}
          <Separator className="my-4" />
          <div className="text-center">
            {Object.values(testResults).every(Boolean) ? (
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">모든 테스트 통과!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">일부 테스트 실패</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 키보드 단축키 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>키보드 단축키</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visibleTabs.slice(0, 7).map((tab, index) => (
              <div key={tab.id} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs font-mono">
                  Ctrl+{index + 1}
                </kbd>
                <span className="text-sm">{tab.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
            <p className="text-sm text-info-800 dark:text-info-200">
              💡 <strong>실제 사용하려면</strong>: /main 페이지로 이동하여 새로운 헤더 UI와 키보드 단축키를 체험하세요!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 비교 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success-500" />
            전후 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-neutral-800 dark:text-neutral-200">기존 UI (변경 전)</h4>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded border">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  탭만 나오는 단순한 레이아웃
                </div>
                <div className="mt-2 flex gap-2">
                  <div className="px-3 py-1 bg-white dark:bg-neutral-900 rounded text-xs">대시보드</div>
                  <div className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">학생관리</div>
                  <div className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">수업관리</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-neutral-800 dark:text-neutral-200">새로운 UI (변경 후)</h4>
              <div className="p-3 bg-educanvas-50 dark:bg-educanvas-950/20 border border-educanvas-200 dark:border-educanvas-800 rounded">
                <div className="text-sm text-educanvas-700 dark:text-educanvas-300 mb-2">
                  학원 브랜딩 + 탭 + 사용자 메뉴 통합 레이아웃
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-educanvas-500 rounded-full"></div>
                    <span>학원명</span>
                  </div>
                  <div className="text-neutral-400">|</div>
                  <div className="flex gap-1">
                    <div className="px-2 py-1 bg-educanvas-100 dark:bg-educanvas-900/20 rounded">대시보드</div>
                    <div className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">학생관리</div>
                  </div>
                  <div className="ml-auto w-4 h-4 bg-wisdom-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hover Subtab 기능 테스트 */}
      <Card className="bg-info-50 dark:bg-info-950/20 border-info-200 dark:border-info-800">
        <CardHeader>
          <CardTitle className="text-info-800 dark:text-info-200">🎯 Hover Subtab 기능 테스트</CardTitle>
          <CardDescription className="text-info-700 dark:text-info-300">
            각 탭에 마우스를 올려서 서브메뉴가 나타나는지 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-educanvas-500 via-wisdom-500 to-growth-500 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {visibleTabs.map((tab, index) => (
                  <TabItem
                    key={tab.id}
                    tab={tab}
                    isActive={currentTab === tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    shortcutIndex={index + 1}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-info-800 dark:text-info-200">
              <p>💡 각 탭 아이템에 마우스를 올려보세요:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>150ms 후 서브메뉴가 부드럽게 나타납니다</li>
                <li>서브메뉴에서 마우스를 떼면 150ms 후 사라집니다</li>
                <li>현재 경로와 일치하는 서브탭은 활성화 표시됩니다</li>
                <li>서브메뉴 항목을 클릭하면 해당 페이지로 이동합니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 빠른 사용 가이드 */}
      <Card className="bg-growth-50 dark:bg-growth-950/20 border-growth-200 dark:border-growth-800">
        <CardHeader>
          <CardTitle className="text-growth-800 dark:text-growth-200">🚀 빠른 사용 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-growth-700 dark:text-growth-300">
            <li><strong>/main 페이지</strong>로 이동하여 실제 UI 확인</li>
            <li>각 탭을 클릭하여 내비게이션 테스트</li>
            <li><kbd className="px-1 bg-growth-200 dark:bg-growth-800 rounded">Ctrl+1~7</kbd> 키보드 단축키 사용</li>
            <li>다른 역할로 전환하여 탭 필터링 확인</li>
            <li>배지 기능과 접근 권한 검증 테스트</li>
            <li><strong>위의 Hover Subtab 테스트</strong>에서 서브메뉴 기능 확인</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}