/**
 * EduCanvas 테마 유틸리티 함수
 * CSS 변수 생성, 색상 변환, 접근성 검증 등
 * @version 2.0
 * @date 2025-01-11
 */

import type { 
  ColorToken, 
  CSSVariables, 
  BackgroundConfig, 
  Theme,
  ThemeValidationResult 
} from '@/types/theme.types';

/**
 * 10개 토큰을 CSS 변수로 변환
 */
export const generateCSSVariables = (colors: ColorToken): CSSVariables => {
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
  };
};

/**
 * CSS 변수를 DOM에 적용
 */
export const applyCSSVariables = (variables: CSSVariables): void => {
  const root = document.documentElement;
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

/**
 * HEX 색상을 RGB로 변환
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

/**
 * RGB 색상을 HEX로 변환
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * 색상의 상대적 휘도 계산 (WCAG 기준)
 */
export const getRelativeLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * 두 색상 간의 대비율 계산 (WCAG 기준)
 */
export const calculateContrast = (color1: string, color2: string): number => {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * 테마의 접근성 검증
 */
export const validateThemeAccessibility = (theme: Theme): ThemeValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 라이트모드 대비율 검사
  const lightTextBgContrast = calculateContrast(
    theme.colors.light.text[100],
    theme.colors.light.bg[100]
  );
  const lightAccentBgContrast = calculateContrast(
    theme.colors.light.accent[200],
    theme.colors.light.bg[100]
  );

  // 다크모드 대비율 검사
  const darkTextBgContrast = calculateContrast(
    theme.colors.dark.text[100],
    theme.colors.dark.bg[100]
  );
  const darkAccentBgContrast = calculateContrast(
    theme.colors.dark.accent[200],
    theme.colors.dark.bg[100]
  );

  // WCAG AA 기준 (4.5:1) 검증
  if (lightTextBgContrast < 4.5) {
    errors.push(`라이트모드 텍스트 대비율이 낮습니다: ${lightTextBgContrast.toFixed(2)}:1`);
  }
  if (lightAccentBgContrast < 3.0) {
    warnings.push(`라이트모드 액센트 대비율이 낮습니다: ${lightAccentBgContrast.toFixed(2)}:1`);
  }
  if (darkTextBgContrast < 4.5) {
    errors.push(`다크모드 텍스트 대비율이 낮습니다: ${darkTextBgContrast.toFixed(2)}:1`);
  }
  if (darkAccentBgContrast < 3.0) {
    warnings.push(`다크모드 액센트 대비율이 낮습니다: ${darkAccentBgContrast.toFixed(2)}:1`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    accessibility: {
      lightMode: {
        textBgContrast: lightTextBgContrast,
        accentBgContrast: lightAccentBgContrast,
      },
      darkMode: {
        textBgContrast: darkTextBgContrast,
        accentBgContrast: darkAccentBgContrast,
      },
    },
  };
};

/**
 * 배경 스타일 생성
 */
export const generateBackgroundStyles = (
  background?: BackgroundConfig,
  currentColors?: ColorToken
): Record<string, string> => {
  if (!background) return {};

  const styles: Record<string, string> = {};

  switch (background.type) {
    case 'solid':
      styles.backgroundColor = background.value;
      break;

    case 'gradient':
      styles.backgroundImage = background.value;
      break;

    case 'pattern':
      styles.backgroundImage = `url('/patterns/${background.value}.svg')`;
      styles.backgroundRepeat = 'repeat';
      break;

    case 'image':
      styles.backgroundImage = `url('${background.value}')`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      break;
  }

  // 투명도 적용
  if (background.opacity !== undefined && background.opacity < 1) {
    styles.opacity = background.opacity.toString();
  }

  // 블러 효과 적용
  if (background.blur && background.blur > 0) {
    styles.filter = `blur(${background.blur}px)`;
  }

  return styles;
};

/**
 * 색상 팔레트를 보완색으로 생성
 */
export const generateComplementaryPalette = (baseColor: string): string[] => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];

  const { r, g, b } = rgb;
  
  // HSL로 변환하여 색상환에서 보완색 계산
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r / 255) h = ((g / 255 - b / 255) / diff) % 6;
    else if (max === g / 255) h = (b / 255 - r / 255) / diff + 2;
    else h = (r / 255 - g / 255) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));

  // 보완색들 생성
  const complementary = (h + 180) % 360;
  const triadic1 = (h + 120) % 360;
  const triadic2 = (h + 240) % 360;

  return [
    baseColor,
    hslToHex(complementary, s, l),
    hslToHex(triadic1, s, l),
    hslToHex(triadic2, s, l),
  ];
};

/**
 * HSL을 HEX로 변환
 */
const hslToHex = (h: number, s: number, l: number): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
  else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return rgbToHex(r, g, b);
};

/**
 * 로컬 스토리지에서 테마 설정 로드
 */
export const loadThemeConfig = (key: string = 'educanvas-theme-config') => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load theme config:', error);
    return null;
  }
};

/**
 * 로컬 스토리지에 테마 설정 저장
 */
export const saveThemeConfig = (config: any, key: string = 'educanvas-theme-config') => {
  try {
    localStorage.setItem(key, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save theme config:', error);
  }
};

/**
 * 시스템 다크모드 감지
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 부드러운 테마 전환을 위한 CSS 트랜지션 추가
 */
export const enableThemeTransition = () => {
  const style = document.createElement('style');
  style.textContent = `
    * {
      transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease !important;
    }
  `;
  document.head.appendChild(style);

  // 300ms 후 트랜지션 제거 (한 번만 적용)
  setTimeout(() => {
    document.head.removeChild(style);
  }, 300);
};