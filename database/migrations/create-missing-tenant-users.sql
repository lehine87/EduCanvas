-- ================================================================
-- Missing tenant_users 테이블 생성
-- ================================================================
-- 현재 데이터베이스에 tenants, tenant_roles는 있지만 tenant_users가 누락됨
-- v4.1 스키마에서 tenant_users 테이블만 추출하여 생성

-- v4.1 스키마에서 가져온 tenant_users 테이블 정의
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_user UNIQUE(tenant_id, user_id),
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email)
);

-- 필요한 ENUM 타입이 없다면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
    END IF;
END$$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(status);

-- RLS 활성화
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 (임시)
CREATE POLICY "tenant_users_all_policy" ON tenant_users
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 테스트 데이터 삽입 (선택사항)
-- 실제 auth.users에 사용자가 있다면 연결 가능
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
    '00000000-0000-0000-0000-000000000000'::uuid as user_id, -- 임시 사용자 ID
    'admin@test.com' as email,
    'Test Admin' as name,
    tr.id as primary_role_id,
    'active'::user_status as status
FROM tenants t, tenant_roles tr 
WHERE tr.name = 'admin' OR tr.hierarchy_level = 1 -- admin 또는 최고 권한 역할
LIMIT 1
ON CONFLICT DO NOTHING;

-- 성공 메시지
DO $$ 
BEGIN 
    RAISE NOTICE '✅ tenant_users 테이블이 성공적으로 생성되었습니다!';
    RAISE NOTICE '🔒 기본 RLS 정책이 적용되었습니다.';
    RAISE NOTICE '📝 테스트 사용자 데이터가 추가되었습니다.';
    RAISE NOTICE '🚀 이제 T-005 RLS 정책을 적용할 수 있습니다.';
END $$;