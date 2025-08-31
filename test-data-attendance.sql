-- 테스트 데이터 생성 스크립트 (T-V2-008 출석 위젯 테스트용)
-- Supabase Dashboard SQL Editor에서 실행

-- 1. 오늘 날짜의 테스트 클래스 생성 (기존 테넌트 사용)
INSERT INTO classes (id, tenant_id, name, scheduled_at, status, created_at)
VALUES 
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), '수학 기초반', CURRENT_DATE + INTERVAL '09:00', 'active', NOW()),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), '영어 심화반', CURRENT_DATE + INTERVAL '10:00', 'active', NOW()),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), '과학 실험반', CURRENT_DATE + INTERVAL '14:00', 'active', NOW()),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), '국어 독해반', CURRENT_DATE + INTERVAL '15:00', 'active', NOW()),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), '사회 탐구반', CURRENT_DATE + INTERVAL '16:00', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 활성 학생들을 클래스에 등록
WITH test_classes AS (
  SELECT id as class_id FROM classes 
  WHERE scheduled_at::date = CURRENT_DATE 
  ORDER BY scheduled_at 
  LIMIT 5
),
active_students AS (
  SELECT id as student_id FROM students 
  WHERE status = 'active' 
  ORDER BY created_at 
  LIMIT 50
)
INSERT INTO class_memberships (id, class_id, student_id, enrolled_at)
SELECT 
  gen_random_uuid(),
  tc.class_id,
  ast.student_id,
  NOW()
FROM test_classes tc
CROSS JOIN active_students ast
WHERE (ABS(HASHTEXT(tc.class_id::text || ast.student_id::text)) % 100) < 70  -- 70% 확률로 등록
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 3. 오늘 날짜의 출석 데이터 생성 (다양한 상태)
WITH today_classes AS (
  SELECT 
    c.id as class_id,
    c.tenant_id,
    cm.student_id
  FROM classes c
  JOIN class_memberships cm ON c.id = cm.class_id
  WHERE c.scheduled_at::date = CURRENT_DATE
),
attendance_statuses AS (
  SELECT 
    tc.*,
    CASE 
      WHEN (ABS(HASHTEXT(tc.class_id::text || tc.student_id::text)) % 100) < 80 THEN 'present'
      WHEN (ABS(HASHTEXT(tc.class_id::text || tc.student_id::text)) % 100) < 90 THEN 'late'
      ELSE 'absent'
    END as attendance_status,
    CASE 
      WHEN (ABS(HASHTEXT(tc.class_id::text || tc.student_id::text)) % 100) < 80 THEN CURRENT_DATE + INTERVAL '09:00' + (RANDOM() * INTERVAL '30 minutes')
      WHEN (ABS(HASHTEXT(tc.class_id::text || tc.student_id::text)) % 100) < 90 THEN CURRENT_DATE + INTERVAL '09:15' + (RANDOM() * INTERVAL '20 minutes')
      ELSE NULL
    END as check_in_time,
    CASE 
      WHEN (ABS(HASHTEXT(tc.class_id::text || tc.student_id::text)) % 100) >= 90 THEN (RANDOM() * 30)::int
      ELSE NULL
    END as late_minutes
  FROM today_classes tc
)
INSERT INTO attendances (
  id, 
  tenant_id, 
  class_id, 
  student_id, 
  attendance_date, 
  status, 
  check_in_time, 
  late_minutes,
  created_at
)
SELECT 
  gen_random_uuid(),
  tenant_id,
  class_id,
  student_id,
  CURRENT_DATE,
  attendance_status::attendance_status,
  check_in_time,
  late_minutes,
  NOW()
FROM attendance_statuses
ON CONFLICT (class_id, student_id, attendance_date) DO NOTHING;

-- 4. 최근 7일간의 트렌드 데이터 생성
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date as trend_date
),
historical_classes AS (
  SELECT 
    c.id as class_id,
    c.tenant_id,
    cm.student_id,
    ds.trend_date
  FROM classes c
  JOIN class_memberships cm ON c.id = cm.class_id
  CROSS JOIN date_series ds
  WHERE c.scheduled_at::date = CURRENT_DATE -- 같은 클래스들을 과거에도 있었다고 가정
    AND (ABS(HASHTEXT(c.id::text || ds.trend_date::text)) % 100) < 80 -- 80% 확률로 과거에도 수업 있음
),
historical_attendance AS (
  SELECT 
    hc.*,
    CASE 
      WHEN (ABS(HASHTEXT(hc.class_id::text || hc.student_id::text || hc.trend_date::text)) % 100) < 75 THEN 'present'
      WHEN (ABS(HASHTEXT(hc.class_id::text || hc.student_id::text || hc.trend_date::text)) % 100) < 85 THEN 'late'
      ELSE 'absent'
    END as attendance_status
  FROM historical_classes hc
)
INSERT INTO attendances (
  id, 
  tenant_id, 
  class_id, 
  student_id, 
  attendance_date, 
  status, 
  created_at
)
SELECT 
  gen_random_uuid(),
  tenant_id,
  class_id,
  student_id,
  trend_date,
  attendance_status::attendance_status,
  trend_date + INTERVAL '10:00'
FROM historical_attendance
ON CONFLICT (class_id, student_id, attendance_date) DO NOTHING;

-- 5. 테스트 결과 확인 쿼리
SELECT 
  'Today Classes' as category,
  COUNT(*) as count
FROM classes 
WHERE scheduled_at::date = CURRENT_DATE

UNION ALL

SELECT 
  'Today Attendances' as category,
  COUNT(*) as count
FROM attendances 
WHERE attendance_date = CURRENT_DATE

UNION ALL

SELECT 
  'Historical Attendances (7 days)' as category,
  COUNT(*) as count
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
  AND attendance_date < CURRENT_DATE

UNION ALL

SELECT 
  'Active Students' as category,
  COUNT(*) as count
FROM students 
WHERE status = 'active';

-- 6. 출석률 미리보기
SELECT 
  attendance_date,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
  ROUND(
    (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::decimal / 
     COUNT(*)::decimal) * 100, 1
  ) as attendance_rate
FROM attendances 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY attendance_date
ORDER BY attendance_date;