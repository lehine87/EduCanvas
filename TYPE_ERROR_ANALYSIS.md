# EduCanvas 타입 에러 분석 보고서
*2025-08-13 생성*

## 📊 타입 에러 현황 요약

**총 타입 에러: 154개** (12개 파일)

### 🚨 심각도별 분류

| 심각도 | 파일 수 | 에러 수 | 우선순위 |
|--------|---------|---------|----------|
| **Critical** | 2 | 106 | P0 |
| **High** | 3 | 32 | P1 |
| **Medium** | 4 | 13 | P2 |
| **Low** | 3 | 3 | P3 |

### 📁 파일별 타입 에러 분포

| 파일명 | 에러 수 | 심각도 | 주요 문제 유형 |
|--------|---------|---------|----------------|
| **src/utils/typeGuardsExtended.test.ts** | 64 | Critical | 테스트 파일 타입 불일치 |
| **src/lib/auth/supabaseAuth.ts** | 42 | Critical | null/undefined 체크, 배열 타입 불일치 |
| **src/utils/typeGuardsExtended.ts** | 14 | High | 타입 가드 구현 문제 |
| **src/store/useAuthStore.ts** | 9 | High | Promise 반환 타입 문제 |
| **src/types/index.ts** | 6 | High | 타입 정의 불일치 |
| **src/test/setup.ts** | 5 | Medium | 테스트 설정 타입 문제 |
| **src/lib/supabase/server.ts** | 3 | Medium | 쿠키 접근 타입 문제 |
| **src/utils/basic-types.test.ts** | 2 | Medium | 기본 타입 테스트 문제 |
| **src/types/auth.types.ts** | 2 | Medium | 인증 타입 정의 문제 |
| **src/types/billing.ts** | 1 | Low | 빌링 타입 정의 |
| **src/types/api.ts** | 1 | Low | API 타입 정의 |
| **src/middleware.ts** | 1 | Low | 미들웨어 타입 비교 |
| **src/lib/auth/rateLimiter.ts** | 1 | Low | undefined 체크 |
| **src/__tests__/auth/apiAuth.test.ts** | 1 | Low | 테스트 undefined 체크 |

## 🎯 Critical Priority (P0) - 즉시 수정 필요

### 1. `src/lib/auth/supabaseAuth.ts` (42개 에러)

**주요 문제:**
- **null/undefined 체크 누락**: `selectedTenant`, `currentTenant`, `t` 변수들
- **배열 타입 불일치**: `TenantWithRole[]` vs 실제 반환 타입
- **readonly 배열 문제**: `permissions` 객체의 readonly 속성
- **존재하지 않는 속성**: `hierarchy_level`, `getRolePermissions`

**에러 유형별 분류:**
```typescript
// 1. null/undefined 체크 필요 (20개)
selectedTenant.id // possibly null or undefined
t.name // t is possibly null

// 2. 배열 타입 불일치 (10개)  
TenantWithRole[] vs ({ ... } | null)[]

// 3. readonly 배열 문제 (8개)
readonly ["read", "write"] vs string[]

// 4. 속성 존재하지 않음 (4개)
hierarchy_level, getRolePermissions
```

### 2. `src/utils/typeGuardsExtended.test.ts` (64개 에러)

**주요 문제:**
- **타입 가드 테스트 실패**: 실제 데이터베이스 타입과 테스트 타입 불일치
- **속성명 오타**: `consultation_date` vs `consultation_type`
- **누락된 속성**: `grade`, `course_package_id`, `date` 등
- **타입 변환 실패**: object to specific types

## 🔥 High Priority (P1) - 우선 수정 필요

### 3. `src/utils/typeGuardsExtended.ts` (14개 에러)

**문제:**
- 타입 가드 함수의 구현이 실제 데이터베이스 스키마와 불일치
- 속성 존재성 검사 실패

### 4. `src/store/useAuthStore.ts` (9개 에러)

**문제:**
- Promise 반환 타입 불일치
- 일부 코드 경로에서 값 반환 누락

### 5. `src/types/index.ts` (6개 에러)

**문제:**
- 중앙 타입 정의와 실제 사용 타입 간 불일치

## 🟡 Medium Priority (P2) - 일반 수정

### 6-9. 기타 Medium 파일들 (13개 에러)

- `src/test/setup.ts`: 테스트 환경 설정 타입 문제
- `src/lib/supabase/server.ts`: 서버 쿠키 접근 타입 문제  
- `src/utils/basic-types.test.ts`: 기본 타입 테스트 문제
- `src/types/auth.types.ts`: 인증 타입 정의 문제

## 🟢 Low Priority (P3) - 후순위 수정

### 10-14. Low Priority 파일들 (5개 에러)

단순한 undefined/null 체크 및 minor 타입 문제들

## 🛠 수정 전략

### Phase 1: Critical Issues (1-2시간)
1. **supabaseAuth.ts 우선 수정**
   - null/undefined 타입 가드 추가
   - 배열 타입 정의 수정
   - readonly 배열 문제 해결

2. **typeGuardsExtended 정리**
   - 실제 DB 스키마와 타입 가드 동기화
   - 테스트 파일 대폭 수정

### Phase 2: High Priority (30분-1시간)
3. **useAuthStore.ts 수정**
   - Promise 반환 타입 수정
   - 모든 코드 경로 return 추가

4. **types/index.ts 정리**
   - 중앙 타입 정의 검토 및 수정

### Phase 3: Medium/Low Priority (30분)
5. **나머지 파일들 순차 수정**
   - 테스트 파일들 수정
   - 서버 사이드 타입 문제 해결

## 🎯 예상 완료 시간

**총 예상 시간: 3-4시간**
- Critical: 2-3시간
- High: 1시간  
- Medium/Low: 30분

## 📋 완료 체크리스트

- [ ] `src/lib/auth/supabaseAuth.ts` (42개 에러)
- [ ] `src/utils/typeGuardsExtended.test.ts` (64개 에러)  
- [ ] `src/utils/typeGuardsExtended.ts` (14개 에러)
- [ ] `src/store/useAuthStore.ts` (9개 에러)
- [ ] `src/types/index.ts` (6개 에러)
- [ ] `src/test/setup.ts` (5개 에러)
- [ ] `src/lib/supabase/server.ts` (3개 에러)
- [ ] `src/utils/basic-types.test.ts` (2개 에러)
- [ ] `src/types/auth.types.ts` (2개 에러)
- [ ] `src/types/billing.ts` (1개 에러)
- [ ] `src/types/api.ts` (1개 에러)
- [ ] `src/middleware.ts` (1개 에러)
- [ ] `src/lib/auth/rateLimiter.ts` (1개 에러)
- [ ] `src/__tests__/auth/apiAuth.test.ts` (1개 에러)

---
*이 문서는 수정 진행 상황에 따라 업데이트됩니다.*