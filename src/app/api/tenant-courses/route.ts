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

// 과정 조회 파라미터 스키마
const getCoursesSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  includeInactive: z.boolean().default(false)
})

// 과정 생성/수정 스키마
const courseSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '과정명은 필수입니다').max(100, '과정명은 100자 이하여야 합니다'),
  code: z.string().max(50, '과정 코드는 50자 이하여야 합니다').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요').optional(),
  displayOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true)
})

type GetCoursesParams = z.infer<typeof getCoursesSchema>
type CourseData = z.infer<typeof courseSchema>

/**
 * 학원별 과정 목록 조회
 * GET /api/tenant-courses?tenantId=xxx&includeInactive=false
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-tenant-courses', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        includeInactive: searchParams.get('includeInactive') === 'true'
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getCoursesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetCoursesParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 과정 정보에 접근할 권한이 없습니다.')
      }

      // 과정 목록 조회 (course_packages 테이블 사용)
      let query = supabase
        .from('course_packages')
        .select('*')
        .eq('tenant_id', params.tenantId)

      // 비활성 과정 제외 (기본값)
      if (!params.includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data: courses, error } = await query.order('display_order', { ascending: true })

      if (error) {
        console.error('❌ 과정 목록 조회 실패:', error)
        throw new Error(`과정 목록 조회 실패: ${error.message}`)
      }

      logApiSuccess('get-tenant-courses', { 
        count: courses?.length || 0,
        tenantId: params.tenantId
      })

      return createSuccessResponse({
        courses: courses || []
      })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 새 과정 생성
 * POST /api/tenant-courses
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-tenant-course', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        courseSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const courseData: CourseData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, courseData.tenantId)) {
        throw new Error('해당 테넌트에 과정을 생성할 권한이 없습니다.')
      }

      // 과정명 중복 확인
      const { data: existingCourse } = await supabase
        .from('course_packages')
        .select('id')
        .eq('tenant_id', courseData.tenantId)
        .eq('name', courseData.name)
        .single()

      if (existingCourse) {
        throw new Error('이미 존재하는 과정명입니다.')
      }

      // 과정 코드 중복 확인 (코드가 제공된 경우)
      if (courseData.code) {
        const { data: existingCode } = await supabase
          .from('course_packages')
          .select('id')
          .eq('tenant_id', courseData.tenantId)
          .eq('code', courseData.code)
          .single()

        if (existingCode) {
          throw new Error('이미 존재하는 과정 코드입니다.')
        }
      }

      // 과정 생성
      const { tenantId, displayOrder, isActive, ...restData } = courseData
      const { data: newCourse, error } = await supabase
        .from('course_packages')
        .insert({
          ...restData,
          tenant_id: tenantId,
          is_active: isActive,
          billing_type: 'package' as const,
          price: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('❌ 과정 생성 실패:', error)
        throw new Error(`과정 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-tenant-course', { 
        courseId: newCourse.id,
        courseName: newCourse.name 
      })

      return createSuccessResponse(
        { course: newCourse },
        '과정이 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}