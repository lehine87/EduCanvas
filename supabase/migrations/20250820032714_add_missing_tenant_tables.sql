-- tenant_subjects 테이블 생성
CREATE TABLE IF NOT EXISTS tenant_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    color VARCHAR(7), -- #RRGGBB 형식
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT tenant_subjects_name_unique UNIQUE (tenant_id, name),
    CONSTRAINT tenant_subjects_code_unique UNIQUE (tenant_id, code),
    CONSTRAINT tenant_subjects_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT tenant_subjects_display_order_range CHECK (display_order >= 0 AND display_order <= 9999)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS tenant_subjects_tenant_id_idx ON tenant_subjects(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_subjects_active_idx ON tenant_subjects(tenant_id, is_active, display_order);

-- RLS 정책 활성화
ALTER TABLE tenant_subjects ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (같은 테넌트의 데이터만 접근 가능)
CREATE POLICY tenant_subjects_isolation ON tenant_subjects
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.tenant_id = tenant_id
    )
);

-- course_packages 테이블에 display_order 컬럼 추가
ALTER TABLE course_packages 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0 NOT NULL;

-- course_packages display_order 제약조건 추가 (이미 존재하면 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_packages_display_order_range'
    ) THEN
        ALTER TABLE course_packages 
        ADD CONSTRAINT course_packages_display_order_range 
        CHECK (display_order >= 0 AND display_order <= 9999);
    END IF;
END $$;

-- course_packages에 인덱스 추가
CREATE INDEX IF NOT EXISTS course_packages_tenant_display_idx ON course_packages(tenant_id, display_order);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- tenant_subjects updated_at 트리거
DROP TRIGGER IF EXISTS update_tenant_subjects_updated_at ON tenant_subjects;
CREATE TRIGGER update_tenant_subjects_updated_at
    BEFORE UPDATE ON tenant_subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (기본 테넌트가 있는 경우)
INSERT INTO tenant_subjects (tenant_id, name, code, color, display_order, is_active)
SELECT 
    t.id,
    unnest(ARRAY['국어', '영어', '수학', '과학', '사회', '예술']),
    unnest(ARRAY['KOR', 'ENG', 'MATH', 'SCI', 'SOC', 'ART']),
    unnest(ARRAY['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']),
    generate_series(1, 6),
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_subjects ts WHERE ts.tenant_id = t.id
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 기존 course_packages에 display_order 값 설정
WITH numbered_packages AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY name) as new_order
    FROM course_packages 
    WHERE display_order = 0
)
UPDATE course_packages 
SET display_order = numbered_packages.new_order
FROM numbered_packages 
WHERE course_packages.id = numbered_packages.id;