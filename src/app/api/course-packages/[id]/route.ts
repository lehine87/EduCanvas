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

// 코스패키지 수정 스키마
const updateCoursePackageSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '패키지 이름은 필수입니다').optional(),
  description: z.string().optional(),
  price: z.number().min(0, '가격은 0 이상이어야 합니다').optional(),
  original_price: z.number().min(0).optional(),
  billing_type: z.enum(['monthly', 'per_session', 'package', 'hourly', 'fixed']).optional(),
  currency: z.string().optional(),
  class_id: z.string().uuid().optional(),
  hours: z.number().min(0).optional(),
  sessions: z.number().min(0).optional(),
  months: z.number().min(0).optional(),
  validity_days: z.number().min(0).optional(),
  video_access_days: z.number().min(0).optional(),
  max_enrollments: z.number().min(0).optional(),
  available_from: z.string().optional(),
  available_until: z.string().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  download_allowed: z.boolean().optional(),
  offline_access: z.boolean().optional()
})

type UpdateCoursePackageData = z.infer<typeof updateCoursePackageSchema>

/**
 * 특정 코스패키지 조회
 * GET /api/course-packages/[id]?tenantId=xxx&includeEnrollments=true
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-course-package', { userId: userProfile!.id, packageId: params.id })

      // URL 파라미터에서 tenantId와 옵션 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const includeEnrollments = searchParams.get('includeEnrollments') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 코스패키지 정보에 접근할 권한이 없습니다.')
      }

      // 코스패키지 정보 조회
      let selectFields = `
        *,
        classes:class_id (
          id,
          name,
          grade,
          course,
          status
        ),
        user_profiles:created_by (
          id,
          email,
          name
        )
      `

      // 수강 정보 포함 옵션
      if (includeEnrollments) {
        selectFields += `,
        student_enrollments (
          id,
          status,
          enrolled_at,
          end_date,
          students (
            id,
            name,
            student_number,
            status
          )
        )
        `
      }

      const { data: coursePackage, error } = await supabase
        .from('course_packages')
        .select(selectFields)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('코스패키지를 찾을 수 없습니다.')
        }
        console.error('❌ 코스패키지 조회 실패:', error)
        throw new Error(`코스패키지 조회 실패: ${error.message}`)
      }

      // 수강 통계 계산
      const enrollmentCount = includeEnrollments && coursePackage.student_enrollments 
        ? coursePackage.student_enrollments.length 
        : 0

      const activeEnrollmentCount = includeEnrollments && coursePackage.student_enrollments
        ? coursePackage.student_enrollments.filter((e: { status: string }) => e.status === 'active').length
        : 0

      const result = {
        ...coursePackage,
        enrollment_count: enrollmentCount,
        active_enrollment_count: activeEnrollmentCount
      }

      logApiSuccess('get-course-package', { packageId: coursePackage.id })

      return createSuccessResponse({ course_package: result })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 코스패키지 정보 수정
 * PUT /api/course-packages/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-course-package', { userId: userProfile!.id, packageId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateCoursePackageSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateCoursePackageData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 코스패키지 정보를 수정할 권한이 없습니다.')
      }

      // 기존 코스패키지 존재 확인
      const { data: existingPackage, error: fetchError } = await supabase
        .from('course_packages')
        .select('id, name, tenant_id')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 코스패키지를 찾을 수 없습니다.')
        }
        throw new Error(`코스패키지 조회 실패: ${fetchError.message}`)
      }

      // 패키지명 중복 확인 (이름이 변경되는 경우만)
      if (updateData.name && updateData.name !== existingPackage.name) {
        const { data: duplicatePackage } = await supabase
          .from('course_packages')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('name', updateData.name)
          .neq('id', params.id)
          .single()

        if (duplicatePackage) {
          throw new Error('이미 존재하는 패키지명입니다.')
        }
      }

      // 클래스 유효성 확인 (class_id가 변경되는 경우)
      if (updateData.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, tenant_id')
          .eq('id', updateData.class_id)
          .eq('tenant_id', updateData.tenantId)
          .single()

        if (!classData) {
          throw new Error('유효하지 않은 클래스입니다.')
        }
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 코스패키지 정보 업데이트
      const { data: updatedPackage, error } = await supabase
        .from('course_packages')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
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
        console.error('❌ 코스패키지 수정 실패:', error)
        throw new Error(`코스패키지 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-course-package', { 
        packageId: updatedPackage.id,
        packageName: updatedPackage.name 
      })

      return createSuccessResponse(
        { course_package: updatedPackage },
        '코스패키지 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 코스패키지 삭제 (소프트 삭제)
 * DELETE /api/course-packages/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-course-package', { userId: userProfile!.id, packageId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 코스패키지를 삭제할 권한이 없습니다.')
      }

      // 기존 코스패키지 존재 확인
      const { data: existingPackage, error: fetchError } = await supabase
        .from('course_packages')
        .select('id, name, is_active')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 코스패키지를 찾을 수 없습니다.')
        }
        throw new Error(`코스패키지 조회 실패: ${fetchError.message}`)
      }

      // 수강 정보 확인 로직 제거 (단순화)

      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제
        const { error } = await supabase
          .from('course_packages')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 코스패키지 삭제 실패:', error)
          throw new Error(`코스패키지 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 활성 상태를 false로 변경
        const { data: updatedPackage, error } = await supabase
          .from('course_packages')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 코스패키지 상태 변경 실패:', error)
          throw new Error(`코스패키지 상태 변경 실패: ${error.message}`)
        }

        result = { course_package: updatedPackage, type: 'soft' }
      }

      logApiSuccess('delete-course-package', { 
        packageId: params.id,
        packageName: existingPackage.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '코스패키지가 완전히 삭제되었습니다.' 
          : '코스패키지가 비활성화되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}