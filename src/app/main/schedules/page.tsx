'use client'

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PageHeader } from '@/components/layout/Header'

export default function SchedulesPage() {
  const breadcrumbs = [
    { name: '홈', href: '/main' },
    { name: '시간표 관리', href: '/main/schedules' }
  ]

  return (
    <>
      <PageHeader 
        title="시간표 관리" 
        breadcrumbs={breadcrumbs}
        description="학원 시간표를 관리하고 편집하세요"
        actions={
          <Button>
            시간표 편집
          </Button>
        }
      />
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>시간표 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">시간표 관리 기능을 개발 중입니다.</p>
              <p className="text-sm text-gray-400">곧 사용할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}