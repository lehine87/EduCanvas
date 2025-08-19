import { useEffect, useRef, useCallback } from 'react'

/**
 * 성능 모니터링 Hook
 * 컴포넌트 렌더링 성능과 메모리 사용량을 추적
 */
export function usePerformanceMonitor(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const renderCount = useRef(0)
  const lastRenderTime = useRef<number>(0)
  const renderTimes = useRef<number[]>([])

  useEffect(() => {
    if (!enabled) return

    renderCount.current += 1
    const currentTime = performance.now()
    
    if (lastRenderTime.current > 0) {
      const renderDuration = currentTime - lastRenderTime.current
      renderTimes.current.push(renderDuration)
      
      // 최근 10개 렌더링 시간만 유지
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift()
      }
      
      // 성능 경고 임계값 조정
      // - 카드 컴포넌트: 50ms (일반적인 리스트 아이템)
      // - 페이지 컴포넌트: 100ms
      // - 기타: 33.33ms (30fps 기준)
      let threshold = 33.33
      if (componentName.includes('Card')) {
        threshold = 50
      } else if (componentName.includes('Page')) {
        threshold = 100
      }
      
      if (renderDuration > threshold) {
        console.warn(`⚠️ [PERFORMANCE] ${componentName} 렌더링 시간 초과: ${renderDuration.toFixed(2)}ms (임계값: ${threshold}ms)`)
      }
    }
    
    lastRenderTime.current = currentTime
  })

  const getStats = useCallback(() => {
    if (!enabled || renderTimes.current.length === 0) return null

    const times = renderTimes.current
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const maxTime = Math.max(...times)
    const minTime = Math.min(...times)

    return {
      componentName,
      renderCount: renderCount.current,
      averageRenderTime: Number(avgTime.toFixed(2)),
      maxRenderTime: Number(maxTime.toFixed(2)),
      minRenderTime: Number(minTime.toFixed(2)),
      targetFPS: 60,
      performance: avgTime <= 16.67 ? 'good' : avgTime <= 33.33 ? 'warning' : 'poor'
    }
  }, [componentName, enabled])

  const logStats = useCallback(() => {
    if (!enabled) return

    const stats = getStats()
    if (stats) {
      console.table(stats)
    }
  }, [enabled, getStats])

  return { getStats, logStats, renderCount: renderCount.current }
}

/**
 * 메모리 사용량 모니터링 Hook
 */
export function useMemoryMonitor(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const checkMemory = useCallback(() => {
    if (!enabled || !('memory' in performance)) return null

    const memory = (performance as any).memory
    const usedMB = memory.usedJSHeapSize / 1048576
    const totalMB = memory.totalJSHeapSize / 1048576
    const limitMB = memory.jsHeapSizeLimit / 1048576

    // 메모리 사용량 경고 (50MB 초과)
    if (usedMB > 50) {
      console.warn(`⚠️ [MEMORY] ${componentName} 메모리 사용량 높음: ${usedMB.toFixed(2)}MB`)
    }

    return {
      componentName,
      usedMB: Number(usedMB.toFixed(2)),
      totalMB: Number(totalMB.toFixed(2)),
      limitMB: Number(limitMB.toFixed(2)),
      usagePercentage: Number(((usedMB / limitMB) * 100).toFixed(2))
    }
  }, [componentName, enabled])

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      const memoryInfo = checkMemory()
      if (memoryInfo && memoryInfo.usedMB > 100) {
        console.warn('🚨 [MEMORY] 높은 메모리 사용량 감지:', memoryInfo)
      }
    }, 10000) // 10초마다 체크

    return () => clearInterval(interval)
  }, [enabled, checkMemory])

  return { checkMemory }
}

/**
 * 리렌더링 이유 추적 Hook
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>, enabled = process.env.NODE_ENV === 'development') {
  const previousProps = useRef<Record<string, any>>()

  useEffect(() => {
    if (!enabled) return

    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps: Record<string, { from: any; to: any }> = {}

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length) {
        console.log(`🔄 [WHY-DID-YOU-UPDATE] ${name}:`, changedProps)
      }
    }

    previousProps.current = props
  })
}

/**
 * 컴포넌트 라이프사이클 추적 Hook
 */
export function useComponentLifecycle(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const mountTime = useRef<number>(performance.now())

  useEffect(() => {
    if (!enabled) return

    console.log(`🌱 [LIFECYCLE] ${componentName} 마운트됨 (${performance.now().toFixed(2)}ms)`)

    return () => {
      const lifetimeDuration = performance.now() - mountTime.current
      console.log(`🍂 [LIFECYCLE] ${componentName} 언마운트됨 (생명주기: ${lifetimeDuration.toFixed(2)}ms)`)
    }
  }, [componentName, enabled])
}

/**
 * 통합 성능 모니터링 Hook
 */
export function usePerformanceProfiler(
  componentName: string, 
  props?: Record<string, any>,
  options?: {
    enablePerformance?: boolean
    enableMemory?: boolean
    enableWhyDidYouUpdate?: boolean
    enableLifecycle?: boolean
  }
) {
  const {
    enablePerformance = true,
    enableMemory = true,
    enableWhyDidYouUpdate = false,
    enableLifecycle = true
  } = options || {}

  const enabled = process.env.NODE_ENV === 'development'

  const performance = usePerformanceMonitor(componentName, enabled && enablePerformance)
  const memory = useMemoryMonitor(componentName, enabled && enableMemory)
  
  useWhyDidYouUpdate(componentName, props || {}, enabled && enableWhyDidYouUpdate)
  useComponentLifecycle(componentName, enabled && enableLifecycle)

  const profileComponent = useCallback(() => {
    if (!enabled) return

    console.group(`📊 [PROFILE] ${componentName}`)
    
    const perfStats = performance.getStats()
    if (perfStats) {
      console.log('🚀 성능 통계:', perfStats)
    }

    const memoryStats = memory.checkMemory()
    if (memoryStats) {
      console.log('💾 메모리 사용량:', memoryStats)
    }

    console.groupEnd()
  }, [componentName, enabled, performance, memory])

  return {
    profileComponent,
    performance,
    memory
  }
}