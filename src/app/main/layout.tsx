'use client'

import { ReactNode } from 'react'
import { MainLayout } from '@/components/layout'
import { Toaster } from 'react-hot-toast'

interface MainLayoutWrapperProps {
  children: ReactNode
}

/**
 * 메인 대시보드 레이아웃 래퍼
 * T-V2-005: MainSidebar 대신 TabNavigation + SearchSidebar 조합 사용
 * 권한 기반 동적 탭 메뉴 + 컨텍스트별 검색 사이드바
 */
export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  return (
    <>
      {/* 메인 레이아웃 */}
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
    </>
  )
}