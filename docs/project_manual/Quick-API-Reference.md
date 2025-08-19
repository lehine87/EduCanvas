# EduCanvas 빠른 API 참조 가이드

> **목적**: 자주 사용하는 API 패턴을 빠르게 참조하고 copy & paste로 바로 사용  
> **업데이트**: 2025-08-18  
> **테스트**: http://localhost:3006/api-test

## 🚀 **기본 CRUD 패턴 (20줄 버전)**

### ✅ **CREATE (생성)**

```typescript
export async function POST(request: NextRequest) {
  return withApiHandler(request, async ({ request, userProfile, supabase }) => {
    const body = await request.json()
    const data = createSchema.parse(body)
    
    if (!validateTenantAccess(userProfile!, data.tenantId)) {
      throw new Error('권한이 없습니다.')
    }
    
    const { tenantId, ...rest } = data
    const { data: result, error } = await supabase
      .from('table_name')
      .insert({ ...rest, tenant_id: tenantId })
      .select('*')
      .single()
    
    if (error) throw new Error(`생성 실패: ${error.message}`)
    return createSuccessResponse({ entity: result })
  }, { requireAuth: true })
}
```

### 📖 **READ (조회)**

```typescript
export async function GET(request: NextRequest) {
  return withApiHandler(request, async ({ request, userProfile, supabase }) => {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!validateTenantAccess(userProfile!, tenantId)) {
      throw new Error('권한이 없습니다.')
    }
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`조회 실패: ${error.message}`)
    return createSuccessResponse({ entities: data || [] })
  }, { requireAuth: true })
}
```

### ✏️ **UPDATE (수정)**

```typescript
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withApiHandler(request, async ({ request, userProfile, supabase }) => {
    const params = await context.params
    const body = await request.json()
    const data = updateSchema.parse(body)
    
    const { tenantId, ...updateFields } = data
    const { data: result, error } = await supabase
      .from('table_name')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single()
    
    if (error) throw new Error(`수정 실패: ${error.message}`)
    return createSuccessResponse({ entity: result })
  }, { requireAuth: true })
}
```

### 🗑️ **DELETE (삭제)**

```typescript
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withApiHandler(request, async ({ request, userProfile, supabase }) => {
    const params = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    // 소프트 삭제 (기본)
    const { data: result, error } = await supabase
      .from('table_name')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single()
    
    if (error) throw new Error(`삭제 실패: ${error.message}`)
    return createSuccessResponse({ entity: result })
  }, { requireAuth: true })
}
```

---

## 🏫 **클래스-교실 스케줄링 API**

### 🚀 **빠른 사용법**

#### **1. 초기 설정 (관리자 한 번만)**

```javascript
// 브라우저: http://localhost:3006/api-test → "초기 스케줄 설정" 클릭
const response = await fetch('/api/admin/setup-class-classroom', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
// ✅ 결과: { success: true, data: { classes_count: 5, schedules_created: 15 } }
```

#### **2. 오늘 스케줄 조회**

```javascript
const today = new Date().toISOString().split('T')[0]
const params = new URLSearchParams({
  tenantId: 'your-tenant-id',
  date: today,
  includeTemporary: 'true'
})

const response = await fetch(`/api/class-schedules?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const schedules = await response.json()
console.log('오늘 수업:', schedules.data.date_specific_schedules)
```

#### **3. 요일별 스케줄 조회**

```javascript
const params = new URLSearchParams({
  tenantId: 'your-tenant-id',
  dayOfWeek: 'monday' // monday, tuesday, wednesday, thursday, friday, saturday, sunday, all
})

const response = await fetch(`/api/class-schedules?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

#### **4. 특정 클래스/교실 스케줄**

```javascript
// 특정 클래스의 모든 스케줄
const params = new URLSearchParams({
  tenantId: 'your-tenant-id',
  classId: 'specific-class-id',
  dayOfWeek: 'all'
})

// 특정 교실의 사용 현황
const params2 = new URLSearchParams({
  tenantId: 'your-tenant-id',
  classroomId: 'specific-classroom-id'
})
```

### 📊 **응답 데이터 예시**

```json
{
  "success": true,
  "data": {
    "regular_schedules": [
      {
        "day_of_week": "monday",
        "classes": { "name": "수학 A반", "grade": "중1" },
        "classrooms": { "name": "101호", "capacity": 25 },
        "time_slots": { "name": "1교시", "start_time": "09:00", "end_time": "10:30" }
      }
    ],
    "temporary_changes": [
      {
        "change_date": "2025-08-19",
        "reason": "maintenance",
        "classes": { "name": "영어 B반" },
        "temporary_classroom": { "name": "202호" }
      }
    ],
    "summary": {
      "total_regular_schedules": 15,
      "total_temporary_changes": 1,
      "active_classrooms": 5
    }
  }
}
```

---

## ⚡ **빠른 테스트 방법**

### 🧪 **브라우저 테스트**

1. **접속**: http://localhost:3006/api-test
2. **로그인**: hanulsumin@naver.com / EduCanvas2025!462  
3. **테스트 순서**:
   - 📋 조회 테스트 (학생, 클래스, 교실 등)
   - ➕ 생성 테스트
   - ✏️ 수정 테스트 (드롭다운에서 선택)
   - 🗑️ 삭제 테스트
   - 🏫 스케줄 설정 → 스케줄 조회

### 📝 **필수 임포트**

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'
```

### 🔧 **Zod 스키마 예시**

```typescript
const createSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  is_active: z.boolean().default(true)
})

const updateSchema = createSchema.partial().extend({
  tenantId: z.string().uuid()
})
```

---

## 🚨 **자주 발생하는 오류 & 해결법**

### 1. **tenantId 매핑 오류**
```typescript
// ❌ 문제
const { data } = await supabase.from('table').insert(requestData)

// ✅ 해결
const { tenantId, ...rest } = requestData
const { data } = await supabase.from('table').insert({
  ...rest,
  tenant_id: tenantId  // 필수 매핑
})
```

### 2. **관계형 데이터 오류**
```typescript
// ❌ 문제: 존재하지 않는 관계
.select('*, classrooms:classroom_id (*)')

// ✅ 해결: 단순한 select 후 별도 조회
.select('*')
```

### 3. **권한 검증 누락**
```typescript
// ✅ 필수 패턴
if (!validateTenantAccess(userProfile!, tenantId)) {
  throw new Error('해당 테넌트에 접근할 권한이 없습니다.')
}
```

---

## 📚 **추가 리소스**

- **상세 문서**: `docs/project_manual/CRUD-API-Details.md`
- **타입 사전**: `docs/typescript-type-dictionary.md`
- **API 유틸리티**: `src/lib/api/utils.ts`
- **실시간 테스트**: http://localhost:3006/api-test

---

**💡 팁**: 복잡한 로직보다는 단순한 CRUD부터 완성하고 점진적으로 개선하세요!