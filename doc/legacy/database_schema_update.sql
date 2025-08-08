-- 강사 관리 시스템을 위한 데이터베이스 스키마 업데이트
-- 실행 전에 Supabase Dashboard에서 현재 테이블 구조를 확인하세요

-- 1. instructors 테이블에 누락된 컬럼 추가
-- (이미 존재하는 컬럼이 있다면 해당 줄은 주석 처리하거나 제거하세요)

ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS salary INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS certification TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);

-- 2. instructors 테이블 구조 확인
-- 다음 쿼리로 현재 테이블 구조를 확인할 수 있습니다:
/*
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'instructors'
ORDER BY 
    ordinal_position;
*/

-- 3. 완성된 instructors 테이블 구조 (참고용)
/*
CREATE TABLE IF NOT EXISTS instructors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  subject_specialty TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  salary INTEGER,
  education TEXT,
  experience TEXT,
  certification TEXT,
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_instructors_status ON instructors(status);
CREATE INDEX IF NOT EXISTS idx_instructors_subject ON instructors(subject_specialty);
CREATE INDEX IF NOT EXISTS idx_instructors_hire_date ON instructors(hire_date);

-- 5. 급여 관리를 위한 새 테이블 생성 (향후 확장용)
CREATE TABLE IF NOT EXISTS instructor_salaries (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT REFERENCES instructors(id) ON DELETE CASCADE,
  salary_type VARCHAR(20) NOT NULL, -- 'monthly', 'hourly', 'per_class'
  base_amount INTEGER NOT NULL,
  bonus_amount INTEGER DEFAULT 0,
  deduction_amount INTEGER DEFAULT 0,
  payment_date DATE,
  payment_period_start DATE,
  payment_period_end DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_salaries_instructor ON instructor_salaries(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_salaries_payment_date ON instructor_salaries(payment_date);

-- 6. 강사 자격증 관리를 위한 테이블 (향후 확장용)
CREATE TABLE IF NOT EXISTS instructor_certifications (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT REFERENCES instructors(id) ON DELETE CASCADE,
  certification_name VARCHAR(200) NOT NULL,
  issuing_authority VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  certification_number VARCHAR(100),
  file_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_certifications_instructor ON instructor_certifications(instructor_id);

-- 7. 강사 경력 관리를 위한 테이블 (향후 확장용)
CREATE TABLE IF NOT EXISTS instructor_experiences (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT REFERENCES instructors(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  position VARCHAR(100),
  start_date DATE,
  end_date DATE,
  description TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_experiences_instructor ON instructor_experiences(instructor_id);

-- 8. RLS (Row Level Security) 정책 설정 (보안 강화)
-- 실제 운영 환경에서는 적절한 RLS 정책을 설정해야 합니다
/*
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- 예시 정책 (실제 환경에 맞게 조정 필요)
CREATE POLICY "Enable read access for authenticated users" ON instructors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON instructors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON instructors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON instructors
  FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 9. 트리거 설정 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- instructors 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_instructors_updated_at ON instructors;
CREATE TRIGGER update_instructors_updated_at
    BEFORE UPDATE ON instructors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 관련 테이블들에도 동일한 트리거 적용
DROP TRIGGER IF EXISTS update_instructor_salaries_updated_at ON instructor_salaries;
CREATE TRIGGER update_instructor_salaries_updated_at
    BEFORE UPDATE ON instructor_salaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instructor_certifications_updated_at ON instructor_certifications;
CREATE TRIGGER update_instructor_certifications_updated_at
    BEFORE UPDATE ON instructor_certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instructor_experiences_updated_at ON instructor_experiences;
CREATE TRIGGER update_instructor_experiences_updated_at
    BEFORE UPDATE ON instructor_experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. 샘플 데이터 삽입 (테스트용)
/*
INSERT INTO instructors (name, phone, email, subject_specialty, hire_date, salary, education, experience, certification, memo) VALUES 
('김수학', '010-1234-5678', 'kim.math@academy.com', '수학', '2024-01-15', 3000000, '서울대학교 수학과 졸업', '고등학교 수학교사 8년', '중등학교 정교사 2급 (수학)', '수학 특기자 전담 강사'),
('이영어', '010-2345-6789', 'lee.english@academy.com', '영어', '2024-02-01', 2800000, '연세대학교 영어영문학과 졸업', '영어학원 강사 5년', 'TESOL 자격증', '토익/토플 전문 강사'),
('박과학', '010-3456-7890', 'park.science@academy.com', '과학', '2024-03-01', 3200000, '카이스트 화학과 박사', '대학교 연구원 3년', '화학공학기사', '입시 화학 전문');
*/