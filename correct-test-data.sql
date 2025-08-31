-- 정확한 스키마 기반 테스트 데이터 생성
-- T-V2-008 실시간 출석 위젯 테스트용 (student_enrollments 사용)

-- 1. 현재 데이터 상태 확인
SELECT 
  '📊 Current Data Status' as section,
  '' as details,
  '' as count
  
UNION ALL

SELECT 
  'Active Students',
  '',
  COUNT(*)::text
FROM students 
WHERE status = 'active'

UNION ALL

SELECT 
  'Active Classes',
  '',
  COUNT(*)::text
FROM classes 
WHERE is_active = true

UNION ALL

SELECT 
  'Student Enrollments',
  '',
  COUNT(*)::text
FROM student_enrollments

UNION ALL

SELECT 
  'Today Attendances',
  '',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date = CURRENT_DATE;

-- ================================================================
-- 2. 기본 테스트 클래스 생성 (필요시)
-- ================================================================

-- 활성 클래스가 5개 미만이면 테스트 클래스 생성
INSERT INTO classes (id, tenant_id, name, is_active, subject, grade, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE is_active = true LIMIT 1),
  class_name,
  true,
  subject_name,
  grade_level,
  NOW()
FROM (
  VALUES 
    ('수학 기초반 A', '수학', '중1'),
    ('영어 심화반 B', '영어', '중2'), 
    ('과학 실험반 C', '과학', '중3'),
    ('국어 독해반 D', '국어', '고1'),
    ('사회 탐구반 E', '사회', '고2')
) AS t(class_name, subject_name, grade_level)
WHERE (SELECT COUNT(*) FROM classes WHERE is_active = true) < 10;

-- ================================================================
-- 3. 학생-클래스 등록 관계 생성 (student_enrollments)
-- ================================================================

WITH available_classes AS (
  SELECT 
    id as class_id,
    name as class_name
  FROM classes 
  WHERE is_active = true 
  ORDER BY created_at DESC
  LIMIT 5
),
available_students AS (
  SELECT 
    id as student_id,
    name as student_name
  FROM students 
  WHERE status = 'active' 
  ORDER BY created_at
  LIMIT 30
)
INSERT INTO student_enrollments (
  id,
  class_id,
  student_id,
  enrollment_date,
  status,
  created_at
)
SELECT 
  gen_random_uuid(),
  ac.class_id,
  ast.student_id,
  CURRENT_DATE - INTERVAL '30 days', -- 30일 전부터 등록
  'active',
  NOW()
FROM available_classes ac
CROSS JOIN available_students ast
WHERE (ABS(HASHTEXT(ac.class_id::text || ast.student_id::text)) % 100) < 70;  -- 70% 확률로 등록

-- ================================================================
-- 4. 오늘 출석 데이터 생성 (enrollment_id 기반)
-- ================================================================

WITH active_enrollments AS (
  SELECT 
    se.id as enrollment_id,
    se.class_id,
    se.student_id,
    c.tenant_id
  FROM student_enrollments se
  JOIN classes c ON se.class_id = c.id
  WHERE se.status = 'active'
    AND c.is_active = true
)
INSERT INTO attendances (
  id,
  tenant_id,
  class_id,
  student_id,
  enrollment_id,
  attendance_date,
  status,
  check_in_time,
  late_minutes,
  created_at
)
SELECT 
  gen_random_uuid(),
  ae.tenant_id,
  ae.class_id,
  ae.student_id,
  ae.enrollment_id,
  CURRENT_DATE,
  CASE 
    WHEN (ABS(HASHTEXT(ae.enrollment_id::text)) % 100) < 78 THEN 'present'
    WHEN (ABS(HASHTEXT(ae.enrollment_id::text)) % 100) < 88 THEN 'late'
    ELSE 'absent'
  END::attendance_status,
  CASE 
    WHEN (ABS(HASHTEXT(ae.enrollment_id::text)) % 100) < 78 
    THEN CURRENT_DATE + TIME '09:00' + (RANDOM() * INTERVAL '20 minutes')
    WHEN (ABS(HASHTEXT(ae.enrollment_id::text)) % 100) < 88
    THEN CURRENT_DATE + TIME '09:10' + (RANDOM() * INTERVAL '15 minutes')
    ELSE NULL
  END,
  CASE 
    WHEN (ABS(HASHTEXT(ae.enrollment_id::text)) % 100) >= 78 
     AND (ABS(HASHTEXT(ae.enrollment_id::text)) % 100) < 88
    THEN (5 + RANDOM() * 15)::int -- 5-20분 지각
    ELSE NULL
  END,
  NOW()
FROM active_enrollments ae;

-- ================================================================
-- 5. 최근 7일간 트렌드 데이터 생성
-- ================================================================

WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date as trend_date
),
active_enrollments AS (
  SELECT 
    se.id as enrollment_id,
    se.class_id,
    se.student_id,
    c.tenant_id
  FROM student_enrollments se
  JOIN classes c ON se.class_id = c.id
  WHERE se.status = 'active'
    AND c.is_active = true
),
historical_data AS (
  SELECT 
    ae.*,
    ds.trend_date,
    CASE 
      WHEN (ABS(HASHTEXT(ae.enrollment_id::text || ds.trend_date::text)) % 100) < 72 THEN 'present'
      WHEN (ABS(HASHTEXT(ae.enrollment_id::text || ds.trend_date::text)) % 100) < 85 THEN 'late'
      ELSE 'absent'
    END as attendance_status
  FROM date_series ds
  CROSS JOIN active_enrollments ae
  WHERE (ABS(HASHTEXT(ae.class_id::text || ds.trend_date::text)) % 100) < 80 -- 80% 확률로 과거에도 수업 있음
)
INSERT INTO attendances (
  id,
  tenant_id,
  class_id,
  student_id,
  enrollment_id,
  attendance_date,
  status,
  check_in_time,
  created_at
)
SELECT 
  gen_random_uuid(),
  tenant_id,
  class_id,
  student_id,
  enrollment_id,
  trend_date,
  attendance_status::attendance_status,
  CASE 
    WHEN attendance_status = 'present' 
    THEN trend_date + TIME '09:00' + (RANDOM() * INTERVAL '15 minutes')
    WHEN attendance_status = 'late'
    THEN trend_date + TIME '09:10' + (RANDOM() * INTERVAL '10 minutes') 
    ELSE NULL
  END,
  trend_date + TIME '10:00'
FROM historical_data;

-- ================================================================
-- 6. 데이터 생성 결과 확인
-- ================================================================

SELECT 
  '🎯 Test Data Creation Results' as section,
  '' as metric,
  '' as value
  
UNION ALL

SELECT 
  'Classes Created',
  'Active Classes',
  COUNT(*)::text
FROM classes 
WHERE is_active = true

UNION ALL

SELECT 
  'Students Available',
  'Active Students', 
  COUNT(*)::text
FROM students 
WHERE status = 'active'

UNION ALL

SELECT 
  'Enrollments Created',
  'Active Enrollments',
  COUNT(*)::text
FROM student_enrollments 
WHERE status = 'active'

UNION ALL

SELECT 
  'Today Attendances',
  'Records Created',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date = CURRENT_DATE

UNION ALL

SELECT 
  'Historical Data',
  'Past 7 Days Records',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
  AND attendance_date < CURRENT_DATE;

-- ================================================================
-- 7. 출석률 미리보기 (위젯에서 볼 수 있는 데이터)
-- ================================================================

SELECT 
  '📈 Attendance Rate Preview' as section,
  attendance_date::text as date,
  CONCAT(
    ROUND(
      (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::decimal / 
       COUNT(*)::decimal) * 100, 1
    ), '%'
  ) as attendance_rate
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
  AND attendance_date <= CURRENT_DATE
GROUP BY attendance_date
ORDER BY attendance_date;

-- ================================================================
-- 8. 클래스별 오늘 출석 현황 (위젯 테스트용)
-- ================================================================

SELECT 
  '🏫 Today Class Attendance' as section,
  c.name as class_name,
  CONCAT(
    COUNT(CASE WHEN a.status = 'present' THEN 1 END), '/',
    COUNT(DISTINCT se.student_id), ' (',
    ROUND(
      (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::decimal / 
       NULLIF(COUNT(DISTINCT se.student_id), 0)) * 100, 1
    ), '%)'
  ) as attendance_summary
FROM classes c
LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.status = 'active'
LEFT JOIN attendances a ON se.id = a.enrollment_id 
  AND a.attendance_date = CURRENT_DATE
WHERE c.is_active = true
  AND c.tenant_id = (SELECT id FROM tenants WHERE status = 'active' LIMIT 1)
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT se.student_id) > 0
ORDER BY c.name;

-- 성공 메시지
SELECT '✅ T-V2-008 테스트 데이터 생성 완료!' as final_message;