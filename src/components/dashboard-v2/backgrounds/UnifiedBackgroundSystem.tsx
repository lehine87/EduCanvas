'use client'

import { forwardRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { 
  generateUnifiedPatternStyle, 
  generateImageBackgroundStyle,
  generateGradientBackgroundStyle,
  type UnifiedBackgroundConfig,
  type UnifiedBackgroundPattern
} from './unifiedBackgroundConfig'

// 기존 BackgroundConfig와의 호환성을 위한 타입 변환
export interface UnifiedBackgroundSystemProps extends React.HTMLAttributes<HTMLDivElement> {
  config: {
    type: 'none' | 'pattern' | 'gradient' | 'image'
    pattern?: string
    opacity?: number
    imageUrl?: string
    colors?: {
      primary?: string
      secondary?: string
      accent?: string
    }
  }
  children?: React.ReactNode
}

/**
 * 통합 배경 시스템 v2.0
 * - 단일 레이어 렌더링으로 성능 최적화
 * - CSS Variables + Tailwind 조합으로 다크모드 자동 지원
 * - 기존 BackgroundSystem과 완전 호환
 */
export const UnifiedBackgroundSystem = forwardRef<HTMLDivElement, UnifiedBackgroundSystemProps>(
  ({ config, children, className, ...props }, ref) => {
    
    // 설정 변환 및 메모화
    const processedConfig = useMemo((): UnifiedBackgroundConfig => {
      // 기존 config를 새로운 통합 시스템으로 변환
      let pattern: UnifiedBackgroundPattern = 'none'
      
      if (config.type === 'none') {
        pattern = 'none'
      } else if (config.type === 'pattern' && config.pattern) {
        // 기존 패턴명을 새로운 시스템에 매핑
        const patternMap: Record<string, UnifiedBackgroundPattern> = {
          'glassmorphism': 'glassmorphism',
          'dots': 'dots', 
          'grid': 'grid',
          'waves': 'waves',
          'morphing': 'morphing'
        }
        pattern = patternMap[config.pattern] || 'glassmorphism'
      } else if (config.type === 'gradient') {
        pattern = 'gradient'
      } else if (config.type === 'image') {
        pattern = 'image'
      }
      
      return {
        pattern,
        opacity: config.opacity || 40,
        imageUrl: config.imageUrl,
        customColors: config.colors
      }
    }, [config])

    // 스타일 생성 (메모화로 성능 최적화)
    const { className: patternClass, style: patternStyle } = useMemo(() => {
      if (processedConfig.pattern === 'image' && processedConfig.imageUrl) {
        return {
          className: 'relative',
          style: generateImageBackgroundStyle(processedConfig.imageUrl, processedConfig.opacity)
        }
      }
      
      if (processedConfig.pattern === 'gradient' && processedConfig.customColors?.primary && processedConfig.customColors?.secondary) {
        return {
          className: 'relative',
          style: generateGradientBackgroundStyle({
            primary: processedConfig.customColors.primary,
            secondary: processedConfig.customColors.secondary,
            accent: processedConfig.customColors.accent
          }, processedConfig.opacity)
        }
      }
      
      return generateUnifiedPatternStyle(processedConfig)
    }, [processedConfig])

    // 배경 없음
    if (processedConfig.pattern === 'none') {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      )
    }

    // 통합 배경 시스템 렌더링
    return (
      <div 
        ref={ref} 
        className={cn('relative min-h-full', className)} 
        {...props}
        style={{ isolation: 'isolate' }}
      >
        {/* 단일 배경 레이어 */}
        <div 
          className={cn('absolute inset-0 pointer-events-none', patternClass)}
          style={patternStyle}
        />
        
        {/* 콘텐츠 레이어 */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

UnifiedBackgroundSystem.displayName = 'UnifiedBackgroundSystem'

export default UnifiedBackgroundSystem