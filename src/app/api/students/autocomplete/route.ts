import { NextRequest } from 'next/server'
import { withRouteValidation, handleCorsPreflightRequest } from '@/lib/route-validation'
import { StudentAutocompleteSchema } from '@/schemas/student-search'
import { 
  createSuccessResponse,
  createServerErrorResponse 
} from '@/lib/api-response'
import { autocompleteStudentsService } from '@/services/student-service'

/**
 * 학생 자동완성 API - 업계 표준 구현
 * 
 * 기능:
 * - Prefix matching (PostgreSQL ILIKE)
 * - 빠른 응답 (<100ms)
 * - 이름/학부모명 검색
 * - Rate limiting
 */

/**
 * GET /api/students/autocomplete - 학생 자동완성
 * 
 * 쿼리 파라미터:
 * - query: 검색어 (필수)
 * - limit: 결과 개수 (기본 10개)
 * - include_parent: 학부모 이름 포함 여부 (기본 false)
 */
export const GET = withRouteValidation({
  querySchema: StudentAutocompleteSchema,
  requireAuth: true,
  rateLimitKey: 'students_autocomplete',
  handler: async (req: NextRequest, { query, user, timer }) => {
    try {
      // 서비스 레이어 호출
      const result = await autocompleteStudentsService({
        ...query,
        tenant_id: user.tenant_id
      })

      // 간단한 응답 (자동완성용)
      return createSuccessResponse({
        items: result,
        execution_time_ms: timer.getExecutionTime()
      })

    } catch (error) {
      console.error('Students autocomplete error:', error)
      return createServerErrorResponse(
        'Failed to autocomplete students',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * OPTIONS - CORS 프리플라이트 처리
 */
export const OPTIONS = () => handleCorsPreflightRequest()