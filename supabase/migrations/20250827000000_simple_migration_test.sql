-- Simple migration to test connection and show current state
DO $simple_test$
BEGIN
    RAISE NOTICE '=== SIMPLE MIGRATION TEST ===';
    RAISE NOTICE 'Current timestamp: %', NOW();
    
    -- Show current classes data
    RAISE NOTICE 'Classes with instructor_id count: %', 
        (SELECT COUNT(*) FROM classes WHERE instructor_id IS NOT NULL);
        
    RAISE NOTICE 'Available tenant_memberships for mapping: %',
        (SELECT COUNT(*) FROM tenant_memberships tm 
         JOIN tenant_roles tr ON tm.role_id = tr.id 
         WHERE tr.name IN ('admin', 'instructor'));
         
    RAISE NOTICE '✅ Connection successful - ready for actual migration';
END $simple_test$;