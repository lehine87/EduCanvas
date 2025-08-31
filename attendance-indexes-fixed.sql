-- 수정된 출석 성능 최적화 인덱스 (실제 스키마 기반)
-- T-V2-008 실시간 출석 위젯 성능 최적화용

-- ================================================================
-- 1. 출석 테이블 핵심 인덱스
-- ================================================================

-- 실시간 출석 현황 조회용 (tenant + 날짜 + 상태)
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_date_status 
ON attendances(tenant_id, attendance_date, status) 
WHERE attendance_date IS NOT NULL;

-- 클래스별 출석 현황 조회용
CREATE INDEX IF NOT EXISTS idx_attendances_class_date_status 
ON attendances(class_id, attendance_date, status) 
WHERE class_id IS NOT NULL AND attendance_date IS NOT NULL;

-- 학생별 출석 추적용
CREATE INDEX IF NOT EXISTS idx_attendances_student_tenant_date 
ON attendances(student_id, tenant_id, attendance_date) 
WHERE student_id IS NOT NULL AND attendance_date IS NOT NULL;

-- 트렌드 분석용 (날짜 범위 쿼리)
CREATE INDEX IF NOT EXISTS idx_attendances_trends 
ON attendances(tenant_id, attendance_date, check_in_time) 
WHERE attendance_date IS NOT NULL;

-- ================================================================
-- 2. 클래스 테이블 인덱스 (실제 스키마 기반)
-- ================================================================

-- 활성 클래스 조회용 (tenant + active 상태)
CREATE INDEX IF NOT EXISTS idx_classes_tenant_active 
ON classes(tenant_id, is_active) 
WHERE is_active IS NOT NULL;

-- 클래스 기본 정보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_classes_basic_info 
ON classes(id, tenant_id, name, is_active) 
WHERE is_active = true;

-- ================================================================
-- 3. 클래스 멤버십 인덱스
-- ================================================================

-- 클래스-학생 관계 조회용
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_student 
ON class_memberships(class_id, student_id) 
WHERE class_id IS NOT NULL AND student_id IS NOT NULL;

-- 학생이 속한 클래스 조회용
CREATE INDEX IF NOT EXISTS idx_class_memberships_student_active 
ON class_memberships(student_id, class_id) 
WHERE student_id IS NOT NULL;

-- ================================================================
-- 4. 학생 테이블 인덱스
-- ================================================================

-- 활성 학생 조회용
CREATE INDEX IF NOT EXISTS idx_students_tenant_active 
ON students(tenant_id, status) 
WHERE status = 'active';

-- 학생 기본 정보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_students_active_basic 
ON students(id, tenant_id, name, status) 
WHERE status = 'active';

-- ================================================================
-- 5. 클래스 일정 테이블 인덱스 (실제 스키마 활용)
-- ================================================================

-- 오늘/특정 날짜 수업 조회용
CREATE INDEX IF NOT EXISTS idx_class_schedules_tenant_date 
ON class_classroom_schedules(tenant_id, day_of_week, is_active) 
WHERE is_active = true;

-- 클래스-일정 관계 조회용
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_active 
ON class_classroom_schedules(class_id, is_active, effective_from, effective_until) 
WHERE is_active = true;

-- ================================================================
-- 6. 복합 성능 최적화 인덱스
-- ================================================================

-- 실시간 출석 위젯을 위한 종합 인덱스
CREATE INDEX IF NOT EXISTS idx_attendances_realtime_widget 
ON attendances(tenant_id, attendance_date, class_id, student_id, status) 
WHERE attendance_date IS NOT NULL AND class_id IS NOT NULL AND student_id IS NOT NULL;

-- 클래스 멤버십 + 출석 조인 최적화
CREATE INDEX IF NOT EXISTS idx_class_memberships_with_attendance 
ON class_memberships(class_id, student_id, enrolled_at) 
WHERE class_id IS NOT NULL AND student_id IS NOT NULL;

-- ================================================================
-- 7. 통계 쿼리 최적화를 위한 부분 인덱스
-- ================================================================

-- 최근 30일 출석 데이터 (자주 조회되는 기간)
CREATE INDEX IF NOT EXISTS idx_attendances_recent_30days 
ON attendances(tenant_id, attendance_date, status, class_id) 
WHERE attendance_date >= (CURRENT_DATE - INTERVAL '30 days');

-- 오늘 출석 데이터 (실시간 위젯 전용)
CREATE INDEX IF NOT EXISTS idx_attendances_today 
ON attendances(tenant_id, class_id, student_id, status) 
WHERE attendance_date = CURRENT_DATE;

-- ================================================================
-- 8. 테이블 통계 업데이트
-- ================================================================

-- 쿼리 플래너가 더 나은 실행 계획을 세우도록 통계 업데이트
ANALYZE attendances;
ANALYZE classes;
ANALYZE class_memberships;
ANALYZE students;
ANALYZE class_classroom_schedules;

-- ================================================================
-- 9. 인덱스 효과 확인 쿼리
-- ================================================================

-- 다음 쿼리들로 인덱스 사용 여부를 확인할 수 있습니다:
/*
-- 실시간 출석 현황 쿼리 성능 테스트
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
  COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
FROM attendances 
WHERE tenant_id = $1 
  AND attendance_date = CURRENT_DATE;

-- 클래스별 출석 현황 쿼리 성능 테스트  
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT cm.student_id) as total_students,
  COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END) as present_count
FROM classes c
LEFT JOIN class_memberships cm ON c.id = cm.class_id
LEFT JOIN attendances a ON c.id = a.class_id 
  AND a.attendance_date = CURRENT_DATE
WHERE c.tenant_id = $1
  AND c.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;
*/

-- 성공 메시지
SELECT 'T-V2-008 출석 위젯 성능 인덱스 생성 완료' as message;