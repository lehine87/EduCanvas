'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { cn } from '@/lib/utils'

/**
 * 관리자 레이아웃 컴포넌트
 */
interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  showSidebar?: boolean
  sidebarCollapsed?: boolean
}

export function AdminLayout({ 
  children, 
  title,
  showSidebar = true,
  sidebarCollapsed: initialCollapsed = false
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed)

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <AuthGuard 
      requireAuth={true}
      allowedRoles={['system_admin', 'tenant_admin', 'instructor', 'staff', 'viewer']}
    >
      <div className="flex h-screen bg-gray-50">
        {/* 사이드바 */}
        {showSidebar && (
          <div className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}>
            <Sidebar 
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              className="h-full"
            />
          </div>
        )}

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <Header 
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            showSidebarToggle={showSidebar}
          />

          {/* 메인 콘텐츠 */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}