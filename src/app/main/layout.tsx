'use client'

import { ReactNode } from 'react'
import { MainSidebar } from '@/components/layout/MainSidebar'
import { Toaster } from 'react-hot-toast'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * 메인 대시보드 레이아웃
 * 모든 사용자(system_admin, admin, instructor, staff, viewer)가 공통으로 사용
 * 역할별로 다른 사이드바 메뉴 표시
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* 사이드바 */}
      <MainSidebar />
      
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
      {/* Toast 알림 */}
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
    </div>
  )
}