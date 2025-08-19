'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/useAuthStore'
import { Button, Card, CardHeader, CardTitle, CardBody, Loading } from '@/components/ui'
import { SystemAdminSection } from '@/components/main/SystemAdminSection'
import { TenantAdminSection } from '@/components/main/TenantAdminSection'
import Link from 'next/link'
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline'

export default function MainDashboard() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !profile)) {
      router.push('/auth/login')
    }
  }, [user, profile, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }


  // 시스템 관리자 및 테넌트 관리자 확인
  const isSystemAdmin = profile?.role === 'system_admin' || 
    ['admin@test.com', 'sjlee87@kakao.com'].includes(profile?.email || '')
  const isTenantAdmin = profile?.role === 'admin'

  const mainFeatures = [
    {
      title: '학생 관리',
      description: '학생 정보 등록, 수정, 조회',
      href: '/main/students',
      icon: AcademicCapIcon,
      color: 'bg-blue-500'
    },
    {
      title: '클래스 관리',
      description: '수업 및 반 편성 관리',
      href: '/main/classes',
      icon: UserGroupIcon,
      color: 'bg-green-500'
    },
    {
      title: '강사 관리',
      description: '강사 정보 및 스케줄 관리',
      href: '/main/instructors',
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500'
    },
    {
      title: '수강 등록',
      description: '수강 신청 및 결제 관리',
      href: '/main/enrollments',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500'
    },
    {
      title: '시간표 관리',
      description: '수업 시간표 및 교실 배정',
      href: '/main/schedules',
      icon: CalendarDaysIcon,
      color: 'bg-indigo-500'
    },
    {
      title: '통계 및 리포트',
      description: '학원 운영 현황 분석',
      href: '/main/reports',
      icon: ChartBarIcon,
      color: 'bg-red-500'
    }
  ]

  const quickStats = [
    { label: '전체 학생', value: '0명', change: '+0%' },
    { label: '활성 클래스', value: '0개', change: '+0%' },
    { label: '이번 달 수익', value: '₩0', change: '+0%' },
    { label: '출석률', value: '0%', change: '+0%' }
  ]

  return (
    <div className="flex-1 overflow-auto">
      {/* 페이지 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">메인 대시보드</h1>
              <p className="text-gray-600 mt-1">
                안녕하세요, {profile.name || profile.email}님
              </p>
            </div>
            
            <div className="flex gap-2">
              {/* 관리 섹션으로의 스크롤 이동 버튼들 */}
              {isSystemAdmin && (
                <Button
                  variant="outline"
                  className="border-red-300 hover:bg-red-50"
                  onClick={() => {
                    const systemAdminSection = document.getElementById('system-admin-section')
                    systemAdminSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  시스템 관리
                </Button>
              )}
              {isTenantAdmin && (
                <Button
                  variant="outline"
                  className="border-blue-300 hover:bg-blue-50"
                  onClick={() => {
                    const tenantAdminSection = document.getElementById('tenant-admin-section')
                    tenantAdminSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  학원 관리
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 페이지 컨텐츠 */}
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 mt-1">
                오늘도 좋은 하루 되세요! EduCanvas와 함께 학원을 관리해보세요.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">소속 학원</p>
              <p className="font-semibold">{profile.tenants?.name || '미지정'}</p>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  {stat.change}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainFeatures.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardBody className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`${feature.color} rounded-lg p-3`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">신규 학생 등록</p>
                  <p className="text-sm text-gray-500">김철수 학생이 등록되었습니다</p>
                </div>
                <span className="text-sm text-gray-400">방금 전</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">수업 일정 변경</p>
                  <p className="text-sm text-gray-500">중등부 수학 수업 시간이 변경되었습니다</p>
                </div>
                <span className="text-sm text-gray-400">1시간 전</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">결제 완료</p>
                  <p className="text-sm text-gray-500">이영희 학생 3월 수강료 결제 완료</p>
                </div>
                <span className="text-sm text-gray-400">2시간 전</span>
              </div>
            </div>
          </CardBody>
        </Card>

          {/* 동적 관리 섹션들 - 역할에 따라 표시 */}
          {isSystemAdmin && (
            <div id="system-admin-section">
              <SystemAdminSection className="mt-8" />
            </div>
          )}

          {isTenantAdmin && (
            <div id="tenant-admin-section">
              <TenantAdminSection className="mt-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}