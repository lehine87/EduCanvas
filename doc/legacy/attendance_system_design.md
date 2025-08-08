# 출결 관리 시스템 설계 및 구현 가이드

## 🎯 시스템 요구사항 분석

### 복잡도 분석
- **학생 ↔ 클래스**: M:N 관계 (한 학생이 여러 클래스 수강 가능)
- **강사 ↔ 클래스**: 1:N 관계 (한 강사가 여러 클래스 운영)
- **클래스 ↔ 조교**: 1:N 관계 (한 클래스에 여러 조교)
- **클래스 ↔ 스케줄**: 1:N 관계 (요일별 다른 시간)
- **출결**: 클래스별, 일자별 체크

---

## 🗄 1단계: 데이터베이스 설계

### 새로 필요한 테이블들

```sql
-- 1. 강사 테이블
CREATE TABLE instructors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  subject_specialty TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 클래스 테이블
CREATE TABLE classes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  grade_level VARCHAR(50),
  max_students INTEGER DEFAULT 20,
  monthly_fee INTEGER DEFAULT 0,
  main_instructor_id BIGINT REFERENCES instructors(id),
  classroom VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 클래스 스케줄 테이블 (요일별 수업 시간)
CREATE TABLE class_schedules (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=일요일, 1=월요일, ..., 6=토요일
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 클래스-학생 관계 테이블 (M:N)
CREATE TABLE class_students (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 학생이 같은 클래스에 중복 등록 방지
  UNIQUE(class_id, student_id)
);

-- 5. 클래스-조교 테이블
CREATE TABLE class_assistants (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
  instructor_id BIGINT REFERENCES instructors(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'assistant', -- 'main', 'assistant'
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 기존 출결 테이블 수정 (class_id 추가)
-- 먼저 기존 attendance 테이블 백업 후 재생성
DROP TABLE IF EXISTS attendance_backup;
CREATE TABLE attendance_backup AS SELECT * FROM attendance;

DROP TABLE attendance;
CREATE TABLE attendance (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'early_leave'
  check_in_time TIME,
  check_out_time TIME,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 학생의 같은 클래스 같은 날은 중복 불가
  UNIQUE(class_id, student_id, attendance_date)
);
```

### 샘플 데이터 삽입

```sql
-- 강사 샘플 데이터
INSERT INTO instructors (name, phone, email, subject_specialty) VALUES
('김수학', '010-1111-1111', 'kim.math@academy.com', '수학'),
('이영어', '010-2222-2222', 'lee.english@academy.com', '영어'),
('박과학', '010-3333-3333', 'park.science@academy.com', '과학');

-- 클래스 샘플 데이터
INSERT INTO classes (name, subject, grade_level, max_students, monthly_fee, main_instructor_id, classroom) VALUES
('중3 수학 A반', '수학', '중3', 15, 300000, 1, '201호'),
('중3 수학 B반', '수학', '중3', 15, 300000, 1, '202호'),
('고1 영어 정규반', '영어', '고1', 20, 250000, 2, '301호'),
('중등 과학 실험반', '과학', '중1,중2,중3', 12, 280000, 3, '실험실');

-- 클래스 스케줄 샘플 데이터
INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time) VALUES
-- 중3 수학 A반: 월,수,금 14:00-16:00
(1, 1, '14:00', '16:00'), -- 월요일
(1, 3, '14:00', '16:00'), -- 수요일  
(1, 5, '14:00', '16:00'), -- 금요일
-- 중3 수학 B반: 화,목,토 14:00-16:00
(2, 2, '14:00', '16:00'), -- 화요일
(2, 4, '14:00', '16:00'), -- 목요일
(2, 6, '14:00', '16:00'), -- 토요일
-- 고1 영어: 월,수 16:30-18:30
(3, 1, '16:30', '18:30'), -- 월요일
(3, 3, '16:30', '18:30'), -- 수요일
-- 과학 실험반: 토 10:00-12:00
(4, 6, '10:00', '12:00'); -- 토요일

-- 학생-클래스 등록 샘플 (기존 학생들을 클래스에 배정)
INSERT INTO class_students (class_id, student_id) VALUES
-- 김철수(id=1): 중3 수학 A반, 과학 실험반
(1, 1), (4, 1),
-- 이영희(id=2): 고1 영어, 과학 실험반  
(3, 2), (4, 2),
-- 박민수(id=3): 중3 수학 B반
(2, 3);
```

---

## 🏗 2단계: 클래스 관리 시스템 구축

### 2.1 클래스 목록 페이지

**`src/app/classes/page.js` 파일 생성:**

```javascript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError('')

      // 클래스 정보와 관련 데이터 조인하여 가져오기
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructors!main_instructor_id(name),
          class_schedules(day_of_week, start_time, end_time),
          class_students(student_id, students(name))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setClasses(data || [])
    } catch (err) {
      setError(err.message)
      console.error('클래스 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 요일 변환 함수
  const getDayName = (dayNumber) => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days[dayNumber]
  }

  // 수업 시간 포맷팅
  const formatSchedule = (schedules) => {
    if (!schedules || schedules.length === 0) return '시간 미설정'
    
    return schedules
      .sort((a, b) => a.day_of_week - b.day_of_week)
      .map(schedule => 
        `${getDayName(schedule.day_of_week)} ${schedule.start_time.slice(0,5)}-${schedule.end_time.slice(0,5)}`
      )
      .join(', ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">클래스 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📚 클래스 관리</h1>
              <p className="mt-1 text-gray-600">
                등록된 클래스 {classes.length}개
              </p>
            </div>
            <div className="space-x-3">
              <Link
                href="/classes/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ 새 클래스
              </Link>
              <Link
                href="/instructors"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                👨‍🏫 강사 관리
              </Link>
            </div>
          </div>

          {/* 빠른 메뉴 */}
          <div className="mt-4 flex space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              🏠 홈으로
            </Link>
            <Link href="/students" className="text-gray-600 hover:text-gray-800">
              👥 학생 관리
            </Link>
            <Link href="/attendance" className="text-purple-600 hover:text-purple-800 font-medium">
              📋 출결 관리
            </Link>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 클래스 목록 */}
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 클래스가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 클래스를 만들어보세요!
            </p>
            <Link
              href="/classes/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ➕ 첫 클래스 생성하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  
                  {/* 클래스 헤더 */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {classItem.name}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {classItem.subject}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      classItem.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {classItem.status === 'active' ? '진행중' : '종료'}
                    </span>
                  </div>

                  {/* 클래스 정보 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">👨‍🏫 강사:</span>
                      <span>{classItem.instructors?.name || '미배정'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">🎓 학년:</span>
                      <span>{classItem.grade_level || '전체'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">🏠 교실:</span>
                      <span>{classItem.classroom || '미정'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">👥 정원:</span>
                      <span>{classItem.class_students?.length || 0}/{classItem.max_students}명</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">💰 수강료:</span>
                      <span>{classItem.monthly_fee?.toLocaleString() || 0}원</span>
                    </div>
                  </div>

                  {/* 수업 시간 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">📅 수업 시간</p>
                    <p className="text-sm text-gray-600">
                      {formatSchedule(classItem.class_schedules)}
                    </p>
                  </div>

                  {/* 등록 학생 */}
                  {classItem.class_students && classItem.class_students.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">🎒 등록 학생</p>
                      <div className="flex flex-wrap gap-1">
                        {classItem.class_students.slice(0, 3).map((cs, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {cs.students?.name}
                          </span>
                        ))}
                        {classItem.class_students.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{classItem.class_students.length - 3}명
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/attendance/class/${classItem.id}`}
                      className="flex-1 text-center bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                    >
                      📋 출결
                    </Link>
                    <Link
                      href={`/classes/${classItem.id}/edit`}
                      className="flex-1 text-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                    >
                      ✏️ 수정
                    </Link>
                    <Link
                      href={`/classes/${classItem.id}`}
                      className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                    >
                      👁️ 상세
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 📋 3단계: 오늘의 출결 관리 페이지

**`src/app/attendance/page.js` 파일 생성:**

```javascript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AttendancePage() {
  const [todayClasses, setTodayClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchTodayClasses()
  }, [selectedDate])

  // 오늘 요일에 해당하는 클래스들 조회
  const fetchTodayClasses = async () => {
    try {
      setLoading(true)
      setError('')

      const date = new Date(selectedDate)
      const dayOfWeek = date.getDay() // 0=일, 1=월, ..., 6=토

      console.log('선택된 날짜:', selectedDate, '요일:', dayOfWeek)

      // 해당 요일에 수업이 있는 클래스들 조회
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructors!main_instructor_id(name),
          class_schedules!inner(day_of_week, start_time, end_time),
          class_students(
            student_id,
            students(id, name, phone, parent_phone)
          )
        `)
        .eq('class_schedules.day_of_week', dayOfWeek)
        .eq('status', 'active')

      if (error) throw error

      setTodayClasses(data || [])
      console.log('오늘 수업 클래스들:', data)

    } catch (err) {
      setError(err.message)
      console.error('클래스 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 요일 이름 반환
  const getDayName = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return days[date.getDay()]
  }

  // 시간 포맷팅
  const formatTime = (timeStr) => {
    return timeStr ? timeStr.slice(0, 5) : ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">출결 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 출결 관리</h1>
              <p className="mt-1 text-gray-600">
                {selectedDate} ({getDayName(selectedDate)}) 수업 {todayClasses.length}개
              </p>
            </div>
            <Link
              href="/classes"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📚 클래스 관리
            </Link>
          </div>

          {/* 날짜 선택 */}
          <div className="mt-4 flex items-center space-x-4">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              📅 출결 날짜:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex space-x-2">
              <Link href="/students" className="text-gray-600 hover:text-gray-800">
                👥 학생 관리
              </Link>
              <Link href="/classes" className="text-blue-600 hover:text-blue-800">
                📚 클래스 관리
              </Link>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 수업 목록 */}
        {todayClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getDayName(selectedDate)}에는 수업이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              다른 날짜를 선택하거나 새로운 클래스를 생성해보세요.
            </p>
            <div className="space-x-4">
              <Link
                href="/classes/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ 클래스 생성
              </Link>
              <Link
                href="/classes"
                className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                📚 클래스 목록
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {todayClasses.map((classItem) => {
              const schedule = classItem.class_schedules[0] // 해당 요일 스케줄
              const students = classItem.class_students || []
              
              return (
                <div key={classItem.id} className="bg-white rounded-lg shadow-md">
                  <div className="p-6">
                    
                    {/* 클래스 헤더 */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {classItem.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>👨‍🏫 {classItem.instructors?.name || '강사 미배정'}</span>
                          <span>🏠 {classItem.classroom || '교실 미정'}</span>
                          <span>⏰ {formatTime(schedule?.start_time)}-{formatTime(schedule?.end_time)}</span>
                          <span>👥 {students.length}명</span>
                        </div>
                      </div>
                      <Link
                        href={`/attendance/class/${classItem.id}?date=${selectedDate}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        📋 출결 체크
                      </Link>
                    </div>

                    {/* 학생 목록 미리보기 */}
                    {students.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">🎒 등록 학생:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                          {students.map((cs) => (
                            <div key={cs.student_id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              <span className="text-sm text-gray-700">{cs.students?.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>등록된 학생이 없습니다</p>
                        <Link
                          href={`/classes/${classItem.id}/students`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          학생 등록하기 →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🎯 4단계: 구현 순서 및 테스트

### 4.1 데이터베이스 먼저 설정

**Supabase SQL Editor에서 실행:**
1. 위의 모든 CREATE TABLE 문 실행
2. 샘플 데이터 INSERT 문 실행
3. 테이블 생성 및 관계 확인

### 4.2 페이지 파일 생성

```bash
# 폴더 구조 생성
src/app/classes/page.js
src/app/attendance/page.js
```

### 4.3 메인 메뉴에 링크 추가

**`src/app/page.js` 수정:**
```javascript
// 메인 페이지에 클래스 관리, 출결 관리 링크 추가
```

---

## 🚀 지금 바로 시작하세요!

**1단계: 데이터베이스 설정**
- Supabase에서 새 테이블들 생성
- 샘플 데이터 삽입

**2단계: 페이지 생성**
- 클래스 관리 페이지
- 출결 관리 페이지

**3단계: 테스트**
- 클래스 목록 확인
- 오늘 수업 목록 확인

**다음 단계 예고:**
- 클래스 생성/수정 기능
- 실제 출결 체크 기능
- 출결 통계 및 분석

**어떤 부분부터 시작하시겠어요?**
- 🗄️ **"데이터베이스부터 설정하자"**
- 📚 **"클래스 관리 페이지부터"**
- 📋 **"출결 관리 먼저"**
- 🤔 **"설계를 더 자세히 설명해줘"**

복잡하지만 체계적으로 하나씩 구축해나가면 됩니다! 🚀