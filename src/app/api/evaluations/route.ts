import { NextRequest } from 'next/server'
import { withApiHandler, createSuccessResponse, createErrorResponse, validateRequestBody, logApiStart, logApiSuccess, logApiError } from '@/lib/api/utils'

const API_NAME = 'evaluations'

/**
 * GET /api/evaluations
 * 직원 평가 목록 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id })

      try {
        // userProfile과 tenant_id null 체크
        if (!userProfile || !userProfile.tenant_id) {
          return createErrorResponse('인증 정보 또는 테넌트 정보가 없습니다.', 401)
        }

        const { searchParams } = new URL(request.url)
        const membershipId = searchParams.get('membership_id')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        let query = supabase
          .from('staff_evaluations')
          .select(`
            *,
            membership:tenant_memberships!membership_id(
              user_profiles!inner(name, email)
            ),
            evaluator:tenant_memberships!evaluator_id(
              user_profiles!inner(name)
            )
          `)
          .eq('tenant_id', userProfile.tenant_id)
          .order('evaluation_date', { ascending: false })

        if (membershipId) {
          query = query.eq('membership_id', membershipId)
        }

        // 페이지네이션
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: evaluations, error, count } = await query.range(from, to)

        if (error) {
          logApiError(API_NAME, `평가 목록 조회 실패: ${error.message}`)
          return createErrorResponse('평가 목록 조회에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { count: evaluations?.length || 0 })

        return createSuccessResponse({
          evaluations: evaluations || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit)
          }
        })

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse('평가 목록 조회 중 오류가 발생했습니다.', 500)
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}

/**
 * POST /api/evaluations
 * 직원 평가 생성 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id, action: 'create' })

      try {
        const body = await request.json()
        const validatedBody = validateRequestBody<{
          membership_id: string
          evaluation_date: string
          content: string
          rating: number
          visibility?: string
        }>(
          body,
          (data: unknown) => {
            const evaluation = data as any
            if (!evaluation.membership_id || !evaluation.evaluation_date || !evaluation.content || !evaluation.rating) {
              throw new Error('필수 필드가 누락되었습니다.')
            }
            if (evaluation.rating < 1 || evaluation.rating > 5) {
              throw new Error('평점은 1-5 사이여야 합니다.')
            }
            return evaluation
          }
        )

        if (validatedBody instanceof Response) {
          return validatedBody
        }

        const { membership_id, evaluation_date, content, rating, visibility = 'admin_only' } = validatedBody

        // userProfile과 tenant_id null 체크
        if (!userProfile || !userProfile.tenant_id) {
          return createErrorResponse('인증 정보 또는 테넌트 정보가 없습니다.', 401)
        }

        // 평가 대상 직원이 현재 테넌트에 속하는지 확인
        const { data: membership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('id')
          .eq('id', membership_id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (membershipError || !membership) {
          return createErrorResponse('유효하지 않은 직원입니다.', 400)
        }

        // 평가자 확인
        const { data: evaluator, error: evaluatorError } = await supabase
          .from('tenant_memberships')
          .select('id')
          .eq('user_id', userProfile.id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (evaluatorError || !evaluator) {
          return createErrorResponse('평가자 정보를 찾을 수 없습니다.', 400)
        }

        // 평가 생성
        const evaluationData = {
          tenant_id: userProfile.tenant_id,
          membership_id,
          evaluator_id: evaluator.id,
          evaluation_date,
          content,
          rating,
          visibility,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: evaluation, error } = await supabase
          .from('staff_evaluations')
          .insert(evaluationData)
          .select()
          .single()

        if (error) {
          logApiError(API_NAME, `평가 생성 실패: ${error.message}`)
          return createErrorResponse('평가 생성에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { evaluationId: evaluation.id, membershipId: membership_id })

        return createSuccessResponse({
          evaluation
        }, '평가가 생성되었습니다.')

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse(
          error instanceof Error ? error.message : '평가 생성 중 오류가 발생했습니다.',
          500
        )
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}