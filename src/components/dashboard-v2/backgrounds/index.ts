// 배경 시스템 단순화 Export (순환 참조 방지)

// 핵심 시스템만 export (업계 표준)
export { UnifiedBackgroundSystem } from './UnifiedBackgroundSystem'
export { useBackgroundConfig } from './useBackgroundConfig'
export { BackgroundSystem } from './BackgroundSystem'

// 타입 정의
export type { 
  BackgroundConfig, 
  BackgroundType 
} from './BackgroundSystem'

export type { 
  UnifiedBackgroundSystemProps
} from './UnifiedBackgroundSystem'

export type {
  UnifiedBackgroundConfig
} from './unifiedBackgroundConfig'

// 유틸리티 함수들 export
export { 
  getGlowShadowStyle,
  getCompleteCardShadow,
  BACKGROUND_CONFIG as BackgroundSettings
} from './backgroundStyles'

// 기본 export
export { UnifiedBackgroundSystem as default } from './UnifiedBackgroundSystem'