'use client'

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MainLayout } from '@/components/layout'

export default function InstructorsPage() {
  const breadcrumbs = [
    { label: '홈', href: '/main' },
    { label: '강사 관리', href: '/main/instructors' }
  ]

  return (
    <MainLayout 
      title="강사 관리" 
      breadcrumbs={breadcrumbs}
      actions={
        <Button>
          새 강사 등록
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>강사 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">강사 관리 기능을 개발 중입니다.</p>
            <p className="text-sm text-gray-400">곧 사용할 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}