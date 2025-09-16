'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  SignalIcon
} from '@heroicons/react/24/outline'

interface RealtimeIndicatorProps {
  isConnected: boolean
  className?: string
  showText?: boolean
}

/**
 * 실시간 연결 상태 인디케이터
 * 
 * 기능:
 * - 연결 상태 시각적 표시
 * - 애니메이션 효과
 * - 접근성 지원
 */
export default function RealtimeIndicator({ 
  isConnected, 
  className = '',
  showText = true 
}: RealtimeIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isConnected ? 'connected' : 'disconnected'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center space-x-2 ${className}`}
        role="status"
        aria-live="polite"
      >
        {isConnected ? (
          <>
            {/* 연결됨 상태 */}
            <div className="relative">
              <SignalIcon className="h-4 w-4 text-green-500" />
              <motion.div
                className="absolute inset-0 rounded-full bg-green-500"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            {showText && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                실시간 동기화
              </span>
            )}
          </>
        ) : (
          <>
            {/* 연결 안됨 상태 */}
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            {showText && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                동기화 대기중
              </span>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * 간단한 도트 인디케이터 버전
 */
export function RealtimeDot({ isConnected }: { isConnected: boolean }) {
  return (
    <div 
      className={`h-2 w-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-amber-500'
      }`}
      title={isConnected ? '실시간 동기화 활성' : '동기화 대기중'}
    >
      {isConnected && (
        <motion.div
          className="h-2 w-2 rounded-full bg-green-500"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [1, 0, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}