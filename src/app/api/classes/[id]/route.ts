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

// 클래스 수정 스키마
const updateClassSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '클래스 이름은 필수입니다').optional(),
  grade: z.string().optional(),
  course: z.string().optional(),
  instructor_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  max_students: z.number().int().min(1).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional()
})

type UpdateClassData = z.infer<typeof updateClassSchema>

/**
 * 특정 클래스 조회
 * GET /api/classes/[id]?tenantId=xxx&includeStudents=true
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-class', { userId: userProfile!.id, classId: params.id })

      // URL 파라미터에서 tenantId와 옵션 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const includeStudents = searchParams.get('includeStudents') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 클래스 정보에 접근할 권한이 없습니다.')
      }

      // 클래스 정보 조회 (classroom_id 관계 제거 - 테이블이 없음)
      let selectFields = `
        *,
        user_profiles:instructor_id (
          id,
          name,
          email
        )
      `

      // 학생 정보 포함 옵션
      if (includeStudents) {
        selectFields += `,
        students (
          id,
          name,
          student_number,
          status,
          grade_level,
          phone,
          email,
          created_at
        )
        `
      }

      const { data: classData, error } = await supabase
        .from('classes')
        .select(selectFields)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !classData) {
        if (error?.code === 'PGRST116') {
          throw new Error('클래스를 찾을 수 없습니다.')
        }
        console.error('❌ 클래스 조회 실패:', error)
        throw new Error(`클래스 조회 실패: ${error?.message || '데이터를 찾을 수 없습니다'}`)
      }

      // 타입 안전성 보장
      if (!classData) {
        throw new Error('클래스 데이터를 찾을 수 없습니다.')
      }

      // 학생 수 계산
      const studentCount = includeStudents && 'students' in classData && Array.isArray(classData.students)
        ? classData.students.length 
        : 0

      const result = Object.assign({}, classData, {
        student_count: studentCount
      })

      logApiSuccess('get-class', { classId: (classData as any).id })

      return createSuccessResponse({ class: result })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 클래스 정보 수정
 * PUT /api/classes/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-class', { userId: userProfile!.id, classId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateClassSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateClassData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 클래스 정보를 수정할 권한이 없습니다.')
      }

      // 기존 클래스 존재 확인
      const { data: existingClass, error: fetchError } = await supabase
        .from('classes')
        .select('id, name, tenant_id')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 클래스를 찾을 수 없습니다.')
        }
        throw new Error(`클래스 조회 실패: ${fetchError.message}`)
      }

      // 클래스명 중복 확인 (이름이 변경되는 경우만)
      if (updateData.name && updateData.name !== existingClass.name) {
        const { data: duplicateClass } = await supabase
          .from('classes')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('name', updateData.name)
          .neq('id', params.id)
          .single()

        if (duplicateClass) {
          throw new Error('이미 존재하는 클래스명입니다.')
        }
      }

      // 강사 권한 확인 (instructor_id가 제공된 경우)
      if (updateData.instructor_id) {
        const { data: instructor } = await supabase
          .from('user_profiles')
          .select('id, role, tenant_id')
          .eq('id', updateData.instructor_id)
          .eq('tenant_id', updateData.tenantId)
          .eq('role', 'instructor')
          .eq('status', 'active')
          .single()

        if (!instructor) {
          throw new Error('유효하지 않은 강사입니다.')
        }
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 클래스 정보 업데이트
      const { data: updatedClass, error } = await supabase
        .from('classes')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .select(`
          *,
          user_profiles:instructor_id (
            id,
            name,
            email
          )
        `)
        .single()

      if (error) {
        console.error('❌ 클래스 수정 실패:', error)
        throw new Error(`클래스 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-class', { 
        classId: updatedClass.id,
        className: updatedClass.name 
      })

      return createSuccessResponse(
        { class: updatedClass },
        '클래스 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 클래스 삭제 (소프트 삭제)
 * DELETE /api/classes/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-class', { userId: userProfile!.id, classId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 클래스를 삭제할 권한이 없습니다.')
      }

      // 기존 클래스 존재 확인
      const { data: existingClass, error: fetchError } = await supabase
        .from('classes')
        .select('id, name, is_active')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        console.error('❌ 클래스 조회 실패:', fetchError)
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 클래스를 찾을 수 없습니다.')
        }
        throw new Error(`클래스 조회 실패: ${fetchError.message}`)
      }

      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제 (관련 데이터도 삭제됨)
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 클래스 삭제 실패:', error)
          throw new Error(`클래스 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 상태를 'false'로 변경
        const { data: updatedClass, error } = await supabase
          .from('classes')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 클래스 상태 변경 실패:', error)
          throw new Error(`클래스 상태 변경 실패: ${error.message}`)
        }

        result = { class: updatedClass, type: 'soft' }
      }

      logApiSuccess('delete-class', { 
        classId: params.id,
        className: existingClass.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '클래스가 완전히 삭제되었습니다.' 
          : '클래스가 비활성화되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}