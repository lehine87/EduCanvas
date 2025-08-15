'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { Button, Card, CardHeader, CardTitle, CardBody, Loading } from '@/components/ui'
import { MemberManagementTable } from '@/components/admin/MemberManagementTable'
import { PendingApprovalsTable } from '@/components/admin/PendingApprovalsTable'
import { TenantAdminSidebar, useTenantAdminSidebar } from '@/components/layout/TenantAdminSidebar'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Tenant } from '@/types/auth.types'
import { hasTenantId } from '@/types/auth.types'

export default function TenantAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ auth: User; profile: UserProfile } | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingApprovals: 0,
    instructors: 0,
    staff: 0
  })
  const router = useRouter()
  const { collapsed, toggle } = useTenantAdminSidebar()

  useEffect(() => {
    async function checkTenantAdmin() {
      try {
        const currentUser = await authClient.getCurrentUser()
        
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        const profile = await authClient.getUserProfile()
        
        if (!profile) {
          router.push('/auth/login')
          return
        }

        // 테넌트 관리자 권한 확인 (단방향 설계: admin으로 되돌아가지 않음)
        if (profile.role !== 'admin' || !hasTenantId(profile)) {
          console.error('🚨 [TENANT-ADMIN] ACCESS DENIED - NOT TENANT ADMIN')
          console.log('⚠️ [TENANT-ADMIN] SHOWING ACCESS ERROR INSTEAD OF REDIRECT TO PREVENT LOOP')
          
          setAuthError('테넌트 관리자 권한이 필요합니다.')
          setIsLoading(false)
          return
        }

        setUser({ auth: currentUser, profile })
        setTenant(profile.tenants as Tenant)
        
        await loadStats(profile.tenant_id)
        setIsLoading(false)

      } catch (error) {
        console.error('테넌트 관리자 권한 확인 실패:', error)
        router.push('/auth/login')
      }
    }

    checkTenantAdmin()
  }, [router])

  const loadStats = async (tenantId: string) => {
    try {
      console.log('📊 통계 데이터 로드 중...', tenantId)
      
      // API를 통해 회원 정보와 통계 가져오기
      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&status=all`)
      
      if (!response.ok) {
        throw new Error('회원 데이터 로드 실패')
      }
      
      const data = await response.json()
      
      console.log('✅ 통계 데이터 로드 성공:', data.stats)
      setStats({
        totalMembers: data.stats.total,
        activeMembers: data.stats.active,
        pendingApprovals: data.stats.pending,
        instructors: data.stats.instructors,
        staff: data.stats.staff
      })
      
    } catch (error) {
      console.error('❌ 통계 데이터 로드 실패:', error)
      // 실패 시 기본값 유지
      setStats({
        totalMembers: 0,
        activeMembers: 0,
        pendingApprovals: 0,
        instructors: 0,
        staff: 0
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    )
  }

  // 권한 오류 시 에러 페이지 표시
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            접근 권한 오류
          </h2>
          <p className="text-gray-600 mb-4">
            {authError}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/admin?stay=true')}
              variant="outline"
            >
              일반 관리자 페이지로
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              로그인 페이지로
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <div className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300`}>
        <TenantAdminSidebar
          collapsed={collapsed}
          onToggle={toggle}
          tenantName={tenant?.name}
          userInfo={{
            name: user?.profile?.name,
            email: user?.profile?.email || user?.auth?.email,
            role: user?.profile?.role || undefined
          }}
          className="h-screen sticky top-0"
        />
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  대시보드
                </h1>
                <p className="text-gray-600">
                  {tenant?.name || '테넌트'} 관리 현황
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const tenantId = user?.profile?.tenant_id
                    if (tenantId) {
                      loadStats(tenantId)
                    }
                  }}
                >
                  🔄 새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 p-6 overflow-auto">
        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.totalMembers}
              </div>
              <div className="text-sm text-gray-600">전체 회원</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.activeMembers}
              </div>
              <div className="text-sm text-gray-600">활성 회원</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {stats.pendingApprovals}
              </div>
              <div className="text-sm text-gray-600">승인 대기</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.instructors}
              </div>
              <div className="text-sm text-gray-600">강사</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {stats.staff}
              </div>
              <div className="text-sm text-gray-600">스태프</div>
            </CardBody>
          </Card>
        </div>

        {/* 승인 대기 목록 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <span>🕐</span>
                <span>가입 승인 대기 목록</span>
                {stats.pendingApprovals > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.pendingApprovals}
                  </span>
                )}
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => {
                  const tenantId = user?.profile?.tenant_id
                  if (tenantId) {
                    loadStats(tenantId)
                  }
                }}
              >
                🔄 새로고침
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <PendingApprovalsTable 
              tenantId={user?.profile?.tenant_id || ''}
              onApprovalChange={() => {
                const tenantId = user?.profile?.tenant_id
                if (tenantId) {
                  loadStats(tenantId)
                }
              }}
            />
          </CardBody>
        </Card>

        {/* 전체 회원 관리 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <span>👥</span>
                <span>전체 회원 관리</span>
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => {
                  const tenantId = user?.profile?.tenant_id
                  if (tenantId) {
                    loadStats(tenantId)
                  }
                }}
              >
                🔄 새로고침
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <MemberManagementTable 
              tenantId={user?.profile?.tenant_id || ''}
              onMemberChange={() => {
                const tenantId = user?.profile?.tenant_id
                if (tenantId) {
                  loadStats(tenantId)
                }
              }}
            />
          </CardBody>
        </Card>
        </div>
      </div>
    </div>
  )
}