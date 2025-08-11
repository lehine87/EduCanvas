-- ================================================================
-- RLS 정책 수정: auth.users 접근 문제 해결
-- ================================================================
-- 문제: auth.users 테이블에 접근할 수 없어서 개발자 확인 불가
-- 해결: auth.users 참조를 auth.uid()와 auth.email() 함수로 대체

-- 1. 기존의 개발자 정책들 삭제 (auth.users 참조하는 정책들)
DROP POLICY IF EXISTS "rls_tenants_developer_access" ON tenants;
DROP POLICY IF EXISTS "rls_tenant_users_developer_access" ON tenant_users;
DROP POLICY IF EXISTS "rls_tenant_roles_developer_access" ON tenant_roles;

-- ================================================================
-- 해결책 1: auth.email() 함수 사용 (auth.users 테이블 접근 불필요)
-- ================================================================

-- 개발자용 tenants 정책 (수정됨)
CREATE POLICY "rls_tenants_developer_access" ON tenants
  FOR ALL
  TO authenticated
  USING (
    -- auth.users 대신 auth.email() 함수 사용
    auth.email() = 'admin@test.com'
  );

-- 개발자용 tenant_users 정책 (수정됨)
CREATE POLICY "rls_tenant_users_developer_access" ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'admin@test.com'
  );

-- 개발자용 tenant_roles 정책 (수정됨)
CREATE POLICY "rls_tenant_roles_developer_access" ON tenant_roles
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'admin@test.com'
  );

-- ================================================================
-- 추가: 다른 개발자 계정들도 지원 (확장성)
-- ================================================================

-- 여러 개발자 이메일을 지원하는 함수 생성
CREATE OR REPLACE FUNCTION is_developer_email(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN email_to_check IN (
    'admin@test.com',
    'developer@test.com', 
    'dev@educanvas.com'
  );
END;
$$;

-- 함수를 사용한 더 깔끔한 정책들로 재생성
DROP POLICY IF EXISTS "rls_tenants_developer_access" ON tenants;
DROP POLICY IF EXISTS "rls_tenant_users_developer_access" ON tenant_users;
DROP POLICY IF EXISTS "rls_tenant_roles_developer_access" ON tenant_roles;

CREATE POLICY "rls_tenants_developer_access" ON tenants
  FOR ALL
  TO authenticated
  USING (is_developer_email(auth.email()));

CREATE POLICY "rls_tenant_users_developer_access" ON tenant_users
  FOR ALL
  TO authenticated
  USING (is_developer_email(auth.email()));

CREATE POLICY "rls_tenant_roles_developer_access" ON tenant_roles
  FOR ALL
  TO authenticated
  USING (is_developer_email(auth.email()));

-- ================================================================
-- 추가 보안: students, classes에도 개발자 접근 추가
-- ================================================================

CREATE POLICY "rls_students_developer_access" ON students
  FOR ALL
  TO authenticated
  USING (is_developer_email(auth.email()));

CREATE POLICY "rls_classes_developer_access" ON classes
  FOR ALL
  TO authenticated
  USING (is_developer_email(auth.email()));

-- ================================================================
-- 정책 검증
-- ================================================================

-- 현재 적용된 정책들 확인
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN length(qual) > 100 THEN left(qual, 100) || '...' 
    ELSE qual 
  END as using_clause_preview
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_users', 'tenant_roles', 'students', 'classes')
ORDER BY tablename, policyname;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ auth.users 접근 문제가 해결되었습니다!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 수정사항:';
    RAISE NOTICE '   - auth.users 테이블 직접 접근 제거';
    RAISE NOTICE '   - auth.email() 함수로 대체';
    RAISE NOTICE '   - is_developer_email() 함수로 확장성 제공';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💻 개발자 계정들:';
    RAISE NOTICE '   - admin@test.com ✅';
    RAISE NOTICE '   - developer@test.com ✅'; 
    RAISE NOTICE '   - dev@educanvas.com ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 이제 로그인이 정상 작동할 것입니다!';
    RAISE NOTICE '   http://localhost:3001/test-auth';
END $$;