# 안정적인 학생 등록 시스템 (CSV + 간단한 Excel)

## 🎯 현실적인 해결책

Excel 라이브러리들의 브라우저 호환성 문제 때문에 **더 안정적이고 실용적인 방법**을 제안합니다!

1. **CSV 템플릿** - 100% 안정적, Excel에서 바로 열기 가능
2. **HTML 테이블** - 복사해서 Excel에 붙여넣기 가능
3. **단순한 Excel 생성** - 복잡한 스타일링 없이

---

## 📄 완전히 새로운 안정적 버전

**`src/app/students/new/page.js` 완전 교체:**

```javascript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewStudentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('individual')
  
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

  // 일괄 업로드 상태
  const [file, setFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)
  const [csvData, setCsvData] = useState('')

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
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

  // CSV 템플릿 다운로드 (100% 안정적)
  const downloadCSVTemplate = () => {
    const csvContent = `이름,학년,수강과목,학생연락처,학부모이름,학부모연락처,월수강료,메모
김철수,중3,"수학, 영어",010-1234-5678,김부모,010-9876-5432,300000,특이사항 없음
이영희,고1,"영어, 과학",,이부모,010-1111-2222,350000,
박민수,중2,수학,010-3333-4444,박부모,010-3333-5555,250000,수학 심화반`

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '학생등록_템플릿.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    console.log('✅ CSV 템플릿 다운로드 성공!')
  }

  // 간단한 Excel 템플릿 다운로드 (SheetJS 기본 기능만 사용)
  const downloadExcelTemplate = async () => {
    try {
      // 동적 import으로 SheetJS 로드
      const XLSX = await import('xlsx')
      
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
      console.log('✅ Excel 템플릿 다운로드 성공!')
      
    } catch (error) {
      console.error('Excel 템플릿 오류:', error)
      alert('Excel 템플릿 생성 중 오류가 발생했습니다. CSV 템플릿을 대신 다운로드합니다.')
      downloadCSVTemplate()
    }
  }

  // 파일 업로드 핸들러
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setUploadResults(null)
    
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      alert('Excel(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다.')
      setFile(null)
      return
    }

    console.log('📁 파일 선택됨:', uploadedFile.name)
  }

  // CSV 파일 처리
  const processCSVFile = async (fileContent) => {
    const lines = fileContent.split('\n').filter(line => line.trim())
    
    if (lines.length <= 1) {
      throw new Error('CSV 파일에 데이터가 없습니다.')
    }

    // 헤더 파싱 (더 안전하게)
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    console.log('📋 CSV 헤더:', headers)

    const jsonData = []
    
    // 데이터 행 처리
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // CSV 파싱 (따옴표 처리)
      const values = []
      let current = ''
      let inQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"' && (j === 0 || line[j-1] === ',')) {
          inQuotes = true
        } else if (char === '"' && (j === line.length - 1 || line[j+1] === ',')) {
          inQuotes = false
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      if (Object.values(row).some(value => value)) {
        jsonData.push(row)
      }
    }
    
    return jsonData
  }

  // Excel 파일 처리
  const processExcelFile = async (file) => {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet)
  }

  // 파일 처리 메인 함수
  const processFile = async () => {
    if (!file) {
      alert('파일을 먼저 선택해주세요.')
      return
    }

    setUploadLoading(true)
    setUploadProgress(0)

    try {
      console.log('📊 파일 처리 시작...')
      
      let jsonData = []
      const fileExtension = file.name.split('.').pop().toLowerCase()
      
      if (fileExtension === 'csv') {
        const fileContent = await file.text()
        jsonData = await processCSVFile(fileContent)
      } else {
        jsonData = await processExcelFile(file)
      }

      console.log('📊 추출된 데이터:', jsonData)

      if (jsonData.length === 0) {
        throw new Error('파일에 데이터가 없습니다.')
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

          if (!studentData.name) {
            throw new Error('이름은 필수입니다')
          }
          if (!studentData.parent_phone) {
            throw new Error('학부모 연락처는 필수입니다')
          }

          const { error } = await supabase
            .from('students')
            .insert([studentData])

          if (error) throw error

          results.success++
          console.log(`✅ ${studentData.name} 등록 성공`)
          
        } catch (error) {
          results.failed++
          results.errors.push(`${i + 1}행 (${row['이름'] || '이름없음'}): ${error.message}`)
          console.error(`❌ ${i + 1}행 오류:`, error.message)
        }
      }

      setUploadResults(results)
      
      if (results.success > 0) {
        alert(`🎉 ${results.success}명의 학생이 성공적으로 등록되었습니다!`)
      }

    } catch (error) {
      console.error('❌ 파일 처리 오류:', error)
      alert(`파일 처리 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setUploadLoading(false)
      setUploadProgress(0)
    }
  }

  // HTML 테이블 템플릿 생성
  const generateHTMLTemplate = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>학생 등록 템플릿</title>
    <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .required { background-color: #ffe6e6; }
    </style>
</head>
<body>
    <h2>학생 등록 템플릿</h2>
    <p>이 표를 복사해서 Excel에 붙여넣기 하세요!</p>
    <table>
        <tr>
            <th class="required">이름</th>
            <th>학년</th>
            <th>수강과목</th>
            <th>학생연락처</th>
            <th>학부모이름</th>
            <th class="required">학부모연락처</th>
            <th>월수강료</th>
            <th>메모</th>
        </tr>
        <tr>
            <td>김철수</td>
            <td>중3</td>
            <td>수학, 영어</td>
            <td>010-1234-5678</td>
            <td>김부모</td>
            <td>010-9876-5432</td>
            <td>300000</td>
            <td>특이사항 없음</td>
        </tr>
        <tr>
            <td>이영희</td>
            <td>고1</td>
            <td>영어, 과학</td>
            <td></td>
            <td>이부모</td>
            <td>010-1111-2222</td>
            <td>350000</td>
            <td></td>
        </tr>
        <tr>
            <td>박민수</td>
            <td>중2</td>
            <td>수학</td>
            <td>010-3333-4444</td>
            <td>박부모</td>
            <td>010-3333-5555</td>
            <td>250000</td>
            <td>수학 심화반</td>
        </tr>
    </table>
    <h3>사용 방법:</h3>
    <ol>
        <li>위 표를 드래그해서 전체 선택</li>
        <li>Ctrl+C로 복사</li>
        <li>Excel을 열고 Ctrl+V로 붙여넣기</li>
        <li>데이터 입력 후 CSV로 저장</li>
        <li>CSV 파일을 업로드</li>
    </ol>
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '학생등록_템플릿.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
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
                📊 일괄 등록 (CSV/Excel)
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

          {/* 일괄 등록 탭 */}
          {activeTab === 'bulk' && (
            <div className="p-6">
              <div className="space-y-6">
                
                {/* 안내 메시지 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">📊 안정적인 일괄등록 시스템</h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• 🛡️ 100% 안정적인 CSV 방식</li>
                    <li>• 📁 Excel/CSV 파일 지원</li>
                    <li>• 🔄 Excel ↔ CSV 자유 변환</li>
                    <li>• 📋 필수 컬럼: 이름, 학부모연락처</li>
                    <li>• ✅ 브라우저 호환성 문제 해결</li>
                  </ul>
                </div>

                {/* 템플릿 다운로드 옵션 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* CSV 템플릿 */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-blue-600 text-3xl mb-2">📄</div>
                    <h4 className="font-medium text-blue-900 mb-2">CSV 템플릿</h4>
                    <p className="text-sm text-blue-700 mb-3">가장 안정적, Excel에서 바로 열기 가능</p>
                    <button
                      onClick={downloadCSVTemplate}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      CSV 다운로드
                    </button>
                  </div>

                  {/* Excel 템플릿 */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-green-600 text-3xl mb-2">📊</div>
                    <h4 className="font-medium text-green-900 mb-2">Excel 템플릿</h4>
                    <p className="text-sm text-green-700 mb-3">Excel 형식, 오류시 CSV로 대체</p>
                    <button
                      onClick={downloadExcelTemplate}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      Excel 다운로드
                    </button>
                  </div>

                  {/* HTML 템플릿 */}
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-purple-600 text-3xl mb-2">🌐</div>
                    <h4 className="font-medium text-purple-900 mb-2">HTML 템플릿</h4>
                    <p className="text-sm text-purple-700 mb-3">복사→붙여넣기로 Excel 사용</p>
                    <button
                      onClick={generateHTMLTemplate}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      HTML 다운로드
                    </button>
                  </div>
                </div>

                {/* 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    파일 업로드 (CSV/Excel)
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
                        CSV(.csv) 또는 Excel(.xlsx, .xls) 파일 지원
                      </div>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900">선택된 파일:</p>
                          <p className="text-sm text-green-700">{file.name}</p>
                        </div>
                        <button
                          onClick={processFile}
                          disabled={uploadLoading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {uploadLoading ? '처리 중...' : '🚀 업로드 시작'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 진행상황 */}
                {uploadLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">파일 처리 중...</span>
                      <span className="text-blue-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                        <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
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

## 🎯 왜 이 방법이 더 좋은가?

### ✅ 100% 안정성
- CSV는 브라우저 호환성 문제 없음
- 복잡한 라이브러리 의존성 없음
- 모든 환경에서 동일하게 작동

### 🔄 유연성
- CSV ↔ Excel 자유 변환
- 3가지 템플릿 옵션 제공
- 다양한 파일 형식 지원

### 📊 실용성
- 실제 학원에서 CSV도 충분히 실용적
- Excel에서 CSV 열기/저장 쉬움
- 기존 Excel 데이터 그대로 활용 가능

---

## 🚀 지금 바로 테스트하세요!

```bash
# ExcelJS 제거 (선택사항)
npm uninstall exceljs

# 만약 xlsx를 다시 사용하고 싶다면
npm install xlsx

# 파일 교체 후 테스트
npm run dev
```

**🧪 테스트 순서:**
1. **CSV 템플릿** 다운로드 → Excel에서 열기 → 데이터 입력 → CSV 저장 → 업로드
2. **Excel 템플릿** 다운로드 → 데이터 입력 → 업로드 (오류시 자동으로 CSV 템플릿 제공)
3. **HTML 템플릿** 다운로드 → 브라우저에서 열기 → 표 복사 → Excel 붙여넣기

**예상 결과:**
- ✅ 모든 브라우저에서 안정적 작동
- ✅ 라이브러리 오류 완전 해결
- ✅ 3가지 방법으로 사용 편의성 극대화

**테스트 후 알려주세요:**
- 🎉 **"드디어 모든 기능이 완벽해!"**
- 📊 **"CSV 업로드 X명 성공!"**
- 💡 **"HTML 템플릿이 정말 편해!"**

이제 정말 안정적이고 실용적인 학원관리 시스템이 완성됩니다! 🚀