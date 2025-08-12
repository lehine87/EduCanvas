'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/authClient'
import { Button, Card, CardBody, Loading } from '@/components/ui'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  role?: string | null  // 명시적으로 role 필드 추가
  tenant_id?: string | null  // 명시적으로 tenant_id 필드 추가
  status?: string | null  // 명시적으로 status 필드 추가
  tenants?: {
    id: string
    name: string
    slug: string
    tenant_code?: string
  } | null
}

type Tenant = Database['public']['Tables']['tenants']['Row'] & {
  tenant_code?: string
}

export default function PendingApprovalPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ auth: User; profile: UserProfile } | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
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

        // 이미 활성화된 사용자는 관리자 페이지로
        if (profile.status === 'active') {
          router.push('/admin')
          return
        }

        // 테넌트가 설정되지 않은 사용자는 온보딩 페이지로
        if (!profile.tenant_id) {
          router.push('/onboarding')
          return
        }

        setUser({ auth: currentUser, profile })
        
        // 테넌트 정보도 함께 로드
        if (profile.tenants) {
          setTenant(profile.tenants)
        }
        
        setIsLoading(false)

      } catch (error) {
        console.error('사용자 데이터 로드 실패:', error)
        router.push('/auth/login')
      }
    }

    loadUserData()
  }, [router])

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const handleContactSupport = () => {
    const email = 'support@educanvas.com'
    const subject = '가입 승인 문의'
    const body = `
안녕하세요.

다음 정보로 가입 신청했으나 승인이 지연되어 문의드립니다:

- 이름: ${user?.profile?.name || ''}
- 이메일: ${user?.profile?.email || ''}
- 학원: ${tenant?.name || ''}
- 신청 일시: ${user?.profile?.created_at ? new Date(user.profile.created_at).toLocaleString('ko-KR') : ''}

빠른 처리 부탁드립니다.

감사합니다.
    `.trim()

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            승인 대기 중입니다 ⏳
          </h1>
          <p className="text-lg text-gray-600">
            관리자 승인 후 EduCanvas를 이용하실 수 있습니다
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-blue-600">1. 가입 완료</span>
            <span className="text-blue-600">2. 학원 연결</span>
            <span className="text-yellow-600">3. 승인 대기</span>
          </div>
          <div className="mt-2 flex">
            <div className="flex-1 bg-blue-600 rounded-l-full h-2"></div>
            <div className="flex-1 bg-blue-600 h-2"></div>
            <div className="flex-1 bg-yellow-500 rounded-r-full h-2"></div>
          </div>
        </div>

        {/* 신청 정보 카드 */}
        <Card className="mb-6">
          <CardBody>
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  가입 신청이 완료되었습니다! 🎉
                </h3>
                
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>이름:</span>
                    <span className="font-medium">{user?.profile?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>이메일:</span>
                    <span className="font-medium">{user?.profile?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>직책:</span>
                    <span className="font-medium">
                      {user?.profile?.role === 'instructor' ? '강사' :
                       user?.profile?.role === 'staff' ? '스태프' :
                       user?.profile?.role === 'admin' ? '관리자' : '미설정'}
                    </span>
                  </div>
                  {tenant && (
                    <>
                      <div className="flex justify-between">
                        <span>소속 학원:</span>
                        <span className="font-medium">{tenant.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>고객번호:</span>
                        <span className="font-medium">{tenant.tenant_code}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span>신청 일시:</span>
                    <span className="font-medium">
                      {user?.profile?.created_at 
                        ? new Date(user.profile.created_at).toLocaleString('ko-KR')
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-800 mb-1">
                      현재 상태: 관리자 승인 대기
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {tenant ? tenant.name : '해당 학원'}의 관리자가 가입 승인을 검토하고 있습니다.
                      일반적으로 1-2 영업일 내에 승인이 완료됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-800 mb-2">📧 승인 완료 시</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 이메일로 승인 완료 알림을 받으실 수 있습니다</li>
                  <li>• 로그인하여 EduCanvas의 모든 기능을 이용하실 수 있습니다</li>
                  <li>• 학원의 학생 관리, 수업 관리 등에 참여하실 수 있습니다</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleContactSupport}
              className="w-full"
            >
              📞 승인 문의하기
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              🔄 로그인 페이지로
            </Button>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            로그아웃
          </Button>
        </div>

        {/* 도움말 */}
        <div className="mt-8 text-center text-sm text-gray-500 space-y-2">
          <p>
            승인이 지연되거나 문제가 있으시면{' '}
            <button 
              onClick={handleContactSupport}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              고객지원
            </button>
            으로 문의해주세요.
          </p>
          <p className="text-xs text-gray-400">
            문의 시 위의 신청 정보를 함께 보내주시면 빠른 처리가 가능합니다.
          </p>
        </div>
      </div>
    </div>
  )
}