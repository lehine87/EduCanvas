-- =====================================================
-- Fix RLS Policies Migration
-- Handle dependencies before dropping instructor_id column
-- =====================================================

-- Step 1: Drop dependent RLS policies that reference classes.instructor_id
DROP POLICY IF EXISTS rls_attendances_instructor_select ON attendances;
DROP POLICY IF EXISTS rls_attendances_instructor_insert ON attendances;
DROP POLICY IF EXISTS rls_attendances_instructor_update ON attendances;
DROP POLICY IF EXISTS rls_student_video_access_instructor_select ON student_video_access;

-- Step 2: Now we can safely drop the old column
ALTER TABLE classes DROP CONSTRAINT classes_instructor_id_fkey;
ALTER TABLE classes DROP COLUMN instructor_id;

-- Step 3: Rename new_instructor_id to instructor_id
ALTER TABLE classes RENAME COLUMN new_instructor_id TO instructor_id;

-- Step 4: Add proper foreign key constraint
ALTER TABLE classes ADD CONSTRAINT classes_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES tenant_memberships(id) ON DELETE SET NULL;

-- Step 5: Recreate RLS policies with updated logic
-- These policies now need to work with tenant_memberships instead of user_profiles

-- Attendances policies (instructors can access their class attendances)
CREATE POLICY rls_attendances_instructor_select ON attendances
FOR SELECT USING (
    class_id IN (
        SELECT c.id 
        FROM classes c
        JOIN tenant_memberships tm ON c.instructor_id = tm.id
        WHERE tm.user_id = auth.uid()
    )
);

CREATE POLICY rls_attendances_instructor_insert ON attendances
FOR INSERT WITH CHECK (
    class_id IN (
        SELECT c.id 
        FROM classes c
        JOIN tenant_memberships tm ON c.instructor_id = tm.id
        WHERE tm.user_id = auth.uid()
    )
);

CREATE POLICY rls_attendances_instructor_update ON attendances
FOR UPDATE USING (
    class_id IN (
        SELECT c.id 
        FROM classes c
        JOIN tenant_memberships tm ON c.instructor_id = tm.id
        WHERE tm.user_id = auth.uid()
    )
);

-- Student video access policy (instructors can access their class videos)
CREATE POLICY rls_student_video_access_instructor_select ON student_video_access
FOR SELECT USING (
    EXISTS (
        SELECT 1 
        FROM classes c
        JOIN tenant_memberships tm ON c.instructor_id = tm.id
        JOIN students s ON s.class_id = c.id
        WHERE tm.user_id = auth.uid()
        AND s.id = student_video_access.student_id
    )
);

-- Step 6: Verification query
SELECT 
    'Migration completed successfully' as status,
    c.name as class_name,
    c.instructor_id,
    up.name as instructor_name,
    tr.display_name as role_name
FROM classes c
LEFT JOIN tenant_memberships tm ON c.instructor_id = tm.id
LEFT JOIN user_profiles up ON tm.user_id = up.id
LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
WHERE c.instructor_id IS NOT NULL;