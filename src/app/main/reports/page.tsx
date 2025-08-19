'use client'

import { Button, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'
import { MainLayout } from '@/components/layout'

export default function ReportsPage() {
  const breadcrumbs = [
    { label: '홈', href: '/main' },
    { label: '통계 및 리포트', href: '/main/reports' }
  ]

  return (
    <MainLayout 
      title="통계 및 리포트" 
      breadcrumbs={breadcrumbs}
      actions={
        <Button>
          리포트 생성
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>통계 및 리포트</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">통계 및 리포트 기능을 개발 중입니다.</p>
            <p className="text-sm text-gray-400">곧 사용할 수 있습니다.</p>
          </div>
        </CardBody>
      </Card>
    </MainLayout>
  )
}