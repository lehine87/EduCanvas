/**
 * 개발 전용 초기화 파일
 * @description Development 환경에서만 실행되는 초기화 로직
 * @version v1.0
 * @since 2025-08-14
 */

// ES Module 지원을 위한 export 추가
export const DEV_MODE = true

// ⚠️ 이 파일 전체가 Production에서 Tree-shake됩니다
if (process.env.NODE_ENV === 'development') {
  // Dynamic import로 Debug Interface 로드 (더 확실한 분리)
  import('./permissions/debug.dev')
    .then(({ registerDebugInterfaces }) => {
      registerDebugInterfaces()
      console.log('🔧 Development tools initialized')
    })
    .catch((error) => {
      console.warn('⚠️ Failed to load debug interfaces:', error)
    })
    
  // 개발 환경 전용 전역 헬퍼 추가
  if (typeof window !== 'undefined') {
    (window as Window & { __DEV__?: unknown }).__DEV__ = {
      env: 'development',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown'
    }
  }
}