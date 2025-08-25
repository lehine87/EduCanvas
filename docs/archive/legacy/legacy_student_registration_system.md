# 학생 등록 시스템 (개별 + Excel 일괄등록)

## 🎯 구현할 기능들

**Tab 1: 개별 등록** 📝
- 학생 한 명씩 입력하는 폼
- 실시간 유효성 검사
- 모바일 친화적 디자인

**Tab 2: Excel 일괄등록** 📊
- Excel/CSV 파일 업로드
- 템플릿 다운로드 제공
- 진행상황 표시
- 성공/실패 결과 리포트

---

## 📄 1단계: 학생 등록 페이지 만들기

### 1.1 등록 페이지 생성

**`src/app/students/new/page.js` 파일 생성:**

```javascript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewStudentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('individual') // 'individual' or 'bulk'
  
  // 개별 등록 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    grade: '',
    subject: '',
    monthly_fee: '',
    memo: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Excel 업로드 상태
  const [file, setFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '학생 이름은 필수입니다'
    }
    
    if (!formData.parent_phone.trim()) {
      newErrors.parent_phone = '학부모 연락처는 필수입니다'
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.parent_phone)) {
      newErrors.parent_phone = '010-0000-0000 형식으로 입력해주세요'
    }
    
    if (formData.phone && !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '010-0000-0000 형식으로 입력해주세요'
    }
    
    if (formData.monthly_fee && (isNaN(formData.monthly_fee) || formData.monthly_fee < 0)) {
      newErrors.monthly_fee = '올바른 금액을 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 개별 학생 등록
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const studentData = {
        ...formData,
        monthly_fee: formData.monthly_fee ? parseInt(formData.monthly_fee) : 0,
        phone: formData.phone || null,
        enrollment_date: new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()

      if (error) throw error

      alert(`${formData.name} 학생이 성공적으로 등록되었습니다!`)
      router.push('/students')
      
    } catch (error) {
      alert(`등록 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Excel 파일 처리
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setUploadResults(null)
    
    // 파일 확장자 검사
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      alert('Excel(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다.')
      return
    }
  }

  // Excel 데이터 처리 및 업로드
  const processExcelFile = async () => {
    if (!file) {
      alert('파일을 먼저 선택해주세요.')
      return
    }

    setUploadLoading(true)
    setUploadProgress(0)

    try {
      // SheetJS로 파일 읽기
      const { default: XLSX } = await import('xlsx')
      
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('Excel 데이터:', jsonData)

      if (jsonData.length === 0) {
        throw new Error('Excel 파일에 데이터가 없습니다.')
      }

      const results = {
        total: jsonData.length,
        success: 0,
        failed: 0,
        errors: []
      }

      // 데이터 변환 및 업로드
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        setUploadProgress(Math.round(((i + 1) / jsonData.length) * 100))

        try {
          // 데이터 매핑 (Excel 컬럼명 → DB 필드명)
          const studentData = {
            name: row['이름'] || row['학생이름'] || row['name'] || '',
            phone: row['학생연락처'] || row['학생전화번호'] || row['phone'] || null,
            parent_name: row['학부모이름'] || row['부모이름'] || row['parent_name'] || '',
            parent_phone: row['학부모연락처'] || row['부모연락처'] || row['parent_phone'] || '',
            grade: row['학년'] || row['grade'] || '',
            subject: row['수강과목'] || row['과목'] || row['subject'] || '',
            monthly_fee: parseInt(row['월수강료'] || row['수강료'] || row['monthly_fee'] || 0),
            memo: row['메모'] || row['특이사항'] || row['memo'] || '',
            enrollment_date: new Date().toISOString().split('T')[0]
          }

          // 필수 필드 검사
          if (!studentData.name || !studentData.parent_phone) {
            throw new Error(`${i + 1}행: 이름과 학부모 연락처는 필수입니다`)
          }

          // DB에 삽입
          const { error } = await supabase
            .from('students')
            .insert([studentData])

          if (error) throw error

          results.success++
          
        } catch (error) {
          results.failed++
          results.errors.push(`${i + 1}행: ${error.message}`)
        }
      }

      setUploadResults(results)
      
      if (results.success > 0) {
        alert(`${results.success}명의 학생이 성공적으로 등록되었습니다!`)
      }

    } catch (error) {
      alert(`파일 처리 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setUploadLoading(false)
      setUploadProgress(0)
    }
  }

  // Excel 템플릿 다운로드
  const downloadTemplate = async () => {
    const { default: XLSX } = await import('xlsx')
    
    const templateData = [
      {
        '이름': '김철수',
        '학년': '중3',
        '수강과목': '수학, 영어',
        '학생연락처': '010-1234-5678',
        '학부모이름': '김부모',
        '학부모연락처': '010-9876-5432',
        '월수강료': 300000,
        '메모': '특이사항 없음'
      },
      {
        '이름': '이영희',
        '학년': '고1',
        '수강과목': '영어, 과학',
        '학생연락처': '',
        '학부모이름': '이부모',
        '학부모연락처': '010-1111-2222',
        '월수강료': 350000,
        '메모': ''
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '학생명단')
    
    XLSX.writeFile(wb, '학생등록_템플릿.xlsx')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">➕ 학생 등록</h1>
              <p className="mt-1 text-gray-600">새로운 학생을 등록합니다</p>
            </div>
            <Link
              href="/students"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← 목록으로
            </Link>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('individual')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'individual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 개별 등록
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bulk'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Excel 일괄등록
              </button>
            </nav>
          </div>

          {/* 개별 등록 탭 */}
          {activeTab === 'individual' && (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 학생 이름 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      학생 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="예: 김철수"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* 학년 */}
                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                      학년
                    </label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">학년 선택</option>
                      <option value="초1">초등 1학년</option>
                      <option value="초2">초등 2학년</option>
                      <option value="초3">초등 3학년</option>
                      <option value="초4">초등 4학년</option>
                      <option value="초5">초등 5학년</option>
                      <option value="초6">초등 6학년</option>
                      <option value="중1">중학 1학년</option>
                      <option value="중2">중학 2학년</option>
                      <option value="중3">중학 3학년</option>
                      <option value="고1">고등 1학년</option>
                      <option value="고2">고등 2학년</option>
                      <option value="고3">고등 3학년</option>
                      <option value="재수">재수생</option>
                    </select>
                  </div>

                  {/* 학생 연락처 */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      학생 연락처
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="010-0000-0000"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  {/* 학부모 이름 */}
                  <div>
                    <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700 mb-1">
                      학부모 이름
                    </label>
                    <input
                      type="text"
                      id="parent_name"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 김부모"
                    />
                  </div>

                  {/* 학부모 연락처 */}
                  <div>
                    <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      학부모 연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="parent_phone"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.parent_phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="010-0000-0000"
                    />
                    {errors.parent_phone && <p className="mt-1 text-sm text-red-600">{errors.parent_phone}</p>}
                  </div>

                  {/* 월 수강료 */}
                  <div>
                    <label htmlFor="monthly_fee" className="block text-sm font-medium text-gray-700 mb-1">
                      월 수강료 (원)
                    </label>
                    <input
                      type="number"
                      id="monthly_fee"
                      name="monthly_fee"
                      value={formData.monthly_fee}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.monthly_fee ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="300000"
                      min="0"
                      step="10000"
                    />
                    {errors.monthly_fee && <p className="mt-1 text-sm text-red-600">{errors.monthly_fee}</p>}
                  </div>
                </div>

                {/* 수강 과목 */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    수강 과목
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 수학, 영어, 과학"
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                    메모 (특이사항)
                  </label>
                  <textarea
                    id="memo"
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="특이사항이나 참고할 내용을 입력하세요"
                  />
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/students"
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                  >
                    {loading ? '등록 중...' : '학생 등록'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Excel 일괄등록 탭 */}
          {activeTab === 'bulk' && (
            <div className="p-6">
              <div className="space-y-6">
                
                {/* 안내 메시지 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">📊 Excel 일괄등록 안내</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Excel(.xlsx, .xls) 또는 CSV 파일을 업로드할 수 있습니다</li>
                    <li>• 첫 번째 시트의 데이터만 처리됩니다</li>
                    <li>• 필수 컬럼: 이름, 학부모연락처</li>
                    <li>• 템플릿을 다운로드해서 양식에 맞춰 작성해주세요</li>
                  </ul>
                </div>

                {/* 템플릿 다운로드 */}
                <div className="text-center">
                  <button
                    onClick={downloadTemplate}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    📥 Excel 템플릿 다운로드
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    템플릿을 다운로드해서 학생 정보를 입력한 후 업로드하세요
                  </p>
                </div>

                {/* 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excel 파일 선택
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="text-gray-400 text-4xl mb-4">📁</div>
                      <div className="text-lg font-medium text-gray-900 mb-2">
                        파일을 클릭해서 선택하세요
                      </div>
                      <div className="text-sm text-gray-600">
                        Excel(.xlsx, .xls) 또는 CSV 파일만 지원
                      </div>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">선택된 파일:</p>
                          <p className="text-sm text-gray-600">{file.name}</p>
                        </div>
                        <button
                          onClick={processExcelFile}
                          disabled={uploadLoading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {uploadLoading ? '처리 중...' : '업로드 시작'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 진행상황 */}
                {uploadLoading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-yellow-900">업로드 진행중...</span>
                      <span className="text-yellow-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 업로드 결과 */}
                {uploadResults && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">📋 업로드 결과</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{uploadResults.total}</div>
                        <div className="text-sm text-gray-600">총 학생 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{uploadResults.success}</div>
                        <div className="text-sm text-gray-600">등록 성공</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{uploadResults.failed}</div>
                        <div className="text-sm text-gray-600">등록 실패</div>
                      </div>
                    </div>

                    {uploadResults.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <h4 className="font-medium text-red-900 mb-2">❌ 오류 목록:</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          {uploadResults.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <Link
                        href="/students"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        학생 목록 확인하기
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 📦 2단계: SheetJS 라이브러리 설치

Excel 파일을 처리하기 위해 SheetJS 라이브러리를 설치합니다:

```bash
npm install xlsx
```

---

## 🚀 3단계: 테스트해보기

### 3.1 페이지 접속
1. http://localhost:3000/students 접속
2. "➕ 새 학생 등록" 버튼 클릭

### 3.2 개별 등록 테스트
- 📝 "개별 등록" 탭에서 학생 한 명 등록해보기
- 필수 필드 (이름, 학부모 연락처) 확인
- 전화번호 형식 검증 확인

### 3.3 Excel 일괄등록 테스트
1. 📊 "Excel 일괄등록" 탭 클릭
2. "📥 Excel 템플릿 다운로드" 클릭
3. 다운로드된 템플릿에 학생 정보 입력
4. 파일 업로드 후 "업로드 시작" 클릭

---

## 📋 4단계: Excel 템플릿 컬럼 설명

**필수 컬럼:**
- `이름` - 학생 이름 (필수)
- `학부모연락처` - 010-0000-0000 형식 (필수)

**선택 컬럼:**
- `학년` - 초1, 중2, 고3 등
- `수강과목` - 수학, 영어 등 (쉼표로 구분)
- `학생연락처` - 010-0000-0000 형식
- `학부모이름` - 학부모 성명
- `월수강료` - 숫자만 입력 (예: 300000)
- `메모` - 특이사항

---

## ✅ 구현된 주요 기능들

**개별 등록:**
- ✅ 반응형 폼 디자인
- ✅ 실시간 유효성 검사
- ✅ 필수/선택 필드 구분
- ✅ 전화번호 형식 검증
- ✅ 학년 선택 드롭다운

**Excel 일괄등록:**
- ✅ 템플릿 다운로드 기능
- ✅ Excel/CSV 파일 지원
- ✅ 실시간 진행상황 표시
- ✅ 성공/실패 통계 표시
- ✅ 오류 상세 리포트

**UX 개선:**
- ✅ 탭으로 기능 분리
- ✅ 직관적인 아이콘 사용
- ✅ 모바일 친화적 디자인
- ✅ 로딩 상태 표시

---

## 🎯 다음 단계 미리보기

등록 기능이 완성되면:
1. **학생 수정 기능** (`/students/[id]/edit`)
2. **출결 관리 시스템**
3. **수강료 관리 기능**

**지금 바로 테스트해보시고 결과 알려주세요:**
- ✅ **"개별 등록 잘 돼!"** → Excel 기능도 테스트
- 📊 **"Excel 업로드 성공!"** → 다음 기능 개발
- 🔧 **"이런 오류가 나"** → 구체적인 문제 해결
- 💡 **"이런 기능 추가해줘"** → 개선사항 반영

SheetJS 설치 후 테스트 시작해보세요! 🚀