/**
 * EduCanvas 통합 테마 시스템 타입 정의
 * 10토큰 기반 시멘틱 컬러 + 다중 테마 + 배경화면 시스템
 * @version 2.0
 * @date 2025-01-11
 */

export interface ColorToken {
  primary: {
    100: string; // 연한 브랜드 색상, 배경/호버
    200: string; // 중간 브랜드 색상, 보조 요소
    300: string; // 진한 브랜드 색상, 강조/액션
  };
  accent: {
    100: string; // 보조 강조 색상, 정보/링크
    200: string; // 진한 강조 색상, 중요 액션
  };
  text: {
    100: string; // 메인 텍스트 색상
    200: string; // 보조 텍스트 색상
  };
  bg: {
    100: string; // 메인 배경 색상
    200: string; // 카드/패널 배경 색상
    300: string; // 구분선/테두리 색상
  };
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  value: string;
  opacity?: number; // 0-1
  blur?: number; // 0-20px
}

export interface Theme {
  name: string;
  displayName: string;
  description?: string;
  colors: {
    light: ColorToken;
    dark: ColorToken;
  };
  backgrounds?: {
    patterns?: string[];
    gradients?: string[];
    images?: string[];
  };
}

export interface ThemeConfig {
  currentTheme: string;
  mode: 'light' | 'dark' | 'auto';
  background?: BackgroundConfig;
  customThemes?: Record<string, Theme>;
}

export interface ThemeContextType {
  // 현재 상태
  currentTheme: Theme;
  mode: 'light' | 'dark' | 'auto';
  background?: BackgroundConfig;
  
  // 테마 변경
  setTheme: (themeName: string) => void;
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
  setBackground: (background?: BackgroundConfig) => void;
  
  // 유틸리티
  availableThemes: Theme[];
  getCurrentColors: () => ColorToken;
  createCustomTheme: (name: string, theme: Omit<Theme, 'name'>) => void;
  deleteCustomTheme: (name: string) => void;
  
  // 상태 확인
  isLight: boolean;
  isDark: boolean;
  isAuto: boolean;
}

// CSS 변수 맵핑 타입
export interface CSSVariables {
  '--primary-100': string;
  '--primary-200': string;
  '--primary-300': string;
  '--accent-100': string;
  '--accent-200': string;
  '--text-100': string;
  '--text-200': string;
  '--bg-100': string;
  '--bg-200': string;
  '--bg-300': string;
}

// 컴포넌트별 테마 오버라이드 타입
export interface ComponentThemeOverride {
  colors?: Partial<ColorToken>;
  className?: string;
}

// 테마 검증 결과 타입
export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  accessibility: {
    lightMode: {
      textBgContrast: number;
      accentBgContrast: number;
    };
    darkMode: {
      textBgContrast: number;
      accentBgContrast: number;
    };
  };
}

// 색상 마이그레이션 맵핑 타입
export interface ColorMigrationMap {
  [legacyColor: string]: string; // 'bg-blue-500' -> 'bg-primary-300'
}