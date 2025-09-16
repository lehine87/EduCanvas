import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRouteValidation } from '@/lib/route-validation'
import {
  createSuccessResponse,
  createServerErrorResponse
} from '@/lib/api-response'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Class } from '@/types/class.types'

// 검색 쿼리 스키마 (업계 표준 Zod 검증)
const ClassSearchQuerySchema = z.object({
  search: z.string().optional().default(''),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  tenantId: z.string().uuid().optional()
})

type ClassSearchQuery = z.infer<typeof ClassSearchQuerySchema>

/**
 * GET /api/classes/search - 클래스 검색
 * 업계 표준: withRouteValidation 미들웨어 사용
 */
export const GET = withRouteValidation({
  querySchema: ClassSearchQuerySchema,
  requireAuth: true, // 인증 필수
  handler: async (req: NextRequest, { query, user }) => {
    try {
      const tenantId = query.tenantId || user.tenant_id

      if (!tenantId) {
        return createServerErrorResponse(
          'Tenant ID is required',
          new Error('TENANT_ID_MISSING')
        )
      }

      // 검색어가 없으면 빈 결과 반환
      if (!query.search.trim()) {
        return createSuccessResponse({
          classes: [],
          total: 0
        }, 'No search query provided')
      }

      // Service role 클라이언트로 데이터베이스 쿼리
      const supabase = createServiceRoleClient()

      // 클래스 검색 (업계 표준: PostgreSQL Full-text search)
      const { data: classes, error, count } = await supabase
        .from('classes')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .or(
          `name.ilike.%${query.search}%,description.ilike.%${query.search}%`
        )
        .order('name', { ascending: true })
        .limit(query.limit)

      if (error) {
        console.error('Class search error:', error)
        return createServerErrorResponse(
          'Failed to search classes',
          error
        )
      }

      // 각 클래스의 현재 등록 학생 수 계산 (업계 표준: 병렬 처리)
      const enrichedClasses = await Promise.all(
        (classes || []).map(async (cls: Class) => {
          // 현재 등록 학생 수 조회
          const { count: enrollmentCount } = await supabase
            .from('student_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)
            .eq('status', 'active')

          return {
            ...cls,
            student_count: enrollmentCount || 0
          }
        })
      )

      // 업계 표준 응답 형식
      return createSuccessResponse({
        classes: enrichedClasses,
        total: count || 0,
        metadata: {
          search_query: query.search,
          limit: query.limit,
          tenant_id: tenantId
        }
      }, 'Classes searched successfully')

    } catch (error) {
      console.error('Class search API error:', error)
      return createServerErrorResponse(
        'Internal server error',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})

/**
 * OPTIONS - CORS 프리플라이트 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}