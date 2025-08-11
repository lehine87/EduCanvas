-- EduCanvas Database Schema v4.1 Setup Script
-- Run this script in Supabase SQL Editor: https://supabase.com/dashboard/project/hodkqpmukwfrreozwmcy/sql

-- 1. 기본 ENUM 타입 정의 (v4.0 + 동영상 관련 추가)
-- ENUM 타입들은 이미 존재할 수 있으므로 IF NOT EXISTS로 생성
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'withdrawn', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_type AS ENUM ('monthly', 'sessions', 'hours', 'package', 'drop_in');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 새로운 동영상 관련 ENUM 타입들
DO $$ BEGIN
    CREATE TYPE video_status AS ENUM ('draft', 'published', 'private', 'archived', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE video_type AS ENUM ('lecture', 'supplement', 'homework_review', 'exam_review', 'announcement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE watch_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE video_quality AS ENUM ('240p', '360p', '480p', '720p', '1080p', '1440p', '2160p');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 멀티테넌트 핵심 테이블들

-- 테넌트 (학원) 관리
CREATE TABLE IF NOT EXISTS tenants (
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

-- 사용자 프로필 (멀티테넌트 지원)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'ko',
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테넌트 역할
CREATE TABLE IF NOT EXISTS tenant_roles (
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

-- 테넌트 멤버십
CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES tenant_roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active',
    invited_by UUID REFERENCES user_profiles(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    permissions_override JSONB DEFAULT '{}',
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_user UNIQUE(tenant_id, user_id)
);

-- 학생 정보 (테넌트별 격리)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_english VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    school_name VARCHAR(100),
    grade_level VARCHAR(20),
    status student_status DEFAULT 'active',
    notes TEXT,
    emergency_contact JSONB,
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_student_number UNIQUE(tenant_id, student_number)
);

-- 클래스 정보 (테넌트별 격리)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    level VARCHAR(50),
    color VARCHAR(7),
    max_students INTEGER DEFAULT 20,
    min_students INTEGER DEFAULT 1,
    instructor_id UUID REFERENCES user_profiles(id),
    classroom_id UUID,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    schedule_config JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수강권 패키지 (테넌트별)
CREATE TABLE IF NOT EXISTS course_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    billing_type billing_type NOT NULL,
    
    -- 가격 정보
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'KRW',
    
    -- 수량 정보
    sessions INTEGER DEFAULT 0,
    hours DECIMAL(5,1) DEFAULT 0,
    months INTEGER DEFAULT 0,
    validity_days INTEGER DEFAULT 365,
    
    -- 동영상 액세스
    video_access_days INTEGER DEFAULT 0,
    offline_access BOOLEAN DEFAULT false,
    download_allowed BOOLEAN DEFAULT false,
    
    -- 상태 및 가용성
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    max_enrollments INTEGER,
    available_from DATE,
    available_until DATE,
    
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수강권 유형별 검증
    CONSTRAINT valid_billing_config CHECK (
        CASE billing_type
            WHEN 'sessions' THEN sessions > 0
            WHEN 'hours' THEN hours > 0
            WHEN 'package' THEN months > 0
            ELSE true
        END
    )
);

-- 학생 수강 등록 (향상된)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    package_id UUID REFERENCES course_packages(id),
    
    -- 등록 정보
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE,
    end_date DATE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 사용량 추적
    sessions_total INTEGER DEFAULT 0,
    sessions_used INTEGER DEFAULT 0,
    sessions_remaining INTEGER DEFAULT 0,
    hours_total DECIMAL(5,1) DEFAULT 0,
    hours_used DECIMAL(5,1) DEFAULT 0,
    hours_remaining DECIMAL(5,1) DEFAULT 0,
    
    -- 동영상 액세스
    video_access_expires_at TIMESTAMP WITH TIME ZONE,
    can_download_videos BOOLEAN DEFAULT false,
    video_watch_count INTEGER DEFAULT 0,
    
    -- 상태 및 위치
    status VARCHAR(20) DEFAULT 'active',
    position_in_class INTEGER DEFAULT 0,
    
    -- 가격 정보
    original_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_price DECIMAL(12,2) NOT NULL,
    payment_plan VARCHAR(50),
    
    -- 성과 추적
    attendance_rate DECIMAL(5,2) DEFAULT 0,
    assignment_completion_rate DECIMAL(5,2) DEFAULT 0,
    average_grade DECIMAL(5,2) DEFAULT 0,
    
    -- 관리 정보
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',
    enrolled_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- ClassFlow를 위한 유니크 제약
    CONSTRAINT unique_class_position UNIQUE(class_id, position_in_class)
);

-- 3. YouTube 동영상 강의 시스템

-- 동영상 강의
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES user_profiles(id),
    
    -- 기본 정보
    title VARCHAR(500) NOT NULL,
    description TEXT,
    youtube_video_id VARCHAR(20) NOT NULL,
    youtube_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- 메타데이터
    duration_seconds INTEGER,
    video_type video_type NOT NULL DEFAULT 'lecture',
    status video_status DEFAULT 'draft',
    quality video_quality DEFAULT '720p',
    
    -- 접근 제어
    is_public BOOLEAN DEFAULT false,
    password_protected BOOLEAN DEFAULT false,
    password_hash TEXT,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    
    -- 학습 관리
    order_index INTEGER DEFAULT 0,
    prerequisites UUID[] DEFAULT '{}',
    learning_objectives TEXT[],
    tags TEXT[],
    
    -- 분석 데이터
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_watch_time INTEGER DEFAULT 0,
    
    -- 관리 정보
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_youtube_id CHECK (LENGTH(youtube_video_id) = 11)
);

-- 학생 동영상 시청 기록
CREATE TABLE IF NOT EXISTS video_watch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID,
    
    -- 시청 정보
    watch_status watch_status DEFAULT 'not_started',
    progress_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- 시청 세션
    session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_position_time TIMESTAMP WITH TIME ZONE,
    total_watch_time INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    
    -- 상호작용
    is_liked BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    bookmarks JSONB DEFAULT '[]',
    
    -- 품질 및 기기
    playback_quality video_quality,
    device_type VARCHAR(50),
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_student_video UNIQUE(student_id, video_id)
);

-- 4. 기본 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_students_tenant_status ON students(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_students_tenant_name ON students(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_classes_tenant_instructor ON classes(tenant_id, instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_class ON student_enrollments(tenant_id, class_id);
CREATE INDEX IF NOT EXISTS idx_videos_tenant_class ON videos(tenant_id, class_id);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_student_video ON video_watch_sessions(student_id, video_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_tenant_status ON video_watch_sessions(tenant_id, watch_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_position ON student_enrollments(class_id, position_in_class, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_tenant ON tenant_memberships(user_id, tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON tenant_memberships(tenant_id, role_id);

-- 5. 샘플 테넌트 및 역할 데이터
INSERT INTO tenants (id, name, slug, contact_email) VALUES
('11111111-1111-1111-1111-111111111111', 'EduCanvas 데모 학원', 'demo-academy', 'admin@demo-academy.com')
ON CONFLICT (slug) DO NOTHING;

-- 시스템 역할 생성
INSERT INTO tenant_roles (id, tenant_id, name, display_name, is_system_role, hierarchy_level) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin', '관리자', true, 1),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'instructor', '강사', true, 2),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'staff', '직원', true, 3),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'student', '학생', true, 4)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 샘플 클래스 생성
INSERT INTO classes (id, tenant_id, name, description, subject, level, color, instructor_id) VALUES
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '수학 기초반', '중학교 수학 기초 과정', '수학', '초급', '#3B82F6', NULL),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '영어 회화반', '기초 영어 회화 수업', '영어', '초급', '#10B981', NULL)
ON CONFLICT (id) DO NOTHING;

-- 성공 메시지
SELECT 'EduCanvas Database Schema v4.1이 성공적으로 설정되었습니다!' as message;