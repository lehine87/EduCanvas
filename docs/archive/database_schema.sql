-- EduCanvas 학원 관리 시스템 데이터베이스 스키마
-- 작성일: 2025-08-08
-- 데이터베이스: Supabase (PostgreSQL)

-- ================================================================
-- 1. ENUMS (열거형 타입 정의)
-- ================================================================

-- 학생 상태
CREATE TYPE student_status AS ENUM ('active', 'waiting', 'inactive', 'graduated');

-- 사용자 역할
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'staff', 'viewer');

-- 출석 상태  
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'excused');

-- 결제 상태
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled');

-- 결제 방법
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'mobile');

-- 급여 유형
CREATE TYPE salary_type AS ENUM ('hourly', 'monthly', 'per_class');

-- ================================================================
-- 2. CORE TABLES (핵심 테이블)
-- ================================================================

-- 사용자 테이블 (인증 및 권한)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 강사 테이블
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialization VARCHAR(100),
    qualification TEXT, -- 자격증 정보
    salary_type salary_type DEFAULT 'monthly',
    salary_amount INTEGER DEFAULT 0,
    bank_account VARCHAR(50),
    status student_status DEFAULT 'active',
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 클래스(반) 테이블
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    grade_level VARCHAR(20), -- 초1, 중2, 고3 등
    max_students INTEGER DEFAULT 20,
    current_students INTEGER DEFAULT 0,
    monthly_fee INTEGER NOT NULL DEFAULT 0,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    classroom VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6', -- HEX 색상
    status student_status DEFAULT 'active',
    order_index INTEGER DEFAULT 0, -- 정렬 순서
    start_date DATE,
    end_date DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 테이블  
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20) NOT NULL,
    grade VARCHAR(20), -- 초1, 중2, 고3 등
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    status student_status DEFAULT 'active',
    monthly_fee INTEGER DEFAULT 0, -- 개별 수강료 (할인 적용)
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    position_in_class INTEGER DEFAULT 0, -- 반 내 위치 (드래그앤드롭용)
    display_color VARCHAR(7), -- 개별 학생 색상
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_position_per_class UNIQUE(class_id, position_in_class),
    CONSTRAINT valid_monthly_fee CHECK (monthly_fee >= 0)
);

-- 출결 테이블
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status DEFAULT 'present',
    check_in_time TIME,
    check_out_time TIME,
    temperature DECIMAL(3,1), -- 체온 (코로나 대응)
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건: 학생별, 날짜별 유일성
    CONSTRAINT unique_student_date UNIQUE(student_id, attendance_date)
);

-- 결제 테이블
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_method payment_method DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    receipt_number VARCHAR(50),
    transaction_id VARCHAR(100), -- 외부 결제 시스템 ID
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- 클래스 스케줄 테이블 (수업 시간표)
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=일요일
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_class_schedule UNIQUE(class_id, day_of_week, start_time)
);

-- ================================================================
-- 3. INDEXES (성능 최적화용 인덱스)
-- ================================================================

-- 자주 조회되는 컬럼들에 인덱스 생성
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_attendances_student_date ON attendances(student_id, attendance_date);
CREATE INDEX idx_attendances_class_date ON attendances(class_id, attendance_date);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- ================================================================
-- 4. FUNCTIONS & TRIGGERS (자동화 로직)
-- ================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 설정
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 클래스 학생 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 이전 클래스의 학생 수 업데이트
    IF OLD.class_id IS NOT NULL THEN
        UPDATE classes 
        SET current_students = (
            SELECT COUNT(*) 
            FROM students 
            WHERE class_id = OLD.class_id AND status = 'active'
        )
        WHERE id = OLD.class_id;
    END IF;
    
    -- 새 클래스의 학생 수 업데이트
    IF NEW.class_id IS NOT NULL THEN
        UPDATE classes 
        SET current_students = (
            SELECT COUNT(*) 
            FROM students 
            WHERE class_id = NEW.class_id AND status = 'active'
        )
        WHERE id = NEW.class_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 학생 상태/클래스 변경 시 클래스 학생 수 업데이트 트리거
CREATE TRIGGER update_class_count_on_student_change
    AFTER UPDATE OF class_id, status ON students
    FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- 학생 삽입 시 클래스 학생 수 업데이트 트리거
CREATE TRIGGER update_class_count_on_student_insert
    AFTER INSERT ON students
    FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- position_in_class 자동 할당 함수
CREATE OR REPLACE FUNCTION assign_position_in_class()
RETURNS TRIGGER AS $$
BEGIN
    -- position_in_class가 지정되지 않았으면 자동 할당
    IF NEW.position_in_class = 0 OR NEW.position_in_class IS NULL THEN
        SELECT COALESCE(MAX(position_in_class), 0) + 1
        INTO NEW.position_in_class
        FROM students
        WHERE class_id = NEW.class_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 학생 삽입 시 position 자동 할당 트리거
CREATE TRIGGER assign_position_on_student_insert
    BEFORE INSERT ON students
    FOR EACH ROW EXECUTE FUNCTION assign_position_in_class();

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS) 설정
-- ================================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 인증된 사용자만 접근 가능
CREATE POLICY "Enable read for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON instructors
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON classes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON students
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON attendances
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON class_schedules
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================================
-- 6. SAMPLE DATA (개발용 샘플 데이터)
-- ================================================================

-- 샘플 사용자 (개발환경에서만 사용)
INSERT INTO users (email, name, role) VALUES
    ('admin@educanvas.com', '관리자', 'admin'),
    ('teacher@educanvas.com', '김선생', 'instructor'),
    ('staff@educanvas.com', '박직원', 'staff');

-- 샘플 강사
INSERT INTO instructors (name, phone, specialization, salary_type, salary_amount) VALUES
    ('김영희 선생님', '010-1234-5678', '수학', 'monthly', 3000000),
    ('이철수 선생님', '010-2345-6789', '영어', 'per_class', 50000),
    ('박미나 선생님', '010-3456-7890', '국어', 'monthly', 2800000);

-- 샘플 클래스
INSERT INTO classes (name, subject, grade_level, monthly_fee, classroom, color) VALUES
    ('중1 수학 A반', '수학', '중1', 180000, '301호', '#3B82F6'),
    ('중2 영어 심화반', '영어', '중2', 200000, '302호', '#10B981'),
    ('고3 국어 특강', '국어', '고3', 250000, '401호', '#F59E0B');

-- 샘플 학생 (클래스별로 배정)
INSERT INTO students (name, parent_name, parent_phone, grade, class_id, monthly_fee) VALUES
    ('김민수', '김아버지', '010-1111-2222', '중1', (SELECT id FROM classes WHERE name = '중1 수학 A반'), 180000),
    ('이지영', '이어머니', '010-3333-4444', '중1', (SELECT id FROM classes WHERE name = '중1 수학 A반'), 180000),
    ('박서준', '박아버지', '010-5555-6666', '중2', (SELECT id FROM classes WHERE name = '중2 영어 심화반'), 200000),
    ('최수빈', '최어머니', '010-7777-8888', '고3', (SELECT id FROM classes WHERE name = '고3 국어 특강'), 250000);

-- ================================================================
-- 7. VIEWS (자주 사용하는 조회용 뷰)
-- ================================================================

-- 학생 상세 정보 뷰 (클래스 정보 포함)
CREATE VIEW student_details AS
SELECT 
    s.id,
    s.name,
    s.phone,
    s.parent_name,
    s.parent_phone,
    s.grade,
    s.status,
    s.monthly_fee,
    s.enrollment_date,
    s.position_in_class,
    c.name AS class_name,
    c.subject,
    c.classroom,
    c.color AS class_color,
    i.name AS instructor_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN instructors i ON c.instructor_id = i.id;

-- 클래스 통계 뷰
CREATE VIEW class_stats AS
SELECT 
    c.id,
    c.name,
    c.max_students,
    c.current_students,
    c.monthly_fee,
    ROUND((c.current_students::DECIMAL / c.max_students) * 100, 2) AS occupancy_rate,
    c.current_students * c.monthly_fee AS monthly_revenue
FROM classes c;

-- 출석 통계 뷰 (최근 30일)
CREATE VIEW attendance_stats AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    c.name AS class_name,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(*) AS total_days,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) AS attendance_rate
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN attendances a ON s.id = a.student_id 
    AND a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.id, s.name, c.name;

-- 미납 현황 뷰
CREATE VIEW payment_overdue AS
SELECT 
    s.name AS student_name,
    s.parent_phone,
    p.amount,
    p.due_date,
    CURRENT_DATE - p.due_date AS overdue_days,
    p.memo
FROM payments p
JOIN students s ON p.student_id = s.id
WHERE p.status IN ('pending', 'overdue')
    AND p.due_date < CURRENT_DATE
ORDER BY p.due_date;

-- ================================================================
-- 스키마 생성 완료
-- ================================================================

-- 데이터베이스 코멘트
COMMENT ON DATABASE postgres IS 'EduCanvas 학원 관리 시스템 - 2025.08.08';

-- 주요 테이블 코멘트
COMMENT ON TABLE students IS '학생 정보 및 등록 상태 관리';
COMMENT ON TABLE classes IS '클래스(반) 정보 및 설정';
COMMENT ON TABLE instructors IS '강사 정보 및 급여 관리';
COMMENT ON TABLE attendances IS '출결 관리 - 일별 출석 기록';
COMMENT ON TABLE payments IS '수강료 결제 및 미납 관리';
COMMENT ON TABLE users IS '시스템 사용자 인증 및 권한';

-- 스키마 버전 정보
CREATE TABLE schema_versions (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_versions (version, description) VALUES 
    ('1.0.0', '초기 스키마 - 학생/클래스/강사/출결/결제 관리');