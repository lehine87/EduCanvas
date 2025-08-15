'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 404 일러스트 */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-blue-100 mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600">404</div>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900">
            페이지를 찾을 수 없습니다
          </h1>
          
          <p className="mt-4 text-lg text-gray-600">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          
          <p className="mt-2 text-sm text-gray-500">
            URL을 다시 확인하거나 홈페이지로 돌아가세요.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link href="/admin" className="block">
            <Button className="w-full flex items-center justify-center gap-2">
              <HomeIcon className="h-5 w-5" />
              홈으로 가기
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            이전 페이지로
          </Button>
        </div>

        {/* 도움이 될 수 있는 링크들 */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            찾고 계신 페이지가 아닌가요?
          </h3>
          
          <div className="space-y-2">
            <Link 
              href="/admin" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              • 대시보드
            </Link>
            <Link 
              href="/admin/students" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              • 학생 관리
            </Link>
            <Link 
              href="/admin/classes" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              • 반 관리
            </Link>
            <Link 
              href="/tenant-admin" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              • 테넌트 관리
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            문제가 지속되면 관리자에게 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}