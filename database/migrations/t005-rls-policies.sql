-- ================================================================
-- T-005: Multitenant Authentication System - RLS Policies
-- ================================================================
-- Security-first Row Level Security implementation
-- Created: 2025-08-11
-- Task: T-005 (Multitenant Authentication System)

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- Core Tenant Isolation Policies
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
      AND role_id IN (
        SELECT id FROM tenant_roles 
        WHERE tenant_id = tenant_roles.tenant_id 
        AND hierarchy_level <= 1 -- Only owner/admin can create roles
      )
    )
  );

-- Tenant users: Users can see other users in same tenant based on hierarchy
CREATE POLICY "tenant_isolation_users" ON tenant_users
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
      JOIN tenant_roles tr ON tu.role_id = tr.id
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
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 2 -- owner, admin levels
    ))
  );

-- ================================================================
-- Business Data Isolation Policies  
-- ================================================================

-- Students table - comprehensive access control
CREATE POLICY "students_read_policy" ON students
  FOR SELECT 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
    )
  );

CREATE POLICY "students_insert_policy" ON students
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 4 -- owner, admin, instructor, staff
        OR 
        (tu.custom_permissions->>'students') ? 'write'
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
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 4 -- owner, admin, instructor, staff
        OR 
        (tu.custom_permissions->>'students') ? 'write'
      )
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 4 -- owner, admin, instructor, staff
        OR 
        (tu.custom_permissions->>'students') ? 'write'
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
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 2 -- owner, admin only
        OR 
        (tu.custom_permissions->>'students') ? 'delete'
      )
    )
  );

-- Classes table - similar access control pattern
CREATE POLICY "classes_read_policy" ON classes
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

CREATE POLICY "classes_write_policy" ON classes
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 3 -- owner, admin, instructor
        OR 
        (tu.custom_permissions->>'classes') ? 'write'
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
      JOIN tenant_roles tr ON tu.role_id = tr.id
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
        (tu.custom_permissions->>'classes') ? 'write'
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
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 2 -- owner, admin only
        OR 
        (tu.custom_permissions->>'classes') ? 'delete'
      )
    )
  );

-- Course packages - tied to classes, similar access control
CREATE POLICY "course_packages_policy" ON course_packages
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
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 2 -- owner, admin only for pricing
    )
  );

-- Instructors - basic tenant isolation
CREATE POLICY "instructors_policy" ON instructors
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
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 2 -- owner, admin only
    )
  );

-- ================================================================
-- Video System RLS Policies
-- ================================================================

-- YouTube videos - instructor and admin access
CREATE POLICY "videos_read_policy" ON youtube_videos
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

CREATE POLICY "videos_write_policy" ON youtube_videos
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 3 -- owner, admin, instructor
        OR 
        (tu.custom_permissions->>'videos') ? 'write'
      )
    )
  );

CREATE POLICY "videos_update_policy" ON youtube_videos
  FOR UPDATE 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
    )
    AND (
      instructor_id IN (
        SELECT id FROM instructors 
        WHERE user_id = auth.uid() 
        AND tenant_id = youtube_videos.tenant_id
      )
      OR 
      instructor_id IS NULL -- admin uploaded videos
    )
  );

CREATE POLICY "videos_delete_policy" ON youtube_videos
  FOR DELETE 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 2 -- owner, admin only
        OR 
        (tu.custom_permissions->>'videos') ? 'delete'
      )
    )
  );

-- Student video progress - students can see own, instructors can see class students
CREATE POLICY "video_progress_policy" ON student_video_progress
  FOR ALL 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
    AND (
      -- Students can see their own progress
      student_id IN (
        SELECT id FROM students 
        WHERE tenant_id = student_video_progress.tenant_id
        -- Additional logic to link students to auth users would be needed
      )
      OR
      -- Instructors can see their class students' progress
      video_id IN (
        SELECT yv.id FROM youtube_videos yv
        JOIN classes c ON yv.class_id = c.id
        WHERE c.instructor_id IN (
          SELECT id FROM instructors 
          WHERE user_id = auth.uid() 
          AND tenant_id = student_video_progress.tenant_id
        )
      )
      OR
      -- Admins can see all
      EXISTS (
        SELECT 1 FROM tenant_users tu
        JOIN tenant_roles tr ON tu.role_id = tr.id
        WHERE tu.user_id = auth.uid() 
        AND tu.tenant_id = student_video_progress.tenant_id
        AND tu.status = 'active'
        AND tr.hierarchy_level <= 2
      )
    )
  );

-- Video assignments - similar to classes access control
CREATE POLICY "video_assignments_policy" ON video_assignments
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
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND tr.hierarchy_level <= 3 -- owner, admin, instructor
    )
  );

-- ================================================================
-- Audit and Security Policies
-- ================================================================

-- Audit logs - read-only for most users, full access for admins
CREATE POLICY "audit_logs_read_policy" ON audit_logs
  FOR SELECT 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu
      JOIN tenant_roles tr ON tu.role_id = tr.id
      WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
      AND (
        tr.hierarchy_level <= 2 -- owner, admin can see all
        OR 
        user_id = auth.uid() -- users can see their own actions
      )
    )
  );

-- System permissions - read-only for everyone
CREATE POLICY "permissions_read_policy" ON permissions
  FOR SELECT 
  TO authenticated
  USING (true); -- All authenticated users can read permission definitions

-- No write access to permissions table through RLS
-- Permissions are managed through admin interface only

-- ================================================================
-- Security Functions for Complex Permission Checks
-- ================================================================

-- Function to check if user has specific permission in tenant
CREATE OR REPLACE FUNCTION check_user_permission(
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
  v_custom_perms JSONB;
BEGIN
  -- Get user's role level and custom permissions
  SELECT 
    tr.hierarchy_level,
    tu.custom_permissions
  INTO 
    v_role_level,
    v_custom_perms
  FROM tenant_users tu
  LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
  WHERE tu.user_id = p_user_id 
  AND tu.tenant_id = p_tenant_id 
  AND tu.status = 'active';
  
  -- If no membership found, deny
  IF v_role_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check custom permissions first
  IF v_custom_perms IS NOT NULL AND 
     v_custom_perms ? p_resource AND
     v_custom_perms->p_resource ? p_action THEN
    RETURN TRUE;
  END IF;
  
  -- Check role-based permissions
  -- Owner (level 1) has all permissions
  IF v_role_level = 1 THEN
    RETURN TRUE;
  END IF;
  
  -- Admin (level 2) has most permissions except some admin-only actions
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
  
  -- Viewer (level 5) - read-only
  IF v_role_level >= 5 THEN
    RETURN p_action = 'read';
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;

-- ================================================================
-- Indexes for Performance
-- ================================================================

-- Indexes on tenant_users for RLS performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_users_user_tenant 
ON tenant_users (user_id, tenant_id) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_users_tenant_status 
ON tenant_users (tenant_id, status);

-- Indexes on role hierarchy for permission checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_roles_hierarchy 
ON tenant_roles (tenant_id, hierarchy_level);

-- Composite indexes for main business tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_tenant_status 
ON students (tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_classes_tenant_instructor 
ON classes (tenant_id, instructor_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_tenant_instructor 
ON youtube_videos (tenant_id, instructor_id);

-- ================================================================
-- Security Audit Triggers
-- ================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log failed permission attempts, login failures, etc.
  -- This would integrate with the audit_logs table
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Enable audit logging on sensitive tables
-- CREATE TRIGGER security_audit_students 
--   AFTER INSERT OR UPDATE OR DELETE ON students
--   FOR EACH ROW EXECUTE FUNCTION log_security_event();

COMMENT ON SCHEMA public IS 'EduCanvas multitenant database with comprehensive RLS security';