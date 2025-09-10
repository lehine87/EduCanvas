import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRouteValidation } from '@/lib/route-validation'
import { createSuccessResponse, createServerErrorResponse } from '@/lib/api-response'
import { searchStudentsWithFullText } from '@/services/student-service'

/**
 * 학생 검색 API (자동완성용)
 * GET /api/students/search?q=query&tenantId=xxx&limit=20
 */

const SearchQuerySchema = z.object({
  q: z.string().min(1, '검색어는 필수입니다'),
  tenantId: z.string().uuid().optional(),
  limit: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number()
  ]).optional().default(20)
})

export const GET = withRouteValidation({
  querySchema: SearchQuerySchema,
  requireAuth: true,
  handler: async (req: NextRequest, context) => {
    const { query, user } = context
    
    try {
      const tenantId = query.tenantId || user.tenant_id
      
      if (!tenantId) {
        return createServerErrorResponse(
          'Tenant ID is required',
          new Error('No tenant ID found')
        )
      }

      // Full-text search 호출
      const results = await searchStudentsWithFullText({
        tenant_id: tenantId,
        search_term: query.q,
        grade: undefined,
        status: undefined,
        sort_field: 'name',
        sort_order: 'asc',
        cursor: undefined,
        limit: query.limit
      })

      return createSuccessResponse({
        students: results.items || []
      })

    } catch (error) {
      console.error('Student search error:', error)
      return createServerErrorResponse(
        'Failed to search students',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
})