/**
 * EduCanvas 10토큰 테마 시스템 테스트 페이지
 * 수정된 안전한 버전
 * @version 3.1 (Fixed)
 * @date 2025-01-11
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  CheckCircle, 
  Monitor,
  Eye,
  Zap,
  Sparkles,
  TestTube,
  Code2,
  Layers
} from 'lucide-react';

export default function ThemeSystemTestPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // 컴포넌트 테스트 그리드
  const componentTests = [
    { name: 'Button Primary', element: <Button>Primary Button</Button> },
    { name: 'Button Secondary', element: <Button variant="secondary">Secondary</Button> },
    { name: 'Button Outline', element: <Button variant="outline">Outline</Button> },
    { name: 'Badge Default', element: <Badge>Default Badge</Badge> },
    { name: 'Badge Outline', element: <Badge variant="outline">Outline Badge</Badge> },
    { name: 'Card', element: <Card className="p-4"><div>Card Content</div></Card> },
  ];

  return (
    <div className="min-h-screen bg-bg-100 text-text-100 transition-colors duration-300">
      <div className="container-theme py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="h-8 w-8 text-primary-300" />
            <h1 className="text-3xl font-bold text-gradient-primary">
              10토큰 테마 시스템 테스트
            </h1>
            <Badge variant="outline" className="ml-auto">
              v3.1 Fixed
            </Badge>
          </div>
          <p className="text-lg text-text-200">
            154개 색상을 10개 시멘틱 토큰으로 통합한 혁신적인 테마 시스템을 테스트합니다.
          </p>
        </div>

        {/* 메인 탭 인터페이스 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">개요</span>
            </TabsTrigger>
            <TabsTrigger value="theme-switcher" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">테마</span>
            </TabsTrigger>
            <TabsTrigger value="background" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">배경</span>
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">컴포넌트</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">검증</span>
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 시스템 요약 */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-300" />
                    시스템 혁신
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-200">기존 색상:</span>
                    <span className="font-bold text-red-500">154개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-200">새로운 토큰:</span>
                    <span className="font-bold text-green-500">10개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-200">감소율:</span>
                    <span className="font-bold text-primary-300">93.5%</span>
                  </div>
                  <div className="pt-2 border-t border-bg-300">
                    <span className="text-sm text-text-200">
                      혁신적인 시멘틱 컬러 시스템으로 관리 복잡도를 극적으로 감소
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 주요 기능 */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent-200" />
                    핵심 기능
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">런타임 테마 전환</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">다중 테마 지원</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">배경화면 커스터마이징</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">WCAG 접근성 준수</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">TypeScript 타입 안전성</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">SSR/SSG 호환성</span>
                  </div>
                </CardContent>
              </Card>

              {/* 기술 스택 */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-accent-100" />
                    기술 스택
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• React Context API</div>
                  <div>• CSS Custom Properties</div>
                  <div>• Tailwind CSS 동적 클래스</div>
                  <div>• next-themes 통합</div>
                  <div>• TypeScript 타입 시스템</div>
                  <div>• 로컬 스토리지 영속성</div>
                  <div>• Dynamic Import (SSR)</div>
                </CardContent>
              </Card>
            </div>

            {/* 색상 토큰 시각화 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary-300" />
                  10개 시멘틱 컬러 토큰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-primary-100 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">primary-100</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-primary-200 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">primary-200</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-primary-300 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">primary-300</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-accent-100 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">accent-100</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-accent-200 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">accent-200</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-text-100 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">text-100</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-text-200 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">text-200</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-bg-100 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">bg-100</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-bg-200 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">bg-200</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-bg-300 rounded border border-bg-300"></div>
                    <div className="text-xs text-center text-text-200">bg-300</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 테마 스위처 탭 */}
          <TabsContent value="theme-switcher" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-8 bg-bg-200 rounded-lg border border-bg-300">
                <div className="text-center text-text-200">
                  테마 스위처 컴포넌트 영역 (임시 비활성화)
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>사용 가이드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">🎨 테마 선택</h4>
                    <p className="text-text-200">
                      Default, Ocean, Forest 테마 중 선택하여 전체 UI 색상을 즉시 변경할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">🌙 다크/라이트 모드</h4>
                    <p className="text-text-200">
                      라이트, 다크, 자동 모드를 지원하며 시스템 설정에 따라 자동 전환됩니다.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">👁️ 실시간 미리보기</h4>
                    <p className="text-text-200">
                      테마 선택 시 실시간으로 미리보기를 제공하여 최적의 선택을 도와줍니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 배경 커스터마이저 탭 */}
          <TabsContent value="background" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-8 bg-bg-200 rounded-lg border border-bg-300">
                <div className="text-center text-text-200">
                  배경 커스터마이저 컴포넌트 영역 (임시 비활성화)
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>배경 기능</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">🌈 그라디언트</h4>
                    <p className="text-text-200">
                      10토큰 기반의 아름다운 그라디언트 프리셋을 제공합니다.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">📐 패턴</h4>
                    <p className="text-text-200">
                      점, 격자, 물결 등 다양한 패턴 배경을 설정할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">🖼️ 이미지</h4>
                    <p className="text-text-200">
                      프리셋 이미지 또는 커스텀 URL로 배경 이미지를 설정 가능합니다.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">🎛️ 고급 옵션</h4>
                    <p className="text-text-200">
                      투명도와 블러 효과를 조절하여 완벽한 배경을 만들 수 있습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 컴포넌트 테스트 탭 */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>UI 컴포넌트 테마 적용 테스트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {componentTests.map((test, index) => (
                    <div key={index} className="p-4 rounded-lg bg-bg-200 border border-bg-300">
                      <div className="text-xs text-text-200 mb-2">{test.name}</div>
                      <div className="flex items-center justify-center">
                        {test.element}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 반응형 테스트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  반응형 디자인 테스트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Desktop: 1200px+</Badge>
                    <Badge variant="outline">Tablet: 768px - 1199px</Badge>
                    <Badge variant="outline">Mobile: 0 - 767px</Badge>
                  </div>
                  <p className="text-sm text-text-200">
                    모든 화면 크기에서 테마 시스템이 올바르게 작동하는지 확인하세요.
                    브라우저 개발자 도구의 반응형 모드를 사용하여 테스트할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 검증 탭 */}
          <TabsContent value="validation" className="space-y-6">
            <div className="p-8 bg-bg-200 rounded-lg border border-bg-300">
              <div className="text-center text-text-200">
                테마 검증 컴포넌트 영역 (임시 비활성화)
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}