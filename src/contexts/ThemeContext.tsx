/**
 * EduCanvas 테마 컨텍스트
 * 10토큰 기반 통합 테마 시스템의 상태 관리
 * @version 2.0
 * @date 2025-01-11
 */

'use client';

import { createContext, useContext } from 'react';
import type { 
  ThemeContextType, 
  Theme, 
  ColorToken, 
  BackgroundConfig,
  ThemeConfig 
} from '@/types/theme.types';

// 테마 컨텍스트 생성
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 테마 컨텍스트 사용 훅 (SSR 안전)
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  // SSR 환경에서는 기본값 반환 (업계 표준 패턴)
  if (!context) {
    if (typeof window === 'undefined') {
      // SSR 환경에서의 기본값
      return {
        availableThemes: [],
        currentTheme: {
          name: 'default',
          displayName: 'Default',
          description: 'Default theme',
          colors: {
            light: {
              primary: { 100: '#d4eaf7', 200: '#b6ccd8', 300: '#3b3c3d' },
              accent: { 100: '#71c4ef', 200: '#00668c' },
              text: { 100: '#1d1c1c', 200: '#313d44' },
              bg: { 100: '#fffefb', 200: '#f5f4f1', 300: '#cccbc8' },
            },
            dark: {
              primary: { 100: '#1F3A5F', 200: '#4d648d', 300: '#acc2ef' },
              accent: { 100: '#3D5A80', 200: '#cee8ff' },
              text: { 100: '#FFFFFF', 200: '#e0e0e0' },
              bg: { 100: '#0F1C2E', 200: '#1f2b3e', 300: '#374357' },
            },
          },
        },
        setTheme: () => {},
        mode: 'light',
        setMode: () => {},
        isLight: true,
        isDark: false,
        isAuto: false,
        background: undefined,
        setBackground: () => {},
        createCustomTheme: () => Promise.resolve(),
        deleteCustomTheme: () => Promise.resolve(),
        getCurrentColors: () => ({
          primary: { 100: '#d4eaf7', 200: '#b6ccd8', 300: '#3b3c3d' },
          accent: { 100: '#71c4ef', 200: '#00668c' },
          text: { 100: '#1d1c1c', 200: '#313d44' },
          bg: { 100: '#fffefb', 200: '#f5f4f1', 300: '#cccbc8' },
        }),
      } as ThemeContextType;
    }
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// 기본 테마 설정
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  currentTheme: 'default',
  mode: 'light',
  background: undefined,
  customThemes: {},
};