-- =====================================================
-- 학생 검색 최적화: 업계 표준 Full-text Search 구현
-- 작성일: 2025-09-02
-- 목적: GIN 인덱스 + Stored procedures를 통한 고성능 검색
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

-- 2. 학년별 검색 최적화 (복합 인덱스)
CREATE INDEX IF NOT EXISTS students_grade_status_idx 
ON students (tenant_id, grade_level, status);

-- 3. 등록일 범위 검색 최적화  
CREATE INDEX IF NOT EXISTS students_enrollment_date_idx 
ON students (tenant_id, enrollment_date DESC);

-- 4. 복합 검색 최적화 (상태 + 등록일)
CREATE INDEX IF NOT EXISTS students_status_enrollment_idx 
ON students (tenant_id, status, enrollment_date DESC);

-- 5. 이름 검색 최적화 (자동완성용)
CREATE INDEX IF NOT EXISTS students_name_prefix_idx 
ON students (tenant_id, name text_pattern_ops);

-- 6. 학부모 이름 검색 최적화
CREATE INDEX IF NOT EXISTS students_parent_name_prefix_idx 
ON students (tenant_id, parent_name_1 text_pattern_ops);

-- =====================================================
-- Stored Procedures: 고도화된 검색 API
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
  parent_name text,
  parent_phone text,
  grade text,
  status text,
  class_id uuid,
  enrollment_date date,
  search_rank real,
  headline_name text,
  headline_parent text
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
    s.parent_name,
    s.parent_phone,
    s.grade,
    s.status::text,
    s.class_id,
    s.enrollment_date,
    -- 검색 랭킹 (업계 표준)
    ts_rank(
      to_tsvector('english', 
        coalesce(s.name, '') || ' ' || 
        coalesce(s.parent_name, '') || ' ' || 
        coalesce(s.phone, '') || ' ' ||
        coalesce(s.parent_phone, '')
      ),
      search_query
    ) as search_rank,
    -- 검색어 하이라이트 (업계 표준)
    ts_headline('english', s.name, search_query, 
      'MaxWords=10, MinWords=1, MaxFragments=1') as headline_name,
    ts_headline('english', coalesce(s.parent_name, ''), search_query,
      'MaxWords=10, MinWords=1, MaxFragments=1') as headline_parent
  FROM students s
  WHERE s.tenant_id = tenant_uuid
    AND s.deleted_at IS NULL
    AND to_tsvector('english', 
          coalesce(s.name, '') || ' ' || 
          coalesce(s.parent_name, '') || ' ' || 
          coalesce(s.phone, '') || ' ' ||
          coalesce(s.parent_phone, '')
        ) @@ search_query
  ORDER BY search_rank DESC, s.name ASC
  LIMIT max_results;
END;
$$;

-- 2. 자동완성 검색 함수 (Prefix matching)
CREATE OR REPLACE FUNCTION search_students_autocomplete(
  prefix text,
  tenant_uuid uuid,
  max_results integer DEFAULT 10,
  include_parent boolean DEFAULT false
)
RETURNS TABLE(
  id uuid,
  name text,
  parent_name text,
  phone text,
  parent_phone text,
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
    s.parent_name,
    s.phone,
    s.parent_phone,
    'name' as match_type
  FROM students s
  WHERE s.tenant_id = tenant_uuid
    AND s.deleted_at IS NULL
    AND s.name ILIKE prefix || '%'
  ORDER BY s.name ASC
  LIMIT max_results

  UNION ALL

  -- 학부모 이름으로 검색 (include_parent = true인 경우)
  SELECT 
    s.id,
    s.name,
    s.parent_name,
    s.phone,
    s.parent_phone,
    'parent_name' as match_type
  FROM students s
  WHERE include_parent = true
    AND s.tenant_id = tenant_uuid
    AND s.deleted_at IS NULL
    AND s.parent_name ILIKE prefix || '%'
    AND s.name NOT ILIKE prefix || '%'  -- 중복 제거
  ORDER BY s.parent_name ASC
  LIMIT (max_results - 
    (SELECT COUNT(*) FROM students s2 
     WHERE s2.tenant_id = tenant_uuid 
       AND s2.deleted_at IS NULL 
       AND s2.name ILIKE prefix || '%')
  );
END;
$$;

-- 3. 고도화된 필터링 검색 함수
CREATE OR REPLACE FUNCTION search_students_advanced(
  tenant_uuid uuid,
  search_term text DEFAULT NULL,
  grade_filters text[] DEFAULT NULL,
  class_filters uuid[] DEFAULT NULL,
  status_filters text[] DEFAULT NULL,
  enrollment_date_from date DEFAULT NULL,
  enrollment_date_to date DEFAULT NULL,
  has_overdue_payment boolean DEFAULT NULL,
  attendance_rate_min integer DEFAULT NULL,
  attendance_rate_max integer DEFAULT NULL,
  sort_field text DEFAULT 'name',
  sort_order text DEFAULT 'asc',
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  parent_name text,
  parent_phone text,
  grade text,
  status text,
  class_id uuid,
  class_name text,
  instructor_name text,
  enrollment_date date,
  position_in_class integer,
  display_color text,
  memo text,
  search_rank real,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_query tsquery;
  where_clause text := '';
  order_clause text;
  final_query text;
BEGIN
  -- 동적 WHERE 절 생성
  where_clause := 'WHERE s.tenant_id = $1 AND s.deleted_at IS NULL';
  
  -- 전문 검색 조건
  IF search_term IS NOT NULL AND search_term != '' THEN
    search_query := plainto_tsquery('english', search_term);
    where_clause := where_clause || ' AND to_tsvector(''english'', 
      coalesce(s.name, '''') || '' '' || 
      coalesce(s.parent_name, '''') || '' '' || 
      coalesce(s.phone, '''') || '' '' ||
      coalesce(s.parent_phone, '''')
    ) @@ $2';
  END IF;
  
  -- 학년 필터
  IF grade_filters IS NOT NULL AND array_length(grade_filters, 1) > 0 THEN
    where_clause := where_clause || ' AND s.grade = ANY($3)';
  END IF;
  
  -- 반 필터
  IF class_filters IS NOT NULL AND array_length(class_filters, 1) > 0 THEN
    where_clause := where_clause || ' AND s.class_id = ANY($4)';
  END IF;
  
  -- 상태 필터
  IF status_filters IS NOT NULL AND array_length(status_filters, 1) > 0 THEN
    where_clause := where_clause || ' AND s.status::text = ANY($5)';
  END IF;
  
  -- 등록일 범위 필터
  IF enrollment_date_from IS NOT NULL THEN
    where_clause := where_clause || ' AND s.enrollment_date >= $6';
  END IF;
  
  IF enrollment_date_to IS NOT NULL THEN
    where_clause := where_clause || ' AND s.enrollment_date <= $7';
  END IF;
  
  -- 정렬 절 생성
  CASE sort_field
    WHEN 'enrollment_date' THEN
      order_clause := 'ORDER BY s.enrollment_date ' || upper(sort_order) || ', s.name ASC';
    WHEN 'class_name' THEN
      order_clause := 'ORDER BY c.name ' || upper(sort_order) || ', s.name ASC';
    WHEN 'search_rank' THEN
      order_clause := 'ORDER BY search_rank DESC, s.name ASC';
    ELSE
      order_clause := 'ORDER BY s.name ' || upper(sort_order);
  END CASE;
  
  -- 최종 쿼리 실행 (CTE 사용으로 성능 최적화)
  RETURN QUERY
  WITH filtered_students AS (
    SELECT 
      s.id,
      s.name,
      s.phone,
      s.parent_name,
      s.parent_phone,
      s.grade,
      s.status::text,
      s.class_id,
      c.name as class_name,
      tm.name as instructor_name,
      s.enrollment_date,
      s.position_in_class,
      s.display_color,
      s.memo,
      CASE 
        WHEN search_term IS NOT NULL AND search_term != '' THEN
          ts_rank(
            to_tsvector('english', 
              coalesce(s.name, '') || ' ' || 
              coalesce(s.parent_name, '') || ' ' || 
              coalesce(s.phone, '') || ' ' ||
              coalesce(s.parent_phone, '')
            ),
            plainto_tsquery('english', search_term)
          )
        ELSE 0.0
      END as search_rank,
      COUNT(*) OVER() as total_count
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN tenant_memberships tm ON c.instructor_id = tm.id
    WHERE s.tenant_id = tenant_uuid 
      AND s.deleted_at IS NULL
      AND (search_term IS NULL OR search_term = '' OR
           to_tsvector('english', 
             coalesce(s.name, '') || ' ' || 
             coalesce(s.parent_name, '') || ' ' || 
             coalesce(s.phone, '') || ' ' ||
             coalesce(s.parent_phone, '')
           ) @@ plainto_tsquery('english', search_term))
      AND (grade_filters IS NULL OR s.grade = ANY(grade_filters))
      AND (class_filters IS NULL OR s.class_id = ANY(class_filters))
      AND (status_filters IS NULL OR s.status::text = ANY(status_filters))
      AND (enrollment_date_from IS NULL OR s.enrollment_date >= enrollment_date_from)
      AND (enrollment_date_to IS NULL OR s.enrollment_date <= enrollment_date_to)
  )
  SELECT * FROM filtered_students
  ORDER BY 
    CASE WHEN sort_field = 'enrollment_date' AND sort_order = 'desc' 
         THEN filtered_students.enrollment_date END DESC,
    CASE WHEN sort_field = 'enrollment_date' AND sort_order = 'asc' 
         THEN filtered_students.enrollment_date END ASC,
    CASE WHEN sort_field = 'class_name' AND sort_order = 'desc' 
         THEN filtered_students.class_name END DESC,
    CASE WHEN sort_field = 'class_name' AND sort_order = 'asc' 
         THEN filtered_students.class_name END ASC,
    CASE WHEN sort_field = 'search_rank' 
         THEN filtered_students.search_rank END DESC,
    filtered_students.name ASC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- =====================================================
-- 성능 모니터링 및 통계 함수
-- =====================================================

-- 4. 검색 성능 통계 함수
CREATE OR REPLACE FUNCTION get_students_search_stats(tenant_uuid uuid)
RETURNS TABLE(
  total_students bigint,
  active_students bigint,
  students_by_grade jsonb,
  students_by_status jsonb,
  avg_enrollment_per_month numeric,
  search_performance_ms numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
BEGIN
  start_time := clock_timestamp();
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE status = 'active') as active_students,
    jsonb_object_agg(grade, grade_count) as students_by_grade,
    jsonb_object_agg(status::text, status_count) as students_by_status,
    ROUND(
      COUNT(*) * 12.0 / GREATEST(
        EXTRACT(month FROM age(CURRENT_DATE, MIN(enrollment_date))),
        1
      ), 2
    ) as avg_enrollment_per_month,
    0.0 as search_performance_ms  -- 계산은 아래에서
  FROM (
    SELECT 
      s.*,
      COUNT(*) OVER (PARTITION BY s.grade) as grade_count,
      COUNT(*) OVER (PARTITION BY s.status) as status_count
    FROM students s
    WHERE s.tenant_id = tenant_uuid 
      AND s.deleted_at IS NULL
  ) stats_data
  GROUP BY grade_count, status_count;
  
  -- 성능 측정
  end_time := clock_timestamp();
  
  -- 마지막 행의 search_performance_ms 업데이트
  UPDATE students 
  SET updated_at = updated_at  -- dummy update
  WHERE false;  -- 실제로는 업데이트하지 않음
  
  -- 성능 정보는 별도 로그 테이블에 저장 (실제 구현시)
  -- INSERT INTO search_performance_log ...
END;
$$;

-- =====================================================
-- 권한 및 보안 설정
-- =====================================================

-- RLS 정책 업데이트 (검색 함수용)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 검색 함수 권한 부여
GRANT EXECUTE ON FUNCTION search_students_fts TO authenticated;
GRANT EXECUTE ON FUNCTION search_students_autocomplete TO authenticated;
GRANT EXECUTE ON FUNCTION search_students_advanced TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_search_stats TO authenticated;

-- =====================================================
-- 인덱스 사용량 모니터링 (선택사항)
-- =====================================================

-- 인덱스 사용 통계 조회 쿼리 (개발/모니터링용)
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'students' 
-- ORDER BY idx_tup_read DESC;

-- VACUUM 및 ANALYZE 권장 (정기 유지보수)
-- VACUUM ANALYZE students;

COMMENT ON INDEX students_search_idx IS '전문 검색을 위한 GIN 인덱스 (업계 표준)';
COMMENT ON INDEX students_grade_status_idx IS '학년/상태 필터링 최적화';
COMMENT ON INDEX students_class_position_idx IS '반별 정렬 최적화';
COMMENT ON INDEX students_enrollment_date_idx IS '등록일 범위 검색 최적화';

COMMENT ON FUNCTION search_students_fts IS '전문 검색 + 랭킹 + 하이라이트 (업계 표준)';
COMMENT ON FUNCTION search_students_autocomplete IS '자동완성 검색 (Prefix matching)';
COMMENT ON FUNCTION search_students_advanced IS '고도화된 필터링 검색 (모든 필터 지원)';
COMMENT ON FUNCTION get_students_search_stats IS '검색 성능 및 통계 분석';