-- Add instructor to the correct tenant (5cddcc22-f2a8-434f-acbe-49be8018957d)

DO $$ 
DECLARE
    instructor_count INTEGER;
    target_tenant_id UUID := '5cddcc22-f2a8-434f-acbe-49be8018957d';
    existing_user_id UUID;
    existing_user_count INTEGER;
    current_user_id UUID := '18108b90-f4dd-4c76-9487-d1af0106b664'; -- Current logged in user
BEGIN
    RAISE NOTICE 'Target tenant: %', target_tenant_id;
    RAISE NOTICE 'Current user: %', current_user_id;
    
    -- Check current instructor count in this specific tenant
    SELECT COUNT(*) INTO instructor_count 
    FROM tenant_memberships 
    WHERE job_function = 'instructor' AND tenant_id = target_tenant_id;
    
    RAISE NOTICE 'Current instructor count in target tenant: %', instructor_count;
    
    -- Only proceed if no instructors exist in this tenant
    IF instructor_count = 0 THEN
        RAISE NOTICE 'No instructors found in target tenant. Adding instructor data...';
        
        -- Count existing users in this tenant
        SELECT COUNT(*) INTO existing_user_count
        FROM user_profiles up
        WHERE up.tenant_id = target_tenant_id;
        
        RAISE NOTICE 'Found % existing users in target tenant', existing_user_count;
        
        -- Use the current logged-in user as instructor
        SELECT up.id INTO existing_user_id
        FROM user_profiles up
        WHERE up.tenant_id = target_tenant_id
        AND up.id = current_user_id;
        
        IF existing_user_id IS NOT NULL THEN
            RAISE NOTICE 'Converting current user % to instructor', existing_user_id;
            
            -- Check if this user already has a membership
            SELECT COUNT(*) INTO existing_user_count
            FROM tenant_memberships
            WHERE user_id = existing_user_id AND tenant_id = target_tenant_id;
            
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
                    target_tenant_id,
                    'instructor',
                    'active',
                    (SELECT id FROM tenant_roles WHERE tenant_id = target_tenant_id AND name = 'instructor' LIMIT 1),
                    '2025-01-01',
                    '수학',
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Successfully added instructor membership for current user';
            ELSE
                -- Update existing membership
                UPDATE tenant_memberships SET
                    job_function = 'instructor',
                    status = 'active',
                    specialization = '수학',
                    hire_date = '2025-01-01'
                WHERE user_id = existing_user_id AND tenant_id = target_tenant_id;
                
                RAISE NOTICE 'Successfully updated existing membership to instructor';
            END IF;
        ELSE
            RAISE NOTICE 'Current user not found in target tenant. Looking for any user...';
            
            -- Get any existing user in this tenant
            SELECT up.id INTO existing_user_id
            FROM user_profiles up
            WHERE up.tenant_id = target_tenant_id
            LIMIT 1;
            
            IF existing_user_id IS NOT NULL THEN
                RAISE NOTICE 'Converting user % to instructor', existing_user_id;
                
                -- Check if this user already has a membership
                SELECT COUNT(*) INTO existing_user_count
                FROM tenant_memberships
                WHERE user_id = existing_user_id AND tenant_id = target_tenant_id;
                
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
                        target_tenant_id,
                        'instructor',
                        'active',
                        (SELECT id FROM tenant_roles WHERE tenant_id = target_tenant_id AND name = 'instructor' LIMIT 1),
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
                    WHERE user_id = existing_user_id AND tenant_id = target_tenant_id;
                    
                    RAISE NOTICE 'Successfully updated existing membership to instructor';
                END IF;
            ELSE
                RAISE NOTICE 'No existing users found in target tenant';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'Instructors already exist (%), no action needed', instructor_count;
    END IF;
    
    -- Final verification for target tenant
    SELECT COUNT(*) INTO instructor_count 
    FROM tenant_memberships tm
    JOIN user_profiles up ON tm.user_id = up.id
    WHERE tm.job_function = 'instructor' AND tm.tenant_id = target_tenant_id;
    
    RAISE NOTICE 'Final instructor count in target tenant: %', instructor_count;
    
    -- Show instructor details for verification
    FOR existing_user_id IN (
        SELECT tm.user_id 
        FROM tenant_memberships tm 
        JOIN user_profiles up ON tm.user_id = up.id
        WHERE tm.job_function = 'instructor' AND tm.tenant_id = target_tenant_id
        LIMIT 5
    ) LOOP
        RAISE NOTICE 'Instructor user ID in target tenant: %', existing_user_id;
    END LOOP;
    
END $$;