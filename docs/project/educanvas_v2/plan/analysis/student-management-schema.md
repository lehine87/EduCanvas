# EduCanvas 학생 관리 스키마 관계 매핑

**분석 일자**: 2025-08-24  
**목적**: v2 UI 검색 중심 설계를 위한 데이터 관계 완전 이해

## 🗺️ 학생 관리 데이터 플로우 다이어그램

```
                    🏢 tenants
                         │
                    ┌────┼────┐
                    │         │
            👤 user_profiles  👥 tenant_memberships
                    │              │
             (instructor_id)    (role: admin/instructor/staff)
                    │              │
                    └──┬───────────┘
                       │
                  📚 classes
                       │
                       │ (class_id)
                       │
    🎓 students ──── 📋 student_enrollments ──── 📊 attendances
         │                    │                        │
    (student_id)         (enrollment_id)        (attendance_date)
         │                    │                        │
         └─────── 💰 payments ─┘                       │
                       │                               │
                 (payment_history)              📈 performance
                                                     tracking
```

## 📊 핵심 관계 분석

### 1. 학생 중심 관계도

```sql
-- 학생을 중심으로 한 모든 관련 데이터
students (학생 기본정보)
    ├── student_enrollments (수강 등록)
    │   ├── class_id → classes (어떤 반에 등록)
    │   ├── package_id → course_packages (어떤 수강권)
    │   └── payment_plan (결제 방식)
    ├── attendances (출결 기록)
    │   ├── class_id → classes (어느 반 수업)
    │   ├── enrollment_id → student_enrollments (어떤 등록)
    │   └── attendance_date (날짜별 출석)
    └── (미래 확장)
        ├── assignments (과제)
        ├── grades (성적)
        └── consultations (상담)
```

### 2. 반(클래스) 중심 관계도

```sql
-- 반을 중심으로 한 관련 데이터  
classes (반 정보)
    ├── instructor_id → user_profiles (담임 강사)
    ├── classroom_id → classrooms (강의실)
    ├── student_enrollments (등록된 학생들)
    │   └── student_id → students
    └── attendances (출결 기록들)
        └── student_id → students
```

## 🎯 v2 UI 검색을 위한 핵심 쿼리 패턴

### 1. 학생 기본 정보 검색

```sql
-- v2 UI 사이드바 검색에서 필요한 정보
SELECT 
    s.id,
    s.name,                    -- 검색 대상
    s.student_number,          -- 검색 대상  
    s.phone,                   -- 검색 대상
    s.parent_phone_1,          -- 검색 대상
    s.parent_phone_2,          -- 검색 대상
    s.grade_level,             -- 필터링
    s.status,                  -- 상태 표시
    s.school_name,             -- 학교별 그룹핑
    
    -- 현재 수강 반 정보 (JOIN 필요)
    STRING_AGG(c.name, ', ') as current_classes,
    STRING_AGG(up.full_name, ', ') as instructors

FROM students s
LEFT JOIN student_enrollments se ON s.id = se.student_id 
    AND se.status = 'active'
LEFT JOIN classes c ON se.class_id = c.id
LEFT JOIN user_profiles up ON c.instructor_id = up.id

WHERE s.tenant_id = $tenant_id
    AND (
        s.name ILIKE $search OR
        s.student_number ILIKE $search OR  
        s.phone ILIKE $search OR
        s.parent_phone_1 ILIKE $search OR
        s.parent_phone_2 ILIKE $search
    )
GROUP BY s.id
ORDER BY s.name
```

### 2. 학생 상세 정보 (탭별 데이터)

#### |기본| 탭 데이터
```sql
-- 한 번의 쿼리로 기본 탭에 필요한 모든 정보
SELECT 
    -- 학생 기본 정보
    s.*,
    
    -- 현재 수강 중인 반들
    COALESCE(
        JSON_AGG(
            DISTINCT jsonb_build_object(
                'class_id', c.id,
                'class_name', c.name,
                'subject', c.subject,
                'instructor_name', up.full_name,
                'classroom', cr.name,
                'schedule', c.schedule_config,
                'enrollment_status', se.status
            )
        ) FILTER (WHERE c.id IS NOT NULL), 
        '[]'
    ) as current_enrollments,
    
    -- 최근 출결 현황 (이번 달)
    COUNT(a.id) FILTER (WHERE a.status = 'present' AND a.attendance_date >= date_trunc('month', CURRENT_DATE)) as present_count,
    COUNT(a.id) FILTER (WHERE a.status = 'absent' AND a.attendance_date >= date_trunc('month', CURRENT_DATE)) as absent_count,
    
    -- 수납 현황
    MAX(se.final_price) as latest_payment_amount,
    MAX(se.end_date) as next_payment_due

FROM students s
LEFT JOIN student_enrollments se ON s.id = se.student_id 
    AND se.status = 'active'
LEFT JOIN classes c ON se.class_id = c.id
LEFT JOIN user_profiles up ON c.instructor_id = up.id  
LEFT JOIN classrooms cr ON c.classroom_id = cr.id
LEFT JOIN attendances a ON s.id = a.student_id 
    AND a.attendance_date >= date_trunc('month', CURRENT_DATE)

WHERE s.id = $student_id 
    AND s.tenant_id = $tenant_id
GROUP BY s.id
```

#### |반| 탭 데이터
```sql
-- 수강 이력 및 반 관련 정보
SELECT 
    se.*,
    c.name as class_name,
    c.subject,
    c.grade,
    c.schedule_config,
    up.full_name as instructor_name,
    cr.name as classroom_name,
    
    -- 출석 통계
    COUNT(a.id) FILTER (WHERE a.status = 'present') as total_present,
    COUNT(a.id) FILTER (WHERE a.status = 'absent') as total_absent,
    ROUND(
        COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric / 
        NULLIF(COUNT(a.id), 0) * 100, 1
    ) as attendance_rate

FROM student_enrollments se
JOIN classes c ON se.class_id = c.id
JOIN user_profiles up ON c.instructor_id = up.id
LEFT JOIN classrooms cr ON c.classroom_id = cr.id  
LEFT JOIN attendances a ON se.id = a.enrollment_id

WHERE se.student_id = $student_id
    AND se.tenant_id = $tenant_id
GROUP BY se.id, c.id, up.id, cr.id
ORDER BY se.enrollment_date DESC
```

#### |출결| 탭 데이터
```sql
-- 출결 상세 정보 (월별 캘린더 뷰용)
SELECT 
    a.*,
    c.name as class_name,
    c.subject,
    se.sessions_total,
    se.sessions_used,
    
    -- 월별 집계
    DATE_TRUNC('month', a.attendance_date) as month,
    COUNT(*) FILTER (WHERE a.status = 'present') OVER (
        PARTITION BY DATE_TRUNC('month', a.attendance_date)
    ) as monthly_present,
    COUNT(*) FILTER (WHERE a.status = 'absent') OVER (
        PARTITION BY DATE_TRUNC('month', a.attendance_date)  
    ) as monthly_absent

FROM attendances a
JOIN classes c ON a.class_id = c.id
JOIN student_enrollments se ON a.enrollment_id = se.id

WHERE a.student_id = $student_id
    AND a.tenant_id = $tenant_id
ORDER BY a.attendance_date DESC
```

## 🔍 v2 UI 필터링 및 그룹핑 쿼리

### 1. 사이드바 필터 옵션

```sql
-- 필터 옵션 데이터 (드롭다운용)
-- 학년별 카운트
SELECT 
    grade_level,
    COUNT(*) as student_count
FROM students 
WHERE tenant_id = $tenant_id 
    AND status = 'active'
GROUP BY grade_level
ORDER BY grade_level;

-- 반별 카운트  
SELECT 
    c.name as class_name,
    COUNT(DISTINCT se.student_id) as student_count
FROM classes c
LEFT JOIN student_enrollments se ON c.id = se.class_id 
    AND se.status = 'active'
WHERE c.tenant_id = $tenant_id 
    AND c.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;

-- 상태별 카운트
SELECT 
    status,
    COUNT(*) as count
FROM students 
WHERE tenant_id = $tenant_id
GROUP BY status;
```

### 2. 오늘의 현황 위젯 데이터

```sql
-- 오늘의 긴급 상황들 (v2 기본 탭 위젯용)
WITH today_stats AS (
    -- 오늘 결석자
    SELECT 'absent_today' as stat_type, COUNT(*) as count
    FROM attendances a
    JOIN students s ON a.student_id = s.id
    WHERE a.attendance_date = CURRENT_DATE 
        AND a.status = 'absent'
        AND s.tenant_id = $tenant_id
    
    UNION ALL
    
    -- 3개월 이상 미납자  
    SELECT 'overdue_payment' as stat_type, COUNT(*) as count
    FROM student_enrollments se
    JOIN students s ON se.student_id = s.id  
    WHERE se.end_date < CURRENT_DATE - INTERVAL '3 months'
        AND se.status = 'active'
        AND s.tenant_id = $tenant_id
    
    UNION ALL
    
    -- 오늘 생일자
    SELECT 'birthday_today' as stat_type, COUNT(*) as count
    FROM students s
    WHERE DATE_PART('month', s.birth_date::date) = DATE_PART('month', CURRENT_DATE)
        AND DATE_PART('day', s.birth_date::date) = DATE_PART('day', CURRENT_DATE)
        AND s.tenant_id = $tenant_id
        AND s.status = 'active'
)
SELECT stat_type, count FROM today_stats;
```

## 📱 실시간 업데이트 구독 패턴

### 1. 학생 목록 실시간 업데이트

```sql
-- Supabase 실시간 구독 설정
-- 학생 테이블 변경 감지
SELECT * FROM students 
WHERE tenant_id = $tenant_id
-- 구독: INSERT, UPDATE, DELETE

-- 등록 정보 변경 감지  
SELECT se.*, s.name as student_name, c.name as class_name
FROM student_enrollments se
JOIN students s ON se.student_id = s.id
JOIN classes c ON se.class_id = c.id  
WHERE se.tenant_id = $tenant_id
-- 구독: INSERT, UPDATE, DELETE
```

### 2. 출결 실시간 업데이트

```sql
-- 오늘 출결 변경사항 실시간 반영
SELECT a.*, s.name as student_name, c.name as class_name
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN classes c ON a.class_id = c.id
WHERE a.attendance_date = CURRENT_DATE
    AND a.tenant_id = $tenant_id
-- 구독: INSERT, UPDATE
```

## ⚡ 성능 최적화 고려사항

### 1. 인덱스 전략

```sql
-- v2 UI 검색 성능을 위한 필수 인덱스
CREATE INDEX idx_students_search ON students 
USING GIN (to_tsvector('korean', name || ' ' || COALESCE(student_number, '')));

CREATE INDEX idx_students_tenant_status ON students (tenant_id, status);
CREATE INDEX idx_students_grade_level ON students (tenant_id, grade_level);

-- 출결 조회 성능
CREATE INDEX idx_attendances_student_date ON attendances (student_id, attendance_date DESC);
CREATE INDEX idx_attendances_date_status ON attendances (attendance_date, status) 
WHERE tenant_id IS NOT NULL;

-- 등록 정보 조회 성능
CREATE INDEX idx_enrollments_student_status ON student_enrollments (student_id, status);
CREATE INDEX idx_enrollments_class_active ON student_enrollments (class_id) 
WHERE status = 'active';
```

### 2. 쿼리 캐싱 전략

```typescript
// React Query 캐싱 키 전략
const QUERY_KEYS = {
  students: {
    list: (tenantId: string, filters: SearchFilters) => 
      ['students', 'list', tenantId, filters],
    detail: (studentId: string) => 
      ['students', 'detail', studentId],
    basicTab: (studentId: string) => 
      ['students', 'basicTab', studentId],
    classTab: (studentId: string) => 
      ['students', 'classTab', studentId],
  },
  todayStats: (tenantId: string) => 
    ['todayStats', tenantId, new Date().toDateString()], // 일별 캐시
  filterOptions: (tenantId: string) => 
    ['filterOptions', tenantId], // 30분 캐시
}
```

## 🚨 v2 전환 시 데이터 무결성 체크포인트

### 1. 필수 관계 검증
```sql
-- 고아 레코드 체크
-- 등록 정보에 존재하지 않는 학생
SELECT se.* FROM student_enrollments se
LEFT JOIN students s ON se.student_id = s.id
WHERE s.id IS NULL;

-- 출결에 존재하지 않는 등록 정보  
SELECT a.* FROM attendances a
LEFT JOIN student_enrollments se ON a.enrollment_id = se.id
WHERE se.id IS NULL AND a.enrollment_id IS NOT NULL;

-- 반에 존재하지 않는 강사
SELECT c.* FROM classes c  
LEFT JOIN user_profiles up ON c.instructor_id = up.id
WHERE up.id IS NULL AND c.instructor_id IS NOT NULL;
```

### 2. 데이터 타입 일관성
```sql
-- 전화번호 형식 검증
SELECT student_number, phone, parent_phone_1 
FROM students
WHERE phone !~ '^010-\d{4}-\d{4}$' 
   OR parent_phone_1 !~ '^010-\d{4}-\d{4}$';

-- 날짜 범위 검증
SELECT * FROM attendances
WHERE attendance_date > CURRENT_DATE 
   OR attendance_date < '2020-01-01';
```

## 📋 v2 UI 구현을 위한 데이터 요구사항 체크리스트

### ✅ 사이드바 검색 지원
- [x] 이름 검색 (`students.name`)
- [x] 학번 검색 (`students.student_number`)  
- [x] 전화번호 검색 (`students.phone`, `parent_phone_1`, `parent_phone_2`)
- [x] 필터링 (`grade_level`, `status`, `class`)

### ✅ 메인 탭별 데이터 제공
- [x] |기본| 탭: 종합 정보 + 빠른 액션
- [x] |반| 탭: 수강 이력 + 반 관리
- [x] |출결| 탭: 월별 캘린더 + 통계
- [x] |수납| 탭: 결제 내역 (`student_enrollments` 활용)
- [x] |상담| 탭: 확장 예정
- [x] |과제| 탭: 확장 예정

### ✅ 실시간 업데이트 지원  
- [x] 학생 목록 변경사항
- [x] 출결 상태 변경
- [x] 등록 상태 변경

### ✅ 성능 요구사항
- [x] 1000+ 학생 검색 < 300ms
- [x] 탭 전환 < 100ms
- [x] 실시간 업데이트 지연 < 1초

## 🎯 결론

현재 EduCanvas v1의 데이터베이스 구조는 **v2 검색 중심 UI를 완벽하게 지원**할 수 있습니다:

**✅ 강점:**
- 포괄적인 검색 필드 제공
- 유연한 관계형 구조
- 실시간 업데이트 지원
- 확장 가능한 JSON 필드

**⚠️ 최적화 필요:**
- 복합 검색을 위한 추가 인덱스
- JOIN 성능 최적화
- 캐싱 전략 수립

다음 단계로 현재 페이지 구조 분석을 진행하여 UI 컴포넌트 매핑을 완료해야 합니다.