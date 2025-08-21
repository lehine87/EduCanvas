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