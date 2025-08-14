-- RLS 정책 현황 확인 쿼리 (하나씩 실행하세요)

-- 쿼리 1: 현재 존재하는 모든 테이블 목록
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;