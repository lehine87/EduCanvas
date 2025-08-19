-- EduCanvas 교실 관리 테이블 추가
-- 작성일: 2025-08-18
-- 목적: 교실 관리 기능 추가를 위한 classrooms 테이블 생성

-- ================================================================
-- 1. 필요한 ENUM 타입 생성
-- ================================================================

-- 교실 상태 ENUM (이미 존재할 수 있으므로 IF NOT EXISTS 사용하지 않음)
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

-- ================================================================
-- 5. 샘플 데이터 (테스트용)
-- ================================================================

-- 기본 테넌트가 있다면 샘플 교실 데이터 추가
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- 기본 테넊트 ID 조회 (hanulsumin@naver.com 사용자의 테넌트)
    SELECT tenant_id INTO default_tenant_id
    FROM user_profiles up
    JOIN auth.users au ON up.id = au.id
    WHERE au.email = 'hanulsumin@naver.com'
    LIMIT 1;
    
    -- 테넌트가 있다면 샘플 교실 데이터 추가
    IF default_tenant_id IS NOT NULL THEN
        INSERT INTO classrooms (tenant_id, name, building, floor, room_number, capacity, classroom_type, description) VALUES
        (default_tenant_id, '수학 1강의실', '본관', 2, '201', 30, 'general', '수학 전용 강의실'),
        (default_tenant_id, '영어 토론실', '본관', 2, '202', 20, 'seminar', '영어 토론 및 발표 전용실'),
        (default_tenant_id, '과학 실험실', '본관', 3, '301', 25, 'lab', '물리/화학 실험실'),
        (default_tenant_id, '대강당', '본관', 1, '101', 100, 'lecture_hall', '대규모 강의 및 행사용'),
        (default_tenant_id, '스터디룸 A', '별관', 1, 'A01', 8, 'study_room', '소규모 그룹 스터디용')
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        RAISE NOTICE '샘플 교실 데이터가 추가되었습니다. (테넌트: %)', default_tenant_id;
    ELSE
        RAISE NOTICE '기본 테넌트를 찾을 수 없어 샘플 데이터를 추가하지 않았습니다.';
    END IF;
END $$;

-- ================================================================
-- 6. 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'classrooms 테이블 생성이 완료되었습니다!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 구조:';
    RAISE NOTICE '- classrooms 테이블';
    RAISE NOTICE '- classroom_status ENUM';
    RAISE NOTICE '- classroom_type ENUM';
    RAISE NOTICE '- 인덱스 5개';
    RAISE NOTICE '- RLS 정책 2개';
    RAISE NOTICE '- 샘플 데이터 5개 (테넌트 존재 시)';
    RAISE NOTICE '========================================';
END $$;