-- =====================================================
-- FINAL MIGRATION: Column Swap
-- Execute these commands in Supabase Dashboard SQL Editor
-- =====================================================

-- ⚠️ IMPORTANT: Execute these in exact order!

-- Step 1: Drop old foreign key constraint
ALTER TABLE classes 
DROP CONSTRAINT classes_instructor_id_fkey;

-- Step 2: Drop old instructor_id column
ALTER TABLE classes 
DROP COLUMN instructor_id;

-- Step 3: Rename new_instructor_id to instructor_id
ALTER TABLE classes 
RENAME COLUMN new_instructor_id TO instructor_id;

-- Step 4: Add proper foreign key constraint with new name
ALTER TABLE classes 
ADD CONSTRAINT classes_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES tenant_memberships(id) 
ON DELETE SET NULL;

-- =====================================================
-- VERIFICATION QUERY (run after above)
-- =====================================================

-- Verify the migration is complete
SELECT 
    c.name as class_name,
    c.instructor_id,
    tm.id as membership_id,
    up.name as instructor_name,
    tr.display_name as role_name
FROM classes c
LEFT JOIN tenant_memberships tm ON c.instructor_id = tm.id
LEFT JOIN user_profiles up ON tm.user_id = up.id
LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
WHERE c.instructor_id IS NOT NULL;

-- Expected result:
-- class_name: "중2 현행반"
-- instructor_id: "2bc4e816-d404-488c-9a4a-0860d9b53348" (tenant_memberships.id)
-- instructor_name: "이상준"
-- role_name: "관리자"