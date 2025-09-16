'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AcademicCapIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface QuickAccessPanelProps {
  onCreateClass: () => void
}

export default function QuickAccessPanel({ onCreateClass }: QuickAccessPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        빠른 액세스
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateClass}
          className="h-auto p-3 flex flex-col items-center justify-center space-y-1 hover:bg-educanvas-50 hover:border-educanvas-300"
        >
          <PlusIcon className="w-4 h-4 text-educanvas-600" />
          <span className="text-xs text-gray-700 dark:text-gray-300">새 클래스</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-auto p-3 flex flex-col items-center justify-center space-y-1 hover:bg-wisdom-50 hover:border-wisdom-300"
          onClick={() => {
            // 통계 페이지로 이동하거나 통계 모달 열기
            console.log('클래스 통계 보기')
          }}
        >
          <ChartBarIcon className="w-4 h-4 text-wisdom-600" />
          <span className="text-xs text-gray-700 dark:text-gray-300">통계</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-auto p-3 flex flex-col items-center justify-center space-y-1 hover:bg-growth-50 hover:border-growth-300"
          onClick={() => {
            // 시간표 페이지로 이동
            console.log('시간표 보기')
          }}
        >
          <CalendarIcon className="w-4 h-4 text-growth-600" />
          <span className="text-xs text-gray-700 dark:text-gray-300">시간표</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-auto p-3 flex flex-col items-center justify-center space-y-1 hover:bg-neutral-50 hover:border-neutral-300"
          onClick={() => {
            // 출석 관리 페이지로 이동
            console.log('출석 관리')
          }}
        >
          <UsersIcon className="w-4 h-4 text-neutral-600" />
          <span className="text-xs text-gray-700 dark:text-gray-300">출석</span>
        </Button>
      </div>

      {/* 최근 생성된 클래스들 */}
      <div className="mt-4">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          최근 생성
        </h4>
        <Card className="bg-gray-50 dark:bg-gray-800 border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <AcademicCapIcon className="w-4 h-4" />
              <span>최근 클래스가 없습니다</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}