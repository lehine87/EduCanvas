'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TableName } from '@/types/utilityTypes'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'pending'
  message: string
  data?: unknown
}

export default function DatabaseTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  
  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }
  
  const runTests = async () => {
    setLoading(true)
    setResults([])
    
    // Test 1: Supabase 클라이언트 초기화 테스트
    addResult({
      test: 'Supabase Client Initialization',
      status: 'pending',
      message: 'Testing Supabase client initialization...'
    })
    
    try {
      if (supabase) {
        addResult({
          test: 'Supabase Client Initialization',
          status: 'success',
          message: 'Supabase client initialized successfully'
        })
      } else {
        throw new Error('Supabase client is null')
      }
    } catch (error) {
      addResult({
        test: 'Supabase Client Initialization',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 2: 환경변수 확인
    addResult({
      test: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment variables...'
    })
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      addResult({
        test: 'Environment Variables',
        status: 'success',
        message: `URL: ${supabaseUrl.substring(0, 20)}..., Key: ${supabaseAnonKey.substring(0, 20)}...`,
        data: { url: supabaseUrl, keyLength: supabaseAnonKey.length }
      })
    } else {
      addResult({
        test: 'Environment Variables',
        status: 'error',
        message: 'Missing environment variables'
      })
    }
    
    // Test 3: 데이터베이스 연결 테스트
    addResult({
      test: 'Database Connection',
      status: 'pending',
      message: 'Testing database connection...'
    })
    
    try {
      // Test connection by trying to access a known table
      const { data, error } = await supabase
        .from('students')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        addResult({
          test: 'Database Connection',
          status: 'error',
          message: `Connection failed: ${error.message}`
        })
      } else {
        addResult({
          test: 'Database Connection',
          status: 'success',
          message: `Connection successful! Students table accessible.`,
          data: { info: 'Connected via students table test' }
        })
      }
    } catch (error) {
      addResult({
        test: 'Database Connection',
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed'
      })
    }
    
    // Test 4: Auth 상태 확인
    addResult({
      test: 'Authentication Status',
      status: 'pending',
      message: 'Checking authentication status...'
    })
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        addResult({
          test: 'Authentication Status',
          status: 'error',
          message: `Auth error: ${error.message}`
        })
      } else {
        addResult({
          test: 'Authentication Status',
          status: 'success',
          message: user ? `Logged in as: ${user.email}` : 'No user logged in',
          data: { user: user ? { id: user.id, email: user.email } : null }
        })
      }
    } catch (error) {
      addResult({
        test: 'Authentication Status',
        status: 'error',
        message: error instanceof Error ? error.message : 'Auth check failed'
      })
    }
    
    // Test 5: 테이블 스키마 확인
    addResult({
      test: 'Table Schema Check',
      status: 'pending',
      message: 'Checking available tables...'
    })
    
    try {
      // Test individual tables to see which ones exist
      const expectedTables = ['tenants', 'students', 'classes', 'instructors', 'course_packages', 'student_enrollments', 'payments', 'attendances', 'videos']
      const tableResults = []
      let availableCount = 0
      
      for (const tableName of expectedTables) {
        try {
          const { error } = await supabase
            .from(tableName as TableName)
            .select('count', { count: 'exact', head: true })
          
          if (error) {
            tableResults.push(`${tableName}: ❌ ${error.message}`)
          } else {
            tableResults.push(`${tableName}: ✅ Available`)
            availableCount++
          }
        } catch (err) {
          tableResults.push(`${tableName}: ❌ Access Error`)
        }
      }
      
      const allAvailable = availableCount === expectedTables.length
      
      addResult({
        test: 'Table Schema Check',
        status: availableCount > 0 ? 'success' : 'error',
        message: allAvailable 
          ? `All ${expectedTables.length} core tables are available!`
          : `${availableCount}/${expectedTables.length} core tables available`,
        data: { 
          tableResults: tableResults,
          availableCount: availableCount,
          totalExpected: expectedTables.length,
          allTablesReady: allAvailable
        }
      })
    } catch (error) {
      addResult({
        test: 'Table Schema Check',
        status: 'error',
        message: error instanceof Error ? error.message : 'Schema check failed'
      })
    }
    
    setLoading(false)
  }
  
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌' 
      case 'pending': return '⏳'
    }
  }
  
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
    }
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🔍 EduCanvas Database Connection Test
        </h1>
        
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? '테스트 실행 중...' : '🚀 데이터베이스 테스트 시작'}
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">테스트 결과</h2>
            
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.status === 'success' 
                    ? 'border-green-200 bg-green-50' 
                    : result.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{getStatusIcon(result.status)}</span>
                  <h3 className="font-semibold text-gray-800">{result.test}</h3>
                </div>
                
                <p className={`mb-2 ${getStatusColor(result.status)}`}>
                  {result.message}
                </p>
                
                {result.data !== undefined && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      상세 데이터 보기
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
        
        {results.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            위 버튼을 클릭하여 데이터베이스 연결 테스트를 시작하세요.
          </div>
        )}
      </div>
    </div>
  )
}