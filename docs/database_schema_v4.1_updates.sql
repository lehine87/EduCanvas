-- EduCanvas 데이터베이스 스키마 v4.1 업데이트
-- 작성일: 2025-08-11
-- 기준: v4.0에서 실제 운영 중 발견된 스키마 갭 해결

-- ================================================================
-- v4.1 주요 변경사항:
-- 1. Students 테이블: 복수 학부모 연락처 지원
-- 2. Classes 테이블: 학년 및 과정 정보 추가
-- 3. 실제 운영 요구사항 반영
-- ================================================================

-- ================================================================
-- 1. Students 테이블 확장 (복수 학부모 연락처)
-- ================================================================

-- 기존 스키마 (v4.0)에서 변경된 컬럼들:
-- parent_phone VARCHAR(20) NOT NULL → parent_phone_1, parent_phone_2로 분리

-- 수정된 Students 테이블 정의:
/*
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),                      -- 학생 이메일 (v4.1 추가)
    
    -- 학부모 정보 (v4.1 확장)
    parent_name VARCHAR(100),                -- 주 보호자 이름
    parent_phone_1 VARCHAR(20),             -- 첫 번째 연락처 (엄마/아빠)
    parent_phone_2 VARCHAR(20),             -- 두 번째 연락처 (엄마/아빠)
    
    -- 학습 정보
    grade VARCHAR(20),                       -- 학년 (초1, 중2, 고3 등)
    class_id UUID REFERENCES classes(id),
    status student_status DEFAULT 'active',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    position_in_class INTEGER DEFAULT 0,
    display_color VARCHAR(7),
    memo TEXT,
    
    -- 메타 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_student_position UNIQUE(tenant_id, class_id, position_in_class)
);
*/

-- 실제 적용된 컬럼 추가 명령:
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS parent_phone_1 VARCHAR(20),
ADD COLUMN IF NOT EXISTS parent_phone_2 VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ================================================================
-- 2. Classes 테이블 확장 (학년 및 과정 정보)
-- ================================================================

-- 기존 스키마에서 부족했던 학년/과정 구분 정보 추가

-- 수정된 Classes 테이블 정의:
/*
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    
    -- 학년 및 과정 정보 (v4.1 추가)
    grade VARCHAR(20),                       -- 대상 학년 (초1, 중2, 고3 등)
    course VARCHAR(100),                     -- 과정명 (기초반, 심화반, 특별반 등)
    
    -- 클래스 설정
    max_students INTEGER DEFAULT 20,
    min_students INTEGER,
    level VARCHAR(50),                       -- 난이도 수준
    description TEXT,
    
    -- 운영 정보
    instructor_id UUID REFERENCES user_profiles(id),
    classroom_id UUID,                       -- 교실 참조
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    
    -- 스케줄 설정
    schedule_config JSONB DEFAULT '{}',      -- 시간표 설정
    custom_fields JSONB DEFAULT '{}',        -- 커스텀 필드
    
    -- 메타 정보
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_class_name UNIQUE(tenant_id, name)
);
*/

-- 실제 적용된 컬럼 추가 명령:
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS grade VARCHAR(20),
ADD COLUMN IF NOT EXISTS course VARCHAR(100);

-- ================================================================
-- 3. 데이터 마이그레이션 (필요시)
-- ================================================================

-- 기존 parent_phone 데이터를 parent_phone_1으로 이전
-- UPDATE students 
-- SET parent_phone_1 = parent_phone 
-- WHERE parent_phone IS NOT NULL AND parent_phone_1 IS NULL;

-- 기본 과정명 설정 (기존 클래스들)
-- UPDATE classes 
-- SET course = '정규과정'
-- WHERE course IS NULL;

-- ================================================================
-- 4. 인덱스 최적화 (성능 향상)
-- ================================================================

-- 학부모 연락처 검색 최적화
CREATE INDEX IF NOT EXISTS idx_students_parent_phone_1 ON students(tenant_id, parent_phone_1);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone_2 ON students(tenant_id, parent_phone_2);

-- 학년별 클래스 검색 최적화
CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(tenant_id, grade);
CREATE INDEX IF NOT EXISTS idx_classes_course ON classes(tenant_id, course);

-- 학년별 학생 검색 최적화
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(tenant_id, grade);

-- ================================================================
-- 5. 업데이트된 제약조건 및 검증
-- ================================================================

-- 학부모 연락처 유효성 검증 (적어도 하나는 필수)
ALTER TABLE students 
ADD CONSTRAINT check_parent_phone_exists 
CHECK (parent_phone_1 IS NOT NULL OR parent_phone_2 IS NOT NULL);

-- 학년 형식 검증 (예: 초1, 중2, 고3)
ALTER TABLE students
ADD CONSTRAINT check_grade_format
CHECK (grade IS NULL OR grade ~ '^(초[1-6]|중[1-3]|고[1-3]|기타)$');

ALTER TABLE classes
ADD CONSTRAINT check_class_grade_format  
CHECK (grade IS NULL OR grade ~ '^(초[1-6]|중[1-3]|고[1-3]|전체|기타)$');

-- ================================================================
-- 6. 샘플 데이터 (테스트용)
-- ================================================================

-- 업데이트된 스키마에 맞는 샘플 데이터는 correct_sample_data.sql 참조

-- ================================================================
-- 7. v4.1 변경 로그
-- ================================================================

/*
변경 일시: 2025-08-11
변경 사유: T-005 샘플 데이터 생성 중 실제 운영 요구사항 발견

주요 변경사항:
1. Students.parent_phone_1, parent_phone_2 컬럼 추가
2. Students.parent_name, email 컬럼 추가  
3. Classes.grade, course 컬럼 추가
4. 관련 인덱스 및 제약조건 추가

영향받는 코드:
- TypeScript 타입 정의 (재생성 필요)
- 학생 등록/수정 폼 컴포넌트
- 클래스 생성/관리 폼 컴포넌트
- ClassFlow UI (학년별 표시)
- 검색 및 필터링 로직

마이그레이션 전략:
- 기존 데이터 호환성 유지
- 점진적 업데이트 (새 컬럼은 NULL 허용)
- UI는 단계적 적용
*/