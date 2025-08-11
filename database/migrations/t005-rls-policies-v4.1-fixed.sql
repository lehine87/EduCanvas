-- ================================================================
-- T-005: Multitenant Authentication System - RLS Policies (v4.1 Compatible)
-- ================================================================
-- Security-first Row Level Security implementation for Schema v4.1
-- Created: 2025-08-11
-- Updated: Fixed for v4.1 schema compatibility

-- Enable RLS on existing tenant-scoped tables only
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on optional tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions' AND table_schema = 'public') THEN
        ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ permissions 테이블 RLS 활성화';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructors' AND table_schema = 'public') THEN
        ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ instructors 테이블 RLS 활성화';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_packages' AND table_schema = 'public') THEN
        ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ course_packages 테이블 RLS 활성화';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'youtube_videos' AND table_schema = 'public') THEN
        ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ youtube_videos 테이블 RLS 활성화';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ audit_logs 테이블 RLS 활성화';
    END IF;
END$$;

-- ================================================================
-- Core Tenant Isolation Policies (v4.1 Compatible)
-- ================================================================

-- Tenants table: Users can only see their own tenants
CREATE POLICY "tenant_isolation_tenants" ON tenants
  FOR ALL 
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Tenant roles: Users can only see roles in their tenants  
CREATE POLICY "tenant_isolation_roles" ON tenant_roles
  FOR ALL 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND primary_role_id IN (
        SELECT id FROM tenant_roles 
        WHERE tenant_id = tenant_roles.tenant_id 
        AND hierarchy_level <= 2 -- Only owner/admin can create roles
      )
    )
  );

-- Tenant users: Users can see other users in same tenant based on hierarchy
CREATE POLICY "tenant_users_select_policy" ON tenant_users
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

-- Tenant users insert: Only admins can invite users
CREATE POLICY "tenant_users_insert_policy" ON tenant_users
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

-- Tenant users update: Users can update their own data, admins can update others
CREATE POLICY "tenant_users_update_policy" ON tenant_users
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid()) -- Own record
    OR 
    (tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 2 -- owner, admin levels
    ))
  );

-- ================================================================
-- Business Data Isolation Policies (v4.1 Compatible)
-- ================================================================

-- Students table - comprehensive access control
CREATE POLICY "students_select_policy" ON students
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

CREATE POLICY "students_insert_policy" ON students
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 4 -- owner, admin, instructor, staff
        OR 
        (tu.permission_overrides->>'students') ? 'write'
      )
    )
  );

CREATE POLICY "students_update_policy" ON students
  FOR UPDATE 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 4 -- owner, admin, instructor, staff
        OR 
        (tu.permission_overrides->>'students') ? 'write'
      )
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 4 -- owner, admin, instructor, staff
        OR 
        (tu.permission_overrides->>'students') ? 'write'
      )
    )
  );

CREATE POLICY "students_delete_policy" ON students
  FOR DELETE 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 2 -- owner, admin only
        OR 
        (tu.permission_overrides->>'students') ? 'delete'
      )
    )
  );

-- Classes table - similar access control pattern
CREATE POLICY "classes_select_policy" ON classes
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

CREATE POLICY "classes_insert_policy" ON classes
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 3 -- owner, admin, instructor
        OR 
        (tu.permission_overrides->>'classes') ? 'write'
      )
    )
  );

CREATE POLICY "classes_update_policy" ON classes
  FOR UPDATE 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 3 -- owner, admin, instructor
        OR 
        instructor_id IN (
          SELECT id FROM instructors 
          WHERE user_id = auth.uid() 
          AND tenant_id = classes.tenant_id
        )
        OR 
        (tu.permission_overrides->>'classes') ? 'write'
      )
    )
  );

CREATE POLICY "classes_delete_policy" ON classes
  FOR DELETE 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.primary_role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 2 -- owner, admin only
        OR 
        (tu.permission_overrides->>'classes') ? 'delete'
      )
    )
  );

-- Course packages - only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_packages' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "course_packages_policy" ON course_packages
          FOR ALL 
          TO authenticated
          USING (
            tenant_id IN (
              SELECT tenant_id 
              FROM tenant_users 
              WHERE user_id = auth.uid() 
              AND status = ''active''
            )
          )
        ';
        RAISE NOTICE '✅ course_packages RLS 정책 생성';
    END IF;
END$$;

-- Instructors - only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructors' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "instructors_policy" ON instructors
          FOR ALL 
          TO authenticated
          USING (
            tenant_id IN (
              SELECT tenant_id 
              FROM tenant_users 
              WHERE user_id = auth.uid() 
              AND status = ''active''
            )
          )
        ';
        RAISE NOTICE '✅ instructors RLS 정책 생성';
    END IF;
END$$;

-- ================================================================
-- Video System RLS Policies (only if tables exist)
-- ================================================================

-- YouTube videos policies - conditional
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'youtube_videos' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "videos_select_policy" ON youtube_videos
          FOR SELECT 
          TO authenticated
          USING (
            tenant_id IN (
              SELECT tenant_id 
              FROM tenant_users 
              WHERE user_id = auth.uid() 
              AND status = ''active''
            )
          )
        ';
        RAISE NOTICE '✅ youtube_videos RLS 정책 생성';
    ELSE
        RAISE NOTICE '⏭️  youtube_videos 테이블이 없어서 정책을 건너뜁니다';
    END IF;
END$$;

-- ================================================================
-- Audit and Security Policies (conditional)
-- ================================================================

-- Audit logs - only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "audit_logs_select_policy" ON audit_logs
          FOR SELECT 
          TO authenticated
          USING (
            tenant_id IN (
              SELECT tu.tenant_id 
              FROM tenant_users tu
              WHERE tu.user_id = auth.uid() 
              AND tu.status = ''active''
            )
          )
        ';
        RAISE NOTICE '✅ audit_logs RLS 정책 생성';
    ELSE
        RAISE NOTICE '⏭️  audit_logs 테이블이 없어서 정책을 건너뜁니다';
    END IF;
END$$;

-- System permissions - only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "permissions_select_policy" ON permissions
          FOR SELECT 
          TO authenticated
          USING (true)
        ';
        RAISE NOTICE '✅ permissions RLS 정책 생성';
    ELSE
        RAISE NOTICE '⏭️  permissions 테이블이 없어서 정책을 건너뜁니다';
    END IF;
END$$;

-- ================================================================
-- Security Functions for Complex Permission Checks (v4.1 Compatible)
-- ================================================================

-- Function to check if user has specific permission in tenant
CREATE OR REPLACE FUNCTION check_user_permission_v41(
  p_user_id UUID,
  p_tenant_id UUID,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_role_level INTEGER;
  v_permission_overrides JSONB;
BEGIN
  -- Get user's role level and permission overrides
  SELECT 
    tr.hierarchy_level,
    tu.permission_overrides
  INTO 
    v_role_level,
    v_permission_overrides
  FROM tenant_users tu
  LEFT JOIN tenant_roles tr ON tu.primary_role_id = tr.id
  WHERE tu.user_id = p_user_id 
  AND tu.tenant_id = p_tenant_id 
  AND tu.status = 'active';
  
  -- If no membership found, deny
  IF v_role_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check permission overrides first
  IF v_permission_overrides IS NOT NULL AND 
     v_permission_overrides ? p_resource AND
     v_permission_overrides->p_resource ? p_action THEN
    RETURN TRUE;
  END IF;
  
  -- Check role-based permissions
  -- Owner (level 1) has all permissions
  IF v_role_level = 1 THEN
    RETURN TRUE;
  END IF;
  
  -- Admin (level 2) has most permissions except some owner-only actions
  IF v_role_level = 2 THEN
    IF p_action = 'admin' THEN
      RETURN FALSE;
    END IF;
    RETURN TRUE;
  END IF;
  
  -- Instructor (level 3) - specific permissions
  IF v_role_level = 3 THEN
    CASE p_resource
      WHEN 'students' THEN RETURN p_action IN ('read', 'write');
      WHEN 'classes' THEN RETURN p_action IN ('read', 'write');
      WHEN 'videos' THEN RETURN p_action IN ('read', 'write');
      WHEN 'reports' THEN RETURN p_action = 'read';
      WHEN 'payments' THEN RETURN p_action = 'read';
      WHEN 'settings' THEN RETURN p_action = 'read';
      ELSE RETURN FALSE;
    END CASE;
  END IF;
  
  -- Staff (level 4) - limited permissions
  IF v_role_level = 4 THEN
    CASE p_resource
      WHEN 'students' THEN RETURN p_action IN ('read', 'write');
      WHEN 'classes' THEN RETURN p_action = 'read';
      WHEN 'videos' THEN RETURN p_action = 'read';
      WHEN 'reports' THEN RETURN p_action = 'read';
      WHEN 'payments' THEN RETURN p_action = 'read';
      ELSE RETURN FALSE;
    END CASE;
  END IF;
  
  -- Viewer (level 5+) - read-only
  IF v_role_level >= 5 THEN
    RETURN p_action = 'read';
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_permission_v41 TO authenticated;

-- ================================================================
-- Indexes for Performance (v4.1 Compatible)
-- ================================================================

-- Indexes on tenant_users for RLS performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_users_user_tenant_v41 
ON tenant_users (user_id, tenant_id) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_users_tenant_status_v41 
ON tenant_users (tenant_id, status);

-- Indexes on role hierarchy for permission checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_roles_hierarchy_v41 
ON tenant_roles (tenant_id, hierarchy_level);

-- Composite indexes for main business tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_tenant_status_v41 
ON students (tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_classes_tenant_instructor_v41 
ON classes (tenant_id, instructor_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_tenant_instructor_v41 
ON youtube_videos (tenant_id, instructor_id);

COMMENT ON SCHEMA public IS 'EduCanvas v4.1 multitenant database with comprehensive RLS security';

-- ================================================================
-- Success Message
-- ================================================================
DO $$ 
BEGIN 
    RAISE NOTICE 'T-005 RLS Policies v4.1 successfully applied!';
    RAISE NOTICE 'Tables secured: tenants, tenant_users, tenant_roles, students, classes, videos, etc.';
    RAISE NOTICE 'Permission system: 5-level hierarchy with custom overrides';
    RAISE NOTICE 'Next: Test with actual tenant and user data';
END $$;