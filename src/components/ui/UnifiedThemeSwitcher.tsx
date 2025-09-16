/**
 * EduCanvas 통합 테마 스위처
 * 10토큰 기반 다중 테마 + 라이트/다크 모드 + 실시간 미리보기
 * @version 2.0
 * @date 2025-01-11
 */

'use client';

import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Check,
  Sparkles,
  Eye,
  Settings
} from 'lucide-react';
import type { Theme } from '@/types/theme.types';

interface UnifiedThemeSwitcherProps {
  className?: string;
  compact?: boolean;
  showPreview?: boolean;
}

export function UnifiedThemeSwitcher({ 
  className, 
  compact = false, 
  showPreview = true 
}: UnifiedThemeSwitcherProps) {
  const { 
    availableThemes, 
    currentTheme, 
    setTheme, 
    mode, 
    setMode, 
    isLight, 
    isDark, 
    isAuto,
    toggleMode,
    themeInfo
  } = useTheme();

  const [hoveredTheme, setHoveredTheme] = useState<Theme | null>(null);

  // 모드 옵션들
  const modeOptions = [
    { value: 'light' as const, label: '라이트', icon: Sun, active: isLight },
    { value: 'dark' as const, label: '다크', icon: Moon, active: isDark },
    { value: 'auto' as const, label: '자동', icon: Monitor, active: isAuto },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* 간단한 테마 선택 */}
        <div className="flex gap-1">
          {availableThemes.map((theme) => (
            <ThemePreviewDot
              key={theme.name}
              theme={theme}
              isActive={currentTheme.name === theme.name}
              onClick={() => setTheme(theme.name)}
            />
          ))}
        </div>
        
        {/* 모드 토글 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMode}
          className="p-2"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-primary-300" />
          테마 설정
          <Badge variant="outline" className="ml-auto text-xs">
            10토큰
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 테마 선택 그리드 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            테마 선택
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {availableThemes.map((theme) => (
              <ThemePreviewCard
                key={theme.name}
                theme={theme}
                isActive={currentTheme.name === theme.name}
                isHovered={hoveredTheme?.name === theme.name}
                onClick={() => setTheme(theme.name)}
                onHover={() => setHoveredTheme(theme)}
                onLeave={() => setHoveredTheme(null)}
              />
            ))}
          </div>
        </div>

        {/* 모드 선택 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-100 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            표시 모드
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {modeOptions.map(({ value, label, icon: Icon, active }) => (
              <Button
                key={value}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setMode(value)}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3 theme-transition",
                  active && "bg-primary-300 text-text-100"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 실시간 미리보기 */}
        {showPreview && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-100 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              미리보기
            </h4>
            <LivePreview theme={hoveredTheme || currentTheme} />
          </div>
        )}

        {/* 현재 테마 정보 */}
        <div className="pt-3 border-t border-bg-300">
          <div className="text-xs text-text-200 space-y-1">
            <div className="flex justify-between">
              <span>현재 테마:</span>
              <span className="font-medium text-text-100">
                {currentTheme.displayName}
              </span>
            </div>
            <div className="flex justify-between">
              <span>모드:</span>
              <span className="font-medium text-text-100">
                {modeOptions.find(opt => opt.value === mode)?.label}
              </span>
            </div>
            {themeInfo.accessibility && (
              <div className="flex justify-between">
                <span>대비율:</span>
                <span className={cn(
                  "font-medium",
                  themeInfo.accessibility.lightMode.textBgContrast >= 4.5 
                    ? "text-accent-200" 
                    : "text-primary-300"
                )}>
                  {themeInfo.accessibility.lightMode.textBgContrast.toFixed(1)}:1
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 테마 미리보기 카드
 */
interface ThemePreviewCardProps {
  theme: Theme;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

function ThemePreviewCard({
  theme,
  isActive,
  isHovered,
  onClick,
  onHover,
  onLeave,
}: ThemePreviewCardProps) {
  const colors = theme.colors.light;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "relative p-3 rounded-lg border-2 transition-all duration-200 text-left",
        "hover:scale-105 hover:shadow-theme-md",
        isActive 
          ? "border-primary-300 bg-primary-100/20" 
          : "border-bg-300 hover:border-accent-100"
      )}
      style={{
        background: isHovered 
          ? `linear-gradient(135deg, ${colors.bg[100]}, ${colors.bg[200]})`
          : `linear-gradient(135deg, ${colors.bg[100]}, ${colors.bg[200]})`,
      }}
    >
      {/* 색상 스와치 */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex gap-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: colors.primary[300] }}
          />
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: colors.accent[100] }}
          />
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: colors.accent[200] }}
          />
        </div>
        {isActive && (
          <Check className="h-4 w-4 text-primary-300 ml-auto" />
        )}
      </div>

      {/* 테마 정보 */}
      <div>
        <div 
          className="font-medium text-sm mb-1"
          style={{ color: colors.text[100] }}
        >
          {theme.displayName}
        </div>
        {theme.description && (
          <div 
            className="text-xs leading-relaxed"
            style={{ color: colors.text[200] }}
          >
            {theme.description}
          </div>
        )}
      </div>

      {/* 미니 프리뷰 */}
      <div className="mt-3 space-y-1">
        <div 
          className="h-2 rounded" 
          style={{ backgroundColor: colors.primary[300] }}
        />
        <div 
          className="h-1 rounded w-2/3" 
          style={{ backgroundColor: colors.accent[100] }}
        />
      </div>
    </button>
  );
}

/**
 * 테마 미리보기 점 (간단 버전)
 */
interface ThemePreviewDotProps {
  theme: Theme;
  isActive: boolean;
  onClick: () => void;
}

function ThemePreviewDot({ theme, isActive, onClick }: ThemePreviewDotProps) {
  const colors = theme.colors.light;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-8 h-8 rounded-full transition-all duration-200",
        "hover:scale-110 hover:shadow-theme-sm",
        isActive && "ring-2 ring-primary-300 ring-offset-2 ring-offset-bg-100"
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.primary[300]}, ${colors.accent[100]})`,
      }}
      title={theme.displayName}
    >
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

/**
 * 실시간 미리보기 컴포넌트
 */
interface LivePreviewProps {
  theme: Theme;
}

function LivePreview({ theme }: LivePreviewProps) {
  const colors = theme.colors.light;

  return (
    <div 
      className="p-3 rounded-lg border transition-all duration-300"
      style={{
        backgroundColor: colors.bg[100],
        borderColor: colors.bg[300],
      }}
    >
      {/* 미니 UI 요소들 */}
      <div className="space-y-2">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div 
            className="font-medium text-sm"
            style={{ color: colors.text[100] }}
          >
            미리보기
          </div>
          <div 
            className="w-6 h-6 rounded"
            style={{ backgroundColor: colors.primary[300] }}
          />
        </div>
        
        {/* 카드 */}
        <div 
          className="p-2 rounded border"
          style={{
            backgroundColor: colors.bg[200],
            borderColor: colors.bg[300],
          }}
        >
          <div 
            className="text-xs font-medium mb-1"
            style={{ color: colors.text[100] }}
          >
            카드 제목
          </div>
          <div 
            className="text-xs"
            style={{ color: colors.text[200] }}
          >
            카드 내용 텍스트입니다.
          </div>
        </div>
        
        {/* 버튼들 */}
        <div className="flex gap-2">
          <div 
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: colors.primary[300],
              color: colors.bg[100],
            }}
          >
            Primary
          </div>
          <div 
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: colors.accent[200],
              color: colors.bg[100],
            }}
          >
            Accent
          </div>
        </div>
      </div>
    </div>
  );
}