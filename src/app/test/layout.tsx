import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'EduCanvas 테스트 센터',
  description: '개발 환경 전용 테스트 페이지 모음',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 프로덕션 환경에서 접근 차단
  if (process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 개발 환경 표시 헤더 */}
      <div className="bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-4 py-2 text-center text-sm font-medium">
        🚧 개발 환경 전용 - 테스트 모드
      </div>
      
      {children}
    </div>
  )
}