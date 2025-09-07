'use client'

import React from 'react'
import { Header } from './Header'
import SearchProvider from '@/components/search/SearchProvider'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * 완전한 메인 레이아웃 컴포넌트
 * Header + 탭 네비게이션 + 글로벌 검색 통합 완료
 */
export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <SearchProvider>
      <div className={`flex h-screen bg-background ${className || ''}`}>      
        {/* 메인 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 헤더 + 탭 네비게이션 */}
          <Header />
          
          {/* 페이지 콘텐츠 */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}