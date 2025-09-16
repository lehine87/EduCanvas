import { NextRequest } from 'next/server'
import { withApiHandler, createSuccessResponse, createErrorResponse, validateRequestBody, logApiStart, logApiSuccess, logApiError } from '@/lib/api/utils'
import type { SalaryPolicy } from '@/types/salary.types'

const API_NAME = 'salary-policy-detail'

/**
 * GET /api/salary/policies/[id]
 * 급여 정책 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id, policyId: id })

      try {
        // userProfile null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 401)
        }

        const { data: policy, error } = await supabase
          .from('salary_policies')
          .select('*')
          .eq('id', id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (error || !policy) {
          logApiError(API_NAME, `급여 정책 조회 실패: ${error?.message}`)
          return createErrorResponse('급여 정책을 찾을 수 없습니다.', 404)
        }

        logApiSuccess(API_NAME, { policyId: policy.id, type: policy.policy_type })

        return createSuccessResponse({
          policy
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
 * PUT /api/salary/policies/[id]
 * 급여 정책 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id, policyId: id, action: 'update' })

      try {
        // userProfile null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 401)
        }

        const body = await request.json()
        const validatedBody = validateRequestBody<Partial<SalaryPolicy>>(
          body,
          (data: unknown) => {
            const policy = data as any
            
            if (policy.policy_type) {
              validatePolicyFields(policy)
            }
            
            return policy
          }
        )

        if (validatedBody instanceof Response) {
          return validatedBody
        }

        // 기존 정책 존재 확인
        const { data: existingPolicy, error: findError } = await supabase
          .from('salary_policies')
          .select('*')
          .eq('id', id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (findError || !existingPolicy) {
          return createErrorResponse('급여 정책을 찾을 수 없습니다.', 404)
        }

        const updateData = {
          ...validatedBody,
          updated_at: new Date().toISOString()
        }

        const { data: updatedPolicy, error } = await supabase
          .from('salary_policies')
          .update(updateData)
          .eq('id', id)
          .eq('tenant_id', userProfile.tenant_id)
          .select()
          .single()

        if (error) {
          logApiError(API_NAME, `급여 정책 수정 실패: ${error.message}`)
          return createErrorResponse('급여 정책 수정에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { policyId: updatedPolicy.id })

        return createSuccessResponse({
          policy: updatedPolicy
        }, '급여 정책이 수정되었습니다.')

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse(
          error instanceof Error ? error.message : '급여 정책 수정 중 오류가 발생했습니다.',
          500
        )
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}

/**
 * DELETE /api/salary/policies/[id]
 * 급여 정책 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id, policyId: id, action: 'delete' })

      try {
        // userProfile null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 401)
        }

        // 해당 정책을 사용하는 강사가 있는지 확인
        const { data: instructorsUsingPolicy, error: checkError } = await supabase
          .from('tenant_memberships')
          .select('id, staff_info')
          .eq('tenant_id', userProfile.tenant_id)
          .eq('role', 'instructor')

        if (checkError) {
          return createErrorResponse('정책 사용 여부 확인에 실패했습니다.', 500)
        }

        const isInUse = instructorsUsingPolicy?.some(instructor => {
          const staffInfo = instructor.staff_info as any
          return staffInfo?.salary_info?.policy_id === id
        })

        if (isInUse) {
          return createErrorResponse('해당 정책을 사용하는 강사가 있어 삭제할 수 없습니다.', 400)
        }

        // 정책 삭제 (소프트 삭제 - is_active false로 변경)
        const { data: deletedPolicy, error } = await supabase
          .from('salary_policies')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('tenant_id', userProfile.tenant_id)
          .select()
          .single()

        if (error || !deletedPolicy) {
          logApiError(API_NAME, `급여 정책 삭제 실패: ${error?.message}`)
          return createErrorResponse('급여 정책 삭제에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { policyId: deletedPolicy.id })

        return createSuccessResponse({
          policy: deletedPolicy
        }, '급여 정책이 삭제되었습니다.')

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse('급여 정책 삭제 중 오류가 발생했습니다.', 500)
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}

/**
 * 급여 정책 필드 검증 (policies/route.ts와 동일)
 */
function validatePolicyFields(policy: any): void {
  switch (policy.policy_type) {
    case 'fixed_monthly':
      if (policy.base_amount !== undefined && (!policy.base_amount || policy.base_amount <= 0)) {
        throw new Error('고정 월급제는 기본급이 필요합니다.')
      }
      break

    case 'fixed_hourly':
      if (policy.hourly_rate !== undefined && (!policy.hourly_rate || policy.hourly_rate <= 0)) {
        throw new Error('시급제는 시급이 필요합니다.')
      }
      break

    case 'commission':
      if (policy.commission_rate !== undefined && 
          (!policy.commission_rate || policy.commission_rate <= 0 || policy.commission_rate > 100)) {
        throw new Error('비율제는 0-100 사이의 수수료율이 필요합니다.')
      }
      break

    case 'student_based':
      if (policy.student_rate !== undefined && (!policy.student_rate || policy.student_rate <= 0)) {
        throw new Error('학생수 기준제는 학생당 단가가 필요합니다.')
      }
      break

    case 'hybrid':
      if (policy.base_amount !== undefined && (!policy.base_amount || policy.base_amount <= 0)) {
        throw new Error('혼합형은 기본급이 필요합니다.')
      }
      if (policy.commission_rate !== undefined && 
          (!policy.commission_rate || policy.commission_rate <= 0 || policy.commission_rate > 100)) {
        throw new Error('혼합형은 0-100 사이의 수수료율이 필요합니다.')
      }
      break

    case 'guaranteed_minimum':
      if (policy.minimum_guaranteed !== undefined && 
          (!policy.minimum_guaranteed || policy.minimum_guaranteed <= 0)) {
        throw new Error('최저 보장제는 최소 보장액이 필요합니다.')
      }
      break
  }

  // 공통 검증
  if (policy.minimum_guaranteed && policy.maximum_amount && 
      policy.minimum_guaranteed > policy.maximum_amount) {
    throw new Error('최소 보장액은 최대 지급액보다 작아야 합니다.')
  }
}