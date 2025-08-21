'use client'

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MainLayout } from '@/components/layout'

export default function SchedulesPage() {
  const breadcrumbs = [
    { label: '홈', href: '/main' },
    { label: '시간표 관리', href: '/main/schedules' }
  ]

  return (
    <MainLayout 
      title="시간표 관리" 
      breadcrumbs={breadcrumbs}
      actions={
        <Button>
          시간표 편집
        </Button>
      }
    >
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
    </MainLayout>
  )
}