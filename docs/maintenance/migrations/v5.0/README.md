# EduCanvas v5.0 마이그레이션 아카이브

**마이그레이션 완료일**: 2025-08-25  
**아키텍처 변경**: User-First → Role-First Architecture  
**상태**: ✅ 성공적으로 완료됨

---

## 📁 파일 구조

```
docs/maintenance/migrations/v5.0/
├── README.md                          # 이 파일
├── sql-scripts/                       # SQL DDL 스크립트들
│   ├── fix_rls_policies_migration_v4.sql    # ✅ 최종 성공 스크립트
│   ├── fix_rls_policies_migration_v3.sql    # v3 (CASCADE 도입)  
│   ├── fix_rls_policies_migration_v2.sql    # v2 (중간 시도)
│   ├── fix_rls_policies_migration.sql       # v1 (초기 시도)
│   ├── add_staff_info_column.sql            # staff_info 컬럼 추가
│   ├── final_migration_sql.sql              # 컬럼 교체 스크립트
│   └── fix_classes_instructor_direct.sql    # 초기 시도
├── node-scripts/                      # Node.js 데이터 마이그레이션
│   ├── migrate_data.js                      # ✅ 실제 사용된 데이터 마이그레이션
│   ├── execute_migration.js                 # 실행 스크립트
│   ├── migrate_instructors_to_staff.js      # 강사 정보 통합 시도
│   ├── analyze_instructors_data.js          # 데이터 분석
│   └── check_active_instructors.js          # 현재 강사 확인
└── documentation/                     # 마이그레이션 문서
    ├── migration_instructions.md            # 실행 지침
    └── MIGRATION_SUMMARY_v5.0.md           # 완료 보고서
```

---

## 🎯 마이그레이션 개요

### 변경사항
- **기존**: `classes.instructor_id` → `user_profiles.id` (직접 연결)
- **변경**: `classes.instructor_id` → `tenant_memberships.id` → `user_profiles.id`

### 목적
- user_profiles를 순수한 "서비스 접근 ID" 역할로 전환
- 향후 학생/학부모 모바일앱 확장성 확보
- tenant_memberships 기반 통합 직원 관리

---

## 📋 성공한 마이그레이션 순서

### 1단계: 데이터 마이그레이션
```bash
node migrate_data.js
```
- 역할: classes.instructor_id 데이터를 user_profiles.id → tenant_memberships.id로 변환
- 결과: "중2 현행반" 클래스 성공적으로 마이그레이션

### 2단계: DDL 마이그레이션  
```sql
-- Supabase Dashboard SQL Editor에서 실행
-- 파일: fix_rls_policies_migration_v4.sql
```
- 역할: 스키마 변경 및 RLS 정책 재구성
- 특징: CASCADE 사용하여 의존성 자동 해결

### 3단계: Staff Info 구조 추가
```sql
-- 파일: add_staff_info_column.sql
ALTER TABLE tenant_memberships ADD COLUMN staff_info JSONB;
```

---

## ⚠️ 참고사항

### 성공 요인
- **Reality-First 접근**: 실제 DB 구조 분석 후 마이그레이션
- **단계적 접근**: 데이터 → 스키마 → 정책 순서 준수
- **의존성 해결**: CASCADE 사용으로 RLS 정책 충돌 해결

### 학습 포인트
- v1-v3은 RLS 정책 의존성 문제로 실패
- v4에서 students-classes 관계를 올바르게 반영 (student_enrollments 테이블 경유)
- DDL은 REST API 불가, Supabase Dashboard 필수

---

## 🔗 관련 문서

- **접속 가이드**: `docs/guides/database/supabase-connection-guide.md`
- **아키텍처 설계**: `docs/core/database_design.md`  
- **타입 시스템**: `src/types/staff.types.ts`
- **개발 가이드**: `CLAUDE.md`

---

**📝 보관 목적**: 향후 유사한 마이그레이션 시 참조용으로 보관