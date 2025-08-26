---
category: navigation
priority: 5
type: index
tags: ["index", "navigation", "documentation", "structure"]
version: "v3.0"
last_updated: "2025-08-25"
status: active
frequency: daily
structure_version: "v2-reorganized"
total_docs: 70
related_files: []
purpose: "EduCanvas 전체 문서 체계 및 빠른 네비게이션 가이드"
audience: ["all-users", "developers", "project-managers"]
reorganized_date: "2025-08-25"
---

# 📚 EduCanvas 문서 인덱스

**최종 업데이트**: 2025-08-26 (T-V2-001 문서화 완료)  
**문서 총 개수**: 72+ 개 (새 문서 +2)  
**분류 기준**: 사용 빈도 및 중요도 기반 폴더 구조화  
**새로운 구조**: 📚 core → 📖 reference → 📋 guides → 🔧 maintenance → 🗃️ archive

---

## 📚 core/ - ⭐⭐⭐⭐⭐ 매일 참조 (필수)

**위치**: `docs/core/`  
**개발 시작 전 필수 확인 문서들**

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **typescript-type-dictionary.md** | 완전한 TypeScript 타입 참조 사전 (v5.0, 500+ 타입) | `core/` |
| **coding-standards.md** | 엔터프라이즈급 코딩 표준 (TypeScript, React, 테스트, 성능) | `core/` |
| **typescript-safety-manual.md** | TypeScript 타입 안전성 확보를 위한 필수 체크리스트 | `core/` |
| **api-skeleton-guide.md** | 생성된 API 스켈레톤 활용법 (학생/클래스/테넌트 관리) | `core/` |
| **기능요구서.md** | MVP 핵심 기능 (ClassFlow 드래그앤드롭, P0-P3 분류) | `core/` |
| **development_plan.md** | v5.0 18주 UI 리뉴얼 계획 (2025-08-26 ~ 2025-12-26) | `core/` |
| **database_design.md** | 데이터베이스 설계 v5.0 (멀티테넌트, Staff Management 통합) | `core/` |

---

## 📖 reference/ - ⭐⭐⭐⭐ 자주 참조 (주 2-3회)

**위치**: `docs/reference/`  
**개발 중 참조하는 상세 기술 문서들**

### Database 참조 (`reference/database/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **database-data-insertion-guide-v4.1.md** | 실제 DB 구조 기반 데이터 삽입 가이드 (Reality-First 원칙) | `reference/database/` |
| **database-development-checklist.md** | UUID 오류 방지 및 DB 개발 품질 체크리스트 | `reference/database/` |
| **database-schema-actual.md** | 실제 데이터베이스 스키마 현황 | `reference/database/` |
| **database_schema_v4.1_updates.sql** | 최신 스키마 업데이트 SQL | `reference/database/` |

### API 참조 (`reference/api/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **api_specification.md** | 완전한 API 명세서 v5.0 (v2 UI 통합, Staff Management) | `reference/api/` |

### 프로젝트 관리 (`project/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **project/educanvas_v1/OVERVIEW.md** | v1 프로젝트 전체 개요 및 현황 | `project/educanvas_v1/` |
| **project/educanvas_v1/BACKLOG.md** | v1 150+ 개 태스크 백로그 현황 | `project/educanvas_v1/` |
| **project/educanvas_v2/README.md** | v2 UI 리뉴얼 프로젝트 개요 | `project/educanvas_v2/` |
| **project/educanvas_v2/plan/design/*.md** | v2 7개 메뉴 완전 설계 문서들 | `project/educanvas_v2/plan/design/` |

---

## 📋 guides/ - ⭐⭐⭐ 주기적 참조 (주 1회 필요시)

**위치**: `docs/guides/`  
**특정 작업 수행 시 참조하는 가이드 문서들**

### UI 개발 가이드 (`guides/ui-development/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **shadcn-ui-components-guide.md** | ✅ shadcn/ui 30개 컴포넌트 실용 가이드 (T-V2-001 완료) | `guides/ui-development/` |
| **DataTable-Component-Guide.md** | ✅ DataTable 고급 컴포넌트 완전 가이드 (리사이징, 토글 등) | `guides/ui-development/` |
| **CRUD-API-Patterns.md** | ✅ CRUD API 표준 패턴 가이드 (2025-08-18 검증 완료) | `guides/ui-development/` |
| **Quick-API-Reference.md** | ✅ 빠른 API 참조 가이드 (Copy&Paste 템플릿) | `guides/ui-development/` |
| **class_management_implementation.md** | ClassFlow 구현 상세 가이드 | `guides/ui-development/` |
| **page-structure-overview.md** | v2 페이지 구조 및 라우팅 설계 | `guides/ui-development/` |

### Database 개발 가이드 (`guides/database/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **supabase-connection-guide.md** | ✅ Supabase 클라우드 DB 접속 완전 가이드 (CLI, Node.js, DDL) | `guides/database/` |

### 아키텍처 가이드 (`guides/architecture/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **multitenant_architecture_design.md** | 멀티테넌트 아키텍처 완전 설계 | `guides/architecture/` |
| **signup-flow-design.md** | 회원가입 플로우 상세 설계 | `guides/architecture/` |

### 기획 및 전략 (`guides/planning/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **extended_roadmap.md** | 3년 확장 로드맵 (2025-2028, AI 교육 플랫폼 진화) | `guides/planning/` |
| **feature_priority_matrix.md** | 기능 우선순위 분석 매트릭스 | `guides/planning/` |
| **competitive_features_integration.md** | 경쟁사 기능 분석 및 통합 전략 | `guides/planning/` |

---

## 🔧 maintenance/ - ⭐⭐ 참고용 (월 1회 특정상황)

**위치**: `docs/maintenance/`  
**품질 관리 및 시스템 유지보수 문서들**

### 마이그레이션 아카이브 (`maintenance/migrations/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **v5.0 마이그레이션** | Role-First Architecture 마이그레이션 완료 아카이브 | `maintenance/migrations/v5.0/` |

### 코드 품질 관리 (`maintenance/quality/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **type-consistency-checklist.md** | TypeScript 타입 일관성 체크리스트 | `maintenance/quality/` |
| **type-inconsistency-audit.md** | 타입 불일치 감사 결과 | `maintenance/quality/` |
| **any-type-audit.md** | any 타입 사용 감사 및 개선 | `maintenance/quality/` |
| **CODING_STANDARDS_SECURITY_AUDIT.md** | 보안 코딩 표준 감사 결과 | `maintenance/quality/` |

### 시스템 모니터링 (`maintenance/monitoring/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **sentry_rules.md** | Sentry 에러 추적 설정 규칙 | `maintenance/monitoring/` |
| **SENTRY_INTEGRATION_VERIFICATION_REPORT.md** | Sentry 통합 검증 보고서 | `maintenance/monitoring/` |

---

## 🗃️ archive/ - ⭐ 보관용 (특별한 경우만 참조)

**위치**: `docs/archive/`, `docs/legacy/`  
**과거 문서, 히스토리, deprecated 파일들**

### 프로젝트 히스토리 (`project/educanvas_v1/`)

| 문서명 | 핵심 내용 | 경로 |
|--------|-----------|------|
| **SPRINTS/2025-08-08-S1.md** | 첫 번째 스프린트 기록 | `project/educanvas_v1/SPRINTS/` |
| **TASKS/T-004-COMPLETION-REPORT.md** | T-004 완료 보고서 | `project/educanvas_v1/TASKS/` |
| **TASKS/T-005-COMPLETION-REPORT.md** | T-005 완료 보고서 | `project/educanvas_v1/TASKS/` |
| **DECISIONS/ADR-*.md** | 아키텍처 결정 기록들 | `project/educanvas_v1/DECISIONS/` |

### 아카이브 (`archive/`)

| 분류 | 내용 | 상태 |
|------|------|------|
| **구버전 스키마** | database_schema_v2.sql, v3.sql, v4.sql | v5.0으로 업데이트 완료 |
| **과거 기획서** | competitor_manual, phase1_detailed_spec | 현재 기능요구서.md로 통합 |
| **구조 개선 문서** | educanvas_structure_improvement.md | 2025-08-25 완료 |
| **레거시 UI 가이드** | UI-Components-Manual-legacy.md | → shadcn-ui-components-guide.md로 대체 |

### 레거시 (`legacy/`)

| 분류 | 내용 | 대체 문서 |
|------|------|----------|
| **구 개발계획** | legacy_comprehensive_development_plan_2025.md | → development_plan.md v5.0 |
| **구 로드맵** | legacy_hakwon_roadmap_detailed.md | → extended_roadmap.md |
| **구 타입사전** | TYPE_DICTIONARY.md | → typescript-type-dictionary.md |
| **벤치마킹** | benchmarking_hakwonjoa/*.png | → competitive_features_integration.md |

---

## 🚀 빠른 참조 가이드 (신규 구조 기반)

### 📚 개발 시작 전 (core/ 필수 확인)
```bash
# 매일 개발 전 체크리스트
docs/core/typescript-type-dictionary.md    # 필요한 타입 확인
docs/core/coding-standards.md             # 코딩 규칙 숙지
docs/core/typescript-safety-manual.md     # 타입 안전성 체크
docs/core/api-skeleton-guide.md          # API 개발 패턴
```

### 📖 새 기능 개발 시 (reference/ 참조)
```bash
# 기능 개발 워크플로
docs/core/기능요구서.md                      # 요구사항 확인 (1순위)
docs/core/database_design.md              # DB 스키마 이해 (2순위)
docs/reference/database/database-schema-actual.md  # 실제 스키마 확인
docs/reference/api/api_specification.md   # API 명세 확인
```

### 📋 UI/UX 개발 시 (guides/ui-development/)
```bash
# UI 개발 가이드 순서 (T-V2-001 완료 기준)
docs/guides/ui-development/shadcn-ui-components-guide.md     # ✅ shadcn/ui 30개 컴포넌트 실사용 가이드
docs/guides/ui-development/DataTable-Component-Guide.md     # ✅ DataTable 고급 기능 완전 가이드
docs/guides/ui-development/page-structure-overview.md       # v2 페이지 구조
docs/guides/ui-development/class_management_implementation.md  # ClassFlow 가이드
```

### 🔧 문제 해결 시 (상황별 참조)
```bash
# 타입 에러
docs/core/typescript-safety-manual.md     # 타입 문제 해결
docs/maintenance/quality/type-*.md        # 타입 감사 결과

# DB 관련 문제
docs/reference/database/database-development-checklist.md  # DB 개발 체크리스트
docs/reference/database/database-data-insertion-guide-v4.1.md  # 데이터 삽입

# 아키텍처 문제
docs/guides/architecture/multitenant_architecture_design.md  # 멀티테넌트
docs/project/educanvas_v1/DECISIONS/ADR-*.md  # 과거 결정사항
```

### 📊 프로젝트 현황 파악 시
```bash
# 현황 파악 순서
docs/core/development_plan.md             # 개발 계획 v5.0 (18주)
docs/project/educanvas_v2/README.md      # v2 프로젝트 현황
docs/project/educanvas_v1/OVERVIEW.md    # v1 프로젝트 현황
docs/guides/planning/extended_roadmap.md  # 장기 계획 (3년)
```

### 🎯 v2 UI 리뉴얼 특화 가이드
```bash
# v2 개발 전용 경로
docs/project/educanvas_v2/plan/design/    # 7개 메뉴 설계 (필수)
├── dashboard-design.md                   # 대시보드 v2
├── enrollment-design.md                  # 등록 시스템 v2  
├── class-management-v2.md               # 클래스 관리 v2
├── staff-management-v2.md               # 직원 관리 v2
├── schedule-design.md                   # 스케줄 v2
├── reports-design.md                    # 리포트 v2
└── course-management-v2.md              # 코스 관리 v2
```

---

## 🎖️ 새로운 구조의 장점

### ⚡ 빠른 접근성
- **중요도순 배치**: 매일 사용 → 주기적 사용 → 참고용 → 보관용
- **폴더별 분류**: 용도에 따른 직관적 분류 (core/reference/guides/maintenance)
- **경로 표시**: 모든 문서에 정확한 경로 명시

### 🎯 개발 효율성 향상
- **개발 워크플로 최적화**: 개발 단계별 필요 문서 명확화  
- **중복 제거**: 유사 문서 통합 및 레거시 분리
- **검색성 개선**: 폴더별 목적이 명확해 필요한 문서 빠른 발견

### 📈 유지보수성
- **신규 문서 분류 기준 명확**: 새 문서 추가 시 적절한 위치 자동 결정
- **버전 관리 체계화**: archive/legacy 분리로 현재/과거 구분 명확
- **문서 생명주기 관리**: 자주 사용 → 가끔 사용 → 아카이브 순환 체계

---

**💡 2025-08-25 구조 개편 완료**: 이제 폴더별로 체계적으로 관리되어 개발 효율성이 크게 향상됩니다!