'use client'

import { useState, useCallback, useMemo } from 'react'
import { useOptimizedStudentData } from '@/hooks/useOptimizedStudentData'
import { VirtualizedStudentList } from '@/components/ui/VirtualizedStudentList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/useAuthStore'
import type { Student, StudentStatus } from '@/types/student.types'
import { 
  MagnifyingGlassIcon,
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

// 필터 옵션 정의
const STATUS_OPTIONS: { value: StudentStatus; label: string; color: string }[] = [
  { value: 'active', label: '활동중', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: '비활성', color: 'bg-gray-100 text-gray-800' },
  { value: 'graduated', label: '졸업', color: 'bg-blue-100 text-blue-800' },
  { value: 'withdrawn', label: '탈퇴', color: 'bg-red-100 text-red-800' },
  { value: 'suspended', label: '정지', color: 'bg-yellow-100 text-yellow-800' }
]

export default function SmartStudentManagementPage() {
  const { profile } = useAuthStore()
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  
  // 최적화된 학생 데이터 Hook 사용
  const {
    searchTerm,
    searchResults,
    isSearching,
    searchSuggestions,
    search,
    getStudentById,
    performanceMetrics,
    clearCache,
    refreshData,
    forceCleanup
  } = useOptimizedStudentData({
    enableCache: true,
    enableVirtualization: true,
    maxCacheSize: 1000,
    searchDebounceMs: 300
  })

  // 검색 핸들러
  const handleSearchChange = useCallback((value: string) => {
    search(value)
  }, [search])

  // 학생 선택 핸들러
  const handleStudentSelect = useCallback(async (student: Student) => {
    console.log('학생 선택:', student.name)
    
    // 실제 구현에서는 상세 페이지로 이동하거나 모달 표시
    const detailedStudent = await getStudentById(student.id)
    if (detailedStudent) {
      console.log('상세 정보 로드됨:', detailedStudent)
    }
  }, [getStudentById])

  // 성능 메트릭 포맷팅
  const formattedMetrics = useMemo(() => ({
    memoryUsage: `${(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
    cacheHitRate: `${performanceMetrics.cacheHitRate.toFixed(1)}%`,
    searchLatency: `${performanceMetrics.searchLatency.toFixed(0)}ms`,
    cachedItems: performanceMetrics.cachedItemsCount.toLocaleString()
  }), [performanceMetrics])

  // 검색 제안 클릭 핸들러
  const handleSuggestionClick = useCallback((suggestion: string) => {
    search(suggestion)
  }, [search])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3 text-purple-600" />
              스마트 학생관리
            </h1>
            <p className="text-gray-600 mt-1">
              AI 검색과 가상화로 {profile?.tenant_id ? '대용량' : '모든'} 학생 데이터를 효율적으로 관리하세요
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              className="flex items-center"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              성능 모니터
            </Button>
            <Button
              variant="outline"
              onClick={forceCleanup}
              className="flex items-center"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              메모리 정리
            </Button>
          </div>
        </div>

        {/* 성능 모니터링 패널 */}
        {showPerformancePanel && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <CpuChipIcon className="h-5 w-5 mr-2" />
                실시간 성능 메트릭
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formattedMetrics.memoryUsage}
                  </div>
                  <div className="text-sm text-gray-600">메모리 사용량</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formattedMetrics.cacheHitRate}
                  </div>
                  <div className="text-sm text-gray-600">캐시 적중률</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formattedMetrics.searchLatency}
                  </div>
                  <div className="text-sm text-gray-600">검색 응답시간</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formattedMetrics.cachedItems}
                  </div>
                  <div className="text-sm text-gray-600">캐시된 학생수</div>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearCache}>
                  캐시 클리어
                </Button>
                <Button variant="outline" size="sm" onClick={refreshData}>
                  데이터 새로고침
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 메인 검색 영역 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 검색창 */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="학생명, 학번, 연락처로 스마트 검색... (최소 2글자)"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-12 text-lg h-12"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* 검색 제안 */}
              {searchSuggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">추천 검색어:</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* 검색 결과 요약 */}
              {searchTerm && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      &quot;{searchTerm}&quot;에 대한 검색 결과: {searchResults.length.toLocaleString()}명
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formattedMetrics.searchLatency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 가상화된 학생 목록 */}
        <div className="space-y-4">
          {searchTerm.length >= 2 ? (
            <VirtualizedStudentList
              students={searchResults}
              onStudentSelect={handleStudentSelect}
              maxHeight={700}
              itemHeight={120}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  스마트 검색을 시작하세요
                </h3>
                <p className="text-gray-600 mb-6">
                  학생명, 학번, 또는 연락처를 입력하여 검색해보세요. <br />
                  AI가 가장 관련성 높은 결과를 찾아드립니다.
                </p>
                
                {/* 빠른 검색 예시 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">빠른 검색 예시:</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['김', '이', '박', '010', 'ST2024'].map((example) => (
                      <Button
                        key={example}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchChange(example)}
                        className="text-xs"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 선택된 학생 액션 바 */}
        {selectedStudents.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedStudents.length}명 선택됨
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  일괄 메시지
                </Button>
                <Button size="sm" variant="outline">
                  출석 체크
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedStudents([])}
                >
                  선택 해제
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 개발 환경 디버그 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-900 mb-2">🔧 개발 모드 정보</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <div>• 가상화: {searchResults.length > 50 ? '활성' : '비활성'}</div>
                <div>• 메모리 최적화: 활성 (최대 1,000개 캐시)</div>
                <div>• AI 검색: 다중 전략 (정확/퍼지/의미적 검색)</div>
                <div>• 성능 목표: 60fps 유지, &lt;300ms 응답시간</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}