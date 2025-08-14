# EduCanvas 타입 불일치 종합 감사 보고서

**생성일**: 2025-08-14  
**버전**: v1.0  
**스코프**: T-008, T-009 권한 관리 시스템 구현 후 발생한 타입 불일치  
**심각도**: Critical - 빌드 실패 및 런타임 오류 발생  

## 🚨 요약

T-008(RBAC 구현), T-009(RLS 정책 수립) 작업으로 인해 타입 시스템에 심각한 불일치가 발생했습니다. 이전까지 완벽했던 타입 안정성이 권한 관리 시스템 추가로 인해 여러 지점에서 불일치를 보이고 있습니다.

## 📊 불일치 현황 요약

| 카테고리 | 불일치 건수 | 심각도 | 예상 수정 시간 |
|----------|-------------|---------|----------------|
| **Database 타입 Import** | 23건 | 🔴 Critical | 2시간 |
| **Supabase Client 타입** | 12건 | 🔴 Critical | 1시간 |
| **컴포넌트 Export/Import** | 8건 | 🟡 High | 1시간 |
| **중복 타입 정의** | 15건 | 🟡 High | 1.5시간 |
| **API Routes 타입** | 6건 | 🟡 High | 1시간 |
| **Hook 타입 불일치** | 4건 | 🟢 Medium | 0.5시간 |

**총 불일치**: 68건  
**예상 수정 시간**: 7시간  

## 🔴 Critical 레벨 불일치

### 1. Database 타입 Import 경로 불일치 (23건)

#### 1.1 Import 경로 혼재 패턴
```typescript
// Pattern A (15곳) - 권장 표준
import type { Database } from '@/types/database'

// Pattern B (8곳) - 변경 필요
import type { Database } from '@/types/database.types'
```

#### 1.2 영향받는 파일들
**Pattern B 사용 (수정 필요)**:
- `src/app/api/auth/signup/route.ts` - API route
- `src/utils/typeGuards.ts` - 유틸리티
- `src/utils/typeGuards.test.ts` - 테스트
- `src/types/billing.ts` - 빌링 타입 (Json 타입만)
- `src/types/salary.ts` - 급여 타입 (Json 타입만)
- `src/types/index.ts` - 메인 타입 (기존 re-export)
- `src/types/database.ts` - 기존 re-export
- `src/types/database-v4.1.ts` - v4.1 확장

**Pattern A 사용 (표준)**:
- 모든 권한 관리 파일들 (`rbac.ts`, `tenantRoles.ts`, `resourceAccess.ts`)
- 대부분의 컴포넌트 및 Hook 파일들
- Supabase client 설정 파일들

#### 1.3 문제점
- 빌드 시 일부 파일에서 Database 타입을 찾지 못함
- 타입 정의 불일치로 인한 프로퍼티 접근 오류
- IDE 자동완성 불일치

### 2. Supabase Client 타입 불일치 (12건)

#### 2.1 주요 오류
```typescript
// 현재 오류 발생하는 패턴
const supabase = createClient()
const { data: authData, error: authError } = await supabase.auth.signUp({
//                                                            ^^^ 
// Property 'auth' does not exist on type 'Promise<SupabaseClient<...>'
```

#### 2.2 문제 파일들
- `src/app/api/auth/signup/route.ts:40` - 회원가입 API
- `src/app/api/auth/login/route.ts` - 로그인 API  
- `src/app/api/auth/reset-password/route.ts` - 비밀번호 리셋
- `src/components/auth/LoginForm.tsx` - 로그인 폼
- `src/components/auth/SignUpForm.tsx` - 회원가입 폼

#### 2.3 원인 분석
```typescript
// src/lib/supabase/client.ts 분석 결과
export const createClient = () => {
  // ... 환경변수 검증
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    // ... 설정
  })
}
```

**원인**: `createClient()` 함수는 동기적으로 `SupabaseClient`를 반환하는데, 일부 곳에서 비동기 처리로 잘못 인식됨

#### 2.4 미들웨어 타입 불일치
```typescript
// src/middleware.ts에서 발견된 문제
async function getUserProfile(
  supabase: ReturnType<typeof createClient>, // 올바른 타입
  requestId: string
): Promise<UserProfile | null>
```

### 3. 중복 타입 정의 (15건)

#### 3.1 UserProfile 타입 중복
```typescript
// src/types/index.ts
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// src/types/auth.types.ts  
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  // 추가 필드들...
}
```

**충돌**: 권한 시스템에서 `auth.types.ts` 버전 사용, 다른 곳에서는 `index.ts` 버전 사용

#### 3.2 핵심 엔티티 타입 중복
- `Student`: `index.ts`, `api.ts`, `student.types.ts`에서 각각 정의
- `Class`: `index.ts`, `api.ts`, `app.types.ts`에서 중복
- `Tenant`: `index.ts`, `auth.types.ts`에서 중복
- `Instructor`: `index.ts`에만 존재하지만 `auth.types.ts`에서 참조 시도

#### 3.3 Enum 타입 불일치
```typescript
// src/types/database.ts
export type UserRole = 'system_admin' | 'admin' | 'instructor' | 'staff' | 'viewer'

// src/types/auth.types.ts에서 사용하려고 시도
export type UserRole = Database['public']['Enums']['user_role']
//                      ^^^ 실제로는 수동 정의된 타입과 충돌
```

## 🟡 High 레벨 불일치

### 4. 컴포넌트 Export/Import 불일치 (8건)

#### 4.1 누락된 컴포넌트 Export
```typescript
// src/app/test-auth/page.tsx
import { PermissionGuard, StudentWriteGuard, AdminOnly } from '@/components/auth'
//                        ^^^^^^^^^^^^^^^^
// 'StudentWriteGuard' is not exported from '@/components/auth'
```

#### 4.2 @/components/auth/index.ts 분석 필요
현재 export 현황 조사 필요:
- `PermissionGuard` - ✅ 존재
- `StudentWriteGuard` - ❌ 누락
- `AdminOnly` - ❓ 확인 필요

#### 4.3 권한 가드 컴포넌트 불일치
T-008에서 추가된 권한 컴포넌트들이 제대로 export되지 않음:
- Resource-level 가드들
- Role-based 가드들  
- Tenant-specific 가드들

### 5. API Routes 타입 불일치 (6건)

#### 5.1 Request/Response 타입 불일치
```typescript
// API routes에서 발견된 패턴
import type { Database } from '@/types/database.types'  // ❌ 
// vs
import type { Database } from '@/types/database'        // ✅
```

#### 5.2 Middleware 타입 체이닝 문제
```typescript
// middleware.ts에서 권한 체크 시 타입 불일치
const userProfile: UserProfile | null  // auth.types.ts 버전 사용
// vs  
const routeConfig = ROUTE_PERMISSIONS[pathname]  // index.ts 버전 기대
```

## 🟢 Medium 레벨 불일치

### 6. Hook 타입 불일치 (4건)

#### 6.1 useAuth Hook 반환 타입
```typescript
// 현재 useAuth에서 반환하는 UserProfile과
// 권한 시스템에서 기대하는 UserProfile 불일치
```

#### 6.2 권한 관련 Hook들
- `usePermissions` - 권한 타입 불일치
- `useTenantRole` - 테넌트 역할 타입 불일치
- `useResourceAccess` - 리소스 접근 타입 불일치

## 📋 해결 우선순위 및 로드맵

### 🔥 즉시 수정 (Critical)
1. **Database 타입 Import 통일** (2시간)
   - 모든 파일을 `@/types/database` 경로로 표준화
   - `database.types.ts` 직접 import 제거
   
2. **Supabase Client 타입 수정** (1시간)
   - `createClient()` 반환 타입 명시적 정의
   - 비동기 처리 오해 제거

### ⚡ 우선 수정 (High)
3. **중복 타입 정의 통합** (1.5시간)
   - `UserProfile` 타입 단일화
   - 핵심 엔티티 타입 중앙집중화
   
4. **컴포넌트 Export 수정** (1시간)
   - 누락된 권한 컴포넌트 export 추가
   - index 파일들 정리

### 🔧 후속 수정 (Medium)  
5. **API Routes 정리** (1시간)
   - 일관된 타입 import
   - Request/Response 타입 표준화
   
6. **Hook 타입 통일** (0.5시간)
   - 권한 관련 Hook 타입 정합성

## 🎯 성공 기준

### 즉시 달성 목표
- [ ] TypeScript 컴파일 에러 0개
- [ ] `npm run build` 성공  
- [ ] Database 타입 import 경로 100% 통일

### 장기 목표
- [ ] ESLint 타입 관련 경고 0개
- [ ] 중복 타입 정의 0개
- [ ] 컴포넌트 import 오류 0개
- [ ] 타입 안전성 95% 이상

## 🔍 추가 조사 필요 사항

1. **database.types.ts vs database.ts 차이점 정확한 분석**
2. **권한 시스템에서 사용하는 UserProfile 확장 필드 목록**  
3. **누락된 컴포넌트들의 실제 존재 여부 및 위치**
4. **Supabase client 생성 함수들의 반환 타입 일관성**
5. **테스트 파일들의 타입 import 패턴**

---

**다음 단계**: Phase 2 - Database 타입 시스템 통합 작업 진행