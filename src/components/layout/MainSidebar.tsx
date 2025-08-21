'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/store/useAuthStore'
import { authClient } from '@/lib/auth/authClient'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  GraduationCap,
  Users,
  ClipboardList,
  Calendar,
  DollarSign,
  BarChart3,
  User,
  Settings,
  Shield,
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  allowedRoles?: string[]
}

/**
 * 메인 사이드바 - 역할별 메뉴 표시
 */
export function MainSidebar() {
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)


  // 기본 메뉴 (모든 역할 공통)
  const commonMenuItems: MenuItem[] = [
    {
      name: '대시보드',
      href: '/main',
      icon: Home,
      description: '메인 대시보드'
    },
    {
      name: '학생 관리',
      href: '/main/students',
      icon: GraduationCap,
      description: '학생 정보 관리'
    },
    {
      name: '클래스 관리',
      href: '/main/classes',
      icon: Users,
      description: '수업 및 반 관리',
      allowedRoles: ['system_admin', 'tenant_admin', 'instructor']
    },
    {
      name: '강사 관리',
      href: '/main/instructors',
      icon: ClipboardList,
      description: '강사 정보 관리',
      allowedRoles: ['system_admin', 'tenant_admin']
    },
    {
      name: '시간표',
      href: '/main/schedules',
      icon: Calendar,
      description: '수업 시간표'
    },
    {
      name: '수강 등록',
      href: '/main/enrollments',
      icon: DollarSign,
      description: '수강 신청 및 결제',
      allowedRoles: ['system_admin', 'tenant_admin', 'staff']
    },
    {
      name: '통계 및 리포트',
      href: '/main/reports',
      icon: BarChart3,
      description: '운영 현황 분석',
      allowedRoles: ['system_admin', 'tenant_admin']
    }
  ]

  // 관리 메뉴를 별도 페이지 이동 대신 메인 페이지 내 섹션으로 이동하는 버튼들
  const adminMenuItems: MenuItem[] = []
  
  if (profile?.role === 'system_admin' || ['admin@test.com', 'sjlee87@kakao.com'].includes(profile?.email || '')) {
    adminMenuItems.push({
      name: '시스템 관리',
      href: '#system-admin-section',
      icon: Shield,
      description: '시스템 전체 관리'
    })
  }
  
  if (profile?.role === 'tenant_admin') {
    adminMenuItems.push({
      name: '학원 관리',
      href: '#tenant-admin-section',
      icon: Settings,
      description: '학원 설정 및 관리'
    })
  }

  // 역할 기반 메뉴 필터링
  const filteredMenuItems = commonMenuItems.filter(item => {
    if (!item.allowedRoles) return true
    return item.allowedRoles.includes(profile?.role || 'viewer')
  })

  const allMenuItems = [...filteredMenuItems, ...adminMenuItems]

  // 활성 메뉴 확인
  const isActive = (href: string) => {
    if (href === '/main') {
      return pathname === '/main'
    }
    return pathname.startsWith(href)
  }

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    await authClient.signOut()
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-foreground">EduCanvas</h1>
            <p className="text-sm text-muted-foreground">학원 관리 시스템</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* 사용자 정보 */}
      {!collapsed && profile && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile.name?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {profile.name || profile.email?.split('@')[0]}
              </div>
              <Badge variant="secondary" className="text-xs mt-1">
                {profile.role === 'system_admin' ? '시스템 관리자' :
                 profile.role === 'tenant_admin' ? '테넌트 관리자' :
                 profile.role === 'instructor' ? '강사' :
                 profile.role === 'staff' ? '스태프' : '뷰어'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {allMenuItems.map((item) => {
          // 앵커 링크인 경우 스크롤 이동 처리
          const isAnchorLink = item.href.startsWith('#')
          
          if (isAnchorLink) {
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left h-auto py-2',
                  collapsed && 'justify-center px-2'
                )}
                onClick={() => {
                  const targetId = item.href.substring(1) // # 제거
                  const targetElement = document.getElementById(targetId)
                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'flex-shrink-0 h-4 w-4',
                    !collapsed && 'mr-3'
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Button>
            )
          }
          
          // 일반 링크는 기존 방식 유지
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                'w-full justify-start text-left h-auto py-2',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Link href={item.href} className="flex items-center">
                <item.icon
                  className={cn(
                    'flex-shrink-0 h-4 w-4',
                    !collapsed && 'mr-3'
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* 사용자 정보 */}
      <div className="border-t border-border p-4">
        {!collapsed && profile && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile.name?.[0] || profile.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.name || profile.email?.split('@')[0]}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {profile.role === 'tenant_admin' ? '테넌트 관리자' :
                     profile.role === 'system_admin' ? '시스템 관리자' :
                     profile.role === 'instructor' ? '강사' :
                     profile.role === 'staff' ? '스태프' :
                     profile.role === 'viewer' ? '뷰어' : profile.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {!collapsed ? (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-2"
                asChild
              >
                <Link href="/main/profile" className="flex items-center">
                  <User className="h-4 w-4 mr-3" />
                  프로필
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                로그아웃
              </Button>
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                asChild
                title="프로필"
              >
                <Link href="/main/profile" className="flex items-center justify-center">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleSignOut}
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}