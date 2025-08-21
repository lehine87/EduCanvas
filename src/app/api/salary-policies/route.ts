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

// 급여정책 조회 파라미터 스키마
const getSalaryPoliciesSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다').optional().nullable(),
  instructorId: z.string().uuid().optional().nullable(),
  policyType: z.enum(['fixed_monthly', 'fixed_hourly', 'commission', 'tiered_commission', 'student_based']).optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional().nullable()
})

// 급여정책 생성 스키마
const createSalaryPolicySchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '정책 이름은 필수입니다'),
  policy_type: z.enum(['fixed_monthly', 'fixed_hourly', 'commission', 'tiered_commission', 'student_based']),
  instructor_id: z.string().uuid().optional(),
  effective_from: z.string(),
  effective_until: z.string().optional(),
  base_amount: z.number().min(0).optional(),
  commission_rate: z.number().min(0).optional(),
  conditions: z.any().optional(),
  tier_config: z.any().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
})

type GetSalaryPoliciesParams = z.infer<typeof getSalaryPoliciesSchema>
type CreateSalaryPolicyData = z.infer<typeof createSalaryPolicySchema>

/**
 * 급여정책 목록 조회
 * GET /api/salary-policies?tenantId=xxx&instructorId=xxx&policyType=hourly&isActive=true
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-salary-policies', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        instructorId: searchParams.get('instructorId'),
        policyType: searchParams.get('policyType'),
        isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search')
      }
      
      console.log('📋 API 파라미터:', rawParams)

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getSalaryPoliciesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetSalaryPoliciesParams = validationResult

      // 테넌트 권한 검증 (시스템 관리자는 전체 접근 가능)
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 급여정책 정보에 접근할 권한이 없습니다.')
      }

      // 기본 쿼리 구성
      let query = supabase
        .from('salary_policies')
        .select(`
          *,
          instructors:instructor_id (
            id,
            name,
            email,
            status
          )
        `)

      // 시스템 관리자가 아닌 경우에만 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

      // 강사 필터링
      if (params.instructorId) {
        query = query.eq('instructor_id', params.instructorId)
      }

      // 정책 타입 필터링
      if (params.policyType) {
        query = query.eq('policy_type', params.policyType)
      }

      // 활성 상태 필터링
      if (params.isActive !== undefined && params.isActive !== null) {
        query = query.eq('is_active', params.isActive)
      }

      // 검색 기능 (정책명)
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%`)
      }

      // 페이지네이션
      const { data: salaryPolicies, error, count } = await query
        .range(params.offset, params.offset + params.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 급여정책 목록 조회 실패:', error)
        throw new Error(`급여정책 목록 조회 실패: ${error.message}`)
      }

      const result = {
        salary_policies: salaryPolicies || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }

      logApiSuccess('get-salary-policies', { 
        count: salaryPolicies?.length || 0, 
        total: count || 0 
      })

      return createSuccessResponse(result)
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 새 급여정책 생성
 * POST /api/salary-policies
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-salary-policy', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createSalaryPolicySchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const policyData: CreateSalaryPolicyData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, policyData.tenantId)) {
        throw new Error('해당 테넌트에 급여정책을 생성할 권한이 없습니다.')
      }

      // 정책명 중복 확인 (같은 테넌트 내)
      const { data: existingPolicy } = await supabase
        .from('salary_policies')
        .select('id')
        .eq('tenant_id', policyData.tenantId)
        .eq('name', policyData.name)
        .single()

      if (existingPolicy) {
        throw new Error('이미 존재하는 정책명입니다.')
      }

      // 강사 유효성 확인 (instructor_id가 제공된 경우)
      if (policyData.instructor_id) {
        const { data: instructor } = await supabase
          .from('instructors')
          .select('id, name, tenant_id, status')
          .eq('id', policyData.instructor_id)
          .eq('tenant_id', policyData.tenantId)
          .single()

        if (!instructor) {
          throw new Error('유효하지 않은 강사입니다.')
        }

        if (instructor.status !== 'active') {
          throw new Error('비활성 상태의 강사에게는 급여정책을 적용할 수 없습니다.')
        }

        // 해당 강사의 중복 활성 정책 확인
        const { data: existingActivePolicy } = await supabase
          .from('salary_policies')
          .select('id, name')
          .eq('instructor_id', policyData.instructor_id)
          .eq('is_active', true)
          .single()

        if (existingActivePolicy) {
          throw new Error(`해당 강사에게 이미 활성 급여정책(${existingActivePolicy.name})이 적용되어 있습니다.`)
        }
      }

      // 급여 타입별 필수 필드 검증
      switch (policyData.policy_type) {
        case 'fixed_monthly':
          if (!policyData.base_amount) {
            throw new Error('월급제에는 월급액이 필요합니다.')
          }
          break
        case 'fixed_hourly':
          if (!policyData.base_amount) {
            throw new Error('시급제에는 시급이 필요합니다.')
          }
          break
        case 'commission':
          if (!policyData.commission_rate) {
            throw new Error('수수료제에는 수수료율이 필요합니다.')
          }
          break
        case 'tiered_commission':
          if (!policyData.commission_rate) {
            throw new Error('단계별 수수료제에는 수수료율이 필요합니다.')
          }
          break
        case 'student_based':
          if (!policyData.base_amount) {
            throw new Error('학생수 기반 급여제에는 기본 금액이 필요합니다.')
          }
          break
      }

      // 급여정책 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restPolicyData } = policyData
      const { data: newPolicy, error } = await supabase
        .from('salary_policies')
        .insert({
          ...restPolicyData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          instructors:instructor_id (
            id,
            name,
            email,
            status
          )
        `)
        .single()

      if (error) {
        console.error('❌ 급여정책 생성 실패:', error)
        throw new Error(`급여정책 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-salary-policy', { 
        policyId: newPolicy.id,
        policyName: newPolicy.name 
      })

      return createSuccessResponse(
        { salary_policy: newPolicy },
        '급여정책이 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}