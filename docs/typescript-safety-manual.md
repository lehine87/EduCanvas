# TypeScript Zero-Error Manual

**목적**: EduCanvas 프로젝트의 영구적 TypeScript 타입 안전성 확보  
**원칙**: 모든 코드는 `npx tsc --noEmit --strict` 통과 필수  
**철학**: 타입 에러 = 보안 취약점

---

## 🚨 필수 체크리스트 (매 코드 작성시 확인)

### ✅ 코드 작성 전 (Pre-Development)
- [ ] **DB 스키마 최신화**: `npx supabase gen types typescript` 실행
- [ ] **타입 파일 확인**: `src/types/` 디렉터리에서 필요한 타입 존재 여부 확인
- [ ] **중복 타입 방지**: 새로운 타입 정의 전 기존 타입 검색

### ✅ 코드 작성 중 (During Development)  
- [ ] **Database-First**: 모든 데이터 타입은 `Database['public']['Tables']['테이블명']['Row']`부터 시작
- [ ] **Type-Guard 사용**: `unknown` 타입에 대해 타입 가드 함수 적용
- [ ] **any 금지**: 절대로 `any` 타입 사용 금지 (개발 디버그용도 제외)
- [ ] **null 안전성**: 옵셔널 체이닝(`?.`) 및 null 체크 필수

### ✅ 코드 작성 후 (Post-Development)
- [ ] **Strict Mode 검증**: `npx tsc --noEmit --strict` 실행하여 0개 에러 확인
- [ ] **타입 export**: 새로운 타입은 `src/types/index.ts`에 export 추가
- [ ] **문서화**: 복잡한 타입은 JSDoc 주석 필수

---

## 🚫 절대 금지 패턴 (Forbidden Patterns)

### 1. **Any 타입 사용 금지**
```typescript
❌ const data: any = await fetchData()
✅ const data: unknown = await fetchData()
   if (isValidData(data)) { ... }
```

### 2. **중복 타입 정의 금지**
```typescript
❌ interface Student { id: string } // 여러 파일에서 동일 정의
✅ import { Student } from '@/types'
```

### 3. **Database 무시 타입 정의 금지**  
```typescript
❌ interface Student { id: string, name: string } // DB 스키마 무시
✅ type Student = Database['public']['Tables']['students']['Row']
```

### 4. **직접 속성 접근 금지**
```typescript
❌ if (user.tenant_id) { ... } // null/undefined 위험
✅ if (hasTenantId(user)) { ... } // 타입 가드 사용
```

### 5. **타입 단언 남용 금지**
```typescript
❌ const user = data as User // 위험한 타입 강제 변환
✅ if (isUser(data)) { const user = data } // 타입 가드 우선
```

---

## ✅ 필수 사용 패턴 (Required Patterns)

### 1. **Database-First 타입 정의**
```typescript
✅ export type Student = Database['public']['Tables']['students']['Row']
✅ export type StudentInsert = Database['public']['Tables']['students']['Insert'] 
✅ export type StudentUpdate = Database['public']['Tables']['students']['Update']
```

### 2. **타입 가드 패턴**
```typescript
✅ export function isStudent(data: unknown): data is Student {
     return typeof data === 'object' && 
            data !== null && 
            'id' in data && 
            typeof (data as Student).id === 'string'
   }
```

### 3. **옵셔널 체이닝 패턴**
```typescript
✅ const name = user?.profile?.name ?? 'Unknown'
✅ if (user?.tenant_id) { ... }
```

### 4. **제네릭 타입 활용**
```typescript
✅ interface ApiResponse<T> {
     success: boolean
     data?: T
     error?: string
   }
```

### 5. **Union 타입 활용**  
```typescript
✅ type UserRole = 'system_admin' | 'admin' | 'instructor' | 'staff' | 'viewer'
```

---

## 🚑 응급처치 (타입 에러 발생시)

### 1단계: 에러 분석
```bash
npx tsc --noEmit --strict
# 에러 메시지에서 파일명, 라인, 에러 타입 확인
```

### 2단계: 패턴별 해결
- **"Property does not exist"** → 타입 가드 적용
- **"possibly null/undefined"** → 옵셔널 체이닝 적용  
- **"Type 'any' is not assignable"** → 구체적 타입 정의
- **"Argument of type X is not assignable"** → 타입 변환 또는 가드 적용

### 3단계: 재검증
```bash
npx tsc --noEmit --strict
# 0개 에러 확인 후 작업 완료
```

---

## 📚 빠른 참조표

### 자주 사용하는 타입들
```typescript
// 🎯 핵심 Entity 타입
Student = Database['public']['Tables']['students']['Row']
Class = Database['public']['Tables']['classes']['Row']  
UserProfile = Database['public']['Tables']['user_profiles']['Row']

// 🔐 권한 관련 타입
UserRole = 'system_admin' | 'admin' | 'instructor' | 'staff' | 'viewer'
Permission = { resource: Resource; action: Action; scope?: Scope }
Resource = 'student' | 'class' | 'payment' | 'attendance' | ...
Action = 'create' | 'read' | 'update' | 'delete' | 'list' | ...

// 🌐 API 관련 타입  
APIResponse<T> = { success: boolean; data?: T; error?: string }
PaginatedResponse<T> = { data: T[]; pagination: PaginationInfo }

// 🛠️ 유틸리티 타입
WithRequired<T, K> = T & Required<Pick<T, K>>
WithOptional<T, K> = Omit<T, K> & Partial<Pick<T, K>>
SafeRecord = Record<string, unknown>
```

### 타입 가드 함수들
```typescript
isStudent(data: unknown): data is Student
isUserProfile(data: unknown): data is UserProfile  
hasTenantId(profile: UserProfile): profile is UserProfile & { tenant_id: string }
hasRole(profile: UserProfile): profile is UserProfile & { role: UserRole }
```

---

## 🎯 성공 지표

**일일 체크**:
- ✅ `npx tsc --noEmit --strict` 결과: 0 errors
- ✅ 새로운 `any` 타입 사용: 0건
- ✅ 중복 타입 정의: 0건

**주간 체크**:  
- ✅ 타입 커버리지: 95% 이상
- ✅ 런타임 타입 에러: 0건
- ✅ 타입 관련 버그: 0건

---

## ⚡ 핵심 명령어

```bash
# 타입 검사
npx tsc --noEmit --strict

# DB 타입 업데이트  
npx supabase gen types typescript

# 전체 빌드 검증
npm run build

# 타입 관련 린트
npm run lint
```

---

**🔥 기억하세요**: 타입 에러는 단순한 컴파일 에러가 아닙니다. 미래의 런타임 버그이자 잠재적 보안 취약점입니다!