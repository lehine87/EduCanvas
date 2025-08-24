-- Simple approach: just add instructor data without ON CONFLICT

DO $$ 
DECLARE
    instructor_count INTEGER;
    test_tenant_id UUID;
    existing_user_id UUID;
    existing_user_count INTEGER;
BEGIN
    -- Check current instructor count
    SELECT COUNT(*) INTO instructor_count 
    FROM tenant_memberships 
    WHERE job_function = 'instructor';
    
    RAISE NOTICE 'Current instructor count: %', instructor_count;
    
    -- Only proceed if no instructors exist
    IF instructor_count = 0 THEN
        RAISE NOTICE 'No instructors found. Adding instructor data...';
        
        -- Get the first tenant
        SELECT id INTO test_tenant_id FROM tenants LIMIT 1;
        
        IF test_tenant_id IS NOT NULL THEN
            RAISE NOTICE 'Using tenant: %', test_tenant_id;
            
            -- Count existing users in this tenant
            SELECT COUNT(*) INTO existing_user_count
            FROM user_profiles up
            WHERE up.tenant_id = test_tenant_id;
            
            RAISE NOTICE 'Found % existing users in tenant', existing_user_count;
            
            -- Get the first existing user
            SELECT up.id INTO existing_user_id
            FROM user_profiles up
            WHERE up.tenant_id = test_tenant_id
            LIMIT 1;
            
            IF existing_user_id IS NOT NULL THEN
                RAISE NOTICE 'Converting user % to instructor', existing_user_id;
                
                -- Check if this user already has a membership
                SELECT COUNT(*) INTO existing_user_count
                FROM tenant_memberships
                WHERE user_id = existing_user_id AND tenant_id = test_tenant_id;
                
                IF existing_user_count = 0 THEN
                    -- Insert new membership
                    INSERT INTO tenant_memberships (
                        user_id, 
                        tenant_id, 
                        job_function, 
                        status, 
                        role_id,
                        hire_date,
                        specialization,
                        created_at, 
                        updated_at
                    ) VALUES (
                        existing_user_id,
                        test_tenant_id,
                        'instructor',
                        'active',
                        (SELECT id FROM tenant_roles WHERE tenant_id = test_tenant_id AND name = 'instructor' LIMIT 1),
                        '2025-01-01',
                        '수학',
                        NOW(),
                        NOW()
                    );
                    
                    RAISE NOTICE 'Successfully added instructor membership';
                ELSE
                    -- Update existing membership
                    UPDATE tenant_memberships SET
                        job_function = 'instructor',
                        status = 'active',
                        specialization = '수학',
                        hire_date = '2025-01-01'
                    WHERE user_id = existing_user_id AND tenant_id = test_tenant_id;
                    
                    RAISE NOTICE 'Successfully updated existing membership to instructor';
                END IF;
            ELSE
                RAISE NOTICE 'No existing users found in tenant';
            END IF;
        ELSE
            RAISE NOTICE 'No tenant found';
        END IF;
    ELSE
        RAISE NOTICE 'Instructors already exist (%), no action needed', instructor_count;
    END IF;
    
    -- Final verification
    SELECT COUNT(*) INTO instructor_count 
    FROM tenant_memberships tm
    JOIN user_profiles up ON tm.user_id = up.id
    WHERE tm.job_function = 'instructor';
    
    RAISE NOTICE 'Final instructor count: %', instructor_count;
    
    -- Show instructor details for verification
    FOR existing_user_id IN (
        SELECT tm.user_id 
        FROM tenant_memberships tm 
        JOIN user_profiles up ON tm.user_id = up.id
        WHERE tm.job_function = 'instructor'
        LIMIT 5
    ) LOOP
        RAISE NOTICE 'Instructor user ID: %', existing_user_id;
    END LOOP;
    
END $$;