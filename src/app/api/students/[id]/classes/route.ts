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

// 학생별 클래스 조회 파라미터 스키마
const getStudentClassesSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  status: z.enum(['active', 'completed', 'suspended', 'cancelled', 'all']).default('all'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional()
})

// 학생에게 클래스 등록 스키마
const addClassToStudentSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  classId: z.string().uuid('클래스 ID는 필수입니다'),
  originalPrice: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  finalPrice: z.number().min(0).default(0),
  paymentPlan: z.string().optional(),
  hoursTotal: z.number().min(0).optional(),
  sessionsTotal: z.number().min(0).optional(),
  videoAccessExpiresAt: z.string().optional(),
  canDownloadVideos: z.boolean().default(false),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional()
})

type GetStudentClassesParams = z.infer<typeof getStudentClassesSchema>
type AddClassToStudentData = z.infer<typeof addClassToStudentSchema>

/**
 * 학생별 클래스 목록 조회 (수강 이력)
 * GET /api/students/[id]/classes?tenantId=xxx&status=active&search=수학
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-student-classes', { userId: userProfile!.id, studentId: params.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        status: searchParams.get('status') || 'all',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search') || undefined
      }

      if (!rawParams.tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getStudentClassesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const queryParams: GetStudentClassesParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, queryParams.tenantId)) {
        throw new Error('해당 테넌트의 학생 클래스 정보에 접근할 권한이 없습니다.')
      }

      // 학생 존재 확인
      const { data: studentData } = await supabase
        .from('students')
        .select('id, name, student_number, tenant_id, status')
        .eq('id', params.id)
        .eq('tenant_id', queryParams.tenantId)
        .single()

      if (!studentData) {
        throw new Error('학생을 찾을 수 없습니다.')
      }

      // 학생별 클래스 목록 조회
      let query = supabase
        .from('student_enrollments')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            subject,
            course,
            grade,
            level,
            is_active,
            start_date,
            end_date,
            max_students,
            min_students,
            created_at,
            tenant_memberships:instructor_id (
              id,
              user_profiles:user_id (
                id,
                name,
                email
              )
            )
          ),
          course_packages:package_id (
            id,
            name,
            billing_type,
            price
          ),
          user_profiles:enrolled_by (
            id,
            name,
            email
          )
        `)
        .eq('student_id', params.id)
        .eq('tenant_id', queryParams.tenantId)

      // 상태 필터링
      if (queryParams.status !== 'all') {
        query = query.eq('status', queryParams.status)
      }

      // 데이터 조회
      const { data: enrollments, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 학생 클래스 목록 조회 실패:', error)
        throw new Error(`학생 클래스 목록 조회 실패: ${error.message}`)
      }

      let filteredEnrollments = enrollments || []

      // 검색 필터링 (애플리케이션 레벨)
      if (queryParams.search) {
        const searchTerm = queryParams.search.toLowerCase()
        filteredEnrollments = filteredEnrollments.filter((enrollment: any) => {
          const classData = enrollment.classes
          if (!classData) return false
          
          return (
            classData.name?.toLowerCase().includes(searchTerm) ||
            classData.subject?.toLowerCase().includes(searchTerm) ||
            classData.course?.toLowerCase().includes(searchTerm) ||
            classData.grade?.toLowerCase().includes(searchTerm)
          )
        })
      }

      // 페이지네이션 적용
      const total = filteredEnrollments.length
      const paginatedEnrollments = filteredEnrollments.slice(
        queryParams.offset,
        queryParams.offset + queryParams.limit
      )

      // 상태별 분류 (필터링된 결과에서)
      const activeEnrollments = paginatedEnrollments?.filter(e => e.status === 'active') || []
      const completedEnrollments = paginatedEnrollments?.filter(e => e.status === 'completed') || []
      const suspendedEnrollments = paginatedEnrollments?.filter(e => e.status === 'suspended') || []
      const cancelledEnrollments = paginatedEnrollments?.filter(e => e.status === 'cancelled') || []

      const result = {
        studentInfo: {
          id: studentData.id,
          name: studentData.name,
          studentNumber: studentData.student_number,
          status: studentData.status
        },
        enrollments: {
          active: activeEnrollments,
          completed: completedEnrollments,
          suspended: suspendedEnrollments,
          cancelled: cancelledEnrollments,
          all: paginatedEnrollments || []
        },
        summary: {
          total: total,
          active: filteredEnrollments.filter(e => e.status === 'active').length,
          completed: filteredEnrollments.filter(e => e.status === 'completed').length,
          suspended: filteredEnrollments.filter(e => e.status === 'suspended').length,
          cancelled: filteredEnrollments.filter(e => e.status === 'cancelled').length
        },
        pagination: {
          total: total,
          limit: queryParams.limit,
          offset: queryParams.offset,
          hasMore: total > queryParams.offset + queryParams.limit
        }
      }

      logApiSuccess('get-student-classes', { 
        studentId: params.id,
        enrollmentCount: paginatedEnrollments?.length || 0,
        total: total
      })

      return createSuccessResponse(result)
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 학생에게 클래스 등록
 * POST /api/students/[id]/classes
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('add-class-to-student', { userId: userProfile!.id, studentId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        addClassToStudentSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const enrollmentData: AddClassToStudentData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, enrollmentData.tenantId)) {
        throw new Error('해당 테넌트에 클래스를 등록할 권한이 없습니다.')
      }

      // 학생 존재 및 활성 상태 확인
      const { data: student } = await supabase
        .from('students')
        .select('id, name, tenant_id, status')
        .eq('id', params.id)
        .eq('tenant_id', enrollmentData.tenantId)
        .single()

      if (!student) {
        throw new Error('학생을 찾을 수 없습니다.')
      }

      if (student.status !== 'active') {
        throw new Error('비활성 상태의 학생에게는 클래스를 등록할 수 없습니다.')
      }

      // 클래스 존재 및 활성 상태 확인
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name, tenant_id, is_active, max_students')
        .eq('id', enrollmentData.classId)
        .eq('tenant_id', enrollmentData.tenantId)
        .single()

      if (!classData) {
        throw new Error('클래스를 찾을 수 없습니다.')
      }

      if (!classData.is_active) {
        throw new Error('비활성 상태의 클래스는 등록할 수 없습니다.')
      }

      // 클래스 정원 확인
      if (classData.max_students) {
        const { count: currentEnrollments } = await supabase
          .from('student_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', enrollmentData.classId)
          .eq('status', 'active')

        if (currentEnrollments && currentEnrollments >= classData.max_students) {
          throw new Error('클래스 정원이 가득 찼습니다.')
        }
      }

      // 중복 등록 확인
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', params.id)
        .eq('class_id', enrollmentData.classId)
        .eq('status', 'active')
        .single()

      if (existingEnrollment) {
        throw new Error('해당 학생은 이미 이 클래스에 등록되어 있습니다.')
      }

      // 클래스 내 다음 position 계산
      const { data: maxPositionResult } = await supabase
        .from('student_enrollments')
        .select('position_in_class')
        .eq('class_id', enrollmentData.classId)
        .order('position_in_class', { ascending: false })
        .limit(1)
        .single()

      const nextPosition = (maxPositionResult?.position_in_class || 0) + 1

      // 수강 등록 생성
      const { data: newEnrollment, error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: params.id,
          class_id: enrollmentData.classId,
          tenant_id: enrollmentData.tenantId,
          enrolled_by: userProfile!.id,
          enrollment_date: new Date().toISOString(),
          start_date: new Date().toISOString(),
          original_price: enrollmentData.originalPrice,
          discount_amount: enrollmentData.discountAmount,
          final_price: enrollmentData.finalPrice,
          payment_plan: enrollmentData.paymentPlan,
          hours_total: enrollmentData.hoursTotal,
          sessions_total: enrollmentData.sessionsTotal,
          video_access_expires_at: enrollmentData.videoAccessExpiresAt,
          can_download_videos: enrollmentData.canDownloadVideos,
          position_in_class: nextPosition,
          notes: enrollmentData.notes,
          custom_fields: enrollmentData.customFields,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          classes:class_id (
            id,
            name,
            subject,
            course,
            grade,
            level,
            is_active,
            tenant_memberships:instructor_id (
              id,
              user_profiles:user_id (
                id,
                name,
                email
              )
            )
          ),
          user_profiles:enrolled_by (
            id,
            name,
            email
          )
        `)
        .single()

      if (error) {
        console.error('❌ 클래스 등록 실패:', error)
        throw new Error(`클래스 등록 실패: ${error.message}`)
      }

      logApiSuccess('add-class-to-student', { 
        studentId: params.id,
        classId: enrollmentData.classId,
        enrollmentId: newEnrollment.id
      })

      return createSuccessResponse(
        { enrollment: newEnrollment },
        '클래스가 학생에게 성공적으로 등록되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}