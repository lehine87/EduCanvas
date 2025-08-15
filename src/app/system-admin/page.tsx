'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { Button, Card, CardHeader, CardTitle, CardBody, Loading } from '@/components/ui'
import { TenantCreateModal } from '@/components/admin/TenantCreateModal'
import { TenantListTable } from '@/components/admin/TenantListTable'
import { MainLayout } from '@/components/layout'
import type { User } from '@supabase/supabase-js'
import type { Tenant } from '@/types/auth.types'
import type { BreadcrumbItem } from '@/components/layout/types'

// 시스템 관리자 API에서 반환되는 확장된 테넌트 타입
interface TenantWithUserCount extends Tenant, Record<string, unknown> {
  user_count?: Array<{ count: number }>
}

export default function SystemAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tenants, setTenants] = useState<TenantWithUserCount[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  // 개발 환경에서만 로그 출력 (프로덕션 429 에러 방지)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏛️ [SYSTEM-ADMIN] PAGE LOADED:`, {
        timestamp: new Date().toISOString(),
        currentPath: window.location.pathname,
        isLoading
      })
    }
  }, []) // 빈 의존성 배열로 한 번만 실행

  useEffect(() => {
    async function checkSystemAdmin() {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 [SYSTEM-ADMIN-CHECK] CHECKING SYSTEM ADMIN PERMISSIONS`)
        }
        
        const currentUser = await authClient.getCurrentUser()
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`👤 [SYSTEM-ADMIN-CHECK] CURRENT USER:`, {
            hasUser: !!currentUser,
            userEmail: currentUser?.email
          })
        }
        
        if (!currentUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ [SYSTEM-ADMIN-CHECK] NO USER - REDIRECT TO LOGIN`)
          }
          router.push('/auth/login')
          return
        }

        const profile = await authClient.getUserProfile()
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`👤 [SYSTEM-ADMIN-CHECK] USER PROFILE:`, {
            hasProfile: !!profile,
            profileRole: profile?.role,
            profileEmail: profile?.email,
            profileStatus: profile?.status
          })
        }
        
        if (!profile) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ [SYSTEM-ADMIN-CHECK] NO PROFILE - REDIRECT TO LOGIN`)
          }
          router.push('/auth/login')
          return
        }

        // 시스템 관리자 권한 확인
        const isSystemAdmin = profile.role === 'system_admin' || 
            ['admin@test.com', 'sjlee87@kakao.com'].includes(profile.email)
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 [SYSTEM-ADMIN-CHECK] PERMISSION CHECK:`, {
            profileRole: profile.role,
            profileEmail: profile.email,
            isSystemAdmin,
            willRedirect: !isSystemAdmin
          })
        }
        
        if (!isSystemAdmin) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`🚨 [SYSTEM-ADMIN-ACCESS] NOT SYSTEM ADMIN - SHOWING ERROR PAGE`)
            console.warn(`⚠️ [SYSTEM-ADMIN-ACCESS] NO REDIRECT TO PREVENT LOOP`)
          }
          
          // 리다이렉트 대신 에러 상태로 설정하여 권한 없음 UI 표시
          setIsLoading(false)
          setAuthError('시스템 관리자 권한이 필요합니다.')
          return
        }

        setUser(currentUser)
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
      if (process.env.NODE_ENV === 'development') {
        console.log('시스템 관리자 - 테넌트 목록 로드 중...')
      }
      
      // API Route를 통해 서버 사이드에서 데이터 가져오기
      const response = await fetch('/api/system-admin/tenants')
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.error('시스템 관리자 - API 호출 실패:', response.status)
        }
        return
      }
      
      const data: TenantWithUserCount[] = await response.json()

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 시스템 관리자 - 테넌트 목록 로드 성공:', data?.length || 0, '개')
        console.log('📊 로드된 테넌트 데이터:', data)
        data?.forEach((tenant: TenantWithUserCount) => {
          const count = tenant.user_count?.[0]?.count || 0
          console.log(`   ${tenant.name}: ${count}명`)
        })
      }
      setTenants(data || [])
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('시스템 관리자 - 테넌트 목록 로드 예외:', error)
      }
    } finally {
      setIsLoadingTenants(false)
    }
  }

  const handleTenantCreated = (newTenant: Tenant) => {
    // 새로 생성된 테넌트는 user_count가 없으므로 기본값 설정
    const tenantWithUserCount: TenantWithUserCount = {
      ...newTenant,
      user_count: [{ count: 0 }]
    }
    setTenants(prev => [tenantWithUserCount, ...prev])
    setShowCreateModal(false)
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

  // 브레드크럼 설정
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '시스템 관리', href: '/system-admin', current: true }
  ]

  // 헤더 액션 버튼
  const headerActions = (
    <Button
      onClick={() => setShowCreateModal(true)}
      className="bg-blue-600 hover:bg-blue-700"
    >
      + 새 테넌트 생성
    </Button>
  )

  return (
    <MainLayout
      title="시스템 관리자"
      breadcrumbs={breadcrumbs}
      actions={headerActions}
      allowedRoles={['system_admin']}
    >
      <div className="space-y-8">
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
            <CardTitle>테넌트 관리</CardTitle>
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
    </MainLayout>
  )
}