/**
 * 배경 패턴 스타일 중앙 관리 시스템
 * EduCanvas v2 디자인 시스템 준수
 */

export type BackgroundPatternType = 'glassmorphism' | 'grid' | 'dots' | 'waves' | 'morphing'

export interface PatternStyle {
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backdropFilter?: string
  animation?: string
  opacity?: number
}

/**
 * 패턴별 스타일 생성 함수
 * @param pattern 패턴 타입
 * @param opacity 투명도 (0-100)
 * @returns CSS 스타일 객체
 */
export function getPatternStyle(pattern: BackgroundPatternType, opacity: number = 40): PatternStyle {
  const normalizedOpacity = opacity / 100

  const patterns: Record<BackgroundPatternType, PatternStyle> = {
    glassmorphism: {
      backgroundImage: `linear-gradient(135deg, 
        rgba(255, 255, 255, ${normalizedOpacity * 0.8}), 
        rgba(219, 234, 254, ${normalizedOpacity * 0.6}), 
        rgba(196, 140, 255, ${normalizedOpacity * 0.4})
      )`,
      backdropFilter: 'blur(8px)',
      opacity: 1,
    },
    
    grid: {
      backgroundImage: `
        linear-gradient(135deg, rgba(248, 250, 252, ${normalizedOpacity}), rgba(226, 232, 240, ${normalizedOpacity * 0.8})),
        linear-gradient(rgba(148, 163, 184, ${normalizedOpacity * 0.1}) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, ${normalizedOpacity * 0.1}) 1px, transparent 1px)
      `,
      backgroundSize: 'cover, 20px 20px, 20px 20px',
      opacity: 1,
    },
    
    dots: {
      backgroundImage: `
        linear-gradient(135deg, rgba(250, 250, 250, ${normalizedOpacity}), rgba(219, 234, 254, ${normalizedOpacity * 0.8})),
        radial-gradient(circle, rgba(59, 130, 246, ${normalizedOpacity * 0.2}) 1px, transparent 1px)
      `,
      backgroundSize: 'cover, 16px 16px',
      opacity: 1,
    },
    
    waves: {
      backgroundImage: `linear-gradient(135deg, 
        rgba(239, 246, 255, ${normalizedOpacity}), 
        rgba(224, 231, 255, ${normalizedOpacity * 0.8}), 
        rgba(243, 232, 255, ${normalizedOpacity * 0.6})
      )`,
      opacity: 1,
    },
    
    morphing: {
      backgroundImage: `linear-gradient(135deg, 
        rgba(253, 244, 255, ${normalizedOpacity}), 
        rgba(250, 232, 255, ${normalizedOpacity * 0.8}), 
        rgba(224, 231, 255, ${normalizedOpacity * 0.6})
      )`,
      animation: 'pulse 4s ease-in-out infinite',
      opacity: 1,
    }
  }

  return patterns[pattern] || patterns.glassmorphism
}

/**
 * 다크모드용 패턴 스타일 생성
 * @param pattern 패턴 타입  
 * @param opacity 투명도 (0-100)
 * @returns CSS 스타일 객체
 */
export function getDarkPatternStyle(pattern: BackgroundPatternType, opacity: number = 40): PatternStyle {
  const normalizedOpacity = opacity / 100

  const darkPatterns: Record<BackgroundPatternType, PatternStyle> = {
    glassmorphism: {
      backgroundImage: `linear-gradient(135deg, 
        rgba(15, 23, 42, ${normalizedOpacity * 0.8}), 
        rgba(30, 41, 59, ${normalizedOpacity * 0.6}), 
        rgba(88, 28, 135, ${normalizedOpacity * 0.4})
      )`,
      backdropFilter: 'blur(8px)',
      opacity: 1,
    },
    
    grid: {
      backgroundImage: `
        linear-gradient(135deg, rgba(15, 23, 42, ${normalizedOpacity}), rgba(30, 41, 59, ${normalizedOpacity * 0.8})),
        linear-gradient(rgba(148, 163, 184, ${normalizedOpacity * 0.1}) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, ${normalizedOpacity * 0.1}) 1px, transparent 1px)
      `,
      backgroundSize: 'cover, 20px 20px, 20px 20px',
      opacity: 1,
    },
    
    dots: {
      backgroundImage: `
        linear-gradient(135deg, rgba(17, 24, 39, ${normalizedOpacity}), rgba(30, 58, 138, ${normalizedOpacity * 0.8})),
        radial-gradient(circle, rgba(59, 130, 246, ${normalizedOpacity * 0.3}) 1px, transparent 1px)
      `,
      backgroundSize: 'cover, 16px 16px',
      opacity: 1,
    },
    
    waves: {
      backgroundImage: `linear-gradient(135deg, 
        rgba(30, 58, 138, ${normalizedOpacity}), 
        rgba(67, 56, 202, ${normalizedOpacity * 0.8}), 
        rgba(124, 58, 237, ${normalizedOpacity * 0.6})
      )`,
      opacity: 1,
    },
    
    morphing: {
      backgroundImage: `linear-gradient(135deg, 
        rgba(88, 28, 135, ${normalizedOpacity}), 
        rgba(124, 58, 237, ${normalizedOpacity * 0.8}), 
        rgba(67, 56, 202, ${normalizedOpacity * 0.6})
      )`,
      animation: 'pulse 4s ease-in-out infinite',
      opacity: 1,
    }
  }

  return darkPatterns[pattern] || darkPatterns.glassmorphism
}

/**
 * 카드 그림자 설정 - 중앙 통제
 */
export const CARD_SHADOW_CONFIG = {
  // 기본 카드 그림자 (라이트/다크모드)
  base: {
    light: 'shadow-lg shadow-neutral-300/50',
    dark: 'shadow-lg shadow-black/20'
  },
  
  // 호버 카드 그림자
  hover: {
    light: 'shadow-xl shadow-neutral-400/60',
    dark: 'shadow-xl shadow-black/30'
  },
  
  // GlassWidget 내부 그림자 (glow 효과)
  glow: {
    ambient: {
      light: 'shadow-lg shadow-neutral-300/60',
      dark: 'shadow-lg shadow-black/30'
    },
    focus: {
      light: 'shadow-xl shadow-neutral-400/50',
      dark: 'shadow-xl shadow-black/40'
    },
    critical: {
      light: 'shadow-xl shadow-neutral-500/60',
      dark: 'shadow-xl shadow-black/50'
    },
    solid: {
      light: 'shadow-xl shadow-neutral-400/70',
      dark: 'shadow-xl shadow-black/30'
    }
  },
  
  // 인터랙티브 효과 (클릭 가능한 카드)
  interactive: {
    light: 'hover:shadow-xl hover:shadow-neutral-400/70',
    dark: 'hover:shadow-xl hover:shadow-black/60'
  }
} as const

/**
 * 중앙 통제 배경 설정
 */
export const BACKGROUND_CONFIG = {
  // 기본 설정
  DEFAULT_OPACITY: 40,
  MIN_OPACITY: 10,
  MAX_OPACITY: 60,
  
  // 애니메이션 설정
  TRANSITION_DURATION: '0.3s',
  
  // z-index 레이어
  Z_INDEX: {
    BACKGROUND: 1,
    CONTENT: 10,
  },
  
  // 반응형 설정
  MOBILE_OPACITY_FACTOR: 0.8,
} as const

/**
 * 테마에 맞는 카드 그림자 스타일 반환
 * @param type 그림자 타입 ('base' | 'hover' | 'interactive')
 * @param isDark 다크모드 여부
 * @returns CSS 클래스 문자열
 */
export function getCardShadowStyle(
  type: 'base' | 'hover' | 'interactive' = 'base',
  isDark: boolean = false
): string {
  const config = CARD_SHADOW_CONFIG[type]
  return isDark ? config.dark : config.light
}

/**
 * 테마에 맞는 GlassWidget glow 그림자 반환
 * @param opacity glow 강도 ('ambient' | 'focus' | 'critical' | 'solid')
 * @param isDark 다크모드 여부
 * @returns CSS 클래스 문자열
 */
export function getGlowShadowStyle(
  opacity: 'ambient' | 'focus' | 'critical' | 'solid' = 'focus',
  isDark: boolean = false
): string {
  const config = CARD_SHADOW_CONFIG.glow[opacity]
  return isDark ? config.dark : config.light
}

/**
 * 완전한 카드 그림자 클래스 조합 반환
 * @param options 설정 옵션
 * @returns 완전한 CSS 클래스 문자열
 */
export function getCompleteCardShadow(options: {
  base?: boolean
  hover?: boolean 
  interactive?: boolean
  isDark?: boolean
} = {}): string {
  const { base = true, hover = true, interactive = false, isDark = false } = options
  
  const classes: string[] = []
  
  if (base) {
    classes.push(getCardShadowStyle('base', isDark))
  }
  
  if (hover) {
    classes.push(getCardShadowStyle('hover', isDark))
  }
  
  if (interactive) {
    classes.push(getCardShadowStyle('interactive', isDark))
  }
  
  classes.push('transition-shadow duration-300')
  
  return classes.join(' ')
}

/**
 * 테마에 맞는 패턴 스타일 반환
 * @param pattern 패턴 타입
 * @param opacity 투명도
 * @param isDark 다크모드 여부
 * @returns CSS 스타일 객체
 */
export function getThemedPatternStyle(
  pattern: BackgroundPatternType, 
  opacity: number = BACKGROUND_CONFIG.DEFAULT_OPACITY,
  isDark: boolean = false
): PatternStyle {
  return isDark 
    ? getDarkPatternStyle(pattern, opacity)
    : getPatternStyle(pattern, opacity)
}