'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import Link from 'next/link'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { role } = usePermissions()
  
  const [errorDetails, setErrorDetails] = useState({
    reason: 'access_denied',
    path: '',
    message: '이 페이지에 접근할 권한이 없습니다.'
  })

  useEffect(() => {
    const reason = searchParams.get('reason') || 'access_denied'
    const path = searchParams.get('path') || ''
    const message = searchParams.get('message') || ''
    
    let customMessage = message
    
    // 에러 유형별 메시지 설정
    switch (reason) {
      case 'no_role':
        customMessage = '사용자 역할이 설정되지 않았습니다. 관리자에게 문의하세요.'
        break
      case 'insufficient_role':
        customMessage = '현재 역할로는 이 페이지에 접근할 수 없습니다.'
        break
      case 'no_permission':
        customMessage = '이 작업을 수행할 권한이 없습니다.'
        break
      case 'tenant_mismatch':
        customMessage = '다른 테넌트의 리소스에 접근할 수 없습니다.'
        break
      case 'resource_not_found':
        customMessage = '요청한 리소스를 찾을 수 없습니다.'
        break
      case 'account_suspended':
        customMessage = '계정이 정지되었습니다. 관리자에게 문의하세요.'
        break
      case 'email_not_verified':
        customMessage = '이메일 인증이 필요합니다.'
        break
      default:
        customMessage = customMessage || '접근 권한이 없습니다.'
    }
    
    setErrorDetails({
      reason,
      path,
      message: customMessage
    })
  }, [searchParams])

  // 역할별 추천 페이지 결정
  const getRecommendedPage = () => {
    if (!role) return '/auth/login'
    
    switch (role) {
      case 'system_admin':
        return '/system-admin'
      case 'admin':
        return '/admin'
      case 'instructor':
        return '/instructor'
      case 'staff':
        return '/admin/students'
      case 'viewer':
        return '/admin'
      default:
        return '/admin'
    }
  }

  // 로딩 중일 때 (간단 처리)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* 에러 아이콘 */}
          <div className="text-center mb-6">
            {errorDetails.reason === 'account_suspended' ? (
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
            ) : errorDetails.reason === 'email_not_verified' ? (
              <div className="text-yellow-500 text-6xl mb-4">📧</div>
            ) : (
              <div className="text-red-500 text-6xl mb-4">🚫</div>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            {errorDetails.reason === 'account_suspended' 
              ? '계정 정지' 
              : errorDetails.reason === 'email_not_verified'
              ? '이메일 인증 필요'
              : '접근 권한 없음'
            }
          </h1>

          {/* 메시지 */}
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              {errorDetails.message}
            </p>
            
            {/* 현재 사용자 정보 표시 */}
            {user && (
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">현재 계정 정보:</div>
                  <div>이메일: {user.email}</div>
                  <div>역할: {user.role || '설정되지 않음'}</div>
                  <div>테넌트: {user.tenant_id || '설정되지 않음'}</div>
                </div>
              </div>
            )}

            {/* 요청한 경로 표시 */}
            {errorDetails.path && (
              <div className="text-sm text-gray-500 mt-2">
                요청한 페이지: <code className="bg-gray-100 px-1 rounded">{errorDetails.path}</code>
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {/* 추천 페이지로 이동 */}
            <Link
              href={getRecommendedPage()}
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors text-center font-medium"
            >
              {role ? '홈으로 돌아가기' : '로그인 페이지로'}
            </Link>

            {/* 이메일 인증이 필요한 경우 */}
            {errorDetails.reason === 'email_not_verified' && (
              <button
                onClick={() => {
                  // 이메일 재전송 기능 (구현 필요)
                  alert('이메일 재전송 기능을 구현해야 합니다.')
                }}
                className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors text-center font-medium"
              >
                인증 이메일 재전송
              </button>
            )}

            {/* 뒤로 가기 */}
            <button
              onClick={() => router.back()}
              className="block w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors text-center font-medium"
            >
              이전 페이지로
            </button>

            {/* 다시 로그인 */}
            {user && (
              <Link
                href="/auth/login"
                className="block w-full bg-gray-500 text-white py-3 px-4 rounded-md hover:bg-gray-600 transition-colors text-center font-medium"
              >
                다시 로그인
              </Link>
            )}
          </div>

          {/* 도움말 링크 */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-2">
              문제가 지속되면 관리자에게 문의하세요
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <Link
                href="/help"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                도움말
              </Link>
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                문의하기
              </Link>
            </div>
          </div>
        </div>

        {/* 개발 환경에서만 디버그 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              개발 환경 디버그 정보
            </h3>
            <pre className="text-xs text-yellow-700 overflow-auto">
              {JSON.stringify({
                reason: errorDetails.reason,
                path: errorDetails.path,
                userRole: role,
                userId: user?.id,
                tenantId: user?.tenant_id
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}