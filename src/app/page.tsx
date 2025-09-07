import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          EduCanvas 학원 관리 시스템
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          혁신적인 드래그앤드롭 클래스 관리 플랫폼
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">🎯 관리자 대시보드</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            역할에 맞는 관리자 대시보드로 자동 이동합니다.
          </p>
          <Link href="/main">
            <Button className="w-full bg-educanvas-600 hover:bg-educanvas-700">
              대시보드 접속
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">🔐 로그인</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            계정이 있으신 분은 로그인해주세요.
          </p>
          <Link href="/auth/login">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              로그인하기
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📊 완성된 기능들</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-green-600 font-semibold">✅ 학생 관리</div>
            <div className="text-gray-600 dark:text-gray-400">CRUD 완료</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-green-600 font-semibold">✅ 클래스 관리</div>
            <div className="text-gray-600 dark:text-gray-400">CRUD 완료</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-green-600 font-semibold">✅ 강사 관리</div>
            <div className="text-gray-600 dark:text-gray-400">CRUD 완료</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-green-600 font-semibold">✅ 코스패키지</div>
            <div className="text-gray-600 dark:text-gray-400">CRUD 완료</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-green-600 font-semibold">✅ 수강등록</div>
            <div className="text-gray-600 dark:text-gray-400">CRUD 완료</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-green-600 font-semibold">✅ 급여정책</div>
            <div className="text-gray-600 dark:text-gray-400">CRUD 완료</div>
          </div>
        </div>
      </Card>

      <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
        <p>개발 버전 v5.0 - 2025년 9월 7일</p>
      </div>
    </div>
  )
}