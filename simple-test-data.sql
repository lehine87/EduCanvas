-- 간단한 테스트 데이터 생성 (실제 스키마 기반)
-- T-V2-008 출석 위젯 테스트용

-- 1. 현재 데이터 확인
SELECT 
  '1. Active Students' as category,
  COUNT(*) as count
FROM students 
WHERE status = 'active'

UNION ALL

SELECT 
  '2. Active Classes' as category,
  COUNT(*) as count
FROM classes 
WHERE is_active = true

UNION ALL

SELECT 
  '3. Student Enrollments' as category,
  COUNT(*) as count
FROM student_enrollments

UNION ALL

SELECT 
  '4. Today Attendances' as category,
  COUNT(*) as count
FROM attendances 
WHERE attendance_date = CURRENT_DATE;

-- 2. 기본 테스트 데이터가 충분한지 확인 후 필요시 생성

-- 활성 클래스가 5개 미만이면 더 생성
INSERT INTO classes (id, tenant_id, name, is_active, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM tenants LIMIT 1),
  class_name,
  true,
  NOW()
FROM (
  VALUES 
    ('수학 기초반 A'),
    ('영어 심화반 B'), 
    ('과학 실험반 C'),
    ('국어 독해반 D'),
    ('사회 탐구반 E')
) AS t(class_name)
WHERE (SELECT COUNT(*) FROM classes WHERE is_active = true) < 5;

-- 3. 학생-클래스 등록 관계 생성 (student_enrollments)
WITH random_classes AS (
  SELECT id as class_id 
  FROM classes 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 5
),
random_students AS (
  SELECT id as student_id 
  FROM students 
  WHERE status = 'active' 
  ORDER BY created_at 
  LIMIT 20
)
INSERT INTO student_enrollments (
  id, 
  class_id, 
  student_id, 
  enrollment_date, 
  status, 
  original_price,
  discounted_price,
  final_price,
  payment_status,
  created_at
)
SELECT 
  gen_random_uuid(),
  rc.class_id,
  rs.student_id,
  CURRENT_DATE - INTERVAL '30 days',
  'active',
  50000.00,  -- 기본 수강료
  45000.00,  -- 할인된 가격
  45000.00,  -- 최종 가격
  'paid',    -- 결제 완료
  NOW()
FROM random_classes rc
CROSS JOIN random_students rs
WHERE (ABS(HASHTEXT(rc.class_id::text || rs.student_id::text)) % 100) < 60;  -- 60% 확률로 등록

-- 4. 오늘 출석 데이터 생성
WITH enrolled_students AS (
  SELECT 
    se.id as enrollment_id,
    se.class_id,
    se.student_id,
    c.tenant_id
  FROM student_enrollments se
  JOIN classes c ON se.class_id = c.id
  WHERE c.is_active = true AND se.status = 'active'
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
  es.tenant_id,
  es.class_id,
  es.student_id,
  es.enrollment_id,
  CURRENT_DATE,
  CASE 
    WHEN (ABS(HASHTEXT(es.class_id::text || es.student_id::text)) % 100) < 75 THEN 'present'
    WHEN (ABS(HASHTEXT(es.class_id::text || es.student_id::text)) % 100) < 90 THEN 'late'
    ELSE 'absent'
  END::attendance_status,
  CASE 
    WHEN (ABS(HASHTEXT(es.class_id::text || es.student_id::text)) % 100) < 75 
    THEN CURRENT_DATE + INTERVAL '09:00' + (RANDOM() * INTERVAL '30 minutes')
    ELSE NULL
  END,
  NOW()
FROM enrolled_students es;

-- 5. 최근 7일간 트렌드 데이터 생성
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date as trend_date
),
enrolled_students AS (
  SELECT 
    se.id as enrollment_id,
    se.class_id,
    se.student_id,
    c.tenant_id
  FROM student_enrollments se
  JOIN classes c ON se.class_id = c.id
  WHERE c.is_active = true AND se.status = 'active'
)
INSERT INTO attendances (
  id,
  tenant_id,
  class_id,
  student_id,
  enrollment_id,
  attendance_date,
  status,
  created_at
)
SELECT 
  gen_random_uuid(),
  es.tenant_id,
  es.class_id,
  es.student_id,
  es.enrollment_id,
  ds.trend_date,
  CASE 
    WHEN (ABS(HASHTEXT(es.class_id::text || es.student_id::text || ds.trend_date::text)) % 100) < 70 THEN 'present'
    WHEN (ABS(HASHTEXT(es.class_id::text || es.student_id::text || ds.trend_date::text)) % 100) < 85 THEN 'late'
    ELSE 'absent'
  END::attendance_status,
  ds.trend_date + INTERVAL '10:00'
FROM date_series ds
CROSS JOIN enrolled_students es
WHERE (ABS(HASHTEXT(es.class_id::text || ds.trend_date::text)) % 100) < 70;  -- 70% 확률로 과거에도 수업

-- 6. 최종 결과 확인
SELECT 
  '📊 Test Data Summary' as section,
  '' as details
  
UNION ALL

SELECT 
  'Active Classes',
  COUNT(*)::text
FROM classes 
WHERE is_active = true

UNION ALL

SELECT 
  'Active Students',
  COUNT(*)::text
FROM students 
WHERE status = 'active'

UNION ALL

SELECT 
  'Student Enrollments',
  COUNT(*)::text
FROM student_enrollments

UNION ALL

SELECT 
  'Today Attendances',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date = CURRENT_DATE

UNION ALL

SELECT 
  'Historical Attendances (7 days)',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '6 days'
  AND attendance_date < CURRENT_DATE;

-- 7. 출석률 미리보기
SELECT 
  '📈 Attendance Rate Preview' as section,
  '' as date,
  '' as rate
  
UNION ALL

SELECT 
  'Date',
  attendance_date::text,
  ROUND(
    (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::decimal / 
     COUNT(*)::decimal) * 100, 1
  )::text || '%'
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY attendance_date
ORDER BY attendance_date;