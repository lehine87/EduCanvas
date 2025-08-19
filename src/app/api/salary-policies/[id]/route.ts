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

// 급여정책 수정 스키마
const updateSalaryPolicySchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '정책 이름은 필수입니다').optional(),
  policy_type: z.enum(['fixed_monthly', 'fixed_hourly', 'commission', 'tiered_commission', 'student_based', 'hybrid', 'guaranteed_minimum']).optional(),
  instructor_id: z.string().uuid().optional(),
  base_amount: z.number().min(0).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  tier_config: z.record(z.any()).optional(),
  is_active: z.boolean().optional()
})

type UpdateSalaryPolicyData = z.infer<typeof updateSalaryPolicySchema>

/**
 * 특정 급여정책 조회
 * GET /api/salary-policies/[id]?tenantId=xxx
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-salary-policy', { userId: userProfile!.id, policyId: params.id })

      // URL 파라미터에서 tenantId 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 급여정책 정보에 접근할 권한이 없습니다.')
      }

      // 급여정책 정보 조회
      const { data: salaryPolicy, error } = await supabase
        .from('salary_policies')
        .select(`
          *,
          instructors:instructor_id (
            id,
            name,
            email,
            status,
            hire_date,
            specialization
          )
        `)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('급여정책을 찾을 수 없습니다.')
        }
        console.error('❌ 급여정책 조회 실패:', error)
        throw new Error(`급여정책 조회 실패: ${error.message}`)
      }

      // 정책 유효성 상태 계산
      const now = new Date()
      const effectiveFrom = salaryPolicy.effective_from ? new Date(salaryPolicy.effective_from) : null
      const effectiveUntil = salaryPolicy.effective_until ? new Date(salaryPolicy.effective_until) : null
      
      const isCurrentlyEffective = (!effectiveFrom || effectiveFrom <= now) && 
                                  (!effectiveUntil || effectiveUntil >= now)

      const result = {
        ...salaryPolicy,
        is_currently_effective: isCurrentlyEffective
      }

      logApiSuccess('get-salary-policy', { policyId: salaryPolicy.id })

      return createSuccessResponse({ salary_policy: result })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 급여정책 정보 수정
 * PUT /api/salary-policies/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-salary-policy', { userId: userProfile!.id, policyId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateSalaryPolicySchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateSalaryPolicyData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 급여정책 정보를 수정할 권한이 없습니다.')
      }

      // 기존 급여정책 존재 확인
      const { data: existingPolicy, error: fetchError } = await supabase
        .from('salary_policies')
        .select('id, name, tenant_id, instructor_id, policy_type')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 급여정책을 찾을 수 없습니다.')
        }
        throw new Error(`급여정책 조회 실패: ${fetchError.message}`)
      }

      // 정책명 중복 확인 (이름이 변경되는 경우만)
      if (updateData.name && updateData.name !== existingPolicy.name) {
        const { data: duplicatePolicy } = await supabase
          .from('salary_policies')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('name', updateData.name)
          .neq('id', params.id)
          .single()

        if (duplicatePolicy) {
          throw new Error('이미 존재하는 정책명입니다.')
        }
      }

      // 강사 유효성 확인 (instructor_id가 변경되는 경우)
      if (updateData.instructor_id && updateData.instructor_id !== existingPolicy.instructor_id) {
        const { data: instructor } = await supabase
          .from('instructors')
          .select('id, name, tenant_id, status')
          .eq('id', updateData.instructor_id)
          .eq('tenant_id', updateData.tenantId)
          .single()

        if (!instructor) {
          throw new Error('유효하지 않은 강사입니다.')
        }

        if (instructor.status !== 'active') {
          throw new Error('비활성 상태의 강사에게는 급여정책을 적용할 수 없습니다.')
        }

        // 해당 강사의 중복 활성 정책 확인 (현재 정책 제외)
        const { data: existingActivePolicy } = await supabase
          .from('salary_policies')
          .select('id, name')
          .eq('instructor_id', updateData.instructor_id)
          .eq('is_active', true)
          .neq('id', params.id)
          .single()

        if (existingActivePolicy) {
          throw new Error(`해당 강사에게 이미 활성 급여정책(${existingActivePolicy.name})이 적용되어 있습니다.`)
        }
      }

      // 정책 타입별 필수 필드 검증 (타입이 변경되는 경우)
      const finalPolicyType = updateData.policy_type || existingPolicy.policy_type
      switch (finalPolicyType) {
        case 'fixed_monthly':
        case 'fixed_hourly':
        case 'student_based':
        case 'guaranteed_minimum':
          if (updateData.base_amount === undefined) {
            // 기존 데이터 확인 필요
            const { data: currentPolicy } = await supabase
              .from('salary_policies')
              .select('base_amount')
              .eq('id', params.id)
              .single()
            
            if (!currentPolicy?.base_amount && updateData.base_amount === undefined) {
              throw new Error(`${finalPolicyType} 타입에는 기본 금액이 필요합니다.`)
            }
          }
          break
        case 'commission':
        case 'tiered_commission':
          if (updateData.commission_rate === undefined) {
            const { data: currentPolicy } = await supabase
              .from('salary_policies')
              .select('commission_rate')
              .eq('id', params.id)
              .single()
            
            if (!currentPolicy?.commission_rate) {
              throw new Error('수수료 타입에는 수수료율이 필요합니다.')
            }
          }
          break
        case 'hybrid':
          // 하이브리드는 기본 금액 또는 수수료율 중 하나만 있으면 됨
          break
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 급여정책 정보 업데이트
      const { data: updatedPolicy, error } = await supabase
        .from('salary_policies')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .select('*')
        .single()

      if (error) {
        console.error('❌ 급여정책 수정 실패:', error)
        throw new Error(`급여정책 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-salary-policy', { 
        policyId: updatedPolicy.id,
        policyName: updatedPolicy.name 
      })

      return createSuccessResponse(
        { salary_policy: updatedPolicy },
        '급여정책 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 급여정책 삭제 (소프트 삭제)
 * DELETE /api/salary-policies/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-salary-policy', { userId: userProfile!.id, policyId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 급여정책을 삭제할 권한이 없습니다.')
      }

      // 기존 급여정책 존재 확인
      const { data: existingPolicy, error: fetchError } = await supabase
        .from('salary_policies')
        .select('id, name, is_active')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 급여정책을 찾을 수 없습니다.')
        }
        throw new Error(`급여정책 조회 실패: ${fetchError.message}`)
      }

      // 활성 정책 확인 로직 제거 (단순화)

      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제
        const { error } = await supabase
          .from('salary_policies')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 급여정책 삭제 실패:', error)
          throw new Error(`급여정책 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 활성 상태를 false로 변경
        const { data: updatedPolicy, error } = await supabase
          .from('salary_policies')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 급여정책 상태 변경 실패:', error)
          throw new Error(`급여정책 상태 변경 실패: ${error.message}`)
        }

        result = { salary_policy: updatedPolicy, type: 'soft' }
      }

      logApiSuccess('delete-salary-policy', { 
        policyId: params.id,
        policyName: existingPolicy.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '급여정책이 완전히 삭제되었습니다.' 
          : '급여정책이 비활성화되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}