'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/store/useAuthStore'
import { Button, Card, CardHeader, CardTitle, CardContent, Loading } from '@/components/ui'
import { MemberManagementTable } from '@/components/admin/MemberManagementTable'
import { PendingApprovalsTable } from '@/components/admin/PendingApprovalsTable'
import { Cog6ToothIcon, UsersIcon, ClockIcon, AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline'
import type { UserProfile, Tenant } from '@/types/auth.types'
import { hasTenantId } from '@/types/auth.types'

interface TenantAdminSectionProps {
  className?: string
}

/**
 * 학원 관리 섹션 - admin 역할만 표시됨
 * 메인 페이지에서 동적으로 렌더링되는 관리 섹션
 */
export function TenantAdminSection({ className = '' }: TenantAdminSectionProps) {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingApprovals: 0,
    instructors: 0,
    staff: 0
  })
  // 중복 API 호출 방지를 위한 상태 추가
  const [allMembers, setAllMembers] = useState<UserProfile[]>([])
  const [pendingMembers, setPendingMembers] = useState<UserProfile[]>([])
  const [activeMembers, setActiveMembers] = useState<UserProfile[]>([])

  const loadStats = useCallback(async (tenantId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 학원 관리 섹션 - 모든 회원 데이터 로드 중...', tenantId)
      }
      
      // 모든 회원 데이터를 한번에 가져오기 (중복 API 호출 방지)
      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&status=all`)
      
      if (!response.ok) {
        throw new Error('회원 데이터 로드 실패')
      }
      
      const data = await response.json()
      const members = data.members || []
      
      // 상태별로 회원 분류
      const pending = members.filter((m: UserProfile) => m.status === 'pending_approval')
      const active = members.filter((m: UserProfile) => m.status === 'active')
      
      // 상태 업데이트
      setAllMembers(members)
      setPendingMembers(pending)
      setActiveMembers(active)
      
      // 통계 계산
      const instructors = active.filter((m: UserProfile) => m.role === 'instructor').length
      const staff = active.filter((m: UserProfile) => m.role === 'staff').length
      
      setStats({
        totalMembers: members.length,
        activeMembers: active.length,
        pendingApprovals: pending.length,
        instructors,
        staff
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 학원 관리 섹션 - 데이터 로드 및 분류 완료:', {
          total: members.length,
          active: active.length,
          pending: pending.length,
          instructors,
          staff
        })
      }
      
    } catch (error) {
      console.error('❌ 학원 관리 섹션 - 데이터 로드 실패:', error)
      // 실패 시 기본값 유지
      setAllMembers([])
      setPendingMembers([])
      setActiveMembers([])
      setStats({
        totalMembers: 0,
        activeMembers: 0,
        pendingApprovals: 0,
        instructors: 0,
        staff: 0
      })
    }
  }, [])

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    if (profile?.tenant_id) {
      loadStats(profile.tenant_id)
    }
  }, [profile?.tenant_id, loadStats])

  // 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      if (!profile) {
        setIsLoading(false)
        return
      }

      // 테넌트 관리자 권한 확인
      if (profile.role !== 'admin' || !hasTenantId(profile)) {
        setIsLoading(false)
        return
      }

      // 테넌트 정보 설정
      setTenant(profile.tenants as Tenant)
      
      // 통계 데이터 로드
      await loadStats(profile.tenant_id)
      setIsLoading(false)
    }

    initializeData()
  }, [profile, loadStats])

  // 권한이 없거나 로딩 중일 때는 렌더링하지 않음
  if (!profile || profile.role !== 'admin' || !hasTenantId(profile)) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: '전체 회원',
      value: stats.totalMembers,
      icon: UsersIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: '활성 회원',
      value: stats.activeMembers,
      icon: UserIcon,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: '승인 대기',
      value: stats.pendingApprovals,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: '강사',
      value: stats.instructors,
      icon: AcademicCapIcon,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: '스태프',
      value: stats.staff,
      icon: UserIcon,
      color: 'text-indigo-600 bg-indigo-100'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 섹션 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">학원 관리</h2>
              <p className="text-sm text-gray-600">
                {tenant?.name || '학원'} 설정 및 회원 관리
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-blue-300 hover:bg-blue-50"
          >
            🔄 새로고침
          </Button>
        </div>
      </div>

      {/* 학원 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* 회원 관리 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 승인 대기 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-yellow-500" />
              <span>승인 대기</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingApprovalsTable 
              tenantId={profile.tenant_id}
              pendingUsers={pendingMembers}
              onApprovalChange={handleRefresh}
            />
          </CardContent>
        </Card>

        {/* 회원 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UsersIcon className="h-5 w-5 text-blue-500" />
              <span>회원 관리</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemberManagementTable 
              tenantId={profile.tenant_id}
              members={activeMembers}
              onMemberChange={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}