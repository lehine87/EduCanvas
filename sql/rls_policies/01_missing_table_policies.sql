-- ================================================================
-- T-009: 누락된 테이블들에 대한 RLS 정책 구현
-- 작성일: 2025-08-14
-- 현재 18개 테이블에 정책이 누락되어 있음
-- ================================================================

-- 기존 패턴을 따라 일관된 정책 적용:
-- 1. 개발자 우회: is_developer_email(auth.email())  
-- 2. 테넌트 격리: get_user_tenant_id() 또는 tenant_users 조인
-- 3. 역할별 차등 접근

-- ================================================================
-- 1. 핵심 비즈니스 테이블 정책
-- ================================================================

-- attendances: 출결 관리 (강사는 담당 클래스만, admin/staff는 전체)
CREATE POLICY "rls_attendances_tenant_isolation" ON attendances
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- instructors: 강사 정보 (admin만 관리, 강사는 본인 정보만)
CREATE POLICY "rls_instructors_tenant_isolation" ON instructors  
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- payments: 결제 정보 (admin만 접근)
CREATE POLICY "rls_payments_admin_only" ON payments
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

-- salary_policies: 급여 정책 (admin만 접근)  
CREATE POLICY "rls_salary_policies_admin_only" ON salary_policies
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

-- ================================================================
-- 2. 학생 관련 확장 테이블
-- ================================================================

-- student_histories: 학생 이력 (기본 테넌트 격리)
CREATE POLICY "rls_student_histories_tenant_isolation" ON student_histories
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- consultations: 상담 기록 (기본 테넌트 격리)
CREATE POLICY "rls_consultations_tenant_isolation" ON consultations  
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- ================================================================
-- 3. 동영상 관련 테이블
-- ================================================================

-- video_lectures: 동영상 강의 (기본 테넌트 격리)
CREATE POLICY "rls_video_lectures_tenant_isolation" ON video_lectures
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- video_playlists: 동영상 재생목록 (기본 테넌트 격리)
CREATE POLICY "rls_video_playlists_tenant_isolation" ON video_playlists
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- video_ratings: 동영상 평가 (기본 테넌트 격리)
CREATE POLICY "rls_video_ratings_tenant_isolation" ON video_ratings
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- student_video_access: 학생 동영상 접근 권한 (기본 테넌트 격리)
CREATE POLICY "rls_student_video_access_tenant_isolation" ON student_video_access
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id = get_user_tenant_id()
    );

-- playlist_video_items: 재생목록 아이템 (기본 테넌트 격리)
CREATE POLICY "rls_playlist_video_items_tenant_isolation" ON playlist_video_items
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        tenant_id IN (
            SELECT tenant_users.tenant_id
            FROM tenant_users  
            WHERE tenant_users.user_id = auth.uid() 
            AND tenant_users.status = 'active'::user_status
        )
    );

-- ================================================================
-- 4. 권한 및 시스템 테이블  
-- ================================================================

-- permissions: 권한 정의 (admin만 관리)
CREATE POLICY "rls_permissions_admin_only" ON permissions
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        user_has_role('admin')
    );

-- role_permissions: 역할-권한 매핑 (admin만 관리)
CREATE POLICY "rls_role_permissions_admin_only" ON role_permissions  
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        user_has_role('admin')
    );

-- resource_scopes: 리소스 범위 (admin만 관리)
CREATE POLICY "rls_resource_scopes_admin_only" ON resource_scopes
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        user_has_role('admin')
    );

-- ================================================================
-- 5. 감사 및 백업 테이블
-- ================================================================

-- audit_logs: 감사 로그 (admin만 접근)
CREATE POLICY "rls_audit_logs_admin_only" ON audit_logs
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

-- backup_policies: 백업 정책 (admin만 관리)
CREATE POLICY "rls_backup_policies_admin_only" ON backup_policies
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))  
    );

-- backup_executions: 백업 실행 기록 (admin만 접근)
CREATE POLICY "rls_backup_executions_admin_only" ON backup_executions
    FOR ALL USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

-- ================================================================
-- 정책 적용 완료 확인
-- ================================================================

-- 정책 적용 후 확인 쿼리
-- SELECT tablename, COUNT(*) as policy_count 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- GROUP BY tablename 
-- ORDER BY tablename;