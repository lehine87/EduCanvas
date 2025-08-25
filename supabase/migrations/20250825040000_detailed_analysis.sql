-- =====================================================
-- Detailed Analysis of Current Data State
-- =====================================================

DO $detailed_analysis$ 
DECLARE 
    rec RECORD;
BEGIN
    RAISE NOTICE '=== DETAILED DATA ANALYSIS ===';
    
    -- 1. Classes 테이블의 instructor_id 데이터 확인
    RAISE NOTICE '';
    RAISE NOTICE '1. CLASSES TABLE DATA:';
    FOR rec IN 
        SELECT c.id, c.name, c.instructor_id, c.tenant_id
        FROM classes c 
        WHERE c.instructor_id IS NOT NULL
        LIMIT 5
    LOOP
        RAISE NOTICE 'Class: % (%), instructor_id: %, tenant_id: %', 
            rec.name, rec.id, rec.instructor_id, rec.tenant_id;
    END LOOP;
    
    -- 2. User_profiles 데이터 확인
    RAISE NOTICE '';
    RAISE NOTICE '2. USER_PROFILES DATA:';
    FOR rec IN 
        SELECT up.id, up.email, up.name
        FROM user_profiles up 
        LIMIT 5
    LOOP
        RAISE NOTICE 'User: % (%), email: %', 
            rec.name, rec.id, rec.email;
    END LOOP;
    
    -- 3. Tenant_memberships 데이터 확인
    RAISE NOTICE '';
    RAISE NOTICE '3. TENANT_MEMBERSHIPS DATA:';
    FOR rec IN 
        SELECT tm.id, tm.user_id, tm.tenant_id, tr.name as role_name, tm.specialization
        FROM tenant_memberships tm
        LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
        LIMIT 5
    LOOP
        RAISE NOTICE 'Membership: % user_id: %, tenant_id: %, role: %, specialization: %', 
            rec.id, rec.user_id, rec.tenant_id, rec.role_name, rec.specialization;
    END LOOP;
    
    -- 4. Tenant_roles 데이터 확인
    RAISE NOTICE '';
    RAISE NOTICE '4. TENANT_ROLES DATA:';
    FOR rec IN 
        SELECT tr.id, tr.name, tr.display_name
        FROM tenant_roles tr
        LIMIT 10
    LOOP
        RAISE NOTICE 'Role: % (%), display: %', 
            rec.name, rec.id, rec.display_name;
    END LOOP;
    
    -- 5. Instructors 테이블 데이터 확인 (있는 경우)
    RAISE NOTICE '';
    RAISE NOTICE '5. INSTRUCTORS TABLE DATA:';
    FOR rec IN 
        SELECT i.id, i.name, i.user_id, i.tenant_id
        FROM instructors i 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Instructor: % (%), user_id: %, tenant_id: %', 
            rec.name, rec.id, rec.user_id, rec.tenant_id;
    END LOOP;
    
    -- 6. 현재 classes.instructor_id가 어떤 테이블을 참조하는지 확인
    RAISE NOTICE '';
    RAISE NOTICE '6. CLASSES INSTRUCTOR_ID REFERENCE CHECK:';
    FOR rec IN 
        SELECT 
            c.id as class_id,
            c.name as class_name,
            c.instructor_id,
            c.tenant_id as class_tenant_id,
            up.email as up_email,
            up.name as up_name,
            i.name as instructor_name,
            tm.id as membership_id,
            tr.name as membership_role
        FROM classes c
        LEFT JOIN user_profiles up ON c.instructor_id = up.id
        LEFT JOIN instructors i ON c.instructor_id = i.id  
        LEFT JOIN tenant_memberships tm ON c.instructor_id = tm.user_id AND tm.tenant_id = c.tenant_id
        LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
        WHERE c.instructor_id IS NOT NULL
        LIMIT 5
    LOOP
        RAISE NOTICE 'Class: %, instructor_id: %', rec.class_name, rec.instructor_id;
        RAISE NOTICE '  → user_profiles match: % (%)', rec.up_name, rec.up_email;
        RAISE NOTICE '  → instructors match: %', rec.instructor_name;
        RAISE NOTICE '  → tenant_membership match: % (role: %)', rec.membership_id, rec.membership_role;
    END LOOP;
    
END $detailed_analysis$;