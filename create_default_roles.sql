-- 기본 tenant_roles 생성 (테넌트 ID: 5cddcc22-f2a8-434f-acbe-49be8018957d)

INSERT INTO tenant_roles (tenant_id, name, display_name, description, hierarchy_level, is_system_role, is_assignable)
VALUES 
  ('5cddcc22-f2a8-434f-acbe-49be8018957d', 'admin', '관리자', '학원 관리자', 4, true, true),
  ('5cddcc22-f2a8-434f-acbe-49be8018957d', 'instructor', '강사', '수업 담당 강사', 3, true, true),
  ('5cddcc22-f2a8-434f-acbe-49be8018957d', 'staff', '직원', '일반 직원', 2, true, true),
  ('5cddcc22-f2a8-434f-acbe-49be8018957d', 'viewer', '열람자', '읽기 전용 사용자', 1, true, true)
ON CONFLICT (tenant_id, name) DO NOTHING;