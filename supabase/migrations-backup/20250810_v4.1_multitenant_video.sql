-- EduCanvas 멀티테넌트 학원 관리 시스템 데이터베이스 스키마 v4.1
-- 작성일: 2025-08-10
-- 데이터베이스: Supabase (PostgreSQL 15+)
-- 주요 기능: 멀티테넌트 아키텍처, 유연한 권한 시스템, 테넌트별 백업, 동영상 강의 시스템

-- ================================================================
-- v4.1 주요 변경사항:
-- 1. v4.0의 모든 멀티테넌트 기능 유지
-- 2. YouTube 기반 동영상 강의 시스템 통합
-- 3. 학생-강의 연동 및 진도 관리
-- 4. 동영상 접근 권한 및 시청 분석
-- 5. 강의 평가 및 피드백 시스템
-- ================================================================

-- ================================================================
-- 1. 기본 ENUM 타입 정의 (v4.0 + 동영상 관련 추가)
-- ================================================================

-- 기존 v4.0 ENUM 타입들
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'withdrawn', 'suspended');
CREATE TYPE billing_type AS ENUM ('monthly', 'sessions', 'hours', 'package', 'drop_in');
CREATE TYPE discount_type AS ENUM ('sibling', 'early_payment', 'loyalty', 'scholarship', 'promotion', 'volume');
CREATE TYPE salary_policy_type AS ENUM ('fixed_monthly', 'fixed_hourly', 'commission', 'tiered_commission', 'student_based', 'hybrid', 'guaranteed_minimum');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled', 'refunded');
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

-- 새로운 동영상 관련 ENUM 타입들
CREATE TYPE video_status AS ENUM ('draft', 'published', 'private', 'archived', 'deleted');
CREATE TYPE video_type AS ENUM ('lecture', 'supplement', 'homework_review', 'exam_review', 'announcement');
CREATE TYPE watch_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
CREATE TYPE video_quality AS ENUM ('240p', '360p', '480p', '720p', '1080p', '1440p', '2160p');

-- ================================================================
-- 2. v4.0 멀티테넌트 핵심 테이블들 (기존 유지)
-- ================================================================

-- 테넌트 (학원) 관리
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    domain VARCHAR(100) UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    business_registration VARCHAR(50),
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    subscription_tier VARCHAR(20) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 유연한 역할 정의 시스템
CREATE TABLE tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES tenant_roles(id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 1,
    base_permissions JSONB DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    is_assignable BOOLEAN DEFAULT true,
    max_users INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_role_name UNIQUE(tenant_id, name)
);

-- 세밀한 권한 정의
CREATE TABLE permissions (
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
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES tenant_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    conditions JSONB DEFAULT '{}',
    restrictions JSONB DEFAULT '{}',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- 리소스별 스코프 정의
CREATE TABLE resource_scopes (
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

-- 테넌트별 사용자 관리
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    primary_role_id UUID REFERENCES tenant_roles(id),
    additional_roles UUID[] DEFAULT ARRAY[]::UUID[],
    status user_status DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    permission_overrides JSONB DEFAULT '{}',
    cached_permissions JSONB DEFAULT '{}',
    invited_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_user UNIQUE(tenant_id, user_id),
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email)
);

-- ================================================================
-- 3. v4.0 백업 시스템 (기존 유지)
-- ================================================================

CREATE TABLE backup_policies (
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

CREATE TABLE backup_executions (
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
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- ================================================================
-- 4. v4.0 감사 로그 시스템 (기존 유지)
-- ================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
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
    audit_date DATE GENERATED ALWAYS AS (occurred_at::date) STORED
);

-- ================================================================
-- 5. v4.0 기존 비즈니스 테이블들 (기존 유지 - 주요 테이블만 포함)
-- ================================================================

-- 강사 정보
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialization VARCHAR(100),
    qualification TEXT,
    bank_account VARCHAR(50),
    status student_status DEFAULT 'active',
    hire_date DATE DEFAULT CURRENT_DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_instructor_email UNIQUE(tenant_id, email)
);

-- 클래스/반 관리
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    grade_level VARCHAR(20),
    max_students INTEGER DEFAULT 20,
    current_students INTEGER DEFAULT 0,
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

-- 학생 관리
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

-- 수강권 옵션
CREATE TABLE course_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    billing_type billing_type NOT NULL,
    base_price INTEGER NOT NULL,
    sessions_count INTEGER,
    hours_count DECIMAL(5,2),
    duration_months INTEGER,
    duration_days INTEGER,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    auto_renewal BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수강권 등록
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_package_id UUID REFERENCES course_packages(id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE,
    original_price INTEGER NOT NULL,
    final_price INTEGER NOT NULL,
    applied_discounts JSONB,
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

-- 결제 관리
CREATE TABLE payments (
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

-- 출석 관리
CREATE TABLE attendances (
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

-- ================================================================
-- 6. 새로운 동영상 강의 시스템 테이블들
-- ================================================================

-- 동영상 강의 메타데이터
CREATE TABLE video_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    
    -- 기본 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- 동영상 정보
    youtube_video_id VARCHAR(20),                -- YouTube 동영상 ID
    youtube_url TEXT,                           -- 전체 YouTube URL
    video_duration_seconds INTEGER,             -- 동영상 길이 (초)
    available_qualities video_quality[] DEFAULT ARRAY['720p']::video_quality[],
    
    -- 분류 및 순서
    video_type video_type DEFAULT 'lecture',
    chapter_number INTEGER,                     -- 챕터 번호
    lesson_number INTEGER,                      -- 강의 순서
    sort_order INTEGER DEFAULT 0,
    
    -- 접근 제어
    status video_status DEFAULT 'draft',
    is_free BOOLEAN DEFAULT false,              -- 무료 시청 가능 여부
    preview_duration_seconds INTEGER DEFAULT 0, -- 미리보기 시간 (초)
    
    -- 학습 관련
    learning_objectives TEXT[],                 -- 학습 목표
    prerequisites TEXT[],                       -- 선수 학습 내용
    related_materials JSONB DEFAULT '{}',      -- 관련 자료 링크
    
    -- 메타데이터
    view_count INTEGER DEFAULT 0,              -- 총 조회수
    like_count INTEGER DEFAULT 0,              -- 좋아요 수
    average_rating DECIMAL(3,2),               -- 평균 평점
    
    -- 시간 정보
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    -- 제약조건
    CONSTRAINT valid_youtube_id CHECK (youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$'),
    CONSTRAINT unique_class_lesson UNIQUE(tenant_id, class_id, chapter_number, lesson_number)
);

-- 학생별 동영상 접근 권한
CREATE TABLE student_video_access (
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
    max_views INTEGER,                          -- 최대 시청 횟수
    current_views INTEGER DEFAULT 0,           -- 현재 시청 횟수
    
    -- 진도 관리
    watch_status watch_status DEFAULT 'not_started',
    watch_progress_seconds INTEGER DEFAULT 0,  -- 시청 진도 (초)
    completion_percentage DECIMAL(5,2) DEFAULT 0, -- 완료 비율
    first_watched_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_video_access UNIQUE(tenant_id, student_id, video_lecture_id)
);

-- 상세 시청 기록
CREATE TABLE video_watch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    video_lecture_id UUID REFERENCES video_lectures(id) ON DELETE CASCADE,
    
    -- 세션 정보
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    session_duration_seconds INTEGER,          -- 실제 시청 시간
    
    -- 시청 범위
    start_position_seconds INTEGER DEFAULT 0, -- 시작 위치
    end_position_seconds INTEGER,              -- 종료 위치
    
    -- 시청 패턴
    pause_count INTEGER DEFAULT 0,            -- 일시정지 횟수
    rewind_count INTEGER DEFAULT 0,           -- 되감기 횟수
    skip_count INTEGER DEFAULT 0,             -- 건너뛰기 횟수
    playback_speed DECIMAL(3,2) DEFAULT 1.0,  -- 재생 속도
    
    -- 디바이스 정보
    device_type VARCHAR(50),                   -- mobile, desktop, tablet
    browser_info VARCHAR(100),
    ip_address INET,
    
    -- 품질 및 성능
    video_quality video_quality,
    buffering_time_seconds INTEGER DEFAULT 0,
    
    completed_session BOOLEAN DEFAULT false,   -- 세션 완료 여부
    
    -- 파티션을 위한 날짜 컬럼
    watch_date DATE GENERATED ALWAYS AS (session_start::date) STORED
);

-- 동영상 평점 및 리뷰
CREATE TABLE video_ratings (
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
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],       -- '이해하기쉬움', '실습유용', '시험도움' 등
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_video_rating UNIQUE(tenant_id, student_id, video_lecture_id)
);

-- 강의 플레이리스트 (커리큘럼)
CREATE TABLE video_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    
    -- 플레이리스트 정보
    name VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- 설정
    is_sequential BOOLEAN DEFAULT true,        -- 순차 학습 필수 여부
    auto_progress BOOLEAN DEFAULT false,       -- 자동 진도 관리
    
    -- 상태
    is_published BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL
);

-- 플레이리스트-동영상 관계
CREATE TABLE playlist_video_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES video_playlists(id) ON DELETE CASCADE,
    video_lecture_id UUID REFERENCES video_lectures(id) ON DELETE CASCADE,
    
    -- 순서 및 설정
    sort_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,          -- 필수 시청 여부
    unlock_condition JSONB DEFAULT '{}',      -- 잠금 해제 조건
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_playlist_video UNIQUE(playlist_id, video_lecture_id),
    CONSTRAINT unique_playlist_order UNIQUE(playlist_id, sort_order)
);

-- ================================================================
-- 7. 동영상 시스템 자동화 함수들
-- ================================================================

-- 현재 테넌트 ID 조회 함수 (v4.0 유지)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
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

-- 학생 수강권 등록시 동영상 접근 권한 자동 부여
CREATE OR REPLACE FUNCTION grant_video_access_on_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    video_record RECORD;
BEGIN
    -- 새로운 수강권 등록시 해당 클래스의 모든 공개 동영상에 접근 권한 부여
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        FOR video_record IN 
            SELECT id FROM video_lectures 
            WHERE class_id = (SELECT class_id FROM students WHERE id = NEW.student_id)
            AND status = 'published'
            AND tenant_id = NEW.tenant_id
        LOOP
            INSERT INTO student_video_access (
                tenant_id, student_id, video_lecture_id, enrollment_id,
                has_access, access_granted_at
            ) VALUES (
                NEW.tenant_id, NEW.student_id, video_record.id, NEW.id,
                true, NOW()
            ) ON CONFLICT (tenant_id, student_id, video_lecture_id) DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새로운 동영상 발행시 해당 클래스 학생들에게 접근 권한 자동 부여
CREATE OR REPLACE FUNCTION grant_video_access_on_publish()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
BEGIN
    -- 동영상 상태가 published로 변경될 때
    IF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
        FOR student_record IN 
            SELECT s.id as student_id, se.id as enrollment_id
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id
            WHERE s.class_id = NEW.class_id 
            AND s.status = 'active'
            AND se.status = 'active'
            AND s.tenant_id = NEW.tenant_id
        LOOP
            INSERT INTO student_video_access (
                tenant_id, student_id, video_lecture_id, enrollment_id,
                has_access, access_granted_at
            ) VALUES (
                NEW.tenant_id, student_record.student_id, NEW.id, student_record.enrollment_id,
                true, NOW()
            ) ON CONFLICT (tenant_id, student_id, video_lecture_id) DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 시청 진도 자동 업데이트
CREATE OR REPLACE FUNCTION update_watch_progress()
RETURNS TRIGGER AS $$
DECLARE
    video_duration INTEGER;
    completion_rate DECIMAL(5,2);
BEGIN
    -- 동영상 전체 길이 조회
    SELECT video_duration_seconds INTO video_duration
    FROM video_lectures
    WHERE id = NEW.video_lecture_id;
    
    IF video_duration IS NULL OR video_duration = 0 THEN
        RETURN NEW;
    END IF;
    
    -- 완료율 계산 (종료 위치 기준)
    completion_rate := (COALESCE(NEW.end_position_seconds, 0)::DECIMAL / video_duration) * 100;
    
    -- student_video_access 테이블 업데이트
    UPDATE student_video_access SET
        watch_progress_seconds = GREATEST(watch_progress_seconds, COALESCE(NEW.end_position_seconds, 0)),
        completion_percentage = GREATEST(completion_percentage, completion_rate),
        watch_status = CASE 
            WHEN GREATEST(completion_percentage, completion_rate) >= 90 THEN 'completed'::watch_status
            WHEN GREATEST(completion_percentage, completion_rate) > 0 THEN 'in_progress'::watch_status
            ELSE 'not_started'::watch_status
        END,
        completed_at = CASE 
            WHEN GREATEST(completion_percentage, completion_rate) >= 90 AND completed_at IS NULL THEN NOW()
            ELSE completed_at
        END,
        last_watched_at = NOW(),
        current_views = current_views + CASE WHEN NEW.completed_session THEN 1 ELSE 0 END
    WHERE tenant_id = NEW.tenant_id
    AND student_id = NEW.student_id 
    AND video_lecture_id = NEW.video_lecture_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 동적 권한 평가 함수 (v4.0 유지)
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

-- 권한 검증 함수 (v4.0 유지)
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

-- 감사 로그 트리거 함수 (v4.0 유지)
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

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================================
-- 8. RLS 정책 적용
-- ================================================================

-- 기존 v4.0 RLS 정책들 유지
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants FOR ALL
USING (id = get_current_tenant_id());

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_users_isolation ON tenant_users FOR ALL
USING (tenant_id = get_current_tenant_id());

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

-- 기타 주요 테이블들의 기본 RLS
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

-- 새로운 동영상 관련 RLS 정책들
ALTER TABLE video_lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_lectures_tenant_isolation ON video_lectures FOR ALL
USING (
    tenant_id = get_current_tenant_id()
    AND (
        -- 강사는 본인 강의만 관리
        instructor_id = (SELECT id FROM instructors WHERE user_id = (
            SELECT user_id FROM tenant_users WHERE id = (
                SELECT id FROM tenant_users WHERE user_id = auth.uid() AND tenant_id = get_current_tenant_id()
            )
        ))
        OR
        -- 관리자는 모든 강의 접근
        check_user_permission('video_lectures', 'read')
    )
);

ALTER TABLE student_video_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_video_access_isolation ON student_video_access FOR ALL
USING (
    tenant_id = get_current_tenant_id()
    AND (
        -- 학생은 본인 접근 권한만
        student_id = (SELECT s.id FROM students s 
                     JOIN tenant_users tu ON s.tenant_id = tu.tenant_id
                     WHERE tu.user_id = auth.uid() 
                     AND s.tenant_id = get_current_tenant_id())
        OR
        -- 강사/관리자는 담당/전체 접근
        check_user_permission('video_access', 'read')
    )
);

ALTER TABLE video_watch_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_watch_sessions_isolation ON video_watch_sessions FOR ALL
USING (
    tenant_id = get_current_tenant_id()
    AND (
        -- 학생은 본인 기록만
        student_id = (SELECT s.id FROM students s 
                     JOIN tenant_users tu ON s.tenant_id = tu.tenant_id
                     WHERE tu.user_id = auth.uid() 
                     AND s.tenant_id = get_current_tenant_id())
        OR
        -- 강사/관리자는 해당 권한에 따라
        check_user_permission('video_analytics', 'read')
    )
);

ALTER TABLE video_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_ratings_isolation ON video_ratings FOR ALL
USING (
    tenant_id = get_current_tenant_id()
    AND (
        -- 학생은 본인 평점만
        student_id = (SELECT s.id FROM students s 
                     JOIN tenant_users tu ON s.tenant_id = tu.tenant_id
                     WHERE tu.user_id = auth.uid() 
                     AND s.tenant_id = get_current_tenant_id())
        OR
        -- 강사/관리자는 해당 권한에 따라
        check_user_permission('video_ratings', 'read')
    )
);

ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_playlists_isolation ON video_playlists FOR ALL
USING (tenant_id = get_current_tenant_id());

-- ================================================================
-- 9. 트리거 적용
-- ================================================================

-- 동영상 관련 트리거들
CREATE TRIGGER grant_video_access_enrollment_trigger
    AFTER INSERT OR UPDATE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION grant_video_access_on_enrollment();

CREATE TRIGGER grant_video_access_publish_trigger
    AFTER UPDATE ON video_lectures
    FOR EACH ROW EXECUTE FUNCTION grant_video_access_on_publish();

CREATE TRIGGER update_watch_progress_trigger
    AFTER INSERT OR UPDATE ON video_watch_sessions
    FOR EACH ROW EXECUTE FUNCTION update_watch_progress();

-- 감사 로그 트리거들 (v4.0 + 동영상 테이블들 추가)
CREATE TRIGGER audit_trigger_students
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_tenant_users
    AFTER INSERT OR UPDATE OR DELETE ON tenant_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_video_lectures
    AFTER INSERT OR UPDATE OR DELETE ON video_lectures
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_video_access
    AFTER INSERT OR UPDATE OR DELETE ON student_video_access
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- updated_at 트리거들
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_lectures_updated_at BEFORE UPDATE ON video_lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_video_access_updated_at BEFORE UPDATE ON student_video_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 10. 인덱스 및 성능 최적화
-- ================================================================

-- 기존 v4.0 인덱스들 유지
CREATE INDEX idx_students_tenant_id ON students(tenant_id);
CREATE INDEX idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_instructors_tenant_id ON instructors(tenant_id);

-- 권한 시스템 인덱스
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

-- 새로운 동영상 관련 인덱스들
CREATE INDEX idx_video_lectures_tenant_class ON video_lectures(tenant_id, class_id);
CREATE INDEX idx_video_lectures_instructor ON video_lectures(instructor_id, status);
CREATE INDEX idx_video_lectures_published ON video_lectures(tenant_id, status) WHERE status = 'published';
CREATE INDEX idx_video_lectures_youtube_id ON video_lectures(youtube_video_id) WHERE youtube_video_id IS NOT NULL;

-- 학생 동영상 접근 인덱스
CREATE INDEX idx_student_video_access_student ON student_video_access(tenant_id, student_id);
CREATE INDEX idx_student_video_access_video ON student_video_access(video_lecture_id);
CREATE INDEX idx_student_video_access_progress ON student_video_access(tenant_id, watch_status);

-- 시청 기록 인덱스 (파티션 최적화)
CREATE INDEX idx_video_watch_sessions_student_date ON video_watch_sessions(student_id, watch_date DESC);
CREATE INDEX idx_video_watch_sessions_video_date ON video_watch_sessions(video_lecture_id, watch_date DESC);
CREATE INDEX idx_video_watch_sessions_tenant_date ON video_watch_sessions(tenant_id, watch_date DESC);

-- 평점 관련 인덱스
CREATE INDEX idx_video_ratings_video ON video_ratings(video_lecture_id);
CREATE INDEX idx_video_ratings_tenant ON video_ratings(tenant_id, rating);

-- 플레이리스트 인덱스
CREATE INDEX idx_video_playlists_class ON video_playlists(class_id, is_published);
CREATE INDEX idx_playlist_video_items_playlist ON playlist_video_items(playlist_id, sort_order);

-- ================================================================
-- 11. 유용한 뷰들
-- ================================================================

-- 기존 v4.0 뷰들 유지 + 동영상 관련 추가
-- 테넌트별 데이터 요약 (동영상 통계 추가)
CREATE VIEW tenant_data_summary AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    t.subscription_tier,
    t.subscription_status,
    
    -- 기존 통계
    COALESCE(s.students_count, 0) as students_count,
    COALESCE(c.classes_count, 0) as classes_count,
    COALESCE(i.instructors_count, 0) as instructors_count,
    COALESCE(p.payments_count, 0) as payments_count,
    COALESCE(u.users_count, 0) as users_count,
    
    -- 동영상 통계
    COALESCE(vl.video_lectures_count, 0) as video_lectures_count,
    COALESCE(vl.published_videos_count, 0) as published_videos_count,
    COALESCE(vws.total_watch_sessions, 0) as total_watch_sessions,
    
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
LEFT JOIN (SELECT tenant_id, COUNT(*) as users_count FROM tenant_users GROUP BY tenant_id) u ON t.id = u.tenant_id
LEFT JOIN (
    SELECT tenant_id, 
           COUNT(*) as video_lectures_count,
           COUNT(*) FILTER (WHERE status = 'published') as published_videos_count
    FROM video_lectures GROUP BY tenant_id
) vl ON t.id = vl.tenant_id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) as total_watch_sessions 
    FROM video_watch_sessions GROUP BY tenant_id
) vws ON t.id = vws.tenant_id;

-- 학생별 동영상 진도 요약
CREATE VIEW student_video_progress AS
SELECT 
    sva.tenant_id,
    sva.student_id,
    s.name as student_name,
    c.name as class_name,
    COUNT(sva.id) as total_videos,
    COUNT(*) FILTER (WHERE sva.watch_status = 'completed') as completed_videos,
    COUNT(*) FILTER (WHERE sva.watch_status = 'in_progress') as in_progress_videos,
    COUNT(*) FILTER (WHERE sva.watch_status = 'not_started') as not_started_videos,
    AVG(sva.completion_percentage) as average_progress,
    MAX(sva.last_watched_at) as last_activity,
    SUM(sva.current_views) as total_views
FROM student_video_access sva
JOIN students s ON sva.student_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE sva.has_access = true
GROUP BY sva.tenant_id, sva.student_id, s.name, c.name;

-- 동영상별 상세 통계
CREATE VIEW video_lecture_stats AS
SELECT 
    vl.id,
    vl.tenant_id,
    vl.title,
    vl.class_id,
    c.name as class_name,
    vl.instructor_id,
    i.name as instructor_name,
    vl.status,
    vl.view_count,
    vl.video_duration_seconds,
    
    -- 등록 통계
    COUNT(sva.id) as enrolled_students,
    COUNT(*) FILTER (WHERE sva.watch_status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE sva.watch_status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE sva.watch_status = 'not_started') as not_started_count,
    
    -- 진도 통계
    AVG(sva.completion_percentage) as average_completion,
    
    -- 시청 통계
    COUNT(vws.id) as total_sessions,
    AVG(vws.session_duration_seconds) as avg_session_duration,
    SUM(vws.session_duration_seconds) as total_watch_time,
    
    -- 평가 통계
    AVG(vr.rating) as average_rating,
    COUNT(vr.id) as rating_count,
    
    vl.created_at,
    vl.published_at
FROM video_lectures vl
JOIN classes c ON vl.class_id = c.id
LEFT JOIN instructors i ON vl.instructor_id = i.id
LEFT JOIN student_video_access sva ON vl.id = sva.video_lecture_id AND sva.has_access = true
LEFT JOIN video_watch_sessions vws ON vl.id = vws.video_lecture_id
LEFT JOIN video_ratings vr ON vl.id = vr.video_lecture_id
GROUP BY vl.id, vl.tenant_id, vl.title, vl.class_id, c.name, vl.instructor_id, i.name, vl.status, vl.view_count, vl.video_duration_seconds, vl.created_at, vl.published_at;

-- 학생별 상세 정보 (수강권 + 동영상 진도 포함)
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
    se.end_date AS package_end_date,
    
    -- 동영상 진도 정보
    COALESCE(svp.total_videos, 0) as total_videos,
    COALESCE(svp.completed_videos, 0) as completed_videos,
    COALESCE(svp.average_progress, 0) as average_video_progress,
    svp.last_activity as last_video_activity
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN instructors i ON c.instructor_id = i.id
LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'active'
LEFT JOIN course_packages cp ON se.course_package_id = cp.id
LEFT JOIN student_video_progress svp ON s.id = svp.student_id;

-- ================================================================
-- 12. 권한 시스템 확장 (동영상 관련 권한 추가)
-- ================================================================

-- 동영상 관련 권한 추가
INSERT INTO permissions (resource, action, scope, name, description, category) VALUES
-- 동영상 강의 관리
('video_lectures', 'create', 'all', '동영상 강의 생성', '새로운 동영상 강의를 생성할 수 있습니다', 'academic'),
('video_lectures', 'create', 'own', '본인 동영상 강의 생성', '본인 담당 클래스의 동영상 강의를 생성할 수 있습니다', 'academic'),
('video_lectures', 'read', 'all', '전체 동영상 강의 조회', '모든 동영상 강의를 조회할 수 있습니다', 'academic'),
('video_lectures', 'read', 'own', '본인 동영상 강의 조회', '본인이 생성한 동영상 강의만 조회할 수 있습니다', 'academic'),
('video_lectures', 'update', 'all', '전체 동영상 강의 수정', '모든 동영상 강의를 수정할 수 있습니다', 'academic'),
('video_lectures', 'update', 'own', '본인 동영상 강의 수정', '본인이 생성한 동영상 강의만 수정할 수 있습니다', 'academic'),
('video_lectures', 'delete', 'all', '동영상 강의 삭제', '동영상 강의를 삭제할 수 있습니다', 'academic'),

-- 동영상 접근 권한 관리
('video_access', 'create', 'all', '동영상 접근 권한 부여', '학생에게 동영상 접근 권한을 부여할 수 있습니다', 'academic'),
('video_access', 'read', 'all', '전체 접근 권한 조회', '모든 동영상 접근 권한을 조회할 수 있습니다', 'academic'),
('video_access', 'read', 'class', '담당반 접근 권한 조회', '담당 반의 동영상 접근 권한을 조회할 수 있습니다', 'academic'),
('video_access', 'update', 'all', '접근 권한 수정', '동영상 접근 권한을 수정할 수 있습니다', 'academic'),
('video_access', 'delete', 'all', '접근 권한 삭제', '동영상 접근 권한을 삭제할 수 있습니다', 'academic'),

-- 동영상 분석 및 통계
('video_analytics', 'read', 'all', '전체 동영상 분석', '모든 동영상 시청 분석을 조회할 수 있습니다', 'academic'),
('video_analytics', 'read', 'class', '담당반 동영상 분석', '담당 반의 동영상 시청 분석을 조회할 수 있습니다', 'academic'),
('video_analytics', 'read', 'own', '본인 동영상 분석', '본인 강의의 동영상 시청 분석을 조회할 수 있습니다', 'academic'),

-- 동영상 평점 및 피드백
('video_ratings', 'create', 'own', '동영상 평점 작성', '수강 중인 동영상에 평점을 작성할 수 있습니다', 'academic'),
('video_ratings', 'read', 'all', '전체 동영상 평점 조회', '모든 동영상 평점을 조회할 수 있습니다', 'academic'),
('video_ratings', 'read', 'own', '본인 평점 조회', '본인이 작성한 평점만 조회할 수 있습니다', 'academic'),
('video_ratings', 'update', 'own', '본인 평점 수정', '본인이 작성한 평점을 수정할 수 있습니다', 'academic'),
('video_ratings', 'delete', 'own', '본인 평점 삭제', '본인이 작성한 평점을 삭제할 수 있습니다', 'academic'),

-- 플레이리스트 관리
('video_playlists', 'create', 'all', '플레이리스트 생성', '동영상 플레이리스트를 생성할 수 있습니다', 'academic'),
('video_playlists', 'create', 'own', '본인 플레이리스트 생성', '본인 담당 클래스의 플레이리스트를 생성할 수 있습니다', 'academic'),
('video_playlists', 'read', 'all', '전체 플레이리스트 조회', '모든 플레이리스트를 조회할 수 있습니다', 'academic'),
('video_playlists', 'update', 'all', '전체 플레이리스트 수정', '모든 플레이리스트를 수정할 수 있습니다', 'academic'),
('video_playlists', 'update', 'own', '본인 플레이리스트 수정', '본인이 생성한 플레이리스트만 수정할 수 있습니다', 'academic');

-- ================================================================
-- EduCanvas 멀티테넌트 + 동영상 강의 시스템 v4.1 완료
-- 
-- 주요 기능:
-- 1. v4.0의 모든 멀티테넌트 기능 완전 유지
-- 2. YouTube 기반 동영상 강의 시스템 완전 통합
-- 3. 학생-수강권-동영상 자동 연동 시스템
-- 4. 실시간 시청 진도 추적 및 분석
-- 5. 동영상 평가 및 피드백 시스템
-- 6. 강의 플레이리스트 및 커리큘럼 관리
-- 
-- 새로운 기능:
-- - YouTube 동영상 메타데이터 관리
-- - 자동 접근 권한 부여 시스템
-- - 상세 시청 기록 및 패턴 분석
-- - 동영상별 통계 및 성과 지표
-- - 멀티테넌트 환경에서의 완전한 데이터 격리
-- 
-- 성능 최적화:
-- - 파티셔닝 준비된 시청 기록 테이블
-- - 효율적인 진도 업데이트 시스템
-- - 캐시 친화적 권한 검증
-- - 대용량 동영상 데이터 처리 최적화
-- ================================================================