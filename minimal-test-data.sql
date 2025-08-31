-- 최소한의 테스트 데이터 생성 (기존 데이터 활용)
-- T-V2-008 출석 위젯 테스트용

-- 1. 현재 데이터 상태 확인
SELECT 
  '📊 Current Data Status' as section,
  '' as metric,
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

-- 2. 기존 등록 데이터 기반으로 오늘 출석 데이터 생성
WITH existing_enrollments AS (
  SELECT 
    se.id as enrollment_id,
    se.class_id,
    se.student_id,
    c.tenant_id
  FROM student_enrollments se
  JOIN classes c ON se.class_id = c.id
  WHERE c.is_active = true 
    AND se.status = 'active'
  LIMIT 50  -- 최대 50개로 제한
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
  ee.tenant_id,
  ee.class_id,
  ee.student_id,
  ee.enrollment_id,
  CURRENT_DATE,
  CASE 
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text)) % 100) < 80 THEN 'present'
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text)) % 100) < 95 THEN 'late'
    ELSE 'absent'
  END::attendance_status,
  CASE 
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text)) % 100) < 80 
    THEN CURRENT_DATE + TIME '09:00' + (RANDOM() * INTERVAL '20 minutes')
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text)) % 100) < 95
    THEN CURRENT_DATE + TIME '09:10' + (RANDOM() * INTERVAL '15 minutes')
    ELSE NULL
  END,
  NOW()
FROM existing_enrollments ee
WHERE NOT EXISTS (
  SELECT 1 FROM attendances a 
  WHERE a.tenant_id = ee.tenant_id 
    AND a.student_id = ee.student_id 
    AND a.attendance_date = CURRENT_DATE
);

-- 3. 최근 7일간 트렌드 데이터 생성 (기존 등록 데이터 활용)
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date as trend_date
),
existing_enrollments AS (
  SELECT 
    se.id as enrollment_id,
    se.class_id,
    se.student_id,
    c.tenant_id
  FROM student_enrollments se
  JOIN classes c ON se.class_id = c.id
  WHERE c.is_active = true 
    AND se.status = 'active'
  LIMIT 30  -- 트렌드 데이터는 더 적게
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
  ee.tenant_id,
  ee.class_id,
  ee.student_id,
  ee.enrollment_id,
  ds.trend_date,
  CASE 
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text || ds.trend_date::text)) % 100) < 75 THEN 'present'
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text || ds.trend_date::text)) % 100) < 90 THEN 'late'
    ELSE 'absent'
  END::attendance_status,
  CASE 
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text || ds.trend_date::text)) % 100) < 75 
    THEN ds.trend_date + TIME '09:00' + (RANDOM() * INTERVAL '15 minutes')
    WHEN (ABS(HASHTEXT(ee.enrollment_id::text || ds.trend_date::text)) % 100) < 90
    THEN ds.trend_date + TIME '09:10' + (RANDOM() * INTERVAL '10 minutes')
    ELSE NULL
  END,
  ds.trend_date + TIME '10:00'  -- 생성 시간
FROM date_series ds
CROSS JOIN existing_enrollments ee
WHERE (ABS(HASHTEXT(ee.class_id::text || ds.trend_date::text)) % 100) < 60  -- 60% 확률로 수업이 있었음
  AND NOT EXISTS (
    SELECT 1 FROM attendances a 
    WHERE a.tenant_id = ee.tenant_id 
      AND a.student_id = ee.student_id 
      AND a.attendance_date = ds.trend_date
  );

-- 4. 최종 데이터 생성 결과 확인
SELECT 
  '🎯 Test Data Generation Results' as section,
  '' as metric,
  '' as value
UNION ALL
SELECT 
  'Active Classes',
  'Total',
  COUNT(*)::text
FROM classes 
WHERE is_active = true
UNION ALL
SELECT 
  'Active Students',
  'Total',
  COUNT(*)::text
FROM students 
WHERE status = 'active'
UNION ALL
SELECT 
  'Student Enrollments',
  'Active',
  COUNT(*)::text
FROM student_enrollments 
WHERE status = 'active'
UNION ALL
SELECT 
  'Today Attendances',
  'Created',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date = CURRENT_DATE
UNION ALL
SELECT 
  'Historical Data',
  'Past 7 Days',
  COUNT(*)::text
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
  AND attendance_date < CURRENT_DATE;

-- 5. 출석률 미리보기
SELECT 
  '📈 Attendance Rate by Date' as section,
  attendance_date::text as date,
  CONCAT(
    COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END), '/',
    COUNT(*), ' (',
    ROUND(
      (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::decimal / 
       COUNT(*)::decimal) * 100, 1
    ), '%)'
  ) as attendance_summary
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
  AND attendance_date <= CURRENT_DATE
GROUP BY attendance_date
ORDER BY attendance_date;

-- 성공 메시지
SELECT '✅ T-V2-008 기존 데이터 기반 테스트 데이터 생성 완료!' as final_message;