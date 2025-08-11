-- EduCanvas 멀티테넌트 샘플 데이터
-- Run this script AFTER schema_setup.sql and rls_policies.sql

-- ================================================================
-- 1. 추가 테넌트 생성
-- ================================================================

-- 테넌트 2: XYZ 교육센터
INSERT INTO tenants (id, name, slug, contact_email, contact_phone, address) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'XYZ 교육센터', 'xyz-center', 'admin@xyz-center.com', '02-1234-5678', '서울시 강남구 테헤란로 123')
ON CONFLICT (slug) DO NOTHING;

-- 테넌트 3: 스마트 아카데미  
INSERT INTO tenants (id, name, slug, contact_email, contact_phone, address) VALUES
('ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', '스마트 아카데미', 'smart-academy', 'info@smart-academy.kr', '031-9876-5432', '경기도 성남시 분당구 판교로 456')
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- 2. 각 테넌트별 역할 생성
-- ================================================================

-- XYZ 교육센터 역할
INSERT INTO tenant_roles (id, tenant_id, name, display_name, is_system_role, hierarchy_level) VALUES
('bbbb1111-2222-3333-4444-555555555555', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'admin', '관리자', true, 1),
('bbbb2222-3333-4444-5555-666666666666', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'instructor', '강사', true, 2),
('bbbb3333-4444-5555-6666-777777777777', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'staff', '직원', true, 3),
('bbbb4444-5555-6666-7777-888888888888', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'student', '학생', true, 4)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 스마트 아카데미 역할
INSERT INTO tenant_roles (id, tenant_id, name, display_name, is_system_role, hierarchy_level) VALUES
('cccc1111-2222-3333-4444-555555555555', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'admin', '관리자', true, 1),
('cccc2222-3333-4444-5555-666666666666', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'instructor', '강사', true, 2),
('cccc3333-4444-5555-6666-777777777777', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'staff', '직원', true, 3),
('cccc4444-5555-6666-7777-888888888888', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'student', '학생', true, 4)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ================================================================
-- 3. 샘플 클래스 생성 (각 테넌트별)
-- ================================================================

-- EduCanvas 데모 학원 추가 클래스
INSERT INTO classes (id, tenant_id, name, description, subject, level, color, max_students, is_active) VALUES
('class001-demo-math-adv', '11111111-1111-1111-1111-111111111111', '수학 심화반', '고등학교 수학 심화 과정', '수학', '고급', '#EF4444', 15, true),
('class002-demo-eng-conv', '11111111-1111-1111-1111-111111111111', '영어 토론반', '중급 영어 토론 및 발표', '영어', '중급', '#F59E0B', 12, true),
('class003-demo-sci-exp', '11111111-1111-1111-1111-111111111111', '과학 실험반', '물리/화학 실험 중심 수업', '과학', '중급', '#8B5CF6', 10, true)
ON CONFLICT (id) DO NOTHING;

-- XYZ 교육센터 클래스
INSERT INTO classes (id, tenant_id, name, description, subject, level, color, max_students, is_active) VALUES
('class001-xyz-korean', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '국어 문학반', '고등학교 국어 문학 집중', '국어', '고급', '#06B6D4', 20, true),
('class002-xyz-math', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '수학 기초반', '중학교 수학 기초', '수학', '초급', '#10B981', 25, true),
('class003-xyz-english', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '영어 문법반', '영어 문법 완성', '영어', '중급', '#F97316', 18, true)
ON CONFLICT (id) DO NOTHING;

-- 스마트 아카데미 클래스
INSERT INTO classes (id, tenant_id, name, description, subject, level, color, max_students, is_active) VALUES
('class001-smart-coding', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', '프로그래밍 입문', 'Python 프로그래밍 기초', '컴퓨터', '초급', '#3B82F6', 12, true),
('class002-smart-ai', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'AI 기초반', '인공지능과 머신러닝 개론', '컴퓨터', '중급', '#9333EA', 15, true),
('class003-smart-web', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', '웹 개발반', 'HTML, CSS, JavaScript', '컴퓨터', '초급', '#EC4899', 20, true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 4. 샘플 학생 데이터 생성
-- ================================================================

-- EduCanvas 데모 학원 학생들
INSERT INTO students (id, tenant_id, student_number, name, name_english, birth_date, gender, phone, email, school_name, grade_level, status) VALUES
('student001-demo', '11111111-1111-1111-1111-111111111111', 'ST001', '김민수', 'Kim Min Su', '2008-03-15', 'male', '010-1234-5678', 'minsu.kim@example.com', '서울고등학교', '고1', 'active'),
('student002-demo', '11111111-1111-1111-1111-111111111111', 'ST002', '이서연', 'Lee Seo Yeon', '2009-07-22', 'female', '010-2345-6789', 'seoyeon.lee@example.com', '강남중학교', '중3', 'active'),
('student003-demo', '11111111-1111-1111-1111-111111111111', 'ST003', '박준호', 'Park Jun Ho', '2008-11-08', 'male', '010-3456-7890', 'junho.park@example.com', '서울고등학교', '고1', 'active'),
('student004-demo', '11111111-1111-1111-1111-111111111111', 'ST004', '최유진', 'Choi Yu Jin', '2009-01-30', 'female', '010-4567-8901', 'yujin.choi@example.com', '강남중학교', '중3', 'active'),
('student005-demo', '11111111-1111-1111-1111-111111111111', 'ST005', '장태현', 'Jang Tae Hyeon', '2008-05-12', 'male', '010-5678-9012', 'taehyeon.jang@example.com', '서울고등학교', '고1', 'active')
ON CONFLICT (tenant_id, student_number) DO NOTHING;

-- XYZ 교육센터 학생들
INSERT INTO students (id, tenant_id, student_number, name, birth_date, gender, phone, email, school_name, grade_level, status) VALUES
('student001-xyz', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'XYZ001', '홍길동', '2007-12-25', 'male', '010-1111-2222', 'gildong.hong@xyz.com', '서초고등학교', '고2', 'active'),
('student002-xyz', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'XYZ002', '김영희', '2008-04-18', 'female', '010-2222-3333', 'younghee.kim@xyz.com', '강남고등학교', '고1', 'active'),
('student003-xyz', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'XYZ003', '이철수', '2009-09-03', 'male', '010-3333-4444', 'cheolsu.lee@xyz.com', '역삼중학교', '중3', 'active')
ON CONFLICT (tenant_id, student_number) DO NOTHING;

-- 스마트 아카데미 학생들
INSERT INTO students (id, tenant_id, student_number, name, birth_date, gender, phone, email, school_name, grade_level, status) VALUES
('student001-smart', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'SM001', '강지민', '2006-08-14', 'female', '010-7777-8888', 'jimin.kang@smart.kr', '분당고등학교', '고3', 'active'),
('student002-smart', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'SM002', '윤성호', '2007-02-28', 'male', '010-8888-9999', 'seongho.yoon@smart.kr', '판교고등학교', '고2', 'active'),
('student003-smart', 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', 'SM003', '정수아', '2008-06-11', 'female', '010-9999-0000', 'sua.jung@smart.kr', '성남고등학교', '고1', 'active')
ON CONFLICT (tenant_id, student_number) DO NOTHING;

-- ================================================================
-- 5. 수강권 패키지 생성
-- ================================================================

-- EduCanvas 데모 학원 수강권
INSERT INTO course_packages (id, tenant_id, class_id, name, description, billing_type, price, sessions, validity_days) VALUES
('package001-demo', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', '수학 기초반 월 패키지', '월 8회 수업', 'sessions', 320000, 8, 30),
('package002-demo', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', '영어 회화반 월 패키지', '월 12회 수업', 'sessions', 480000, 12, 30),
('package003-demo', '11111111-1111-1111-1111-111111111111', 'class001-demo-math-adv', '수학 심화반 집중 패키지', '월 16회 수업', 'sessions', 640000, 16, 30)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 6. 학생 수강 등록
-- ================================================================

-- EduCanvas 데모 학원 수강 등록
INSERT INTO student_enrollments (id, tenant_id, student_id, class_id, package_id, enrollment_date, start_date, sessions_total, sessions_used, sessions_remaining, original_price, final_price, position_in_class, status) VALUES
('enroll001-demo', '11111111-1111-1111-1111-111111111111', 'student001-demo', '66666666-6666-6666-6666-666666666666', 'package001-demo', '2025-08-01', '2025-08-01', 8, 2, 6, 320000, 320000, 1, 'active'),
('enroll002-demo', '11111111-1111-1111-1111-111111111111', 'student002-demo', '66666666-6666-6666-6666-666666666666', 'package001-demo', '2025-08-01', '2025-08-01', 8, 1, 7, 320000, 288000, 2, 'active'),
('enroll003-demo', '11111111-1111-1111-1111-111111111111', 'student003-demo', '77777777-7777-7777-7777-777777777777', 'package002-demo', '2025-08-01', '2025-08-01', 12, 3, 9, 480000, 480000, 1, 'active'),
('enroll004-demo', '11111111-1111-1111-1111-111111111111', 'student004-demo', '77777777-7777-7777-7777-777777777777', 'package002-demo', '2025-08-01', '2025-08-01', 12, 2, 10, 480000, 432000, 2, 'active'),
('enroll005-demo', '11111111-1111-1111-1111-111111111111', 'student005-demo', 'class001-demo-math-adv', 'package003-demo', '2025-08-01', '2025-08-01', 16, 5, 11, 640000, 640000, 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 7. 샘플 동영상 강의 생성
-- ================================================================

-- EduCanvas 데모 학원 동영상들
INSERT INTO videos (id, tenant_id, class_id, title, description, youtube_video_id, youtube_url, duration_seconds, video_type, status, order_index) VALUES
('video001-demo', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', '수학 기초 1강 - 정수와 유리수', '중학교 수학의 기초가 되는 정수와 유리수에 대해 배웁니다.', 'dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1800, 'lecture', 'published', 1),
('video002-demo', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', '수학 기초 2강 - 일차방정식', '일차방정식의 개념과 풀이 방법을 학습합니다.', 'dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2100, 'lecture', 'published', 2),
('video003-demo', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', '영어 회화 1강 - 기본 인사', '영어 기본 인사와 자기소개 표현을 배웁니다.', 'dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1500, 'lecture', 'published', 1),
('video004-demo', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', '영어 회화 2강 - 일상 대화', '일상생활에서 자주 사용하는 영어 표현들을 학습합니다.', 'dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1800, 'lecture', 'published', 2)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 8. 샘플 동영상 시청 기록
-- ================================================================

-- 학생들의 동영상 시청 기록
INSERT INTO video_watch_sessions (id, tenant_id, video_id, student_id, enrollment_id, watch_status, progress_seconds, completion_percentage, total_watch_time, play_count) VALUES
('watch001-demo', '11111111-1111-1111-1111-111111111111', 'video001-demo', 'student001-demo', 'enroll001-demo', 'completed', 1800, 100.0, 1800, 1),
('watch002-demo', '11111111-1111-1111-1111-111111111111', 'video001-demo', 'student002-demo', 'enroll002-demo', 'in_progress', 900, 50.0, 900, 1),
('watch003-demo', '11111111-1111-1111-1111-111111111111', 'video002-demo', 'student001-demo', 'enroll001-demo', 'in_progress', 1200, 57.1, 1200, 1),
('watch004-demo', '11111111-1111-1111-1111-111111111111', 'video003-demo', 'student003-demo', 'enroll003-demo', 'completed', 1500, 100.0, 1500, 1),
('watch005-demo', '11111111-1111-1111-1111-111111111111', 'video003-demo', 'student004-demo', 'enroll004-demo', 'in_progress', 750, 50.0, 750, 1)
ON CONFLICT (student_id, video_id) DO NOTHING;

-- ================================================================
-- 9. 통계 및 데이터 확인 쿼리
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

-- 테넌트별 데이터 분포
SELECT 
  t.name as tenant_name,
  COUNT(DISTINCT c.id) as classes,
  COUNT(DISTINCT s.id) as students,
  COUNT(DISTINCT se.id) as enrollments,
  COUNT(DISTINCT v.id) as videos
FROM tenants t
LEFT JOIN classes c ON c.tenant_id = t.id
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN student_enrollments se ON se.tenant_id = t.id
LEFT JOIN videos v ON v.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 성공 메시지
SELECT 'EduCanvas 멀티테넌트 샘플 데이터가 성공적으로 생성되었습니다!' as message;