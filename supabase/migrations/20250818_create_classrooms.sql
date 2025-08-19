-- EduCanvas 교실 관리 테이블 추가
-- 작성일: 2025-08-18
-- 목적: 교실 관리 기능 추가를 위한 classrooms 테이블 생성

-- ================================================================
-- 1. 필요한 ENUM 타입 생성
-- ================================================================

-- 교실 상태 ENUM
DO $$ BEGIN
    CREATE TYPE classroom_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 교실 유형 ENUM
DO $$ BEGIN
    CREATE TYPE classroom_type AS ENUM ('general', 'lab', 'seminar', 'lecture_hall', 'study_room');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================================================
-- 2. classrooms 테이블 생성
-- ================================================================

CREATE TABLE IF NOT EXISTS classrooms (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_tenant_classroom_name UNIQUE(tenant_id, name),
    CONSTRAINT check_capacity_positive CHECK (capacity > 0),
    CONSTRAINT check_floor_positive CHECK (floor >= 0),
    CONSTRAINT check_hourly_rate_non_negative CHECK (hourly_rate >= 0)
);

-- ================================================================
-- 3. 인덱스 생성 (성능 최적화)
-- ================================================================

-- 테넌트별 교실 검색 최적화
CREATE INDEX IF NOT EXISTS idx_classrooms_tenant_id ON classrooms(tenant_id);

-- 교실 상태별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_classrooms_status ON classrooms(tenant_id, status);

-- 교실 타입별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_classrooms_type ON classrooms(tenant_id, classroom_type);

-- 수용 인원별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_classrooms_capacity ON classrooms(tenant_id, capacity);

-- 건물별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_classrooms_building ON classrooms(tenant_id, building) WHERE building IS NOT NULL;

-- ================================================================
-- 4. Row Level Security (RLS) 정책 설정
-- ================================================================

-- RLS 활성화
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

-- 테넌트 격리 정책: 사용자는 자신의 테넌트 교실만 접근 가능
CREATE POLICY "Users can only access their tenant's classrooms"
    ON classrooms
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- 시스템 관리자는 모든 테넌트 교실 접근 가능
CREATE POLICY "System admins can access all classrooms"
    ON classrooms
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'system_admin'
        )
    );