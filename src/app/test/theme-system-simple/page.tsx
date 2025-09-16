/**
 * 간단한 테마 시스템 테스트 페이지
 * 문제 진단을 위한 최소한의 구현
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SimpleThemeTestPage() {
  const [mounted, setMounted] = useState(false);
  const [testTheme, setTestTheme] = useState('default');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-100 text-text-100 p-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100 text-text-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">간단한 테마 시스템 테스트</h1>
          <Badge variant="outline">기본 기능 확인</Badge>
        </div>

        {/* 기본 컴포넌트 테스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>10토큰 색상 테스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary 색상 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Primary Colors</div>
                <div className="flex gap-2">
                  <div className="w-16 h-8 bg-primary-100 rounded border"></div>
                  <div className="w-16 h-8 bg-primary-200 rounded border"></div>
                  <div className="w-16 h-8 bg-primary-300 rounded border"></div>
                </div>
              </div>

              {/* Accent 색상 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Accent Colors</div>
                <div className="flex gap-2">
                  <div className="w-16 h-8 bg-accent-100 rounded border"></div>
                  <div className="w-16 h-8 bg-accent-200 rounded border"></div>
                </div>
              </div>

              {/* Text 색상 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Text Colors</div>
                <div className="space-y-1">
                  <div className="text-text-100">Main Text (text-100)</div>
                  <div className="text-text-200">Secondary Text (text-200)</div>
                </div>
              </div>

              {/* Background 색상 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Background Colors</div>
                <div className="flex gap-2">
                  <div className="w-16 h-8 bg-bg-100 rounded border border-bg-300"></div>
                  <div className="w-16 h-8 bg-bg-200 rounded border border-bg-300"></div>
                  <div className="w-16 h-8 bg-bg-300 rounded border border-bg-300"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>컴포넌트 테스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">버튼들</div>
                <div className="flex gap-2 flex-wrap">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">배지들</div>
                <div className="flex gap-2 flex-wrap">
                  <Badge>Default</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">테마 토글 (임시)</div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={testTheme === 'default' ? 'default' : 'outline'}
                    onClick={() => setTestTheme('default')}
                  >
                    Default
                  </Button>
                  <Button 
                    size="sm" 
                    variant={testTheme === 'ocean' ? 'default' : 'outline'}
                    onClick={() => setTestTheme('ocean')}
                  >
                    Ocean
                  </Button>
                  <Button 
                    size="sm" 
                    variant={testTheme === 'forest' ? 'default' : 'outline'}
                    onClick={() => setTestTheme('forest')}
                  >
                    Forest
                  </Button>
                </div>
                <div className="text-xs text-text-200">
                  현재 선택: {testTheme}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상태 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Mounted</div>
                <div className="text-text-200">{mounted ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-text-200">{testTheme}</div>
              </div>
              <div>
                <div className="font-medium">CSS Variables</div>
                <div className="text-text-200">10 tokens</div>
              </div>
              <div>
                <div className="font-medium">Client Side</div>
                <div className="text-text-200">{typeof window !== 'undefined' ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 색상 토큰 표시 */}
        <Card>
          <CardHeader>
            <CardTitle>CSS 변수 확인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs font-mono">
              <div>--primary-100: <span style={{color: 'var(--primary-100)'}}>●</span></div>
              <div>--primary-200: <span style={{color: 'var(--primary-200)'}}>●</span></div>
              <div>--primary-300: <span style={{color: 'var(--primary-300)'}}>●</span></div>
              <div>--accent-100: <span style={{color: 'var(--accent-100)'}}>●</span></div>
              <div>--accent-200: <span style={{color: 'var(--accent-200)'}}>●</span></div>
              <div>--text-100: <span style={{color: 'var(--text-100)'}}>●</span></div>
              <div>--text-200: <span style={{color: 'var(--text-200)'}}>●</span></div>
              <div>--bg-100: <span style={{backgroundColor: 'var(--bg-100)', border: '1px solid var(--bg-300)'}}>□</span></div>
              <div>--bg-200: <span style={{backgroundColor: 'var(--bg-200)', border: '1px solid var(--bg-300)'}}>□</span></div>
              <div>--bg-300: <span style={{backgroundColor: 'var(--bg-300)', border: '1px solid var(--text-200)'}}>□</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}