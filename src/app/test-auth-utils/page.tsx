'use client'

import { useEffect, useState } from 'react'
import { useAuth, useAuthStore } from '@/store/useAuthStore'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge } from '@/components/ui'

export default function AuthUtilsTestPage() {
  const [testResults, setTestResults] = useState<Record<string, unknown>>({})
  const [testLogs, setTestLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const auth = useAuth()
  const { 
    user, 
    profile, 
    session, 
    loading, 
    initialized 
  } = useAuthStore()

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = {
      info: '💡',
      success: '✅', 
      error: '❌',
      warning: '⚠️'
    }[type]
    setTestLogs(prev => [...prev, `[${timestamp}] ${emoji} ${message}`])
  }

  const runTest = async (testName: string, testFn: () => unknown) => {
    addLog(`🧪 테스트 시작: ${testName}`)
    try {
      const result = await Promise.resolve(testFn())
      setTestResults(prev => ({ ...prev, [testName]: result }))
      addLog(`결과: ${JSON.stringify(result, null, 2)}`, 'success')
      return result
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: { error: String(error) } }))
      addLog(`예외 발생: ${error}`, 'error')
      return false
    }
  }

  // 1. 기본 인증 상태 테스트
  const testBasicAuthState = () => {
    addLog('🔍 기본 인증 상태 검사 중...', 'info')
    
    const results = {
      isAuthenticated: auth.isAuthenticated,
      isActive: auth.isActive,
      isAdmin: auth.isAdmin,
      isSystemAdmin: auth.isSystemAdmin,
      isInstructor: auth.isInstructor,
      isStaff: auth.isStaff,
      isViewer: auth.isViewer,
      isManager: auth.isManager,
      hasUser: !!user,
      hasProfile: !!profile,
      hasSession: !!session,
      userEmail: user?.email,
      profileRole: profile?.role,
      profileStatus: profile?.status,
      tenantId: profile?.tenant_id
    }
    
    addLog(`현재 사용자: ${user?.email || '없음'}`)
    addLog(`프로필 역할: ${profile?.role || '없음'}`)
    addLog(`프로필 상태: ${profile?.status || '없음'}`)
    addLog(`테넌트 ID: ${profile?.tenant_id || '없음'}`)
    
    return results
  }

  // 2. hasRole 헬퍼 함수 테스트
  const testHasRoleFunction = () => {
    addLog('🎭 hasRole 헬퍼 함수 테스트 중...', 'info')
    
    const testCases = [
      'admin',
      'instructor', 
      'staff',
      'viewer',
      'system_admin',
      ['admin', 'instructor'], // 배열 테스트
      ['staff', 'viewer'], // 배열 테스트
      'nonexistent_role' // 존재하지 않는 역할
    ]
    
    const results: Record<string, boolean> = {}
    
    testCases.forEach(role => {
      const roleKey = Array.isArray(role) ? role.join(',') : role
      const hasRole = auth.hasRole(role)
      results[roleKey] = hasRole
      addLog(`hasRole(${JSON.stringify(role)}): ${hasRole}`)
    })
    
    return results
  }

  // 3. canAccessTenant 함수 테스트
  const testCanAccessTenant = () => {
    addLog('🏢 canAccessTenant 함수 테스트 중...', 'info')
    
    const currentTenantId = profile?.tenant_id
    const testTenantIds = [
      currentTenantId, // 현재 테넌트
      '00000000-0000-0000-0000-000000000000', // 더미 테넌트 1
      '11111111-1111-1111-1111-111111111111', // 더미 테넌트 2
      null, // null 테스트
      undefined, // undefined 테스트
      '' // 빈 문자열 테스트
    ]
    
    const results: Record<string, boolean> = {}
    
    testTenantIds.forEach(tenantId => {
      const key = tenantId || 'null/undefined/empty'
      const canAccess = auth.canAccessTenant(tenantId as string)
      results[key] = canAccess
      addLog(`canAccessTenant(${tenantId || 'null/undefined/empty'}): ${canAccess}`)
    })
    
    addLog(`현재 사용자 테넌트: ${currentTenantId}`)
    addLog(`시스템 관리자 여부: ${auth.isSystemAdmin}`)
    
    return results
  }

  // 4. 역할 계층 구조 테스트
  const testRoleHierarchy = () => {
    addLog('📊 역할 계층 구조 테스트 중...', 'info')
    
    const currentRole = profile?.role
    const roleHierarchy = {
      system_admin: ['system_admin'],
      admin: ['admin', 'system_admin'],
      instructor: ['instructor', 'admin', 'system_admin'],
      staff: ['staff', 'instructor', 'admin', 'system_admin'],
      viewer: ['viewer', 'staff', 'instructor', 'admin', 'system_admin']
    }
    
    const results = {
      currentRole,
      expectedHierarchy: roleHierarchy[currentRole] || [],
      actualPermissions: {
        isViewer: auth.isViewer,
        isStaff: auth.isStaff,
        isInstructor: auth.isInstructor,
        isAdmin: auth.isAdmin,
        isSystemAdmin: auth.isSystemAdmin,
        isManager: auth.isManager
      }
    }
    
    addLog(`현재 역할: ${currentRole}`)
    addLog(`Manager 권한: ${auth.isManager}`)
    addLog(`Active 상태: ${auth.isActive}`)
    
    return results
  }

  // 5. 경계 조건 및 예외 상황 테스트
  const testEdgeCases = () => {
    addLog('🚨 경계 조건 및 예외 상황 테스트 중...', 'warning')
    
    const results: Record<string, boolean | { error: string }> = {}
    
    // 프로필이 null인 경우를 시뮬레이션하기 위한 테스트
    const tempProfile = profile
    
    // hasRole with invalid inputs
    try {
      const invalidRoleTest = auth.hasRole(null as unknown as string)
      results.hasRoleNull = invalidRoleTest
      addLog(`hasRole(null): ${invalidRoleTest}`)
    } catch (error) {
      results.hasRoleNull = { error: String(error) }
      addLog(`hasRole(null) 예외: ${error}`, 'error')
    }
    
    try {
      const undefinedRoleTest = auth.hasRole(undefined as unknown as string)
      results.hasRoleUndefined = undefinedRoleTest
      addLog(`hasRole(undefined): ${undefinedRoleTest}`)
    } catch (error) {
      results.hasRoleUndefined = { error: String(error) }
      addLog(`hasRole(undefined) 예외: ${error}`, 'error')
    }
    
    // canAccessTenant with invalid inputs
    try {
      const longTenantId = 'a'.repeat(100) // 매우 긴 문자열
      const longTenantTest = auth.canAccessTenant(longTenantId)
      results.canAccessLongTenant = longTenantTest
      addLog(`canAccessTenant(긴 문자열): ${longTenantTest}`)
    } catch (error) {
      results.canAccessLongTenant = { error: String(error) }
      addLog(`canAccessTenant(긴 문자열) 예외: ${error}`, 'error')
    }
    
    return results
  }

  // 6. 성능 테스트
  const testPerformance = () => {
    addLog('⚡ 성능 테스트 중...', 'info')
    
    const iterations = 1000
    const results = {}
    
    // hasRole 성능 테스트
    const hasRoleStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      auth.hasRole('admin')
    }
    const hasRoleEnd = performance.now()
    const hasRoleTime = hasRoleEnd - hasRoleStart
    results.hasRolePerformance = `${hasRoleTime.toFixed(2)}ms for ${iterations} calls`
    
    // canAccessTenant 성능 테스트
    const canAccessStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      auth.canAccessTenant(profile?.tenant_id || '')
    }
    const canAccessEnd = performance.now()
    const canAccessTime = canAccessEnd - canAccessStart
    results.canAccessTenantPerformance = `${canAccessTime.toFixed(2)}ms for ${iterations} calls`
    
    // 기본 상태 접근 성능 테스트
    const basicStateStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      const _ = auth.isAuthenticated && auth.isActive && auth.isAdmin
    }
    const basicStateEnd = performance.now()
    const basicStateTime = basicStateEnd - basicStateStart
    results.basicStatePerformance = `${basicStateTime.toFixed(2)}ms for ${iterations} calls`
    
    addLog(`hasRole 성능: ${results.hasRolePerformance}`)
    addLog(`canAccessTenant 성능: ${results.canAccessTenantPerformance}`)
    addLog(`기본 상태 접근 성능: ${results.basicStatePerformance}`)
    
    return results
  }

  // 전체 테스트 실행
  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults({})
    setTestLogs([])
    
    addLog('🚀 인증 유틸리티 함수 전체 테스트 시작', 'info')
    
    try {
      await runTest('기본 인증 상태', testBasicAuthState)
      await runTest('hasRole 헬퍼 함수', testHasRoleFunction)
      await runTest('canAccessTenant 함수', testCanAccessTenant)
      await runTest('역할 계층 구조', testRoleHierarchy)
      await runTest('경계 조건 테스트', testEdgeCases)
      await runTest('성능 테스트', testPerformance)
      
      addLog('🏁 전체 테스트 완료', 'success')
    } catch (error) {
      addLog(`전체 테스트 실행 중 오류: ${error}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const getTestStatusIcon = (testName: string) => {
    const result = testResults[testName]
    if (result === undefined) return '⏳'
    if (result && typeof result === 'object' && result.error) return '❌'
    return '✅'
  }

  if (!initialized) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 시스템 초기화 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          인증 유틸리티 함수 테스트
        </h1>
        <p className="text-gray-600">
          T-007 useAuth 훅의 헬퍼 함수들을 체계적으로 테스트합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 현재 인증 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 인증 상태</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">사용자:</span> {user?.email || '없음'}</div>
              <div><span className="font-medium">이름:</span> {profile?.name || '없음'}</div>
              <div><span className="font-medium">역할:</span> <Badge variant="info">{profile?.role || '없음'}</Badge></div>
              <div><span className="font-medium">상태:</span> <Badge variant={profile?.status === 'active' ? 'success' : 'warning'}>{profile?.status || '없음'}</Badge></div>
              <div><span className="font-medium">테넌트:</span> {profile?.tenant_id?.slice(0, 8) || '없음'}...</div>
              <div><span className="font-medium">인증됨:</span> {auth.isAuthenticated ? '✅' : '❌'}</div>
              <div><span className="font-medium">활성:</span> {auth.isActive ? '✅' : '❌'}</div>
            </div>
          </CardBody>
        </Card>

        {/* 권한 및 역할 */}
        <Card>
          <CardHeader>
            <CardTitle>권한 및 역할</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">시스템 관리자:</span> {auth.isSystemAdmin ? '✅' : '❌'}</div>
              <div><span className="font-medium">관리자:</span> {auth.isAdmin ? '✅' : '❌'}</div>
              <div><span className="font-medium">강사:</span> {auth.isInstructor ? '✅' : '❌'}</div>
              <div><span className="font-medium">스태프:</span> {auth.isStaff ? '✅' : '❌'}</div>
              <div><span className="font-medium">뷰어:</span> {auth.isViewer ? '✅' : '❌'}</div>
              <div><span className="font-medium">매니저:</span> {auth.isManager ? '✅' : '❌'}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 테스트 결과 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            테스트 결과
            <Button 
              onClick={runAllTests} 
              disabled={isRunning || loading}
              loading={isRunning}
            >
              전체 테스트 실행
            </Button>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              '기본 인증 상태',
              'hasRole 헬퍼 함수', 
              'canAccessTenant 함수',
              '역할 계층 구조',
              '경계 조건 테스트',
              '성능 테스트'
            ].map(testName => (
              <div key={testName} className="flex items-center space-x-2">
                <span className="text-lg">{getTestStatusIcon(testName)}</span>
                <span className="text-sm">{testName}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('기본 인증 상태', testBasicAuthState)}
            >
              기본 상태 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('hasRole 헬퍼 함수', testHasRoleFunction)}
            >
              hasRole 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('canAccessTenant 함수', testCanAccessTenant)}
            >
              테넌트 접근 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('역할 계층 구조', testRoleHierarchy)}
            >
              역할 계층 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('경계 조건 테스트', testEdgeCases)}
            >
              경계 조건 테스트
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => runTest('성능 테스트', testPerformance)}
            >
              성능 테스트
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
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
            {testLogs.length === 0 ? (
              <div className="text-gray-500">테스트를 실행하면 로그가 여기에 표시됩니다...</div>
            ) : (
              testLogs.map((log, index) => (
                <div key={index} className={
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('⚠️') ? 'text-yellow-400' :
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('💡') ? 'text-blue-400' : ''
                }>
                  {log}
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}