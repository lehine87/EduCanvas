-- =====================================================
-- 학생 검색 최적화: 업계 표준 Full-text Search 구현 (단순화 버전)
-- 작성일: 2025-09-02
-- 목적: 실제 스키마에 맞춘 GIN 인덱스 + Stored procedures 구현
-- =====================================================

-- 1. GIN 인덱스 생성 (전문 검색용)
-- 업계 표준: to_tsvector + GIN index 조합
CREATE INDEX IF NOT EXISTS students_search_idx 
ON students 
USING gin(
  to_tsvector(
    'english', 
    coalesce(name, '') || ' ' || 
    coalesce(parent_name_1, '') || ' ' || 
    coalesce(parent_name_2, '') || ' ' || 
    coalesce(phone, '') || ' ' ||
    coalesce(parent_phone_1, '') || ' ' ||
    coalesce(parent_phone_2, '')
  )
);

-- 2. 학년별 검색 최적화
CREATE INDEX IF NOT EXISTS students_grade_status_idx 
ON students (tenant_id, grade_level, status);

-- 3. 등록일 범위 검색 최적화  
CREATE INDEX IF NOT EXISTS students_enrollment_date_idx 
ON students (tenant_id, enrollment_date DESC);

-- 4. 이름 검색 최적화 (자동완성용)
CREATE INDEX IF NOT EXISTS students_name_prefix_idx 
ON students (tenant_id, name text_pattern_ops);

-- =====================================================
-- Stored Procedures: 간단한 검색 API
-- =====================================================

-- 1. 전문 검색 함수 (Ranking 포함)
CREATE OR REPLACE FUNCTION search_students_fts(
  search_term text,
  tenant_uuid uuid,
  max_results integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  parent_name_1 text,
  parent_phone_1 text,
  grade_level text,
  status text,
  search_rank real
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- 검색어를 tsquery로 변환 (안전한 방식)
  search_query := plainto_tsquery('english', search_term);
  
  -- 검색 결과가 없는 경우 조기 반환
  IF search_query IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.phone,
    s.parent_name_1,
    s.parent_phone_1,
    s.grade_level,
    s.status::text,
    -- 검색 랭킹 (업계 표준)
    ts_rank(
      to_tsvector('english', 
        coalesce(s.name, '') || ' ' || 
        coalesce(s.parent_name_1, '') || ' ' || 
        coalesce(s.parent_name_2, '') || ' ' || 
        coalesce(s.phone, '') || ' ' ||
        coalesce(s.parent_phone_1, '') || ' ' ||
        coalesce(s.parent_phone_2, '')
      ),
      search_query
    ) as search_rank
  FROM students s
  WHERE s.tenant_id = tenant_uuid
    AND to_tsvector('english', 
          coalesce(s.name, '') || ' ' || 
          coalesce(s.parent_name_1, '') || ' ' || 
          coalesce(s.parent_name_2, '') || ' ' || 
          coalesce(s.phone, '') || ' ' ||
          coalesce(s.parent_phone_1, '') || ' ' ||
          coalesce(s.parent_phone_2, '')
        ) @@ search_query
  ORDER BY search_rank DESC, s.name ASC
  LIMIT max_results;
END;
$$;

-- 2. 자동완성 검색 함수 (Prefix matching)
CREATE OR REPLACE FUNCTION search_students_autocomplete(
  prefix text,
  tenant_uuid uuid,
  max_results integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  parent_name_1 text,
  phone text,
  match_type text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  -- 이름으로 검색 (우선순위 1)
  SELECT 
    s.id,
    s.name,
    s.parent_name_1,
    s.phone,
    'name'::text as match_type
  FROM students s
  WHERE s.tenant_id = tenant_uuid
    AND s.name ILIKE prefix || '%'
  ORDER BY s.name ASC
  LIMIT max_results;
END;
$$;

-- =====================================================
-- 권한 및 보안 설정
-- =====================================================

-- 검색 함수 권한 부여
GRANT EXECUTE ON FUNCTION search_students_fts TO authenticated;
GRANT EXECUTE ON FUNCTION search_students_autocomplete TO authenticated;

-- 주석 추가
COMMENT ON INDEX students_search_idx IS '전문 검색을 위한 GIN 인덱스 (업계 표준)';
COMMENT ON INDEX students_grade_status_idx IS '학년/상태 필터링 최적화';
COMMENT ON INDEX students_enrollment_date_idx IS '등록일 범위 검색 최적화';
COMMENT ON INDEX students_name_prefix_idx IS '이름 자동완성 최적화';

COMMENT ON FUNCTION search_students_fts IS '전문 검색 + 랭킹 (업계 표준)';
COMMENT ON FUNCTION search_students_autocomplete IS '자동완성 검색 (Prefix matching)';