'use client'

import { forwardRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getThemedPatternStyle, BACKGROUND_CONFIG } from './backgroundStyles'
import { useDarkMode } from '@/hooks/useDarkMode'

// 배경 타입 정의 - EduCanvas 패턴 준수
export type BackgroundType = 'none' | 'pattern' | 'gradient' | 'image'

export type BackgroundPattern = 
  | 'glassmorphism' 
  | 'dots' 
  | 'grid' 
  | 'waves' 
  | 'morphing'

export interface BackgroundConfig {
  type: BackgroundType
  pattern?: BackgroundPattern
  opacity?: number
  imageUrl?: string
  customStyle?: React.CSSProperties
  colors?: {
    primary?: string
    secondary?: string  
    accent?: string
  }
}

export interface BackgroundSystemProps extends React.HTMLAttributes<HTMLDivElement> {
  config: BackgroundConfig
  children?: React.ReactNode
}

// Static class mappings for Tailwind v4 compatibility
const staticClasses = {
  glassmorphism: {
    base: 'w-full h-full bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950',
    overlay1: 'absolute inset-0',
    overlay2: 'absolute inset-0'
  },
  dots: {
    base: 'w-full h-full bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-neutral-900 dark:to-blue-900',
    overlay1: 'absolute inset-0'
  },
  grid: {
    base: 'w-full h-full bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900',
    overlay1: 'absolute inset-0'
  },
  waves: {
    base: 'w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950',
    overlay1: 'absolute inset-0 animate-pulse',
    overlay2: 'absolute inset-0',
    overlay3: 'absolute inset-0'
  },
  morphing: {
    base: 'w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950 dark:via-pink-950 dark:to-indigo-950',
    overlay1: 'absolute inset-0',
    overlay2: 'absolute inset-0',
    overlay3: 'absolute inset-0'
  }
}

// 패턴별 스타일 생성 함수들
const createGlassmorphismPattern = (opacity: number = 40, colors?: { primary?: string; secondary?: string; accent?: string }) => ({
  layers: [
    {
      className: staticClasses.glassmorphism.base,
      style: colors ? {
        background: `linear-gradient(135deg, ${colors.primary || '#ffffff'}, ${colors.secondary || '#eff6ff'}, ${colors.accent || '#f3e8ff'})`,
      } : {}
    },
    {
      className: staticClasses.glassmorphism.overlay1,
      style: {
        opacity: 0.3,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), 
                         radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%), 
                         radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.06) 0%, transparent 50%)`,
      }
    },
    {
      className: staticClasses.glassmorphism.overlay2,
      style: {
        opacity: 0.2,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)`,
      }
    }
  ],
  containerOpacity: opacity / 100
})

const createDotsPattern = (opacity: number = 30, colors?: { primary?: string; secondary?: string; accent?: string }) => ({
  layers: [
    {
      className: staticClasses.dots.base,
      style: colors ? {
        background: `linear-gradient(135deg, ${colors.primary || '#fafafa'}, ${colors.secondary || '#eff6ff'})`,
      } : {}
    },
    {
      className: staticClasses.dots.overlay1,
      style: {
        backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }
    }
  ],
  containerOpacity: opacity / 100
})

const createGridPattern = (opacity: number = 25, colors?: { primary?: string; secondary?: string; accent?: string }) => ({
  layers: [
    {
      className: staticClasses.grid.base,
      style: {}
    },
    {
      className: staticClasses.grid.overlay1,
      style: {
        backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }
    }
  ],
  containerOpacity: opacity / 100
})

const createWavesPattern = (opacity: number = 35, colors?: { primary?: string; secondary?: string; accent?: string }) => ({
  layers: [
    {
      className: staticClasses.waves.base,
      style: {}
    },
    {
      className: staticClasses.waves.overlay1,
      style: {
        background: `
          radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)
        `,
        animation: 'float 6s ease-in-out infinite'
      }
    },
    {
      className: `absolute inset-0`,
      style: {
        background: `
          linear-gradient(45deg, transparent 40%, rgba(59, 130, 246, 0.02) 50%, transparent 60%),
          linear-gradient(-45deg, transparent 40%, rgba(147, 51, 234, 0.02) 50%, transparent 60%)
        `,
        animation: 'wave 8s linear infinite'
      }
    },
    {
      className: `absolute inset-0`,
      style: {
        background: `
          conic-gradient(from 0deg at 20% 80%, transparent 0deg, rgba(236, 72, 153, 0.03) 60deg, transparent 120deg),
          conic-gradient(from 180deg at 80% 20%, transparent 0deg, rgba(16, 185, 129, 0.03) 60deg, transparent 120deg)
        `,
        animation: 'rotate 12s linear infinite'
      }
    }
  ],
  containerOpacity: opacity / 100,
  animations: true
})

const createMorphingPattern = (opacity: number = 25, colors?: { primary?: string; secondary?: string; accent?: string }) => ({
  layers: [
    {
      className: staticClasses.morphing.base,
      style: {}
    },
    {
      className: `absolute inset-0`,
      style: {
        background: `
          radial-gradient(ellipse 400px 300px at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 70%),
          radial-gradient(ellipse 300px 400px at 80% 70%, rgba(236, 72, 153, 0.08) 0%, transparent 70%),
          radial-gradient(ellipse 200px 500px at 50% 10%, rgba(99, 102, 241, 0.06) 0%, transparent 80%)
        `,
        animation: 'morphing 10s ease-in-out infinite'
      }
    },
    {
      className: `absolute inset-0`,
      style: {
        background: `
          linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.03) 50%, transparent 70%),
          linear-gradient(-45deg, transparent 30%, rgba(236, 72, 153, 0.03) 50%, transparent 70%),
          linear-gradient(90deg, transparent 40%, rgba(99, 102, 241, 0.02) 60%, transparent 80%)
        `,
        animation: 'wave 15s ease-in-out infinite reverse'
      }
    },
    {
      className: `absolute inset-0`,
      style: {
        background: `
          conic-gradient(from 0deg at 30% 20%, transparent 0deg, rgba(139, 92, 246, 0.02) 90deg, transparent 180deg),
          conic-gradient(from 90deg at 70% 80%, transparent 0deg, rgba(236, 72, 153, 0.02) 90deg, transparent 180deg),
          conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(99, 102, 241, 0.015) 90deg, transparent 180deg)
        `,
        animation: 'rotate 20s linear infinite, pulse-gradient 8s ease-in-out infinite'
      }
    }
  ],
  containerOpacity: opacity / 100,
  animations: true
})

// 패턴 생성 함수 매핑
const patternCreators = {
  glassmorphism: createGlassmorphismPattern,
  dots: createDotsPattern,
  grid: createGridPattern,
  waves: createWavesPattern,
  morphing: createMorphingPattern,
} as const

/**
 * 설정 가능한 대시보드 배경 시스템
 * EduCanvas v2 컴포넌트 패턴 준수
 */
export const BackgroundSystem = forwardRef<HTMLDivElement, BackgroundSystemProps>(
  ({ config, children, className, ...props }, ref) => {
    
    // 다크모드 상태 감지
    const isDark = useDarkMode()
    
    // 배경 없음
    if (config.type === 'none') {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      )
    }

    // 사용자 지정 이미지 배경
    if (config.type === 'image' && config.imageUrl) {
      return (
        <div 
          ref={ref} 
          className={cn('relative', className)} 
          {...props}
          style={{ minHeight: '100vh' }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: `url(${config.imageUrl})`,
              opacity: (config.opacity || 30) / 100,
              zIndex: 0,
              ...config.customStyle
            }}
          />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      )
    }

    // 그라디언트 배경
    if (config.type === 'gradient') {
      const gradientStyle = config.colors ? {
        background: `linear-gradient(135deg, ${config.colors.primary || '#f8fafc'}, ${config.colors.secondary || '#e2e8f0'}, ${config.colors.accent || '#cbd5e1'})`
      } : {}

      return (
        <div 
          ref={ref} 
          className={cn('relative', className)} 
          {...props}
          style={{ minHeight: '100vh' }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0, #cbd5e1)',
              opacity: (config.opacity || 25) / 100,
              zIndex: 0,
              ...gradientStyle,
              ...config.customStyle
            }}
          />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      )
    }

    // 패턴 배경
    if (config.type === 'pattern' && config.pattern) {
      const patternCreator = patternCreators[config.pattern]
      if (!patternCreator) {
        return (
          <div ref={ref} className={className} {...props}>
            {children}
          </div>
        )
      }

      const patternData = patternCreator(config.opacity || 40, config.colors)
      
      return (
        <div 
          ref={ref} 
          className={cn('relative', className)} 
          {...props}
          style={{
            minHeight: '100vh',
            isolation: 'isolate'
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden" 
            style={{ 
              opacity: 1,
              zIndex: BACKGROUND_CONFIG.Z_INDEX.BACKGROUND
            }}
          >
            {patternData.layers.map((layer, index) => {
              // 첫 번째 레이어는 베이스 그라디언트
              if (index === 0) {
                // 중앙 통제 시스템에서 패턴 스타일 가져오기
                const patternStyle = getThemedPatternStyle(
                  config.pattern || 'glassmorphism',
                  config.opacity || BACKGROUND_CONFIG.DEFAULT_OPACITY,
                  isDark
                )

                return (
                  <div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      ...patternStyle,
                      zIndex: BACKGROUND_CONFIG.Z_INDEX.BACKGROUND,
                      width: '100%',
                      height: '100vh',
                      transition: `all ${BACKGROUND_CONFIG.TRANSITION_DURATION} ease-in-out`
                    }}
                  />
                )
              }
              // 나머지 레이어는 애니메이션/패턴
              return (
                <div
                  key={index}
                  className={layer.className}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    ...layer.style,
                    opacity: layer.style?.opacity || 1
                  }}
                />
              )
            })}
          </div>
          <div 
            className="relative" 
            style={{ 
              zIndex: BACKGROUND_CONFIG.Z_INDEX.CONTENT,
              transition: `all ${BACKGROUND_CONFIG.TRANSITION_DURATION} ease-in-out`
            }}
          >
            {children}
          </div>
        </div>
      )
    }

    // 기본값 (배경 없음)
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  }
)

BackgroundSystem.displayName = 'BackgroundSystem'

// 프리셋 배경 설정들
export const backgroundPresets: Record<string, BackgroundConfig> = {
  none: { type: 'none' },
  glassmorphism: { 
    type: 'pattern', 
    pattern: 'glassmorphism', 
    opacity: 40 
  },
  subtle_dots: { 
    type: 'pattern', 
    pattern: 'dots', 
    opacity: 20 
  },
  minimal_grid: { 
    type: 'pattern', 
    pattern: 'grid', 
    opacity: 15 
  },
  ocean_waves: { 
    type: 'pattern', 
    pattern: 'waves', 
    opacity: 35 
  },
  morphing_art: { 
    type: 'pattern', 
    pattern: 'morphing', 
    opacity: 25 
  },
  custom_gradient: {
    type: 'gradient',
    opacity: 30,
    colors: {
      primary: '#fafafa',
      secondary: '#f4f4f5', 
      accent: '#e4e4e7'
    }
  }
}

export default BackgroundSystem