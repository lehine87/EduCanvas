'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChartBarIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useStaffCacheMetrics } from '@/hooks/queries/useStaffCache'
import { useQueryClient } from '@tanstack/react-query'

interface CachePerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
}

/**
 * 캐시 성능 모니터링 컴포넌트
 * 
 * 기능:
 * - 실시간 캐시 메트릭 표시
 * - 메모리 사용량 모니터링
 * - 캐시 정리 기능
 * - 성능 경고 알림
 */
export default function CachePerformanceMonitor({ 
  isVisible = false, 
  onToggle 
}: CachePerformanceMonitorProps) {
  const queryClient = useQueryClient()
  const metrics = useStaffCacheMetrics()
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 자동 갱신
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // 메트릭 강제 업데이트를 위한 더미 state 변경
      setIsExpanded(prev => prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // 캐시 정리 함수
  const handleClearCache = () => {
    queryClient.clear()
    console.log('🧹 [CacheMonitor] 모든 캐시 정리됨')
  }

  // 직원 캐시만 정리
  const handleClearStaffCache = () => {
    queryClient.removeQueries({ queryKey: ['instructors'] })
    console.log('🧹 [CacheMonitor] 직원 캐시 정리됨')
  }

  // 성능 상태 계산
  const getPerformanceStatus = () => {
    if (metrics.memoryEstimate > 10 * 1024) { // 10MB
      return { status: 'warning', text: '메모리 사용량 높음', color: 'text-amber-600' }
    }
    if (metrics.errorQueries > 0) {
      return { status: 'error', text: '캐시 오류 발생', color: 'text-red-600' }
    }
    return { status: 'good', text: '최적 상태', color: 'text-green-600' }
  }

  const performanceStatus = getPerformanceStatus()

  if (!isVisible && process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <AnimatePresence>
      {(isVisible || process.env.NODE_ENV === 'development') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>캐시 성능</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={performanceStatus.status === 'good' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {performanceStatus.text}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ↓
                    </motion.div>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0 space-y-3">
                    {/* 메트릭 그리드 */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400">총 쿼리</p>
                        <p className="font-mono font-medium">{metrics.totalQueries}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400">활성 쿼리</p>
                        <p className="font-mono font-medium text-green-600">{metrics.activeQueries}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400">만료된 쿼리</p>
                        <p className="font-mono font-medium text-amber-600">{metrics.staleQueries}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400">오류 쿼리</p>
                        <p className="font-mono font-medium text-red-600">{metrics.errorQueries}</p>
                      </div>
                    </div>

                    {/* 메모리 사용량 */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 dark:text-gray-400">메모리 사용량</span>
                        <span className="font-mono font-medium">
                          {(metrics.memoryEstimate / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            metrics.memoryEstimate > 10 * 1024
                              ? 'bg-red-500'
                              : metrics.memoryEstimate > 5 * 1024
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.min((metrics.memoryEstimate / (20 * 1024)) * 100, 100)}%` 
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* 성능 경고 */}
                    {performanceStatus.status !== 'good' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                        <span className={performanceStatus.color}>
                          {performanceStatus.status === 'warning' 
                            ? '메모리 정리를 권장합니다'
                            : '캐시 오류를 확인해주세요'
                          }
                        </span>
                      </motion.div>
                    )}

                    {/* 컨트롤 버튼 */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearStaffCache}
                        className="flex-1 text-xs"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        직원 캐시 정리
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="flex-1 text-xs"
                      >
                        <ArrowPathIcon className={`h-3 w-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? '자동갱신' : '수동갱신'}
                      </Button>
                    </div>

                    {/* 개발 모드 전용 버튼 */}
                    {process.env.NODE_ENV === 'development' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearCache}
                        className="w-full text-xs"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        모든 캐시 정리 (개발 전용)
                      </Button>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 최소화 상태에서의 요약 정보 */}
            {!isExpanded && (
              <CardContent className="pt-0 pb-3">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>{metrics.totalQueries}개 쿼리</span>
                  <span>{(metrics.memoryEstimate / 1024).toFixed(1)}KB</span>
                  <span className={performanceStatus.color}>
                    {performanceStatus.text}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * 캐시 성능 모니터 토글 버튼
 */
export function CacheMonitorToggle({ 
  onToggle, 
  isVisible 
}: { 
  onToggle: () => void
  isVisible: boolean 
}) {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="fixed bottom-20 right-4 z-40"
      title="캐시 성능 모니터 토글"
    >
      <ChartBarIcon className="h-4 w-4" />
      {isVisible && <span className="ml-1 text-xs">숨기기</span>}
    </Button>
  )
}