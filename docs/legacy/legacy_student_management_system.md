# 학생 관리 시스템 구현 가이드

## 🎯 구현할 기능들

**1단계: 학생 목록 페이지** (오늘 완성 목표)
- 📋 학생 목록 조회 (검색, 필터링)
- ➕ 새 학생 등록 버튼
- ✏️ 학생 정보 수정 버튼
- 🗑️ 학생 삭제 버튼

**2단계: 학생 등록/수정 폼**
- 📝 학생 기본정보 입력
- 💰 수강료 설정
- 📅 등록일 자동 설정

**3단계: 사용성 개선**
- 🔍 실시간 검색
- 📱 모바일 반응형
- 💾 자동 저장

---

## 🏗 1단계: 학생 목록 페이지 만들기

### 1.1 페이지 구조 생성

**`src/app/students/page.js` 파일 생성:**

```javascript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // 페이지 로드시 학생 데이터 가져오기
  useEffect(() => {
    fetchStudents()
  }, [])

  // 학생 데이터 조회 함수
  async function fetchStudents() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setStudents(data || [])
    } catch (err) {
      setError(err.message)
      console.error('학생 데이터 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 학생 삭제 함수
  async function deleteStudent(id, name) {
    if (!confirm(`정말로 '${name}' 학생을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 로컬 상태에서도 제거 (화면 즉시 업데이트)
      setStudents(students.filter(student => student.id !== id))
      alert('학생이 삭제되었습니다.')
    } catch (err) {
      alert(`삭제 중 오류가 발생했습니다: ${err.message}`)
    }
  }

  // 검색 필터링
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 상태별 스타일
  function getStatusBadge(status) {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      graduated: 'bg-blue-100 text-blue-800'
    }
    const labels = {
      active: '활성',
      inactive: '비활성',
      graduated: '졸업'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👥 학생 관리</h1>
              <p className="mt-1 text-gray-600">
                등록된 학생 {filteredStudents.length}명 
                {searchTerm && ` (검색: "${searchTerm}")`}
              </p>
            </div>
            <Link
              href="/students/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ➕ 새 학생 등록
            </Link>
          </div>

          {/* 빠른 메뉴 */}
          <div className="mt-4 flex space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              🏠 홈으로
            </Link>
            <Link href="/test" className="text-gray-600 hover:text-gray-800">
              🧪 연결 테스트
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                🔍 학생 검색
              </label>
              <input
                type="text"
                id="search"
                placeholder="이름, 학년, 과목으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 px-4 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? '⏳' : '🔄'} 새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 학생 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">학생 목록을 불러오는 중...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    "{searchTerm}"과 일치하는 학생을 찾을 수 없습니다.
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    전체 목록 보기
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    등록된 학생이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    첫 번째 학생을 등록해보세요!
                  </p>
                  <Link
                    href="/students/new"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    ➕ 첫 학생 등록하기
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* 데스크톱용 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수강 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수강료
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.grade || '학년 미설정'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            학생: {student.phone || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            학부모: {student.parent_phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {student.subject || '과목 미설정'}
                          </div>
                          <div className="text-sm text-gray-500">
                            등록일: {student.enrollment_date ? 
                              new Date(student.enrollment_date).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.monthly_fee ? 
                              `${student.monthly_fee.toLocaleString()}원` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Link
                            href={`/students/${student.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            ✏️ 수정
                          </Link>
                          <button
                            onClick={() => deleteStudent(student.id, student.name)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            🗑️ 삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일용 카드 */}
              <div className="md:hidden">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="border-b border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student.grade} | {student.subject || '과목 미설정'}
                        </p>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <p>📞 학부모: {student.parent_phone}</p>
                      <p>💰 수강료: {student.monthly_fee ? 
                        `${student.monthly_fee.toLocaleString()}원` : '미설정'}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Link
                        href={`/students/${student.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                      >
                        ✏️ 수정
                      </Link>
                      <button
                        onClick={() => deleteStudent(student.id, student.name)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 정보 */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📊 요약 정보</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">총 학생 수:</span>
                <span className="font-medium ml-1">{filteredStudents.length}명</span>
              </div>
              <div>
                <span className="text-blue-700">활성 학생:</span>
                <span className="font-medium ml-1">
                  {filteredStudents.filter(s => s.status === 'active').length}명
                </span>
              </div>
              <div>
                <span className="text-blue-700">월 수강료 합계:</span>
                <span className="font-medium ml-1">
                  {filteredStudents
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0)
                    .toLocaleString()}원
                </span>
              </div>
              <div>
                <span className="text-blue-700">평균 수강료:</span>
                <span className="font-medium ml-1">
                  {filteredStudents.length > 0 ? 
                    Math.round(filteredStudents
                      .filter(s => s.monthly_fee > 0)
                      .reduce((sum, s) => sum + s.monthly_fee, 0) / 
                      filteredStudents.filter(s => s.monthly_fee > 0).length
                    ).toLocaleString() : '0'}원
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### 1.2 메인 페이지에 링크 추가

**`src/app/page.js` 파일 수정:**

```javascript
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🏫 학원관리 솔루션
        </h1>
        
        <p className="text-gray-600 mb-8">
          효율적인 학원 운영을 위한 통합 관리 시스템
        </p>

        <div className="space-y-3">
          <Link
            href="/students"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            👥 학생 관리
          </Link>
          
          <Link
            href="/test"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🧪 시스템 테스트
          </Link>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          개발 단계: Phase 1 MVP
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 테스트해보기

### 1단계: 페이지 접속
1. **개발 서버 실행 중인지 확인:** `npm run dev`
2. **브라우저에서 접속:** http://localhost:3000
3. **"👥 학생 관리" 버튼 클릭**

### 2단계: 기능 테스트
- ✅ 학생 목록이 테이블 형태로 표시
- ✅ 검색 기능 동작 (이름으로 검색해보기)
- ✅ 데스크톱/모바일 반응형 확인
- ✅ 삭제 기능 테스트 (주의: 실제로 삭제됨)

### 3단계: 예상 결과
```
👥 학생 관리
등록된 학생 3명

🔍 학생 검색: [이름, 학년, 과목으로 검색...]

[테이블]
김철수 | 중3 | 수학, 영어 | 300,000원 | 활성 | ✏️수정 🗑️삭제
이영희 | 고1 | 영어, 과학 | 350,000원 | 활성 | ✏️수정 🗑️삭제
박민수 | 중2 | 수학 | 250,000원 | 활성 | ✏️수정 🗑️삭제

📊 요약 정보
총 학생 수: 3명 | 활성 학생: 3명 | 월 수강료 합계: 900,000원
```

---

## 🎯 다음 단계 미리보기

학생 목록 페이지가 완성되면:

1. **학생 등록 폼** (`/students/new`)
2. **학생 수정 폼** (`/students/[id]/edit`)
3. **출결 관리 기능**
4. **수강료 관리 기능**

**테스트 결과를 알려주세요:**
- ✅ **"학생 목록 잘 보여!"** → 다음 단계(등록 폼) 진행
- 🔧 **"에러가 나"** → 오류 메시지 알려주세요
- 📱 **"모바일에서도 테스트해봤어"** → UI 피드백 환영
- 💡 **"이런 기능도 추가하면 좋겠어"** → 제안사항 환영

지금 바로 테스트해보시고 결과 알려주세요! 🚀