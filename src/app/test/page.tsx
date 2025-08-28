'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, ExternalLink, TestTube2, Palette, Settings, Info } from 'lucide-react'
import Link from 'next/link'

/**
 * 테스트 인덱스 페이지
 * 개발 서버에서 모든 테스트 목록과 정보를 제공
 */

type TestItem = {
  id: string
  title: string
  description: string
  url: string
  category: 'ui' | 'api' | 'component' | 'system' | 'integration'
  status: 'completed' | 'in-progress' | 'planned'
  tags: string[]
  lastUpdated: string
}

// 자동으로 테스트 목록을 수집하는 함수
const getTestItems = async (): Promise<TestItem[]> => {
  // 개발 환경에서만 파일 시스템 접근
  if (typeof window !== 'undefined') {
    // 클라이언트에서는 정적 목록 반환
    return [
      {
        id: 'shadcn-ui',
        title: 'shadcn/ui 컴포넌트 테스트',
        description: 'T-V2-001: 30개 shadcn/ui 컴포넌트와 DataTable 기능 검증',
        url: '/test/shadcn-ui',
        category: 'component',
        status: 'completed',
        tags: ['ui', 'components', 'shadcn', 'datatable'],
        lastUpdated: '2025-08-26'
      },
      {
        id: 'design-tokens',
        title: '디자인 토큰 시스템 테스트',
        description: 'T-V2-002: 130개 색상 토큰, 19개 타이포그래피, 39개 간격 토큰 시스템 검증',
        url: '/test/design-tokens',
        category: 'ui',
        status: 'completed',
        tags: ['design-tokens', 'colors', 'typography', 'spacing'],
        lastUpdated: '2025-08-26'
      },
      {
        id: 'search-sidebar',
        title: '검색 사이드바 컴포넌트 테스트',
        description: 'T-V2-004: 통합 검색 사이드바 핵심 컴포넌트 - 실시간 검색, 필터링, 무한 스크롤',
        url: '/test/search-sidebar',
        category: 'component',
        status: 'completed',
        tags: ['search', 'sidebar', 'real-time', 'filtering', 'infinite-scroll', 'keyboard-shortcuts'],
        lastUpdated: '2025-08-28'
      },
      {
        id: 'tab-navigation',
        title: '탭 네비게이션 시스템 테스트',
        description: 'T-V2-005: 권한 기반 동적 탭 메뉴 시스템 - MainSidebar 대체, SearchSidebar 통합',
        url: '/test/tab-navigation',
        category: 'system',
        status: 'completed',
        tags: ['navigation', 'tabs', 'permissions', 'dynamic-ui', 'keyboard-shortcuts', 'roles'],
        lastUpdated: '2025-08-28'
      }
    ]
  }
  
  // 서버에서는 파일 시스템에서 자동 수집 (향후 확장 가능)
  return [
    {
      id: 'shadcn-ui',
      title: 'shadcn/ui 컴포넌트 테스트',
      description: 'T-V2-001: 30개 shadcn/ui 컴포넌트와 DataTable 기능 검증',
      url: '/test/shadcn-ui',
      category: 'component',
      status: 'completed',
      tags: ['ui', 'components', 'shadcn', 'datatable'],
      lastUpdated: '2025-08-26'
    },
    {
      id: 'design-tokens',
      title: '디자인 토큰 시스템 테스트',
      description: 'T-V2-002: 130개 색상 토큰, 19개 타이포그래피, 39개 간격 토큰 시스템 검증',
      url: '/test/design-tokens',
      category: 'ui',
      status: 'completed',
      tags: ['design-tokens', 'colors', 'typography', 'spacing'],
      lastUpdated: '2025-08-26'
    },
    {
      id: 'search-sidebar',
      title: '검색 사이드바 컴포넌트 테스트',
      description: 'T-V2-004: 통합 검색 사이드바 핵심 컴포넌트 - 실시간 검색, 필터링, 무한 스크롤',
      url: '/test/search-sidebar',
      category: 'component',
      status: 'completed',
      tags: ['search', 'sidebar', 'real-time', 'filtering', 'infinite-scroll', 'keyboard-shortcuts'],
      lastUpdated: '2025-08-28'
    },
    {
      id: 'tab-navigation',
      title: '탭 네비게이션 시스템 테스트',
      description: 'T-V2-005: 권한 기반 동적 탭 메뉴 시스템 - MainSidebar 대체, SearchSidebar 통합',
      url: '/test/tab-navigation',
      category: 'system',
      status: 'completed',
      tags: ['navigation', 'tabs', 'permissions', 'dynamic-ui', 'keyboard-shortcuts', 'roles'],
      lastUpdated: '2025-08-28'
    }
  ]
}

const testItems: TestItem[] = []

const categoryColors = {
  ui: 'bg-educanvas-100 text-educanvas-800 dark:bg-educanvas-900/20 dark:text-educanvas-300',
  api: 'bg-info-100 text-info-800 dark:bg-info-900/20 dark:text-info-300',
  component: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300',
  system: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300',
  integration: 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300'
}

const statusColors = {
  completed: 'bg-success-500',
  'in-progress': 'bg-warning-500',
  planned: 'bg-neutral-500'
}

const statusLabels = {
  completed: '완료',
  'in-progress': '진행중',
  planned: '계획됨'
}

export default function TestIndexPage() {
  const [isDevMode, setIsDevMode] = useState(false)
  const [testItems, setTestItems] = useState<TestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 개발 환경 체크 및 테스트 목록 로드
    setIsDevMode(process.env.NODE_ENV === 'development')
    
    const loadTests = async () => {
      try {
        const tests = await getTestItems()
        setTestItems(tests)
      } catch (error) {
        console.error('테스트 목록 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTests()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">테스트 목록을 로드하는 중...</p>
      </div>
    )
  }

  const testsByCategory = testItems.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = []
    }
    acc[test.category].push(test)
    return acc
  }, {} as Record<string, TestItem[]>)

  const completedTests = testItems.filter(t => t.status === 'completed').length
  const totalTests = testItems.length

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <TestTube2 className="h-8 w-8 text-primary" />
          <h1 className="text-5xl font-bold text-primary">
            EduCanvas 테스트 센터
          </h1>
        </div>
        <p className="text-lg max-w-3xl mx-auto text-muted-foreground">
          개발 서버에서 모든 테스트 항목에 접근하고 검증할 수 있습니다.
        </p>
        
        {/* 환경 정보 */}
        <Alert className={isDevMode ? "border-success-500 bg-success-50 dark:bg-success-950/20" : "border-error-500 bg-error-50 dark:bg-error-950/20"}>
          <Info className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {isDevMode ? '✅ 개발 환경' : '❌ 프로덕션 환경'}
          </AlertTitle>
          <AlertDescription>
            {isDevMode 
              ? '현재 개발 모드에서 실행 중입니다. 모든 테스트에 접근할 수 있습니다.'
              : '프로덕션 환경에서는 테스트 페이지 접근이 제한됩니다.'
            }
          </AlertDescription>
        </Alert>
      </div>

      <Separator />

      {/* 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success-500" />
            테스트 현황
          </CardTitle>
          <CardDescription>
            전체 테스트 완료도 및 카테고리별 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalTests}</div>
              <div className="text-sm text-muted-foreground">전체 테스트</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-500">{completedTests}</div>
              <div className="text-sm text-muted-foreground">완료된 테스트</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {Math.round((completedTests / totalTests) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">완료율</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-info-500">
                {Object.keys(testsByCategory).length}
              </div>
              <div className="text-sm text-muted-foreground">카테고리</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리별 테스트 목록 */}
      <div className="space-y-8">
        {Object.entries(testsByCategory).map(([category, tests]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="capitalize">
                    {category === 'ui' ? 'UI 테스트' : 
                     category === 'api' ? 'API 테스트' :
                     category === 'component' ? '컴포넌트 테스트' :
                     category === 'system' ? '시스템 테스트' :
                     '통합 테스트'}
                  </CardTitle>
                  <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                    {tests.length}개
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {category === 'ui' && <Palette className="h-5 w-5" />}
                  {category === 'component' && <TestTube2 className="h-5 w-5" />}
                  {category === 'system' && <Settings className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {tests.map((test) => (
                  <Card key={test.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{test.title}</h3>
                            <Badge className={statusColors[test.status]}>
                              {statusLabels[test.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {test.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {test.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            마지막 업데이트: {test.lastUpdated}
                          </p>
                        </div>
                        <div className="ml-4">
                          <Link href={test.url}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              테스트 실행
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 개발 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>새 테스트 추가하기</CardTitle>
          <CardDescription>
            새로운 테스트 페이지를 추가하는 방법
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">1. 테스트 페이지 생성</h4>
            <code className="text-sm bg-background px-2 py-1 rounded">
              src/app/test/[테스트명]/page.tsx
            </code>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">2. testItems 배열에 추가</h4>
            <p className="text-sm">
              이 페이지의 testItems 배열에 새로운 테스트 정보를 추가하세요.
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">3. 개발 환경에서 테스트</h4>
            <p className="text-sm">
              npm run dev로 개발 서버를 실행하여 테스트를 확인하세요.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 푸터 */}
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          EduCanvas v5.0 Test Center • 개발자를 위한 통합 테스트 환경
        </p>
      </div>
    </div>
  )
}