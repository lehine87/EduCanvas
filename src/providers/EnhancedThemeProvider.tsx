/**
 * EduCanvas 강화된 테마 프로바이더
 * next-themes 확장 + CSS 변수 동적 주입 + 10토큰 시스템
 * @version 2.0
 * @date 2025-01-11
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeContext, DEFAULT_THEME_CONFIG } from '@/contexts/ThemeContext';
import { availableThemes, getThemeByName, DEFAULT_THEME } from '@/theme/themes';
import { 
  generateCSSVariables, 
  applyCSSVariables,
  generateBackgroundStyles,
  loadThemeConfig,
  saveThemeConfig,
  getSystemTheme,
  enableThemeTransition
} from '@/theme/utils';
import type { 
  Theme, 
  ThemeConfig, 
  ColorToken, 
  BackgroundConfig,
  ThemeContextType 
} from '@/types/theme.types';

interface EnhancedThemeProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
}

export function EnhancedThemeProvider({
  children,
  storageKey = 'educanvas-theme-config',
  defaultTheme = 'default',
  enableSystem = true,
}: EnhancedThemeProviderProps) {
  // 테마 설정 상태
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_THEME_CONFIG, currentTheme: defaultTheme };
    }
    
    const savedConfig = loadThemeConfig(storageKey);
    return savedConfig || { ...DEFAULT_THEME_CONFIG, currentTheme: defaultTheme };
  });

  // 마운트 상태 (SSR 대응)
  const [mounted, setMounted] = useState(false);

  // 현재 테마 객체
  const currentTheme = useMemo(() => {
    return getThemeByName(config.currentTheme) || DEFAULT_THEME;
  }, [config.currentTheme]);

  // 현재 색상 토큰 (라이트/다크 모드에 따라)
  const getCurrentColors = useCallback((): ColorToken => {
    const mode = config.mode === 'auto' ? getSystemTheme() : config.mode;
    return currentTheme.colors[mode];
  }, [currentTheme, config.mode]);

  // 사용 가능한 테마 목록 (기본 + 커스텀)
  const allAvailableThemes = useMemo(() => {
    const customThemes = Object.values(config.customThemes || {});
    return [...availableThemes, ...customThemes];
  }, [config.customThemes]);

  // CSS 변수 적용
  const applyThemeStyles = useCallback(() => {
    const colors = getCurrentColors();
    const cssVariables = generateCSSVariables(colors);
    applyCSSVariables(cssVariables);

    // 배경 스타일 적용
    if (config.background) {
      const backgroundStyles = generateBackgroundStyles(config.background, colors);
      const body = document.body;
      Object.entries(backgroundStyles).forEach(([property, value]) => {
        body.style.setProperty(property, value);
      });
    }
  }, [getCurrentColors, config.background]);

  // 테마 변경
  const setTheme = useCallback((themeName: string) => {
    const theme = getThemeByName(themeName) || config.customThemes?.[themeName];
    if (!theme) {
      console.warn(`Theme '${themeName}' not found`);
      return;
    }

    enableThemeTransition();
    setConfig(prev => {
      const newConfig = { ...prev, currentTheme: themeName };
      saveThemeConfig(newConfig, storageKey);
      return newConfig;
    });
  }, [config.customThemes, storageKey]);

  // 모드 변경 (라이트/다크/자동)
  const setMode = useCallback((mode: 'light' | 'dark' | 'auto') => {
    enableThemeTransition();
    setConfig(prev => {
      const newConfig = { ...prev, mode };
      saveThemeConfig(newConfig, storageKey);
      return newConfig;
    });
  }, [storageKey]);

  // 배경화면 설정
  const setBackground = useCallback((background?: BackgroundConfig) => {
    setConfig(prev => {
      const newConfig = { ...prev, background };
      saveThemeConfig(newConfig, storageKey);
      return newConfig;
    });
  }, [storageKey]);

  // 커스텀 테마 생성
  const createCustomTheme = useCallback((name: string, theme: Omit<Theme, 'name'>) => {
    const newTheme: Theme = { ...theme, name };
    setConfig(prev => {
      const newConfig = {
        ...prev,
        customThemes: {
          ...prev.customThemes,
          [name]: newTheme,
        },
      };
      saveThemeConfig(newConfig, storageKey);
      return newConfig;
    });
  }, [storageKey]);

  // 커스텀 테마 삭제
  const deleteCustomTheme = useCallback((name: string) => {
    setConfig(prev => {
      const newCustomThemes = { ...prev.customThemes };
      delete newCustomThemes[name];
      
      const newConfig = {
        ...prev,
        customThemes: newCustomThemes,
        // 삭제된 테마가 현재 테마라면 기본 테마로 변경
        currentTheme: prev.currentTheme === name ? defaultTheme : prev.currentTheme,
      };
      saveThemeConfig(newConfig, storageKey);
      return newConfig;
    });
  }, [defaultTheme, storageKey]);

  // 컨텍스트 값
  const contextValue: ThemeContextType = {
    // 현재 상태
    currentTheme,
    mode: config.mode,
    background: config.background,

    // 테마 변경
    setTheme,
    setMode,
    setBackground,

    // 유틸리티
    availableThemes: allAvailableThemes,
    getCurrentColors,
    createCustomTheme,
    deleteCustomTheme,

    // 상태 확인
    isLight: config.mode === 'light' || (config.mode === 'auto' && getSystemTheme() === 'light'),
    isDark: config.mode === 'dark' || (config.mode === 'auto' && getSystemTheme() === 'dark'),
    isAuto: config.mode === 'auto',
  };

  // 마운트 시 초기화
  useEffect(() => {
    setMounted(true);
  }, []);

  // CSS 변수 적용 (테마 변경 시)
  useEffect(() => {
    if (mounted) {
      applyThemeStyles();
    }
  }, [mounted, applyThemeStyles]);

  // 시스템 테마 변경 감지 (auto 모드일 때)
  useEffect(() => {
    if (!mounted || config.mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (config.mode === 'auto') {
        applyThemeStyles();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, config.mode, applyThemeStyles]);

  // SSR 처리
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={config.mode === 'auto' ? 'system' : config.mode}
      enableSystem={enableSystem}
      storageKey={`${storageKey}-next-themes`}
      disableTransitionOnChange
    >
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  );
}