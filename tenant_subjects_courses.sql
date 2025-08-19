-- ============================================================================
-- 학원별 과목/과정 설정 테이블 생성
-- ============================================================================

-- 1. 학원별 과목 설정 테이블
CREATE TABLE IF NOT EXISTS tenant_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50), -- 과목 코드 (예: MATH, ENG, KOR)
    description TEXT,
    color VARCHAR(7), -- 색상 코드 (#RRGGBB)
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0, -- 표시 순서
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_subject_name UNIQUE (tenant_id, name),
    CONSTRAINT unique_tenant_subject_code UNIQUE (tenant_id, code),
    CONSTRAINT valid_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- 2. 학원별 과정 설정 테이블
CREATE TABLE IF NOT EXISTS tenant_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50), -- 과정 코드 (예: REG, ADV, BASIC)
    description TEXT,
    color VARCHAR(7), -- 색상 코드 (#RRGGBB)
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0, -- 표시 순서
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_course_name UNIQUE (tenant_id, name),
    CONSTRAINT unique_tenant_course_code UNIQUE (tenant_id, code),
    CONSTRAINT valid_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- 인덱스 생성
-- ============================================================================

-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_tenant_subjects_tenant_id ON tenant_subjects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subjects_active ON tenant_subjects(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_subjects_order ON tenant_subjects(tenant_id, display_order);

CREATE INDEX IF NOT EXISTS idx_tenant_courses_tenant_id ON tenant_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_courses_active ON tenant_courses(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_courses_order ON tenant_courses(tenant_id, display_order);

-- ============================================================================
-- RLS (Row Level Security) 정책 설정
-- ============================================================================

-- RLS 활성화
ALTER TABLE tenant_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_courses ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 사용자는 자신의 테넌트 데이터만 접근 가능
CREATE POLICY tenant_subjects_tenant_isolation ON tenant_subjects
    FOR ALL 
    USING (
        tenant_id IN (
            SELECT up.tenant_id 
            FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY tenant_courses_tenant_isolation ON tenant_courses
    FOR ALL 
    USING (
        tenant_id IN (
            SELECT up.tenant_id 
            FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
    );

-- ============================================================================
-- 기본 데이터 삽입 (예시)
-- ============================================================================

-- 테넌트별 기본 과목 데이터 (예시 - 실제 테넌트 ID로 교체 필요)
INSERT INTO tenant_subjects (tenant_id, name, code, color, display_order) VALUES
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '국어', 'KOR', '#3B82F6', 1),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '영어', 'ENG', '#10B981', 2),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '수학', 'MATH', '#F59E0B', 3),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '과학', 'SCI', '#EF4444', 4),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '사회', 'SOC', '#8B5CF6', 5),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '역사', 'HIS', '#06B6D4', 6)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 테넌트별 기본 과정 데이터 (예시 - 실제 테넌트 ID로 교체 필요)
INSERT INTO tenant_courses (tenant_id, name, code, color, display_order) VALUES
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '정규과정', 'REG', '#3B82F6', 1),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '특별과정', 'SPEC', '#10B981', 2),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '심화과정', 'ADV', '#F59E0B', 3),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '기초과정', 'BASIC', '#EF4444', 4),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '입시과정', 'EXAM', '#8B5CF6', 5),
('1ff74e4e-2e8e-46b1-9b1a-1234567890ab', '방학특강', 'VACATION', '#06B6D4', 6)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ============================================================================
-- 트리거 함수: updated_at 자동 갱신
-- ============================================================================

-- updated_at 자동 갱신 트리거 함수 (기존에 없는 경우만)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_tenant_subjects_updated_at
    BEFORE UPDATE ON tenant_subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_courses_updated_at
    BEFORE UPDATE ON tenant_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 보안 제약조건
-- ============================================================================

-- 과목명/과정명 길이 제한
ALTER TABLE tenant_subjects ADD CONSTRAINT subject_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100);
ALTER TABLE tenant_courses ADD CONSTRAINT course_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100);

-- 표시 순서 유효성 검사
ALTER TABLE tenant_subjects ADD CONSTRAINT valid_display_order CHECK (display_order >= 0 AND display_order <= 9999);
ALTER TABLE tenant_courses ADD CONSTRAINT valid_display_order CHECK (display_order >= 0 AND display_order <= 9999);

-- ============================================================================
-- 성공 메시지
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ 학원별 과목/과정 설정 테이블이 성공적으로 생성되었습니다.';
    RAISE NOTICE '📋 생성된 테이블: tenant_subjects, tenant_courses';
    RAISE NOTICE '🔒 RLS 정책 적용 완료';
    RAISE NOTICE '📊 인덱스 및 제약조건 설정 완료';
END $$;