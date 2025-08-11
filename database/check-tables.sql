-- 현재 데이터베이스의 모든 테이블 확인
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- tenant 관련 테이블 특별 확인
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%tenant%'
UNION ALL
SELECT 
    'tenant_users' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'tenant_users'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'tenant_roles' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'tenant_roles'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'tenants' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'tenants'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
ORDER BY table_name;