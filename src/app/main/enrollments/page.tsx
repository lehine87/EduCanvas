'use client'

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MainLayout } from '@/components/layout'

export default function EnrollmentsPage() {
  const breadcrumbs = [
    { label: '홈', href: '/main' },
    { label: '수강 등록', href: '/main/enrollments' }
  ]

  return (
    <MainLayout 
      title="수강 등록" 
      breadcrumbs={breadcrumbs}
      actions={
        <Button>
          새 수강 등록
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>수강 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">수강 등록 기능을 개발 중입니다.</p>
            <p className="text-sm text-gray-400">곧 사용할 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}