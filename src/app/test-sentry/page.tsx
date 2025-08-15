'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { captureError, logMessage, setSentryUser } from '@/instrumentation-client'
import { globalErrorHandler, reportError, getErrorHandlerStats } from '@/lib/errors/globalErrorHandler'
import { useAuthStore } from '@/store/useAuthStore'
import * as Sentry from '@sentry/nextjs'

export default function TestSentryPage() {
  const [handlerStats, setHandlerStats] = useState<{
    totalErrors: number
    queueLength: number
    recentErrors: Array<{
      type: string
      error: { message?: string } | string
      timestamp: number
    }>
  } | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const { profile } = useAuthStore()

  useEffect(() => {
    // 페이지 로드 시 사용자 컨텍스트 설정
    if (profile) {
      setSentryUser({
        id: profile.id,
        role: profile.role || undefined,
        tenant_id: profile.tenant_id || undefined,
      })
    }
  }, [profile])

  const updateStats = () => {
    try {
      const stats = getErrorHandlerStats()
      setHandlerStats(stats)
    } catch (error) {
      console.error('Failed to get error handler stats:', error)
    }
  }

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // 1. 일반 JavaScript 에러 테스트
  const testJavaScriptError = () => {
    try {
      addTestResult('테스트 1: JavaScript 에러 발생')
      throw new Error('이것은 테스트용 JavaScript 에러입니다')
    } catch (error) {
      captureError(error as Error, { testType: 'javascript-error', userAction: 'button-click' })
      addTestResult('✅ JavaScript 에러가 Sentry에 전송됨')
    }
  }

  // 2. 네트워크 에러 테스트
  const testNetworkError = async () => {
    try {
      addTestResult('테스트 2: 네트워크 에러 발생')
      await fetch('https://nonexistent-domain-for-testing.com/api/test')
    } catch (error) {
      captureError(error as Error, { testType: 'network-error', endpoint: 'nonexistent-domain' })
      addTestResult('✅ 네트워크 에러가 Sentry에 전송됨')
    }
  }

  // 3. Promise rejection 테스트
  const testPromiseRejection = () => {
    addTestResult('테스트 3: Promise rejection 발생')
    Promise.reject(new Error('이것은 테스트용 Promise rejection입니다'))
      .catch(() => {
        // 이미 글로벌 핸들러가 캐치함
        addTestResult('✅ Promise rejection이 글로벌 핸들러에 의해 캐치됨')
      })
  }

  // 4. 사용자 정의 에러 메시지 테스트
  const testCustomMessage = () => {
    addTestResult('테스트 4: 사용자 정의 메시지 전송')
    logMessage('테스트용 정보 메시지', 'info')
    logMessage('테스트용 경고 메시지', 'warning')
    logMessage('테스트용 에러 메시지', 'error')
    addTestResult('✅ 사용자 정의 메시지들이 Sentry에 전송됨')
  }

  // 5. 컨텍스트 테스트
  const testWithContext = () => {
    addTestResult('테스트 5: 컨텍스트와 함께 에러 전송')
    Sentry.withScope((scope) => {
      scope.setTag('test-scenario', 'context-test')
      scope.setLevel('error')
      scope.setContext('testContext', {
        component: 'TestSentryPage',
        action: 'testWithContext',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
      
      const testError = new Error('컨텍스트가 포함된 테스트 에러')
      Sentry.captureException(testError)
      addTestResult('✅ 컨텍스트가 포함된 에러가 Sentry에 전송됨')
    })
  }

  // 6. 글로벌 에러 핸들러 수동 테스트
  const testGlobalHandler = () => {
    addTestResult('테스트 6: 글로벌 에러 핸들러 수동 테스트')
    reportError(new Error('글로벌 핸들러 테스트 에러'), { 
      manualTest: true,
      component: 'TestSentryPage'
    })
    addTestResult('✅ 글로벌 에러 핸들러를 통해 에러가 전송됨')
  }

  // 7. 모든 테스트 실행
  const runAllTests = async () => {
    setTestResults([])
    addTestResult('🚀 모든 Sentry 테스트 시작')
    
    testJavaScriptError()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testNetworkError()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    testPromiseRejection()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    testCustomMessage()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    testWithContext()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    testGlobalHandler()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    updateStats()
    addTestResult('🎉 모든 테스트 완료! Sentry 대시보드를 확인하세요.')
  }

  useEffect(() => {
    updateStats()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sentry 통합 테스트</h1>
        
        {/* Sentry 설정 상태 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sentry 설정 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>DSN 설정:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ 설정됨' : '❌ 설정되지 않음'}
              </div>
              <div>
                <strong>환경:</strong> {process.env.NODE_ENV}
              </div>
              <div>
                <strong>사용자 ID:</strong> {profile?.id || '미로그인'}
              </div>
              <div>
                <strong>사용자 역할:</strong> {profile?.role || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 글로벌 에러 핸들러 상태 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>글로벌 에러 핸들러 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={updateStats} className="mb-4">상태 새로고침</Button>
            {handlerStats && (
              <div className="space-y-2 text-sm">
                <div><strong>초기화 상태:</strong> {handlerStats.isInitialized ? '✅ 초기화됨' : '❌ 초기화되지 않음'}</div>
                <div><strong>에러 큐 길이:</strong> {handlerStats.queueLength}</div>
                <div><strong>최근 에러들:</strong></div>
                {handlerStats.recentErrors.length > 0 ? (
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {handlerStats.recentErrors.map((error, index: number) => (
                      <li key={index} className="text-xs">
                        {error.type}: {error.error.message || error.error} 
                        <span className="text-gray-500"> ({new Date(error.timestamp).toLocaleTimeString()})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 ml-4">에러 없음</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 테스트 버튼들 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>에러 테스트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Button onClick={testJavaScriptError} variant="outline">
                1. JS 에러
              </Button>
              <Button onClick={testNetworkError} variant="outline">
                2. 네트워크 에러
              </Button>
              <Button onClick={testPromiseRejection} variant="outline">
                3. Promise Rejection
              </Button>
              <Button onClick={testCustomMessage} variant="outline">
                4. 커스텀 메시지
              </Button>
              <Button onClick={testWithContext} variant="outline">
                5. 컨텍스트 테스트
              </Button>
              <Button onClick={testGlobalHandler} variant="outline">
                6. 글로벌 핸들러
              </Button>
            </div>
            <Button onClick={runAllTests} className="w-full">
              🚀 모든 테스트 실행
            </Button>
          </CardContent>
        </Card>

        {/* 테스트 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm mb-1 font-mono">
                    {result}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">테스트를 실행하면 결과가 여기에 표시됩니다.</div>
            )}
          </CardContent>
        </Card>

        {/* 사용 안내 */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Sentry 대시보드 확인 방법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>1. <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sentry.io</a>에 로그인</div>
            <div>2. EduCanvas 프로젝트로 이동</div>
            <div>3. Issues 탭에서 방금 전송된 테스트 에러들 확인</div>
            <div>4. Performance 탭에서 성능 모니터링 데이터 확인</div>
            <div>5. Session Replay에서 사용자 행동 재현 확인</div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <strong>💡 참고:</strong> 에러가 Sentry에 나타나는데 1-2분 정도 걸릴 수 있습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}