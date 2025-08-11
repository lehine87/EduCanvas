-- EduCanvas 멀티테넌트 샘플 데이터 (확실히 작동하는 버전)
-- UUID는 gen_random_uuid()로 자동 생성하여 오류 방지

-- ================================================================
-- 1. 추가 테넌트 생성 (자동 UUID 생성)
-- ================================================================

-- 테넌트 2: XYZ 교육센터
INSERT INTO tenants (name, slug, contact_email, contact_phone, address) VALUES
('XYZ 교육센터', 'xyz-center', 'admin@xyz-center.com', '02-1234-5678', '서울시 강남구 테헤란로 123')
ON CONFLICT (slug) DO NOTHING;

-- 테넌트 3: 스마트 아카데미
INSERT INTO tenants (name, slug, contact_email, contact_phone, address) VALUES
('스마트 아카데미', 'smart-academy', 'info@smart-academy.kr', '031-9876-5432', '경기도 성남시 분당구 판교로 456')
ON CONFLICT (slug) DO NOTHING;

-- 생성된 테넌트 ID 확인
SELECT 'Generated Tenant IDs:' as info;
SELECT id, name, slug FROM tenants ORDER BY created_at;

-- ================================================================
-- 2. 각 테넌트별 역할 생성 (실제 테넌트 ID 사용)
-- ================================================================

-- 모든 테넌트에 대해 기본 역할 생성
INSERT INTO tenant_roles (tenant_id, name, display_name, is_system_role, hierarchy_level)
SELECT 
    t.id,
    'admin',
    '관리자',
    true,
    1
FROM tenants t
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO tenant_roles (tenant_id, name, display_name, is_system_role, hierarchy_level)
SELECT 
    t.id,
    'instructor',
    '강사',
    true,
    2
FROM tenants t
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO tenant_roles (tenant_id, name, display_name, is_system_role, hierarchy_level)
SELECT 
    t.id,
    'staff',
    '직원',
    true,
    3
FROM tenants t
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO tenant_roles (tenant_id, name, display_name, is_system_role, hierarchy_level)
SELECT 
    t.id,
    'student',
    '학생',
    true,
    4
FROM tenants t
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ================================================================
-- 3. 샘플 클래스 생성 (동적으로 테넌트 ID 참조)
-- ================================================================

-- EduCanvas 데모 학원 추가 클래스
INSERT INTO classes (tenant_id, name, description, subject, level, color, max_students, is_active)
SELECT 
    t.id,
    '수학 심화반',
    '고등학교 수학 심화 과정',
    '수학',
    '고급',
    '#EF4444',
    15,
    true
FROM tenants t 
WHERE t.slug = 'demo-academy';

INSERT INTO classes (tenant_id, name, description, subject, level, color, max_students, is_active)
SELECT 
    t.id,
    '영어 토론반',
    '중급 영어 토론 및 발표',
    '영어',
    '중급',
    '#F59E0B',
    12,
    true
FROM tenants t 
WHERE t.slug = 'demo-academy';

-- XYZ 교육센터 클래스
INSERT INTO classes (tenant_id, name, description, subject, level, color, max_students, is_active)
SELECT 
    t.id,
    '국어 문학반',
    '고등학교 국어 문학 집중',
    '국어',
    '고급',
    '#06B6D4',
    20,
    true
FROM tenants t 
WHERE t.slug = 'xyz-center';

INSERT INTO classes (tenant_id, name, description, subject, level, color, max_students, is_active)
SELECT 
    t.id,
    '수학 기초반',
    '중학교 수학 기초',
    '수학',
    '초급',
    '#10B981',
    25,
    true
FROM tenants t 
WHERE t.slug = 'xyz-center';

-- 스마트 아카데미 클래스
INSERT INTO classes (tenant_id, name, description, subject, level, color, max_students, is_active)
SELECT 
    t.id,
    '프로그래밍 입문',
    'Python 프로그래밍 기초',
    '컴퓨터',
    '초급',
    '#3B82F6',
    12,
    true
FROM tenants t 
WHERE t.slug = 'smart-academy';

INSERT INTO classes (tenant_id, name, description, subject, level, color, max_students, is_active)
SELECT 
    t.id,
    'AI 기초반',
    '인공지능과 머신러닝 개론',
    '컴퓨터',
    '중급',
    '#9333EA',
    15,
    true
FROM tenants t 
WHERE t.slug = 'smart-academy';

-- ================================================================
-- 4. 샘플 학생 데이터 생성 (동적으로 테넌트 ID 참조)
-- ================================================================

-- EduCanvas 데모 학원 학생들
INSERT INTO students (tenant_id, student_number, name, name_english, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'ST001',
    '김민수',
    'Kim Min Su',
    '2008-03-15',
    'male',
    '010-1234-5678',
    'minsu.kim@example.com',
    '서울고등학교',
    '고1',
    'active'
FROM tenants t 
WHERE t.slug = 'demo-academy'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

INSERT INTO students (tenant_id, student_number, name, name_english, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'ST002',
    '이서연',
    'Lee Seo Yeon',
    '2009-07-22',
    'female',
    '010-2345-6789',
    'seoyeon.lee@example.com',
    '강남중학교',
    '중3',
    'active'
FROM tenants t 
WHERE t.slug = 'demo-academy'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

INSERT INTO students (tenant_id, student_number, name, name_english, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'ST003',
    '박준호',
    'Park Jun Ho',
    '2008-11-08',
    'male',
    '010-3456-7890',
    'junho.park@example.com',
    '서울고등학교',
    '고1',
    'active'
FROM tenants t 
WHERE t.slug = 'demo-academy'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

-- XYZ 교육센터 학생들
INSERT INTO students (tenant_id, student_number, name, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'XYZ001',
    '홍길동',
    '2007-12-25',
    'male',
    '010-1111-2222',
    'gildong.hong@xyz.com',
    '서초고등학교',
    '고2',
    'active'
FROM tenants t 
WHERE t.slug = 'xyz-center'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

INSERT INTO students (tenant_id, student_number, name, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'XYZ002',
    '김영희',
    '2008-04-18',
    'female',
    '010-2222-3333',
    'younghee.kim@xyz.com',
    '강남고등학교',
    '고1',
    'active'
FROM tenants t 
WHERE t.slug = 'xyz-center'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

-- 스마트 아카데미 학생들
INSERT INTO students (tenant_id, student_number, name, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'SM001',
    '강지민',
    '2006-08-14',
    'female',
    '010-7777-8888',
    'jimin.kang@smart.kr',
    '분당고등학교',
    '고3',
    'active'
FROM tenants t 
WHERE t.slug = 'smart-academy'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

INSERT INTO students (tenant_id, student_number, name, birth_date, gender, phone, email, school_name, grade_level, status)
SELECT 
    t.id,
    'SM002',
    '윤성호',
    '2007-02-28',
    'male',
    '010-8888-9999',
    'seongho.yoon@smart.kr',
    '판교고등학교',
    '고2',
    'active'
FROM tenants t 
WHERE t.slug = 'smart-academy'
ON CONFLICT (tenant_id, student_number) DO NOTHING;

-- ================================================================
-- 5. 수강권 패키지 생성 (기존 클래스와 연결)
-- ================================================================

-- EduCanvas 데모 학원 수강권 (기존 클래스 ID 사용)
INSERT INTO course_packages (tenant_id, class_id, name, description, billing_type, price, sessions, validity_days)
SELECT 
    t.id,
    c.id,
    '수학 기초반 월 패키지',
    '월 8회 수업',
    'sessions',
    320000,
    8,
    30
FROM tenants t
JOIN classes c ON c.tenant_id = t.id
WHERE t.slug = 'demo-academy' AND c.name = '수학 기초반';

INSERT INTO course_packages (tenant_id, class_id, name, description, billing_type, price, sessions, validity_days)
SELECT 
    t.id,
    c.id,
    '영어 회화반 월 패키지',
    '월 12회 수업',
    'sessions',
    480000,
    12,
    30
FROM tenants t
JOIN classes c ON c.tenant_id = t.id
WHERE t.slug = 'demo-academy' AND c.name = '영어 회화반';

-- ================================================================
-- 6. 학생 수강 등록 (ClassFlow 테스트용)
-- ================================================================

-- EduCanvas 데모 학원 수강 등록 (position_in_class 설정)
INSERT INTO student_enrollments (tenant_id, student_id, class_id, package_id, enrollment_date, start_date, sessions_total, sessions_used, sessions_remaining, original_price, final_price, position_in_class, status)
SELECT 
    s.tenant_id,
    s.id,
    c.id,
    cp.id,
    '2025-08-01',
    '2025-08-01',
    8,
    2,
    6,
    320000,
    320000,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY s.name),
    'active'
FROM students s
JOIN tenants t ON t.id = s.tenant_id
JOIN classes c ON c.tenant_id = t.id
LEFT JOIN course_packages cp ON cp.class_id = c.id
WHERE t.slug = 'demo-academy' 
  AND c.name IN ('수학 기초반', '영어 회화반')
  AND s.student_number IN ('ST001', 'ST002', 'ST003');

-- ================================================================
-- 7. 샘플 동영상 강의 생성
-- ================================================================

-- EduCanvas 데모 학원 동영상들
INSERT INTO videos (tenant_id, class_id, title, description, youtube_video_id, youtube_url, duration_seconds, video_type, status, order_index)
SELECT 
    t.id,
    c.id,
    '수학 기초 1강 - 정수와 유리수',
    '중학교 수학의 기초가 되는 정수와 유리수에 대해 배웁니다.',
    'dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    1800,
    'lecture',
    'published',
    1
FROM tenants t
JOIN classes c ON c.tenant_id = t.id
WHERE t.slug = 'demo-academy' AND c.name = '수학 기초반';

INSERT INTO videos (tenant_id, class_id, title, description, youtube_video_id, youtube_url, duration_seconds, video_type, status, order_index)
SELECT 
    t.id,
    c.id,
    '영어 회화 1강 - 기본 인사',
    '영어 기본 인사와 자기소개 표현을 배웁니다.',
    'dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    1500,
    'lecture',
    'published',
    1
FROM tenants t
JOIN classes c ON c.tenant_id = t.id
WHERE t.slug = 'demo-academy' AND c.name = '영어 회화반';

-- ================================================================
-- 8. 샘플 동영상 시청 기록
-- ================================================================

-- 학생들의 동영상 시청 기록
INSERT INTO video_watch_sessions (tenant_id, video_id, student_id, enrollment_id, watch_status, progress_seconds, completion_percentage, total_watch_time, play_count)
SELECT 
    v.tenant_id,
    v.id,
    s.id,
    se.id,
    'completed',
    1800,
    100.0,
    1800,
    1
FROM videos v
JOIN students s ON s.tenant_id = v.tenant_id
JOIN student_enrollments se ON se.student_id = s.id AND se.class_id = v.class_id
WHERE v.title LIKE '%수학 기초%' AND s.student_number = 'ST001'
ON CONFLICT (student_id, video_id) DO NOTHING;

INSERT INTO video_watch_sessions (tenant_id, video_id, student_id, enrollment_id, watch_status, progress_seconds, completion_percentage, total_watch_time, play_count)
SELECT 
    v.tenant_id,
    v.id,
    s.id,
    se.id,
    'in_progress',
    900,
    50.0,
    900,
    1
FROM videos v
JOIN students s ON s.tenant_id = v.tenant_id
JOIN student_enrollments se ON se.student_id = s.id AND se.class_id = v.class_id
WHERE v.title LIKE '%수학 기초%' AND s.student_number = 'ST002'
ON CONFLICT (student_id, video_id) DO NOTHING;

-- ================================================================
-- 9. 데이터 확인 및 통계
-- ================================================================

-- 생성된 데이터 요약 확인
SELECT 
  '테넌트' as category,
  (SELECT COUNT(*) FROM tenants) as count
UNION ALL
SELECT 
  '사용자 역할',
  (SELECT COUNT(*) FROM tenant_roles)
UNION ALL
SELECT 
  '클래스',
  (SELECT COUNT(*) FROM classes)
UNION ALL
SELECT 
  '학생',
  (SELECT COUNT(*) FROM students)
UNION ALL
SELECT 
  '수강권',
  (SELECT COUNT(*) FROM course_packages)
UNION ALL
SELECT 
  '수강 등록',
  (SELECT COUNT(*) FROM student_enrollments)
UNION ALL
SELECT 
  '동영상 강의',
  (SELECT COUNT(*) FROM videos)
UNION ALL
SELECT 
  '시청 기록',
  (SELECT COUNT(*) FROM video_watch_sessions);

-- 테넌트별 데이터 분포 확인
SELECT 
  t.name as tenant_name,
  t.slug,
  COUNT(DISTINCT c.id) as classes,
  COUNT(DISTINCT s.id) as students,
  COUNT(DISTINCT se.id) as enrollments,
  COUNT(DISTINCT v.id) as videos
FROM tenants t
LEFT JOIN classes c ON c.tenant_id = t.id
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN student_enrollments se ON se.tenant_id = t.id
LEFT JOIN videos v ON v.tenant_id = t.id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name;

-- ClassFlow 테스트용 수강 등록 위치 확인
SELECT 
    t.name as tenant_name,
    c.name as class_name,
    s.name as student_name,
    se.position_in_class,
    se.status
FROM student_enrollments se
JOIN tenants t ON t.id = se.tenant_id
JOIN classes c ON c.id = se.class_id
JOIN students s ON s.id = se.student_id
ORDER BY t.name, c.name, se.position_in_class;

-- 성공 메시지
SELECT '🎉 EduCanvas 멀티테넌트 샘플 데이터가 성공적으로 생성되었습니다! 모든 UUID 오류가 해결되었습니다!' as message;