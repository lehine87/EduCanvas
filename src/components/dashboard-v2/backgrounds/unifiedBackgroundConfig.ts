/**
 * 통합 배경 시스템 v2.0
 * - 단일 색상 시스템으로 통합
 * - CSS Variables + Tailwind 조합
 * - 성능 최적화된 패턴 생성
 */

export type UnifiedBackgroundPattern = 
  | 'none'
  | 'glassmorphism' 
  | 'dots' 
  | 'grid' 
  | 'waves' 
  | 'morphing'
  | 'gradient'
  | 'image'

export interface UnifiedBackgroundConfig {
  pattern: UnifiedBackgroundPattern
  opacity: number // 0-100
  imageUrl?: string
  customColors?: {
    primary?: string
    secondary?: string  
    accent?: string
  }
}

/**
 * CSS 변수를 사용한 통합 패턴 정의
 * 라이트/다크 모드 자동 전환
 */
export const UNIFIED_PATTERNS = {
  none: {
    cssClass: 'bg-transparent',
    cssVariables: {}
  },
  
  glassmorphism: {
    cssClass: 'bg-pattern-glassmorphism',
    cssVariables: {
      '--pattern-bg-start': 'rgb(255 255 255 / var(--pattern-opacity-start))',
      '--pattern-bg-mid': 'rgb(248 250 252 / var(--pattern-opacity-mid))', 
      '--pattern-bg-end': 'rgb(239 246 255 / var(--pattern-opacity-end))',
      '--pattern-bg-start-dark': 'rgb(15 23 42 / var(--pattern-opacity-start))',
      '--pattern-bg-mid-dark': 'rgb(30 41 59 / var(--pattern-opacity-mid))',
      '--pattern-bg-end-dark': 'rgb(88 28 135 / var(--pattern-opacity-end))',
    }
  },
  
  dots: {
    cssClass: 'bg-pattern-dots',
    cssVariables: {
      '--pattern-bg-start': 'rgb(255 255 255 / var(--pattern-opacity-start))',
      '--pattern-bg-end': 'rgb(248 250 252 / var(--pattern-opacity-end))',
      '--pattern-dot-color': 'rgb(59 130 246 / var(--pattern-opacity-accent))',
      '--pattern-bg-start-dark': 'rgb(17 24 39 / var(--pattern-opacity-start))', 
      '--pattern-bg-end-dark': 'rgb(30 58 138 / var(--pattern-opacity-end))',
      '--pattern-dot-color-dark': 'rgb(59 130 246 / var(--pattern-opacity-accent))',
    }
  },
  
  grid: {
    cssClass: 'bg-pattern-grid',
    cssVariables: {
      '--pattern-bg-start': 'rgb(255 255 255 / var(--pattern-opacity-start))',
      '--pattern-bg-end': 'rgb(250 250 250 / var(--pattern-opacity-end))',
      '--pattern-line-color': 'rgb(148 163 184 / var(--pattern-opacity-accent))',
      '--pattern-bg-start-dark': 'rgb(15 23 42 / var(--pattern-opacity-start))',
      '--pattern-bg-end-dark': 'rgb(30 41 59 / var(--pattern-opacity-end))', 
      '--pattern-line-color-dark': 'rgb(148 163 184 / var(--pattern-opacity-accent))',
    }
  },
  
  waves: {
    cssClass: 'bg-pattern-waves',
    cssVariables: {
      '--pattern-bg-start': 'rgb(255 255 255 / var(--pattern-opacity-start))',
      '--pattern-bg-mid': 'rgb(239 246 255 / var(--pattern-opacity-mid))',
      '--pattern-bg-end': 'rgb(238 242 255 / var(--pattern-opacity-end))',
      '--pattern-bg-start-dark': 'rgb(30 58 138 / var(--pattern-opacity-start))',
      '--pattern-bg-mid-dark': 'rgb(67 56 202 / var(--pattern-opacity-mid))',
      '--pattern-bg-end-dark': 'rgb(124 58 237 / var(--pattern-opacity-end))',
    }
  },
  
  morphing: {
    cssClass: 'bg-pattern-morphing',
    cssVariables: {
      '--pattern-bg-start': 'rgb(255 255 255 / var(--pattern-opacity-start))',
      '--pattern-bg-mid': 'rgb(250 245 255 / var(--pattern-opacity-mid))', 
      '--pattern-bg-end': 'rgb(253 242 248 / var(--pattern-opacity-end))',
      '--pattern-bg-start-dark': 'rgb(88 28 135 / var(--pattern-opacity-start))',
      '--pattern-bg-mid-dark': 'rgb(124 58 237 / var(--pattern-opacity-mid))',
      '--pattern-bg-end-dark': 'rgb(67 56 202 / var(--pattern-opacity-end))',
    }
  }
} as const

/**
 * 투명도 계산 (0-100 → CSS 변수)
 */
export function calculateOpacityVariables(opacity: number) {
  const normalized = Math.max(0, Math.min(100, opacity)) / 100
  
  return {
    '--pattern-opacity-start': `${normalized * 0.8}`,
    '--pattern-opacity-mid': `${normalized * 0.6}`, 
    '--pattern-opacity-end': `${normalized * 0.4}`,
    '--pattern-opacity-accent': `${normalized * 0.2}`,
  }
}

/**
 * 통합 패턴 스타일 생성
 */
export function generateUnifiedPatternStyle(config: UnifiedBackgroundConfig): {
  className: string
  style: React.CSSProperties
} {
  const pattern = UNIFIED_PATTERNS[config.pattern as keyof typeof UNIFIED_PATTERNS]
  if (!pattern) {
    return {
      className: 'bg-transparent',
      style: {}
    }
  }
  
  const opacityVars = calculateOpacityVariables(config.opacity)
  const customVars = config.customColors ? {
    '--pattern-custom-primary': config.customColors.primary || '',
    '--pattern-custom-secondary': config.customColors.secondary || '',
    '--pattern-custom-accent': config.customColors.accent || '',
  } : {}
  
  return {
    className: pattern.cssClass,
    style: {
      ...pattern.cssVariables,
      ...opacityVars,
      ...customVars,
    } as React.CSSProperties
  }
}

/**
 * 이미지 배경 처리
 */
export function generateImageBackgroundStyle(
  imageUrl: string, 
  opacity: number
): React.CSSProperties {
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: opacity / 100,
  }
}

/**
 * 그라디언트 배경 처리  
 */
export function generateGradientBackgroundStyle(
  colors: { primary: string; secondary: string; accent?: string },
  opacity: number
): React.CSSProperties {
  const gradient = colors.accent 
    ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
    : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
    
  return {
    backgroundImage: gradient,
    opacity: opacity / 100,
  }
}