-- ================================================================
-- T-009: 역할별 세밀한 접근 권한 정책 
-- 기존 기본 정책에 추가하여 역할별 차등 권한 구현
-- ================================================================

-- T-008 RBAC 시스템과 연동:
-- admin: 전체 테넌트 데이터 관리
-- instructor: 담당 클래스/학생만 접근  
-- staff: 학생 관리, 출결, 결제 처리
-- viewer: 읽기 전용

-- ================================================================
-- 1. 출결 관리 세밀한 권한 (attendances)
-- ================================================================

-- 강사는 담당 클래스 출결만 조회 가능
CREATE POLICY "rls_attendances_instructor_select" ON attendances
    FOR SELECT USING (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR user_has_role('staff') OR
                -- 강사는 본인 담당 클래스만
                (user_has_role('instructor') AND student_id IN (
                    SELECT s.id FROM students s 
                    JOIN student_enrollments se ON s.id = se.student_id
                    JOIN classes c ON se.class_id = c.id
                    JOIN user_profiles up ON c.instructor_id = up.id
                    WHERE up.id = auth.uid() AND s.tenant_id = get_user_tenant_id()
                ))
            )
        )
    );

-- 강사는 담당 클래스 출결만 입력 가능
CREATE POLICY "rls_attendances_instructor_insert" ON attendances
    FOR INSERT WITH CHECK (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR user_has_role('staff') OR
                -- 강사는 본인 담당 클래스만
                (user_has_role('instructor') AND student_id IN (
                    SELECT s.id FROM students s 
                    JOIN student_enrollments se ON s.id = se.student_id
                    JOIN classes c ON se.class_id = c.id
                    JOIN user_profiles up ON c.instructor_id = up.id
                    WHERE up.id = auth.uid() AND s.tenant_id = get_user_tenant_id()
                ))
            )
        )
    );

-- 강사는 담당 클래스 출결만 수정 가능
CREATE POLICY "rls_attendances_instructor_update" ON attendances
    FOR UPDATE 
    USING (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR user_has_role('staff') OR
                -- 강사는 본인 담당 클래스만
                (user_has_role('instructor') AND student_id IN (
                    SELECT s.id FROM students s 
                    JOIN student_enrollments se ON s.id = se.student_id
                    JOIN classes c ON se.class_id = c.id
                    JOIN user_profiles up ON c.instructor_id = up.id
                    WHERE up.id = auth.uid() AND s.tenant_id = get_user_tenant_id()
                ))
            )
        )
    )
    WITH CHECK (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR user_has_role('staff') OR
                -- 강사는 본인 담당 클래스만
                (user_has_role('instructor') AND student_id IN (
                    SELECT s.id FROM students s 
                    JOIN student_enrollments se ON s.id = se.student_id
                    JOIN classes c ON se.class_id = c.id
                    JOIN user_profiles up ON c.instructor_id = up.id
                    WHERE up.id = auth.uid() AND s.tenant_id = get_user_tenant_id()
                ))
            )
        )
    );

-- ================================================================
-- 2. 강사 정보 접근 권한 (instructors)
-- ================================================================

-- admin: 전체 강사 조회, instructor: 본인 정보만
CREATE POLICY "rls_instructors_role_based_select" ON instructors
    FOR SELECT USING (
        is_developer_email(auth.email()) OR 
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR user_has_role('staff') OR
                -- 강사는 본인 정보만 조회 가능
                (user_has_role('instructor') AND user_id = auth.uid())
            )
        )
    );

-- admin과 강사 본인만 강사 정보 수정 가능
CREATE POLICY "rls_instructors_update" ON instructors
    FOR UPDATE 
    USING (
        is_developer_email(auth.email()) OR 
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR
                -- 강사는 본인 정보만 수정 가능
                (user_has_role('instructor') AND user_id = auth.uid())
            )
        )
    )
    WITH CHECK (
        is_developer_email(auth.email()) OR 
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR
                -- 강사는 본인 정보만 수정 가능
                (user_has_role('instructor') AND user_id = auth.uid())
            )
        )
    );

-- ================================================================
-- 3. 결제 정보 역할별 접근 (payments)
-- ================================================================

-- SELECT는 staff도 가능, CUD는 admin만
CREATE POLICY "rls_payments_staff_readonly" ON payments
    FOR SELECT USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND 
         (user_has_role('admin') OR user_has_role('staff')))
    );

CREATE POLICY "rls_payments_admin_write" ON payments  
    FOR INSERT WITH CHECK (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

CREATE POLICY "rls_payments_admin_update" ON payments
    FOR UPDATE 
    USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    )
    WITH CHECK (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

CREATE POLICY "rls_payments_admin_delete" ON payments
    FOR DELETE USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('admin'))
    );

-- ================================================================
-- 4. 학생 상담 기록 접근 권한 (consultations)
-- ================================================================

-- 모든 강사가 테넌트 내 모든 학생 상담 기록 조회 가능 (기본 오픈 정책)
-- UI에서 토글 기능으로 "내 담당 학생만" 필터링 제공
CREATE POLICY "rls_consultations_open_access" ON consultations
    FOR SELECT USING (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR 
                user_has_role('staff') OR 
                user_has_role('instructor') OR
                user_has_role('viewer')
            )
        )
    );

-- 상담 기록 작성은 admin, staff, instructor만 가능
CREATE POLICY "rls_consultations_write_access" ON consultations
    FOR INSERT WITH CHECK (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR 
                user_has_role('staff') OR 
                user_has_role('instructor')
            )
        )
    );

-- 상담 기록 수정은 상담자 본인과 admin만 가능
CREATE POLICY "rls_consultations_update_own" ON consultations
    FOR UPDATE 
    USING (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR 
                -- 상담자 본인만 수정 가능
                counselor_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR 
                counselor_id = auth.uid()
            )
        )
    );

-- ================================================================
-- 5. 동영상 강의 접근 권한 (video_lectures)
-- ================================================================

-- instructor가 업로드한 강의는 본인만 수정 가능
CREATE POLICY "rls_video_lectures_instructor_own" ON video_lectures
    FOR UPDATE USING (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR
                -- 강사는 본인이 업로드한 강의만 수정
                (user_has_role('instructor') AND created_by = auth.uid())
            )
        )
    );

-- ================================================================
-- 6. 학생 동영상 접근 권한 세밀화 (student_video_access)  
-- ================================================================

-- 강사는 담당 학생의 동영상 접근 권한만 조회
CREATE POLICY "rls_student_video_access_instructor_select" ON student_video_access
    FOR SELECT USING (
        is_developer_email(auth.email()) OR
        (
            tenant_id = get_user_tenant_id() AND (
                user_has_role('admin') OR user_has_role('staff') OR
                -- 강사는 담당 학생만
                (user_has_role('instructor') AND student_id IN (
                    SELECT s.id FROM students s 
                    JOIN student_enrollments se ON s.id = se.student_id
                    JOIN classes c ON se.class_id = c.id
                    JOIN user_profiles up ON c.instructor_id = up.id  
                    WHERE up.id = auth.uid() AND s.tenant_id = get_user_tenant_id()
                ))
            )
        )
    );

-- ================================================================
-- 7. viewer 역할 읽기 전용 정책 추가
-- ================================================================

-- 주요 테이블에 viewer 읽기 권한 추가
CREATE POLICY "rls_students_viewer_readonly" ON students
    FOR SELECT USING (
        is_developer_email(auth.email()) OR
        (tenant_id = get_user_tenant_id() AND user_has_role('viewer'))
    );

CREATE POLICY "rls_classes_viewer_readonly" ON classes  
    FOR SELECT USING (
        is_developer_email(auth.email()) OR
        (tenant_id = get_user_tenant_id() AND user_has_role('viewer'))
    );

CREATE POLICY "rls_attendances_viewer_readonly" ON attendances
    FOR SELECT USING (
        is_developer_email(auth.email()) OR 
        (tenant_id = get_user_tenant_id() AND user_has_role('viewer'))
    );

-- ================================================================
-- 정책 우선순위 및 충돌 방지
-- ================================================================

-- 기존 기본 정책과 새로운 역할별 정책이 충돌하지 않도록
-- PostgreSQL RLS는 OR 조건으로 모든 정책을 평가함
-- 따라서 가장 관대한 정책이 적용됨

-- 확인 쿼리:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN (
--     'attendances', 'instructors', 'payments', 'consultations', 
--     'video_lectures', 'student_video_access'
-- )
-- ORDER BY tablename, policyname;