-- ================================================================
-- tenant_users 테이블 생성 (기존 잔재 완전 정리)
-- ================================================================

-- 1. 기존 잔재 완전 정리
DO $$
BEGIN
    -- tenant_memberships 테이블의 제약조건 정리
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_memberships') THEN
        ALTER TABLE tenant_memberships DROP CONSTRAINT IF EXISTS unique_tenant_user;
        RAISE NOTICE '✅ tenant_memberships의 unique_tenant_user 제약조건 제거';
    END IF;
    
    -- 인덱스 정리
    DROP INDEX IF EXISTS unique_tenant_user;
    DROP INDEX IF EXISTS unique_tenant_email;
    
    RAISE NOTICE '✅ 기존 잔재 정리 완료';
END$$;

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

-- 3. tenant_users 테이블이 이미 존재하는지 확인
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users' AND table_schema = 'public') THEN
        RAISE NOTICE '⚠️  tenant_users 테이블이 이미 존재합니다. 건너뜁니다.';
    ELSE
        -- 테이블 생성
        CREATE TABLE tenant_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            avatar_url TEXT,
            phone VARCHAR(20),
            primary_role_id UUID,
            additional_roles UUID[] DEFAULT ARRAY[]::UUID[],
            status user_status DEFAULT 'active',
            last_login_at TIMESTAMP WITH TIME ZONE,
            login_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP WITH TIME ZONE,
            password_changed_at TIMESTAMP WITH TIME ZONE,
            permission_overrides JSONB DEFAULT '{}',
            cached_permissions JSONB DEFAULT '{}',
            invited_at TIMESTAMP WITH TIME ZONE,
            invited_by UUID,
            accepted_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ tenant_users 테이블 생성 완료';
    END IF;
END$$;

-- 4. 외래키 제약조건 추가 (안전하게)
DO $$
BEGIN
    -- tenants 참조
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'tenant_users' AND constraint_name = 'fk_tenant_users_tenant_id') THEN
        ALTER TABLE tenant_users ADD CONSTRAINT fk_tenant_users_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ tenants 외래키 추가';
    END IF;
    
    -- tenant_roles 참조
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'tenant_users' AND constraint_name = 'fk_tenant_users_role_id') THEN
        ALTER TABLE tenant_users ADD CONSTRAINT fk_tenant_users_role_id 
            FOREIGN KEY (primary_role_id) REFERENCES tenant_roles(id);
        RAISE NOTICE '✅ tenant_roles 외래키 추가';
    END IF;
    
    -- auth.users 참조 (존재한다면)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'tenant_users' AND constraint_name = 'fk_tenant_users_user_id') THEN
            ALTER TABLE tenant_users ADD CONSTRAINT fk_tenant_users_user_id 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ auth.users 외래키 추가';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  auth.users 테이블이 없어서 외래키를 건너뜁니다';
    END IF;
END$$;

-- 5. 고유 제약조건 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'tenant_users' AND constraint_name = 'uq_tenant_user_combo') THEN
        ALTER TABLE tenant_users ADD CONSTRAINT uq_tenant_user_combo UNIQUE(tenant_id, user_id);
        RAISE NOTICE '✅ tenant-user 고유 제약조건 추가';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'tenant_users' AND constraint_name = 'uq_tenant_email_combo') THEN
        ALTER TABLE tenant_users ADD CONSTRAINT uq_tenant_email_combo UNIQUE(tenant_id, email);
        RAISE NOTICE '✅ tenant-email 고유 제약조건 추가';
    END IF;
END$$;

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(status);

-- 7. RLS 활성화
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 8. 기본 정책 생성 (임시)
DROP POLICY IF EXISTS "temp_allow_all_tenant_users" ON tenant_users;
CREATE POLICY "temp_allow_all_tenant_users" ON tenant_users
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 9. 테스트 데이터 추가
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
    gen_random_uuid() as user_id, -- 랜덤 UUID (auth.users 연결 전까지 임시)
    'test@educanvas.com' as email,
    'Test User' as name,
    tr.id as primary_role_id,
    'active'::user_status as status
FROM tenants t
CROSS JOIN tenant_roles tr 
WHERE tr.hierarchy_level = (SELECT MIN(hierarchy_level) FROM tenant_roles WHERE tenant_id = t.id)
LIMIT 1
ON CONFLICT (tenant_id, email) DO NOTHING;

-- 최종 확인
DO $$
DECLARE
    table_count INTEGER;
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_name = 'tenant_users';
    SELECT COUNT(*) INTO record_count FROM tenant_users;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 tenant_users 테이블 설정 완료!';
    RAISE NOTICE '📊 테이블 존재: %', CASE WHEN table_count > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '📝 레코드 수: %', record_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '1. SELECT * FROM tenant_users; (확인)';
    RAISE NOTICE '2. T-005 RLS 정책 적용';
    RAISE NOTICE '3. 인증 시스템 테스트';
END$$;