-- ============================================================================
-- T-V2-012: 강사 관리 시스템 데이터베이스 스키마
-- ============================================================================
-- 작성일: 2025-09-10
-- 작성자: T-V2-012 Development Team
-- 설명: tenant_memberships 기반 통합 직원/강사 관리 시스템
-- ============================================================================

-- 1. 근태 관리 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES tenant_memberships(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('정상', '지각', '조퇴', '결근', '휴가', '병가', '공가')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 복합 유니크 제약 (한 직원의 날짜별 단일 기록)
    CONSTRAINT unique_attendance_per_day UNIQUE(membership_id, date)
);

-- 2. 직원 평가 테이블 (관리자 전용)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES tenant_memberships(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES tenant_memberships(id),
    evaluation_date DATE NOT NULL,
    content TEXT, -- 암호화 예정
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    visibility TEXT DEFAULT 'admin_only' CHECK (visibility IN ('admin_only', 'managers')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스
    INDEX idx_staff_evaluations_membership (membership_id),
    INDEX idx_staff_evaluations_date (evaluation_date)
);

-- 3. 급여 정책 테이블
-- ============================================================================
CREATE TYPE salary_policy_type AS ENUM (
    'fixed_monthly',      -- 고정 월급
    'fixed_hourly',       -- 시급제
    'commission',         -- 단순 비율제
    'tiered_commission',  -- 누진 비율제
    'student_based',      -- 학생수 기준
    'hybrid',            -- 혼합형
    'guaranteed_minimum' -- 최저 보장제
);

CREATE TABLE IF NOT EXISTS salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    policy_type salary_policy_type NOT NULL,
    
    -- 기본 설정
    base_amount INTEGER DEFAULT 0,         -- 기본급
    hourly_rate INTEGER,                  -- 시급
    commission_rate DECIMAL(5,2),         -- 기본 비율
    
    -- 최소 보장
    minimum_guaranteed INTEGER DEFAULT 0,
    
    -- 계산 기준
    calculation_basis VARCHAR(20) DEFAULT 'revenue', -- revenue, students, hours
    
    -- 정책별 세부 설정 (유연한 JSON)
    policy_config JSONB,
    
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스
    INDEX idx_salary_policies_tenant (tenant_id),
    INDEX idx_salary_policies_active (is_active)
);

-- 4. 급여 구간 테이블 (누진제용)
-- ============================================================================
CREATE TABLE IF NOT EXISTS salary_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES salary_policies(id) ON DELETE CASCADE,
    tier_order INTEGER NOT NULL,
    min_amount INTEGER NOT NULL,
    max_amount INTEGER,
    commission_rate DECIMAL(5,2) NOT NULL,
    
    -- 복합 유니크 제약
    CONSTRAINT unique_tier_order UNIQUE(policy_id, tier_order)
);

-- 5. 월별 급여 계산 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS salary_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES tenant_memberships(id) ON DELETE CASCADE,
    calculation_month DATE NOT NULL, -- YYYY-MM-01 형태
    
    -- 계산 기초 데이터
    total_revenue INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    -- 급여 구성 요소
    base_salary INTEGER DEFAULT 0,        -- 기본급
    commission_salary INTEGER DEFAULT 0,  -- 성과급
    bonus_amount INTEGER DEFAULT 0,       -- 보너스
    deduction_amount INTEGER DEFAULT 0,   -- 공제액
    
    -- 계산 결과
    total_calculated INTEGER DEFAULT 0,
    minimum_guaranteed INTEGER DEFAULT 0,
    final_salary INTEGER DEFAULT 0,        -- 최종 급여
    
    -- 세부 내역
    calculation_details JSONB,            -- 계산 과정 상세
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID REFERENCES tenant_memberships(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES tenant_memberships(id),
    status VARCHAR(20) DEFAULT 'calculated' CHECK (status IN ('calculated', 'approved', 'paid')),
    
    -- 복합 유니크 제약
    CONSTRAINT unique_instructor_month UNIQUE(membership_id, calculation_month),
    
    -- 인덱스
    INDEX idx_salary_calculations_month (calculation_month),
    INDEX idx_salary_calculations_status (status)
);

-- 6. 직원-급여정책 연결 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS instructor_salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES tenant_memberships(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES salary_policies(id),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활성 정책은 1개만 허용하는 부분 유니크 인덱스
CREATE UNIQUE INDEX unique_active_policy 
    ON instructor_salary_policies(membership_id) 
    WHERE is_active = true;

-- ============================================================================
-- Row Level Security (RLS) 정책
-- ============================================================================

-- attendance_records RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records_tenant_isolation" ON attendance_records
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "attendance_records_self_view" ON attendance_records
    FOR SELECT USING (
        membership_id IN (
            SELECT id FROM tenant_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "attendance_records_admin_manage" ON attendance_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tenant_memberships tm
            JOIN tenant_roles tr ON tm.role_id = tr.id
            WHERE tm.user_id = auth.uid()
            AND tm.tenant_id = attendance_records.tenant_id
            AND tr.name IN ('admin', 'manager')
        )
    );

-- staff_evaluations RLS (관리자 전용)
ALTER TABLE staff_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_evaluations_admin_only" ON staff_evaluations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tenant_memberships tm
            JOIN tenant_roles tr ON tm.role_id = tr.id
            WHERE tm.user_id = auth.uid()
            AND tm.tenant_id = staff_evaluations.tenant_id
            AND tr.name = 'admin'
        )
    );

-- salary_policies RLS
ALTER TABLE salary_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_policies_view" ON salary_policies
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "salary_policies_admin_manage" ON salary_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tenant_memberships tm
            JOIN tenant_roles tr ON tm.role_id = tr.id
            WHERE tm.user_id = auth.uid()
            AND tm.tenant_id = salary_policies.tenant_id
            AND tr.name = 'admin'
        )
    );

-- salary_calculations RLS (민감 정보)
ALTER TABLE salary_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_calculations_self_view" ON salary_calculations
    FOR SELECT USING (
        membership_id IN (
            SELECT id FROM tenant_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "salary_calculations_admin_full_access" ON salary_calculations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tenant_memberships tm
            JOIN tenant_roles tr ON tm.role_id = tr.id
            WHERE tm.user_id = auth.uid()
            AND tm.tenant_id = salary_calculations.tenant_id
            AND tr.name IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- 트리거 함수
-- ============================================================================

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_policies_updated_at
    BEFORE UPDATE ON salary_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 인덱스 생성
-- ============================================================================

-- 성능 최적화를 위한 추가 인덱스
CREATE INDEX idx_attendance_records_date ON attendance_records(date);
CREATE INDEX idx_attendance_records_membership ON attendance_records(membership_id);
CREATE INDEX idx_salary_calculations_membership ON salary_calculations(membership_id);
CREATE INDEX idx_instructor_salary_policies_membership ON instructor_salary_policies(membership_id);

-- ============================================================================
-- 코멘트 추가
-- ============================================================================

COMMENT ON TABLE attendance_records IS '직원 근태 관리 테이블';
COMMENT ON TABLE staff_evaluations IS '직원 평가 테이블 (관리자 전용)';
COMMENT ON TABLE salary_policies IS '급여 정책 정의 테이블';
COMMENT ON TABLE salary_tiers IS '누진 급여 구간 설정 테이블';
COMMENT ON TABLE salary_calculations IS '월별 급여 계산 내역 테이블';
COMMENT ON TABLE instructor_salary_policies IS '직원별 급여 정책 연결 테이블';

COMMENT ON COLUMN staff_evaluations.content IS '평가 내용 (암호화 예정)';
COMMENT ON COLUMN salary_calculations.calculation_details IS '급여 계산 상세 내역 JSON';
COMMENT ON COLUMN tenant_memberships.staff_info IS '직원/강사 추가 정보 (employee_id, emergency_contact, instructor_info 등)';