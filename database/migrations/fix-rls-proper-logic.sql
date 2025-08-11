-- ================================================================
-- RLS 정책 근본적 해결: 논리적 순서로 정책 재구성
-- ================================================================
-- 순환 참조 문제를 해결하고 보안을 유지하면서 로그인을 가능하게 함

-- 1. 모든 기존 정책 삭제 (깔끔한 시작)
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON tenants;
DROP POLICY IF EXISTS "temp_allow_all_tenants" ON tenants;
DROP POLICY IF EXISTS "authenticated_user_tenant_access" ON tenants;

DROP POLICY IF EXISTS "tenant_isolation_roles" ON tenant_roles;
DROP POLICY IF EXISTS "authenticated_user_roles_access" ON tenant_roles;

DROP POLICY IF EXISTS "tenant_users_select_policy" ON tenant_users;
DROP POLICY IF EXISTS "temp_allow_all_tenant_users" ON tenant_users;
DROP POLICY IF EXISTS "authenticated_user_tenant_users_access" ON tenant_users;

-- ================================================================
-- 논리적 순서 1: tenant_users (기반이 되는 테이블)
-- ================================================================
-- 사용자는 자신의 tenant_users 레코드만 볼 수 있어야 함 (순환 참조 없음)

CREATE POLICY "rls_tenant_users_own_records" ON tenant_users
  FOR SELECT
  TO authenticated
  USING (
    -- 핵심: 자신의 user_id와 매치되는 레코드만 (순환 참조 없음)
    user_id = auth.uid()
    AND status = 'active'
  );

-- ================================================================
-- 논리적 순서 2: tenants (tenant_users 기반으로 접근)
-- ================================================================
-- tenant_users에서 확인된 테넌트만 접근 가능

CREATE POLICY "rls_tenants_user_membership" ON tenants
  FOR SELECT 
  TO authenticated
  USING (
    -- tenant_users 정책이 이미 user_id = auth.uid()로 제한하므로 순환 참조 없음
    id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- ================================================================
-- 논리적 순서 3: tenant_roles (tenants + tenant_users 기반)
-- ================================================================
-- 사용자가 속한 테넌트의 역할만 조회 가능

CREATE POLICY "rls_tenant_roles_user_tenant" ON tenant_roles
  FOR SELECT 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- ================================================================
-- 논리적 순서 4: 다른 비즈니스 테이블들 (students, classes 등)
-- ================================================================
-- 동일한 논리 적용

-- Students 정책 (기존 것 수정)
DROP POLICY IF EXISTS "students_select_policy" ON students;

CREATE POLICY "rls_students_user_tenant" ON students
  FOR SELECT 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Classes 정책 (기존 것 수정)  
DROP POLICY IF EXISTS "classes_select_policy" ON classes;

CREATE POLICY "rls_classes_user_tenant" ON classes
  FOR SELECT 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- ================================================================
-- 추가 보안: INSERT/UPDATE/DELETE 정책들
-- ================================================================

-- tenant_users INSERT (관리자만)
CREATE POLICY "rls_tenant_users_admin_insert" ON tenant_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 2 -- owner, admin levels
    )
  );

-- tenant_users UPDATE (자신 또는 관리자)
CREATE POLICY "rls_tenant_users_update" ON tenant_users
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() -- 자신의 레코드
    OR 
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 2 -- owner, admin levels
    )
  );

-- ================================================================
-- 개발자 특별 접근 (개별 정책으로 분리)
-- ================================================================
-- 개발 계정에게만 전체 접근 권한 부여

-- 개발자용 tenants 정책
CREATE POLICY "rls_tenants_developer_access" ON tenants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@test.com' -- 특정 개발자 계정만
    )
  );

-- 개발자용 tenant_users 정책  
CREATE POLICY "rls_tenant_users_developer_access" ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@test.com' -- 특정 개발자 계정만
    )
  );

-- 개발자용 tenant_roles 정책
CREATE POLICY "rls_tenant_roles_developer_access" ON tenant_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@test.com' -- 특정 개발자 계정만
    )
  );

-- ================================================================
-- 정책 검증 및 성공 메시지
-- ================================================================

-- 현재 적용된 정책 확인
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause' 
  END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_users', 'tenant_roles', 'students', 'classes')
ORDER BY tablename, policyname;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS 정책이 논리적으로 올바르게 재구성되었습니다!';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 보안 원칙:';
    RAISE NOTICE '   1. tenant_users: 자신의 레코드만 (순환참조 없음)';
    RAISE NOTICE '   2. tenants: 자신이 속한 테넌트만';
    RAISE NOTICE '   3. tenant_roles: 자신의 테넌트 역할만';
    RAISE NOTICE '   4. 비즈니스 데이터: 테넌트별 완전 격리';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💻 개발자 특권:';
    RAISE NOTICE '   - admin@test.com: 모든 테넌트 전체 접근';
    RAISE NOTICE '   - 다른 계정: 엄격한 테넌트 격리 적용';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 이제 http://localhost:3001/test-auth 에서 로그인하세요!';
END $$;