import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRouteValidation, handleCorsPreflightRequest } from '@/lib/route-validation'
import { StudentSearchSchema } from '@/schemas/student-search'
import { 
  createPaginatedResponse, 
  createValidationErrorResponse,
  createServerErrorResponse,
  createSuccessResponse 
} from '@/lib/api-response'
import type { Database } from '@/types/database.types'
import { searchStudentsService, createStudentService } from '@/services/student-service'

/**
 * 학생 API - 업계 표준 구현
 * 
 * 기능:
 * - Full-text search (PostgreSQL GIN 인덱스)
 * - 고도화된 필터링 (학년, 상태, 날짜 등) 
 * - Cursor-based pagination
 * - Zod validation
 * - 표준 에러 처리
 * - Rate limiting
 * - CORS 지원
 */

// Student Create Schema (업계 표준 스키마)
const StudentCreateSchema = z.object({
  name: z.string().min(1, '학생 이름은 필수입니다').max(100),
  student_number: z.string().min(1, '학번은 필수입니다').max(50),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  parent_name_1: z.string().optional(),
  parent_phone_1: z.string().optional(),
  parent_name_2: z.string().optional(),
  parent_phone_2: z.string().optional(),
  grade_level: z.string().optional(),
  school_name: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended']).default('active'),
  emergency_contact: z.record(z.string(), z.unknown()).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * GET /api/students - 학생 목록 조회 (업계 표준 구현)
 * 
 * 기능:
 * - Full-text search (PostgreSQL GIN 인덱스 활용)
 * - 고도화된 필터링 (학년, 상태, 날짜 등)
 * - Cursor-based pagination (성능 최적화)
 * - 실시간 통계
 * - Zod validation (Runtime 타입 안전성)
 * - 표준 에러 처리
 */
export const GET = withRouteValidation({
  querySchema: StudentSearchSchema,
  requireAuth: true,
  rateLimitKey: 'students_search',
  handler: async (req: NextRequest, context) => {
    const { query, user, timer } = context;
    try {
      // 서비스 레이어 호출 (비즈니스 로직 분리)
      const result = await searchStudentsService({
        ...query,
        tenant_id: user.tenant_id
      })

      // 메타데이터 생성 (API 사용량 분석용)
      const filtersApplied = []
      if (query.search) filtersApplied.push('search')
      if (query.grade) filtersApplied.push('grade')
      if (query.class_id) filtersApplied.push('class_id')
      if (query.status) filtersApplied.push('status')
      if (query.enrollment_date_from) filtersApplied.push('enrollment_date_from')
      if (query.enrollment_date_to) filtersApplied.push('enrollment_date_to')
      if (query.has_overdue_payment) filtersApplied.push('has_overdue_payment')
      if (query.attendance_rate_min) filtersApplied.push('attendance_rate_min')
      if (query.attendance_rate_max) filtersApplied.push('attendance_rate_max')

      const sortApplied = `${query.sort_field}:${query.sort_order}`

      // 표준 페이지네이션 응답 반환
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
          sort_applied: sortApplied,
          search_query: query.search,
          execution_time_ms: timer?.getExecutionTime() || 0
        }
      )

    } catch (error) {
      console.error('Students search error:', error)
      return createServerErrorResponse(
        'Failed to search students',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * POST /api/students - 학생 생성 (업계 표준 구현)
 */
export const POST = withRouteValidation({
  bodySchema: StudentCreateSchema,
  requireAuth: true,
  rateLimitKey: 'students_create',
  handler: async (req: NextRequest, context) => {
    const { body, user, timer } = context;
    try {
      if (!body) {
        return createValidationErrorResponse(
          [{ field: 'body', message: 'Request body is required' }],
          'Invalid request'
        )
      }
      
      if (!user.tenant_id) {
        return createValidationErrorResponse(
          [{ field: 'auth', message: 'Tenant access required' }],
          'Unauthorized'
        )
      }
      
      const createData = {
        ...body,
        tenant_id: user.tenant_id,
        created_by: user.id
      } as Database['public']['Tables']['students']['Insert'] & { tenant_id: string; created_by: string }
      
      const result = await createStudentService(createData)

      return createSuccessResponse(result, 'Student created successfully', 201)

    } catch (error) {
      console.error('Student creation error:', error)
      return createServerErrorResponse(
        'Failed to create student',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * OPTIONS - CORS 프리플라이트 처리 (업계 표준)
 */
export const OPTIONS = () => handleCorsPreflightRequest()