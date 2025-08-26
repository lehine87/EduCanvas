'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Moon, Sun } from 'lucide-react'

/**
 * T-V2-002: Design Tokens Test Page
 * EduCanvas v2 디자인 토큰 시스템 테스트 및 검증
 */
export default function DesignTokensTestPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // 초기 다크모드 상태 확인
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <div className="flex justify-end mb-4">
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <h1 className="text-6xl font-bold text-primary">
          EduCanvas v2 Design Tokens
        </h1>
        <p className="text-lg max-w-2xl mx-auto">
          통합 디자인 토큰 시스템 테스트 - 색상, 타이포그래피, 간격, 애니메이션
        </p>
        
        {/* CSS 변수 테스트 */}
        <div className="test-color">
          CSS 변수 테스트: 이 박스가 파란색이면 성공!
        </div>
        <div className="bg-educanvas-500 text-white p-4 rounded">
          Tailwind 클래스 테스트: bg-educanvas-500
        </div>
      </div>

      <Separator />

      {/* 색상 시스템 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 색상 시스템 (Color Tokens)
          </CardTitle>
          <CardDescription>
            EduCanvas 브랜드 색상과 의미적 색상 팔레트
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Brand Colors */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">EduCanvas 브랜드 색상</h3>
            <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
              {[
                { shade: 50, var: 'var(--color-educanvas-50)' },
                { shade: 100, var: 'var(--color-educanvas-100)' },
                { shade: 200, var: 'var(--color-educanvas-200)' },
                { shade: 300, var: 'var(--color-educanvas-300)' },
                { shade: 400, var: 'var(--color-educanvas-400)' },
                { shade: 500, var: 'var(--color-educanvas-500)' },
                { shade: 600, var: 'var(--color-educanvas-600)' },
                { shade: 700, var: 'var(--color-educanvas-700)' },
                { shade: 800, var: 'var(--color-educanvas-800)' },
                { shade: 900, var: 'var(--color-educanvas-900)' },
                { shade: 950, var: 'var(--color-educanvas-950)' }
              ].map(({ shade, var: colorVar }) => (
                <div
                  key={shade}
                  className="w-full h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colorVar }}
                >
                  <span className={`text-xs font-mono ${shade >= 500 ? 'text-white' : 'text-neutral-800'}`}>
                    {shade}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Education Theme Colors */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">지혜 (Wisdom) - 청록색</h3>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { shade: 100, var: 'var(--color-wisdom-100)' },
                  { shade: 300, var: 'var(--color-wisdom-300)' },
                  { shade: 500, var: 'var(--color-wisdom-500)' },
                  { shade: 700, var: 'var(--color-wisdom-700)' },
                  { shade: 900, var: 'var(--color-wisdom-900)' }
                ].map(({ shade, var: colorVar }) => (
                  <div
                    key={shade}
                    className="w-full h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: colorVar }}
                  >
                    <span className={`text-xs font-mono ${shade >= 500 ? 'text-white' : 'text-neutral-800'}`}>
                      {shade}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">성장 (Growth) - 녹색</h3>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { shade: 100, var: 'var(--color-growth-100)' },
                  { shade: 300, var: 'var(--color-growth-300)' },
                  { shade: 500, var: 'var(--color-growth-500)' },
                  { shade: 700, var: 'var(--color-growth-700)' },
                  { shade: 900, var: 'var(--color-growth-900)' }
                ].map(({ shade, var: colorVar }) => (
                  <div
                    key={shade}
                    className="w-full h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: colorVar }}
                  >
                    <span className={`text-xs font-mono ${shade >= 500 ? 'text-white' : 'text-neutral-800'}`}>
                      {shade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: 'Success', color: 'success', label: '성공' },
              { name: 'Warning', color: 'warning', label: '경고' },
              { name: 'Error', color: 'error', label: '오류' },
              { name: 'Info', color: 'info', label: '정보' }
            ].map(({ name, color, label }) => (
              <div key={name} className="space-y-2">
                <h4 className="font-medium">{label} ({name})</h4>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { shade: 200, var: `var(--color-${color}-200)` },
                    { shade: 500, var: `var(--color-${color}-500)` },
                    { shade: 800, var: `var(--color-${color}-800)` }
                  ].map(({ shade, var: colorVar }) => (
                    <div
                      key={shade}
                      className="w-full h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: colorVar }}
                    >
                      <span className={`text-xs font-mono ${shade >= 500 ? 'text-white' : 'text-neutral-800'}`}>
                        {shade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 타이포그래피 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 타이포그래피 시스템
          </CardTitle>
          <CardDescription>
            폰트 크기, 줄간격, 글자간격 스케일 테스트
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size Scale */}
          <div className="space-y-4">
            {[
              { size: '6xl', label: '메인 디스플레이', text: 'EduCanvas 학원 관리 시스템' },
              { size: '5xl', label: '페이지 제목', text: '학생 관리 대시보드' },
              { size: '4xl', label: '섹션 제목', text: '수강 등록 현황' },
              { size: '3xl', label: '서브 섹션', text: '출석 관리' },
              { size: '2xl', label: '컴포넌트 제목', text: '학생 목록' },
              { size: 'xl', label: '소제목', text: '필터 옵션' },
              { size: 'lg', label: '중요 본문', text: '학생 정보를 확인하고 수정할 수 있습니다.' },
              { size: 'base', label: '기본 본문', text: '일반적인 본문 텍스트로 사용되는 크기입니다.' },
              { size: 'sm', label: '보조 텍스트', text: '부가 정보나 설명을 위한 작은 텍스트입니다.' },
              { size: 'xs', label: '캡션/라벨', text: '라벨, 캡션, 메타데이터용 최소 크기입니다.' }
            ].map(({ size, label, text }) => (
              <div key={size} className="border-l-4 border-primary pl-4">
                <div className="flex items-baseline gap-4 mb-1">
                  <Badge variant="outline" className="font-mono">
                    text-{size}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className={`text-${size} font-medium`}>{text}</p>
              </div>
            ))}
          </div>

          {/* Line Height Examples */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">줄간격 (Line Height) 테스트</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { height: 'tight', label: '타이트 (1.2)', text: '제목용 줄간격으로 압축적인 느낌을 줍니다. 제목이나 헤딩에 적합합니다.' },
                { height: 'normal', label: '보통 (1.5)', text: '기본 본문용 줄간격으로 가독성이 좋습니다. 일반적인 문단에 사용됩니다.' },
                { height: 'relaxed', label: '여유로운 (1.625)', text: '긴 텍스트용 줄간격으로 읽기 편안합니다. 긴 문서나 설명문에 적합합니다.' },
                { height: 'loose', label: '느슨한 (1.75)', text: '매우 여유로운 줄간격으로 시각적 여백을 제공합니다.' }
              ].map(({ height, label, text }) => (
                <div key={height} className="space-y-2">
                  <Badge variant="secondary" className="font-mono">
                    leading-{height}
                  </Badge>
                  <p className={`leading-${height} text-sm`}>
                    <strong>{label}:</strong> {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 간격 시스템 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📏 간격 시스템 (Spacing)
          </CardTitle>
          <CardDescription>
            마진, 패딩, 갭 간격 스케일 시각화
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Spacing Scale Visualization */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">기본 간격 스케일 (4px 기준)</h3>
            <div className="space-y-2">
              {[
                { size: '1', px: '4px', desc: '최소 간격' },
                { size: '2', px: '8px', desc: '작은 간격' },
                { size: '4', px: '16px', desc: '기본 간격' },
                { size: '6', px: '24px', desc: '중간 간격' },
                { size: '8', px: '32px', desc: '큰 간격' },
                { size: '12', px: '48px', desc: '섹션 간격' },
                { size: '16', px: '64px', desc: '블록 간격' },
                { size: '24', px: '96px', desc: '레이아웃 간격' }
              ].map(({ size, px, desc }) => (
                <div key={size} className="flex items-center gap-4">
                  <Badge variant="outline" className="font-mono w-16 justify-center">
                    {size}
                  </Badge>
                  <div className={`h-4 bg-primary rounded`} style={{ width: px }} />
                  <span className="text-sm text-muted-foreground">{px} - {desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Component Spacing Examples */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">컴포넌트 간격 적용 예시</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-medium">Form 컴포넌트</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="example1">학생 이름</Label>
                    <Input id="example1" placeholder="이름을 입력하세요" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="example2">이메일</Label>
                    <Input id="example2" type="email" placeholder="email@example.com" className="mt-1" />
                  </div>
                  <Button className="mt-4">등록하기</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Card 컴포넌트</h4>
                <Card className="p-6">
                  <div className="space-y-3">
                    <h5 className="font-semibold">학생 정보</h5>
                    <p className="text-sm text-muted-foreground">
                      패딩과 간격이 일관되게 적용된 카드 레이아웃
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">활성</Badge>
                      <Badge variant="outline">신입</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 타이포그래피 시스템 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✍️ 타이포그래피 시스템 (12레벨)
          </CardTitle>
          <CardDescription>
            T-V2-002: 완성된 타이포그래피 스케일과 줄간격 시스템
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-display leading-display font-bold text-educanvas-600 tracking-tight">
              Display (64px) - 메인 타이틀
            </div>
            <h1 className="text-heading-1 leading-heading font-bold text-educanvas-700 tracking-tight">
              Heading 1 (48px) - 페이지 제목
            </h1>
            <h2 className="text-heading-2 leading-heading font-semibold text-educanvas-600 tracking-tight">
              Heading 2 (36px) - 섹션 제목
            </h2>
            <h3 className="text-heading-3 leading-heading font-semibold text-wisdom-600 tracking-normal">
              Heading 3 (28px) - 서브 섹션
            </h3>
            <h4 className="text-heading-4 leading-heading font-medium text-wisdom-500 tracking-normal">
              Heading 4 (24px) - 컴포넌트 제목
            </h4>
            <h5 className="text-heading-5 leading-heading font-medium text-growth-600 tracking-normal">
              Heading 5 (20px) - 소제목
            </h5>
            <p className="text-body-large leading-body text-growth-500 font-medium">
              Body Large (18px) - 중요한 본문에 사용됩니다
            </p>
            <p className="text-base leading-body text-foreground">
              Body Base (16px) - 기본 본문 텍스트입니다
            </p>
            <p className="text-body-small leading-body text-muted-foreground">
              Body Small (14px) - 보조 설명에 사용합니다
            </p>
            <p className="text-caption leading-body text-muted-foreground">
              Caption (12px) - 라벨 텍스트입니다
            </p>
            <p className="text-overline leading-body uppercase tracking-wide text-muted-foreground font-semibold">
              OVERLINE (11px) - 카테고리 표시
            </p>
            <p className="text-tiny leading-body text-muted-foreground">
              Tiny (10px) - 가장 작은 텍스트
            </p>
          </div>
          
          {/* 줄간격 시연 */}
          <div className="mt-8 space-y-6">
            <h3 className="text-heading-4 font-semibold text-wisdom-600">줄간격 시스템 시연</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-educanvas-50 dark:bg-educanvas-950/20 rounded-lg border border-educanvas-200 dark:border-educanvas-800">
                <Badge className="mb-3 bg-educanvas-100 text-educanvas-700 dark:bg-educanvas-800 dark:text-educanvas-300">leading-display (1.1)</Badge>
                <div className="text-heading-3 leading-display text-educanvas-700 dark:text-educanvas-300">
                  Display Line Height<br />
                  조밀한 제목용 간격<br />
                  여러 줄 제목에 적합
                </div>
              </div>
              <div className="p-4 bg-growth-50 dark:bg-growth-950/20 rounded-lg border border-growth-200 dark:border-growth-800">
                <Badge className="mb-3 bg-growth-100 text-growth-700 dark:bg-growth-800 dark:text-growth-300">leading-relaxed (1.7)</Badge>
                <div className="text-body-large leading-relaxed text-growth-700 dark:text-growth-300">
                  Relaxed Line Height<br />
                  긴 텍스트를 읽을 때 편안한 간격<br />
                  여러 줄에 걸쳐 표시되는 내용에<br />
                  최적화된 가독성 제공
                </div>
              </div>
            </div>
          </div>
          
          {/* 글자간격 시연 */}
          <div className="mt-8 space-y-4">
            <h3 className="text-heading-4 font-semibold text-wisdom-600">글자간격 시스템 시연</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded border border-dashed">
                <Badge className="mb-2">tracking-tight (-0.025em)</Badge>
                <div className="text-heading-3 tracking-tight text-educanvas-600 font-semibold">
                  Tight Spacing - 제목용 압축 간격
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded border border-dashed">
                <Badge className="mb-2">tracking-normal (0em)</Badge>
                <div className="text-heading-3 tracking-normal text-foreground">
                  Normal Spacing - 기본 글자 간격
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded border border-dashed">
                <Badge className="mb-2">tracking-wide (0.025em)</Badge>
                <div className="text-heading-3 tracking-wide text-growth-600 font-medium">
                  Wide Spacing - 강조용 확장 간격
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-heading-4">교육 특화 간격 테스트</h4>
              <div className="space-y-2">
                <div className="p-lesson bg-educanvas-50 rounded text-body-small border border-educanvas-200">
                  레슨 간격 (spacing-lesson)
                </div>
                <div className="p-exercise bg-wisdom-50 rounded text-body-small border border-wisdom-200">
                  연습문제 간격 (spacing-exercise)
                </div>
                <div className="p-question bg-growth-50 rounded text-body-small border border-growth-200">
                  문제 간격 (spacing-question)
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-heading-4">브랜드 색상 조합</h4>
              <div className="space-y-2">
                <div className="bg-educanvas-500 text-white p-3 rounded text-body-small">
                  EduCanvas Primary: 메인 브랜드
                </div>
                <div className="bg-wisdom-500 text-white p-3 rounded text-body-small">
                  Wisdom: 지혜와 학습
                </div>
                <div className="bg-growth-500 text-white p-3 rounded text-body-small">
                  Growth: 성장과 발전
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 컴포넌트 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧩 컴포넌트 통합 테스트
          </CardTitle>
          <CardDescription>
            새로운 디자인 토큰이 적용된 shadcn/ui 컴포넌트
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold">Button 컴포넌트</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <h3 className="font-semibold">Badge 컴포넌트</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="secondary">Success</Badge>
              <Badge variant="destructive">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="outline">Info</Badge>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-3">
            <h3 className="font-semibold">Alert 컴포넌트</h3>
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  기본 알림: 새로운 디자인 토큰이 성공적으로 적용되었습니다.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertDescription>
                  오류 알림: 일부 설정에 문제가 발생했습니다.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Utility Classes */}
          <div className="space-y-3">
            <h3 className="font-semibold">유틸리티 클래스 테스트</h3>
            <div className="grid md:grid-cols-2 gap-4 relative">
              {/* 배경 이미지/패턴을 위한 absolute div */}
              <div className="absolute inset-0 bg-gradient-to-br from-educanvas-100 to-wisdom-100 rounded-lg -z-10"></div>
              
              <div className="p-4 glass rounded-lg border border-white/20">
                <h4 className="font-medium mb-2">글래스 효과</h4>
                <p className="text-sm text-muted-foreground">
                  backdrop-filter를 활용한 반투명 효과
                </p>
              </div>
              <div className="p-4 gradient-primary rounded-lg text-white">
                <h4 className="font-medium mb-2">그라데이션 배경</h4>
                <p className="text-sm opacity-90">
                  교육 테마 색상 그라데이션
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 다크모드 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌙 다크/라이트 모드 호환성
          </CardTitle>
          <CardDescription>
            테마 전환 시 색상 토큰 적용 상태 확인
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">시스템 색상 변수</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-background border border-border rounded" />
                  <span>--color-background</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-foreground rounded" />
                  <span>--color-foreground</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary rounded" />
                  <span>--color-primary</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted border border-border rounded" />
                  <span>--color-muted</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">테마 전환 테스트</h4>
              <p className="text-sm text-muted-foreground mb-4">
                페이지 우상단의 다크모드 토글 버튼으로 테마를 전환하여
                모든 색상이 자동으로 조정되는지 확인하세요.
              </p>
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <p className="text-center text-muted-foreground">
                  이 영역의 배경과 텍스트가 테마에 따라 변경됩니다
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 푸터 */}
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          EduCanvas v2 Design Tokens Test • T-V2-002 완료 검증
        </p>
      </div>
    </div>
  )
}