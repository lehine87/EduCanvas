-- =====================================================
-- Direct SQL to fix classes.instructor_id relationship
-- Execute this directly in Supabase SQL Editor
-- =====================================================

-- Step 1: Backup current classes table
CREATE TABLE IF NOT EXISTS classes_backup_20250825 AS 
SELECT * FROM classes;

-- Step 2: Add new column
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS new_instructor_id UUID;

-- Step 3: Add foreign key constraint to new column
ALTER TABLE classes 
ADD CONSTRAINT classes_new_instructor_id_fkey 
FOREIGN KEY (new_instructor_id) REFERENCES tenant_memberships(id)
ON DELETE SET NULL;

-- Step 4: Migrate data (admin and instructor roles both allowed)
UPDATE classes 
SET new_instructor_id = (
    SELECT tm.id 
    FROM tenant_memberships tm 
    JOIN tenant_roles tr ON tm.role_id = tr.id
    WHERE tm.user_id = classes.instructor_id 
    AND tr.name IN ('admin', 'instructor')
    AND tm.tenant_id = classes.tenant_id
    LIMIT 1
)
WHERE instructor_id IS NOT NULL;

-- Step 5: Verify the migration
SELECT 
    'Migration Status' as check_type,
    COUNT(CASE WHEN instructor_id IS NOT NULL THEN 1 END) as total_with_instructor,
    COUNT(CASE WHEN instructor_id IS NOT NULL AND new_instructor_id IS NOT NULL THEN 1 END) as successful_migrations,
    COUNT(CASE WHEN instructor_id IS NOT NULL AND new_instructor_id IS NULL THEN 1 END) as failed_migrations
FROM classes;

-- Step 6: Show detailed results
SELECT 
    c.name as class_name,
    c.instructor_id as old_instructor_id,
    up.name as instructor_name,
    c.new_instructor_id,
    tr.display_name as new_role
FROM classes c
LEFT JOIN user_profiles up ON c.instructor_id = up.id
LEFT JOIN tenant_memberships tm ON c.new_instructor_id = tm.id
LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
WHERE c.instructor_id IS NOT NULL;

-- If everything looks good, run these commands to complete the migration:
/*
-- Step 7: Drop old foreign key constraint
ALTER TABLE classes DROP CONSTRAINT classes_instructor_id_fkey;

-- Step 8: Drop old column
ALTER TABLE classes DROP COLUMN instructor_id;

-- Step 9: Rename new column
ALTER TABLE classes RENAME COLUMN new_instructor_id TO instructor_id;

-- Step 10: Add proper constraint name
ALTER TABLE classes DROP CONSTRAINT classes_new_instructor_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_instructor_id_fkey 
  FOREIGN KEY (instructor_id) REFERENCES tenant_memberships(id) ON DELETE SET NULL;
*/