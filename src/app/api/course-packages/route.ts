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

// 코스패키지 조회 파라미터 스키마
const getCoursePackagesSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다').optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  billingType: z.enum(['monthly', 'per_session', 'package', 'hourly', 'fixed']).optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  isFeatured: z.boolean().optional().nullable(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional().nullable()
})

// 코스패키지 생성 스키마
const createCoursePackageSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '패키지 이름은 필수입니다'),
  description: z.string().optional(),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  original_price: z.number().min(0).optional(),
  billing_type: z.enum(['monthly', 'per_session', 'package', 'hourly', 'fixed']),
  currency: z.string().default('KRW'),
  class_id: z.string().uuid().optional(),
  hours: z.number().min(0).optional(),
  sessions: z.number().min(0).optional(),
  months: z.number().min(0).optional(),
  validity_days: z.number().min(0).optional(),
  video_access_days: z.number().min(0).optional(),
  max_enrollments: z.number().min(0).optional(),
  available_from: z.string().optional(),
  available_until: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  download_allowed: z.boolean().default(false),
  offline_access: z.boolean().default(false),
  created_by: z.string().uuid().optional()
})

type GetCoursePackagesParams = z.infer<typeof getCoursePackagesSchema>
type CreateCoursePackageData = z.infer<typeof createCoursePackageSchema>

/**
 * 코스패키지 목록 조회
 * GET /api/course-packages?tenantId=xxx&classId=xxx&billingType=monthly&isActive=true&limit=100&offset=0&search=패키지명
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-course-packages', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        classId: searchParams.get('classId'),
        billingType: searchParams.get('billingType'),
        isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
        isFeatured: searchParams.get('isFeatured') === 'true' ? true : searchParams.get('isFeatured') === 'false' ? false : undefined,
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search')
      }
      
      console.log('📋 API 파라미터:', rawParams)

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getCoursePackagesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetCoursePackagesParams = validationResult

      // 테넌트 권한 검증 (시스템 관리자는 전체 접근 가능)
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 코스패키지 정보에 접근할 권한이 없습니다.')
      }

      // 기본 쿼리 구성
      let query = supabase
        .from('course_packages')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            grade,
            course
          ),
          user_profiles:created_by (
            id,
            email,
            name
          )
        `)

      // 시스템 관리자가 아닌 경우에만 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

      // 클래스 필터링
      if (params.classId) {
        query = query.eq('class_id', params.classId)
      }

      // 결제 타입 필터링
      if (params.billingType) {
        query = query.eq('billing_type', params.billingType)
      }

      // 활성 상태 필터링
      if (params.isActive !== undefined) {
        query = query.eq('is_active', params.isActive)
      }

      // 추천 상태 필터링
      if (params.isFeatured !== undefined) {
        query = query.eq('is_featured', params.isFeatured)
      }

      // 검색 기능 (이름, 설명)
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      // 페이지네이션
      const { data: coursePackages, error, count } = await query
        .range(params.offset, params.offset + params.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 코스패키지 목록 조회 실패:', error)
        throw new Error(`코스패키지 목록 조회 실패: ${error.message}`)
      }

      const result = {
        course_packages: coursePackages || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }

      logApiSuccess('get-course-packages', { 
        count: coursePackages?.length || 0, 
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
 * 새 코스패키지 생성
 * POST /api/course-packages
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-course-package', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createCoursePackageSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const packageData: CreateCoursePackageData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, packageData.tenantId)) {
        throw new Error('해당 테넌트에 코스패키지를 생성할 권한이 없습니다.')
      }

      // 패키지명 중복 확인 (같은 테넌트 내)
      const { data: existingPackage } = await supabase
        .from('course_packages')
        .select('id')
        .eq('tenant_id', packageData.tenantId)
        .eq('name', packageData.name)
        .single()

      if (existingPackage) {
        throw new Error('이미 존재하는 패키지명입니다.')
      }

      // 클래스 유효성 확인 (class_id가 제공된 경우)
      if (packageData.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, tenant_id')
          .eq('id', packageData.class_id)
          .eq('tenant_id', packageData.tenantId)
          .single()

        if (!classData) {
          throw new Error('유효하지 않은 클래스입니다.')
        }
      }

      // 생성자 정보 설정
      const finalPackageData = {
        ...packageData,
        created_by: packageData.created_by || userProfile!.id
      }

      // 코스패키지 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restPackageData } = finalPackageData
      const { data: newPackage, error } = await supabase
        .from('course_packages')
        .insert({
          ...restPackageData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          classes:class_id (
            id,
            name,
            grade,
            course
          ),
          user_profiles:created_by (
            id,
            email,
            name
          )
        `)
        .single()

      if (error) {
        console.error('❌ 코스패키지 생성 실패:', error)
        throw new Error(`코스패키지 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-course-package', { 
        packageId: newPackage.id,
        packageName: newPackage.name 
      })

      return createSuccessResponse(
        { course_package: newPackage },
        '코스패키지가 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}