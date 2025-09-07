'use client'

import { ReactNode } from 'react'
import { MainLayout } from '@/components/layout'
import { Toaster } from 'react-hot-toast'

interface MainLayoutWrapperProps {
  children: ReactNode
}

/**
 * 메인 대시보드 레이아웃 래퍼
 * 최적화된 MainLayout 사용
 */
export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  return (
    <>
      {/* 최적화된 메인 레이아웃 */}
      <MainLayout>
        {children}
      </MainLayout>
      
      {/* Toast 알림 - 전역 오버레이 */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      
      {/* 개발 환경 디버깅 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded text-sm">
          🔧 최적화된 MainLayout 사용 중
        </div>
      )}
    </>
  )
}