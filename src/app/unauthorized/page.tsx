export const metadata = {
  title: '접근 권한 없음 | EduCanvas',
  description: '이 페이지에 접근할 권한이 없습니다',
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            접근 권한 없음
          </h1>
          <p className="text-gray-600 mb-6">
            이 페이지에 접근할 권한이 없습니다.
            관리자에게 문의하세요.
          </p>
          <div className="space-y-3">
            <a
              href="/admin"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              홈으로 돌아가기
            </a>
            <a
              href="/auth/login"
              className="block w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              다시 로그인
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}