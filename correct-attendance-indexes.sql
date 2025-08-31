-- 정확한 스키마 기반 출석 성능 인덱스
-- T-V2-008 실시간 출석 위젯용 (실제 DB 스키마 반영)

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

-- 등록 기반 출석 조회용 (enrollment_id 활용)
CREATE INDEX IF NOT EXISTS idx_attendances_enrollment_date_status 
ON attendances(enrollment_id, attendance_date, status) 
WHERE enrollment_id IS NOT NULL AND attendance_date IS NOT NULL;

-- 트렌드 분석용 (날짜 범위 쿼리)
CREATE INDEX IF NOT EXISTS idx_attendances_trends 
ON attendances(tenant_id, attendance_date, check_in_time) 
WHERE attendance_date IS NOT NULL;

-- ================================================================
-- 2. 클래스 테이블 인덱스
-- ================================================================

-- 활성 클래스 조회용
CREATE INDEX IF NOT EXISTS idx_classes_tenant_active 
ON classes(tenant_id, is_active) 
WHERE is_active = true;

-- 클래스 기본 정보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_classes_basic_info 
ON classes(id, tenant_id, name, is_active) 
WHERE is_active = true;

-- ================================================================
-- 3. 학생 등록 테이블 인덱스 (student_enrollments)
-- ================================================================

-- 클래스-학생 등록 관계 조회용
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_student 
ON student_enrollments(class_id, student_id) 
WHERE class_id IS NOT NULL AND student_id IS NOT NULL;

-- 학생이 등록한 클래스 조회용
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_class 
ON student_enrollments(student_id, class_id, enrollment_date) 
WHERE student_id IS NOT NULL;

-- 활성 등록 상태별 조회
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status 
ON student_enrollments(class_id, status, enrollment_date) 
WHERE status IS NOT NULL;

-- 등록 ID 기반 조회 (attendances에서 참조)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_id_active 
ON student_enrollments(id, class_id, student_id, status) 
WHERE status = 'active';

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
-- 5. 복합 성능 최적화 인덱스
-- ================================================================

-- 실시간 출석 위젯 종합 조회용
CREATE INDEX IF NOT EXISTS idx_attendances_realtime_complete 
ON attendances(tenant_id, attendance_date, class_id, student_id, status) 
WHERE attendance_date IS NOT NULL 
  AND class_id IS NOT NULL 
  AND student_id IS NOT NULL;

-- 등록 기반 출석 조회 최적화
CREATE INDEX IF NOT EXISTS idx_attendances_enrollment_complete 
ON attendances(enrollment_id, attendance_date, status, check_in_time) 
WHERE enrollment_id IS NOT NULL 
  AND attendance_date IS NOT NULL;

-- ================================================================
-- 6. 시간 기반 부분 인덱스 (성능 최적화)
-- ================================================================

-- 오늘 출석 데이터 (가장 자주 조회) - IMMUTABLE 함수 문제로 조건 단순화
CREATE INDEX IF NOT EXISTS idx_attendances_today 
ON attendances(tenant_id, class_id, student_id, status, check_in_time) 
WHERE attendance_date IS NOT NULL;

-- 최근 7일 출석 데이터 (트렌드 분석용) - IMMUTABLE 함수 문제로 조건 단순화
CREATE INDEX IF NOT EXISTS idx_attendances_recent_week 
ON attendances(tenant_id, attendance_date, status) 
WHERE attendance_date IS NOT NULL;

-- 최근 30일 출석 데이터 (월간 리포트용) - IMMUTABLE 함수 문제로 조건 단순화
CREATE INDEX IF NOT EXISTS idx_attendances_recent_month 
ON attendances(tenant_id, attendance_date, status, class_id) 
WHERE attendance_date IS NOT NULL;

-- ================================================================
-- 7. 테이블 통계 업데이트
-- ================================================================

-- 쿼리 플래너 최적화를 위한 통계 업데이트
ANALYZE attendances;
ANALYZE classes;
ANALYZE student_enrollments;
ANALYZE students;

-- ================================================================
-- 8. 인덱스 성능 검증 쿼리 (주석 처리)
-- ================================================================

/*
-- 실시간 출석 현황 쿼리 성능 테스트
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
  COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
  ROUND(
    (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::decimal / 
     COUNT(*)::decimal) * 100, 1
  ) as attendance_rate
FROM attendances 
WHERE tenant_id = $1 
  AND attendance_date = CURRENT_DATE;

-- 클래스별 출석 현황 쿼리 성능 테스트
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT se.student_id) as total_students,
  COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END) as present_count,
  ROUND(
    (COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.student_id END)::decimal / 
     NULLIF(COUNT(DISTINCT se.student_id), 0)) * 100, 1
  ) as attendance_rate
FROM classes c
LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.status = 'active'
LEFT JOIN attendances a ON se.id = a.enrollment_id 
  AND a.attendance_date = CURRENT_DATE
WHERE c.tenant_id = $1
  AND c.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;
*/

-- 성공 메시지
SELECT 'T-V2-008 출석 위젯 성능 인덱스 생성 완료 (정확한 스키마 반영)' as message;