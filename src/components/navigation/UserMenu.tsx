'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Shield, 
  Bell,
  ChevronDown 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuthStore'

interface UserMenuProps {
  className?: string
}

/**
 * 현업 SaaS 스타일 사용자 메뉴 컴포넌트
 * 클릭 시 설정, 프로필, 로그아웃 등의 옵션 제공
 */
export function UserMenu({ className }: UserMenuProps) {
  const router = useRouter()
  const { profile, signOut, isManager } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileSettings = () => {
    router.push('/settings/profile')
  }

  const handleSystemSettings = () => {
    router.push('/settings/system')
  }

  const handleSupport = () => {
    router.push('/support')
  }

  const getRoleLabel = (role?: string) => {
    const roleLabels = {
      'system_admin': '시스템 관리자',
      'tenant_admin': '운영자',
      'admin': '관리자',
      'instructor': '강사',
      'staff': '직원',
      'viewer': '조회자'
    }
    return roleLabels[role as keyof typeof roleLabels] || '사용자'
  }

  const getRoleColor = (role?: string) => {
    const roleColors = {
      'system_admin': 'bg-error-500',
      'tenant_admin': 'bg-educanvas-500', 
      'admin': 'bg-warning-500',
      'instructor': 'bg-info-500',
      'staff': 'bg-success-500',
      'viewer': 'bg-neutral-500'
    }
    return roleColors[role as keyof typeof roleColors] || 'bg-neutral-500'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 h-auto',
            'hover:bg-white/10',
            'data-[state=open]:bg-white/10',
            className
          )}
        >
          {/* 사용자 아바타 */}
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.name || '사용자'} />
            <AvatarFallback className="bg-white/20 text-white text-sm font-medium">
              {profile?.name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* 사용자 정보 (데스크톱에서만 표시) */}
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-white truncate">
              {profile?.name || profile?.email?.split('@')[0] || '사용자'}
            </span>
            <div className="flex items-center gap-1">
              <Badge 
                className={cn(
                  getRoleColor(profile?.role || ''),
                  'text-white text-xs px-1.5 py-0 h-4'
                )}
              >
                {getRoleLabel(profile?.role || '')}
              </Badge>
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-white/50">•</span>
              )}
            </div>
          </div>

          <ChevronDown className="h-4 w-4 text-white/70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* 사용자 정보 헤더 */}
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.name || '사용자'} />
              <AvatarFallback className="bg-wisdom-500 text-wisdom-contrast font-medium">
                {profile?.name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {profile?.name || '사용자'}
              </span>
              <span className="text-sm text-neutral-500 truncate">
                {profile?.email}
              </span>
              <Badge 
                className={cn(
                  getRoleColor(profile?.role || ''),
                  'text-white text-xs px-2 py-0 h-4 w-fit mt-1'
                )}
              >
                {getRoleLabel(profile?.role || '')}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* 메뉴 항목들 */}
        <DropdownMenuItem onClick={handleProfileSettings}>
          <User className="h-4 w-4 mr-2" />
          프로필 설정
        </DropdownMenuItem>

        {/* 관리자 전용 메뉴 */}
        {isManager && (
          <DropdownMenuItem onClick={handleSystemSettings}>
            <Shield className="h-4 w-4 mr-2" />
            시스템 설정
          </DropdownMenuItem>
        )}

        <DropdownMenuItem>
          <Bell className="h-4 w-4 mr-2" />
          알림 설정
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSupport}>
          <HelpCircle className="h-4 w-4 mr-2" />
          도움말 및 지원
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 개발 환경 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <DropdownMenuItem disabled>
              <Settings className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500">개발 모드</span>
                <span className="text-xs text-neutral-400">
                  ID: {profile?.id?.slice(-8)}
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* 로그아웃 */}
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isLoading}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}