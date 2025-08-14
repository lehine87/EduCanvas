-- EduCanvas 학원 관리 시스템 데이터베이스 스키마 v2.0
-- 작성일: 2025-08-08
-- 데이터베이스: Supabase (PostgreSQL)
-- 주요 개선: 복잡한 요금제 정책 및 급여 정책 지원

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
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled', 'refunded');

-- 결제 방법
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'mobile');

-- 수강권 청구 유형
CREATE TYPE billing_type AS ENUM (
    'monthly',      -- 월 정액제
    'sessions',     -- 회차제 (10회권, 20회권)
    'hours',        -- 시간제
    'package',      -- 패키지 (3개월, 6개월)
    'drop_in'       -- 드롭인 (매회 결제)
);

-- 할인 유형
CREATE TYPE discount_type AS ENUM (
    'sibling',          -- 형제 할인
    'early_payment',    -- 조기 납부 할인
    'loyalty',          -- 장기 수강 할인
    'scholarship',      -- 장학금
    'promotion',        -- 프로모션
    'volume'           -- 다과목 할인
);

-- 급여 정책 유형
CREATE TYPE salary_policy_type AS ENUM (
    'fixed_monthly',     -- 고정 월급
    'fixed_hourly',      -- 고정 시급  
    'commission',        -- 단순 비율제
    'tiered_commission', -- 누진 비율제
    'student_based',     -- 학생 수 기준
    'hybrid',           -- 혼합형 (기본급 + 성과급)
    'guaranteed_minimum' -- 최소 보장형
);

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

-- 강사 테이블 (급여 정책 별도 관리)
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialization VARCHAR(100),     -- 전문 분야
    qualification TEXT,              -- 자격증 정보
    bank_account VARCHAR(50),        -- 급여 계좌
    status student_status DEFAULT 'active',
    hire_date DATE DEFAULT CURRENT_DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 클래스(반) 테이블
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    grade_level VARCHAR(20),         -- 초1, 중2, 고3 등
    max_students INTEGER DEFAULT 20,
    current_students INTEGER DEFAULT 0, -- 자동 계산됨
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    classroom VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6', -- HEX 색상
    status student_status DEFAULT 'active',
    order_index INTEGER DEFAULT 0,   -- UI 정렬 순서
    start_date DATE,
    end_date DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 테이블 (수강료는 별도 관리)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20) NOT NULL,
    grade VARCHAR(20),               -- 학년
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    status student_status DEFAULT 'active',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    position_in_class INTEGER DEFAULT 0, -- 드래그앤드롭용 위치
    display_color VARCHAR(7),        -- 개별 학생 색상
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_position_per_class UNIQUE(class_id, position_in_class)
);

-- ================================================================
-- 3. 요금제 시스템 (완전 새로운 구조)
-- ================================================================

-- 클래스별 수강권 옵션들
CREATE TABLE course_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,           -- "10회권", "3개월 패키지"
    billing_type billing_type NOT NULL,
    
    -- 가격 정보
    base_price INTEGER NOT NULL,          -- 기본 가격
    
    -- 수량/기간 정보 (billing_type에 따라 다르게 사용)
    sessions_count INTEGER,               -- 회차제: 총 수업 횟수
    hours_count DECIMAL(5,2),            -- 시간제: 총 수업 시간
    duration_months INTEGER,              -- 패키지: 유효 개월 수
    duration_days INTEGER,                -- 패키지: 유효 일 수
    
    -- 할인 정보
    discount_rate DECIMAL(5,2) DEFAULT 0, -- 기본 할인율 (%)
    
    -- 정책 설정
    is_active BOOLEAN DEFAULT true,
    auto_renewal BOOLEAN DEFAULT false,   -- 자동 갱신 여부
    sort_order INTEGER DEFAULT 0,        -- 표시 순서
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 할인 정책 관리
CREATE TABLE discount_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    discount_type discount_type NOT NULL,
    
    -- 할인 조건 (JSON으로 유연하게 관리)
    conditions JSONB,                     -- {"sibling_order": 2, "min_months": 3}
    
    -- 할인 혜택
    discount_rate DECIMAL(5,2),          -- 할인율 (%)
    discount_amount INTEGER,             -- 고정 할인 금액
    max_discount_amount INTEGER,         -- 최대 할인 한도
    
    -- 적용 기간
    valid_from DATE,
    valid_until DATE,
    
    -- 적용 조건
    min_purchase_amount INTEGER DEFAULT 0,
    applicable_billing_types billing_type[], -- 적용 가능한 청구 유형들
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생별 수강권 등록 관리
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_package_id UUID REFERENCES course_packages(id) ON DELETE RESTRICT,
    
    -- 등록 정보
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE,                        -- 만료일 (패키지형)
    
    -- 가격 정보 (할인 적용 후 확정가)
    original_price INTEGER NOT NULL,      -- 원가
    final_price INTEGER NOT NULL,        -- 최종 가격
    applied_discounts JSONB,             -- 적용된 할인 내역
    
    -- 사용량 추적
    total_sessions INTEGER DEFAULT 0,    -- 총 이용 가능 횟수
    used_sessions INTEGER DEFAULT 0,     -- 사용한 횟수
    remaining_sessions INTEGER GENERATED ALWAYS AS (total_sessions - used_sessions) STORED,
    
    total_hours DECIMAL(5,2) DEFAULT 0,  -- 총 이용 가능 시간
    used_hours DECIMAL(5,2) DEFAULT 0,   -- 사용한 시간
    remaining_hours DECIMAL(5,2) GENERATED ALWAYS AS (total_hours - used_hours) STORED,
    
    -- 상태 관리
    status student_status DEFAULT 'active', -- active, paused, expired, cancelled
    auto_renewal BOOLEAN DEFAULT false,
    
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. 급여 정책 시스템 (완전 새로운 구조)
-- ================================================================

-- 급여 정책 정의
CREATE TABLE salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,                    -- "수학 전문강사 정책"
    policy_type salary_policy_type NOT NULL,
    
    -- 기본 설정
    base_amount INTEGER DEFAULT 0,                 -- 기본급 (혼합형용)
    hourly_rate INTEGER,                          -- 시급 (시급제용)
    commission_rate DECIMAL(5,2),                -- 기본 비율 (단순 비율제용)
    
    -- 최소 보장
    minimum_guaranteed INTEGER DEFAULT 0,          -- 최소 보장 급여
    
    -- 계산 기준
    calculation_basis VARCHAR(20) DEFAULT 'revenue', -- revenue, students, hours
    
    -- 정책별 세부 설정 (유연한 JSON 구조)
    policy_config JSONB,
    
    -- 메타 정보
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 누진 구간 테이블 (누진 비율제용)
CREATE TABLE salary_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES salary_policies(id) ON DELETE CASCADE,
    
    -- 구간 정의
    tier_order INTEGER NOT NULL,                   -- 구간 순서
    min_amount INTEGER NOT NULL,                   -- 구간 최소값
    max_amount INTEGER,                            -- 구간 최대값 (NULL = 무한대)
    
    -- 해당 구간 비율
    commission_rate DECIMAL(5,2) NOT NULL,        -- 구간별 적용 비율
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_tier_order UNIQUE(policy_id, tier_order),
    CONSTRAINT valid_amount_range CHECK (max_amount IS NULL OR max_amount > min_amount)
);

-- 강사별 급여 정책 적용
CREATE TABLE instructor_salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    salary_policy_id UUID REFERENCES salary_policies(id) ON DELETE RESTRICT,
    
    -- 개별 조정 (정책 오버라이드)
    custom_base_amount INTEGER,
    custom_commission_rate DECIMAL(5,2),
    custom_minimum_guaranteed INTEGER,
    custom_config JSONB,                          -- 개별 설정 오버라이드
    
    -- 적용 기간
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건: 강사별 활성 정책은 하나만
    CONSTRAINT unique_active_policy_per_instructor 
        EXCLUDE USING gist (instructor_id WITH =) 
        WHERE (is_active = true AND (effective_until IS NULL OR effective_until >= CURRENT_DATE))
);

-- 월별 급여 계산 결과
CREATE TABLE salary_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES instructors(id) ON DELETE RESTRICT,
    calculation_month DATE NOT NULL,               -- YYYY-MM-01 형태
    
    -- 계산 기초 데이터
    total_revenue INTEGER DEFAULT 0,              -- 해당 월 담당 클래스 총 매출
    total_students INTEGER DEFAULT 0,             -- 해당 월 담당 학생 수
    total_hours DECIMAL(5,2) DEFAULT 0,          -- 해당 월 총 수업 시간
    
    -- 급여 구성 요소
    base_salary INTEGER DEFAULT 0,               -- 기본급
    commission_salary INTEGER DEFAULT 0,         -- 성과급 (비율제)
    bonus_amount INTEGER DEFAULT 0,              -- 보너스
    deduction_amount INTEGER DEFAULT 0,          -- 공제액
    
    -- 계산 결과
    total_calculated INTEGER DEFAULT 0,          -- 계산된 총액
    minimum_guaranteed INTEGER DEFAULT 0,        -- 적용된 최소 보장액
    final_salary INTEGER DEFAULT 0,              -- 최종 급여
    
    -- 세부 내역 (JSON으로 상세 저장)
    calculation_details JSONB,                   -- 계산 과정 상세 내역
    
    -- 메타 정보
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'calculated',     -- calculated, approved, paid
    
    -- 제약조건
    CONSTRAINT unique_instructor_month UNIQUE(instructor_id, calculation_month),
    CONSTRAINT valid_calculation_amounts CHECK (
        base_salary >= 0 AND commission_salary >= 0 AND 
        bonus_amount >= 0 AND deduction_amount >= 0 AND
        final_salary >= 0
    )
);

-- ================================================================
-- 5. 출결 및 결제 테이블 (기존과 유사하지만 개선됨)
-- ================================================================

-- 출결 테이블
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status DEFAULT 'present',
    check_in_time TIME,
    check_out_time TIME,
    
    -- 추가 정보
    temperature DECIMAL(3,1),         -- 체온 (코로나 대응)
    actual_hours DECIMAL(3,2),        -- 실제 수업 시간
    memo TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_student_date UNIQUE(student_id, attendance_date)
);

-- 결제 테이블 (수강권 기반)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
    
    -- 결제 정보
    amount INTEGER NOT NULL,
    payment_method payment_method DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    
    -- 외부 시스템 연동
    receipt_number VARCHAR(50),
    transaction_id VARCHAR(100),       -- 외부 결제 시스템 ID
    
    -- 할부/분납 지원
    installment_count INTEGER DEFAULT 1,
    installment_number INTEGER DEFAULT 1,
    parent_payment_id UUID REFERENCES payments(id), -- 분납의 경우 원 결제 참조
    
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT valid_amount CHECK (amount > 0),
    CONSTRAINT valid_installment CHECK (
        installment_number <= installment_count AND
        installment_number > 0 AND
        installment_count > 0
    )
);

-- 클래스 스케줄 테이블
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- 추가 정보
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_class_schedule UNIQUE(class_id, day_of_week, start_time)
);

-- ================================================================
-- 6. INDEXES (성능 최적화)
-- ================================================================

-- 기존 인덱스들
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_attendances_student_date ON attendances(student_id, attendance_date);
CREATE INDEX idx_payments_student_id ON payments(student_id);

-- 새로운 인덱스들 (요금제/급여 시스템용)
CREATE INDEX idx_course_packages_class_billing ON course_packages(class_id, billing_type);
CREATE INDEX idx_student_enrollments_student_status ON student_enrollments(student_id, status);
CREATE INDEX idx_student_enrollments_dates ON student_enrollments(start_date, end_date);
CREATE INDEX idx_salary_tiers_policy_order ON salary_tiers(policy_id, tier_order);
CREATE INDEX idx_salary_calculations_instructor_month ON salary_calculations(instructor_id, calculation_month);
CREATE INDEX idx_payments_enrollment_status ON payments(enrollment_id, status);

-- ================================================================
-- 7. FUNCTIONS & TRIGGERS (자동화 로직)
-- ================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 주요 테이블들의 updated_at 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_packages_updated_at BEFORE UPDATE ON course_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_enrollments_updated_at BEFORE UPDATE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 클래스 학생 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 이전 클래스 학생 수 업데이트
    IF OLD.class_id IS NOT NULL THEN
        UPDATE classes 
        SET current_students = (
            SELECT COUNT(*) 
            FROM students 
            WHERE class_id = OLD.class_id AND status = 'active'
        )
        WHERE id = OLD.class_id;
    END IF;
    
    -- 새 클래스 학생 수 업데이트
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

CREATE TRIGGER update_class_count_on_student_change
    AFTER UPDATE OF class_id, status ON students
    FOR EACH ROW EXECUTE FUNCTION update_class_student_count();
    
CREATE TRIGGER update_class_count_on_student_insert
    AFTER INSERT ON students
    FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- 출석 시 수강권 사용량 자동 차감
CREATE OR REPLACE FUNCTION update_enrollment_usage()
RETURNS TRIGGER AS $$
DECLARE
    enrollment_record RECORD;
BEGIN
    -- 출석 처리 시에만 실행 (present, late만 차감)
    IF NEW.status IN ('present', 'late') AND NEW.enrollment_id IS NOT NULL THEN
        -- 해당 수강권 정보 조회
        SELECT * INTO enrollment_record 
        FROM student_enrollments 
        WHERE id = NEW.enrollment_id;
        
        -- 회차제 수강권인 경우 사용 횟수 증가
        IF enrollment_record.total_sessions > 0 THEN
            UPDATE student_enrollments
            SET used_sessions = used_sessions + 1
            WHERE id = NEW.enrollment_id;
        END IF;
        
        -- 시간제 수강권인 경우 사용 시간 증가
        IF enrollment_record.total_hours > 0 AND NEW.actual_hours IS NOT NULL THEN
            UPDATE student_enrollments
            SET used_hours = used_hours + NEW.actual_hours
            WHERE id = NEW.enrollment_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollment_usage_on_attendance
    AFTER INSERT ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_enrollment_usage();

-- ================================================================
-- 8. ROW LEVEL SECURITY (RLS) 설정
-- ================================================================

-- 모든 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 인증된 사용자만 접근
CREATE POLICY "Enable all for authenticated users" ON users
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON instructors
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON classes
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON students
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON course_packages
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON student_enrollments
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON salary_policies
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON attendances
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON payments
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================================
-- 9. 유용한 뷰들
-- ================================================================

-- 학생 상세 정보 뷰 (현재 수강권 포함)
CREATE VIEW student_details AS
SELECT 
    s.id,
    s.name,
    s.parent_name,
    s.parent_phone,
    s.grade,
    s.status,
    s.enrollment_date,
    s.position_in_class,
    
    -- 클래스 정보
    c.name AS class_name,
    c.subject,
    c.classroom,
    c.color AS class_color,
    i.name AS instructor_name,
    
    -- 현재 활성 수강권 정보
    se.id AS current_enrollment_id,
    cp.name AS package_name,
    cp.billing_type,
    se.remaining_sessions,
    se.remaining_hours,
    se.end_date AS package_end_date,
    se.final_price AS current_package_price
    
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN instructors i ON c.instructor_id = i.id
LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'active'
LEFT JOIN course_packages cp ON se.course_package_id = cp.id;

-- 클래스 통계 뷰
CREATE VIEW class_stats AS
SELECT 
    c.id,
    c.name,
    c.subject,
    c.max_students,
    c.current_students,
    ROUND((c.current_students::DECIMAL / c.max_students) * 100, 2) AS occupancy_rate,
    
    -- 수강권별 매출 합계
    COALESCE(SUM(se.final_price), 0) AS total_revenue,
    COUNT(se.id) AS total_enrollments,
    
    -- 강사 정보
    i.name AS instructor_name
    
FROM classes c
LEFT JOIN instructors i ON c.instructor_id = i.id
LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'active'
GROUP BY c.id, c.name, c.subject, c.max_students, c.current_students, i.name;

-- 미납 현황 뷰
CREATE VIEW payment_overdue AS
SELECT 
    s.name AS student_name,
    s.parent_phone,
    c.name AS class_name,
    p.amount,
    p.due_date,
    CURRENT_DATE - p.due_date AS overdue_days,
    p.payment_method,
    p.installment_number,
    p.installment_count,
    p.memo
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE p.status IN ('pending', 'overdue')
    AND p.due_date < CURRENT_DATE
ORDER BY p.due_date, overdue_days DESC;

-- ================================================================
-- 10. 스키마 버전 관리
-- ================================================================

CREATE TABLE schema_versions (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_versions (version, description) VALUES 
    ('2.0.0', 'v2.0 - 복잡한 요금제 및 급여 정책 지원');

-- ================================================================
-- 스키마 v2.0 생성 완료
-- ================================================================

COMMENT ON DATABASE postgres IS 'EduCanvas 학원 관리 시스템 v2.0 - 2025.08.08';
COMMENT ON TABLE course_packages IS '클래스별 다양한 수강권 옵션';
COMMENT ON TABLE student_enrollments IS '학생별 수강권 등록 및 사용량 관리';
COMMENT ON TABLE salary_policies IS '강사 급여 정책 (누진제, 비율제 등)';
COMMENT ON TABLE salary_calculations IS '월별 급여 계산 결과 및 히스토리';