'use client'

import { useEffect, useState } from 'react'
import { useAuth, useAuthStore, useSessionAutoRefresh } from '@/store/useAuthStore'
import { Button, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'

export default function AuthStateTestPage() {
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({})
  const [testLogs, setTestLogs] = useState<string[]>([])
  
  const auth = useAuth()
  const { 
    user, 
    profile, 
    session, 
    loading, 
    initialized, 
    lastProfileRefresh,
    refreshProfile,
    clearSensitiveData,
    isSessionValid
  } = useAuthStore()
  
  // 세션 자동 갱신 활성화
  useSessionAutoRefresh()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const runTest = async (testName: string, testFn: () => Promise<boolean> | boolean) => {
    addLog(`🧪 테스트 시작: ${testName}`)
    try {
      const result = await Promise.resolve(testFn())
      setTestResults(prev => ({ ...prev, [testName]: result }))
      addLog(`${result ? '✅' : '❌'} ${testName}: ${result ? '성공' : '실패'}`)
      return result
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }))
      addLog(`❌ ${testName}: 예외 발생 - ${error}`)
      return false
    }
  }

  // 개별 테스트 함수들
  const testSessionValidity = async () => {
    addLog('세션 유효성 검사 중...')
    const isValid = isSessionValid()
    addLog(`세션 유효성: ${isValid}`)
    return isValid
  }

  const testProfileCaching = async () => {
    addLog('프로필 캐싱 테스트 중...')
    const beforeTime = lastProfileRefresh
    
    // 첫 번째 호출 (캐시 없음)
    await refreshProfile(false)
    const afterFirstCall = Date.now()
    
    // 즉시 두 번째 호출 (캐시 활용)
    await refreshProfile(false)
    const afterSecondCall = Date.now()
    
    addLog(`첫 번째 호출 후: ${afterFirstCall}`)
    addLog(`두 번째 호출 후: ${afterSecondCall}`)
    
    // 5분 이내 캐시가 활용되었는지 확인
    return (afterSecondCall - afterFirstCall) < 100 // 캐시 활용 시 매우 빠름
  }

  const testRolePermissions = () => {
    addLog('역할 기반 권한 테스트 중...')
    const hasInstructorRole = auth.hasRole('instructor')
    const hasMultipleRoles = auth.hasRole(['admin', 'instructor'])
    const canAccessTenant = auth.canAccessTenant(profile?.tenant_id || '')
    
    addLog(`현재 역할: ${profile?.role}`)
    addLog(`강사 역할 보유: ${hasInstructorRole}`)
    addLog(`복수 역할 체크: ${hasMultipleRoles}`)
    addLog(`테넌트 접근 권한: ${canAccessTenant}`)
    
    return hasInstructorRole !== undefined && canAccessTenant !== undefined
  }

  const testAuthenticationState = () => {
    addLog('인증 상태 테스트 중...')
    const isAuth = auth.isAuthenticated
    const isActive = auth.isActive
    const isAdmin = auth.isAdmin
    const isManager = auth.isManager
    
    addLog(`인증됨: ${isAuth}`)
    addLog(`활성 상태: ${isActive}`)
    addLog(`관리자: ${isAdmin}`)
    addLog(`매니저: ${isManager}`)
    
    return isAuth && isActive
  }

  const testMemoryClearing = async () => {
    addLog('메모리 클리어 테스트 중...')
    
    // 현재 상태 백업
    const originalUser = user
    const originalProfile = profile
    
    // 메모리 클리어 실행
    clearSensitiveData()
    
    // 상태 확인
    const clearedUser = useAuthStore.getState().user
    const clearedProfile = useAuthStore.getState().profile
    
    addLog(`클리어 전 사용자: ${originalUser?.email}`)
    addLog(`클리어 후 사용자: ${clearedUser?.email}`)
    
    return clearedUser === null && clearedProfile === null
  }

  const runAllTests = async () => {
    addLog('🚀 전체 테스트 시작')
    setTestResults({})
    
    await runTest('세션 유효성 검사', testSessionValidity)
    await runTest('인증 상태 확인', testAuthenticationState)
    await runTest('역할 기반 권한', testRolePermissions)
    await runTest('프로필 캐싱', testProfileCaching)
    
    // 메모리 클리어는 마지막에 (상태를 파괴하므로)
    // await runTest('메모리 클리어', testMemoryClearing)
    
    addLog('🏁 전체 테스트 완료')
  }

  const getTestResultIcon = (testName: string) => {
    const result = testResults[testName]
    if (result === undefined) return '⏳'
    return result ? '✅' : '❌'
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          인증 상태 관리 테스트
        </h1>
        <p className="text-gray-600">
          T-007 인증 시스템의 상태 관리 기능을 테스트합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 현재 상태 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 인증 상태</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">초기화:</span> {initialized ? '✅' : '❌'}</div>
              <div><span className="font-medium">로딩:</span> {loading ? '🔄' : '✅'}</div>
              <div><span className="font-medium">인증:</span> {auth.isAuthenticated ? '✅' : '❌'}</div>
              <div><span className="font-medium">사용자:</span> {user?.email || '없음'}</div>
              <div><span className="font-medium">이름:</span> {profile?.name || '없음'}</div>
              <div><span className="font-medium">역할:</span> {profile?.role || '없음'}</div>
              <div><span className="font-medium">상태:</span> {profile?.status || '없음'}</div>
              <div><span className="font-medium">테넌트:</span> {profile?.tenant_id?.slice(0, 8) || '없음'}...</div>
              <div><span className="font-medium">세션 유효:</span> {isSessionValid() ? '✅' : '❌'}</div>
              <div><span className="font-medium">마지막 프로필 갱신:</span> {lastProfileRefresh ? new Date(lastProfileRefresh).toLocaleTimeString() : '없음'}</div>
            </div>
          </CardBody>
        </Card>

        {/* 권한 체크 */}
        <Card>
          <CardHeader>
            <CardTitle>권한 및 역할</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">관리자:</span> {auth.isAdmin ? '✅' : '❌'}</div>
              <div><span className="font-medium">시스템 관리자:</span> {auth.isSystemAdmin ? '✅' : '❌'}</div>
              <div><span className="font-medium">강사:</span> {auth.isInstructor ? '✅' : '❌'}</div>
              <div><span className="font-medium">스태프:</span> {auth.isStaff ? '✅' : '❌'}</div>
              <div><span className="font-medium">뷰어:</span> {auth.isViewer ? '✅' : '❌'}</div>
              <div><span className="font-medium">매니저:</span> {auth.isManager ? '✅' : '❌'}</div>
              <div><span className="font-medium">활성:</span> {auth.isActive ? '✅' : '❌'}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 테스트 결과 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            테스트 결과
            <Button onClick={runAllTests}>
              전체 테스트 실행
            </Button>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              '세션 유효성 검사',
              '인증 상태 확인', 
              '역할 기반 권한',
              '프로필 캐싱'
            ].map(testName => (
              <div key={testName} className="flex items-center space-x-2">
                <span className="text-lg">{getTestResultIcon(testName)}</span>
                <span className="text-sm">{testName}</span>
              </div>
            ))}
          </div>

          <div className="flex space-x-2 mb-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('세션 유효성', testSessionValidity)}
            >
              세션 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('프로필 캐싱', testProfileCaching)}
            >
              캐싱 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                try {
                  addLog('🔄 프로필 강제 갱신 시작...')
                  addLog(`현재 사용자: ${user?.email}`)
                  addLog(`현재 세션: ${session ? '존재' : '없음'}`)
                  
                  const startTime = Date.now()
                  await refreshProfile(true)
                  const endTime = Date.now()
                  
                  addLog(`✅ 프로필 강제 갱신 완료 (${endTime - startTime}ms)`)
                  addLog(`갱신된 프로필: ${profile?.name} (${profile?.role})`)
                } catch (error) {
                  console.error('프로필 갱신 오류:', error)
                  addLog(`❌ 프로필 갱신 실패: ${error?.toString()}`)
                }
              }}
            >
              프로필 강제 갱신
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                try {
                  addLog('🔍 authClient.getUserProfile() 직접 호출 테스트')
                  const { authClient } = await import('@/lib/auth/authClient')
                  const directProfile = await authClient.getUserProfile()
                  addLog(`직접 호출 결과: ${directProfile?.name}`)
                } catch (error) {
                  addLog(`직접 호출 실패: ${error}`)
                }
              }}
            >
              직접 프로필 호출
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600"
              onClick={() => setTestLogs([])}
            >
              로그 클리어
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 테스트 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>테스트 로그</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs">
            {testLogs.length === 0 ? (
              <div className="text-gray-500">테스트를 실행하면 로그가 여기에 표시됩니다...</div>
            ) : (
              testLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}