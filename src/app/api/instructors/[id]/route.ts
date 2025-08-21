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

// 강사 수정 스키마
const updateInstructorSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '강사 이름은 필수입니다').optional(),
  email: z.string().email('유효한 이메일 주소를 입력하세요').optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  bank_account: z.string().optional(),
  emergency_contact: z.string().optional(),
  hire_date: z.string().optional(),
  memo: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  user_id: z.string().uuid().optional()
})

type UpdateInstructorData = z.infer<typeof updateInstructorSchema>

/**
 * 특정 강사 조회
 * GET /api/instructors/[id]?tenantId=xxx&includeClasses=true
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-instructor', { userId: userProfile!.id, instructorId: params.id })

      // URL 파라미터에서 tenantId와 옵션 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const includeClasses = searchParams.get('includeClasses') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 강사 정보에 접근할 권한이 없습니다.')
      }

      // 강사 정보 조회
      let selectFields = `
        *,
        user_profiles:user_id (
          id,
          email,
          role,
          status,
          created_at
        )
      `

      // 클래스 정보 포함 옵션
      if (includeClasses) {
        selectFields += `,
        classes (
          id,
          name,
          grade,
          course,
          status,
          max_students,
          created_at
        )
        `
      }

      const { data: instructor, error } = await supabase
        .from('instructors')
        .select(selectFields)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !instructor) {
        if (error?.code === 'PGRST116') {
          throw new Error('강사를 찾을 수 없습니다.')
        }
        console.error('❌ 강사 조회 실패:', error)
        throw new Error(`강사 조회 실패: ${error?.message || '데이터를 찾을 수 없습니다'}`)
      }

      // 타입 안전성 보장
      if (!instructor) {
        throw new Error('강사 데이터를 찾을 수 없습니다.')
      }

      // 담당 클래스 수 계산
      const classCount = includeClasses && 'classes' in instructor && Array.isArray(instructor.classes)
        ? instructor.classes.length 
        : 0

      const result = Object.assign({}, instructor, {
        class_count: classCount
      })

      logApiSuccess('get-instructor', { instructorId: (instructor as any).id })

      return createSuccessResponse({ instructor: result })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 강사 정보 수정
 * PUT /api/instructors/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-instructor', { userId: userProfile!.id, instructorId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateInstructorSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateInstructorData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 강사 정보를 수정할 권한이 없습니다.')
      }

      // 기존 강사 존재 확인
      const { data: existingInstructor, error: fetchError } = await supabase
        .from('instructors')
        .select('id, email, tenant_id, user_id')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 강사를 찾을 수 없습니다.')
        }
        throw new Error(`강사 조회 실패: ${fetchError.message}`)
      }

      // 이메일 중복 확인 (이메일이 변경되는 경우만)
      if (updateData.email && updateData.email !== existingInstructor.email) {
        const { data: duplicateInstructor } = await supabase
          .from('instructors')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('email', updateData.email)
          .neq('id', params.id)
          .single()

        if (duplicateInstructor) {
          throw new Error('이미 등록된 이메일입니다.')
        }
      }

      // 연결할 사용자 계정 검증 (user_id가 변경되는 경우)
      if (updateData.user_id && updateData.user_id !== existingInstructor.user_id) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, role, tenant_id, status')
          .eq('id', updateData.user_id)
          .eq('tenant_id', updateData.tenantId)
          .eq('status', 'active')
          .single()

        if (!userProfile) {
          throw new Error('유효하지 않은 사용자 계정입니다.')
        }

        // 이미 다른 강사에게 연결된 계정인지 확인
        const { data: existingInstructorAccount } = await supabase
          .from('instructors')
          .select('id')
          .eq('user_id', updateData.user_id)
          .neq('id', params.id)
          .single()

        if (existingInstructorAccount) {
          throw new Error('이미 다른 강사에게 연결된 계정입니다.')
        }
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 강사 정보 업데이트
      const { data: updatedInstructor, error } = await supabase
        .from('instructors')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
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
        console.error('❌ 강사 수정 실패:', error)
        throw new Error(`강사 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-instructor', { 
        instructorId: updatedInstructor.id,
        instructorName: updatedInstructor.name 
      })

      return createSuccessResponse(
        { instructor: updatedInstructor },
        '강사 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 강사 삭제 (소프트 삭제)
 * DELETE /api/instructors/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-instructor', { userId: userProfile!.id, instructorId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 강사를 삭제할 권한이 없습니다.')
      }

      // 기존 강사 존재 확인
      const { data: existingInstructor, error: fetchError } = await supabase
        .from('instructors')
        .select('id, name, status')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 강사를 찾을 수 없습니다.')
        }
        throw new Error(`강사 조회 실패: ${fetchError.message}`)
      }

      // 담당 클래스 확인
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, is_active')
        .eq('instructor_id', params.id)

      if (classesError) {
        throw new Error(`담당 클래스 확인 실패: ${classesError.message}`)
      }

      const hasActiveClasses = classes?.some(c => c.is_active === true)

      if (hasActiveClasses && !forceDelete) {
        throw new Error('활성 클래스를 담당하고 있는 강사는 삭제할 수 없습니다. 먼저 다른 강사로 변경하거나 강제 삭제를 선택하세요.')
      }

      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제
        const { error } = await supabase
          .from('instructors')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 강사 삭제 실패:', error)
          throw new Error(`강사 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 상태를 'inactive'으로 변경
        const { data: updatedInstructor, error } = await supabase
          .from('instructors')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 강사 상태 변경 실패:', error)
          throw new Error(`강사 상태 변경 실패: ${error.message}`)
        }

        result = { instructor: updatedInstructor, type: 'soft' }
      }

      logApiSuccess('delete-instructor', { 
        instructorId: params.id,
        instructorName: existingInstructor.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '강사가 완전히 삭제되었습니다.' 
          : '강사가 비활성화되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}