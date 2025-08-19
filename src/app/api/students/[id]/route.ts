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

// 학생 수정 스키마
const updateStudentSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '학생 이름은 필수입니다').optional(),
  student_number: z.string().min(1, '학번은 필수입니다').optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  parent_name: z.string().optional(),
  parent_phone_1: z.string().optional(),
  parent_phone_2: z.string().optional(),
  grade_level: z.string().optional(),
  school_name: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended']).optional(),
  class_id: z.string().uuid().optional()
})

type UpdateStudentData = z.infer<typeof updateStudentSchema>

/**
 * 특정 학생 조회
 * GET /api/students/[id]?tenantId=xxx
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      console.log('🔍 [DEBUG] 학생 상세 API 시작:', {
        studentId: params.id,
        userId: userProfile?.id,
        userRole: userProfile?.role,
        userTenantId: userProfile?.tenant_id,
        url: request.url
      })
      
      logApiStart('get-student', { userId: userProfile!.id, studentId: params.id })

      // URL 파라미터에서 tenantId 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      
      console.log('🔍 [DEBUG] 요청 파라미터:', {
        tenantId,
        userRole: userProfile?.role,
        userTenantId: userProfile?.tenant_id
      })

      // 시스템 관리자가 아닌 경우 tenantId 필수
      if (!userProfile!.role || userProfile!.role !== 'system_admin') {
        if (!tenantId) {
          console.log('❌ [DEBUG] tenantId 파라미터 누락')
          throw new Error('tenantId 파라미터가 필요합니다.')
        }
      }

      // 테넌트 권한 검증 (시스템 관리자는 자동 통과)
      const hasAccess = validateTenantAccess(userProfile!, tenantId)
      console.log('🔍 [DEBUG] 권한 검증 결과:', {
        hasAccess,
        userRole: userProfile?.role,
        userTenantId: userProfile?.tenant_id,
        requestedTenantId: tenantId
      })
      
      if (!hasAccess) {
        console.log('❌ [DEBUG] 권한 검증 실패')
        throw new Error('해당 테넌트의 학생 정보에 접근할 권한이 없습니다.')
      }

      console.log('🔍 [DEBUG] 데이터베이스 쿼리 시작')
      
      // 학생 정보 조회 - 복잡한 조인 제거하고 단순화
      let query = supabase
        .from('students')
        .select('*')
        .eq('id', params.id)
      
      // 시스템 관리자가 아닌 경우에만 tenant_id 조건 추가
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }
      
      console.log('🔍 [DEBUG] 쿼리 실행 중...')
      
      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('데이터베이스 쿼리 타임아웃')), 10000)
      })
      
      const queryPromise = query.single()
      
      const { data: student, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any
      
      console.log('🔍 [DEBUG] 쿼리 완료:', { hasStudent: !!student, error: error?.message })

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('학생을 찾을 수 없습니다.')
        }
        console.error('❌ 학생 조회 실패:', error)
        throw new Error(`학생 조회 실패: ${error.message}`)
      }

      logApiSuccess('get-student', { studentId: student.id })

      return createSuccessResponse({ student })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 학생 정보 수정
 * PUT /api/students/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-student', { userId: userProfile!.id, studentId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      console.log('🔍 [DEBUG] 수신된 요청 본문:', body)

      const validationResult = validateRequestBody(body, (data) => 
        updateStudentSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        console.log('❌ [DEBUG] 유효성 검증 실패:', validationResult)
        return validationResult
      }

      const updateData: UpdateStudentData = validationResult
      console.log('✅ [DEBUG] 유효성 검증 성공:', updateData)

      // 테넌트 권한 검증 (시스템 관리자는 자동 통과)
      console.log('🔍 [DEBUG] 권한 검증 시작:', {
        userRole: userProfile!.role,
        userTenantId: userProfile!.tenant_id,
        requestTenantId: updateData.tenantId
      })

      const hasAccess = validateTenantAccess(userProfile!, updateData.tenantId)
      console.log('🔍 [DEBUG] 권한 검증 결과:', hasAccess)

      if (!hasAccess) {
        console.log('❌ [DEBUG] 권한 검증 실패')
        throw new Error('해당 테넌트의 학생 정보를 수정할 권한이 없습니다.')
      }

      // 기존 학생 존재 확인
      console.log('🔍 [DEBUG] 학생 조회 시작:', {
        studentId: params.id,
        tenantId: updateData.tenantId
      })

      const { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('id, student_number, tenant_id')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      console.log('🔍 [DEBUG] 학생 조회 결과:', {
        hasStudent: !!existingStudent,
        error: fetchError?.message,
        errorCode: fetchError?.code
      })

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('❌ [DEBUG] 학생을 찾을 수 없음')
          throw new Error('수정할 학생을 찾을 수 없습니다.')
        }
        console.error('❌ [DEBUG] 학생 조회 실패:', fetchError)
        throw new Error(`학생 조회 실패: ${fetchError.message}`)
      }

      // 학번 중복 확인 (학번이 변경되는 경우만)
      if (updateData.student_number && updateData.student_number !== existingStudent.student_number) {
        const { data: duplicateStudent } = await supabase
          .from('students')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('student_number', updateData.student_number)
          .neq('id', params.id)
          .single()

        if (duplicateStudent) {
          throw new Error('이미 존재하는 학번입니다.')
        }
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      console.log('🔍 [DEBUG] 학생 업데이트 시작:', {
        studentId: params.id,
        tenantId: updateData.tenantId,
        updateFields
      })

      // 학생 정보 업데이트
      const { data: updatedStudent, error } = await supabase
        .from('students')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .select('*')
        .single()

      console.log('🔍 [DEBUG] 학생 업데이트 결과:', {
        hasStudent: !!updatedStudent,
        error: error?.message,
        errorCode: error?.code
      })

      if (error) {
        console.error('❌ [DEBUG] 학생 수정 실패:', error)
        throw new Error(`학생 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-student', { 
        studentId: updatedStudent.id,
        studentNumber: updatedStudent.student_number 
      })

      return createSuccessResponse(
        { student: updatedStudent },
        '학생 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 학생 삭제 (소프트 삭제)
 * DELETE /api/students/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-student', { userId: userProfile!.id, studentId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증 (시스템 관리자는 자동 통과)
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 학생을 삭제할 권한이 없습니다.')
      }

      // 기존 학생 존재 확인
      const { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('id, name, status')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 학생을 찾을 수 없습니다.')
        }
        throw new Error(`학생 조회 실패: ${fetchError.message}`)
      }

      // 관련 데이터 존재 확인
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, status')
        .eq('student_id', params.id)

      if (enrollmentError) {
        throw new Error(`수강 정보 확인 실패: ${enrollmentError.message}`)
      }

      const hasActiveEnrollments = enrollments?.some(e => e.status === 'active')

      if (hasActiveEnrollments && !forceDelete) {
        throw new Error('활성 수강 중인 학생은 삭제할 수 없습니다. 먼저 수강을 종료하거나 강제 삭제를 선택하세요.')
      }

      let result

      if (forceDelete) {
        // 하드 삭제: 관련 데이터와 함께 완전 삭제
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 학생 삭제 실패:', error)
          throw new Error(`학생 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 상태를 'withdrawn'으로 변경
        const { data: updatedStudent, error } = await supabase
          .from('students')
          .update({
            status: 'withdrawn',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 학생 상태 변경 실패:', error)
          throw new Error(`학생 상태 변경 실패: ${error.message}`)
        }

        result = { student: updatedStudent, type: 'soft' }
      }

      logApiSuccess('delete-student', { 
        studentId: params.id,
        studentName: existingStudent.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '학생이 완전히 삭제되었습니다.' 
          : '학생이 탈퇴 처리되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}