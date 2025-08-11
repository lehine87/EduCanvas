-- ================================================================
-- tenant_users 테이블 생성 (깔끔하게)
-- ================================================================
-- 기존 잔재 정리 후 새로 생성

-- 1. 혹시 남아있을 제약조건들 정리
DROP INDEX IF EXISTS unique_tenant_user;
DROP INDEX IF EXISTS unique_tenant_email;

-- 2. user_status ENUM 생성 (없다면)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
        RAISE NOTICE '✅ user_status ENUM 생성됨';
    ELSE
        RAISE NOTICE '✅ user_status ENUM 이미 존재';
    END IF;
END$$;

-- 3. tenant_users 테이블 생성
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    primary_role_id UUID REFERENCES tenant_roles(id),
    additional_roles UUID[] DEFAULT ARRAY[]::UUID[],
    status user_status DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    permission_overrides JSONB DEFAULT '{}',
    cached_permissions JSONB DEFAULT '{}',
    invited_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 고유 제약조건 추가 (이름 변경)
ALTER TABLE tenant_users 
ADD CONSTRAINT uq_tenant_user_combo UNIQUE(tenant_id, user_id);

ALTER TABLE tenant_users 
ADD CONSTRAINT uq_tenant_email_combo UNIQUE(tenant_id, email);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(status);

-- 6. RLS 활성화
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 7. 임시 전체 허용 정책 (테스트용)
CREATE POLICY "temp_allow_all_tenant_users" ON tenant_users
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. 테스트 데이터 추가 (있다면)
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
    '00000000-0000-0000-0000-000000000001'::uuid as user_id, -- 테스트용 UUID
    'admin@test.com' as email,
    'Test Admin' as name,
    tr.id as primary_role_id,
    'active'::user_status as status
FROM tenants t
CROSS JOIN tenant_roles tr 
WHERE tr.hierarchy_level = (SELECT MIN(hierarchy_level) FROM tenant_roles)
LIMIT 1
ON CONFLICT DO NOTHING;

-- 성공 메시지
DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ tenant_users 테이블 생성 완료!';
    RAISE NOTICE '🔒 RLS 활성화 및 임시 정책 적용';
    RAISE NOTICE '📝 테스트 데이터 추가 시도';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '이제 다음을 실행하세요:';
    RAISE NOTICE '1. 테이블 확인: SELECT * FROM tenant_users;';
    RAISE NOTICE '2. T-005 RLS 정책 적용';
    RAISE NOTICE '3. 인증 시스템 테스트';
END $$;