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

// 강사 조회 파라미터 스키마
const getInstructorsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다').optional().nullable(), // 🔧 시스템 관리자는 tenantId 없이 전체 조회 가능
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional().nullable(),
  includeClasses: z.boolean().default(false)
})

// 강사 생성 스키마
const createInstructorSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '강사 이름은 필수입니다'),
  email: z.string().email('유효한 이메일 주소를 입력하세요').optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  bank_account: z.string().optional(),
  emergency_contact: z.string().optional(),
  hire_date: z.string().optional(),
  memo: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  user_id: z.string().uuid().optional() // 연결할 사용자 계정
})

type GetInstructorsParams = z.infer<typeof getInstructorsSchema>
type CreateInstructorData = z.infer<typeof createInstructorSchema>

/**
 * 강사 목록 조회
 * GET /api/instructors?tenantId=xxx&status=active&limit=100&offset=0&search=김강사&includeClasses=true
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-instructors', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        status: searchParams.get('status') || 'all',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search'),
        includeClasses: searchParams.get('includeClasses') === 'true'
      }
      
      // 🔧 디버깅: 파라미터 로그
      console.log('📋 API 파라미터:', rawParams)

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getInstructorsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetInstructorsParams = validationResult

      // 테넌트 권한 검증 (시스템 관리자는 전체 접근 가능)
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 강사 정보에 접근할 권한이 없습니다.')
      }

      // 강사 목록 조회 (instructors 테이블에서 직접 조회)
      let query = supabase
        .from('instructors')
        .select(`
          id,
          name,
          email,
          status,
          tenant_id,
          user_profiles:user_id (
            id,
            email,
            role
          )
        `)

      // 시스템 관리자가 아닌 경우에만 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

      // 상태 필터링
      if (params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      // 검색 기능 (이름, 이메일)
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
      }

      // 페이지네이션
      const { data: instructors, error, count } = await query
        .range(params.offset, params.offset + params.limit - 1)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ 강사 목록 조회 실패:', error)
        throw new Error(`강사 목록 조회 실패: ${error.message}`)
      }

      console.log('🔍 강사 조회 결과:', {
        count: instructors?.length || 0,
        total: count || 0,
        instructors: instructors?.slice(0, 3) // 처음 3개만 로그
      })

      const result = {
        instructors: instructors || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }

      logApiSuccess('get-instructors', { 
        count: instructors?.length || 0, 
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
 * 새 강사 생성
 * POST /api/instructors
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-instructor', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createInstructorSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const instructorData: CreateInstructorData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, instructorData.tenantId)) {
        throw new Error('해당 테넌트에 강사를 생성할 권한이 없습니다.')
      }

      // 이메일 중복 확인 (같은 테넌트 내)
      if (instructorData.email) {
        const { data: existingInstructor } = await supabase
          .from('instructors')
          .select('id')
          .eq('tenant_id', instructorData.tenantId)
          .eq('email', instructorData.email)
          .single()

        if (existingInstructor) {
          throw new Error('이미 등록된 이메일입니다.')
        }
      }

      // 연결할 사용자 계정 검증 (user_id가 제공된 경우)
      if (instructorData.user_id) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, role, tenant_id, status')
          .eq('id', instructorData.user_id)
          .eq('tenant_id', instructorData.tenantId)
          .eq('status', 'active')
          .single()

        if (!userProfile) {
          throw new Error('유효하지 않은 사용자 계정입니다.')
        }

        // 이미 강사로 등록된 계정인지 확인
        const { data: existingInstructorAccount } = await supabase
          .from('instructors')
          .select('id')
          .eq('user_id', instructorData.user_id)
          .single()

        if (existingInstructorAccount) {
          throw new Error('이미 강사로 등록된 계정입니다.')
        }
      }

      // 강사 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restInstructorData } = instructorData
      const { data: newInstructor, error } = await supabase
        .from('instructors')
        .insert({
          ...restInstructorData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          user_profiles:user_id (
            id,
            email,
            role,
            status
          )
        `)
        .single()

      if (error) {
        console.error('❌ 강사 생성 실패:', error)
        throw new Error(`강사 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-instructor', { 
        instructorId: newInstructor.id,
        instructorName: newInstructor.name 
      })

      return createSuccessResponse(
        { instructor: newInstructor },
        '강사가 성공적으로 등록되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}