-- 쿼리 3: 현재 적용된 모든 RLS 정책 확인
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;