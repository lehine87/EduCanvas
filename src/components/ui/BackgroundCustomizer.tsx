/**
 * EduCanvas 배경화면 커스터마이저
 * 10토큰 기반 그라디언트/패턴/이미지 배경 설정
 * @version 2.0
 * @date 2025-01-11
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useBackground, useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Image as ImageIcon, 
  Palette, 
  Grid3x3, 
  Droplets,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Brush
} from 'lucide-react';
import type { BackgroundConfig } from '@/types/theme.types';

interface BackgroundCustomizerProps {
  className?: string;
  compact?: boolean;
}

export function BackgroundCustomizer({ 
  className, 
  compact = false 
}: BackgroundCustomizerProps) {
  const { 
    background, 
    setBackground, 
    clearBackground,
    setGradientBackground,
    setPatternBackground,
    setImageBackground
  } = useBackground();
  
  const { colors, currentTheme } = useTheme();
  
  const [opacity, setOpacity] = useState(background?.opacity ?? 1);
  const [blur, setBlur] = useState(background?.blur ?? 0);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [previewMode, setPreviewMode] = useState(true);

  // 미리 정의된 그라디언트 패턴들 (10토큰 기반)
  const gradientPresets = [
    {
      name: '브랜드 그라디언트',
      value: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
      description: '메인 브랜드 색상 조합'
    },
    {
      name: '액센트 그라디언트',
      value: 'linear-gradient(135deg, var(--accent-100), var(--accent-200))',
      description: '강조 색상 조합'
    },
    {
      name: '서브틀 그라디언트',
      value: 'linear-gradient(135deg, var(--bg-100), var(--bg-200))',
      description: '부드러운 배경 조합'
    },
    {
      name: '다이나믹 그라디언트',
      value: 'linear-gradient(45deg, var(--primary-300), var(--accent-100), var(--primary-100))',
      description: '역동적인 3색 조합'
    },
    {
      name: '버티컬 그라디언트',
      value: 'linear-gradient(180deg, var(--bg-100), var(--primary-100))',
      description: '세로 방향 그라디언트'
    },
    {
      name: '라디얼 그라디언트',
      value: 'radial-gradient(circle at center, var(--accent-100), var(--bg-100))',
      description: '원형 그라디언트'
    },
  ];

  // 패턴 프리셋들
  const patternPresets = [
    { name: '도트 패턴', value: 'dots', description: '미묘한 점 패턴' },
    { name: '그리드 패턴', value: 'grid', description: '격자 패턴' },
    { name: '웨이브 패턴', value: 'waves', description: '물결 패턴' },
    { name: '트라이앵글', value: 'triangles', description: '삼각형 패턴' },
    { name: '헥사곤', value: 'hexagons', description: '육각형 패턴' },
    { name: '노이즈', value: 'noise', description: '텍스처 노이즈' },
  ];

  // 이미지 프리셋들
  const imagePresets = [
    { name: '추상 1', url: '/backgrounds/abstract-1.jpg', description: '추상적 패턴' },
    { name: '추상 2', url: '/backgrounds/abstract-2.jpg', description: '컬러풀한 추상' },
    { name: '기하학', url: '/backgrounds/geometric.jpg', description: '기하학적 패턴' },
    { name: '그라디언트', url: '/backgrounds/gradient-mesh.jpg', description: '메시 그라디언트' },
  ];

  // 배경 적용 함수
  const applyBackground = useCallback((config: BackgroundConfig) => {
    setBackground({
      ...config,
      opacity,
      blur,
    });
  }, [setBackground, opacity, blur]);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setGradientBackground(gradientPresets[0].value)}
          className="p-2"
        >
          <Palette className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPatternBackground('dots')}
          className="p-2"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearBackground}
          className="p-2"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-primary-300" />
          배경화면 설정
          <Badge variant="outline" className="ml-auto text-xs">
            {background?.type || '없음'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 미리보기 토글 */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">실시간 미리보기</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="p-2"
          >
            {previewMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>

        {/* 배경 타입 탭 */}
        <Tabs defaultValue="gradient" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gradient" className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              <span className="hidden sm:inline">그라디언트</span>
            </TabsTrigger>
            <TabsTrigger value="pattern" className="flex items-center gap-1">
              <Grid3x3 className="h-3 w-3" />
              <span className="hidden sm:inline">패턴</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span className="hidden sm:inline">이미지</span>
            </TabsTrigger>
            <TabsTrigger value="none" className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">없음</span>
            </TabsTrigger>
          </TabsList>

          {/* 그라디언트 설정 */}
          <TabsContent value="gradient" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Brush className="h-4 w-4" />
                그라디언트 선택
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {gradientPresets.map((preset) => (
                  <GradientPreview
                    key={preset.name}
                    preset={preset}
                    isActive={background?.value === preset.value}
                    onClick={() => applyBackground({
                      type: 'gradient',
                      value: preset.value,
                    })}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 패턴 설정 */}
          <TabsContent value="pattern" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                패턴 선택
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {patternPresets.map((preset) => (
                  <PatternPreview
                    key={preset.name}
                    preset={preset}
                    isActive={background?.value === preset.value}
                    onClick={() => applyBackground({
                      type: 'pattern',
                      value: preset.value,
                    })}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 이미지 설정 */}
          <TabsContent value="image" className="space-y-4">
            {/* 프리셋 이미지 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                프리셋 이미지
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {imagePresets.map((preset) => (
                  <ImagePreview
                    key={preset.name}
                    preset={preset}
                    isActive={background?.value === preset.url}
                    onClick={() => applyBackground({
                      type: 'image',
                      value: preset.url,
                    })}
                  />
                ))}
              </div>
            </div>

            {/* 커스텀 이미지 URL */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                커스텀 이미지 URL
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (customImageUrl) {
                      applyBackground({
                        type: 'image',
                        value: customImageUrl,
                      });
                    }
                  }}
                  disabled={!customImageUrl}
                >
                  적용
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 배경 없음 */}
          <TabsContent value="none" className="space-y-4">
            <div className="text-center py-8">
              <RotateCcw className="h-12 w-12 text-text-200 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-text-100 mb-2">
                배경화면 없음
              </h3>
              <p className="text-xs text-text-200 mb-4">
                깔끔한 단색 배경을 사용합니다
              </p>
              <Button onClick={clearBackground} size="sm">
                배경화면 제거
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* 투명도 및 블러 설정 */}
        {background && background.type !== 'solid' && (
          <div className="space-y-4 pt-4 border-t border-bg-300">
            {/* 투명도 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center justify-between">
                투명도
                <span className="text-xs text-text-200">
                  {Math.round(opacity * 100)}%
                </span>
              </Label>
              <Slider
                value={[opacity]}
                onValueChange={([value]) => setOpacity(value)}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* 블러 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center justify-between">
                블러
                <span className="text-xs text-text-200">
                  {blur}px
                </span>
              </Label>
              <Slider
                value={[blur]}
                onValueChange={([value]) => setBlur(value)}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* 현재 설정 정보 */}
        {background && (
          <div className="pt-4 border-t border-bg-300">
            <div className="text-xs text-text-200 space-y-1">
              <div className="flex justify-between">
                <span>타입:</span>
                <span className="font-medium text-text-100 capitalize">
                  {background.type}
                </span>
              </div>
              {background.opacity !== undefined && (
                <div className="flex justify-between">
                  <span>투명도:</span>
                  <span className="font-medium text-text-100">
                    {Math.round(background.opacity * 100)}%
                  </span>
                </div>
              )}
              {background.blur !== undefined && background.blur > 0 && (
                <div className="flex justify-between">
                  <span>블러:</span>
                  <span className="font-medium text-text-100">
                    {background.blur}px
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 그라디언트 미리보기 컴포넌트
interface GradientPreviewProps {
  preset: { name: string; value: string; description: string };
  isActive: boolean;
  onClick: () => void;
}

function GradientPreview({ preset, isActive, onClick }: GradientPreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-lg border transition-all duration-200 text-left",
        "hover:scale-105 hover:shadow-theme-sm",
        isActive ? "border-primary-300 ring-2 ring-primary-100" : "border-bg-300"
      )}
      style={{ background: preset.value }}
    >
      <div className="absolute inset-0 bg-text-100/80 rounded-lg flex flex-col justify-end p-2">
        <div className="text-xs font-medium text-bg-100 mb-1">
          {preset.name}
        </div>
        <div className="text-xs text-bg-200">
          {preset.description}
        </div>
      </div>
    </button>
  );
}

// 패턴 미리보기 컴포넌트
interface PatternPreviewProps {
  preset: { name: string; value: string; description: string };
  isActive: boolean;
  onClick: () => void;
}

function PatternPreview({ preset, isActive, onClick }: PatternPreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-lg border transition-all duration-200 text-left bg-bg-200",
        "hover:scale-105 hover:shadow-theme-sm",
        isActive ? "border-primary-300 ring-2 ring-primary-100" : "border-bg-300"
      )}
    >
      <div className="text-center py-4">
        <Grid3x3 className="h-8 w-8 text-text-200 mx-auto mb-2" />
        <div className="text-xs font-medium text-text-100 mb-1">
          {preset.name}
        </div>
        <div className="text-xs text-text-200">
          {preset.description}
        </div>
      </div>
    </button>
  );
}

// 이미지 미리보기 컴포넌트
interface ImagePreviewProps {
  preset: { name: string; url: string; description: string };
  isActive: boolean;
  onClick: () => void;
}

function ImagePreview({ preset, isActive, onClick }: ImagePreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-lg border transition-all duration-200 text-left overflow-hidden",
        "hover:scale-105 hover:shadow-theme-sm",
        isActive ? "border-primary-300 ring-2 ring-primary-100" : "border-bg-300"
      )}
    >
      <div className="aspect-square bg-bg-200 rounded flex items-center justify-center mb-2">
        <ImageIcon className="h-8 w-8 text-text-200" />
      </div>
      <div className="text-xs font-medium text-text-100 mb-1">
        {preset.name}
      </div>
      <div className="text-xs text-text-200">
        {preset.description}
      </div>
    </button>
  );
}