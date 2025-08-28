'use client'

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PageHeader } from '@/components/layout/Header'

export default function ReportsPage() {
  const breadcrumbs = [
    { name: '홈', href: '/main' },
    { name: '통계 및 리포트', href: '/main/reports' }
  ]

  return (
    <>
      <PageHeader 
        title="통계 및 리포트" 
        breadcrumbs={breadcrumbs}
        description="학원 운영 데이터를 분석하고 리포트를 생성하세요"
        actions={
          <Button>
            리포트 생성
          </Button>
        }
      />
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>통계 및 리포트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">통계 및 리포트 기능을 개발 중입니다.</p>
            <p className="text-sm text-gray-400">곧 사용할 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}