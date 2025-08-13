'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabaseTokensPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    
    // 세션 정보 확인
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📦 Supabase Session:', { session, error })
      setTokenInfo({
        hasSession: !!session,
        accessToken: session?.access_token?.substring(0, 50) + '...',
        refreshToken: session?.refresh_token?.substring(0, 50) + '...',
        tokenType: session?.token_type,
        expiresAt: session?.expires_at,
        user: {
          id: session?.user?.id,
          email: session?.user?.email
        }
      })
    })

    // 쿠키 정보 확인
    setCookieInfo(document.cookie)
    
    // 인증 상태 변화 모니터링
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth State Change:', { event, session })
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase 토큰 테스트</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">세션 정보</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">브라우저 쿠키</h2>
          <div className="text-sm break-all">
            {cookieInfo || '쿠키 없음'}
          </div>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-semibold mb-2">테스트 방법</h2>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>로그인 페이지에서 로그인 시도</li>
            <li>이 페이지로 돌아와서 토큰 정보 확인</li>
            <li>브라우저 개발자 도구 &gt; Application &gt; Cookies에서도 확인</li>
            <li>Network 탭에서 로그인 요청/응답 헤더 확인</li>
          </ol>
        </div>
      </div>
    </div>
  )
}