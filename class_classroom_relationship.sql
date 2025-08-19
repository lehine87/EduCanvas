-- EduCanvas 클래스-교실 연관관계 구현
-- 작성일: 2025-08-18
-- 목적: 유연한 클래스-교실 스케줄링 시스템 구현

-- ================================================================
-- 1. classes 테이블에 기본 교실 컬럼 추가
-- ================================================================

-- classes 테이블에 기본 교실 참조 추가 (nullable - 기본 교실이 없을 수도 있음)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS default_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL;

-- 기본 교실 관계 인덱스
CREATE INDEX IF NOT EXISTS idx_classes_default_classroom ON classes(default_classroom_id);

-- ================================================================
-- 2. 요일별 교실 스케줄 테이블
-- ================================================================

-- 요일 ENUM 타입
DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 시간대 정보를 위한 time_slot 테이블
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- '1교시', '오전반', '저녁반' 등
    start_time TIME NOT NULL,   -- 시작 시간 (예: 09:00)
    end_time TIME NOT NULL,     -- 종료 시간 (예: 10:30)
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time))/60
    ) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_tenant_time_slot_name UNIQUE(tenant_id, name),
    CONSTRAINT check_time_valid CHECK (end_time > start_time)
);

-- 클래스 요일별 교실 스케줄 테이블
CREATE TABLE IF NOT EXISTS class_classroom_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
    
    -- 요일 정보
    day_of_week day_of_week NOT NULL,
    
    -- 유효 기간
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE, -- NULL이면 무제한
    
    -- 반복 설정
    is_recurring BOOLEAN DEFAULT true, -- 매주 반복 여부
    recurrence_weeks INTEGER DEFAULT 1, -- 몇 주마다 반복 (1=매주, 2=격주 등)
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    notes TEXT, -- 특이사항
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    
    -- 제약조건
    CONSTRAINT check_effective_dates CHECK (effective_until IS NULL OR effective_until >= effective_from),
    CONSTRAINT check_recurrence_weeks_positive CHECK (recurrence_weeks > 0)
);

-- ================================================================
-- 3. 임시 교실 변경 테이블
-- ================================================================

-- 임시 교실 변경 사유 ENUM
DO $$ BEGIN
    CREATE TYPE classroom_change_reason AS ENUM (
        'maintenance', 'renovation', 'emergency', 'equipment_issue', 
        'capacity_change', 'special_event', 'administrative', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 임시 교실 변경 기록 테이블
CREATE TABLE IF NOT EXISTS temporary_classroom_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    
    -- 원래 교실 정보
    original_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    original_schedule_id UUID REFERENCES class_classroom_schedules(id) ON DELETE SET NULL,
    
    -- 임시 교실 정보  
    temporary_classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
    
    -- 변경 날짜/시간
    change_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- 변경 사유 및 정보
    reason classroom_change_reason NOT NULL,
    reason_description TEXT,
    
    -- 승인 정보
    requested_by UUID REFERENCES user_profiles(id) NOT NULL,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    
    -- 알림 정보
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT check_change_time_valid CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time),
    CONSTRAINT check_change_date_future CHECK (change_date >= CURRENT_DATE - INTERVAL '7 days'), -- 과거 1주일까지만 허용
    CONSTRAINT check_different_classrooms CHECK (original_classroom_id != temporary_classroom_id)
);

-- ================================================================
-- 4. 교실 예약 충돌 방지 뷰
-- ================================================================

-- 교실 사용 현황을 통합해서 보는 뷰
CREATE OR REPLACE VIEW classroom_usage_view AS
WITH regular_usage AS (
    -- 정규 스케줄
    SELECT 
        ccs.classroom_id,
        ccs.day_of_week,
        ts.start_time,
        ts.end_time,
        c.name as class_name,
        'regular' as usage_type,
        ccs.effective_from,
        ccs.effective_until,
        ccs.is_active,
        ccs.tenant_id
    FROM class_classroom_schedules ccs
    JOIN classes c ON ccs.class_id = c.id
    JOIN time_slots ts ON ccs.time_slot_id = ts.id
    WHERE ccs.is_active = true
),
temporary_usage AS (
    -- 임시 변경
    SELECT 
        tcc.temporary_classroom_id as classroom_id,
        EXTRACT(DOW FROM tcc.change_date)::INTEGER as day_of_week_num,
        CASE EXTRACT(DOW FROM tcc.change_date)::INTEGER
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END::day_of_week as day_of_week,
        COALESCE(tcc.start_time, ts.start_time) as start_time,
        COALESCE(tcc.end_time, ts.end_time) as end_time,
        c.name as class_name,
        'temporary' as usage_type,
        tcc.change_date as effective_from,
        tcc.change_date as effective_until,
        (tcc.status = 'approved') as is_active,
        tcc.tenant_id
    FROM temporary_classroom_changes tcc
    JOIN classes c ON tcc.class_id = c.id
    LEFT JOIN time_slots ts ON tcc.time_slot_id = ts.id
    WHERE tcc.status IN ('approved', 'completed')
)
SELECT * FROM regular_usage
UNION ALL
SELECT 
    classroom_id, day_of_week, start_time, end_time, class_name, 
    usage_type, effective_from::DATE, effective_until::DATE, is_active, tenant_id
FROM temporary_usage;

-- ================================================================
-- 5. 인덱스 생성 (성능 최적화)
-- ================================================================

-- time_slots 인덱스
CREATE INDEX IF NOT EXISTS idx_time_slots_tenant_id ON time_slots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(tenant_id, is_active);

-- class_classroom_schedules 인덱스
CREATE INDEX IF NOT EXISTS idx_class_schedules_tenant_id ON class_classroom_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON class_classroom_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_classroom_id ON class_classroom_schedules(classroom_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_time ON class_classroom_schedules(tenant_id, day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_class_schedules_effective_dates ON class_classroom_schedules(effective_from, effective_until);

-- temporary_classroom_changes 인덱스  
CREATE INDEX IF NOT EXISTS idx_temp_changes_tenant_id ON temporary_classroom_changes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_temp_changes_class_id ON temporary_classroom_changes(class_id);
CREATE INDEX IF NOT EXISTS idx_temp_changes_date ON temporary_classroom_changes(change_date);
CREATE INDEX IF NOT EXISTS idx_temp_changes_classroom ON temporary_classroom_changes(temporary_classroom_id);
CREATE INDEX IF NOT EXISTS idx_temp_changes_status ON temporary_classroom_changes(tenant_id, status);

-- ================================================================
-- 6. Row Level Security (RLS) 정책 설정
-- ================================================================

-- time_slots RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their tenant's time slots"
    ON time_slots FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "System admins can access all time slots"
    ON time_slots FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'system_admin')
    );

-- class_classroom_schedules RLS
ALTER TABLE class_classroom_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their tenant's class schedules"
    ON class_classroom_schedules FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "System admins can access all class schedules"
    ON class_classroom_schedules FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'system_admin')
    );

-- temporary_classroom_changes RLS
ALTER TABLE temporary_classroom_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their tenant's classroom changes"
    ON temporary_classroom_changes FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "System admins can access all classroom changes"
    ON temporary_classroom_changes FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'system_admin')
    );

-- ================================================================
-- 7. 교실 충돌 검사 함수
-- ================================================================

-- 교실 사용 충돌 검사 함수
CREATE OR REPLACE FUNCTION check_classroom_conflict(
    p_tenant_id UUID,
    p_classroom_id UUID,
    p_day_of_week day_of_week,
    p_start_time TIME,
    p_end_time TIME,
    p_date DATE DEFAULT NULL,
    p_exclude_schedule_id UUID DEFAULT NULL,
    p_exclude_change_id UUID DEFAULT NULL
) RETURNS TABLE (
    conflict_found BOOLEAN,
    conflict_type TEXT,
    conflict_details JSONB
) AS $$
BEGIN
    -- 정규 스케줄 충돌 검사
    IF EXISTS (
        SELECT 1 FROM classroom_usage_view cuv
        WHERE cuv.tenant_id = p_tenant_id
        AND cuv.classroom_id = p_classroom_id
        AND cuv.day_of_week = p_day_of_week
        AND cuv.is_active = true
        AND (
            (p_start_time >= cuv.start_time AND p_start_time < cuv.end_time) OR
            (p_end_time > cuv.start_time AND p_end_time <= cuv.end_time) OR
            (p_start_time <= cuv.start_time AND p_end_time >= cuv.end_time)
        )
        AND (p_date IS NULL OR (
            p_date >= cuv.effective_from AND 
            (cuv.effective_until IS NULL OR p_date <= cuv.effective_until)
        ))
    ) THEN
        RETURN QUERY SELECT 
            true as conflict_found,
            'time_conflict' as conflict_type,
            jsonb_build_object(
                'message', '해당 시간대에 이미 다른 클래스가 교실을 사용 중입니다',
                'classroom_id', p_classroom_id,
                'time_range', p_start_time || ' - ' || p_end_time
            ) as conflict_details;
        RETURN;
    END IF;

    -- 충돌 없음
    RETURN QUERY SELECT 
        false as conflict_found,
        'no_conflict' as conflict_type,
        jsonb_build_object('message', '교실 사용 가능') as conflict_details;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '클래스-교실 연관관계 테이블 생성 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 구조:';
    RAISE NOTICE '- classes.default_classroom_id 컬럼 추가';
    RAISE NOTICE '- time_slots 테이블 (시간대 관리)';
    RAISE NOTICE '- class_classroom_schedules 테이블 (요일별 교실 스케줄)';
    RAISE NOTICE '- temporary_classroom_changes 테이블 (임시 교실 변경)';
    RAISE NOTICE '- classroom_usage_view 뷰 (통합 교실 사용 현황)';
    RAISE NOTICE '- check_classroom_conflict() 함수 (충돌 검사)';
    RAISE NOTICE '- 완전한 RLS 정책 및 인덱스';
    RAISE NOTICE '========================================';
END $$;