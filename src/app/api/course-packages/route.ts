import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'
import type { 
  CoursePackageWithRelations, 
  CoursePackageStats,
  BillingType 
} from '@/types/course.types'

// 코스패키지 조회 파라미터 스키마 - 컴포넌트와 호환
const getCoursePackagesSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 필요합니다'),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  billingType: z.enum(['all', 'monthly', 'sessions', 'hours', 'package', 'drop_in']).optional().default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'created_at', 'price']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0)
})

// 코스패키지 생성 스키마 - 컴포넌트와 호환
const createCoursePackageSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 필요합니다'),
  name: z.string().min(1, '과정명은 필수입니다'),
  description: z.string().optional(),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  original_price: z.number().optional(),
  billing_type: z.enum(['monthly', 'sessions', 'hours', 'package', 'drop_in']),
  currency: z.string().default('KRW'),
  class_id: z.string().uuid().optional(),
  
  // 기간/횟수 관련
  months: z.number().optional(),
  sessions: z.number().optional(),
  hours: z.number().optional(),
  validity_days: z.number().optional(),
  
  // 접근 제어
  max_enrollments: z.number().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  available_from: z.string().optional(),
  available_until: z.string().optional(),
  
  // 추가 기능
  download_allowed: z.boolean().default(false),
  offline_access: z.boolean().default(false),
  video_access_days: z.number().optional(),
  display_order: z.number().default(0)
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

      // URL 파라미터 파싱 - 컴포넌트와 호환
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        status: searchParams.get('status') || 'all',
        billingType: searchParams.get('billingType') || 'all',
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: searchParams.get('sortOrder') || 'asc',
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0')
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

      // 테넌트 권한 검증 
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 과정 정보에 접근할 권한이 없습니다.')
      }

      // 기본 쿼리 구성 - 컴포넌트와 호환
      let query = supabase
        .from('course_packages')
        .select(`
          *,
          class:classes!course_packages_class_id_fkey (
            id,
            name
          ),
          created_by_user:user_profiles!course_packages_created_by_fkey (
            id,
            name
          )
        `)
        .eq('tenant_id', params.tenantId)

      // 상태 필터링 (all, active, inactive)
      if (params.status !== 'all') {
        query = query.eq('is_active', params.status === 'active')
      }

      // 결제 타입 필터링 
      if (params.billingType !== 'all') {
        query = query.eq('billing_type', params.billingType)
      }

      // 검색 기능 (이름, 설명)
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      // 정렬
      const orderColumn = params.sortBy === 'created_at' ? 'created_at' : 
                         params.sortBy === 'price' ? 'price' : 'name'
      query = query.order(orderColumn, { ascending: params.sortOrder === 'asc' })

      // 페이지네이션
      const { data: coursePackages, error, count } = await query
        .range(params.offset, params.offset + params.limit - 1)

      if (error) {
        console.error('❌ 과정 목록 조회 실패:', error)
        throw new Error(`과정 목록을 조회하는데 실패했습니다: ${error.message}`)
      }

      // 통계 데이터 계산
      const statsQuery = supabase
        .from('course_packages')
        .select('id, is_active, is_featured, billing_type, price')
        .eq('tenant_id', params.tenantId)

      const { data: statsData } = await statsQuery

      const stats: CoursePackageStats = {
        total: statsData?.length || 0,
        active: statsData?.filter(c => c.is_active).length || 0,
        inactive: statsData?.filter(c => !c.is_active).length || 0,
        featured: statsData?.filter(c => c.is_featured).length || 0,
        total_enrollments: 0, // TODO: 수강신청 테이블 연동 시 계산
        total_revenue: statsData?.reduce((sum, c) => sum + (c.price || 0), 0) || 0,
        average_price: statsData?.length ? 
          (statsData.reduce((sum, c) => sum + (c.price || 0), 0) / statsData.length) : 0,
        by_billing_type: {
          monthly: statsData?.filter(c => c.billing_type === 'monthly').length || 0,
          sessions: statsData?.filter(c => c.billing_type === 'sessions').length || 0,
          hours: statsData?.filter(c => c.billing_type === 'hours').length || 0,
          package: statsData?.filter(c => c.billing_type === 'package').length || 0,
          drop_in: statsData?.filter(c => c.billing_type === 'drop_in').length || 0,
        }
      }

      logApiSuccess('get-course-packages', { 
        count: coursePackages?.length || 0, 
        total: count || 0,
        stats: {
          total: stats.total,
          active: stats.active,
          featured: stats.featured
        }
      })

      // 컴포넌트와 호환되는 응답 형식
      return NextResponse.json({
        success: true,
        data: coursePackages as CoursePackageWithRelations[],
        total: count || 0,
        stats
      })
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

      // 과정 생성 - 컴포넌트와 호환
      const { tenantId, ...restPackageData } = packageData
      const { data: newPackage, error } = await supabase
        .from('course_packages')
        .insert({
          ...restPackageData,
          tenant_id: tenantId,
          created_by: userProfile!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          class:classes!course_packages_class_id_fkey (
            id,
            name
          ),
          created_by_user:user_profiles!course_packages_created_by_fkey (
            id,
            name
          )
        `)
        .single()

      if (error) {
        console.error('❌ 과정 생성 실패:', error)
        throw new Error(`과정 등록에 실패했습니다: ${error.message}`)
      }

      logApiSuccess('create-course-package', { 
        packageId: newPackage.id,
        packageName: newPackage.name 
      })

      // 컴포넌트와 호환되는 응답 형식
      return NextResponse.json({
        success: true,
        data: newPackage as CoursePackageWithRelations,
        message: '새 과정이 등록되었습니다.'
      })
    },
    {
      requireAuth: true
    }
  )
}