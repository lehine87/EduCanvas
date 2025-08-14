'use client'

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import type { RLSTestResult } from '@/types/utilityTypes'
import { PermissionGuard, StudentWriteGuard, AdminOnly } from '@/components/auth'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/auth/supabaseAuth'

// 테스트용 컴포넌트들
function AuthTestPanel() {
  const { user, tenantId, loading, signIn, signOut, hasPermission, availableTenants, switchTenant, isDeveloper } = useAuth()
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('admin123456')
  const [error, setError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError('')
    
    try {
      // 새로운 인증 플로우: 이메일/패스워드만으로 로그인, 테넌트는 자동 감지
      const result = await signIn(email, password) // tenantId 파라미터 제거!
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">인증 상태 확인 중...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">인증 시스템 테스트</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          
          <div className="bg-blue-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">🔑 테스트 계정</h3>
            <div className="text-xs text-blue-600 space-y-1">
              <div><strong>관리자:</strong> admin@test.com / admin123456</div>
              <div><strong>강사:</strong> instructor@test.com / instructor123456</div>
              <div><strong>스태프:</strong> staff@test.com / staff123456</div>
            </div>
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isSigningIn ? '로그인 중...' : '로그인'}
          </button>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900">테스트용 계정 정보</h3>
          <div className="mt-2 text-xs text-gray-600">
            <p>※ 실제 Supabase 설정이 필요합니다</p>
            <p>• 데이터베이스 연결 확인</p>
            <p>• 테스트 사용자 생성</p>
            <p>• RLS 정책 적용</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">인증 상태</h2>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            로그아웃
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">사용자 정보</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">이메일:</span> {user.email}</p>
              <p><span className="font-medium">사용자 ID:</span> {user.id}</p>
              <p><span className="font-medium">역할:</span> {user.role || 'N/A'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">테넌트 정보</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">현재 테넌트:</span> {tenantId}</p>
              <p><span className="font-medium">개발자 모드:</span> {isDeveloper() ? '✅ 활성화' : '❌ 비활성화'}</p>
              <p><span className="font-medium">접근 가능한 테넌트:</span> {availableTenants.length}개</p>
              
              {availableTenants.length > 1 && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">테넌트 변경:</label>
                  <select
                    value={tenantId || ''}
                    onChange={(e) => switchTenant(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    {availableTenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <RLSTestPanel />
      <PermissionTestPanel />
    </div>
  )
}

function RLSTestPanel() {
  const { user, tenantId } = useAuth()
  const [rlsResults, setRlsResults] = useState<Record<string, RLSTestResult>>({})
  const [testing, setTesting] = useState(false)
  
  const testRLSPolicies = async () => {
    setTesting(true)
    
    const tests = [
      {
        name: '테넌트 데이터 조회',
        query: async () => await supabase.from('tenants').select('*'),
      },
      {
        name: '학생 데이터 조회', 
        query: async () => await supabase.from('students').select('*').limit(5),
      },
      {
        name: '클래스 데이터 조회',
        query: async () => await supabase.from('classes').select('*').limit(5),
      },
      {
        name: '테넌트 사용자 조회',
        query: async () => await supabase.from('tenant_users').select('*').limit(5),
      },
      {
        name: '다른 테넌트 접근 시도',
        query: async () => {
          // 현재 테넌트가 아닌 다른 테넌트 데이터 조회 시도
          return await supabase
            .from('students')
            .select('*')
            .neq('tenant_id', tenantId)
            .limit(1)
        },
      }
    ]
    
    const results: Record<string, unknown> = {}
    
    for (const test of tests) {
      try {
        const result = await test.query()
        results[test.name] = {
          success: !result.error,
          error: result.error?.message,
          count: result.data?.length || 0,
          data: result.data
        }
      } catch (err) {
        results[test.name] = {
          success: false,
          error: String(err),
          count: 0
        }
      }
    }
    
    setRlsResults(results)
    setTesting(false)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">🔒 RLS 정책 테스트</h3>
        <button
          onClick={testRLSPolicies}
          disabled={testing}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {testing ? '테스트 중...' : 'RLS 테스트 실행'}
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>RLS 정책 상태:</strong> 
          {Object.keys(rlsResults).length === 0 ? 
            ' 테스트 버튼을 클릭하여 RLS 정책이 제대로 적용되었는지 확인하세요.' : 
            ' 테스트 완료! 아래 결과를 확인하세요.'
          }
        </p>
      </div>
      
      {Object.keys(rlsResults).length > 0 && (
        <div className="space-y-3">
          {Object.entries(rlsResults).map(([testName, result]: [string, unknown]) => (
            <div key={testName} className="border rounded-lg p-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{testName}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result?.success ? '✅ 성공' : '❌ 실패'}
                </span>
              </div>
              
              <div className="mt-2 text-sm">
                <p><strong>조회된 레코드 수:</strong> {result?.count}</p>
                {result?.error && (
                  <p className="text-red-600"><strong>오류:</strong> {result?.error}</p>
                )}
                
                {testName === '다른 테넌트 접근 시도' && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                    <p className="text-xs text-yellow-800">
                      📋 <strong>예상 결과:</strong> RLS 정책이 제대로 작동한다면 이 테스트는 0개의 레코드를 반환하거나 실패해야 합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <h4 className="font-medium text-green-800 mb-2">🎯 RLS 정책 평가</h4>
            <div className="text-sm text-green-700">
              {rlsResults['다른 테넌트 접근 시도']?.count === 0 ? 
                '✅ 테넌트 격리가 제대로 작동하고 있습니다!' :
                '⚠️  다른 테넌트 데이터에 접근이 가능합니다. RLS 정책을 확인해주세요.'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PermissionTestPanel() {
  const { hasPermission } = useAuth()
  const { 
    canRead, 
    canWrite, 
    canDelete, 
    isOwner, 
    isAdmin, 
    isInstructor, 
    role,
    roleLevel,
    resources 
  } = usePermissions()

  const testPermissions = [
    { resource: 'students', action: 'read' },
    { resource: 'students', action: 'write' },
    { resource: 'students', action: 'delete' },
    { resource: 'classes', action: 'read' },
    { resource: 'classes', action: 'write' },
    { resource: 'videos', action: 'read' },
    { resource: 'videos', action: 'write' },
    { resource: 'payments', action: 'read' },
    { resource: 'payments', action: 'write' },
    { resource: 'settings', action: 'read' },
    { resource: 'users', action: 'admin' }
  ]

  return (
    <div className="space-y-6">
      {/* 역할 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">역할 및 권한 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">역할 정보</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">현재 역할:</span> {role || 'N/A'}</p>
              <p><span className="font-medium">역할 레벨:</span> {roleLevel}</p>
              <p><span className="font-medium">Owner:</span> {isOwner ? '✅' : '❌'}</p>
              <p><span className="font-medium">Admin:</span> {isAdmin ? '✅' : '❌'}</p>
              <p><span className="font-medium">Instructor:</span> {isInstructor ? '✅' : '❌'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">기본 권한</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">읽기:</span> {canRead('students') ? '✅' : '❌'}</p>
              <p><span className="font-medium">쓰기:</span> {canWrite('students') ? '✅' : '❌'}</p>
              <p><span className="font-medium">삭제:</span> {canDelete('students') ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 권한 테스트 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">상세 권한 테스트</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testPermissions.map(({ resource, action }) => (
            <div 
              key={`${resource}-${action}`} 
              className={`p-3 rounded border ${
                hasPermission(resource, action) 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {resource}.{action}
                </span>
                <span className="text-lg">
                  {hasPermission(resource, action) ? '✅' : '❌'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 리소스별 권한 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">리소스별 권한 현황</h3>
        
        <div className="space-y-4">
          {Object.entries(resources).map(([resource, permissions]) => (
            <div key={resource} className="border rounded-lg p-4">
              <h4 className="font-semibold capitalize mb-2">{resource}</h4>
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded ${permissions.canRead ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  Read {permissions.canRead ? '✅' : '❌'}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${permissions.canWrite ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                  Write {permissions.canWrite ? '✅' : '❌'}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${permissions.canDelete ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                  Delete {permissions.canDelete ? '✅' : '❌'}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${permissions.canAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'}`}>
                  Admin {permissions.canAdmin ? '✅' : '❌'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 컴포넌트 가드 테스트 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">컴포넌트 가드 테스트</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Student Write Guard</h4>
            <StudentWriteGuard fallback={<p className="text-red-600">❌ 학생 쓰기 권한이 없습니다.</p>}>
              <p className="text-green-600">✅ 학생 쓰기 권한이 있습니다!</p>
              <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                학생 추가 버튼
              </button>
            </StudentWriteGuard>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Admin Only</h4>
            <AdminOnly fallback={<p className="text-red-600">❌ 관리자 권한이 없습니다.</p>}>
              <p className="text-green-600">✅ 관리자 권한이 있습니다!</p>
              <button className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm">
                관리자 전용 버튼
              </button>
            </AdminOnly>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Permission Guard (결제 읽기)</h4>
            <PermissionGuard 
              resource="payments" 
              action="read"
              fallback={<p className="text-red-600">❌ 결제 정보 읽기 권한이 없습니다.</p>}
            >
              <p className="text-green-600">✅ 결제 정보를 볼 수 있습니다!</p>
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                💰 결제 내역: 1,000,000원
              </div>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">T-005 인증 시스템 테스트</h1>
          <p className="mt-2 text-gray-600">멀티테넌트 RBAC 인증 시스템 실시간 테스트</p>
        </div>
        
        <AuthProvider>
          <AuthTestPanel />
        </AuthProvider>
      </div>
    </div>
  )
}