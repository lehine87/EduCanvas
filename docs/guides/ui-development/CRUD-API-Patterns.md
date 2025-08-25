# EduCanvas CRUD API 상세 문서

> **작성일**: 2025-08-18  
> **상태**: ✅ 검증 완료 (모든 패턴 실제 테스트 통과)  
> **목적**: CRUD API 개발 시 상세한 템플릿과 고급 패턴 제공  
> **빠른 참조**: `Quick-API-Reference.md` 우선 확인 권장

## 📋 목차

> **⚡ 빠른 사용**: `Quick-API-Reference.md` 먼저 확인하세요!

1. [보안 및 설계 원칙](#보안-및-설계-원칙)
2. [상세 템플릿](#상세-템플릿)
3. [고급 패턴](#고급-패턴)
4. [에러 처리](#에러-처리)
5. [성능 최적화](#성능-최적화)
6. [디버깅 도구](#디버깅-도구)

---

## 기본 원칙

### 🔒 **Zero Trust Architecture**
- 모든 요청에 인증/권한 검증 필수
- 테넌트 격리 원칙 엄격 적용
- Database RLS + API 권한 검증 이중 보안

### 🎯 **Database-First 개발**
- 실제 DB 스키마 확인 후 개발: `npx supabase gen types typescript`
- 문서보다 실제 DB 구조가 정답
- 관계형 데이터는 FK 관계 실제 존재 여부 확인

### ⚡ **단순성 우선**
- 복잡한 관계 확인 로직 최소화
- 필수 기능부터 구현 후 점진적 개선
- 오류 발생 시 단순화가 해답

---

## 공통 구조

### 🏗️ **API Route 파일 구조**

```
src/app/api/
├── [entity]/
│   ├── route.ts           # GET (목록), POST (생성)
│   └── [id]/
│       └── route.ts       # GET (단일), PUT (수정), DELETE (삭제)
```

### 🔧 **공통 임포트**

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

### 📝 **표준 스키마 패턴**

```typescript
// 조회용 스키마 (URL 파라미터)
const getEntitiesSchema = z.object({
  tenantId: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional().nullable()
})

// 생성용 스키마
const createEntitySchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '이름은 필수입니다'),
  // ... 필수 필드들
  is_active: z.boolean().default(true)
})

// 수정용 스키마 (모든 필드 optional)
const updateEntitySchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '이름은 필수입니다').optional(),
  // ... 나머지 필드들 optional
})
```

---

## CREATE (생성) 패턴

### ✅ **검증된 CREATE 템플릿**

```typescript
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-entity', { userId: userProfile!.id })

      // 1. 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createEntitySchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const entityData: CreateEntityData = validationResult

      // 2. 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, entityData.tenantId)) {
        throw new Error('해당 테넌트에 리소스를 생성할 권한이 없습니다.')
      }

      // 3. 이름 중복 확인 (선택적)
      const { data: existingEntity } = await supabase
        .from('entities')
        .select('id')
        .eq('tenant_id', entityData.tenantId)
        .eq('name', entityData.name)
        .single()

      if (existingEntity) {
        throw new Error('이미 존재하는 이름입니다.')
      }

      // 4. 데이터 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restEntityData } = entityData
      const { data: newEntity, error } = await supabase
        .from('entities')
        .insert({
          ...restEntityData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('❌ 엔티티 생성 실패:', error)
        throw new Error(`엔티티 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-entity', { 
        entityId: newEntity.id,
        entityName: newEntity.name 
      })

      return createSuccessResponse(
        { entity: newEntity },
        '엔티티가 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}
```

### 🎯 **CREATE 핵심 포인트**

- **필수**: `tenantId` → `tenant_id` 매핑
- **권장**: 이름 중복 확인
- **필수**: 타임스탬프 자동 설정
- **추천**: 단순한 `select('*')` 사용

---

## READ (조회) 패턴

### 📖 **목록 조회 (GET /api/entities)**

```typescript
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-entities', { userId: userProfile!.id })

      // 1. URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        status: searchParams.get('status') || 'all',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search')
      }

      // 2. 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getEntitiesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetEntitiesParams = validationResult

      // 3. 테넌트 권한 검증 (시스템 관리자는 전체 접근)
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && params.tenantId && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 데이터에 접근할 권한이 없습니다.')
      }

      // 4. 쿼리 구성
      let query = supabase.from('entities').select('*')
      
      // 시스템 관리자가 아닌 경우에만 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

      // 상태 필터링
      if (params.status !== 'all') {
        const isActive = params.status === 'active'
        query = query.eq('is_active', isActive)
      }

      // 검색 기능
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%`)
      }

      const { data: entities, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 엔티티 목록 조회 실패:', error)
        throw new Error(`엔티티 목록 조회 실패: ${error.message}`)
      }

      const result = {
        entities: entities || [],
        total: entities?.length || 0
      }

      logApiSuccess('get-entities', { count: entities?.length || 0 })

      return createSuccessResponse(result)
    },
    {
      requireAuth: true
    }
  )
}
```

### 🔍 **단일 조회 (GET /api/entities/[id])**

```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-entity', { userId: userProfile!.id, entityId: params.id })

      // URL 파라미터에서 tenantId 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 데이터에 접근할 권한이 없습니다.')
      }

      // 단일 엔티티 조회
      const { data: entity, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('엔티티를 찾을 수 없습니다.')
        }
        console.error('❌ 엔티티 조회 실패:', error)
        throw new Error(`엔티티 조회 실패: ${error.message}`)
      }

      logApiSuccess('get-entity', { entityId: entity.id })

      return createSuccessResponse({ entity })
    },
    {
      requireAuth: true
    }
  )
}
```

---

## UPDATE (수정) 패턴

### ✏️ **검증된 UPDATE 템플릿**

```typescript
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-entity', { userId: userProfile!.id, entityId: params.id })

      // 1. 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateEntitySchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateEntityData = validationResult

      // 2. 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 데이터를 수정할 권한이 없습니다.')
      }

      // 3. 기존 엔티티 존재 확인
      const { data: existingEntity, error: fetchError } = await supabase
        .from('entities')
        .select('id, name, tenant_id')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 엔티티를 찾을 수 없습니다.')
        }
        throw new Error(`엔티티 조회 실패: ${fetchError.message}`)
      }

      // 4. 이름 중복 확인 (이름이 변경되는 경우만)
      if (updateData.name && updateData.name !== existingEntity.name) {
        const { data: duplicateEntity } = await supabase
          .from('entities')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('name', updateData.name)
          .neq('id', params.id)
          .single()

        if (duplicateEntity) {
          throw new Error('이미 존재하는 이름입니다.')
        }
      }

      // 5. tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 6. 엔티티 정보 업데이트
      const { data: updatedEntity, error } = await supabase
        .from('entities')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .select('*')
        .single()

      if (error) {
        console.error('❌ 엔티티 수정 실패:', error)
        throw new Error(`엔티티 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-entity', { 
        entityId: updatedEntity.id,
        entityName: updatedEntity.name 
      })

      return createSuccessResponse(
        { entity: updatedEntity },
        '엔티티 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}
```

---

## DELETE (삭제) 패턴

### 🗑️ **검증된 DELETE 템플릿 (단순화)**

```typescript
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-entity', { userId: userProfile!.id, entityId: params.id })

      // 1. URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 2. 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 데이터를 삭제할 권한이 없습니다.')
      }

      // 3. 기존 엔티티 존재 확인
      const { data: existingEntity, error: fetchError } = await supabase
        .from('entities')
        .select('id, name, is_active')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        console.error('❌ 엔티티 조회 실패:', fetchError)
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 엔티티를 찾을 수 없습니다.')
        }
        throw new Error(`엔티티 조회 실패: ${fetchError.message}`)
      }

      // 4. 삭제 실행
      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제
        const { error } = await supabase
          .from('entities')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 엔티티 삭제 실패:', error)
          throw new Error(`엔티티 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 상태를 'false'로 변경
        const { data: updatedEntity, error } = await supabase
          .from('entities')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 엔티티 상태 변경 실패:', error)
          throw new Error(`엔티티 상태 변경 실패: ${error.message}`)
        }

        result = { entity: updatedEntity, type: 'soft' }
      }

      logApiSuccess('delete-entity', { 
        entityId: params.id,
        entityName: existingEntity.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '엔티티가 완전히 삭제되었습니다.' 
          : '엔티티가 비활성화되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}
```

### ⚠️ **DELETE 핵심 포인트**

- **단순화 우선**: 복잡한 관계 확인 로직 제거
- **소프트 삭제**: 기본적으로 `is_active: false` 설정
- **하드 삭제**: `forceDelete=true` 파라미터로 완전 삭제
- **오류 로깅**: `console.error`로 상세 오류 기록

---

## 테스팅 가이드

### 🧪 **API 테스트 순서**

1. **브라우저에서 `/api-test` 접속**
2. **로그인**: `hanulsumin@naver.com` / `EduCanvas2025!462`
3. **조회 테스트**: 각 엔티티별 목록 조회
4. **생성 테스트**: 새 데이터 생성
5. **수정 테스트**: 드롭다운에서 선택 후 수정
6. **삭제 테스트**: 드롭다운에서 선택 후 삭제

### 📊 **성공 지표**

```bash
# 서버 로그에서 확인할 성공 패턴
✅ API 성공: create-entity { entityId: '...', entityName: '...' }
✅ API 성공: get-entities { count: N }
✅ API 성공: update-entity { entityId: '...', entityName: '...' }
✅ API 성공: delete-entity { entityId: '...', deleteType: 'soft' }
```

---

## 문제 해결

### 🚨 **자주 발생하는 오류**

#### 1. **관계형 데이터 오류**
```
Could not find a relationship between 'table1' and 'table2'
```
**해결**: 존재하지 않는 테이블 관계 제거
```typescript
// ❌ 문제: 존재하지 않는 관계
.select('*, classrooms:classroom_id (*)')

// ✅ 해결: 단순한 select
.select('*')
```

#### 2. **tenantId 매핑 오류**
```
Could not find the 'tenantId' column
```
**해결**: tenantId → tenant_id 매핑
```typescript
// ✅ 올바른 패턴
const { tenantId, ...restData } = inputData
const { data } = await supabase.from('table').insert({
  ...restData,
  tenant_id: tenantId  // 매핑 필수
})
```

#### 3. **Enum 값 불일치**
```
invalid input value for enum
```
**해결**: 실제 DB enum 값 확인
```typescript
// ❌ 잘못된 enum
z.enum(['fixed', 'hourly'])

// ✅ 올바른 enum (실제 DB 스키마 확인)
z.enum(['fixed_monthly', 'fixed_hourly', 'commission'])
```

### 🔧 **디버깅 도구**

#### DB 스키마 확인
```bash
npx supabase gen types typescript
```

#### 테이블 구조 확인
```javascript
const { data } = await supabase.from('table_name').select('*').limit(1)
console.log('테이블 구조:', data?.[0] ? Object.keys(data[0]) : '데이터 없음')
```

#### 관계 확인
```javascript
const { error } = await supabase.from('table1').select('*, table2(*)')
if (error) console.log('관계 오류:', error.message)
```

---

## 고급 패턴

### 🔄 **복합 관계 조회 패턴**

클래스-교실 스케줄링과 같은 복합 관계 시스템의 상세 구현 패턴입니다.

#### **관계형 데이터 조회**

```typescript
// 관계 테이블 포함 조회
const { data } = await supabase
  .from('class_classroom_schedules')
  .select(`
    id, day_of_week, effective_from,
    classes:class_id ( id, name, grade, course ),
    classrooms:classroom_id ( id, name, building, capacity ),
    time_slots:time_slot_id ( id, name, start_time, end_time )
  `)
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
```

#### **동적 필터링 구성**

```typescript
// 조건부 쿼리 체이닝
let query = supabase.from('schedules').select('*')

if (params.classId) query = query.eq('class_id', params.classId)
if (params.dayOfWeek !== 'all') query = query.eq('day_of_week', params.dayOfWeek)
if (params.date) {
  // 날짜 범위 필터링
  query = query.gte('effective_from', params.date)
         .or(`effective_until.is.null,effective_until.gte.${params.date}`)
}

const { data } = await query.order('day_of_week').order('start_time')
```

#### **실시간 데이터 병합**

```typescript
// 정규 스케줄 + 임시 변경사항 병합
const mergeSchedules = (regularSchedules, temporaryChanges, targetDate) => {
  let finalSchedules = [...regularSchedules]
  
  // 임시 변경으로 대체된 스케줄 제거
  const tempChangesForDate = temporaryChanges.filter(tc => tc.change_date === targetDate)
  
  tempChangesForDate.forEach(tempChange => {
    finalSchedules = finalSchedules.filter(
      schedule => !(schedule.class_id === tempChange.class_id && 
                   schedule.classroom_id === tempChange.original_classroom_id)
    )
    
    // 임시 스케줄 추가
    finalSchedules.push({
      ...tempChange,
      is_temporary: true,
      classroom: tempChange.temporary_classroom
    })
  })
  
  return finalSchedules.sort((a, b) => a.start_time.localeCompare(b.start_time))
}
```

### 🚀 **성능 최적화 패턴**

#### **배치 조회**

```typescript
// 여러 관련 데이터를 한번에 조회
const [classes, classrooms, timeSlots, schedules] = await Promise.all([
  supabase.from('classes').select('*').eq('tenant_id', tenantId),
  supabase.from('classrooms').select('*').eq('tenant_id', tenantId),
  supabase.from('time_slots').select('*').eq('tenant_id', tenantId),
  supabase.from('class_classroom_schedules').select('*').eq('tenant_id', tenantId)
])
```

#### **캐싱 활용**

```typescript
// 메모리 캐시 패턴
const scheduleCache = new Map()

const getCachedSchedule = async (tenantId, date) => {
  const cacheKey = `${tenantId}-${date}`
  
  if (scheduleCache.has(cacheKey)) {
    const cached = scheduleCache.get(cacheKey)
    if (Date.now() - cached.timestamp < 300000) { // 5분 캐시
      return cached.data
    }
  }
  
  const freshData = await fetchScheduleFromDB(tenantId, date)
  scheduleCache.set(cacheKey, {
    data: freshData,
    timestamp: Date.now()
  })
  
  return freshData
}
```

---

## 📚 **추가 리소스**

- **빠른 참조**: `docs/project_manual/Quick-API-Reference.md` ⭐
- **타입 정의**: `docs/typescript-type-dictionary.md`
- **데이터베이스 스키마**: `docs/database_schema_v4.1_updates.sql`
- **API 유틸리티**: `src/lib/api/utils.ts`
- **코딩 표준**: `docs/coding-standards.md`
- **실제 테스트 페이지**: http://localhost:3006/api-test

---

## ✅ **체크리스트**

새로운 CRUD API 개발 시 다음 체크리스트를 사용하세요:

### 개발 전
- [ ] DB 스키마 확인: `npx supabase gen types typescript`
- [ ] 기존 타입 정의 검색: `src/types/` 디렉터리
- [ ] 유사한 기존 API 참조

### 개발 중
- [ ] `withApiHandler` 사용
- [ ] Zod 스키마 정의
- [ ] `tenantId` → `tenant_id` 매핑
- [ ] 권한 검증 (`validateTenantAccess`)
- [ ] 오류 로깅 (`console.error`)

### 개발 후
- [ ] TypeScript 컴파일: `npx tsc --noEmit --strict`
- [ ] 빌드 테스트: `npm run build`
- [ ] API 테스트: `/api-test` 페이지에서 확인
- [ ] 로그 확인: 서버 콘솔에서 성공 메시지 확인

---

**💡 마지막 팁**: 복잡한 로직은 나중에 추가하고, 먼저 단순한 CRUD부터 완성하세요!