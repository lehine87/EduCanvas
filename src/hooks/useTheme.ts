/**
 * EduCanvas useTheme 훅
 * 10토큰 테마 시스템의 간편한 접근 인터페이스
 * @version 2.0
 * @date 2025-01-11
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useThemeContext } from '@/contexts/ThemeContext';
import { validateThemeAccessibility } from '@/theme/utils';
import type { 
  ColorToken, 
  ComponentThemeOverride,
  ThemeValidationResult 
} from '@/types/theme.types';

/**
 * 메인 테마 훅
 * 테마 시스템의 모든 기능에 접근할 수 있는 통합 인터페이스
 */
export function useTheme() {
  const context = useThemeContext();
  const nextTheme = useNextTheme();

  // 컴포넌트별 테마 오버라이드
  const useComponentTheme = useCallback((overrideColors?: Partial<ColorToken>) => {
    const currentColors = context.getCurrentColors();
    
    if (!overrideColors) {
      return currentColors;
    }

    // 현재 색상과 오버라이드 색상을 병합
    return {
      primary: { ...currentColors.primary, ...overrideColors.primary },
      accent: { ...currentColors.accent, ...overrideColors.accent },
      text: { ...currentColors.text, ...overrideColors.text },
      bg: { ...currentColors.bg, ...overrideColors.bg },
    };
  }, [context]);

  // 테마 검증
  const validateCurrentTheme = useCallback((): ThemeValidationResult => {
    return validateThemeAccessibility(context.currentTheme);
  }, [context.currentTheme]);

  // 토글 함수들
  const toggleMode = useCallback(() => {
    const newMode = context.isDark ? 'light' : 'dark';
    context.setMode(newMode);
  }, [context]);

  // 다음 테마로 전환
  const nextTheme_ = useCallback(() => {
    const currentIndex = context.availableThemes.findIndex(
      theme => theme.name === context.currentTheme.name
    );
    const nextIndex = (currentIndex + 1) % context.availableThemes.length;
    const nextTheme = context.availableThemes[nextIndex];
    context.setTheme(nextTheme.name);
  }, [context]);

  // 이전 테마로 전환
  const previousTheme = useCallback(() => {
    const currentIndex = context.availableThemes.findIndex(
      theme => theme.name === context.currentTheme.name
    );
    const prevIndex = currentIndex === 0 
      ? context.availableThemes.length - 1 
      : currentIndex - 1;
    const prevTheme = context.availableThemes[prevIndex];
    context.setTheme(prevTheme.name);
  }, [context]);

  // CSS 클래스 생성 헬퍼
  const getThemeClasses = useCallback((baseClasses: string = '') => {
    const modeClass = context.isDark ? 'dark' : 'light';
    const themeClass = `theme-${context.currentTheme.name}`;
    return `${baseClasses} ${modeClass} ${themeClass}`.trim();
  }, [context]);

  // 인라인 스타일 생성 (고급 사용)
  const getThemeStyles = useCallback((overrides?: Partial<ColorToken>) => {
    const colors = useComponentTheme(overrides);
    return {
      '--primary-100': colors.primary[100],
      '--primary-200': colors.primary[200],
      '--primary-300': colors.primary[300],
      '--accent-100': colors.accent[100],
      '--accent-200': colors.accent[200],
      '--text-100': colors.text[100],
      '--text-200': colors.text[200],
      '--bg-100': colors.bg[100],
      '--bg-200': colors.bg[200],
      '--bg-300': colors.bg[300],
    } as React.CSSProperties;
  }, [useComponentTheme]);

  // 색상 팔레트 정보 (디버깅/개발 도구용)
  const themeInfo = useMemo(() => {
    const validation = validateCurrentTheme();
    return {
      name: context.currentTheme.name,
      displayName: context.currentTheme.displayName,
      description: context.currentTheme.description,
      mode: context.mode,
      isValid: validation.isValid,
      accessibility: validation.accessibility,
      colors: context.getCurrentColors(),
    };
  }, [context, validateCurrentTheme]);

  return {
    // 기본 상태
    ...context,
    
    // Next.js 테마 통합
    systemTheme: nextTheme.systemTheme,
    resolvedTheme: nextTheme.resolvedTheme,
    
    // 편의 함수들
    toggleMode,
    nextTheme: nextTheme_,
    previousTheme,
    
    // 컴포넌트 지원
    useComponentTheme,
    getThemeClasses,
    getThemeStyles,
    
    // 검증 & 정보
    validateCurrentTheme,
    themeInfo,
    
    // 단축 속성들
    colors: context.getCurrentColors(),
    themeName: context.currentTheme.name,
    themeDisplayName: context.currentTheme.displayName,
  };
}

/**
 * 간단한 색상 접근 훅
 * 10개 토큰에만 빠르게 접근하고 싶을 때 사용
 */
export function useColors(): ColorToken {
  const { getCurrentColors } = useThemeContext();
  return getCurrentColors();
}

/**
 * 테마 모드만 필요할 때 사용하는 경량 훅
 */
export function useThemeMode() {
  const { mode, setMode, isLight, isDark, isAuto } = useThemeContext();
  
  const toggleMode = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  }, [isDark, setMode]);
  
  return {
    mode,
    setMode,
    toggleMode,
    isLight,
    isDark,
    isAuto,
  };
}

/**
 * 컴포넌트별 테마 오버라이드 전용 훅
 */
export function useComponentTheme(overrides?: ComponentThemeOverride) {
  const { getCurrentColors } = useThemeContext();
  
  return useMemo(() => {
    const baseColors = getCurrentColors();
    
    if (!overrides?.colors) {
      return baseColors;
    }
    
    return {
      primary: { ...baseColors.primary, ...overrides.colors.primary },
      accent: { ...baseColors.accent, ...overrides.colors.accent },
      text: { ...baseColors.text, ...overrides.colors.text },
      bg: { ...baseColors.bg, ...overrides.colors.bg },
    };
  }, [getCurrentColors, overrides]);
}

/**
 * 배경 설정 전용 훅
 */
export function useBackground() {
  const { background, setBackground } = useThemeContext();
  
  const clearBackground = useCallback(() => {
    setBackground(undefined);
  }, [setBackground]);
  
  const setGradientBackground = useCallback((gradient: string) => {
    setBackground({
      type: 'gradient',
      value: gradient,
    });
  }, [setBackground]);
  
  const setPatternBackground = useCallback((pattern: string) => {
    setBackground({
      type: 'pattern',
      value: pattern,
    });
  }, [setBackground]);
  
  const setImageBackground = useCallback((imageUrl: string, opacity = 1, blur = 0) => {
    setBackground({
      type: 'image',
      value: imageUrl,
      opacity,
      blur,
    });
  }, [setBackground]);
  
  return {
    background,
    setBackground,
    clearBackground,
    setGradientBackground,
    setPatternBackground,
    setImageBackground,
  };
}

// 타입 추론을 위한 re-export
export type { ColorToken, ComponentThemeOverride, ThemeValidationResult };