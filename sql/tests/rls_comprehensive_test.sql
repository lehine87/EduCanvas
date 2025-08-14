-- ================================================================
-- T-009: RLS 정책 종합 테스트 스크립트  
-- 모든 테이블의 RLS 정책이 올바르게 작동하는지 확인
-- ================================================================

-- 테스트 시나리오:
-- 1. 테넌트별 데이터 격리 확인
-- 2. 역할별 접근 권한 확인  
-- 3. 강사의 담당 클래스/학생 제한 확인
-- 4. 관리자/개발자 우회 권한 확인

-- ================================================================
-- 1. 기본 RLS 상태 확인
-- ================================================================

-- 모든 테이블에 RLS가 활성화되어 있는지 확인
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS 활성화'
        ELSE '❌ RLS 비활성화'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ================================================================
-- 2. 정책 적용 현황 확인
-- ================================================================

-- 각 테이블별 정책 수 확인
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ================================================================  
-- 3. 누락된 정책 탐지
-- ================================================================

-- RLS는 활성화되었지만 정책이 없는 테이블 (접근 불가능한 테이블)
SELECT 
    t.tablename,
    '⚠️ RLS 활성화되었지만 정책 없음' as warning
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- ================================================================
-- 4. 정책 내용 분석
-- ================================================================

-- 개발자 우회 정책이 있는지 확인
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%is_developer_email%' THEN '✅ 개발자 우회 있음'
        ELSE '❌ 개발자 우회 없음' 
    END as developer_bypass
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 테넌트 격리 정책 확인  
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%tenant_id%' THEN '✅ 테넌트 격리 있음'
        ELSE '❌ 테넌트 격리 없음'
    END as tenant_isolation  
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================================================
-- 5. 역할별 정책 매트릭스
-- ================================================================

-- admin 역할 관련 정책
SELECT 
    tablename,
    policyname,
    cmd,
    '🔑 Admin 권한' as role_type
FROM pg_policies
WHERE schemaname = 'public' 
  AND qual LIKE '%admin%'
ORDER BY tablename;

-- instructor 역할 관련 정책
SELECT 
    tablename, 
    policyname,
    cmd,
    '👨‍🏫 Instructor 권한' as role_type
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%instructor%' 
ORDER BY tablename;

-- staff 역할 관련 정책
SELECT 
    tablename,
    policyname, 
    cmd,
    '👥 Staff 권한' as role_type
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%staff%'
ORDER BY tablename;

-- viewer 역할 관련 정책
SELECT 
    tablename,
    policyname,
    cmd, 
    '👀 Viewer 권한' as role_type
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%viewer%'
ORDER BY tablename;

-- ================================================================
-- 6. 중요한 비즈니스 테이블 세부 검증
-- ================================================================

-- students 테이블 정책 상세 분석
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies  
WHERE schemaname = 'public' AND tablename = 'students'
ORDER BY policyname;

-- classes 테이블 정책 상세 분석  
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'classes'
ORDER BY policyname;

-- payments 테이블 정책 상세 분석 (민감한 데이터)
SELECT 
    policyname,
    cmd, 
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'payments' 
ORDER BY policyname;

-- ================================================================
-- 7. 성능 관련 분석
-- ================================================================

-- RLS 관련 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_%tenant%' THEN '🎯 테넌트 인덱스'
        WHEN indexname LIKE 'idx_%user%' THEN '👤 사용자 인덱스' 
        WHEN indexname LIKE 'idx_%role%' THEN '🔐 역할 인덱스'
        ELSE '📊 일반 인덱스'
    END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ================================================================
-- 8. 잠재적 문제점 탐지
-- ================================================================

-- 정책이 너무 복잡한 테이블 (성능 이슈 가능성)
SELECT 
    tablename,
    COUNT(*) as policy_count,
    '⚠️ 정책 수가 많음 (성능 검토 필요)' as warning
FROM pg_policies
WHERE schemaname = 'public'  
GROUP BY tablename
HAVING COUNT(*) > 5
ORDER BY policy_count DESC;

-- 정책 조건이 매우 긴 경우 (복잡성 경고)
SELECT 
    tablename,
    policyname, 
    LENGTH(qual) as condition_length,
    '⚠️ 정책 조건이 복잡함' as warning
FROM pg_policies
WHERE schemaname = 'public'
  AND LENGTH(qual) > 200
ORDER BY condition_length DESC;

-- ================================================================
-- 9. 보안 점검 항목
-- ================================================================

-- Service Role 우회 정책 확인 (데이터 마이그레이션용)
SELECT 
    tablename,
    COUNT(*) as bypass_policies,
    '🔓 Service Role 우회 가능' as security_note
FROM pg_policies  
WHERE schemaname = 'public'
  AND (qual = 'true' OR qual LIKE '%service_role%')
GROUP BY tablename
ORDER BY tablename;

-- ================================================================
-- 결과 요약
-- ================================================================

-- 전체 RLS 적용 현황 요약
SELECT 
    '📊 전체 테이블 수' as metric,
    COUNT(*) as count
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 
    '🔒 RLS 활성화 테이블 수' as metric,
    COUNT(*) as count  
FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL  
SELECT 
    '📋 총 정책 수' as metric,
    COUNT(*) as count
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 
    '🎯 테넌트 격리 정책 수' as metric,
    COUNT(*) as count
FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%tenant_id%';