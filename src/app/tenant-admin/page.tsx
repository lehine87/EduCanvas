'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { Button, Card, CardHeader, CardTitle, CardBody, Loading } from '@/components/ui'
import { MemberManagementTable } from '@/components/admin/MemberManagementTable'
import { PendingApprovalsTable } from '@/components/admin/PendingApprovalsTable'

export default function TenantAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingApprovals: 0,
    instructors: 0,
    staff: 0
  })
  const router = useRouter()

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

        // 테넌트 관리자 권한 확인
        if (profile.role !== 'admin' || !profile.tenant_id) {
          router.push('/admin')
          return
        }

        setUser({ auth: currentUser, profile })
        setTenant(profile.tenants)
        
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tenant?.name || '테넌트'} 관리자
              </h1>
              <p className="text-gray-600">
                회원 관리 및 승인 시스템
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <div className="text-gray-900 font-medium">{user?.profile?.name}</div>
                <div className="text-gray-500">{user?.profile?.email}</div>
              </div>
              <Button
                variant="outline"
                onClick={() => authClient.signOut().then(() => router.push('/auth/login'))}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                onClick={() => loadStats(user?.profile?.tenant_id)}
              >
                🔄 새로고침
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <PendingApprovalsTable 
              tenantId={user?.profile?.tenant_id}
              onApprovalChange={() => loadStats(user?.profile?.tenant_id)}
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
                onClick={() => loadStats(user?.profile?.tenant_id)}
              >
                🔄 새로고침
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <MemberManagementTable 
              tenantId={user?.profile?.tenant_id}
              onMemberChange={() => loadStats(user?.profile?.tenant_id)}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}