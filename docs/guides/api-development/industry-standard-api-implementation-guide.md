# 업계 표준 API 구현 가이드

**작성일**: 2025-09-02  
**버전**: v1.0  
**목적**: EduCanvas 프로젝트를 위한 업계 표준 REST API 구현 메뉴얼  
**기반**: 2024년 최신 업계 표준 및 모범 사례

## 🎯 핵심 원칙

### 1. 아키텍처 패턴
```
Request → Route Validation → Service Layer → Database → Response
```

- **Route Layer**: 요청 검증, 인증/인가, Rate limiting
- **Service Layer**: 비즈니스 로직, 데이터 접근 추상화  
- **Database Layer**: 최적화된 쿼리, 인덱싱, Stored procedures

### 2. 표준화 우선순위
1. **Zod 스키마 검증** (런타임 타입 안전성)
2. **표준 응답 형식** (일관된 API 인터페이스)
3. **Cursor-based Pagination** (성능 최적화)
4. **PostgreSQL 최적화** (GIN 인덱스 + Stored procedures)
5. **포괄적 에러 핸들링** (사용자 친화적 메시지)

## 🚀 Phase별 구현 단계

### Phase 1: 아키텍처 설정

#### 1.1 Zod 스키마 정의
```typescript
// src/schemas/[entity]-search.ts
import { z } from 'zod'

export const EntitySearchSchema = z.object({
  // 페이지네이션 (필수)
  cursor: z.string().optional().describe('페이지네이션 커서'),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // 검색 (선택)
  search: z.string().min(2).max(100).optional(),
  
  // 필터링 (엔티티별 커스터마이징)
  status: z.union([z.string(), z.array(z.string())])
    .transform(val => Array.isArray(val) ? val : [val])
    .optional(),
  
  // 정렬
  sort_field: z.enum(['name', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  
  // 관계 포함
  include_relations: z.boolean().default(false)
})

export const EntityCreateSchema = z.object({
  name: z.string().min(1).max(100),
  // ... 엔티티별 필드
})

export const EntityUpdateSchema = EntityCreateSchema.partial()

export type EntitySearchParams = z.infer<typeof EntitySearchSchema>
export type EntityCreateData = z.infer<typeof EntityCreateSchema>
export type EntityUpdateData = z.infer<typeof EntityUpdateSchema>
```

#### 1.2 표준 응답 형식 설정
```typescript
// src/lib/api-response.ts (기존 파일 활용)
export interface StandardApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
  timestamp: string
  request_id?: string
}

export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMetadata
  metadata: {
    filters_applied: string[]
    sort_applied: string
    search_query?: string
    execution_time_ms?: number
  }
}

// 사용 예시
return createPaginatedResponse(items, paginationMeta, metadata)
return createSuccessResponse(data, message, statusCode)
return createServerErrorResponse(message, error)
```

### Phase 2: Database 최적화

#### 2.1 GIN 인덱스 생성
```sql
-- 전문 검색용 GIN 인덱스 (필수)
CREATE INDEX IF NOT EXISTS [table]_search_idx 
ON [table] 
USING gin(
  to_tsvector(
    'english', 
    coalesce([search_field_1], '') || ' ' || 
    coalesce([search_field_2], '') || ' ' || 
    coalesce([search_field_3], '')
  )
);

-- 필터링 최적화 (복합 인덱스)
CREATE INDEX IF NOT EXISTS [table]_filter_idx 
ON [table] (tenant_id, [filter_field], [status_field]);

-- 정렬 최적화
CREATE INDEX IF NOT EXISTS [table]_sort_idx 
ON [table] (tenant_id, [sort_field] DESC);
```

#### 2.2 Stored Procedures 구현
```sql
-- 전문 검색 함수
CREATE OR REPLACE FUNCTION search_[table]_fts(
  search_term text,
  tenant_uuid uuid,
  max_results integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  [field_1] text,
  [field_2] text,
  search_rank real
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_query tsquery;
BEGIN
  search_query := plainto_tsquery('english', search_term);
  
  IF search_query IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.[field_1],
    t.[field_2],
    ts_rank(
      to_tsvector('english', 
        coalesce(t.[search_field_1], '') || ' ' || 
        coalesce(t.[search_field_2], '')
      ),
      search_query
    ) as search_rank
  FROM [table] t
  WHERE t.tenant_id = tenant_uuid
    AND to_tsvector('english', 
          coalesce(t.[search_field_1], '') || ' ' || 
          coalesce(t.[search_field_2], '')
        ) @@ search_query
  ORDER BY search_rank DESC, t.[sort_field] ASC
  LIMIT max_results;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION search_[table]_fts TO authenticated;
```

### Phase 3: API Routes 구현

#### 3.1 Route Validation 설정
```typescript
// src/app/api/[entity]/route.ts
import { withRouteValidation } from '@/lib/route-validation'
import { EntitySearchSchema, EntityCreateSchema } from '@/schemas/[entity]-search'
import { 
  createPaginatedResponse, 
  createSuccessResponse,
  createServerErrorResponse 
} from '@/lib/api-response'

export const GET = withRouteValidation({
  querySchema: EntitySearchSchema,
  requireAuth: true,
  rateLimitKey: '[entity]_search',
  handler: async (req: NextRequest, { query, user, timer }) => {
    try {
      const result = await search[Entity]Service({
        ...query,
        tenant_id: user.tenant_id
      })

      const filtersApplied = []
      if (query.search) filtersApplied.push('search')
      if (query.status) filtersApplied.push('status')
      // ... 다른 필터들

      return createPaginatedResponse(
        result.items,
        {
          cursor: result.next_cursor,
          has_more: result.has_more,
          total_count: result.total_count,
          per_page: query.limit
        },
        {
          filters_applied: filtersApplied,
          sort_applied: `${query.sort_field}:${query.sort_order}`,
          search_query: query.search,
          execution_time_ms: timer.getExecutionTime()
        }
      )
    } catch (error) {
      return createServerErrorResponse(
        `Failed to search [entity]`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

export const POST = withRouteValidation({
  bodySchema: EntityCreateSchema,
  requireAuth: true,
  rateLimitKey: '[entity]_create',
  handler: async (req: NextRequest, { body, user }) => {
    try {
      const result = await create[Entity]Service({
        ...body,
        tenant_id: user.tenant_id,
        created_by: user.id
      })

      return createSuccessResponse(result, '[Entity] created successfully', 201)
    } catch (error) {
      return createServerErrorResponse(
        `Failed to create [entity]`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})
```

#### 3.2 개별 리소스 라우트 (선택)
```typescript
// src/app/api/[entity]/[id]/route.ts
export const GET = withRouteValidation({
  requireAuth: true,
  handler: async (req: NextRequest, { params, user }) => {
    const result = await get[Entity]ByIdService(
      params.id, 
      user.tenant_id,
      { include_relations: true }
    )
    
    if (!result.[entity]) {
      return new NextResponse(
        JSON.stringify({ error: '[Entity] not found' }),
        { status: 404 }
      )
    }

    return createSuccessResponse(result)
  }
})

export const PUT = withRouteValidation({
  bodySchema: EntityUpdateSchema,
  requireAuth: true,
  handler: async (req: NextRequest, { params, body, user }) => {
    const result = await update[Entity]Service(
      params.id,
      { ...body, tenant_id: user.tenant_id },
      user.id
    )

    return createSuccessResponse(result, '[Entity] updated successfully')
  }
})

export const DELETE = withRouteValidation({
  requireAuth: true,
  handler: async (req: NextRequest, { params, user }) => {
    await delete[Entity]Service(params.id, user.tenant_id, user.id)
    return new NextResponse(null, { status: 204 })
  }
})
```

### Phase 4: Service Layer 구현

#### 4.1 서비스 함수 구조
```typescript
// src/services/[entity]-service.ts
import { supabase } from '@/lib/supabase-client'

interface [Entity]SearchResult {
  items: [Entity][]
  next_cursor: string | null
  has_more: boolean
  total_count?: number
}

export async function search[Entity]Service(
  params: EntitySearchParams & { tenant_id: string }
): Promise<[Entity]SearchResult> {
  try {
    // 1. Full-text search (검색어가 있는 경우)
    if (params.search?.trim()) {
      return await search[Entity]WithFullText({
        tenant_id: params.tenant_id,
        search_term: params.search.trim(),
        ...params
      })
    }

    // 2. 필터링 검색 (일반 쿼리)
    return await search[Entity]WithFilters({
      tenant_id: params.tenant_id,
      ...params
    })

  } catch (error) {
    console.error('[Entity] search service error:', error)
    throw new Error(`Failed to search [entity]: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function search[Entity]WithFullText(params: {
  tenant_id: string
  search_term: string
  // ... 다른 파라미터
}): Promise<[Entity]SearchResult> {
  // Stored procedure 호출
  const { data: searchResults, error } = await supabase
    .rpc('search_[table]_fts', {
      search_term: params.search_term,
      tenant_uuid: params.tenant_id,
      max_results: params.limit + 1
    })

  if (error) {
    throw new Error(`Full-text search failed: ${error.message}`)
  }

  // 페이지네이션 처리
  const has_more = searchResults.length > params.limit
  const items = has_more ? searchResults.slice(0, -1) : searchResults

  return {
    items: items as [Entity][],
    next_cursor: has_more ? generateCursor(items[items.length - 1]) : null,
    has_more,
    total_count: searchResults.length
  }
}

async function search[Entity]WithFilters(params: {
  tenant_id: string
  // ... 필터 파라미터
}): Promise<[Entity]SearchResult> {
  let query = supabase
    .from('[table]')
    .select('*')
    .eq('tenant_id', params.tenant_id)

  // 동적 필터 적용
  if (params.status?.length) {
    query = query.in('status', params.status)
  }

  // Cursor-based pagination
  if (params.cursor) {
    const operator = params.sort_order === 'asc' ? 'gt' : 'lt'
    query = query[operator](params.sort_field, params.cursor)
  }

  // 정렬 및 제한
  query = query
    .order(params.sort_field, { ascending: params.sort_order === 'asc' })
    .limit(params.limit + 1)

  const { data, error } = await query

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  const has_more = data.length > params.limit
  const items = has_more ? data.slice(0, -1) : data

  return {
    items: items as [Entity][],
    next_cursor: has_more ? generateCursor(items[items.length - 1]) : null,
    has_more
  }
}

// CRUD 서비스 함수들
export async function create[Entity]Service(data: EntityCreateData & { tenant_id: string; created_by: string }) {
  // 비즈니스 로직 검증
  // DB 삽입
  // 결과 반환
}

export async function get[Entity]ByIdService(id: string, tenant_id: string, options = {}) {
  // 단일 조회 + 관계 포함
}

export async function update[Entity]Service(id: string, data: EntityUpdateData, updated_by: string) {
  // 업데이트 로직
}

export async function delete[Entity]Service(id: string, tenant_id: string, deleted_by: string) {
  // Soft delete 또는 hard delete
}
```

## 🛡️ 보안 및 성능 고려사항

### 보안
- **SQL Injection 방지**: Supabase 쿼리 빌더 사용
- **XSS 방지**: Zod 스키마 검증
- **Rate Limiting**: 엔드포인트별 제한
- **인증/인가**: JWT + RLS 정책

### 성능
- **인덱싱**: 검색/필터 필드에 적절한 인덱스
- **쿼리 최적화**: Stored procedures 활용
- **페이지네이션**: Cursor-based 방식
- **캐싱**: Redis 또는 메모리 캐시 (필요시)

## 📝 체크리스트

### Phase 1: 아키텍처 설정
- [ ] Zod 스키마 정의 (`src/schemas/[entity]-search.ts`)
- [ ] TypeScript 타입 정의
- [ ] 표준 응답 형식 확인

### Phase 2: Database 최적화  
- [ ] GIN 인덱스 생성
- [ ] 복합 인덱스 생성 (필터링용)
- [ ] Stored procedures 구현
- [ ] 권한 설정

### Phase 3: API Routes
- [ ] GET (검색/목록) 라우트
- [ ] POST (생성) 라우트  
- [ ] PUT (수정) 라우트
- [ ] DELETE (삭제) 라우트
- [ ] OPTIONS (CORS) 라우트

### Phase 4: Service Layer
- [ ] 검색 서비스 함수
- [ ] CRUD 서비스 함수들
- [ ] 에러 핸들링
- [ ] 비즈니스 로직 검증

### 검증
- [ ] `npx tsc --noEmit --strict` → 0 errors
- [ ] API 테스트 (Postman/Thunder Client)
- [ ] 성능 테스트 (응답 시간 확인)
- [ ] 보안 검증 (인증/인가 확인)

## 🎯 성공 지표

- **응답 시간**: < 100ms (검색), < 50ms (CRUD)
- **타입 안전성**: TypeScript 0 에러
- **API 일관성**: 모든 엔드포인트 표준 형식
- **확장성**: 새 엔티티 추가 시 30분 내 완성
- **보안**: RLS + 검증으로 완전 보호

---

**📖 참고**: 이 가이드는 T-V2-009 학생 검색 API 구현을 통해 검증된 업계 표준 방식입니다.