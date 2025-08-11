-- EduCanvas 멀티테넌트 RLS 정책 설정
-- Run this script AFTER schema_setup.sql in Supabase SQL Editor

-- ================================================================
-- 1. RLS 활성화
-- ================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_sessions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 2. 테넌트 관리 함수들
-- ================================================================

-- 현재 사용자의 테넌트 ID 가져오기
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tm.tenant_id 
     FROM tenant_memberships tm 
     WHERE tm.user_id = auth.uid() 
       AND tm.status = 'active'
     LIMIT 1),
    NULL::UUID
  );
$$;

-- 사용자의 테넌트 역할 확인
CREATE OR REPLACE FUNCTION auth.user_has_role(role_name text)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM tenant_memberships tm
    JOIN tenant_roles tr ON tr.id = tm.role_id
    WHERE tm.user_id = auth.uid()
      AND tm.tenant_id = auth.user_tenant_id()
      AND tr.name = role_name
      AND tm.status = 'active'
  );
$$;

-- 사용자의 권한 확인 (상세)
CREATE OR REPLACE FUNCTION auth.user_can_access_tenant(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM tenant_memberships tm
    WHERE tm.user_id = auth.uid()
      AND tm.tenant_id = target_tenant_id
      AND tm.status = 'active'
  );
$$;

-- ================================================================
-- 3. 테넌트 RLS 정책
-- ================================================================

-- 테넌트 테이블: 사용자는 자신이 속한 테넌트만 접근 가능
CREATE POLICY "Users can access their own tenants"
ON tenants FOR ALL
USING (auth.user_can_access_tenant(id));

-- 테넌트 역할: 테넌트 멤버만 접근 가능
CREATE POLICY "Users can access roles in their tenant"
ON tenant_roles FOR ALL
USING (tenant_id = auth.user_tenant_id());

-- 테넌트 멤버십: 각 사용자는 자신의 멤버십 정보만 볼 수 있음
CREATE POLICY "Users can see their own memberships"
ON tenant_memberships FOR SELECT
USING (user_id = auth.uid());

-- 테넌트 멤버십: 관리자는 같은 테넌트의 모든 멤버십을 관리할 수 있음
CREATE POLICY "Admins can manage tenant memberships"
ON tenant_memberships FOR ALL
USING (
  tenant_id = auth.user_tenant_id() AND 
  auth.user_has_role('admin')
);

-- ================================================================
-- 4. 사용자 프로필 RLS 정책
-- ================================================================

-- 사용자 프로필: 자신의 프로필은 항상 접근 가능
CREATE POLICY "Users can access their own profile"
ON user_profiles FOR ALL
USING (id = auth.uid());

-- 사용자 프로필: 같은 테넌트 멤버의 프로필 조회 가능
CREATE POLICY "Users can view tenant member profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenant_memberships tm1, tenant_memberships tm2
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = user_profiles.id
      AND tm1.tenant_id = tm2.tenant_id
      AND tm1.status = 'active'
      AND tm2.status = 'active'
  )
);

-- ================================================================
-- 5. 학생 관리 RLS 정책
-- ================================================================

-- 학생: 테넌트별 격리
CREATE POLICY "Users can only access students in their tenant"
ON students FOR ALL
USING (tenant_id = auth.user_tenant_id());

-- ================================================================
-- 6. 클래스 관리 RLS 정책
-- ================================================================

-- 클래스: 테넌트별 격리
CREATE POLICY "Users can only access classes in their tenant"
ON classes FOR ALL
USING (tenant_id = auth.user_tenant_id());

-- 강사는 자신의 클래스에 대한 추가 권한
CREATE POLICY "Instructors have full access to their classes"
ON classes FOR ALL
USING (
  tenant_id = auth.user_tenant_id() AND
  (
    auth.user_has_role('admin') OR
    auth.user_has_role('instructor') OR
    instructor_id = auth.uid()
  )
);

-- ================================================================
-- 7. 수강권 및 등록 RLS 정책
-- ================================================================

-- 수강권 패키지: 테넌트별 격리
CREATE POLICY "Users can only access packages in their tenant"
ON course_packages FOR ALL
USING (tenant_id = auth.user_tenant_id());

-- 수강 등록: 테넌트별 격리
CREATE POLICY "Users can only access enrollments in their tenant"
ON student_enrollments FOR ALL
USING (tenant_id = auth.user_tenant_id());

-- ================================================================
-- 8. 동영상 강의 시스템 RLS 정책
-- ================================================================

-- 동영상: 테넌트별 격리
CREATE POLICY "Users can only access videos in their tenant"
ON videos FOR ALL
USING (tenant_id = auth.user_tenant_id());

-- 동영상: 강사는 자신의 동영상에 대한 모든 권한
CREATE POLICY "Instructors can manage their own videos"
ON videos FOR ALL
USING (
  tenant_id = auth.user_tenant_id() AND
  (
    auth.user_has_role('admin') OR
    instructor_id = auth.uid()
  )
);

-- 동영상: 발행된 동영상은 학생도 조회 가능
CREATE POLICY "Students can view published videos"
ON videos FOR SELECT
USING (
  tenant_id = auth.user_tenant_id() AND
  status = 'published' AND
  (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM student_enrollments se
      WHERE se.tenant_id = videos.tenant_id
        AND se.class_id = videos.class_id
        AND se.student_id IN (
          SELECT s.id FROM students s 
          WHERE s.tenant_id = videos.tenant_id
            AND s.email = (
              SELECT email FROM user_profiles 
              WHERE id = auth.uid()
            )
        )
        AND se.status = 'active'
        AND (se.video_access_expires_at IS NULL OR se.video_access_expires_at > NOW())
    )
  )
);

-- ================================================================
-- 9. 동영상 시청 기록 RLS 정책
-- ================================================================

-- 시청 기록: 관리자와 강사는 테넌트 내 모든 기록 접근
CREATE POLICY "Admins and instructors can access all watch sessions in tenant"
ON video_watch_sessions FOR ALL
USING (
  tenant_id = auth.user_tenant_id() AND
  (
    auth.user_has_role('admin') OR
    auth.user_has_role('instructor')
  )
);

-- 시청 기록: 학생은 자신의 기록만 접근
CREATE POLICY "Students can access their own watch sessions"
ON video_watch_sessions FOR ALL
USING (
  tenant_id = auth.user_tenant_id() AND
  student_id IN (
    SELECT s.id FROM students s
    WHERE s.tenant_id = auth.user_tenant_id()
      AND s.email = (
        SELECT email FROM user_profiles 
        WHERE id = auth.uid()
      )
  )
);

-- ================================================================
-- 10. 실시간 구독 설정
-- ================================================================

-- ClassFlow 및 동영상 강의를 위한 실시간 구독
ALTER PUBLICATION supabase_realtime ADD TABLE student_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE video_watch_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE videos;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE classes;

-- ================================================================
-- 11. 동영상 시청 진도 관리 트리거
-- ================================================================

-- 동영상 시청 진도 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_video_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 완료율 계산
    IF NEW.progress_seconds > 0 AND 
       EXISTS (SELECT 1 FROM videos WHERE id = NEW.video_id AND duration_seconds > 0) THEN
        
        NEW.completion_percentage := LEAST(
            100.0, 
            (NEW.progress_seconds::DECIMAL / 
             (SELECT duration_seconds FROM videos WHERE id = NEW.video_id)) * 100
        );
        
        -- 80% 이상 시청 시 완료 처리
        IF NEW.completion_percentage >= 80 THEN
            NEW.watch_status := 'completed';
        ELSIF NEW.completion_percentage > 0 THEN
            NEW.watch_status := 'in_progress';
        END IF;
    END IF;
    
    -- 동영상 전체 시청 통계 업데이트
    UPDATE videos 
    SET 
        view_count = (
            SELECT COUNT(*) FROM video_watch_sessions 
            WHERE video_id = NEW.video_id 
              AND progress_seconds > 0
        ),
        total_watch_time = (
            SELECT COALESCE(SUM(total_watch_time), 0) 
            FROM video_watch_sessions 
            WHERE video_id = NEW.video_id
        ),
        updated_at = NOW()
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 동영상 시청 진도 트리거 생성
DROP TRIGGER IF EXISTS video_progress_trigger ON video_watch_sessions;
CREATE TRIGGER video_progress_trigger
    BEFORE INSERT OR UPDATE ON video_watch_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_video_progress();

-- ================================================================
-- 12. 수강 등록 관리 트리거
-- ================================================================

-- 수강 등록 사용량 및 만료 관리 함수
CREATE OR REPLACE FUNCTION manage_enrollment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 잔여 수강권 계산
    NEW.sessions_remaining := GREATEST(0, NEW.sessions_total - NEW.sessions_used);
    NEW.hours_remaining := GREATEST(0, NEW.hours_total - NEW.hours_used);
    
    -- 수강권 만료 상태 자동 업데이트
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.status := 'expired';
    ELSIF NEW.sessions_remaining <= 0 AND NEW.sessions_total > 0 THEN
        NEW.status := 'completed';
    ELSIF NEW.hours_remaining <= 0 AND NEW.hours_total > 0 THEN
        NEW.status := 'completed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 수강 등록 관리 트리거 생성
DROP TRIGGER IF EXISTS enrollment_management_trigger ON student_enrollments;
CREATE TRIGGER enrollment_management_trigger
    BEFORE INSERT OR UPDATE ON student_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION manage_enrollment_status();

-- 성공 메시지
SELECT 'EduCanvas 멀티테넌트 RLS 정책이 성공적으로 설정되었습니다!' as message;