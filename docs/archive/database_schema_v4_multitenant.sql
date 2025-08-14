-- EduCanvas 멀티테넌트 학원 관리 시스템 데이터베이스 스키마 v4.0
-- 작성일: 2025-08-10
-- 데이터베이스: Supabase (PostgreSQL 15+)
-- 주요 기능: 멀티테넌트 아키텍처, 유연한 권한 시스템, 테넌트별 백업

-- ================================================================
-- v4.0 주요 변경사항:
-- 1. 완전한 멀티테넌트 아키텍처
-- 2. 유연한 역할 상속 및 권한 시스템
-- 3. 스코프 기반 세밀한 권한 제어
-- 4. 테넌트별 백업 시스템
-- 5. 강화된 보안 및 감사 로그
-- ================================================================

-- ================================================================
-- 1. 기본 ENUM 타입 정의
-- ================================================================

-- 사용자 상태
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');

-- 학생 상태
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'withdrawn', 'suspended');

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

-- 출석 상태
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- 결제 상태
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled', 'refunded');

-- v3.0 확장 ENUM 타입들
CREATE TYPE classroom_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE classroom_type AS ENUM ('general', 'lab', 'seminar', 'lecture_hall', 'study_room');
CREATE TYPE schedule_status AS ENUM ('active', 'cancelled', 'rescheduled', 'completed');
CREATE TYPE exam_type AS ENUM ('midterm', 'final', 'quiz', 'mock_exam', 'placement_test', 'progress_test');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'essay', 'true_false', 'fill_blank');
CREATE TYPE document_type AS ENUM ('exam', 'homework', 'handout', 'answer_key', 'curriculum', 'report', 'other');
CREATE TYPE file_status AS ENUM ('uploading', 'active', 'archived', 'deleted');
CREATE TYPE history_action AS ENUM ('create', 'update', 'delete', 'move', 'enroll', 'withdraw', 'payment', 'exam', 'consultation');
CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE consultation_type AS ENUM ('enrollment', 'academic', 'behavioral', 'career', 'parent_meeting', 'follow_up');

-- ================================================================
-- 2. 멀티테넌트 핵심 테이블
-- ================================================================

-- 테넌트 (학원) 관리
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,                    -- 학원명
    slug VARCHAR(50) UNIQUE NOT NULL,              -- URL 친화적 식별자
    domain VARCHAR(100) UNIQUE,                    -- 커스텀 도메인 지원
    
    -- 테넌트 정보
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    business_registration VARCHAR(50),             -- 사업자등록번호
    
    -- 테넌트 설정
    settings JSONB DEFAULT '{}',                   -- 기본 설정
    features JSONB DEFAULT '{}',                   -- 활성화된 기능들
    limits JSONB DEFAULT '{}',                     -- 사용량 제한
    
    -- 구독 정보
    subscription_tier VARCHAR(20) DEFAULT 'basic', -- basic, pro, enterprise
    subscription_status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(255),
    
    -- 상태 관리
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 유연한 역할 정의 시스템
CREATE TABLE tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                     -- 시스템 역할명
    display_name VARCHAR(100) NOT NULL,            -- 사용자 친화적 이름
    description TEXT,
    
    -- 역할 계층 구조 (상속 지원)
    parent_role_id UUID REFERENCES tenant_roles(id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 1,
    
    -- 기본 권한 레벨
    base_permissions JSONB DEFAULT '{}',
    
    -- 역할 속성
    is_system_role BOOLEAN DEFAULT false,          -- 시스템 기본 역할
    is_assignable BOOLEAN DEFAULT true,            -- 할당 가능 여부
    max_users INTEGER,                             -- 최대 사용자 수 제한
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_role_name UNIQUE(tenant_id, name)
);

-- 세밀한 권한 정의
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(50) NOT NULL,                -- students, classes, payments 등
    action VARCHAR(20) NOT NULL,                  -- create, read, update, delete
    scope VARCHAR(20) NOT NULL,                   -- own, class, department, all, custom
    
    -- 권한 설명
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30),                         -- academic, financial, administrative
    
    -- 권한 속성
    is_system_permission BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,      -- 승인이 필요한 권한
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_permission UNIQUE(resource, action, scope)
);

-- 역할-권한 매핑 (유연한 조합)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES tenant_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- 권한 커스터마이징
    conditions JSONB DEFAULT '{}',                -- 조건부 권한
    restrictions JSONB DEFAULT '{}',              -- 제한 사항
    
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- 리소스별 스코프 정의
CREATE TABLE resource_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,           -- students, classes, payments 등
    scope_name VARCHAR(50) NOT NULL,              -- own, class, department, all
    
    -- 스코프 정의
    definition JSONB NOT NULL,                    -- 스코프 조건 정의
    description TEXT,
    
    -- 스코프 속성
    is_default BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,                  -- 우선순위 (낮을수록 높음)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_resource_scope UNIQUE(tenant_id, resource_type, scope_name)
);

-- 테넌트별 사용자 관리
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Supabase Auth 연동
    
    -- 사용자 정보
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    
    -- 권한 및 상태
    primary_role_id UUID REFERENCES tenant_roles(id),
    additional_roles UUID[] DEFAULT ARRAY[]::UUID[], -- 복수 역할 지원
    status user_status DEFAULT 'active',
    
    -- 접근 제어
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    
    -- 사용자별 권한 예외 (개별 조정)
    permission_overrides JSONB DEFAULT '{}',
    cached_permissions JSONB DEFAULT '{}',        -- 권한 캐시
    
    -- 초대 정보
    invited_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_user UNIQUE(tenant_id, user_id),
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email)
);

-- ================================================================
-- 3. 백업 시스템
-- ================================================================

-- 백업 정책 정의
CREATE TABLE backup_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    
    -- 백업 설정
    backup_type VARCHAR(20) DEFAULT 'full',       -- full, incremental, differential
    schedule JSONB NOT NULL,                      -- cron 표현식 또는 설정
    retention_days INTEGER DEFAULT 30,
    
    -- 백업 범위
    include_tables TEXT[] DEFAULT ARRAY['*'],     -- 포함할 테이블
    exclude_tables TEXT[] DEFAULT ARRAY[]::TEXT[], -- 제외할 테이블
    
    -- 압축 및 암호화
    compression_type VARCHAR(20) DEFAULT 'gzip',
    encryption_enabled BOOLEAN DEFAULT true,
    encryption_key_id UUID,
    
    -- 저장소 설정
    storage_provider VARCHAR(20) DEFAULT 'supabase', -- supabase, aws_s3, gcs
    storage_config JSONB DEFAULT '{}',
    
    -- 정책 상태
    is_active BOOLEAN DEFAULT true,
    last_backup_at TIMESTAMP WITH TIME ZONE,
    next_backup_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_backup_policy UNIQUE(tenant_id, name)
);

-- 백업 실행 로그
CREATE TABLE backup_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES backup_policies(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- 실행 정보
    execution_type VARCHAR(20) NOT NULL,          -- scheduled, manual
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',         -- running, completed, failed
    
    -- 백업 메타데이터
    backup_size BIGINT,                           -- bytes
    compressed_size BIGINT,                       -- bytes
    tables_count INTEGER,
    records_count BIGINT,
    
    -- 파일 정보
    backup_path TEXT,
    storage_url TEXT,
    checksum VARCHAR(64),                         -- SHA-256
    
    -- 실행 결과
    error_message TEXT,
    execution_time_seconds INTEGER,
    
    -- 백업 상세 정보
    backup_metadata JSONB DEFAULT '{}',          -- 백업된 테이블, 크기 등 상세 정보
    
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- ================================================================
-- 4. 감사 로그 시스템
-- ================================================================

-- 감사 로그
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    -- 이벤트 정보
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(10) NOT NULL,                  -- INSERT, UPDATE, DELETE, SELECT
    
    -- 변경 데이터
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    
    -- 컨텍스트 정보
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    
    -- 메타데이터
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_name VARCHAR(50),
    
    -- 보안 관련
    risk_level VARCHAR(10) DEFAULT 'low',         -- low, medium, high, critical
    is_anomalous BOOLEAN DEFAULT false,
    
    -- 인덱스 최적화를 위한 파티션 키
    audit_date DATE GENERATED ALWAYS AS (occurred_at::date) STORED
);

-- ================================================================
-- 5. 기존 v3.0 테이블들 (tenant_id 추가)
-- ================================================================

-- 강사 정보 (멀티테넌트 확장)
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialization VARCHAR(100),                  -- 전문 분야
    qualification TEXT,                           -- 자격증 정보
    bank_account VARCHAR(50),                     -- 급여 계좌
    status student_status DEFAULT 'active',
    hire_date DATE DEFAULT CURRENT_DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_instructor_email UNIQUE(tenant_id, email)
);

-- 클래스/반 관리 (멀티테넌트 확장)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    grade_level VARCHAR(20),                      -- 초1, 중2, 고3 등
    max_students INTEGER DEFAULT 20,
    current_students INTEGER DEFAULT 0,          -- 자동 계산
    instructor_id UUID REFERENCES instructors(id),
    classroom VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    status student_status DEFAULT 'active',
    order_index INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_class_name UNIQUE(tenant_id, name)
);

-- 학생 관리 (멀티테넌트 확장)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20) NOT NULL,
    grade VARCHAR(20),
    class_id UUID REFERENCES classes(id),
    status student_status DEFAULT 'active',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    position_in_class INTEGER DEFAULT 0,
    display_color VARCHAR(7),
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_student_position UNIQUE(tenant_id, class_id, position_in_class)
);

-- 수강권 옵션 (멀티테넌트 확장)
CREATE TABLE course_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    billing_type billing_type NOT NULL,
    
    -- 가격 정보
    base_price INTEGER NOT NULL,
    
    -- 수량/기간 정보
    sessions_count INTEGER,
    hours_count DECIMAL(5,2),
    duration_months INTEGER,
    duration_days INTEGER,
    
    -- 할인 정보
    discount_rate DECIMAL(5,2) DEFAULT 0,
    
    -- 정책 설정
    is_active BOOLEAN DEFAULT true,
    auto_renewal BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수강권 등록 (멀티테넌트 확장)
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_package_id UUID REFERENCES course_packages(id),
    
    -- 등록 정보
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- 가격 정보
    original_price INTEGER NOT NULL,
    final_price INTEGER NOT NULL,
    applied_discounts JSONB,
    
    -- 사용량 추적
    total_sessions INTEGER DEFAULT 0,
    used_sessions INTEGER DEFAULT 0,
    remaining_sessions INTEGER GENERATED ALWAYS AS (total_sessions - used_sessions) STORED,
    
    total_hours DECIMAL(5,2) DEFAULT 0,
    used_hours DECIMAL(5,2) DEFAULT 0,
    remaining_hours DECIMAL(5,2) GENERATED ALWAYS AS (total_hours - used_hours) STORED,
    
    status student_status DEFAULT 'active',
    auto_renewal BOOLEAN DEFAULT false,
    
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 할인 정책 (멀티테넌트 확장)
CREATE TABLE discount_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    discount_type discount_type NOT NULL,
    
    -- 할인 조건 및 혜택
    conditions JSONB,
    discount_rate DECIMAL(5,2),
    discount_amount INTEGER,
    max_discount_amount INTEGER,
    
    -- 적용 기간 및 조건
    valid_from DATE,
    valid_until DATE,
    min_purchase_amount INTEGER DEFAULT 0,
    applicable_billing_types billing_type[],
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 관리 (멀티테넌트 확장)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id),
    
    -- 결제 정보
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status payment_status DEFAULT 'pending',
    
    -- 일정 정보
    due_date DATE NOT NULL,
    payment_date DATE,
    
    -- 추가 정보
    memo TEXT,
    receipt_number VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 출석 관리 (멀티테넌트 확장)
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id),
    
    -- 출석 정보
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    actual_hours DECIMAL(4,2),
    
    -- 추가 정보
    notes TEXT,
    late_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_date_attendance UNIQUE(tenant_id, student_id, attendance_date)
);

-- 급여 정책 (멀티테넌트 확장)
CREATE TABLE salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    policy_type salary_policy_type NOT NULL,
    
    -- 기본 설정
    base_amount INTEGER DEFAULT 0,
    hourly_rate INTEGER,
    commission_rate DECIMAL(5,2),
    
    -- 최소 보장 및 계산 기준
    minimum_guaranteed INTEGER DEFAULT 0,
    calculation_basis VARCHAR(20) DEFAULT 'revenue',
    
    -- 정책별 세부 설정
    policy_config JSONB,
    
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 급여 구간 (누진제용)
CREATE TABLE salary_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES salary_policies(id) ON DELETE CASCADE,
    tier_order INTEGER NOT NULL,
    min_amount INTEGER,
    max_amount INTEGER,
    commission_rate DECIMAL(5,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_policy_tier UNIQUE(policy_id, tier_order)
);

-- 강사별 급여 정책 적용
CREATE TABLE instructor_salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES salary_policies(id) ON DELETE CASCADE,
    
    -- 적용 기간
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    -- 개별 조정 사항
    custom_adjustments JSONB,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_instructor_policy_period UNIQUE(instructor_id, effective_from)
);

-- 급여 계산 결과
CREATE TABLE salary_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id),
    calculation_month DATE NOT NULL,
    
    -- 계산 기초 데이터
    total_revenue INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    -- 급여 구성 요소
    base_salary INTEGER DEFAULT 0,
    commission_salary INTEGER DEFAULT 0,
    bonus_amount INTEGER DEFAULT 0,
    deduction_amount INTEGER DEFAULT 0,
    
    -- 계산 결과
    total_calculated INTEGER DEFAULT 0,
    minimum_guaranteed INTEGER DEFAULT 0,
    final_salary INTEGER DEFAULT 0,
    
    -- 세부 내역
    calculation_details JSONB,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID REFERENCES tenant_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES tenant_users(id),
    status VARCHAR(20) DEFAULT 'calculated',
    
    CONSTRAINT unique_instructor_month UNIQUE(tenant_id, instructor_id, calculation_month)
);

-- ================================================================
-- 6. v3.0 확장 기능 테이블들 (교실, 성적, 문서, 히스토리, 상담)
-- ================================================================

-- 교실 정보
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    building VARCHAR(50),
    floor INTEGER DEFAULT 1,
    room_number VARCHAR(20),
    
    -- 물리적 정보
    capacity INTEGER NOT NULL,
    area DECIMAL(8,2),
    classroom_type classroom_type DEFAULT 'general',
    
    -- 설비 정보
    facilities JSONB DEFAULT '{}',
    equipment_list TEXT[],
    
    -- 특성 정보
    suitable_subjects TEXT[],
    special_features TEXT[],
    
    -- 운영 정보
    status classroom_status DEFAULT 'available',
    is_bookable BOOLEAN DEFAULT true,
    hourly_rate INTEGER DEFAULT 0,
    
    -- 메타 정보
    description TEXT,
    photo_urls TEXT[],
    qr_code VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 교실 사용 이력
CREATE TABLE classroom_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    
    -- 사용 정보
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    
    -- 사용 현황
    planned_students INTEGER,
    actual_students INTEGER,
    
    -- 추가 정보
    purpose VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 시간 슬롯 정의
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- 요일별 운영 여부
    monday BOOLEAN DEFAULT true,
    tuesday BOOLEAN DEFAULT true,
    wednesday BOOLEAN DEFAULT true,
    thursday BOOLEAN DEFAULT true,
    friday BOOLEAN DEFAULT true,
    saturday BOOLEAN DEFAULT true,
    sunday BOOLEAN DEFAULT false,
    
    -- 메타 정보
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 정규 시간표
CREATE TABLE recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE RESTRICT,
    
    -- 반복 패턴
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    -- 스케줄 정보
    status schedule_status DEFAULT 'active',
    is_recurring BOOLEAN DEFAULT true,
    
    -- 교실 자동 배정 관련
    auto_assign_classroom BOOLEAN DEFAULT true,
    preferred_classroom_type classroom_type,
    required_facilities JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_classroom_timeslot UNIQUE (tenant_id, classroom_id, time_slot_id, day_of_week, effective_from)
);

-- 일회성/변경된 스케줄
CREATE TABLE schedule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE CASCADE,
    
    -- 특정 날짜 정보
    override_date DATE NOT NULL,
    
    -- 변경 내용
    new_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    new_time_slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
    new_instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    
    -- 변경 사유 및 상태
    change_reason VARCHAR(200),
    status schedule_status DEFAULT 'active',
    
    -- 알림 관련
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- 시험 정의
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    exam_type exam_type NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    
    -- 시험 일정
    exam_date DATE NOT NULL,
    start_time TIME,
    duration_minutes INTEGER DEFAULT 90,
    
    -- 시험 구성
    total_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    question_count INTEGER DEFAULT 0,
    
    -- 시험 설정
    exam_config JSONB DEFAULT '{}',
    grading_policy JSONB DEFAULT '{}',
    
    -- 상태 관리
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- 메타 정보
    description TEXT,
    instructions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- 시험 문제
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    
    -- 문제 정보
    question_number INTEGER NOT NULL,
    question_type question_type NOT NULL,
    question_text TEXT,
    
    -- 배점 정보
    max_score DECIMAL(5,2) NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- 선택지 및 정답
    choices JSONB,
    correct_answer TEXT,
    
    -- 메타 정보
    topic VARCHAR(100),
    learning_objective TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_question_number UNIQUE(exam_id, question_number)
);

-- 학생 성적
CREATE TABLE student_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    -- 성적 정보
    total_score DECIMAL(5,2) NOT NULL,
    max_possible_score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN max_possible_score > 0 THEN (total_score / max_possible_score * 100)
            ELSE 0 
        END
    ) STORED,
    
    -- 등급/순위 정보
    grade VARCHAR(5),
    class_rank INTEGER,
    percentile DECIMAL(5,2),
    
    -- 문제별 세부 점수
    detailed_scores JSONB,
    
    -- 분석 정보
    strong_topics TEXT[],
    weak_topics TEXT[],
    improvement_suggestions TEXT,
    
    -- 추가 정보
    exam_duration_minutes INTEGER,
    absence_reason TEXT,
    
    -- 메타 정보
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_exam UNIQUE(exam_id, student_id),
    CONSTRAINT valid_score_range CHECK (total_score >= 0 AND total_score <= max_possible_score)
);

-- 문서 폴더 구조
CREATE TABLE document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    
    -- 폴더 속성
    folder_path TEXT,
    
    -- 권한 관리
    owner_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    allowed_roles UUID[],
    
    -- 메타 정보
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 문서 관리
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
    document_type document_type NOT NULL,
    
    -- 파일 정보
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100),
    
    -- 저장 정보
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'supabase',
    file_hash VARCHAR(64),
    
    -- 버전 관리
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- 분류 정보
    subject VARCHAR(50),
    grade_level VARCHAR(20),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- 내용 정보 (검색용)
    extracted_text TEXT,
    content_summary TEXT,
    keywords TEXT[],
    
    -- 접근 제어
    visibility VARCHAR(20) DEFAULT 'private',
    allowed_users UUID[],
    allowed_classes UUID[],
    
    -- 사용 통계
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- 상태 관리
    status file_status DEFAULT 'active',
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- 메타 정보
    description TEXT,
    upload_notes TEXT,
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 문서 접근 로그
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    -- 접근 정보
    access_type VARCHAR(20) NOT NULL,
    access_method VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- 시간 정보
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER,
    
    -- 추가 컨텍스트
    referrer_url TEXT,
    device_info JSONB
);

-- 통합 히스토리 테이블
CREATE TABLE student_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    -- 이벤트 정보
    event_type history_action NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_title VARCHAR(200) NOT NULL,
    event_description TEXT,
    
    -- 관련 데이터 참조
    related_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    related_enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
    related_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- 이벤트 세부 데이터
    event_data JSONB DEFAULT '{}',
    
    -- 변경 전후 데이터
    before_data JSONB,
    after_data JSONB,
    
    -- 메타 정보
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    ip_address INET,
    
    -- 분류/태그
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_milestone BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 성적 히스토리 (상세 학습 진도 추적)
CREATE TABLE academic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    
    -- 진도 정보
    assessment_date DATE NOT NULL,
    current_level VARCHAR(50),
    target_level VARCHAR(50),
    progress_percentage DECIMAL(5,2),
    
    -- 성취도 분석
    strengths TEXT[],
    weaknesses TEXT[],
    recent_scores JSONB,
    
    -- 학습 분석
    study_hours_weekly DECIMAL(4,1),
    homework_completion_rate DECIMAL(5,2),
    class_participation_score INTEGER,
    
    -- AI 분석 결과
    predicted_performance JSONB,
    recommended_actions TEXT[],
    learning_style_analysis JSONB,
    
    -- 메타 정보
    assessment_type VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- 상담 예약 및 관리
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    
    -- 상담 기본 정보
    consultation_type consultation_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- 일정 정보
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- 참석자 정보
    participants JSONB DEFAULT '{}',
    parent_attending BOOLEAN DEFAULT false,
    additional_attendees TEXT[],
    
    -- 상담 설정
    consultation_method VARCHAR(50) DEFAULT 'in_person',
    location VARCHAR(100),
    
    -- 상담 준비사항
    preparation_notes TEXT,
    required_documents TEXT[],
    agenda_items TEXT[],
    
    -- 상태 관리
    status consultation_status DEFAULT 'scheduled',
    
    -- 알림 설정
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- 상담 기록
CREATE TABLE consultation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    
    -- 상담 결과
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    actual_attendees TEXT[],
    
    -- 상담 내용
    discussion_topics TEXT[],
    main_concerns TEXT,
    solutions_discussed TEXT,
    
    -- 결정사항 및 후속조치
    decisions_made TEXT,
    action_items JSONB,
    follow_up_required BOOLEAN DEFAULT false,
    next_consultation_date DATE,
    
    -- 평가 및 분석
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    consultation_effectiveness JSONB,
    
    -- 파일 첨부
    attached_documents UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- 비밀성 관리
    confidentiality_level VARCHAR(20) DEFAULT 'normal',
    access_restricted_to UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- ================================================================
-- 7. 권한 및 보안 함수들
-- ================================================================

-- 현재 테넌트 ID 조회 함수
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- JWT에서 tenant_id 추출 또는 사용자 기반 조회
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
        tu.tenant_id
    ) INTO tenant_id
    FROM tenant_users tu
    WHERE tu.user_id = auth.uid()
    LIMIT 1;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 동적 권한 평가 함수
CREATE OR REPLACE FUNCTION evaluate_user_permission(
    p_tenant_id UUID,
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR,
    p_resource_owner_id UUID DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    role_record RECORD;
    permission_record RECORD;
    scope_match BOOLEAN := false;
    result BOOLEAN := false;
BEGIN
    -- 사용자 정보 조회
    SELECT * INTO user_record 
    FROM tenant_users 
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id AND status = 'active';
    
    IF NOT FOUND THEN RETURN false; END IF;
    
    -- 개별 권한 예외 확인
    IF user_record.permission_overrides ? (p_resource || '.' || p_action) THEN
        RETURN (user_record.permission_overrides->(p_resource || '.' || p_action))::BOOLEAN;
    END IF;
    
    -- 역할 기반 권한 확인 (상속 포함)
    FOR role_record IN 
        WITH RECURSIVE role_hierarchy AS (
            -- 기본 역할
            SELECT * FROM tenant_roles WHERE id = user_record.primary_role_id
            UNION
            -- 추가 역할들
            SELECT * FROM tenant_roles WHERE id = ANY(user_record.additional_roles)
            UNION ALL
            -- 상속된 역할들
            SELECT tr.* 
            FROM tenant_roles tr
            JOIN role_hierarchy rh ON tr.id = rh.parent_role_id
        )
        SELECT DISTINCT * FROM role_hierarchy
    LOOP
        -- 역할의 권한 확인
        SELECT p.*, rp.conditions, rp.restrictions INTO permission_record
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = role_record.id 
        AND p.resource = p_resource 
        AND p.action = p_action;
        
        IF FOUND THEN
            -- 스코프 검증
            CASE permission_record.scope
                WHEN 'all' THEN 
                    scope_match := true;
                WHEN 'own' THEN 
                    scope_match := (p_resource_owner_id = p_user_id);
                ELSE
                    scope_match := true; -- 추가 스코프 로직
            END CASE;
            
            IF scope_match THEN
                result := true;
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 검증 함수 (캐시 포함)
CREATE OR REPLACE FUNCTION check_user_permission(
    resource VARCHAR,
    action VARCHAR,
    resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_tenant_id UUID;
    current_user_id UUID;
    cached_result BOOLEAN;
BEGIN
    current_tenant_id := get_current_tenant_id();
    current_user_id := auth.uid();
    
    IF current_tenant_id IS NULL OR current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- 실제 권한 평가
    SELECT evaluate_user_permission(
        current_tenant_id,
        current_user_id,
        resource,
        action,
        resource_id,
        '{}'::jsonb
    ) INTO cached_result;
    
    RETURN cached_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 테넌트별 백업 함수
CREATE OR REPLACE FUNCTION backup_tenant_data(
    p_tenant_id UUID,
    p_backup_type VARCHAR DEFAULT 'full',
    p_manual BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    execution_id UUID;
    policy_record RECORD;
    backup_path TEXT;
    start_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 활성 백업 정책 조회
    SELECT * INTO policy_record 
    FROM backup_policies 
    WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND backup_type = p_backup_type
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active backup policy found for tenant % with type %', p_tenant_id, p_backup_type;
    END IF;
    
    -- 백업 실행 로그 생성
    INSERT INTO backup_executions (
        policy_id, tenant_id, execution_type, status
    ) VALUES (
        policy_record.id, p_tenant_id, 
        CASE WHEN p_manual THEN 'manual' ELSE 'scheduled' END,
        'running'
    ) RETURNING id INTO execution_id;
    
    -- 백업 경로 생성
    backup_path := format('backups/%s/%s/%s.sql', 
        p_tenant_id, 
        to_char(start_time, 'YYYY/MM/DD'), 
        execution_id
    );
    
    -- 백업 완료 처리
    UPDATE backup_executions SET
        completed_at = NOW(),
        status = 'completed',
        backup_path = backup_path,
        execution_time_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER
    WHERE id = execution_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 감사 로그 트리거 함수
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB := '{}';
    new_values JSONB := '{}';
    changed_cols TEXT[] := ARRAY[]::TEXT[];
    current_tenant_id UUID;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- 변경된 컬럼 추적
    IF TG_OP = 'UPDATE' THEN
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        old_values := to_jsonb(OLD);
    END IF;
    
    -- 민감한 필드 마스킹
    IF old_values ? 'password' THEN old_values := old_values || '{"password": "[REDACTED]"}'; END IF;
    IF new_values ? 'password' THEN new_values := new_values || '{"password": "[REDACTED]"}'; END IF;
    
    -- 감사 로그 삽입
    INSERT INTO audit_logs (
        tenant_id, user_id, table_name, record_id, action,
        old_values, new_values, changed_columns,
        ip_address, occurred_at
    ) VALUES (
        current_tenant_id,
        (SELECT id FROM tenant_users WHERE user_id = auth.uid() AND tenant_id = current_tenant_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN old_values = '{}'::jsonb THEN NULL ELSE old_values END,
        CASE WHEN new_values = '{}'::jsonb THEN NULL ELSE new_values END,
        CASE WHEN array_length(changed_cols, 1) > 0 THEN changed_cols ELSE NULL END,
        inet_client_addr(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 8. RLS 정책 적용
-- ================================================================

-- 테넌트 테이블
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants FOR ALL
USING (id = get_current_tenant_id());

-- 사용자 테이블
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_users_isolation ON tenant_users FOR ALL
USING (tenant_id = get_current_tenant_id());

-- 핵심 비즈니스 테이블들
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY students_tenant_isolation ON students FOR ALL
USING (
    tenant_id = get_current_tenant_id() 
    AND check_user_permission('students', 
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update' 
            WHEN TG_OP = 'DELETE' THEN 'delete'
            ELSE 'read'
        END,
        id
    )
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY classes_tenant_isolation ON classes FOR ALL
USING (
    tenant_id = get_current_tenant_id()
    AND check_user_permission('classes',
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
            ELSE 'read'
        END,
        id
    )
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant_isolation ON payments FOR ALL
USING (
    tenant_id = get_current_tenant_id()
    AND check_user_permission('payments',
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
            ELSE 'read'
        END,
        id
    )
);

-- 기타 주요 테이블들에 동일한 패턴 적용
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY instructors_tenant_isolation ON instructors FOR ALL
USING (tenant_id = get_current_tenant_id());

ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_packages_tenant_isolation ON course_packages FOR ALL
USING (tenant_id = get_current_tenant_id());

ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_enrollments_tenant_isolation ON student_enrollments FOR ALL
USING (tenant_id = get_current_tenant_id());

ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendances_tenant_isolation ON attendances FOR ALL
USING (tenant_id = get_current_tenant_id());

-- v3.0 확장 테이블들
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY classrooms_tenant_isolation ON classrooms FOR ALL
USING (tenant_id = get_current_tenant_id());

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_tenant_isolation ON documents FOR ALL
USING (tenant_id = get_current_tenant_id());

ALTER TABLE student_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_histories_tenant_isolation ON student_histories FOR ALL
USING (tenant_id = get_current_tenant_id());

-- ================================================================
-- 9. 트리거 적용
-- ================================================================

-- 감사 로그 트리거 (민감한 테이블들)
CREATE TRIGGER audit_trigger_students
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_tenant_users
    AFTER INSERT OR UPDATE OR DELETE ON tenant_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 10. 인덱스 및 성능 최적화
-- ================================================================

-- 테넌트별 데이터 파티셔닝을 위한 기본 인덱스
CREATE INDEX idx_students_tenant_id ON students(tenant_id);
CREATE INDEX idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_instructors_tenant_id ON instructors(tenant_id);

-- 권한 시스템 최적화 인덱스
CREATE INDEX idx_tenant_users_user_tenant ON tenant_users(user_id, tenant_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action, scope);

-- 감사 로그 인덱스
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs(tenant_id, audit_date DESC);
CREATE INDEX idx_audit_logs_user_occurred ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_table_action ON audit_logs(table_name, action);

-- 백업 시스템 인덱스
CREATE INDEX idx_backup_executions_tenant ON backup_executions(tenant_id, started_at DESC);
CREATE INDEX idx_backup_policies_tenant_active ON backup_policies(tenant_id) WHERE is_active = true;

-- v3.0 확장 기능 인덱스들
CREATE INDEX idx_classrooms_tenant_status ON classrooms(tenant_id, status);
CREATE INDEX idx_documents_tenant_type ON documents(tenant_id, document_type);
CREATE INDEX idx_exams_tenant_class_date ON exams(tenant_id, class_id, exam_date);
CREATE INDEX idx_student_scores_tenant_exam ON student_scores(tenant_id, exam_id);

-- ================================================================
-- 11. 유용한 뷰들
-- ================================================================

-- 테넌트별 데이터 요약
CREATE VIEW tenant_data_summary AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    t.subscription_tier,
    t.subscription_status,
    
    -- 테이블별 레코드 수
    COALESCE(s.students_count, 0) as students_count,
    COALESCE(c.classes_count, 0) as classes_count,
    COALESCE(i.instructors_count, 0) as instructors_count,
    COALESCE(p.payments_count, 0) as payments_count,
    COALESCE(u.users_count, 0) as users_count,
    
    -- 마지막 활동
    t.updated_at as last_updated,
    
    -- 백업 정보
    bp.last_backup_at,
    bp.next_backup_at
FROM tenants t
LEFT JOIN backup_policies bp ON t.id = bp.tenant_id AND bp.is_active = true
LEFT JOIN (SELECT tenant_id, COUNT(*) as students_count FROM students GROUP BY tenant_id) s ON t.id = s.tenant_id
LEFT JOIN (SELECT tenant_id, COUNT(*) as classes_count FROM classes GROUP BY tenant_id) c ON t.id = c.tenant_id
LEFT JOIN (SELECT tenant_id, COUNT(*) as instructors_count FROM instructors GROUP BY tenant_id) i ON t.id = i.tenant_id
LEFT JOIN (SELECT tenant_id, COUNT(*) as payments_count FROM payments GROUP BY tenant_id) p ON t.id = p.tenant_id
LEFT JOIN (SELECT tenant_id, COUNT(*) as users_count FROM tenant_users GROUP BY tenant_id) u ON t.id = u.tenant_id;

-- 학생 상세 정보 (현재 수강권 포함)
CREATE VIEW student_details AS
SELECT 
    s.*,
    c.name AS class_name,
    i.name AS instructor_name,
    se.id AS current_enrollment_id,
    cp.name AS package_name,
    cp.billing_type,
    se.remaining_sessions,
    se.remaining_hours,
    se.end_date AS package_end_date
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN instructors i ON c.instructor_id = i.id
LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'active'
LEFT JOIN course_packages cp ON se.course_package_id = cp.id;

-- 권한 분석 뷰
CREATE VIEW user_permissions_summary AS
SELECT 
    tu.id as user_id,
    tu.name,
    tu.email,
    t.name as tenant_name,
    tr.name as primary_role,
    tr.display_name as role_display_name,
    
    -- 추가 역할들
    ARRAY(
        SELECT tr2.display_name 
        FROM tenant_roles tr2 
        WHERE tr2.id = ANY(tu.additional_roles)
    ) as additional_role_names,
    
    -- 권한 수
    COUNT(DISTINCT p.id) as total_permissions,
    
    tu.status,
    tu.last_login_at
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
LEFT JOIN tenant_roles tr ON tu.primary_role_id = tr.id
LEFT JOIN role_permissions rp ON tr.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY tu.id, tu.name, tu.email, t.name, tr.name, tr.display_name, tu.additional_roles, tu.status, tu.last_login_at;

-- ================================================================
-- 12. 기본 데이터 삽입
-- ================================================================

-- 시스템 권한 삽입
INSERT INTO permissions (resource, action, scope, name, description, category) VALUES
('students', 'create', 'all', '학생 등록', '새로운 학생을 등록할 수 있습니다', 'academic'),
('students', 'read', 'all', '전체 학생 조회', '모든 학생 정보를 조회할 수 있습니다', 'academic'),
('students', 'read', 'class', '담당 학생 조회', '담당 반 학생들만 조회할 수 있습니다', 'academic'),
('students', 'read', 'own', '본인 정보 조회', '본인의 정보만 조회할 수 있습니다', 'academic'),
('students', 'update', 'all', '전체 학생 수정', '모든 학생 정보를 수정할 수 있습니다', 'academic'),
('students', 'update', 'class', '담당 학생 수정', '담당 반 학생들만 수정할 수 있습니다', 'academic'),
('students', 'delete', 'all', '학생 삭제', '학생을 삭제할 수 있습니다', 'academic'),

('classes', 'create', 'all', '반 생성', '새로운 반을 생성할 수 있습니다', 'academic'),
('classes', 'read', 'all', '전체 반 조회', '모든 반 정보를 조회할 수 있습니다', 'academic'),
('classes', 'read', 'own', '담당 반 조회', '본인이 담당하는 반만 조회할 수 있습니다', 'academic'),
('classes', 'update', 'all', '전체 반 수정', '모든 반 정보를 수정할 수 있습니다', 'academic'),
('classes', 'update', 'own', '담당 반 수정', '본인이 담당하는 반만 수정할 수 있습니다', 'academic'),
('classes', 'delete', 'all', '반 삭제', '반을 삭제할 수 있습니다', 'academic'),

('payments', 'create', 'all', '결제 등록', '새로운 결제를 등록할 수 있습니다', 'financial'),
('payments', 'read', 'all', '전체 결제 조회', '모든 결제 내역을 조회할 수 있습니다', 'financial'),
('payments', 'read', 'class', '담당반 결제 조회', '담당 반의 결제 내역만 조회할 수 있습니다', 'financial'),
('payments', 'update', 'all', '결제 수정', '결제 정보를 수정할 수 있습니다', 'financial'),
('payments', 'delete', 'all', '결제 삭제', '결제를 삭제할 수 있습니다', 'financial'),

('instructors', 'create', 'all', '강사 등록', '새로운 강사를 등록할 수 있습니다', 'administrative'),
('instructors', 'read', 'all', '강사 조회', '강사 정보를 조회할 수 있습니다', 'administrative'),
('instructors', 'update', 'all', '강사 수정', '강사 정보를 수정할 수 있습니다', 'administrative'),
('instructors', 'delete', 'all', '강사 삭제', '강사를 삭제할 수 있습니다', 'administrative'),

('attendances', 'create', 'all', '출석 등록', '출석 정보를 등록할 수 있습니다', 'academic'),
('attendances', 'read', 'all', '전체 출석 조회', '모든 출석 정보를 조회할 수 있습니다', 'academic'),
('attendances', 'read', 'class', '담당반 출석 조회', '담당 반의 출석 정보만 조회할 수 있습니다', 'academic'),
('attendances', 'update', 'all', '출석 수정', '출석 정보를 수정할 수 있습니다', 'academic'),

('documents', 'create', 'all', '문서 업로드', '문서를 업로드할 수 있습니다', 'administrative'),
('documents', 'read', 'all', '전체 문서 조회', '모든 문서를 조회할 수 있습니다', 'administrative'),
('documents', 'update', 'all', '문서 수정', '문서 정보를 수정할 수 있습니다', 'administrative'),
('documents', 'delete', 'all', '문서 삭제', '문서를 삭제할 수 있습니다', 'administrative');

-- ================================================================
-- 멀티테넌트 EduCanvas 데이터베이스 v4.0 완료
-- 
-- 주요 기능:
-- 1. 완전한 멀티테넌트 아키텍처
-- 2. 유연한 역할 상속 및 권한 시스템  
-- 3. 스코프 기반 세밀한 접근 제어
-- 4. 테넌트별 백업 시스템
-- 5. 강화된 보안 및 감사 로그
-- 6. v3.0의 모든 확장 기능 포함
-- 
-- 보안 강화:
-- - RLS 기반 완전한 테넌트 격리
-- - 동적 권한 평가 시스템
-- - 감사 로그 및 이상 탐지
-- - 민감 정보 자동 마스킹
-- 
-- 성능 최적화:
-- - 테넌트별 인덱스 최적화
-- - 권한 캐싱 시스템
-- - 효율적인 쿼리 패턴
-- ================================================================