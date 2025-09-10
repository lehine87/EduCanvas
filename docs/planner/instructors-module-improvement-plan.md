# Instructors 모듈 개선 및 수정 실행 계획

**문서 정보**
- 작성일: 2025-09-10
- 버전: v1.0
- 담당 모듈: T-V2-012 Instructor Management System
- 상태: 계획 수립 완료

---

## 📋 프로젝트 개요

### 목적
EduCanvas Instructors 모듈의 업계 표준 적용 및 기능 완성을 통해 안정적이고 현대적인 강사 관리 시스템 구축

### 현재 상태 분석
**✅ 잘 구성된 부분:**
- 견고한 TypeScript 기반 아키텍처
- Supabase 기반 3-Layer Security 적용
- shadcn/ui 기반 일관된 UI 컴포넌트
- Zustand 상태 관리 구조

**⚠️ 개선이 필요한 부분:**
- GET API 임시 구현 (빈 배열 반환)
- `any` 타입 사용으로 인한 타입 안전성 부족
- HTTP 메서드 불일치 (PUT vs PATCH)
- 현대적 상태 관리 패턴 부재

---

## 🎯 개선 목표

### 업계 표준 대비 개선 사항

#### 1. React Query 패턴 도입으로 상태 관리 현대화
**현재 상황:**
```typescript
// instructorsStore.ts - Zustand에서 직접 fetch 처리
fetchInstructors: async (tenantId: string) => {
  const response = await fetch(`/api/instructors?tenant_id=${tenantId}`)
  // 수동 상태 관리...
}
```

**목표:**
```typescript
// useInstructors.ts - React Query 패턴
export function useInstructors(filters: InstructorFilters) {
  return useQuery({
    queryKey: ['instructors', filters],
    queryFn: () => fetchInstructors(filters),
    staleTime: 5 * 60 * 1000, // 5분
  })
}
```

#### 2. OpenAPI/Swagger 기반 API 문서화
**현재:** 주석만으로 API 스펙 설명  
**목표:** 자동 생성 API 문서 + TypeScript 스키마 동기화

#### 3. 에러 경계(Error Boundary) + 관측가능성
**현재:** console.error만 사용  
**목표:** 구조화된 에러 처리 + 모니터링 시스템

### 필수 수정 사항

#### 1. 임시 구현 제거 - 기능 불완전
**파일:** `src/app/api/instructors/route.ts:108-120`  
**문제:** GET API에서 빈 배열만 반환  
**영향:** 전체 강사 관리 기능 동작 불가

#### 2. 타입 안전성 부족
**파일:** `src/lib/api/instructors.api.ts:164, 177`  
**문제:** `any` 타입 사용으로 런타임 오류 위험  
**영향:** TypeScript의 타입 체크 혜택 상실

#### 3. HTTP 메서드 불일치
**파일:** `src/store/instructorsStore.ts:125` vs API routes  
**문제:** 클라이언트는 PATCH, 서버는 PUT 사용  
**영향:** API 호출 실패 가능성

---

## 🚀 단계별 실행 계획

### Phase 1: 기본 기능 완성 (우선순위: 높음) ⭐⭐⭐
**예상 소요시간:** 2-3시간  
**의존성:** 없음  
**완료 기준:** API 완전 동작, TypeScript 에러 0개

#### 1.1 임시 구현 제거 - GET API 완성
**대상 파일:**
- `src/app/api/instructors/route.ts`

**구현 내용:**
```sql
-- 예상 쿼리 구조
SELECT tm.*, up.name, up.email, up.phone, up.avatar_url,
       tr.name as role_name, tr.display_name
FROM tenant_memberships tm
JOIN user_profiles up ON tm.user_id = up.id
LEFT JOIN tenant_roles tr ON tm.role_id = tr.id
WHERE tm.tenant_id = $1
  AND tm.status = 'active'
  AND (tm.staff_info->'instructor_info' IS NOT NULL)
ORDER BY up.name ASC
LIMIT $2 OFFSET $3;
```

**포함 기능:**
- [x] 검색 (이름, 이메일, 사번)
- [x] 필터링 (부서, 고용형태, 상태)
- [x] 정렬 (이름, 입사일, 부서별)
- [x] 페이징 (limit/offset)

#### 1.2 타입 안전성 강화
**대상 파일:**
- `src/lib/api/instructors.api.ts`
- `src/types/instructor.types.ts` (필요시 확장)

**수정 내용:**
```typescript
// 현재
createInstructor(data: any): Promise<{ instructor: Instructor, message: string }>

// 수정 후
createInstructor(data: CreateInstructorRequest): Promise<CreateInstructorResponse>
updateInstructor(id: string, updates: UpdateInstructorRequest): Promise<UpdateInstructorResponse>
```

#### 1.3 HTTP 메서드 통일
**수정 방향:** PUT으로 통일 (RESTful 관례)
- API: PUT (전체 리소스 교체)
- Store: PUT으로 변경
- 클라이언트: PUT 사용

### Phase 2: 현대화 패턴 도입 (우선순위: 중간) ⭐⭐
**예상 소요시간:** 2-3시간  
**의존성:** Phase 1 완료 후  
**완료 기준:** React Query 패턴 적용, 에러 처리 완성

#### 2.1 React Query 패턴 적용
**새로 생성할 파일:**
```
src/hooks/queries/
├── useInstructors.ts           # 목록 조회
├── useInstructor.ts            # 상세 조회
├── useCreateInstructor.ts      # 생성
├── useUpdateInstructor.ts      # 수정
└── useDeleteInstructor.ts      # 삭제
```

**기대 효과:**
- 자동 캐싱 및 리페칭
- 로딩/에러 상태 자동 관리
- 낙관적 업데이트 지원
- 백그라운드 동기화

#### 2.2 에러 처리 시스템 구축
**구성 요소:**
- Error Boundary (React 컴포넌트 에러)
- API 에러 인터셉터 (네트워크 에러)
- Toast 알림 통합 (사용자 피드백)
- 에러 로그 중앙화 (디버깅)

**구현 위치:**
- `src/components/error/InstructorErrorBoundary.tsx`
- `src/lib/api/error-handler.ts`
- `src/hooks/useErrorHandler.ts`

### Phase 3: 문서화 및 표준화 (우선순위: 낮음) ⭐
**예상 소요시간:** 1시간  
**의존성:** Phase 1-2 완료 후  
**완료 기준:** 문서화 완료, 코드 리뷰 준비

#### 3.1 API 문서화 강화
**작업 내용:**
- JSDoc 주석 표준화
- API 스펙 문서 작성
- 타입 정의 문서화

#### 3.2 OpenAPI 스키마 도입 (선택사항)
**도구:** swagger-jsdoc + swagger-ui-express
**위치:** `/api-docs` 엔드포인트
**혜택:** 자동 API 문서 생성

---

## 📊 구현 체크리스트

### Phase 1: 기본 기능 완성
- [ ] **1.1 GET API 완성**
  - [ ] 실제 DB 쿼리 구현
  - [ ] 검색 기능 구현
  - [ ] 필터링 기능 구현  
  - [ ] 정렬 기능 구현
  - [ ] 페이징 기능 구현
  - [ ] 테스트 및 검증

- [ ] **1.2 타입 안전성 강화**
  - [ ] CreateInstructorRequest 타입 정의
  - [ ] UpdateInstructorRequest 타입 정의
  - [ ] Response 타입 정의
  - [ ] API 클라이언트 타입 적용
  - [ ] TypeScript 컴파일 확인

- [ ] **1.3 HTTP 메서드 통일**
  - [ ] API 엔드포인트 메서드 확정
  - [ ] 스토어 메서드 수정
  - [ ] 클라이언트 호출 수정
  - [ ] 동작 테스트

### Phase 2: 현대화 패턴 도입
- [ ] **2.1 React Query 적용**
  - [ ] 의존성 설치 확인
  - [ ] QueryClient 설정 확인
  - [ ] useInstructors 훅 구현
  - [ ] useCreateInstructor 훅 구현
  - [ ] useUpdateInstructor 훅 구현
  - [ ] useDeleteInstructor 훅 구현
  - [ ] 기존 컴포넌트 마이그레이션

- [ ] **2.2 에러 처리 시스템**
  - [ ] Error Boundary 구현
  - [ ] API 에러 핸들러 구현
  - [ ] Toast 알림 통합
  - [ ] 에러 로깅 시스템 구성

### Phase 3: 문서화 및 표준화
- [ ] **3.1 문서화**
  - [ ] API 스펙 문서 작성
  - [ ] 컴포넌트 문서 업데이트
  - [ ] README 업데이트

- [ ] **3.2 최종 검토**
  - [ ] 코드 리뷰 준비
  - [ ] 성능 테스트
  - [ ] 접근성 검사
  - [ ] 크로스 브라우저 테스트

---

## 🔍 품질 보증

### 완료 기준
**Phase 1 완료 조건:**
- [ ] `npx tsc --noEmit --strict` 통과 (0 errors)
- [ ] API 엔드포인트 모든 기능 동작
- [ ] 강사 CRUD 작업 완전 동작
- [ ] 검색/필터링/정렬 기능 동작

**Phase 2 완료 조건:**
- [ ] React Query 패턴 완전 적용
- [ ] 에러 상황에서도 안정적 동작
- [ ] 로딩 상태 적절히 표시
- [ ] 사용자 피드백 시스템 동작

**Phase 3 완료 조건:**
- [ ] 문서화 완료
- [ ] 코드 품질 기준 충족
- [ ] 배포 준비 완료

### 테스트 전략
1. **단위 테스트**: API 함수, 유틸리티 함수
2. **통합 테스트**: API 엔드포인트, React Query 훅
3. **E2E 테스트**: 강사 관리 전체 플로우
4. **성능 테스트**: 대용량 데이터 처리

---

## 📈 예상 성과

### 기능적 개선
- ✅ 완전한 강사 관리 기능 동작
- ✅ 타입 안전성 100% 보장
- ✅ 현대적 상태 관리 패턴 적용

### 개발 생산성 향상
- ⚡ 자동 캐싱으로 성능 개선
- 🐛 타입 체크로 버그 사전 방지  
- 🔄 낙관적 업데이트로 UX 향상

### 유지보수성 개선
- 📚 체계적인 문서화
- 🧪 테스트 가능한 코드 구조
- 🔧 확장 가능한 아키텍처

---

## 🚨 위험 요소 및 대응 방안

### 주요 위험 요소
1. **데이터베이스 스키마 변경**: tenant_memberships 구조 의존성
2. **기존 컴포넌트 영향**: React Query 도입 시 호환성
3. **성능 이슈**: 대용량 강사 데이터 처리

### 대응 방안
1. **점진적 마이그레이션**: 단계별 롤백 가능한 구조
2. **백워드 호환성 유지**: 기존 API 유지하며 새 API 추가
3. **성능 모니터링**: 각 단계별 성능 측정 및 최적화

---

## 📅 타임라인

| Phase | 작업 내용 | 예상 시간 | 의존성 |
|-------|----------|----------|---------|
| Phase 1.1 | GET API 완성 | 1.5시간 | 없음 |
| Phase 1.2 | 타입 안전성 강화 | 1시간 | 1.1 완료 |
| Phase 1.3 | HTTP 메서드 통일 | 0.5시간 | 1.1-1.2 완료 |
| Phase 2.1 | React Query 적용 | 2시간 | Phase 1 완료 |
| Phase 2.2 | 에러 처리 시스템 | 1시간 | 2.1 완료 |
| Phase 3 | 문서화 및 표준화 | 1시간 | Phase 2 완료 |

**총 예상 소요시간: 7시간**

---

## 📝 참고 자료

### 기술 문서
- [EduCanvas 개발 가이드](../core/CLAUDE.md)
- [TypeScript Safety Manual](../core/typescript-safety-manual.md)
- [API 구현 표준](../guides/api-development/industry-standard-api-implementation-guide.md)

### 관련 이슈
- T-V2-012: Instructor Management System
- 관련 코드베이스: Students 모듈 (참고용)

---

**문서 승인자:** Claude Code AI  
**다음 리뷰 일정:** Phase 1 완료 후  
**문서 버전 관리:** Git 기반