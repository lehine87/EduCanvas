'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/auth/supabaseAuth'

export default function DebugDataPage() {
  const [dataInfo, setDataInfo] = useState({
    tenants: { count: 0, data: [] },
    students: { count: 0, data: [] },
    classes: { count: 0, data: [] },
    tenant_users: { count: 0, data: [] }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkData()
  }, [])

  const checkData = async () => {
    setLoading(true)
    
    try {
      // 각 테이블의 데이터 개수와 샘플 확인
      const [tenantsResult, studentsResult, classesResult, tenantUsersResult] = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('students').select('*').limit(10),
        supabase.from('classes').select('*').limit(10),
        supabase.from('tenant_users').select('*').limit(10)
      ])

      setDataInfo({
        tenants: {
          count: tenantsResult.data?.length || 0,
          data: tenantsResult.data || [],
          error: tenantsResult.error?.message
        },
        students: {
          count: studentsResult.data?.length || 0,
          data: studentsResult.data || [],
          error: studentsResult.error?.message
        },
        classes: {
          count: classesResult.data?.length || 0,
          data: classesResult.data || [],
          error: classesResult.error?.message
        },
        tenant_users: {
          count: tenantUsersResult.data?.length || 0,
          data: tenantUsersResult.data || [],
          error: tenantUsersResult.error?.message
        }
      })
    } catch (error) {
      console.error('Data check error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">데이터베이스 상태 확인 중...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🔍 데이터베이스 상태 확인</h1>
          <button
            onClick={checkData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(dataInfo).map(([tableName, info]) => (
            <div key={tableName} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold capitalize">{tableName}</h2>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  info.count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {info.count}건
                </span>
              </div>

              {info.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm">
                    <strong>오류:</strong> {info.error}
                  </p>
                </div>
              )}

              {info.count > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">샘플 데이터:</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {info.data.slice(0, 3).map((item, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-mono">
                          {tableName === 'tenants' && (
                            <div>
                              <span className="font-semibold">ID:</span> {item.id}<br/>
                              <span className="font-semibold">Name:</span> {item.name}<br/>
                              <span className="font-semibold">Slug:</span> {item.slug}
                            </div>
                          )}
                          {tableName === 'students' && (
                            <div>
                              <span className="font-semibold">ID:</span> {item.id}<br/>
                              <span className="font-semibold">이름:</span> {item.name}<br/>
                              <span className="font-semibold">테넌트:</span> {item.tenant_id}
                            </div>
                          )}
                          {tableName === 'classes' && (
                            <div>
                              <span className="font-semibold">ID:</span> {item.id}<br/>
                              <span className="font-semibold">이름:</span> {item.name}<br/>
                              <span className="font-semibold">테넌트:</span> {item.tenant_id}
                            </div>
                          )}
                          {tableName === 'tenant_users' && (
                            <div>
                              <span className="font-semibold">사용자 ID:</span> {item.user_id}<br/>
                              <span className="font-semibold">테넌트 ID:</span> {item.tenant_id}<br/>
                              <span className="font-semibold">역할:</span> {item.role}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  데이터가 없습니다. 테스트 데이터를 추가해야 할 수도 있습니다.
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">🎯 분석 결과</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            {dataInfo.students.count === 0 && dataInfo.classes.count === 0 ? (
              <p>✅ <strong>정상:</strong> instructor/staff 계정이 학생/클래스 데이터를 0건 조회하는 것은 테스트 데이터가 없기 때문입니다.</p>
            ) : (
              <p>⚠️ <strong>확인 필요:</strong> 데이터가 존재하지만 instructor/staff가 접근할 수 없다면 RLS 정책을 점검해야 합니다.</p>
            )}
            
            {dataInfo.tenants.count > 0 && (
              <p>✅ <strong>테넌트 데이터:</strong> {dataInfo.tenants.count}개 테넌트가 존재합니다.</p>
            )}
            
            {dataInfo.tenant_users.count > 0 && (
              <p>✅ <strong>사용자 권한:</strong> {dataInfo.tenant_users.count}개의 사용자-테넌트 관계가 설정되어 있습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}