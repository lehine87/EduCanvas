'use client'

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { PageHeader } from '@/components/layout/Header'

export default function EnrollmentsPage() {
  const breadcrumbs = [
    { name: '홈', href: '/main' },
    { name: '수강 등록', href: '/main/enrollments' }
  ]

  return (
    <>
      <PageHeader 
        title="수강 등록" 
        breadcrumbs={breadcrumbs}
        description="학생 수강 등록을 관리하고 처리하세요"
        actions={
          <Button>
            새 수강 등록
          </Button>
        }
      />
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
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
      </div>
    </>
  )
}