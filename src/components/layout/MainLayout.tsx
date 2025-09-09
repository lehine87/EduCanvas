'use client'

import React, { useEffect } from 'react'
import { Header } from './Header'
import SearchProvider from '@/components/search/SearchProvider'
import { useAuthStore } from '@/store/useAuthStore'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * 완전한 메인 레이아웃 컴포넌트
 * Header + 탭 네비게이션 + 글로벌 검색 + 인증 초기화 통합 완료
 */
export function MainLayout({ children, className }: MainLayoutProps) {
  const { initialize, initialized, loading } = useAuthStore()

  // ✅ 업계 표준: 앱 전체에서 한 번만 인증 초기화
  useEffect(() => {
    // 이미 초기화 중이거나 완료된 경우 스킵
    if (initialized || loading) {
      return
    }
    
    console.log('🔐 [MAIN-LAYOUT] 인증 초기화 시작')
    initialize()
  }, []) // 의존성 배열을 비워서 한 번만 실행

  return (
    <SearchProvider>
      <div className={`flex h-screen bg-background ${className || ''}`}>      
        {/* 메인 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 헤더 + 탭 네비게이션 */}
          <Header />
          
          {/* 페이지 콘텐츠 */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}