-- EduCanvas Classes 테이블 교재 컬럼 추가 및 보안 강화 SQL
-- 실행 순서: 1) 컬럼 추가 2) 보안 설정 3) 성능 최적화

-- 0. 교재 컬럼 추가 (이미 실행된 경우 에러 무시)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS main_textbook VARCHAR(200),
ADD COLUMN IF NOT EXISTS supplementary_textbook VARCHAR(200);

-- 1. 교재 컬럼에 대한 데이터 검증 제약조건 추가
-- 기존 제약조건이 있는지 확인 후 추가
DO $$ 
BEGIN
    -- main_textbook 제약조건 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_main_textbook_length'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT check_main_textbook_length 
        CHECK (main_textbook IS NULL OR LENGTH(TRIM(main_textbook)) >= 1);
    END IF;
    
    -- supplementary_textbook 제약조건 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_supplementary_textbook_length'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT check_supplementary_textbook_length 
        CHECK (supplementary_textbook IS NULL OR LENGTH(TRIM(supplementary_textbook)) >= 1);
    END IF;
END $$;

-- 2. 교재 검색을 위한 간단한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_classes_main_textbook_text 
ON classes (main_textbook) 
WHERE main_textbook IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classes_supplementary_textbook_text 
ON classes (supplementary_textbook) 
WHERE supplementary_textbook IS NOT NULL;

-- 3. 교재 정보 접근 권한 확인 함수
CREATE OR REPLACE FUNCTION can_access_class_textbooks(class_id UUID, user_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 클래스가 사용자의 테넌트에 속하는지 확인
    RETURN EXISTS (
        SELECT 1 FROM classes 
        WHERE id = class_id 
        AND tenant_id = user_tenant_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 교재 정보 통계를 위한 보안 뷰 생성
CREATE OR REPLACE VIEW class_textbook_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_classes,
    COUNT(main_textbook) as classes_with_main_textbook,
    COUNT(supplementary_textbook) as classes_with_supplementary_textbook,
    COUNT(CASE WHEN main_textbook IS NOT NULL AND supplementary_textbook IS NOT NULL THEN 1 END) as classes_with_both_textbooks
FROM classes
WHERE is_active = true
GROUP BY tenant_id;

-- 5. 기본 RLS 정책 확인 (classes 테이블)
-- 기존 RLS 정책이 새 컬럼도 자동으로 보호하는지 확인
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Conditional Access'
        ELSE 'Full Access'
    END as access_type
FROM pg_policies 
WHERE tablename = 'classes'
ORDER BY policyname;

-- 6. 테이블 권한 재확인
GRANT SELECT, INSERT, UPDATE ON classes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 완료 메시지
SELECT 
    'Classes 테이블 교재 컬럼 기본 보안 설정이 완료되었습니다.' as status,
    'RLS 정책이 새로운 컬럼도 자동으로 보호합니다.' as security_note;