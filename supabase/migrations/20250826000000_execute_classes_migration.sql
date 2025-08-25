-- =====================================================
-- Execute Classes Instructor Relationship Migration
-- Date: 2025-08-25
-- Purpose: classes.instructor_id → tenant_memberships.id
-- Strategy: Allow admin users to act as instructors
-- =====================================================

-- Step 1: Create backup table
CREATE TABLE classes_backup_20250825 AS 
SELECT * FROM classes;

-- Step 2: Add new column for migration
ALTER TABLE classes 
ADD COLUMN new_instructor_id UUID REFERENCES tenant_memberships(id);

-- Step 3: Update new_instructor_id with proper mapping
-- Allow both 'admin' and 'instructor' roles to be mapped
UPDATE classes 
SET new_instructor_id = (
    SELECT tm.id 
    FROM tenant_memberships tm 
    JOIN tenant_roles tr ON tm.role_id = tr.id
    WHERE tm.user_id = classes.instructor_id 
    AND tr.name IN ('admin', 'instructor')  -- Allow both roles
    AND tm.tenant_id = classes.tenant_id
    LIMIT 1  -- Take first match if multiple roles exist
)
WHERE instructor_id IS NOT NULL;

-- Step 4: Verify migration success
DO $verify$
DECLARE
    total_classes INT;
    migrated_classes INT;
    failed_classes INT;
BEGIN
    SELECT COUNT(*) INTO total_classes 
    FROM classes WHERE instructor_id IS NOT NULL;
    
    SELECT COUNT(*) INTO migrated_classes 
    FROM classes WHERE instructor_id IS NOT NULL AND new_instructor_id IS NOT NULL;
    
    failed_classes := total_classes - migrated_classes;
    
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Total classes with instructor: %', total_classes;
    RAISE NOTICE 'Successfully migrated: %', migrated_classes;
    RAISE NOTICE 'Failed to migrate: %', failed_classes;
    
    IF failed_classes = 0 THEN
        RAISE NOTICE '✅ ALL CLASSES SUCCESSFULLY MIGRATED';
    ELSE
        RAISE WARNING '⚠️ SOME CLASSES FAILED TO MIGRATE';
        
        -- Show details of failed classes
        FOR rec IN 
            SELECT c.id, c.name, c.instructor_id
            FROM classes c 
            WHERE c.instructor_id IS NOT NULL AND c.new_instructor_id IS NULL
        LOOP
            RAISE NOTICE 'Failed class: % (%), instructor_id: %', 
                rec.name, rec.id, rec.instructor_id;
        END LOOP;
    END IF;
END $verify$;

-- Step 5: If migration successful, swap columns
-- (This will be done manually after verification)
/*
ALTER TABLE classes DROP CONSTRAINT classes_instructor_id_fkey;
ALTER TABLE classes DROP COLUMN instructor_id;
ALTER TABLE classes RENAME COLUMN new_instructor_id TO instructor_id;
ALTER TABLE classes ADD CONSTRAINT classes_instructor_id_fkey 
  FOREIGN KEY (instructor_id) REFERENCES tenant_memberships(id);
*/

-- Step 6: Show final result
DO $final_check$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL MAPPING CHECK ===';
    FOR rec IN
        SELECT 
            c.name as class_name,
            c.instructor_id as old_instructor_id,
            c.new_instructor_id as new_instructor_id,
            up.name as instructor_name,
            tr.display_name as role_display
        FROM classes c
        LEFT JOIN user_profiles up ON c.instructor_id = up.id
        LEFT JOIN tenant_memberships tm ON c.new_instructor_id = tm.id
        LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
        WHERE c.instructor_id IS NOT NULL
    LOOP
        RAISE NOTICE 'Class: %, Instructor: % (%), Role: %', 
            rec.class_name, rec.instructor_name, rec.old_instructor_id, rec.role_display;
        RAISE NOTICE '  Old: %, New: %', rec.old_instructor_id, rec.new_instructor_id;
    END LOOP;
END $final_check$;