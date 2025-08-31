// 배경 시스템 통합 Export
export { BackgroundSystem, backgroundPresets } from './BackgroundSystem'
export type { 
  BackgroundSystemProps, 
  BackgroundConfig, 
  BackgroundType, 
  BackgroundPattern 
} from './BackgroundSystem'

export { BackgroundSettings } from './BackgroundSettings'
export type { BackgroundSettingsProps } from './BackgroundSettings'

export { useBackgroundConfig } from './useBackgroundConfig'

export { 
  getPatternStyle, 
  getDarkPatternStyle, 
  getThemedPatternStyle, 
  getCardShadowStyle,
  getGlowShadowStyle,
  getCompleteCardShadow,
  BACKGROUND_CONFIG,
  CARD_SHADOW_CONFIG 
} from './backgroundStyles'
export type { BackgroundPatternType, PatternStyle } from './backgroundStyles'

// 편의성을 위한 기본 export
export { BackgroundSystem as default } from './BackgroundSystem'