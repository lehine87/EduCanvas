-- =====================================================
-- EduCanvas Database Architecture Fix v2
-- classes.instructor_id: user_profiles.id → tenant_memberships.id
-- Date: 2025-08-25
-- Purpose: user_profiles를 순수 인증용으로 분리
-- =====================================================

-- Step 1: 현재 상황 분석
-- 현재 classes에서 instructor를 참조하는 방식 확인
DO $analysis$ 
DECLARE 
    current_classes_count int;
    instructor_memberships_count int;
    mappable_count int;
BEGIN
    -- 현재 classes with instructor 카운트
    SELECT COUNT(*) INTO current_classes_count 
    FROM classes 
    WHERE instructor_id IS NOT NULL;
    
    RAISE NOTICE '=== DATABASE ANALYSIS REPORT ===';
    RAISE NOTICE 'Classes with instructor_id: %', current_classes_count;
    
    -- instructor 역할 확인
    SELECT COUNT(*) INTO instructor_memberships_count
    FROM tenant_memberships tm
    JOIN tenant_roles tr ON tm.role_id = tr.id 
    WHERE tr.name ILIKE '%instructor%' OR tr.name ILIKE '%강사%';
    
    RAISE NOTICE 'Instructor memberships found: %', instructor_memberships_count;
    
    -- 매핑 가능한 classes 확인  
    SELECT COUNT(*) INTO mappable_count
    FROM classes c
    WHERE EXISTS (
        SELECT 1 
        FROM tenant_memberships tm 
        JOIN tenant_roles tr ON tm.role_id = tr.id
        WHERE tm.user_id = c.instructor_id 
        AND (tr.name ILIKE '%instructor%' OR tr.name ILIKE '%강사%')
        AND tm.tenant_id = c.tenant_id
    );
    
    RAISE NOTICE 'Classes mappable to tenant_memberships: %', mappable_count;
    RAISE NOTICE 'Classes not mappable: %', current_classes_count - mappable_count;
    
    IF mappable_count = current_classes_count THEN
        RAISE NOTICE '✅ ALL CLASSES CAN BE MAPPED - SAFE TO PROCEED';
    ELSE
        RAISE WARNING '⚠️ SOME CLASSES CANNOT BE MAPPED - REVIEW REQUIRED';
    END IF;
    
END $analysis$;