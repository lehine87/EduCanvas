-- 1단계: course_packages에 display_order 컬럼 추가
ALTER TABLE course_packages 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0 NOT NULL;

-- 2단계: tenant_subjects 테이블 생성
CREATE TABLE IF NOT EXISTS tenant_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    color VARCHAR(7),
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3단계: 제약조건 추가 (한 번에 하나씩 실행)
ALTER TABLE tenant_subjects 
ADD CONSTRAINT tenant_subjects_name_unique UNIQUE (tenant_id, name);

ALTER TABLE tenant_subjects 
ADD CONSTRAINT tenant_subjects_code_unique UNIQUE (tenant_id, code);

-- 4단계: RLS 정책 활성화
ALTER TABLE tenant_subjects ENABLE ROW LEVEL SECURITY;

-- 5단계: RLS 정책 생성
CREATE POLICY tenant_subjects_isolation ON tenant_subjects
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.tenant_id = tenant_id
    )
);

-- 6단계: 인덱스 생성
CREATE INDEX IF NOT EXISTS tenant_subjects_tenant_id_idx ON tenant_subjects(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_subjects_active_idx ON tenant_subjects(tenant_id, is_active, display_order);