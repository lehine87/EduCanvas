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

// 수강 정보 수정 스키마
const updateEnrollmentSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  class_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  original_price: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  final_price: z.number().min(0).optional(),
  payment_plan: z.string().optional(),
  hours_total: z.number().min(0).optional(),
  hours_used: z.number().min(0).optional(),
  hours_remaining: z.number().min(0).optional(),
  sessions_total: z.number().min(0).optional(),
  sessions_used: z.number().min(0).optional(),
  sessions_remaining: z.number().min(0).optional(),
  video_access_expires_at: z.string().optional(),
  can_download_videos: z.boolean().optional(),
  position_in_class: z.number().min(0).optional(),
  attendance_rate: z.number().min(0).max(100).optional(),
  assignment_completion_rate: z.number().min(0).max(100).optional(),
  average_grade: z.number().min(0).max(100).optional(),
  video_watch_count: z.number().min(0).optional(),
  notes: z.string().optional(),
  custom_fields: z.any().optional(), // Json 타입과 호환성을 위해
  status: z.enum(['active', 'completed', 'suspended', 'cancelled']).optional()
})

type UpdateEnrollmentData = z.infer<typeof updateEnrollmentSchema>

/**
 * 특정 수강 정보 조회
 * GET /api/enrollments/[id]?tenantId=xxx&includePayments=true
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-enrollment', { userId: userProfile!.id, enrollmentId: params.id })

      // URL 파라미터에서 tenantId와 옵션 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const includePayments = searchParams.get('includePayments') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 수강 정보에 접근할 권한이 없습니다.')
      }

      // 수강 정보 조회
      let selectFields = `
        *,
        students:student_id (
          id,
          name,
          student_number,
          status,
          phone,
          email,
          grade_level
        ),
        classes:class_id (
          id,
          name,
          grade,
          course,
          status,
          instructors:instructor_id (
            id,
            name
          )
        ),
        course_packages:package_id (
          id,
          name,
          billing_type,
          price,
          hours,
          sessions,
          months
        ),
        user_profiles:enrolled_by (
          id,
          email,
          name
        )
      `

      // 결제 정보 포함 옵션
      if (includePayments) {
        selectFields += `,
        payments (
          id,
          amount,
          status,
          due_date,
          payment_date,
          payment_method,
          notes
        )
        `
      }

      const { data: enrollment, error } = await supabase
        .from('student_enrollments')
        .select(selectFields)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !enrollment) {
        if (error?.code === 'PGRST116') {
          throw new Error('수강 정보를 찾을 수 없습니다.')
        }
        console.error('❌ 수강 정보 조회 실패:', error)
        throw new Error(`수강 정보 조회 실패: ${error?.message || '데이터를 찾을 수 없습니다'}`)
      }

      // 타입 안전성 보장
      if (!enrollment) {
        throw new Error('수강 정보 데이터를 찾을 수 없습니다.')
      }

      // 진행률 및 통계 계산 - 실제 필드명 사용 및 타입 안전성 보장
      const progressRate = ('original_hours' in enrollment && 'actual_hours' in enrollment && 
                           typeof enrollment.original_hours === 'number' && typeof enrollment.actual_hours === 'number' &&
                           enrollment.original_hours > 0 && enrollment.actual_hours >= 0) 
        ? Math.round((enrollment.actual_hours / enrollment.original_hours) * 100)
        : 0

      const sessionProgressRate = ('original_sessions' in enrollment && 'sessions_remaining' in enrollment && 
                                   typeof enrollment.original_sessions === 'number' && typeof enrollment.sessions_remaining === 'number' &&
                                   enrollment.original_sessions > 0 && enrollment.sessions_remaining >= 0)
        ? Math.round(((enrollment.original_sessions - enrollment.sessions_remaining) / enrollment.original_sessions) * 100)
        : 0

      const result = Object.assign({}, enrollment, {
        progress_rate: progressRate,
        session_progress_rate: sessionProgressRate,
        payment_count: includePayments && 'payments' in enrollment && Array.isArray(enrollment.payments) ? enrollment.payments.length : 0
      })

      logApiSuccess('get-enrollment', { enrollmentId: enrollment && typeof enrollment === 'object' && 'id' in enrollment && typeof (enrollment as Record<string, unknown>).id === 'string' ? (enrollment as Record<string, unknown>).id as string : params.id })

      return createSuccessResponse({ enrollment: result })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 수강 정보 수정
 * PUT /api/enrollments/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-enrollment', { userId: userProfile!.id, enrollmentId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateEnrollmentSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateEnrollmentData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 수강 정보를 수정할 권한이 없습니다.')
      }

      // 기존 수강 정보 존재 확인
      const { data: existingEnrollment, error: fetchError } = await supabase
        .from('student_enrollments')
        .select('id, student_id, package_id, tenant_id, status')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 수강 정보를 찾을 수 없습니다.')
        }
        throw new Error(`수강 정보 조회 실패: ${fetchError.message}`)
      }

      // 클래스 유효성 확인 (class_id가 변경되는 경우)
      if (updateData.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, tenant_id, is_active')
          .eq('id', updateData.class_id)
          .eq('tenant_id', updateData.tenantId)
          .single()

        if (!classData) {
          throw new Error('유효하지 않은 클래스입니다.')
        }

        if (!classData.is_active) {
          throw new Error('비활성 상태의 클래스로는 변경할 수 없습니다.')
        }
      }

      // 시간/세션 유효성 검증
      if (updateData.hours_used !== undefined && updateData.hours_total !== undefined) {
        if (updateData.hours_used > updateData.hours_total) {
          throw new Error('사용 시간이 총 시간을 초과할 수 없습니다.')
        }
      }

      if (updateData.sessions_used !== undefined && updateData.sessions_total !== undefined) {
        if (updateData.sessions_used > updateData.sessions_total) {
          throw new Error('사용 세션이 총 세션을 초과할 수 없습니다.')
        }
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 수강 정보 업데이트
      const { data: updatedEnrollment, error } = await supabase
        .from('student_enrollments')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .select(`
          *,
          students:student_id (
            id,
            name,
            student_number,
            status
          ),
          classes:class_id (
            id,
            name,
            grade,
            course
          ),
          course_packages:package_id (
            id,
            name,
            billing_type,
            price
          ),
          user_profiles:enrolled_by (
            id,
            email,
            name
          )
        `)
        .single()

      if (error) {
        console.error('❌ 수강 정보 수정 실패:', error)
        throw new Error(`수강 정보 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-enrollment', { 
        enrollmentId: updatedEnrollment.id,
        studentId: updatedEnrollment.student_id
      })

      return createSuccessResponse(
        { enrollment: updatedEnrollment },
        '수강 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 수강 정보 삭제 (소프트 삭제)
 * DELETE /api/enrollments/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-enrollment', { userId: userProfile!.id, enrollmentId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 수강 정보를 삭제할 권한이 없습니다.')
      }

      // 기존 수강 정보 존재 확인
      const { data: existingEnrollment, error: fetchError } = await supabase
        .from('student_enrollments')
        .select(`
          id, 
          status,
          students:student_id (
            name,
            student_number
          ),
          course_packages:package_id (
            name
          )
        `)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 수강 정보를 찾을 수 없습니다.')
        }
        throw new Error(`수강 정보 조회 실패: ${fetchError.message}`)
      }

      // 관련 결제 정보 확인
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('id, status, amount')
        .eq('enrollment_id', params.id)

      if (paymentError) {
        throw new Error(`결제 정보 확인 실패: ${paymentError.message}`)
      }

      const hasPendingPayments = payments?.some(p => p.status === 'pending' || p.status === 'overdue')

      if (hasPendingPayments && !forceDelete) {
        throw new Error('미결제 또는 연체된 결제가 있는 수강 정보는 삭제할 수 없습니다. 먼저 결제를 완료하거나 강제 삭제를 선택하세요.')
      }

      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제
        const { error } = await supabase
          .from('student_enrollments')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 수강 정보 삭제 실패:', error)
          throw new Error(`수강 정보 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 상태를 'cancelled'로 변경
        const { data: updatedEnrollment, error } = await supabase
          .from('student_enrollments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 수강 정보 상태 변경 실패:', error)
          throw new Error(`수강 정보 상태 변경 실패: ${error.message}`)
        }

        result = { enrollment: updatedEnrollment, type: 'soft' }
      }

      logApiSuccess('delete-enrollment', { 
        enrollmentId: params.id,
        studentName: existingEnrollment.students?.name,
        packageName: existingEnrollment.course_packages?.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '수강 정보가 완전히 삭제되었습니다.' 
          : '수강이 취소되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}