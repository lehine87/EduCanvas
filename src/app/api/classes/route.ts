import { NextRequest, NextResponse } from 'next/server'
import { 
  ClassSearchSchema, 
  ClassCreateSchema,
  type ClassSearchRequest,
  type ClassCreateRequest 
} from '@/schemas/class-search'
import { 
  searchClassService, 
  createClassService 
} from '@/services/class-service'
import { 
  createPaginatedResponse,
  createSuccessResponse,
  createServerErrorResponse,
  createValidationErrorResponse,
  ExecutionTimer
} from '@/lib/api-response'
import { withApiHandler } from '@/lib/api/utils'

/**
 * 클래스 목록 조회 (업계 표준 구현)
 * GET /api/classes?search=수학&status=active&grade=중1&cursor=xxx&limit=20
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const timer = new ExecutionTimer()
      
      try {
        // URL 파라미터 파싱 및 검증
        const { searchParams } = new URL(request.url)
        const rawParams: ClassSearchRequest = {
          cursor: searchParams.get('cursor') || undefined,
          limit: parseInt(searchParams.get('limit') || '20'),
          search: searchParams.get('search') || undefined,
          status: (searchParams.get('status') as 'active' | 'inactive' | 'all') || 'all',
          grade: searchParams.get('grade') || undefined,
          course: searchParams.get('course') || undefined,
          subject: searchParams.get('subject') || undefined,
          instructor_id: searchParams.get('instructor_id') || undefined,
          classroom_id: searchParams.get('classroom_id') || undefined,
          sort_field: (searchParams.get('sort_field') as 'name' | 'created_at' | 'student_count' | 'grade') || 'name',
          sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
          include_students: searchParams.get('include_students') === 'true',
          include_instructor: searchParams.get('include_instructor') !== 'false',
          include_schedules: searchParams.get('include_schedules') === 'true'
        }

        // userProfile null 체크
        if (!userProfile) {
          return createValidationErrorResponse(
            [{ field: 'auth', message: '인증 정보가 없습니다.', code: 'required' }]
          )
        }

        // tenant_id null 체크
        if (!userProfile.tenant_id) {
          return createValidationErrorResponse(
            [{ field: 'tenant_id', message: '테넌트 정보가 없습니다.', code: 'required' }]
          )
        }

        // Zod 스키마 검증
        const parseResult = ClassSearchSchema.safeParse({
          ...rawParams,
          tenant_id: userProfile.tenant_id
        })

        if (!parseResult.success) {
          return createValidationErrorResponse(
            parseResult.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code
            }))
          )
        }

        const validatedParams = parseResult.data

        console.log('🔍 [API] 클래스 검색 시작:', {
          search: validatedParams.search,
          status: validatedParams.status,
          tenant_id: validatedParams.tenant_id
        })

        // Service Layer 호출
        const result = await searchClassService(validatedParams)

        // 필터 적용 정보 수집
        const filtersApplied: string[] = []
        if (validatedParams.search) filtersApplied.push('search')
        if (validatedParams.status !== 'all') filtersApplied.push('status')
        if (validatedParams.grade) filtersApplied.push('grade')
        if (validatedParams.course) filtersApplied.push('course')
        if (validatedParams.subject) filtersApplied.push('subject')
        if (validatedParams.instructor_id) filtersApplied.push('instructor')
        if (validatedParams.classroom_id) filtersApplied.push('classroom')

        console.log('✅ [API] 클래스 검색 완료:', {
          count: result.items.length,
          has_more: result.has_more,
          execution_time: timer.getExecutionTime()
        })

        // StandardApiResponse 형식으로 응답 반환 (업계 표준)
        return createSuccessResponse(
          {
            items: result.items,
            pagination: {
              cursor: result.next_cursor,
              has_more: result.has_more,
              total_count: result.total_count,
              per_page: validatedParams.limit
            },
            metadata: {
              filters_applied: filtersApplied,
              sort_applied: `${validatedParams.sort_field}:${validatedParams.sort_order}`,
              search_query: validatedParams.search,
              execution_time_ms: timer.getExecutionTime()
            }
          },
          '클래스 목록 조회 성공'
        )

      } catch (error) {
        console.error('❌ [API] 클래스 검색 에러:', error)
        return createServerErrorResponse(
          '클래스 목록 조회 실패',
          error instanceof Error ? error : new Error(String(error))
        )
      }
    },
    { 
      requireAuth: true,
      validateTenant: true 
    }
  )
}

/**
 * 새 클래스 생성 (업계 표준 구현)
 * POST /api/classes
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile }) => {
      try {
        // 요청 본문 파싱
        const body: unknown = await request.json()
        
        console.log('🎯 [API] 클래스 생성 시작:', body)

        // userProfile null 체크
        if (!userProfile) {
          return createValidationErrorResponse(
            [{ field: 'auth', message: '인증 정보가 없습니다.', code: 'required' }]
          )
        }

        // tenant_id null 체크
        if (!userProfile.tenant_id) {
          return createValidationErrorResponse(
            [{ field: 'tenant_id', message: '테넌트 정보가 없습니다.', code: 'required' }]
          )
        }

        // Zod 스키마 검증
        const parseResult = ClassCreateSchema.safeParse({
          ...body as ClassCreateRequest,
          tenant_id: userProfile.tenant_id
        })

        if (!parseResult.success) {
          return createValidationErrorResponse(
            parseResult.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code
            })),
            '클래스 생성 데이터가 올바르지 않습니다'
          )
        }

        const validatedData = parseResult.data

        // Service Layer 호출
        const result = await createClassService(validatedData, userProfile.id)

        if (!result.success) {
          if (result.error?.includes('이미 존재하는')) {
            return createValidationErrorResponse(
              [{ field: 'name', message: result.error }],
              result.error
            )
          }
          
          if (result.error?.includes('유효하지 않은 강사')) {
            return createValidationErrorResponse(
              [{ field: 'instructor_id', message: result.error }],
              result.error
            )
          }

          return createServerErrorResponse(
            result.error || '클래스 생성 실패'
          )
        }

        console.log('✅ [API] 클래스 생성 성공:', result.class?.id)

        return createSuccessResponse(
          { class: result.class },
          '클래스가 성공적으로 생성되었습니다',
          201
        )

      } catch (error) {
        console.error('❌ [API] 클래스 생성 에러:', error)
        return createServerErrorResponse(
          '클래스 생성 실패',
          error instanceof Error ? error : new Error(String(error))
        )
      }
    },
    { 
      requireAuth: true,
      validateTenant: true 
    }
  )
}