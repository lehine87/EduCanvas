-- ================================================================
-- T-009: RLS 성능 최적화 인덱스
-- RLS 정책에서 사용되는 조건들을 최적화하는 인덱스 생성
-- ================================================================

-- RLS 정책에서 자주 사용되는 패턴:
-- 1. tenant_id = get_user_tenant_id()
-- 2. tenant_users 테이블 조인 (user_id, tenant_id, status)  
-- 3. 역할별 필터링 (user_has_role 함수)
-- 4. 강사-클래스-학생 관계 조회

-- ================================================================
-- 1. 테넌트 격리 기본 인덱스  
-- ================================================================

-- 모든 테이블의 tenant_id 컬럼에 인덱스 (이미 있을 수 있지만 확인)
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_id 
    ON attendances(tenant_id);

CREATE INDEX IF NOT EXISTS idx_instructors_tenant_id 
    ON instructors(tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id 
    ON payments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_salary_policies_tenant_id 
    ON salary_policies(tenant_id);

CREATE INDEX IF NOT EXISTS idx_student_histories_tenant_id 
    ON student_histories(tenant_id);

CREATE INDEX IF NOT EXISTS idx_consultations_tenant_id 
    ON consultations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_video_lectures_tenant_id 
    ON video_lectures(tenant_id);

CREATE INDEX IF NOT EXISTS idx_video_playlists_tenant_id 
    ON video_playlists(tenant_id);

CREATE INDEX IF NOT EXISTS idx_video_ratings_tenant_id 
    ON video_ratings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_student_video_access_tenant_id 
    ON student_video_access(tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id 
    ON audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_backup_policies_tenant_id 
    ON backup_policies(tenant_id);

CREATE INDEX IF NOT EXISTS idx_backup_executions_tenant_id 
    ON backup_executions(tenant_id);

-- ================================================================
-- 2. tenant_users 테이블 최적화 (RLS에서 가장 많이 사용됨)
-- ================================================================

-- user_id + status 조합 (활성 사용자 확인용)
CREATE INDEX  IF NOT EXISTS idx_tenant_users_user_status 
    ON tenant_users(user_id, status) WHERE status = 'active';

-- tenant_id + user_id + status 조합 (테넌트별 사용자 확인)
CREATE INDEX  IF NOT EXISTS idx_tenant_users_tenant_user_status 
    ON tenant_users(tenant_id, user_id, status);

-- primary_role_id 조인 최적화
CREATE INDEX  IF NOT EXISTS idx_tenant_users_primary_role 
    ON tenant_users(primary_role_id) WHERE status = 'active';

-- ================================================================
-- 3. 강사-클래스-학생 관계 최적화
-- ================================================================

-- classes 테이블: instructor_id + tenant_id 조합
CREATE INDEX  IF NOT EXISTS idx_classes_instructor_tenant 
    ON classes(instructor_id, tenant_id);

-- student_enrollments 테이블: student_id + class_id 조합 (강사 담당 학생 조회용)
CREATE INDEX  IF NOT EXISTS idx_student_enrollments_student_class 
    ON student_enrollments(student_id, class_id, tenant_id);

-- attendances 테이블: student_id + tenant_id 조합
CREATE INDEX  IF NOT EXISTS idx_attendances_student_tenant 
    ON attendances(student_id, tenant_id);

-- consultations 테이블: student_id + tenant_id 조합
CREATE INDEX  IF NOT EXISTS idx_consultations_student_tenant 
    ON consultations(student_id, tenant_id);

-- student_video_access 테이블: student_id + tenant_id 조합
CREATE INDEX  IF NOT EXISTS idx_student_video_access_student_tenant 
    ON student_video_access(student_id, tenant_id);

-- ================================================================
-- 4. 역할 및 권한 관련 인덱스
-- ================================================================

-- tenant_roles 테이블: hierarchy_level 필터링 최적화
CREATE INDEX  IF NOT EXISTS idx_tenant_roles_hierarchy_level 
    ON tenant_roles(tenant_id, hierarchy_level);

-- user_profiles 테이블: 이메일 기반 개발자 확인 최적화
CREATE INDEX  IF NOT EXISTS idx_user_profiles_email 
    ON user_profiles(email) WHERE email LIKE '%@%';

-- ================================================================
-- 5. 동영상 관련 최적화
-- ================================================================

-- video_lectures 테이블: created_by + tenant_id 조합 (강사 본인 강의)
CREATE INDEX  IF NOT EXISTS idx_video_lectures_created_by_tenant 
    ON video_lectures(created_by, tenant_id);

-- video_playlists 테이블: created_by + tenant_id 조합  
CREATE INDEX  IF NOT EXISTS idx_video_playlists_created_by_tenant 
    ON video_playlists(created_by, tenant_id);

-- ================================================================
-- 6. 감사 및 시스템 테이블 최적화
-- ================================================================

-- audit_logs 테이블: occured_at으로 시간순 조회 최적화
CREATE INDEX  IF NOT EXISTS idx_audit_logs_tenant_occurred 
    ON audit_logs(tenant_id, occurred_at DESC);

-- backup_executions 테이블: started_at과 completed_at으로 최적화
CREATE INDEX  IF NOT EXISTS idx_backup_executions_tenant_started 
    ON backup_executions(tenant_id, started_at DESC);

CREATE INDEX  IF NOT EXISTS idx_backup_executions_tenant_completed 
    ON backup_executions(tenant_id, completed_at DESC);

-- ================================================================
-- 7. 복합 인덱스 (높은 사용빈도 쿼리 최적화)
-- ================================================================

-- student_enrollments 테이블: tenant_id + class_id + status 조합 (활성 등록만)
CREATE INDEX  IF NOT EXISTS idx_student_enrollments_tenant_class_status 
    ON student_enrollments(tenant_id, class_id, status) WHERE status = 'active';

-- classes 테이블: tenant_id + instructor_id + is_active 조합
CREATE INDEX  IF NOT EXISTS idx_classes_tenant_instructor_active 
    ON classes(tenant_id, instructor_id, is_active) WHERE is_active = true;

-- instructors 테이블: tenant_id + user_id 조합 (사용자-강사 매핑)
CREATE INDEX  IF NOT EXISTS idx_instructors_tenant_user 
    ON instructors(tenant_id, user_id);

-- ================================================================
-- 8. 함수 기반 인덱스 (필요시)
-- ================================================================

-- auth.uid() 결과를 자주 사용하는 경우를 위한 준비
-- (실제 성능 테스트 후 필요시 추가)

-- ================================================================
-- 인덱스 생성 완료 확인
-- ================================================================

-- 생성된 인덱스 확인 쿼리:
-- SELECT 
--     schemaname, 
--     tablename, 
--     indexname, 
--     indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- 인덱스 사용량 모니터링 쿼리:
-- SELECT 
--     schemaname,
--     tablename, 
--     indexname,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY idx_tup_read DESC;