# EduCanvas v1 데이터베이스 구조 완전 분석

**분석 일자**: 2025-08-24  
**분석 범위**: 현재 운영 중인 Supabase 데이터베이스  
**목적**: v2 UI 전환을 위한 현재 시스템 이해

## 📊 전체 데이터베이스 개요

### 스키마 버전
- **현재 버전**: v5.0 (2025-08-22 Staff Management Integration)
- **테이블 수**: 20+ 테이블
- **주요 특징**: 멀티테넌트 아키텍처, RLS 기반 보안

### 핵심 아키텍처 특징
1. **멀티테넌트 격리**: 모든 데이터에 `tenant_id` 필수
2. **통합 사용자 관리**: `user_profiles` → `tenant_memberships` 구조
3. **Staff 통합 관리**: Instructor를 Staff로 통합 완료
4. **복합 관계**: 학생-반-등록-출결-수납의 복잡한 연관관계

## 🎓 학생 관리 핵심 테이블 분석

### 1. `students` 테이블 (핵심)

```sql
-- 학생 기본 정보 테이블
students {
  id: string (PK)
  name: string (NOT NULL)              -- 학생명 (필수)
  student_number: string (NOT NULL)    -- 학번 (필수, UNIQUE)
  
  -- 연락처 정보
  phone: string | null                 -- 학생 연락처
  email: string | null                 -- 학생 이메일
  parent_name: string | null           -- 학부모명
  parent_phone_1: string | null        -- 학부모 연락처 1
  parent_phone_2: string | null        -- 학부모 연락처 2
  
  -- 개인 정보
  birth_date: string | null            -- 생년월일
  gender: string | null                -- 성별
  address: string | null               -- 주소
  
  -- 학적 정보  
  grade_level: string | null           -- 학년 (초1, 중2, 고3 등)
  school_name: string | null           -- 현재 학교명
  
  -- 상태 관리
  status: student_status | null        -- 학생 상태 (ENUM)
  enrollment_date: string | null       -- 입학일
  
  -- 확장 필드
  notes: string | null                 -- 메모
  tags: string[] | null                -- 태그 배열
  custom_fields: Json | null           -- 커스텀 필드
  emergency_contact: Json | null       -- 긴급 연락처
  name_english: string | null          -- 영문명
  
  -- 메타데이터
  tenant_id: string | null (FK)        -- 테넌트 ID
  created_at: string | null            -- 생성일시
  created_by: string | null (FK)       -- 생성자
  updated_at: string | null            -- 수정일시
}
```

**주요 특징**:
- `name`과 `student_number`는 필수 필드
- 연락처 정보는 학생과 학부모 분리 저장
- `student_status` ENUM: `active`, `inactive`, `graduated`, `withdrawn`, `suspended`
- 확장성을 위한 `tags`, `custom_fields`, `emergency_contact` JSON 필드

### 2. `student_enrollments` 테이블 (등록/수강 정보)

```sql
-- 학생 수강 등록 정보
student_enrollments {
  id: string (PK)
  student_id: string | null (FK → students.id)
  class_id: string | null (FK → classes.id)
  package_id: string | null (FK → course_packages.id)
  
  -- 수강 기간
  enrollment_date: string | null       -- 등록일
  start_date: string | null           -- 수강 시작일
  end_date: string | null             -- 수강 종료일
  expires_at: string | null           -- 만료일
  
  -- 가격 정보
  original_price: number (NOT NULL)   -- 원가
  final_price: number (NOT NULL)      -- 최종 결제가
  discount_amount: number | null      -- 할인액
  payment_plan: string | null         -- 결제 계획
  
  -- 수강 현황
  sessions_total: number | null       -- 총 수업 횟수
  sessions_used: number | null        -- 사용한 수업 횟수  
  sessions_remaining: number | null   -- 남은 수업 횟수
  hours_total: number | null          -- 총 수업 시간
  hours_used: number | null           -- 사용한 시간
  hours_remaining: number | null      -- 남은 시간
  
  -- 성과 지표
  attendance_rate: number | null      -- 출석률
  average_grade: number | null        -- 평균 성적
  assignment_completion_rate: number | null -- 과제 완료율
  
  -- 비디오 관련 (확장 기능)
  can_download_videos: boolean | null
  video_access_expires_at: string | null
  video_watch_count: number | null
  
  -- 기타
  status: string | null               -- 등록 상태
  notes: string | null                -- 메모
  position_in_class: number | null    -- 반 내 위치
  custom_fields: Json | null          -- 커스텀 필드
  
  tenant_id: string | null (FK)
  created_at: string | null
  enrolled_by: string | null (FK)
  updated_at: string | null
}
```

### 3. `classes` 테이블 (반 정보)

```sql
-- 수업 반 정보
classes {
  id: string (PK)
  name: string (NOT NULL)              -- 반명
  
  -- 교과 정보
  subject: string | null               -- 과목
  course: string | null                -- 코스
  grade: string | null                 -- 대상 학년
  level: string | null                 -- 레벨
  
  -- 강사 및 교실
  instructor_id: string | null (FK → user_profiles.id) -- 담임강사
  classroom_id: string | null (FK)     -- 강의실
  default_classroom_id: string | null (FK) -- 기본 강의실
  
  -- 수업 설정
  max_students: number | null          -- 최대 정원
  min_students: number | null          -- 최소 정원
  start_date: string | null            -- 개강일
  end_date: string | null              -- 종강일
  
  -- 교재 및 추가 정보
  main_textbook: string | null         -- 주교재
  supplementary_textbook: string | null -- 부교재
  description: string | null           -- 반 설명
  
  -- UI 관련
  color: string | null                 -- 반 색상
  schedule_config: Json | null         -- 시간표 설정
  
  -- 상태 관리
  is_active: boolean | null            -- 활성화 여부
  
  tenant_id: string | null (FK)
  created_at: string | null
  created_by: string | null (FK)
  updated_at: string | null
  custom_fields: Json | null
}
```

**중요 관계**:
- `instructor_id` → `user_profiles.id` (강사 정보)
- 한 반에 여러 학생이 등록 (`student_enrollments` 를 통해)

### 4. `attendances` 테이블 (출결 관리)

```sql
-- 출결 정보
attendances {
  id: string (PK)
  student_id: string | null (FK → students.id)
  class_id: string | null (FK → classes.id)  
  enrollment_id: string | null (FK → student_enrollments.id)
  
  -- 출결 정보
  attendance_date: string (NOT NULL)   -- 출석일 (필수)
  status: attendance_status (NOT NULL) -- 출결 상태 (필수)
  
  -- 시간 정보
  check_in_time: string | null         -- 체크인 시간
  check_out_time: string | null        -- 체크아웃 시간
  actual_hours: number | null          -- 실제 수업 시간
  late_minutes: number | null          -- 지각 시간(분)
  
  -- 추가 정보
  notes: string | null                 -- 출결 메모
  
  tenant_id: string | null (FK)
  created_at: string | null
}
```

**출결 상태 ENUM**:
```sql
attendance_status: "present" | "absent" | "late" | "early_leave" | "excused"
```

## 👥 사용자 및 권한 관리

### 5. `user_profiles` 테이블 (사용자 기본 정보)

```sql
-- 사용자 프로필 (모든 사용자의 기본 정보)
user_profiles {
  id: string (PK, FK → auth.users.id)  -- Supabase Auth와 연동
  email: string | null                 -- 이메일
  full_name: string | null             -- 전체 이름
  avatar_url: string | null            -- 프로필 사진
  phone: string | null                 -- 연락처
  
  -- 상태 관리
  status: user_status | null           -- 사용자 상태
  last_sign_in_at: string | null       -- 마지막 로그인
  
  -- 메타데이터
  created_at: string | null
  updated_at: string | null
  custom_fields: Json | null
  
  -- 🚨 중요: tenant_id가 없음 (글로벌 사용자 정보)
}
```

### 6. `tenant_memberships` 테이블 (테넌트별 멤버십)

```sql
-- 테넌트별 사용자 역할 및 권한
tenant_memberships {
  id: string (PK)
  user_id: string | null (FK → user_profiles.id)
  tenant_id: string | null (FK → tenants.id)
  role_id: string | null (FK)          -- 역할 ID
  
  -- 권한 관리
  status: string | null                -- 멤버십 상태
  permissions_override: Json | null    -- 권한 오버라이드
  is_primary_contact: boolean | null   -- 주 담당자 여부
  
  -- 직원 정보 (Staff Integration v5.0)
  specialization: string | null        -- 전문분야
  qualification: string | null         -- 자격증
  hire_date: string | null             -- 입사일
  job_function: string | null          -- 직무
  bio: string | null                   -- 소개
  emergency_contact: string | null     -- 긴급연락처
  bank_account: string | null          -- 급여 계좌
  
  -- 초대 관리
  invited_at: string | null            -- 초대일
  invited_by: string | null (FK)       -- 초대자
  accepted_at: string | null           -- 수락일
  last_accessed_at: string | null      -- 마지막 접속일
  
  created_at: string | null
  updated_at: string | null
}
```

**핵심 아키텍처**:
1. `user_profiles`: 사용자 기본 정보 (글로벌)
2. `tenant_memberships`: 테넌트별 역할 및 권한 (멀티테넌트)
3. `classes.instructor_id` → `user_profiles.id` (직접 참조)

## 🏢 멀티테넌트 아키텍처

### 7. `tenants` 테이블 (학원 정보)

```sql
tenants {
  id: string (PK)
  name: string (NOT NULL)              -- 학원명
  slug: string | null                  -- URL 슬러그
  
  -- 설정 정보
  settings: Json | null                -- 학원별 설정
  billing_info: Json | null            -- 결제 정보
  
  -- 상태 관리
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}
```

## 📊 데이터 관계도

```
tenants (학원)
    ↓ (1:N)
user_profiles (사용자) ←→ tenant_memberships (권한)
    ↓                           ↓
students (학생)              classes (반)
    ↓                           ↓
    └── student_enrollments ────┘
              ↓
        attendances (출결)
```

## 🔒 보안 및 RLS 정책

### Row Level Security (RLS) 현황
- **활성화된 테이블**: `students`, `classes`, `student_enrollments`, `attendances`
- **비활성화**: `tenant_memberships` (v5.0 업데이트로 RLS 완전 비활성화)
- **정책**: 테넌트별 데이터 격리 정책 적용

### 접근 권한 패턴
```sql
-- 일반적인 RLS 정책 패턴
POLICY "tenant_isolation" ON students
FOR ALL TO authenticated
USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()))
```

## 🎯 v2 UI 전환 관련 주요 발견사항

### 1. 검색에 최적화된 필드들
- `students.name` (학생명) - 기본 검색
- `students.student_number` (학번) - 고유 식별
- `students.phone` (학생 연락처) - 연락처 검색
- `students.parent_phone_1`, `parent_phone_2` (학부모 연락처)

### 2. 상태 관리 시스템
```sql
student_status ENUM:
- "active"     : 재원생 (활동중)
- "inactive"   : 비활성 (휴원 등)
- "graduated"  : 졸업생
- "withdrawn"  : 퇴학생  
- "suspended"  : 정지
```

### 3. 확장성 필드들
- `tags: string[]` - 태그 기반 분류
- `custom_fields: Json` - 커스텀 필드 확장
- `emergency_contact: Json` - 구조화된 긴급연락처

### 4. 성능 고려사항
- `student_number`은 UNIQUE 제약으로 빠른 검색 가능
- `tenant_id` 인덱스로 멀티테넌트 성능 보장
- JSON 필드들은 GIN 인덱스 필요할 수 있음

## 📈 데이터 볼륨 추정

### 예상 데이터 크기 (중형 학원 기준)
- **학생**: ~1,000명
- **반**: ~50개
- **등록**: ~1,500건 (학생당 1.5반 평균)
- **출결**: ~30,000건/월 (수업일 20일 x 1,500 등록)

### 검색 성능 고려사항
- 이름 검색: Full-text search 필요 시 `to_tsvector` 활용
- 전화번호 검색: LIKE 패턴 매칭 (인덱스 필요)
- 복합 검색: 여러 필드 동시 검색 최적화 필요

## 🚨 v2 전환 시 주의사항

### 1. 필수 검증 필드
- `students.name` (필수)
- `students.student_number` (필수, 고유)
- `attendances.attendance_date` (필수)
- `attendances.status` (필수)

### 2. 관계 무결성
- `classes.instructor_id` → `user_profiles.id` (NOT `tenant_memberships`)
- `student_enrollments`의 복합 FK 관계 유지

### 3. 멀티테넌트 격리
- 모든 데이터 조회 시 `tenant_id` 필터 필수
- `tenant_memberships` RLS 비활성화 상태 유지

### 4. JSON 필드 처리
- `custom_fields`, `emergency_contact` 등의 동적 스키마 처리
- TypeScript 타입 안전성 확보 필요

## 📝 결론

현재 EduCanvas v1 데이터베이스는:

✅ **장점**:
- 완전한 멀티테넌트 아키텍처
- 유연한 확장성 (JSON 필드, 태그 시스템)  
- 체계적인 관계형 설계
- 보안성 (RLS 기반 격리)

⚠️ **v2 UI 전환 고려사항**:
- 복잡한 JOIN 관계로 인한 쿼리 최적화 필요
- JSON 필드의 타입 안전성 확보
- 대용량 데이터에서의 검색 성능
- 실시간 업데이트를 위한 구독 설계

**다음 단계**: 이 스키마 분석을 기반으로 v2 UI의 데이터 로딩 및 검색 전략을 수립해야 함.