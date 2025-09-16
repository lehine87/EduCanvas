import { NextRequest } from 'next/server'
import { withApiHandler, createSuccessResponse, createErrorResponse, validateRequestBody, logApiStart, logApiSuccess, logApiError } from '@/lib/api/utils'
import type { SalaryPolicy } from '@/types/salary.types'

const API_NAME = 'salary-policies'

/**
 * GET /api/salary/policies
 * 급여 정책 목록 조회
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id })

      try {
        // userProfile null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 401)
        }

        const { searchParams } = new URL(request.url)
        const isActive = searchParams.get('active')
        const policyType = searchParams.get('type')

        let query = supabase
          .from('salary_policies')
          .select('*')
          .eq('tenant_id', userProfile.tenant_id)
          .order('created_at', { ascending: false })

        if (isActive === 'true') {
          query = query.eq('is_active', true)
        }

        if (policyType) {
          query = query.eq('policy_type', policyType as any)
        }

        const { data: policies, error } = await query

        if (error) {
          logApiError(API_NAME, `급여 정책 조회 실패: ${error.message}`)
          return createErrorResponse('급여 정책 조회에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { count: policies?.length || 0 })

        return createSuccessResponse({
          policies: policies || []
        })

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse('급여 정책 조회 중 오류가 발생했습니다.', 500)
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}

/**
 * POST /api/salary/policies
 * 급여 정책 생성
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id, action: 'create' })

      try {
        // userProfile null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 401)
        }

        const body = await request.json()
        const validatedBody = validateRequestBody<Omit<SalaryPolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>(
          body,
          (data: unknown) => {
            const policy = data as any
            if (!policy.name || !policy.policy_type) {
              throw new Error('name과 policy_type은 필수입니다.')
            }

            // 정책 타입별 필수 필드 검증
            validatePolicyFields(policy)
            
            return policy
          }
        )

        if (validatedBody instanceof Response) {
          return validatedBody
        }

        // userProfile과 tenant_id null 체크
        if (!userProfile || !userProfile.tenant_id) {
          return createErrorResponse('인증 정보 또는 테넌트 정보가 없습니다.', 401)
        }

        const { type, ...rest } = validatedBody
        const policyData = {
          ...rest,
          policy_type: type,
          tenant_id: userProfile.tenant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        }

        const { data: newPolicy, error } = await supabase
          .from('salary_policies')
          .insert(policyData)
          .select()
          .single()

        if (error) {
          logApiError(API_NAME, `급여 정책 생성 실패: ${error.message}`)
          return createErrorResponse('급여 정책 생성에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { policyId: newPolicy.id, type: newPolicy.policy_type })

        return createSuccessResponse({
          policy: newPolicy
        }, '급여 정책이 생성되었습니다.')

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse(
          error instanceof Error ? error.message : '급여 정책 생성 중 오류가 발생했습니다.',
          500
        )
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}

/**
 * 급여 정책 필드 검증
 */
function validatePolicyFields(policy: any): void {
  switch (policy.policy_type) {
    case 'fixed_monthly':
      if (!policy.base_amount || policy.base_amount <= 0) {
        throw new Error('고정 월급제는 기본급이 필요합니다.')
      }
      break

    case 'fixed_hourly':
      if (!policy.hourly_rate || policy.hourly_rate <= 0) {
        throw new Error('시급제는 시급이 필요합니다.')
      }
      break

    case 'commission':
      if (!policy.commission_rate || policy.commission_rate <= 0 || policy.commission_rate > 100) {
        throw new Error('비율제는 0-100 사이의 수수료율이 필요합니다.')
      }
      if (!policy.commission_basis) {
        throw new Error('비율제는 수수료 기준(revenue/students/hours)이 필요합니다.')
      }
      break

    case 'tiered_commission':
      if (!policy.tiers || !Array.isArray(policy.tiers) || policy.tiers.length === 0) {
        throw new Error('누진 비율제는 구간 설정이 필요합니다.')
      }
      
      // 구간 검증
      const sortedTiers = policy.tiers.sort((a: any, b: any) => a.min_amount - b.min_amount)
      for (let i = 0; i < sortedTiers.length; i++) {
        const tier = sortedTiers[i]
        if (tier.min_amount < 0) {
          throw new Error('구간 최소 금액은 0 이상이어야 합니다.')
        }
        if (tier.commission_rate <= 0 || tier.commission_rate > 100) {
          throw new Error('구간 수수료율은 0-100 사이여야 합니다.')
        }
        if (i > 0 && tier.min_amount <= sortedTiers[i-1].min_amount) {
          throw new Error('구간 금액이 중복되거나 순서가 맞지 않습니다.')
        }
      }
      break

    case 'student_based':
      if (!policy.student_rate || policy.student_rate <= 0) {
        throw new Error('학생수 기준제는 학생당 단가가 필요합니다.')
      }
      if (policy.min_students && policy.max_students && policy.min_students > policy.max_students) {
        throw new Error('최소 학생수는 최대 학생수보다 작아야 합니다.')
      }
      break

    case 'hybrid':
      if (!policy.base_amount || policy.base_amount <= 0) {
        throw new Error('혼합형은 기본급이 필요합니다.')
      }
      if (!policy.commission_rate || policy.commission_rate <= 0 || policy.commission_rate > 100) {
        throw new Error('혼합형은 0-100 사이의 수수료율이 필요합니다.')
      }
      break

    case 'guaranteed_minimum':
      if (!policy.minimum_guaranteed || policy.minimum_guaranteed <= 0) {
        throw new Error('최저 보장제는 최소 보장액이 필요합니다.')
      }
      break

    default:
      throw new Error('지원하지 않는 급여 정책 타입입니다.')
  }

  // 공통 검증
  if (policy.minimum_guaranteed && policy.maximum_amount && 
      policy.minimum_guaranteed > policy.maximum_amount) {
    throw new Error('최소 보장액은 최대 지급액보다 작아야 합니다.')
  }
}