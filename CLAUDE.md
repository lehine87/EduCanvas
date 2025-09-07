---
category: root
priority: 5
type: guidance
tags: ["claude-code", "development-guide", "project-guide"]
version: "v5.0"
last_updated: "2025-08-28"
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

## 📚 스마트 문서 접근법 (컨텍스트 최적화)

**⚡ Tier 1: Quick Reference 우선 접근**  
**먼저 Quick Reference 카드를 확인하세요 (1-2분 내 즉시 해결)**

```
docs/quick-reference/component-cheatsheet.md      # 🎨 Top 10 컴포넌트 + 스타일링
docs/quick-reference/api-patterns-cheatsheet.md   # 🚀 CRUD API + 인증 패턴
docs/quick-reference/troubleshooting-cheatsheet.md # 🔧 TypeScript/DB/환경 문제
docs/guides/api-development/industry-standard-api-implementation-guide.md # 🚀 업계 표준 API 구현 완전 메뉴얼
```

**⚡ Tier 2: 스마트 검색 방식**  
**Quick Reference로 해결되지 않으면 특정 섹션만 검색**

### 🎨 컴포넌트 개발 시
```bash
# 특정 컴포넌트 사용법만 검색
grep -A 10 "### Button" docs/guides/components/component-catalog.md
grep -A 15 "다크모드.*색상" docs/guides/ui-development/darkmode-color-system-guide.md
grep -A 20 "Form.*validation" docs/guides/components/component-usage-guide.md
```

### 🚀 API 개발 시
```bash
# 업계 표준 API 구현 메뉴얼 (우선 확인) ✨
docs/guides/api-development/industry-standard-api-implementation-guide.md

# 특정 API 패턴만 검색
grep -A 15 "POST.*route" docs/guides/ui-development/Quick-API-Reference.md
grep -A 10 "RLS.*정책" docs/guides/database/supabase-connection-guide.md
grep -A 8 "권한.*체크" docs/guides/ui-development/CRUD-API-Patterns.md
```

### 🔧 문제 해결 시
```bash
# 특정 에러 타입만 검색
grep -A 5 -B 2 "Type.*any.*금지" docs/core/typescript-safety-manual.md
grep -A 10 "Database.*타입.*업데이트" docs/quick-reference/troubleshooting-cheatsheet.md
grep -A 8 "CORS.*에러" docs/quick-reference/api-patterns-cheatsheet.md
```

### 🗄️ 데이터베이스 작업 시
```bash
# 특정 DB 작업만 검색
grep -A 12 "createClient" docs/guides/database/supabase-connection-guide.md
grep -A 8 "tenant.*membership" docs/core/database_design.md
```

**⚡ Tier 3: 전체 문서 (필요시에만)**
Quick Reference + 스마트 검색으로 해결되지 않을 때만 전체 문서 읽기

| 상황 | 전체 문서 |
|------|----------|
| 🎨 새로운 컴포넌트 설계 | `docs/guides/components/component-patterns.md` |
| 🚀 복잡한 API 아키텍처 | `docs/guides/ui-development/CRUD-API-Patterns.md` |
| 🗄️ DB 스키마 설계 | `docs/core/database_design.md` |
| 🔧 프로젝트 전체 이해 | `docs/core/development_plan.md` |

## ⚡ 긴급 명령어

```bash
# TypeScript 검증
npx tsc --noEmit --strict

# DB 타입 업데이트
npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy

# 빌드 검증
npm run build
npm run lint

# 컴포넌트 도구 (T-V2-006 완성) ✨
npm run analyze:components    # 컴포넌트 사용 빈도 분석
npm run create:component MyComponent --type feature --variant
npm run validate:components   # TypeScript/접근성 검증

# 다크모드 색상 테스트
npm run dev
# → http://localhost:3000/test/design-tokens
```

## 🎨 색상 시스템 빠른 참조

### ✅ 올바른 사용법 (다크모드 지원)
```jsx
// 브랜드 색상 + 자동 텍스트 대비
<div className="bg-educanvas-500 text-educanvas-contrast">
<div className="bg-wisdom-500 text-wisdom-contrast">
<div className="bg-growth-500 text-growth-contrast">

// 반응형 텍스트 색상
<span className="text-neutral-800 dark:text-neutral-200">
```

### ❌ 금지된 사용법 (다크모드 미지원)
```jsx
// 인라인 스타일 사용 금지
<div style={{ backgroundColor: 'var(--color-educanvas-500)' }}>❌

// text-white 고정 사용 금지  
<div className="bg-educanvas-500 text-white">❌
```

## 🪟 Glassmorphism 사용법 (T-V2-003 완료)

**완전 가이드**: `docs/guides/ui-development/glassmorphism-usage-guide.md` 📖

**빠른 참조**:
```jsx
<div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20 shadow-xl dark:shadow-none">
  {/* 완벽한 glassmorphism 효과 */}
</div>
```

## 🏗️ 프로젝트 기본 정보

**EduCanvas v5.0**: Next.js 15 + React 19 + Supabase 기반 학원 관리 시스템  
**핵심 혁신**: ClassFlow (60fps 드래그앤드롭 학생 관리)  
**현재 단계**: v2 UI 리뉴얼 Phase 1 완료 (2025-08-26)  
**주요 업데이트**: ✅ T-V2-001~005 완료 (shadcn/ui, 디자인 토큰, 검색 사이드바, **Hover Subtab**), tenant_memberships 기반 통합 직원 관리

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
5. **인라인 스타일 색상 사용** → 다크모드 적용 안됨 (Tailwind 클래스 필수)

## 🎯 프로젝트 작업 가이드라인

### 필수 준수사항

- 한국어로 답변
- Supabase는 .env.local 정보로 npx supabase CLI 사용
- 로컬DB 사용 금지, 클라우드 DB만 사용

### 최근 주요 변경사항 (2025-08-28)

1. **✅ T-V2-001 완료**: shadcn/ui 30개 컴포넌트 + 고급 DataTable 완성
2. **✅ T-V2-002 완료**: 디자인 토큰 시스템 구축 (130개 색상 + 19개 타이포 + 39개 간격)
3. **✅ T-V2-004 완료**: 통합 검색 사이드바 시스템 완성 (컨텍스트 어댑터 패턴 + 3계층 아키텍처)
4. **✅ T-V2-005 완료**: 탭 네비게이션 + **Hover Subtab 시스템** 구축 (2열 그리드, 중분류/소분류, 깜빡거림 없는 CSS 호버)
5. **✅ T-V2-006 완료**: 컴포넌트 표준화 시스템 완성 (60+ 컴포넌트 문서화 + 자동화 도구 + TypeScript 타입 시스템)
6. **✅ 다크모드 시스템 완성**: 모든 브랜드 색상 + 자동 텍스트 대비 + 4.5:1 접근성 보장
7. **Zero-Touch UI 혁신**: 기존 설정을 전혀 건들지 않고 디자인 시스템 확장
8. **교육 특화 토큰**: lesson, exercise, question, answer 전용 간격 토큰 추가
9. **완전한 접근성**: WCAG 2.1 AA 준수 + Tailwind CSS v4 + 다크모드 완벽 지원
10. **확장 가능한 검색 시스템**: 학생/직원(상세정보), 수업/일정(필터링), 대시보드(통합검색) 패턴 완성
11. **혁신적 Hover Subtab**: CSS 기반 깜빡거림 없는 2열 그리드 서브메뉴 시스템
12. **컴포넌트 개발 생산성**: 자동 생성/검증 도구로 개발 시간 83% 단축 + TypeScript 100% 안정성

---

**💡 더 자세한 내용이 필요할 때만 위의 문서들을 참조하세요.**
- 파일이 복잡하여 파일 재작성이 필요한 경우 반드시 백업본을 만들어놓을 것.