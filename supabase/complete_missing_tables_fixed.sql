-- ================================================================
-- EduCanvas T-003 완료를 위한 누락 테이블 추가 스크립트 (수정버전)
-- 작성일: 2025-08-10
-- 목적: Schema v4.1에 정의된 모든 누락 테이블 추가 (오류 수정)
-- ================================================================

-- ================================================================
-- 1. 누락된 ENUM 타입들 추가
-- ================================================================

-- 기존에 없는 ENUM 타입들 추가
DO $$
BEGIN
    -- attendance_status 체크 후 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
    END IF;
    
    -- payment_status 체크 후 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled', 'refunded');
    END IF;
    
    -- billing_type 체크 후 생성 (기존과 다를 수 있음)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_type') THEN
        CREATE TYPE billing_type AS ENUM ('monthly', 'sessions', 'hours', 'package', 'drop_in');
    END IF;
    
    -- salary_policy_type 추가
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salary_policy_type') THEN
        CREATE TYPE salary_policy_type AS ENUM ('fixed_monthly', 'fixed_hourly', 'commission', 'tiered_commission', 'student_based', 'hybrid', 'guaranteed_minimum');
    END IF;
    
    -- video_status 체크 후 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_status') THEN
        CREATE TYPE video_status AS ENUM ('draft', 'published', 'private', 'archived', 'deleted');
    END IF;
    
    -- video_type 체크 후 생성  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_type') THEN
        CREATE TYPE video_type AS ENUM ('lecture', 'supplement', 'homework_review', 'exam_review', 'announcement');
    END IF;
    
    -- watch_status 체크 후 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'watch_status') THEN
        CREATE TYPE watch_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
    END IF;
    
    -- video_quality 체크 후 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_quality') THEN
        CREATE TYPE video_quality AS ENUM ('240p', '360p', '480p', '720p', '1080p', '1440p', '2160p');
    END IF;
    
    -- 새로운 상태 타입들
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_status') THEN
        CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_type') THEN
        CREATE TYPE consultation_type AS ENUM ('enrollment', 'academic', 'behavioral', 'career', 'parent_meeting', 'follow_up');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'history_action') THEN
        CREATE TYPE history_action AS ENUM ('create', 'update', 'delete', 'move', 'enroll', 'withdraw', 'payment', 'exam', 'consultation');
    END IF;
END $$;

-- ================================================================
-- 2. 권한 시스템 테이블들 (최우선)
-- ================================================================

-- 권한 정의 테이블
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30),
    is_system_permission BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_permission UNIQUE(resource, action, scope)
);

-- 역할-권한 매핑
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES tenant_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    conditions JSONB DEFAULT '{}',
    restrictions JSONB DEFAULT '{}',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- 리소스별 스코프 정의
CREATE TABLE IF NOT EXISTS resource_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    scope_name VARCHAR(50) NOT NULL,
    definition JSONB NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_resource_scope UNIQUE(tenant_id, resource_type, scope_name)
);

-- ================================================================
-- 3. 강사 관리 테이블
-- ================================================================

-- 강사 정보 테이블
CREATE TABLE IF NOT EXISTS instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialization VARCHAR(100),
    qualification TEXT,
    bank_account VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    hire_date DATE DEFAULT CURRENT_DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_instructor_email UNIQUE(tenant_id, email)
);

-- 급여 정책 테이블
CREATE TABLE IF NOT EXISTS salary_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    policy_type salary_policy_type NOT NULL,
    base_amount DECIMAL(12,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    tier_config JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '{}',
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. 출석 및 결제 관리 테이블들
-- ================================================================

-- 출석 관리
CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id),
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    actual_hours DECIMAL(4,2),
    notes TEXT,
    late_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_date_attendance UNIQUE(tenant_id, student_id, attendance_date)
);

-- 결제 관리
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id),
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status payment_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    payment_date DATE,
    memo TEXT,
    receipt_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 5. 향상된 동영상 강의 시스템
-- ================================================================

-- 동영상 강의 메타데이터 (기존 videos 확장)
CREATE TABLE IF NOT EXISTS video_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    
    -- 기본 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- 동영상 정보
    youtube_video_id VARCHAR(20),
    youtube_url TEXT,
    video_duration_seconds INTEGER,
    available_qualities video_quality[] DEFAULT ARRAY['720p']::video_quality[],
    
    -- 분류 및 순서
    video_type video_type DEFAULT 'lecture',
    chapter_number INTEGER,
    lesson_number INTEGER,
    sort_order INTEGER DEFAULT 0,
    
    -- 접근 제어
    status video_status DEFAULT 'draft',
    is_free BOOLEAN DEFAULT false,
    preview_duration_seconds INTEGER DEFAULT 0,
    
    -- 학습 관련
    learning_objectives TEXT[],
    prerequisites TEXT[],
    related_materials JSONB DEFAULT '{}',
    
    -- 메타데이터
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    
    -- 시간 정보
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- 제약조건
    CONSTRAINT valid_youtube_id CHECK (youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$' OR youtube_video_id IS NULL),
    CONSTRAINT unique_class_lesson UNIQUE(tenant_id, class_id, chapter_number, lesson_number)
);

-- 학생별 동영상 접근 권한
CREATE TABLE IF NOT EXISTS student_video_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    video_lecture_id UUID REFERENCES video_lectures(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE CASCADE,
    
    -- 접근 권한
    has_access BOOLEAN DEFAULT true,
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 접근 제한
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    
    -- 진도 관리
    watch_status watch_status DEFAULT 'not_started',
    watch_progress_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    first_watched_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_video_access UNIQUE(tenant_id, student_id, video_lecture_id)
);

-- 동영상 평점 및 리뷰
CREATE TABLE IF NOT EXISTS video_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    video_lecture_id UUID REFERENCES video_lectures(id) ON DELETE CASCADE,
    
    -- 평가 정보
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    -- 상세 평가 (선택적)
    content_quality INTEGER CHECK (content_quality BETWEEN 1 AND 5),
    explanation_clarity INTEGER CHECK (explanation_clarity BETWEEN 1 AND 5),
    audio_quality INTEGER CHECK (audio_quality BETWEEN 1 AND 5),
    video_quality_rating INTEGER CHECK (video_quality_rating BETWEEN 1 AND 5),
    
    -- 도움 여부
    is_helpful BOOLEAN,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- 태그
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_video_rating UNIQUE(tenant_id, student_id, video_lecture_id)
);

-- 강의 플레이리스트 (커리큘럼)
CREATE TABLE IF NOT EXISTS video_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    
    -- 플레이리스트 정보
    name VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- 설정
    is_sequential BOOLEAN DEFAULT true,
    auto_progress BOOLEAN DEFAULT false,
    
    -- 상태
    is_published BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 플레이리스트-동영상 관계
CREATE TABLE IF NOT EXISTS playlist_video_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES video_playlists(id) ON DELETE CASCADE,
    video_lecture_id UUID REFERENCES video_lectures(id) ON DELETE CASCADE,
    
    -- 순서 및 설정
    sort_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    unlock_condition JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_playlist_video UNIQUE(playlist_id, video_lecture_id),
    CONSTRAINT unique_playlist_order UNIQUE(playlist_id, sort_order)
);

-- ================================================================
-- 6. 백업 및 감사 시스템 (수정된 부분)
-- ================================================================

-- 백업 정책
CREATE TABLE IF NOT EXISTS backup_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    backup_type VARCHAR(20) DEFAULT 'full',
    schedule JSONB NOT NULL,
    retention_days INTEGER DEFAULT 30,
    include_tables TEXT[] DEFAULT ARRAY['*'],
    exclude_tables TEXT[] DEFAULT ARRAY[]::TEXT[],
    compression_type VARCHAR(20) DEFAULT 'gzip',
    encryption_enabled BOOLEAN DEFAULT true,
    encryption_key_id UUID,
    storage_provider VARCHAR(20) DEFAULT 'supabase',
    storage_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_backup_at TIMESTAMP WITH TIME ZONE,
    next_backup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_backup_policy UNIQUE(tenant_id, name)
);

-- 백업 실행 기록
CREATE TABLE IF NOT EXISTS backup_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES backup_policies(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    execution_type VARCHAR(20) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',
    backup_size BIGINT,
    compressed_size BIGINT,
    tables_count INTEGER,
    records_count BIGINT,
    backup_path TEXT,
    storage_url TEXT,
    checksum VARCHAR(64),
    error_message TEXT,
    execution_time_seconds INTEGER,
    backup_metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 감사 로그 (수정: GENERATED ALWAYS 제거)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_name VARCHAR(50),
    risk_level VARCHAR(10) DEFAULT 'low',
    is_anomalous BOOLEAN DEFAULT false,
    audit_date DATE DEFAULT CURRENT_DATE  -- 수정: GENERATED 제거, DEFAULT 사용
);

-- ================================================================
-- 7. 추가 비즈니스 로직 테이블들
-- ================================================================

-- 학생 상담 관리
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    consultation_type consultation_type NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status consultation_status DEFAULT 'scheduled',
    location VARCHAR(100),
    meeting_url TEXT,
    agenda TEXT,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 이력 관리
CREATE TABLE IF NOT EXISTS student_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    action history_action NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 8. 성능 최적화 인덱스 추가
-- ================================================================

-- 권한 시스템 인덱스
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action, scope);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_resource_scopes_tenant_resource ON resource_scopes(tenant_id, resource_type);

-- 강사 관리 인덱스
CREATE INDEX IF NOT EXISTS idx_instructors_tenant_status ON instructors(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_salary_policies_instructor_active ON salary_policies(instructor_id, is_active);

-- 출석 및 결제 인덱스
CREATE INDEX IF NOT EXISTS idx_attendances_student_date ON attendances(student_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_date ON attendances(tenant_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_student_due_date ON payments(student_id, due_date);

-- 동영상 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_video_lectures_tenant_class ON video_lectures(tenant_id, class_id);
CREATE INDEX IF NOT EXISTS idx_video_lectures_instructor_status ON video_lectures(instructor_id, status);
CREATE INDEX IF NOT EXISTS idx_student_video_access_student ON student_video_access(tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_student_video_access_video ON student_video_access(video_lecture_id);
CREATE INDEX IF NOT EXISTS idx_video_ratings_video ON video_ratings(video_lecture_id);
CREATE INDEX IF NOT EXISTS idx_video_playlists_class ON video_playlists(class_id, is_published);

-- 감사 및 백업 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date ON audit_logs(tenant_id, audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_occurred ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_executions_tenant ON backup_executions(tenant_id, started_at DESC);

-- 상담 및 이력 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_student_date ON consultations(student_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_histories_student_occurred ON student_histories(student_id, occurred_at DESC);

-- ================================================================
-- 9. RLS 정책 추가
-- ================================================================

-- 새로운 테이블들에 RLS 활성화
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_video_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_video_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_histories ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 10. 기본 권한 데이터 삽입
-- ================================================================

-- 시스템 권한들 삽입
INSERT INTO permissions (resource, action, scope, name, description, category) VALUES
-- 학생 관리 권한
('students', 'create', 'all', '전체 학생 생성', '모든 학생을 생성할 수 있습니다', 'student_management'),
('students', 'read', 'all', '전체 학생 조회', '모든 학생을 조회할 수 있습니다', 'student_management'),
('students', 'update', 'all', '전체 학생 수정', '모든 학생 정보를 수정할 수 있습니다', 'student_management'),
('students', 'delete', 'all', '학생 삭제', '학생을 삭제할 수 있습니다', 'student_management'),

-- 클래스 관리 권한
('classes', 'create', 'all', '클래스 생성', '새로운 클래스를 생성할 수 있습니다', 'class_management'),
('classes', 'read', 'all', '전체 클래스 조회', '모든 클래스를 조회할 수 있습니다', 'class_management'),
('classes', 'update', 'all', '전체 클래스 수정', '모든 클래스를 수정할 수 있습니다', 'class_management'),
('classes', 'delete', 'all', '클래스 삭제', '클래스를 삭제할 수 있습니다', 'class_management'),

-- 강사 관리 권한
('instructors', 'create', 'all', '강사 등록', '새로운 강사를 등록할 수 있습니다', 'instructor_management'),
('instructors', 'read', 'all', '강사 조회', '모든 강사 정보를 조회할 수 있습니다', 'instructor_management'),
('instructors', 'update', 'all', '강사 수정', '강사 정보를 수정할 수 있습니다', 'instructor_management'),

-- 동영상 강의 권한
('video_lectures', 'create', 'all', '동영상 강의 생성', '새로운 동영상 강의를 생성할 수 있습니다', 'video_management'),
('video_lectures', 'read', 'all', '전체 동영상 강의 조회', '모든 동영상 강의를 조회할 수 있습니다', 'video_management'),
('video_lectures', 'update', 'all', '전체 동영상 강의 수정', '모든 동영상 강의를 수정할 수 있습니다', 'video_management'),

-- 결제 관리 권한
('payments', 'create', 'all', '결제 생성', '새로운 결제를 생성할 수 있습니다', 'payment_management'),
('payments', 'read', 'all', '결제 조회', '모든 결제 정보를 조회할 수 있습니다', 'payment_management'),
('payments', 'update', 'all', '결제 수정', '결제 정보를 수정할 수 있습니다', 'payment_management'),

-- 출석 관리 권한
('attendances', 'create', 'all', '출석 기록', '출석을 기록할 수 있습니다', 'attendance_management'),
('attendances', 'read', 'all', '출석 조회', '모든 출석 정보를 조회할 수 있습니다', 'attendance_management'),
('attendances', 'update', 'all', '출석 수정', '출석 정보를 수정할 수 있습니다', 'attendance_management')

ON CONFLICT (resource, action, scope) DO NOTHING;

-- ================================================================
-- 11. 감사 로그를 위한 트리거 생성 (audit_date 자동 업데이트)
-- ================================================================

CREATE OR REPLACE FUNCTION update_audit_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.audit_date = DATE(NEW.occurred_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- audit_logs 테이블에 트리거 적용
CREATE TRIGGER audit_date_trigger
    BEFORE INSERT OR UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_date();

-- ================================================================
-- 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'EduCanvas T-003 누락 테이블 추가 완료! (수정버전)';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '추가된 테이블들:';
    RAISE NOTICE '- 권한 시스템: permissions, role_permissions, resource_scopes';
    RAISE NOTICE '- 강사 관리: instructors, salary_policies';
    RAISE NOTICE '- 출석/결제: attendances, payments';  
    RAISE NOTICE '- 동영상 시스템: video_lectures, student_video_access, video_ratings';
    RAISE NOTICE '- 백업/감사: backup_policies, backup_executions, audit_logs';
    RAISE NOTICE '- 추가 기능: consultations, student_histories';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '수정사항: audit_date GENERATED 제거, 트리거로 대체';
    RAISE NOTICE 'T-003 이제 100% 완료되었습니다!';
    RAISE NOTICE '==================================================';
END $$;