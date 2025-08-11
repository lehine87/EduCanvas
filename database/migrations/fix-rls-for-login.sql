-- ================================================================
-- RLS 정책 수정: 로그인 시 테넌트 접근 허용
-- ================================================================
-- 로그인 과정에서 사용자가 자신의 테넌트에 접근할 수 있도록 임시 정책 추가

-- 1. 기존 정책들 확인 및 삭제
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON tenants;
DROP POLICY IF EXISTS "temp_allow_all_tenants" ON tenants;

-- 2. 인증된 사용자가 자신이 속한 테넌트에만 접근할 수 있는 정책
CREATE POLICY "authenticated_user_tenant_access" ON tenants
  FOR SELECT 
  TO authenticated
  USING (
    -- 로그인한 사용자가 해당 테넌트에 속해 있는 경우만 허용
    id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
    OR
    -- 개발자/관리자는 모든 테넌트 접근 가능 (이메일 기반)
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        email LIKE '%admin@test.com%' 
        OR email LIKE '%@dev.%'
        OR email LIKE '%developer@%'
      )
    )
  );

-- 3. tenant_roles 테이블 정책 수정
DROP POLICY IF EXISTS "tenant_isolation_roles" ON tenant_roles;

CREATE POLICY "authenticated_user_roles_access" ON tenant_roles
  FOR SELECT 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
    OR
    -- 개발자는 모든 역할 조회 가능
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        email LIKE '%admin@test.com%' 
        OR email LIKE '%@dev.%'
        OR email LIKE '%developer@%'
      )
    )
  );

-- 4. tenant_users 테이블 정책 수정 (자기 자신은 항상 볼 수 있어야 함)
DROP POLICY IF EXISTS "tenant_users_select_policy" ON tenant_users;
DROP POLICY IF EXISTS "temp_allow_all_tenant_users" ON tenant_users;

CREATE POLICY "authenticated_user_tenant_users_access" ON tenant_users
  FOR SELECT
  TO authenticated
  USING (
    -- 자신의 레코드는 항상 접근 가능
    user_id = auth.uid()
    OR
    -- 같은 테넌트 사용자들 조회 (기존 로직)
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- 5. 성공 메시지
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS 정책이 로그인 친화적으로 수정되었습니다!';
    RAISE NOTICE '🔑 이제 authenticated 사용자는 자신의 테넌트에 접근할 수 있습니다.';
    RAISE NOTICE '👨‍💻 admin@test.com 같은 개발자는 모든 테넌트에 접근 가능합니다.';
    RAISE NOTICE '🚀 http://localhost:3001/test-auth 에서 로그인을 테스트하세요!';
END $$;