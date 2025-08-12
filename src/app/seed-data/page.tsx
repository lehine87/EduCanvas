'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/auth/supabaseAuth'

export default function SeedDataPage() {
  const [tenants, setTenants] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [results, setResults] = useState<unknown[]>([])

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase.from('tenants').select('*')
      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = async () => {
    setSeeding(true)
    setResults([])
    
    try {
      for (const tenant of tenants) {
        const tenantData = tenant as { name: string; id: string; slug: string }
        const tenantResults = {
          tenantName: tenantData.name,
          students: { success: 0, errors: [] as string[] },
          classes: { success: 0, errors: [] as string[] },
          instructors: { success: 0, errors: [] as string[] }
        }

        // 1. 샘플 학생 5명 생성
        for (let i = 1; i <= 5; i++) {
          try {
            const { error } = await supabase.from('students').insert({
              tenant_id: tenantData.id,
              name: `테스트학생${i}_${tenantData.name}`,
              phone: `010-1234-${String(i).padStart(4, '0')}`,
              birth_date: `200${i}-01-15`,
              gender: i % 2 === 0 ? 'female' : 'male',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
            if (error) throw error
            tenantResults.students.success++
          } catch (error) {
            tenantResults.students.errors.push(`학생${i}: ${error.message}`)
          }
        }

        // 2. 샘플 클래스 2개 생성
        for (let i = 1; i <= 2; i++) {
          try {
            const { error } = await supabase.from('classes').insert({
              tenant_id: tenantData.id,
              name: `테스트클래스${i}_${tenantData.name}`,
              description: `${tenantData.name}의 테스트용 클래스 ${i}번`,
              status: 'active',
              max_students: 10,
              current_students: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
            if (error) throw error
            tenantResults.classes.success++
          } catch (error) {
            tenantResults.classes.errors.push(`클래스${i}: ${error.message}`)
          }
        }

        // 3. 샘플 강사 2명 생성 (instructors 테이블에 직접 추가)
        for (let i = 1; i <= 2; i++) {
          try {
            const { error } = await supabase.from('instructors').insert({
              tenant_id: tenantData.id,
              name: `테스트강사${i}_${tenantData.name}`,
              phone: `010-9999-${String(i).padStart(4, '0')}`,
              email: `instructor${i}@${tenantData.slug}.test.com`,
              status: 'active',
              hire_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
            if (error) throw error
            tenantResults.instructors.success++
          } catch (error) {
            tenantResults.instructors.errors.push(`강사${i}: ${error.message}`)
          }
        }

        setResults(prev => [...prev, tenantResults])
      }
    } catch (error) {
      console.error('Seeding error:', error)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">테넌트 로딩 중...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🌱 테스트 데이터 시드 생성</h1>
          <button
            onClick={generateSampleData}
            disabled={seeding || tenants.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {seeding ? '생성 중...' : '샘플 데이터 생성'}
          </button>
        </div>

        {/* 테넌트 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📋 생성 대상 테넌트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map(tenant => {
              const tenantData = tenant as { name: string; id: string; slug: string }
              return (
              <div key={tenantData.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{tenantData.name}</h3>
                <p className="text-sm text-gray-600">Slug: {tenantData.slug}</p>
                <div className="mt-2 text-sm">
                  <div className="text-green-600">✅ 학생 5명</div>
                  <div className="text-blue-600">✅ 클래스 2개</div>
                  <div className="text-purple-600">✅ 강사 2명</div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* 생성 결과 */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📊 생성 결과</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3">{result.tenantName}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 학생 결과 */}
                    <div className={`p-3 rounded ${result.students.success === 5 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h4 className="font-semibold mb-2">👨‍🎓 학생</h4>
                      <p className="text-sm">성공: {result.students.success}/5</p>
                      {result.students.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600">오류:</p>
                          {result.students.errors.map((error, i) => (
                            <p key={i} className="text-xs text-red-500">{error}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 클래스 결과 */}
                    <div className={`p-3 rounded ${result.classes.success === 2 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h4 className="font-semibold mb-2">📚 클래스</h4>
                      <p className="text-sm">성공: {result.classes.success}/2</p>
                      {result.classes.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600">오류:</p>
                          {result.classes.errors.map((error, i) => (
                            <p key={i} className="text-xs text-red-500">{error}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 강사 결과 */}
                    <div className={`p-3 rounded ${result.instructors.success === 2 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h4 className="font-semibold mb-2">👨‍🏫 강사</h4>
                      <p className="text-sm">성공: {result.instructors.success}/2</p>
                      {result.instructors.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600">오류:</p>
                          {result.instructors.errors.map((error, i) => (
                            <p key={i} className="text-xs text-red-500">{error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 전체 요약 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">🎯 생성 완료 요약</h3>
              <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">총 학생:</span> {results.reduce((sum, r) => sum + r.students.success, 0)}명
                </div>
                <div>
                  <span className="font-medium">총 클래스:</span> {results.reduce((sum, r) => sum + r.classes.success, 0)}개
                </div>
                <div>
                  <span className="font-medium">총 강사:</span> {results.reduce((sum, r) => sum + r.instructors.success, 0)}명
                </div>
              </div>
            </div>
          </div>
        )}

        {tenants.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-yellow-800 font-bold mb-2">⚠️ 테넌트 없음</h2>
            <p className="text-yellow-700">샘플 데이터를 생성할 테넌트가 없습니다. 먼저 테넌트를 생성해주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}