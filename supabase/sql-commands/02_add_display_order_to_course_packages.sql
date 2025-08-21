-- course_packages 테이블에 display_order 컬럼 추가
ALTER TABLE course_packages 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0 NOT NULL;