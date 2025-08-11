-- 현재 데이터베이스 스키마 확인 쿼리
-- T-005 RLS 정책 적용 전 실행하여 현재 상태 파악

-- 1. 모든 테이블 목록 확인
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 기존 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. RLS 활성화 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. 주요 테이블 존재 여부 확인
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'tenants', 'tenant_users', 'tenant_roles', 'permissions',
            'students', 'classes', 'instructors', 'course_packages'
        ) THEN 'REQUIRED FOR T-005'
        ELSE 'OTHER'
    END as importance
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'tenants', 'tenant_users', 'tenant_roles', 'permissions',
    'students', 'classes', 'instructors', 'course_packages',
    'youtube_videos', 'audit_logs', 'classrooms'
)
ORDER BY importance DESC, table_name;

-- 5. students 테이블 구조 확인 (존재한다면)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;