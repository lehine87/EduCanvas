# EduCanvas 타입 정합성 체크리스트

**버전**: v1.0  
**최종 업데이트**: 2025-08-14  
**목적**: T-008/T-009 이후 타입 불일치 방지 및 일관성 유지  

## 🎯 개발자 필수 준수 사항

### 📁 1. Database 타입 Import 표준

#### ✅ 올바른 패턴
```typescript
// 권장: 모든 곳에서 이 방식만 사용
import type { Database } from '@/types/database'

// 테이블 타입 사용
type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']  
type StudentUpdate = Database['public']['Tables']['students']['Update']

// Enum 타입 사용
type UserRole = Database['public']['Enums']['user_role']
type StudentStatus = Database['public']['Enums']['student_status']
```

#### ❌ 금지된 패턴
```typescript
// 절대 금지: 직접 import
import type { Database } from '@/types/database.types'

// 절대 금지: 파일별 중복 타입 정의
interface Student {
  id: string
  name: string
  // ... 중복 정의
}

// 절대 금지: 수동 Enum 정의  
type UserRole = 'admin' | 'user'  // Database Enum 사용하세요
```

### 🔗 2. Supabase Client 사용 표준

#### ✅ 올바른 클라이언트 사용
```typescript
// 브라우저/컴포넌트에서
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()  // SupabaseClient<Database> 반환
const { data, error } = await supabase.auth.signUp({...})

// 서버사이드에서
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()  // Server client
  const { data: { user } } = await supabase.auth.getUser()
}

// Service Role 사용 시
import { createServiceRoleClient } from '@/lib/db/supabase'

const supabaseServiceRole = createServiceRoleClient()  // Admin client
```

#### ❌ 금지된 패턴
```typescript
// 금지: 잘못된 import 경로
import { createClient } from '@supabase/supabase-js'  // 직접 import 금지

// 금지: 비동기로 잘못 처리
const supabase = await createClient()  // createClient는 동기함수

// 금지: 타입 단언 남용
const supabase = createClient() as any  // any 사용 금지
```

### 👥 3. 사용자 및 권한 타입 표준

#### ✅ UserProfile 표준 사용
```typescript
// 권한 시스템 관련 - auth.types.ts 사용
import type { UserProfile, UserRole } from '@/types/auth.types'

// 권한 체크, 인증, 테넌트 관리
const checkPermission = (user: UserProfile, action: string) => {
  // user.tenant_id, user.role 등 확장 필드 사용 가능
}

// 일반적인 CRUD - index.ts 사용  
import type { UserProfile } from '@/types'

// 단순한 사용자 정보 표시
const displayUser = (profile: UserProfile) => {
  return profile.name
}
```

#### ❌ 혼용 금지
```typescript
// 금지: 같은 파일에서 다른 소스의 UserProfile 혼용
import type { UserProfile } from '@/types/auth.types'
import type { UserProfile as BaseProfile } from '@/types'  // 혼란 야기
```

### 🧩 4. 컴포넌트 Import/Export 표준

#### ✅ 권한 컴포넌트 사용
```typescript
// 표준: index를 통한 일관된 import
import { 
  PermissionGuard, 
  RoleGuard, 
  TenantGuard 
} from '@/components/auth'

// 사용법
<PermissionGuard 
  resource="student" 
  action="read"
  fallback={<AccessDenied />}
>
  <StudentList />
</PermissionGuard>
```

#### ❌ 직접 import 금지
```typescript
// 금지: 컴포넌트 직접 import
import { PermissionGuard } from '@/components/auth/PermissionGuard'

// 금지: 존재하지 않는 컴포넌트
import { StudentWriteGuard } from '@/components/auth'  // 확인 필요
```

### 🔧 5. Hook 사용 표준

#### ✅ 권한 관련 Hook
```typescript
// 권한 체크
import { usePermissions } from '@/hooks/usePermissions'

const { hasPermission, canPerform } = usePermissions()
const canEdit = hasPermission('student', 'update')

// 테넌트 역할 관리
import { useTenantRole } from '@/hooks/useTenantRole' 

const { tenantRole, updateRole } = useTenantRole()
```

#### ❌ 타입 불일치 주의
```typescript
// 주의: Hook 반환 타입과 사용처 타입 일치 확인
const { user } = useAuth()  // UserProfile 타입 확인 필요
const hasAccess = checkPermission(user)  // 타입 호환성 확인
```

## 🏗️ API 개발 표준

### 📡 API Route 개발 체크리스트

#### ✅ 표준 API Route 구조
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/db/supabase'
import type { Database } from '@/types/database'  // 표준 import

export async function POST(request: NextRequest) {
  // 1. 클라이언트 생성 (올바른 타입)
  const supabase = createClient()
  
  // 2. 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 3. 입력 검증
  const body = await request.json()
  // Zod 스키마 사용 권장
  
  // 4. 권한 확인 (필요시)
  // 권한 확인 로직
  
  // 5. Service Role 작업 (필요시)
  const supabaseServiceRole = createServiceRoleClient()
  const { data, error } = await supabaseServiceRole
    .from('table_name')
    .insert(body)
  
  // 6. 응답
  return NextResponse.json({ success: true, data })
}
```

### 🔒 권한 확인 표준 패턴

#### ✅ 권한 체크 구현
```typescript
import { checkResourceAccess } from '@/lib/permissions/resourceAccess'
import type { UserProfile } from '@/types/auth.types'

// API 내에서 권한 확인
const userProfile: UserProfile = {
  id: user.id,
  // ... 필요한 필드들
}

const accessResult = await checkResourceAccess(
  userProfile,
  'student',
  'create'
)

if (!accessResult.granted) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## 📋 개발 워크플로우 체크리스트

### 🔍 코드 작성 전 체크리스트
- [ ] 사용할 타입이 어디서 import되는지 확인
- [ ] Database 타입은 `@/types/database`에서만 import
- [ ] UserProfile은 용도에 맞는 소스에서 import
- [ ] 새로운 컴포넌트는 적절한 index에서 export

### 🧪 코드 작성 후 체크리스트  
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 경고 없음
- [ ] 사용되지 않는 import 제거
- [ ] 타입 단언(`as`) 사용 최소화

### 🚀 커밋 전 체크리스트
- [ ] `npm run build` 성공
- [ ] 관련 테스트 통과
- [ ] 타입 변경 시 영향 범위 확인
- [ ] 문서 업데이트 (필요시)

## 🎯 타입 품질 지표

### ✅ 목표 지표
- TypeScript 컴파일 에러: **0개**
- ESLint 타입 관련 경고: **0개**
- 중복 타입 정의: **0개**
- `any` 타입 사용: **0개**
- 타입 가드 사용률: **90%+**

### 📊 모니터링 방법
```bash
# 빌드 체크
npm run build

# 린트 체크  
npm run lint

# 타입 체크만
npx tsc --noEmit

# 사용되지 않는 export 찾기
npx ts-unused-exports tsconfig.json
```

## 🚨 금지사항 (절대 하지 말 것)

1. **❌ 직접 database.types.ts import**
2. **❌ 동일한 엔티티에 대한 중복 타입 정의**
3. **❌ any 타입 사용 (타입 가드 사용하세요)**
4. **❌ 컴포넌트 직접 경로 import (index 사용)**
5. **❌ Supabase client 비동기 처리**
6. **❌ 권한 관련 타입과 일반 타입 혼용**

## 🔧 자주 발생하는 오류 해결법

### 타입 오류: "Property does not exist"
```typescript
// 문제: 타입 불일치
const user: UserProfile = getUser()
user.tenant_id  // 오류 발생

// 해결: 올바른 타입 사용
import type { UserProfile } from '@/types/auth.types'  // 확장 필드 포함
```

### 컴파일 오류: "Cannot find module"
```typescript
// 문제: 잘못된 import 경로
import type { Database } from '@/types/database.types'

// 해결: 표준 경로 사용
import type { Database } from '@/types/database'
```

### 런타임 오류: "auth is not defined"
```typescript
// 문제: 잘못된 클라이언트 사용
const supabase = await createClient()  // 비동기 처리

// 해결: 동기 처리
const supabase = createClient()
```

---

**이 체크리스트를 준수하여 타입 안전성과 코드 품질을 보장하세요!**