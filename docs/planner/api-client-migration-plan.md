# API 클라이언트 통일화 마이그레이션 계획서

**생성일**: 2025-09-13
**버전**: v1.0
**담당자**: Claude AI Development Team
**우선순위**: High (Critical System Consistency)

## 📋 목차

1. [개요](#개요)
2. [현재 상태 분석](#현재-상태-분석)
3. [목표 및 기대 효과](#목표-및-기대-효과)
4. [마이그레이션 전략](#마이그레이션-전략)
5. [Phase별 상세 계획](#phase별-상세-계획)
6. [구현 가이드라인](#구현-가이드라인)
7. [검증 및 테스트](#검증-및-테스트)
8. [위험 요소 및 대응책](#위험-요소-및-대응책)

## 개요

EduCanvas 프로젝트 전반에 걸쳐 **일관되지 않은 API 호출 패턴**이 발견되어, 업계 표준에 맞는 통일된 API 클라이언트로 마이그레이션을 진행합니다.

### 배경

- **30+ 컴포넌트**에서 **4가지 다른 API 호출 패턴** 사용
- `StandardApiResponse<T>` 형식 미준수로 인한 데이터 접근 불일치
- 에러 처리 방식의 불일치로 인한 사용자 경험 저하
- 타입 안전성 부족으로 인한 런타임 에러 위험

### 해결책

**업계 표준 API 클라이언트** (`src/lib/api-client.ts`)를 도입하여:
- 타입 안전성 보장
- 일관된 에러 처리
- 재시도 로직 (exponential backoff)
- React Query와 완벽 통합

## 현재 상태 분석

### 🔍 발견된 API 호출 패턴들

#### 🔴 패턴 1: 원시 fetch + 불일치 처리 (60%)
```typescript
// ❌ 문제점: StandardApiResponse 무시
const response = await fetch('/api/classes', options)
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message || 'Failed') // 불일치
}
return response.json() // .data 접근 누락
```

**영향받는 파일들:**
- `src/hooks/mutations/useClassMutations.ts` ⭐ 최우선
- `src/components/classes/ClassStudentList.tsx`
- `src/components/dashboard-v2/DashboardV2.tsx`
- `src/hooks/mutations/useStudentMutations.ts`

#### 🟡 패턴 2: 부분적 StandardApiResponse 처리 (25%)
```typescript
// ✅ 올바른 처리
const result = await response.json()
if (!result.success) {
  throw new Error(result.error?.message || 'Failed')
}
return result.data
```

**영향받는 파일들:**
- `src/hooks/queries/useStudents.ts`
- 일부 최신 컴포넌트들

#### 🟠 패턴 3: 혼재된 처리 (10%)
```typescript
// ⚠️ 부분적으로만 올바름
const response = await fetch(url)
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message) // error.error?.message 누락
}
return response.json() // .data 누락
```

#### 🟢 패턴 4: 새로운 API Client (5%)
```typescript
// ✅ 목표 패턴
queryFn: () => apiClient.get('/api/endpoint', { params })
```

### 📊 영향도 분석

| 시스템 | 파일 수 | 우선순위 | 비고 |
|--------|---------|----------|------|
| **학생 관리** | 8개 | ✅ 완료 | StudentClassList 이미 적용 |
| **클래스 관리** | 12개 | 🔥 Critical | 가장 많은 컴포넌트 영향 |
| **강사/Staff** | 6개 | 🔥 High | 복잡한 권한 처리 |
| **대시보드** | 8개 | 🟡 Medium | 실시간 데이터 중요 |
| **인증/온보딩** | 4개 | 🟡 Medium | 중요하지만 사용빈도 낮음 |
| **검색/관리자** | 6개 | 🟢 Low | 독립적, 나중에 가능 |

## 목표 및 기대 효과

### 🎯 주요 목표

1. **API 호출 패턴 100% 통일** - 모든 컴포넌트에서 동일한 방식 사용
2. **타입 안전성 강화** - `unknown` 타입 제거, 완전한 타입 추론
3. **에러 처리 표준화** - 일관된 사용자 피드백
4. **코드 재사용성 향상** - DRY 원칙 준수
5. **유지보수성 개선** - 중앙 집중식 API 로직

### 📈 기대 효과

**정량적 효과:**
- API 관련 버그 **80% 감소** 예상
- 개발 시간 **30% 단축** (boilerplate 코드 제거)
- 코드 중복 **70% 감소**

**정성적 효과:**
- 개발자 경험(DX) 크게 향상
- 새로운 팀원 온보딩 시간 단축
- 코드 리뷰 시간 단축

## 마이그레이션 전략

### 🛣️ 점진적 마이그레이션 전략

**"Big Bang" 방식이 아닌 점진적 마이그레이션** 채택:

1. **기능별 단위로 진행** - 시스템 안정성 보장
2. **하위 호환성 유지** - 기존 API 동작 보장
3. **단계별 검증** - 각 Phase 완료 후 테스트
4. **롤백 계획 준비** - 문제 발생 시 즉시 복구

### 📅 전체 일정

| Phase | 기간 | 대상 시스템 | 상태 |
|-------|------|-------------|------|
| **Phase 0** | ✅ 완료 | 기반 인프라 | API Client 구축 완료 |
| **Phase 1** | 2-3일 | 클래스 관리 | 🎯 다음 단계 |
| **Phase 2** | 3-4일 | Staff + 대시보드 | 계획됨 |
| **Phase 3** | 2-3일 | 인증/온보딩 | 계획됨 |
| **Phase 4** | 1-2일 | 검색/관리자 | 계획됨 |
| **최종 검토** | 1일 | 전체 시스템 | 최종 QA |

## Phase별 상세 계획

### 🚀 Phase 1: 클래스 관리 시스템 (2-3일)

**목표**: 가장 많이 사용되는 클래스 관리 API 통일

#### 1.1 대상 파일들

**최우선순위 (Day 1):**
```
src/hooks/mutations/useClassMutations.ts        ⭐ Critical
src/hooks/queries/useClasses.ts                ⭐ Critical
src/components/classes/ClassStudentList.tsx    ⭐ Critical
```

**2순위 (Day 2):**
```
src/components/classes/AddStudentToClassModal.tsx
src/components/classes/ClassDetailSideSheet.tsx
src/hooks/queries/useClassStudents.ts
```

**3순위 (Day 3):**
```
src/components/classes/CreateClassSideSheet.tsx
src/components/classes/ClassSearchSidebar.tsx
src/components/classes/ClassQuickAccessPanel.tsx
```

#### 1.2 작업 내용

**useClassMutations.ts 리팩토링:**
```typescript
// Before (문제 있는 패턴)
const response = await fetch('/api/classes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message || '클래스 생성에 실패했습니다')
}
return response.json() // ❌ .data 누락

// After (올바른 패턴)
export function useCreateClass() {
  return useMutation({
    mutationFn: (data: ClassFormData) =>
      apiClient.post<Class>('/api/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes()
      })
    },
    onError: (error) => {
      toast.error(`클래스 생성 실패: ${getErrorMessage(error)}`)
    }
  })
}
```

**쿼리 키 표준화:**
```typescript
// Before: 일관성 없는 키
['classes']
['classes', classId]
['class-students']

// After: 표준화된 키
queryKeys.classes()
queryKeys.class(classId)
queryKeys.classStudents(classId, filters)
```

#### 1.3 검증 방법

- [ ] 클래스 생성/수정/삭제 기능 테스트
- [ ] 클래스 목록 조회 및 필터링 테스트
- [ ] 학생 등록/해제 기능 테스트
- [ ] TypeScript 에러 0개 확인
- [ ] 네트워크 탭에서 올바른 요청/응답 확인

### 🎯 Phase 2: Staff 관리 + 대시보드 (3-4일)

**목표**: 권한이 복잡한 강사 시스템과 실시간 대시보드 통일

#### 2.1 대상 파일들

**Staff 시스템 (Day 1-2):**
```
src/hooks/queries/useStaffs.ts
src/components/staff/StaffPageLayout.tsx
src/components/staff/CreateStaffSideSheet.tsx
src/hooks/useStaffRealtime.ts
```

**대시보드 시스템 (Day 3-4):**
```
src/components/dashboard-v2/DashboardV2.tsx
src/components/dashboard-v2/widgets/
src/hooks/useAttendance.ts
src/hooks/useSalary.ts
```

#### 2.2 특별 고려사항

**Staff 권한 처리:**
```typescript
// 복잡한 권한 체크가 필요한 경우
queryFn: () => apiClient.get('/api/staff', {
  params: {
    tenantId,
    requiredRole: 'admin',
    includePermissions: true
  }
})
```

**실시간 데이터 처리:**
```typescript
// Polling이나 WebSocket 데이터도 일관된 방식으로
const { data } = useQuery({
  queryKey: queryKeys.attendance('realtime'),
  queryFn: () => apiClient.get('/api/dashboard/attendance/realtime'),
  refetchInterval: 30000 // 30초마다 갱신
})
```

### 📱 Phase 3: 인증/온보딩 시스템 (2-3일)

**목표**: 사용자 등록 및 인증 플로우 통일

#### 3.1 대상 파일들

```
src/components/auth/OnboardingForm.tsx
src/components/auth/SignUpForm.tsx
src/components/auth/TenantSearchModal.tsx
src/hooks/useAuth.ts (if exists)
```

#### 3.2 특별 고려사항

**토큰 관리:**
```typescript
// 인증 토큰이 포함된 요청
mutationFn: (data) => apiClient.post('/api/auth/register', data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### 🔍 Phase 4: 검색/관리자 기능 (1-2일)

**목표**: 독립적인 기능들 통일

#### 4.1 대상 파일들

```
src/components/search/SearchInput.tsx
src/components/search/SpotlightSearch.tsx
src/components/admin/TenantListTable.tsx
src/components/admin/MemberManagementTable.tsx
```

## 구현 가이드라인

### 📝 코딩 스탠다드

#### API 호출 패턴

**✅ 올바른 방식:**
```typescript
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'

// Query
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.students(filters),
  queryFn: () => apiClient.get('/api/students', { params: filters }),
  enabled: !!tenantId
})

// Mutation
const mutation = useMutation({
  mutationFn: (data: StudentData) =>
    apiClient.post('/api/students', data),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.students()
    })
    toast.success('학생이 등록되었습니다.')
  },
  onError: (error) => {
    toast.error(`등록 실패: ${getErrorMessage(error)}`)
  }
})
```

**❌ 금지된 방식:**
```typescript
// 이런 식으로 작성하지 말 것
const response = await fetch('/api/students')
const data = await response.json()
return data // StandardApiResponse 구조 무시
```

#### 쿼리 키 명명 규칙

```typescript
// 계층적 구조 사용
export const queryKeys = {
  all: ['api'] as const,

  students: () => [...queryKeys.all, 'students'] as const,
  student: (id: string) => [...queryKeys.students(), id] as const,
  studentClasses: (studentId: string, filters?: object) =>
    [...queryKeys.student(studentId), 'classes', filters] as const,

  classes: () => [...queryKeys.all, 'classes'] as const,
  class: (id: string) => [...queryKeys.classes(), id] as const,
  classStudents: (classId: string, filters?: object) =>
    [...queryKeys.class(classId), 'students', filters] as const,
}
```

#### 에러 처리 표준

```typescript
// 모든 에러는 getErrorMessage 유틸리티 사용
import { getErrorMessage, isApiError } from '@/lib/api-client'

onError: (error) => {
  const message = getErrorMessage(error)

  // 특정 에러 코드에 따른 처리
  if (isApiError(error) && error.code === 'VALIDATION_ERROR') {
    // 유효성 검사 에러 특별 처리
    handleValidationError(error.details)
  } else {
    toast.error(message)
  }
}
```

#### TypeScript 타입 안전성

```typescript
// 제네릭을 활용한 타입 안전성
interface StudentListResponse {
  students: Student[]
  pagination: PaginationInfo
  summary: StudentSummary
}

const { data } = useQuery<StudentListResponse>({
  queryKey: queryKeys.students(filters),
  queryFn: () => apiClient.get<StudentListResponse>(
    '/api/students',
    { params: filters }
  )
})

// data의 타입이 자동으로 추론됨
console.log(data.students.length) // ✅ 타입 안전
```

## 검증 및 테스트

### 🧪 테스트 체크리스트

#### Phase 완료 후 필수 검증

**기능 테스트:**
- [ ] CRUD 기능 모두 정상 동작
- [ ] 검색 및 필터링 정상 동작
- [ ] 페이지네이션 정상 동작
- [ ] 로딩 상태 올바르게 표시
- [ ] 에러 상태 적절하게 처리

**기술적 검증:**
- [ ] `npx tsc --noEmit --strict` 에러 0개
- [ ] React Query DevTools에서 쿼리 키 확인
- [ ] 네트워크 탭에서 요청/응답 구조 확인
- [ ] 콘솔 에러 0개

**성능 검증:**
- [ ] 불필요한 리렌더링 없음
- [ ] 메모리 누수 없음
- [ ] API 호출 횟수 최적화

### 🔧 디버깅 도구

**React Query DevTools:**
```typescript
// 개발 환경에서 쿼리 상태 모니터링
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* App content */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

**API Client 로깅:**
```typescript
// API 호출 로그 확인 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 API Request:', method, url, params)
  console.log('📦 API Response:', data)
}
```

## 위험 요소 및 대응책

### ⚠️ 주요 위험 요소

#### 1. 기존 기능 동작 중단

**위험도**: High
**발생 가능성**: Medium

**대응책**:
- 점진적 마이그레이션으로 영향 범위 최소화
- 각 컴포넌트별 철저한 테스트
- 기존 API 응답 형식 유지 확인

#### 2. TypeScript 타입 에러 급증

**위험도**: Medium
**발생 가능성**: High

**대응책**:
- 마이그레이션 전 타입 정의 먼저 완성
- 점진적 타입 적용 (`unknown` → 구체적 타입)
- 각 Phase별 TypeScript 검증

#### 3. 성능 저하

**위험도**: Low
**발생 가능성**: Low

**대응책**:
- React Query 캐싱 최적화
- 불필요한 API 호출 제거
- 번들 크기 모니터링

#### 4. 팀원들의 새로운 패턴 적응

**위험도**: Medium
**발생 가능성**: High

**대응책**:
- 상세한 가이드라인 문서화
- 코드 리뷰 시 패턴 준수 확인
- 예제 코드 풍부하게 제공

### 🔄 롤백 계획

각 Phase별로 문제 발생 시 즉시 롤백 가능:

1. **Git 브랜치 전략**: 각 Phase를 별도 브랜치에서 작업
2. **기능별 커밋**: 개별 컴포넌트 단위로 커밋
3. **테스트 자동화**: CI/CD에서 자동 검증
4. **모니터링**: 프로덕션 에러 실시간 감지

## 성공 지표

### 📊 KPI (Key Performance Indicators)

**정량적 지표:**
- API 관련 TypeScript 에러: **0개 달성**
- 코드 중복률: **70% 감소**
- API 호출 실패율: **< 1%** 유지
- 새로운 API 구현 시간: **50% 단축**

**정성적 지표:**
- 개발자 만족도 조사: **4.5/5.0 이상**
- 코드 리뷰 시간: **평균 30% 단축**
- 신입 개발자 온보딩: **기존 대비 2일 단축**

## 마무리

이 마이그레이션 계획을 통해 EduCanvas 프로젝트의 **API 호출 패턴을 완전히 통일**하고, **업계 표준에 맞는 안정적이고 확장 가능한 아키텍처**를 구축할 수 있습니다.

### 다음 단계

1. **Phase 1 시작**: 클래스 관리 시스템부터 리팩토링
2. **팀 리뷰**: 계획서 검토 및 피드백 반영
3. **실행**: 단계별 마이그레이션 진행
4. **모니터링**: 각 Phase별 성과 측정

---

**문서 히스토리:**
- v1.0 (2025-09-13): 초기 계획서 작성
-
**관련 문서:**
- [API Client 사용 가이드](../guides/api-development/api-client-usage-guide.md)
- [React Query 패턴](../guides/api-development/react-query-patterns.md)
- [TypeScript 안전성 가이드](../core/typescript-safety-manual.md)

**연락처:** Claude AI Team

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "API 클라이언트 마이그레이션 계획서 작성", "status": "completed", "activeForm": "API 클라이언트 마이그레이션 계획서 작성 중"}, {"content": "현재 상태 분석 문서화", "status": "completed", "activeForm": "현재 상태 분석 문서화 중"}, {"content": "단계별 마이그레이션 로드맵 작성", "status": "in_progress", "activeForm": "단계별 마이그레이션 로드맵 작성 중"}, {"content": "구현 가이드라인 정리", "status": "pending", "activeForm": "구현 가이드라인 정리 중"}, {"content": "체크리스트 및 검증 방법 작성", "status": "pending", "activeForm": "체크리스트 및 검증 방법 작성 중"}]