'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PageHeader } from '@/components/layout/Header'
import { useAuth } from '@/store/useAuthStore'

export default function ProfilePage() {
  const { profile } = useAuth()

  const breadcrumbs = [
    { name: '홈', href: '/main' },
    { name: '프로필', href: '/main/profile' }
  ]

  return (
    <>
      <PageHeader 
        title="프로필" 
        breadcrumbs={breadcrumbs}
        description="사용자 프로필 정보를 확인하세요"
      />
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>사용자 프로필</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.name || '미설정'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">이메일</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.email || '미설정'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">역할</label>
              <p className="mt-1 text-sm text-gray-900">
                {profile?.role === 'system_admin' ? '시스템 관리자' :
                 profile?.role === 'tenant_admin' ? '학원 관리자' :
                 profile?.role === 'instructor' ? '강사' :
                 profile?.role === 'staff' ? '스태프' : '뷰어'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">소속 학원</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.tenants?.name || '미지정'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}