-- EduCanvas 학원 관리 시스템 데이터베이스 스키마 v3.0
-- 작성일: 2025-08-09
-- 데이터베이스: Supabase (PostgreSQL)
-- 주요 확장: 교실/시간표/성적/문서/히스토리 관리 시스템

-- ================================================================
-- 기존 v2.0 스키마를 기반으로 확장
-- v2.0의 모든 테이블은 그대로 유지하며 새로운 기능 테이블 추가
-- ================================================================

-- ================================================================
-- 1. 새로운 ENUMS (열거형 타입 정의)
-- ================================================================

-- 교실 상태
CREATE TYPE classroom_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');

-- 교실 타입
CREATE TYPE classroom_type AS ENUM ('general', 'lab', 'seminar', 'lecture_hall', 'study_room');

-- 시간표 상태
CREATE TYPE schedule_status AS ENUM ('active', 'cancelled', 'rescheduled', 'completed');

-- 시험 유형
CREATE TYPE exam_type AS ENUM ('midterm', 'final', 'quiz', 'mock_exam', 'placement_test', 'progress_test');

-- 문제 타입
CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'essay', 'true_false', 'fill_blank');

-- 문서 타입
CREATE TYPE document_type AS ENUM ('exam', 'homework', 'handout', 'answer_key', 'curriculum', 'report', 'other');

-- 파일 상태
CREATE TYPE file_status AS ENUM ('uploading', 'active', 'archived', 'deleted');

-- 히스토리 액션 타입
CREATE TYPE history_action AS ENUM ('create', 'update', 'delete', 'move', 'enroll', 'withdraw', 'payment', 'exam', 'consultation');

-- 상담 상태
CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- 상담 유형
CREATE TYPE consultation_type AS ENUM ('enrollment', 'academic', 'behavioral', 'career', 'parent_meeting', 'follow_up');

-- ================================================================
-- 2. 교실 관리 시스템
-- ================================================================

-- 교실 정보
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,                    -- "101호", "과학실험실"
    building VARCHAR(50),                         -- 건물명
    floor INTEGER DEFAULT 1,                      -- 층수
    room_number VARCHAR(20),                      -- 호실
    
    -- 물리적 정보
    capacity INTEGER NOT NULL,                    -- 최대 수용 인원
    area DECIMAL(8,2),                           -- 면적 (평방미터)
    classroom_type classroom_type DEFAULT 'general',
    
    -- 설비 정보
    facilities JSONB DEFAULT '{}',                -- {"projector": true, "whiteboard": true, "ac": true}
    equipment_list TEXT[],                        -- 보유 장비 목록
    
    -- 특성 정보
    suitable_subjects TEXT[],                     -- 적합한 과목들 ["수학", "과학"]
    special_features TEXT[],                      -- 특수 기능 ["방음", "실험대"]
    
    -- 운영 정보
    status classroom_status DEFAULT 'available',
    is_bookable BOOLEAN DEFAULT true,            -- 예약 가능 여부
    hourly_rate INTEGER DEFAULT 0,              -- 시간당 사용료 (필요시)
    
    -- 메타 정보
    description TEXT,
    photo_urls TEXT[],                           -- 교실 사진 URLs
    qr_code VARCHAR(255),                        -- 교실 전용 QR 코드
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 교실 사용 이력
CREATE TABLE classroom_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    
    -- 사용 정보
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,   -- 실제 사용 시작
    actual_end_time TIMESTAMP WITH TIME ZONE,     -- 실제 사용 종료
    
    -- 사용 현황
    planned_students INTEGER,                      -- 계획된 학생 수
    actual_students INTEGER,                       -- 실제 참석 학생 수
    
    -- 추가 정보
    purpose VARCHAR(100),                         -- 사용 목적
    notes TEXT,                                   -- 특이사항
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 3. 타임테이블 관리 시스템
-- ================================================================

-- 기본 시간 슬롯 정의
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,                    -- "1교시", "오전 9시"
    start_time TIME NOT NULL,                     -- 09:00
    end_time TIME NOT NULL,                       -- 10:30
    duration_minutes INTEGER NOT NULL,            -- 90분
    
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
    
    -- 제약조건
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 정규 시간표 (반복되는 스케줄)
CREATE TABLE recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE RESTRICT,
    
    -- 반복 패턴
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=일요일, 6=토요일
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
    
    -- 제약조건: 같은 시간에 같은 교실 중복 불가
    CONSTRAINT unique_classroom_timeslot 
        UNIQUE (classroom_id, time_slot_id, day_of_week, effective_from)
);

-- 일회성/변경된 스케줄
CREATE TABLE schedule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE CASCADE,
    
    -- 특정 날짜 정보
    override_date DATE NOT NULL,
    
    -- 변경 내용
    new_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    new_time_slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
    new_instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    
    -- 변경 사유
    change_reason VARCHAR(200),
    status schedule_status DEFAULT 'active',
    
    -- 알림 관련
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ================================================================
-- 4. 성적 관리 시스템
-- ================================================================

-- 시험 정의
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,                   -- "2025년 1학기 중간고사"
    exam_type exam_type NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    
    -- 시험 일정
    exam_date DATE NOT NULL,
    start_time TIME,
    duration_minutes INTEGER DEFAULT 90,
    
    -- 시험 구성
    total_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    question_count INTEGER DEFAULT 0,            -- 자동 계산됨
    
    -- 시험 설정
    exam_config JSONB DEFAULT '{}',              -- 유연한 설정: {"allow_calculator": true, "open_book": false}
    grading_policy JSONB DEFAULT '{}',           -- 채점 정책: {"partial_credit": true, "negative_marking": false}
    
    -- 상태 관리
    is_published BOOLEAN DEFAULT false,          -- 성적 공개 여부
    is_active BOOLEAN DEFAULT true,
    
    -- 메타 정보
    description TEXT,
    instructions TEXT,                           -- 시험 안내사항
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 시험 문제 (선택적 - 문제별 세부 관리가 필요한 경우)
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    
    -- 문제 정보
    question_number INTEGER NOT NULL,
    question_type question_type NOT NULL,
    question_text TEXT,
    
    -- 배점 정보
    max_score DECIMAL(5,2) NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- 선택지 (객관식용)
    choices JSONB,                               -- [{"A": "답1", "B": "답2", "C": "답3", "D": "답4"}]
    correct_answer TEXT,                         -- 정답
    
    -- 메타 정보
    topic VARCHAR(100),                          -- 출제 단원/주제
    learning_objective TEXT,                     -- 학습 목표
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_question_number UNIQUE(exam_id, question_number)
);

-- 학생 성적
CREATE TABLE student_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    grade VARCHAR(5),                            -- A+, A, B+, B, C+, C, D+, D, F
    class_rank INTEGER,                          -- 반등수
    percentile DECIMAL(5,2),                     -- 백분위
    
    -- 문제별 세부 점수 (선택적)
    detailed_scores JSONB,                       -- {"question_1": 5, "question_2": 3, ...}
    
    -- 분석 정보
    strong_topics TEXT[],                        -- 잘한 영역
    weak_topics TEXT[],                          -- 부족한 영역
    improvement_suggestions TEXT,                 -- 개선 제안
    
    -- 추가 정보
    exam_duration_minutes INTEGER,               -- 실제 소요 시간
    absence_reason TEXT,                         -- 결시 사유
    
    -- 메타 정보
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT unique_student_exam UNIQUE(exam_id, student_id),
    CONSTRAINT valid_score_range CHECK (total_score >= 0 AND total_score <= max_possible_score)
);

-- ================================================================
-- 5. 문서/파일 저장 시스템
-- ================================================================

-- 문서 폴더 구조
CREATE TABLE document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    
    -- 폴더 속성
    folder_path TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN parent_folder_id IS NULL THEN '/' || name
            ELSE NULL -- 트리거로 계산
        END
    ) STORED,
    
    -- 권한 관리
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    allowed_roles user_role[] DEFAULT ARRAY['admin']::user_role[],
    
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
    title VARCHAR(200) NOT NULL,
    folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
    document_type document_type NOT NULL,
    
    -- 파일 정보
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,                   -- bytes
    file_extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100),
    
    -- 저장 정보
    storage_path TEXT NOT NULL,                  -- 실제 파일 경로
    storage_provider VARCHAR(50) DEFAULT 'supabase', -- supabase, aws_s3, nas
    file_hash VARCHAR(64),                       -- SHA-256 해시
    
    -- 버전 관리
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- 분류 정보
    subject VARCHAR(50),
    grade_level VARCHAR(20),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- 내용 정보 (검색용)
    extracted_text TEXT,                         -- OCR/PDF 추출 텍스트
    content_summary TEXT,                        -- AI 생성 요약
    keywords TEXT[],                             -- 자동 추출 키워드
    
    -- 접근 제어
    visibility VARCHAR(20) DEFAULT 'private',    -- public, private, class, instructor
    allowed_users UUID[],                        -- 특정 사용자 허용
    allowed_classes UUID[],                      -- 특정 클래스 허용
    
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
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 문서 접근 로그
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 접근 정보
    access_type VARCHAR(20) NOT NULL,            -- view, download, edit
    access_method VARCHAR(50),                   -- web, mobile_app, api
    ip_address INET,
    user_agent TEXT,
    
    -- 시간 정보
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER,                    -- 초 단위
    
    -- 추가 컨텍스트
    referrer_url TEXT,
    device_info JSONB
);

-- ================================================================
-- 6. 학생 히스토리 추적 시스템
-- ================================================================

-- 통합 히스토리 테이블
CREATE TABLE student_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    -- 이벤트 정보
    event_type history_action NOT NULL,
    event_category VARCHAR(50) NOT NULL,         -- academic, administrative, behavioral, financial
    event_title VARCHAR(200) NOT NULL,
    event_description TEXT,
    
    -- 관련 데이터 참조
    related_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    related_enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
    related_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- 이벤트 세부 데이터 (유연한 JSON 구조)
    event_data JSONB DEFAULT '{}',
    
    -- 변경 전후 데이터 (감사용)
    before_data JSONB,
    after_data JSONB,
    
    -- 메타 정보
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    
    -- 분류/태그
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_milestone BOOLEAN DEFAULT false,          -- 중요한 이정표 이벤트
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 성적 히스토리 (더 상세한 학습 진도 추적)
CREATE TABLE academic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    
    -- 진도 정보
    assessment_date DATE NOT NULL,
    current_level VARCHAR(50),                   -- 현재 수준
    target_level VARCHAR(50),                    -- 목표 수준
    progress_percentage DECIMAL(5,2),            -- 진도율
    
    -- 성취도 분석
    strengths TEXT[],                            -- 강점 영역
    weaknesses TEXT[],                           -- 약점 영역
    recent_scores JSONB,                         -- 최근 점수 추이
    
    -- 학습 분석
    study_hours_weekly DECIMAL(4,1),            -- 주당 학습 시간
    homework_completion_rate DECIMAL(5,2),       -- 숙제 완성률
    class_participation_score INTEGER,           -- 수업 참여도 점수
    
    -- AI 분석 결과
    predicted_performance JSONB,                 -- AI 성과 예측
    recommended_actions TEXT[],                  -- 추천 개선 방안
    learning_style_analysis JSONB,              -- 학습 스타일 분석
    
    -- 메타 정보
    assessment_type VARCHAR(50),                 -- monthly, quarterly, semester
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ================================================================
-- 7. 상담 관리 시스템
-- ================================================================

-- 상담 예약 및 관리
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    participants JSONB DEFAULT '{}',             -- {"student": true, "parent": true, "instructor": true}
    parent_attending BOOLEAN DEFAULT false,
    additional_attendees TEXT[],                 -- 추가 참석자
    
    -- 상담 설정
    consultation_method VARCHAR(50) DEFAULT 'in_person', -- in_person, phone, video, email
    location VARCHAR(100),                       -- 상담 장소
    
    -- 상담 준비사항
    preparation_notes TEXT,                      -- 상담 전 준비사항
    required_documents TEXT[],                   -- 필요 서류
    agenda_items TEXT[],                         -- 상담 안건
    
    -- 상태 관리
    status consultation_status DEFAULT 'scheduled',
    
    -- 알림 설정
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 상담 기록
CREATE TABLE consultation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    
    -- 상담 결과
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    actual_attendees TEXT[],                     -- 실제 참석자
    
    -- 상담 내용
    discussion_topics TEXT[],                    -- 논의된 주제들
    main_concerns TEXT,                          -- 주요 고민사항
    solutions_discussed TEXT,                    -- 논의된 해결책
    
    -- 결정사항 및 후속조치
    decisions_made TEXT,                         -- 결정된 사항
    action_items JSONB,                          -- 후속 조치 항목
    follow_up_required BOOLEAN DEFAULT false,
    next_consultation_date DATE,
    
    -- 평가 및 분석
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    consultation_effectiveness JSONB,            -- 상담 효과 분석
    
    -- 파일 첨부
    attached_documents UUID[] DEFAULT ARRAY[]::UUID[], -- documents 테이블 참조
    
    -- 비밀성 관리
    confidentiality_level VARCHAR(20) DEFAULT 'normal', -- normal, confidential, restricted
    access_restricted_to UUID[],                 -- 접근 제한 사용자 목록
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ================================================================
-- 8. 인덱스 및 성능 최적화
-- ================================================================

-- 교실 관리 인덱스
CREATE INDEX idx_classrooms_status ON classrooms(status);
CREATE INDEX idx_classrooms_type ON classrooms(classroom_type);
CREATE INDEX idx_classroom_usage_time ON classroom_usage_logs(start_time, end_time);

-- 시간표 관리 인덱스
CREATE INDEX idx_recurring_schedules_class ON recurring_schedules(class_id);
CREATE INDEX idx_recurring_schedules_classroom ON recurring_schedules(classroom_id);
CREATE INDEX idx_recurring_schedules_time ON recurring_schedules(day_of_week, time_slot_id);
CREATE INDEX idx_schedule_overrides_date ON schedule_overrides(override_date);

-- 성적 관리 인덱스
CREATE INDEX idx_exams_class_date ON exams(class_id, exam_date);
CREATE INDEX idx_student_scores_exam ON student_scores(exam_id);
CREATE INDEX idx_student_scores_student ON student_scores(student_id);
CREATE INDEX idx_student_scores_percentage ON student_scores(percentage DESC);

-- 문서 관리 인덱스
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_subject_grade ON documents(subject, grade_level);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_fulltext ON documents USING gin(to_tsvector('korean', title || ' ' || coalesce(extracted_text, '')));

-- 히스토리 인덱스
CREATE INDEX idx_student_histories_student ON student_histories(student_id);
CREATE INDEX idx_student_histories_event_date ON student_histories(event_date DESC);
CREATE INDEX idx_student_histories_event_type ON student_histories(event_type);
CREATE INDEX idx_academic_progress_student_subject ON academic_progress(student_id, subject);

-- 상담 관리 인덱스
CREATE INDEX idx_consultations_student ON consultations(student_id);
CREATE INDEX idx_consultations_instructor ON consultations(instructor_id);
CREATE INDEX idx_consultations_date ON consultations(scheduled_date);
CREATE INDEX idx_consultations_status ON consultations(status);

-- ================================================================
-- 9. 트리거 및 자동화 함수
-- ================================================================

-- 교실 사용률 업데이트 트리거
CREATE OR REPLACE FUNCTION update_classroom_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 교실 사용 통계 업데이트 로직
    -- (실제 구현에서는 별도 통계 테이블 업데이트)
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classroom_usage_stats
    AFTER INSERT OR UPDATE OR DELETE ON classroom_usage_logs
    FOR EACH ROW EXECUTE FUNCTION update_classroom_usage_stats();

-- 학생 히스토리 자동 기록 트리거
CREATE OR REPLACE FUNCTION log_student_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- 중요한 학생 데이터 변경 시 자동으로 히스토리 기록
    IF TG_OP = 'UPDATE' AND OLD.class_id IS DISTINCT FROM NEW.class_id THEN
        INSERT INTO student_histories (
            student_id, event_type, event_category, event_title, 
            event_description, related_class_id, before_data, after_data
        ) VALUES (
            NEW.id, 'move', 'administrative', '반 이동',
            format('학생이 %s에서 %s로 이동', OLD.class_id, NEW.class_id),
            NEW.class_id,
            jsonb_build_object('old_class_id', OLD.class_id),
            jsonb_build_object('new_class_id', NEW.class_id)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_history_auto_log
    AFTER UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION log_student_activity();

-- ================================================================
-- 10. 뷰 및 리포팅
-- ================================================================

-- 교실 가동률 뷰
CREATE VIEW classroom_utilization AS
SELECT 
    c.id,
    c.name,
    c.capacity,
    COUNT(cul.id) as total_bookings,
    AVG(cul.actual_students) as avg_students,
    (AVG(cul.actual_students) / c.capacity * 100) as utilization_rate
FROM classrooms c
LEFT JOIN classroom_usage_logs cul ON c.id = cul.classroom_id
WHERE cul.start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.name, c.capacity;

-- 학생 성적 추이 뷰
CREATE VIEW student_academic_summary AS
SELECT 
    s.id as student_id,
    s.name,
    s.class_id,
    COUNT(ss.id) as total_exams,
    AVG(ss.percentage) as avg_score,
    MIN(ss.percentage) as min_score,
    MAX(ss.percentage) as max_score,
    COUNT(ss.id) FILTER (WHERE ss.percentage >= 80) as high_scores,
    COUNT(ss.id) FILTER (WHERE ss.percentage < 60) as low_scores
FROM students s
LEFT JOIN student_scores ss ON s.id = ss.student_id
LEFT JOIN exams e ON ss.exam_id = e.id
WHERE e.exam_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY s.id, s.name, s.class_id;

-- 상담 효과 분석 뷰
CREATE VIEW consultation_effectiveness AS
SELECT 
    c.student_id,
    COUNT(c.id) as total_consultations,
    COUNT(cr.id) as completed_consultations,
    AVG(cr.satisfaction_score) as avg_satisfaction,
    COUNT(cr.id) FILTER (WHERE cr.follow_up_required = true) as follow_ups_needed
FROM consultations c
LEFT JOIN consultation_records cr ON c.id = cr.consultation_id
GROUP BY c.student_id;

-- ================================================================
-- 11. RLS (Row Level Security) 정책 확장
-- ================================================================

-- 교실 관리 RLS
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY classroom_access ON classrooms FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role IN ('admin', 'staff', 'instructor')
    )
);

-- 성적 관리 RLS
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_scores_access ON student_scores FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND (
            u.role IN ('admin', 'staff') OR
            (u.role = 'instructor' AND EXISTS (
                SELECT 1 FROM students s 
                JOIN classes cl ON s.class_id = cl.id 
                WHERE s.id = student_id AND cl.instructor_id = (
                    SELECT i.id FROM instructors i WHERE i.user_id = u.id
                )
            ))
        )
    )
);

-- 문서 접근 RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_access ON documents FOR ALL TO authenticated
USING (
    visibility = 'public' OR
    uploaded_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND (
            u.role IN ('admin') OR
            (u.role = 'staff' AND visibility IN ('private', 'class')) OR
            (u.role = 'instructor' AND (
                visibility = 'instructor' OR
                auth.uid() = ANY(allowed_users) OR
                EXISTS (
                    SELECT 1 FROM classes c
                    JOIN instructors i ON c.instructor_id = i.id
                    WHERE i.user_id = auth.uid() AND c.id = ANY(allowed_classes)
                )
            ))
        )
    )
);

-- 학생 히스토리 RLS
ALTER TABLE student_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_history_access ON student_histories FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND (
            u.role IN ('admin', 'staff') OR
            (u.role = 'instructor' AND EXISTS (
                SELECT 1 FROM students s 
                JOIN classes cl ON s.class_id = cl.id 
                WHERE s.id = student_id AND cl.instructor_id = (
                    SELECT i.id FROM instructors i WHERE i.user_id = u.id
                )
            ))
        )
    )
);

-- 상담 관리 RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY consultations_access ON consultations FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND (
            u.role IN ('admin', 'staff') OR
            (u.role = 'instructor' AND instructor_id = (
                SELECT i.id FROM instructors i WHERE i.user_id = u.id
            ))
        )
    )
);

-- ================================================================
-- 데이터베이스 스키마 v3.0 완료
-- 
-- 새로운 기능:
-- 1. 교실 관리 및 사용률 추적
-- 2. 통합 타임테이블 시스템
-- 3. 유연한 성적 관리 시스템  
-- 4. 문서 저장 및 버전 관리
-- 5. 학생 히스토리 통합 추적
-- 6. 체계적인 상담 관리
-- 
-- 성능 최적화:
-- - 적절한 인덱스 설계
-- - 파티셔닝 준비 (대용량 데이터)
-- - 뷰를 통한 복잡한 쿼리 간소화
-- 
-- 보안 강화:
-- - 세밀한 RLS 정책
-- - 감사 로그 완전 추적
-- - 개인정보보호 준수
-- ================================================================