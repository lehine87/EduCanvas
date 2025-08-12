'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { Button, Card, CardHeader, CardTitle, CardBody, Loading } from '@/components/ui'
import { TenantCreateModal } from '@/components/admin/TenantCreateModal'
import { TenantListTable } from '@/components/admin/TenantListTable'

export default function SystemAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkSystemAdmin() {
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

        // 시스템 관리자 권한 확인
        if (profile.role !== 'system_admin' && 
            !['admin@test.com', 'sjlee87@kakao.com'].includes(profile.email)) {
          router.push('/admin')
          return
        }

        setUser({ auth: currentUser, profile })
        await loadTenants()
        setIsLoading(false)

      } catch (error) {
        console.error('시스템 관리자 권한 확인 실패:', error)
        router.push('/auth/login')
      }
    }

    checkSystemAdmin()
  }, [router])

  const loadTenants = async () => {
    setIsLoadingTenants(true)
    try {
      console.log('시스템 관리자 - 테넌트 목록 로드 중...')
      
      // API Route를 통해 서버 사이드에서 데이터 가져오기
      const response = await fetch('/api/system-admin/tenants')
      
      if (!response.ok) {
        console.error('시스템 관리자 - API 호출 실패:', response.status)
        return
      }
      
      const data = await response.json()

      console.log('✅ 시스템 관리자 - 테넌트 목록 로드 성공:', data?.length || 0, '개')
      console.log('📊 로드된 테넌트 데이터:', data)
      data?.forEach(tenant => {
        const count = tenant.user_count?.[0]?.count || 0
        console.log(`   ${tenant.name}: ${count}명`)
      })
      setTenants(data || [])
      
    } catch (error) {
      console.error('시스템 관리자 - 테넌트 목록 로드 예외:', error)
    } finally {
      setIsLoadingTenants(false)
    }
  }

  const handleTenantCreated = (newTenant: any) => {
    setTenants(prev => [newTenant, ...prev])
    setShowCreateModal(false)
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
                EduCanvas 시스템 관리자
              </h1>
              <p className="text-gray-600">
                테넌트 생성 및 관리
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.profile?.name || 'System Administrator'} ({user?.profile?.email || user?.auth?.email})
              </span>
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
        {/* 요약 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 테넌트 수</p>
                  <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 테넌트</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tenants.filter(t => t.is_active).length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">체험 기간</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tenants.filter(t => t.subscription_tier === 'trial').length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 테넌트 관리 섹션 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>테넌트 관리</CardTitle>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + 새 테넌트 생성
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <TenantListTable 
              tenants={tenants}
              isLoading={isLoadingTenants}
              onRefresh={loadTenants}
              onTenantsUpdate={setTenants}
            />
          </CardBody>
        </Card>
      </div>

      {/* 테넌트 생성 모달 */}
      <TenantCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTenantCreated={handleTenantCreated}
      />
    </div>
  )
}