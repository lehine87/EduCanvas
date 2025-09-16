'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface AttendancePageLayoutProps {
  children: ReactNode
}

export function AttendancePageLayout({ children }: AttendancePageLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">출석체크</h1>
            <p className="text-muted-foreground">
              학생들의 출석 상태를 체크하고 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 추후 확장: 필터, 설정 버튼 등 */}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <Card className="flex-1 border-0 shadow-sm">
        {children}
      </Card>
    </div>
  )
}