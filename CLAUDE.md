---
category: root
priority: 5
type: guidance
tags: ["claude-code", "development-guide", "project-guide"]
version: "v5.0"
last_updated: "2025-08-25"
status: active
frequency: daily
purpose: "Claude Code AI 개발자를 위한 EduCanvas 프로젝트 완전 가이드"
audience: ["claude-ai", "developers"]
project_phase: "v5-staff-integration"
---

# CLAUDE.md

**EduCanvas 프로젝트를 위한 Claude Code AI 개발 가이드**

## 🎯 핵심 원칙 (최우선 순위)

### 1. 보안 우선 (Security-First)

- **철학**: `타입 에러 = 보안 취약점`
- **Zero Trust**: 모든 요청 기본 불신, 3중 검증 (DB RLS + API + Frontend)
- **개인정보 보호**: 학생 데이터 AES-256 암호화, 메모리 보안 관리

### 2. TypeScript Zero-Error 정책

- **MANDATORY**: `npx tsc --noEmit --strict` → **0 errors 필수**
- **Database-First**: `Database['public']['Tables']['테이블명']['Row']` 기반 타입
- **any 절대 금지** → `unknown` + 타입가드 사용

### 3. Reality-First 개발

- **DB 스키마**: 문서보다 `npx supabase gen types typescript` 결과가 정답
- **API-First**: 클라이언트 DB 직접 접근 금지, API Route 필수 사용
- **Supabase 접속**: `docs/guides/database/supabase-connection-guide.md` 표준 가이드 준수

## 📚 필수 읽어야 할 문서들 (상황별 가이드)

**⚠️ CLAUDE AI 지침**: 사용자 요청을 받으면 먼저 해당 상황에 맞는 문서들을 읽는 Todo를 생성하세요!

### 🚨 개발 시작 전 / TypeScript 문제 시

**먼저 읽을 문서들**:

```
docs/core/typescript-safety-manual.md    # 타입 에러 해결
docs/core/coding-standards.md            # 필수 코딩 규칙
docs/core/typescript-type-dictionary.md  # 500+ 타입 사전
```

### 🏗️ 새 기능 개발 / API 개발 시

**먼저 읽을 문서들**:

```
docs/core/기능요구서.md                     # MVP 요구사항
docs/core/development_plan.md             # v2 UI 리뉴얼 18주 계획
docs/core/database_design.md              # DB Schema v5.0
docs/guides/ui-development/Quick-API-Reference.md    # ✅ 빠른 API 참조 (Copy&Paste)
docs/guides/ui-development/CRUD-API-Patterns.md     # ✅ CRUD API 표준 패턴 (검증 완료)
```

### 🎨 UI/컴포넌트 개발 시 (순수 컴포넌트 작업)

**먼저 읽을 문서들**:

```
docs/guides/ui-development/design-tokens-usage.md           # ✅ T-V2-002 디자인 토큰 완전 가이드 (색상/타이포/간격)
docs/guides/ui-development/shadcn-ui-components-guide.md    # ✅ shadcn/ui 30개 컴포넌트 실용 가이드 (T-V2-001 완료)
docs/guides/ui-development/DataTable-Component-Guide.md     # ✅ DataTable 고급 컴포넌트 완전 가이드
docs/project/educanvas_v2/plan/design/                     # 7개 메뉴 설계
docs/guides/ui-development/page-structure-overview.md      # v2 페이지 구조
```

### 🚀 프론트엔드 서비스 개발 시 (예: 학생관리 CRUD, 클래스 관리 등)

**먼저 읽을 문서들**:

```
docs/guides/ui-development/shadcn-ui-components-guide.md     # ✅ UI 컴포넌트 사용법
docs/guides/ui-development/DataTable-Component-Guide.md     # ✅ 테이블 구현 시 필수
docs/guides/ui-development/Quick-API-Reference.md           # ✅ API 연동 패턴
docs/guides/ui-development/CRUD-API-Patterns.md            # ✅ 데이터 처리 로직
docs/core/typescript-type-dictionary.md                     # 타입 정의 참조
```

### 🗄️ 데이터베이스 작업 시

**먼저 읽을 문서들**:

```
docs/guides/database/supabase-connection-guide.md  # ✅ Supabase 접속 완전 가이드 (필수!)
docs/reference/database/database-development-checklist.md  # DB 개발 체크리스트
docs/reference/database/database-data-insertion-guide-v4.1.md  # 데이터 삽입
docs/core/database_design.md              # DB Schema v5.0
```

### 🔧 문제 해결 / 분석 시

**먼저 읽을 문서들**:

```
docs/maintenance/quality/type-consistency-checklist.md     # 타입 문제
docs/index.md                                              # 전체 문서 네비게이션
docs/core/typescript-safety-manual.md                     # 타입 에러 해결
```

### 📋 프로젝트 현황 파악 시

**먼저 읽을 문서들**:

```
docs/core/development_plan.md             # v2 개발 계획
docs/project/educanvas_v2/README.md      # v2 프로젝트 현황
docs/index.md                             # 전체 문서 구조
```

## ⚡ 긴급 명령어

```bash
# TypeScript 검증
npx tsc --noEmit --strict

# DB 타입 업데이트
npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy

# 빌드 검증
npm run build
npm run lint
```

## 🏗️ 프로젝트 기본 정보

**EduCanvas v5.0**: Next.js 15 + React 19 + Supabase 기반 학원 관리 시스템  
**핵심 혁신**: ClassFlow (60fps 드래그앤드롭 학생 관리)  
**현재 단계**: v2 UI 리뉴얼 Phase 1 완료 (2025-08-26)  
**주요 업데이트**: ✅ T-V2-001 완료 (shadcn/ui), ✅ **T-V2-002 완료** (디자인 토큰 시스템), tenant_memberships 기반 통합 직원 관리

### 기술 스택

- Frontend: Next.js 15, React 19, shadcn/ui, TailwindCSS 4
- **Design System**: 130개 색상 토큰 + 19개 타이포그래피 + 39개 간격 토큰 (T-V2-002 완료)
- Backend: Supabase (PostgreSQL), Row Level Security
- State: Zustand, React Hook Form + Zod
- Performance: @dnd-kit, react-window, Sentry

### 🏗️ DB 아키텍처 v5.0 (2025-08-25 완료)

**핵심 변경사항**: User-First → Role-First Architecture

```
기존 v4.1: classes.instructor_id → user_profiles.id (직접 연결)
새로운 v5.0: classes.instructor_id → tenant_memberships.id → user_profiles.id

아키텍처 목표: user_profiles는 순수한 "서비스 접근 ID" 역할
향후 확장: 학생/학부모 모바일앱도 user_profiles 통해 접근 가능
```

**Staff Management 통합**:

- `tenant_memberships.staff_info` JSONB: 강사/직원 추가 정보 저장
- 통합 역할 관리: admin, instructor, staff, viewer
- 확장 가능한 권한 시스템

## 📋 필수 체크리스트 (매 코드 작성시)

### 코드 작성 전

- [ ] **Supabase 접속**: `docs/guides/database/supabase-connection-guide.md` 확인
- [ ] `SUPABASE_ACCESS_TOKEN=... npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy` 실행
- [ ] `docs/typescript-safety-manual.md` 확인
- [ ] `src/types/` 디렉터리에서 기존 타입 검색

### 코드 작성 중

- [ ] Database-First 타입 사용
- [ ] `any` 절대 금지 → `unknown` + 타입가드
- [ ] 옵셔널 체이닝(`?.`) 및 null 체크

### 코드 작성 후

- [ ] `npx tsc --noEmit --strict` → 0 errors 확인
- [ ] `npm run build` 성공 확인
- [ ] 새 타입은 `src/types/index.ts`에 export

## 🚫 즉시 중단 패턴

1. `any` 타입 사용 → 보안 위험
2. 클라이언트 DB 직접 접근 → API Route 필수
3. 타입 에러 무시 → 런타임 버그
4. 하드코딩된 UUID → `gen_random_uuid()` 사용

## 🎯 프로젝트 작업 가이드라인

### 필수 준수사항

- 한국어로 답변
- Supabase는 .env.local 정보로 npx supabase CLI 사용
- 로컬DB 사용 금지, 클라우드 DB만 사용

### 최근 주요 변경사항 (2025-08-26)

1. **✅ T-V2-001 완료**: shadcn/ui 30개 컴포넌트 + 고급 DataTable 완성
2. **✅ T-V2-002 완료**: 디자인 토큰 시스템 구축 (130개 색상 + 19개 타이포 + 39개 간격)
3. **Zero-Touch UI 혁신**: 기존 설정을 전혀 건들지 않고 디자인 시스템 확장
4. **교육 특화 토큰**: lesson, exercise, question, answer 전용 간격 토큰 추가
5. **완전한 접근성**: WCAG 2.1 AA 준수 (4.5:1 대비) + 다크모드 완벽 지원
6. **v2 Phase 1 완료**: 디자인 시스템 기반 완성 (2/108 작업 완료, 목표 대비 162% 성과)

---

**💡 더 자세한 내용이 필요할 때만 위의 문서들을 참조하세요.**
