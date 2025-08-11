-- ================================================================
-- tenant_users 테이블 생성 (외래키 제약조건 없이)
-- ================================================================
-- 실제 auth.users 데이터가 없을 때를 대비한 테스트용 테이블

-- 1. 기존 잔재 완전 정리
DO $$
BEGIN
    -- 기존 테이블 삭제 (있다면)
    DROP TABLE IF EXISTS tenant_users CASCADE;
    
    -- tenant_memberships 테이블의 제약조건 정리
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_memberships') THEN
        ALTER TABLE tenant_memberships DROP CONSTRAINT IF EXISTS unique_tenant_user;
        RAISE NOTICE '✅ tenant_memberships 제약조건 정리';
    END IF;
    
    RAISE NOTICE '✅ 기존 테이블 및 제약조건 정리 완료';
END$$;

-- 2. user_status ENUM 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
        RAISE NOTICE '✅ user_status ENUM 생성';
    ELSE
        RAISE NOTICE '✅ user_status ENUM 이미 존재';
    END IF;
END$$;

-- 3. tenant_users 테이블 생성 (외래키 제약조건 최소화)
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL, -- auth.users 참조하지만 FK 없음 (테스트용)
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    primary_role_id UUID, -- tenant_roles 참조하지만 FK 없음 (테스트용)
    additional_roles UUID[] DEFAULT ARRAY[]::UUID[],
    status user_status DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    permission_overrides JSONB DEFAULT '{}',
    cached_permissions JSONB DEFAULT '{}',
    invited_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID, -- self 참조하지만 FK 없음
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 기본 제약조건만
    CONSTRAINT uq_tenant_user_combo UNIQUE(tenant_id, user_id),
    CONSTRAINT uq_tenant_email_combo UNIQUE(tenant_id, email)
);

-- 4. tenants 참조만 외래키로 추가 (확실히 존재)
ALTER TABLE tenant_users 
ADD CONSTRAINT fk_tenant_users_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. 인덱스 생성
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_email ON tenant_users(email);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);

-- 6. RLS 활성화 및 기본 정책
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temp_allow_all_tenant_users" ON tenant_users
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. 테스트 데이터 추가 (외래키 제약 없으므로 안전)
INSERT INTO tenant_users (
    tenant_id, 
    user_id,
    email, 
    name,
    primary_role_id,
    status
) 
SELECT 
    t.id as tenant_id,
    gen_random_uuid() as user_id, -- 임시 UUID
    'admin@test.com' as email,
    'Test Admin' as name,
    tr.id as primary_role_id,
    'active'::user_status as status
FROM tenants t
CROSS JOIN tenant_roles tr 
WHERE tr.hierarchy_level IS NOT NULL
ORDER BY tr.hierarchy_level ASC
LIMIT 1;

-- 추가 테스트 사용자들
INSERT INTO tenant_users (tenant_id, user_id, email, name, status) 
SELECT 
    t.id,
    gen_random_uuid(),
    email_addr,
    user_name,
    'active'::user_status
FROM tenants t,
    (VALUES 
        ('instructor@test.com', 'Test Instructor'),
        ('staff@test.com', 'Test Staff'),
        ('viewer@test.com', 'Test Viewer')
    ) AS test_users(email_addr, user_name)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- 최종 확인
DO $$
DECLARE
    table_count INTEGER;
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_name = 'tenant_users' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO record_count FROM tenant_users;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 tenant_users 테이블 생성 성공!';
    RAISE NOTICE '📊 테이블 존재: %', CASE WHEN table_count > 0 THEN 'YES ✅' ELSE 'NO ❌' END;
    RAISE NOTICE '📝 테스트 사용자 수: %', record_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✨ 다음 단계:';
    RAISE NOTICE '1. T-005 RLS 정책 적용';
    RAISE NOTICE '2. http://localhost:3000/test-auth 테스트';
    RAISE NOTICE '3. 실제 auth.users와 연결 (나중에)';
END$$;