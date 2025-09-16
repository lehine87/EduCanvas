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

// 클래스별 학생 조회 파라미터 스키마
const getClassStudentsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  status: z.enum(['active', 'completed', 'suspended', 'cancelled', 'all']).default('active'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional()
})

// 클래스에 학생 등록 스키마
const addStudentToClassSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  studentId: z.string().uuid('학생 ID는 필수입니다'),
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

type GetClassStudentsParams = z.infer<typeof getClassStudentsSchema>
type AddStudentToClassData = z.infer<typeof addStudentToClassSchema>

/**
 * 클래스별 학생 목록 조회
 * GET /api/classes/[id]/students?tenantId=xxx&status=active&search=김민수
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-class-students', { userId: userProfile!.id, classId: params.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        status: searchParams.get('status') || 'active',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search') || undefined
      }

      if (!rawParams.tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getClassStudentsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const queryParams: GetClassStudentsParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, queryParams.tenantId)) {
        throw new Error('해당 테넌트의 클래스 학생 정보에 접근할 권한이 없습니다.')
      }

      // 클래스 존재 확인
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name, tenant_id, is_active')
        .eq('id', params.id)
        .eq('tenant_id', queryParams.tenantId)
        .single()

      if (!classData) {
        throw new Error('클래스를 찾을 수 없습니다.')
      }

      // 클래스별 학생 목록 조회
      let query = supabase
        .from('student_enrollments')
        .select(`
          *,
          students:student_id (
            id,
            name,
            student_number,
            status,
            phone,
            email,
            grade_level,
            school_name,
            profile_image,
            created_at
          ),
          user_profiles:enrolled_by (
            id,
            name,
            email
          )
        `)
        .eq('class_id', params.id)
        .eq('tenant_id', queryParams.tenantId)

      // 상태 필터링
      if (queryParams.status !== 'all') {
        query = query.eq('status', queryParams.status)
      }

      // 데이터 조회
      const { data: enrollments, error } = await query
        .order('position_in_class', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 클래스 학생 목록 조회 실패:', error)
        throw new Error(`클래스 학생 목록 조회 실패: ${error.message}`)
      }

      let filteredEnrollments = enrollments || []

      // 검색 필터링 (애플리케이션 레벨)
      if (queryParams.search) {
        const searchTerm = queryParams.search.toLowerCase()
        filteredEnrollments = filteredEnrollments.filter((enrollment: any) => {
          const student = enrollment.students
          if (!student) return false
          
          return (
            student.name?.toLowerCase().includes(searchTerm) ||
            student.student_number?.toLowerCase().includes(searchTerm) ||
            student.phone?.toLowerCase().includes(searchTerm) ||
            student.email?.toLowerCase().includes(searchTerm)
          )
        })
      }

      // 페이지네이션 적용
      const total = filteredEnrollments.length
      const paginatedEnrollments = filteredEnrollments.slice(
        queryParams.offset,
        queryParams.offset + queryParams.limit
      )

      const result = {
        classInfo: {
          id: classData.id,
          name: classData.name,
          isActive: classData.is_active
        },
        students: paginatedEnrollments,
        pagination: {
          total: total,
          limit: queryParams.limit,
          offset: queryParams.offset,
          hasMore: total > queryParams.offset + queryParams.limit
        }
      }

      logApiSuccess('get-class-students', { 
        classId: params.id,
        studentCount: paginatedEnrollments?.length || 0,
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
 * 클래스에 학생 등록
 * POST /api/classes/[id]/students
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('add-student-to-class', { userId: userProfile!.id, classId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        addStudentToClassSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const enrollmentData: AddStudentToClassData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, enrollmentData.tenantId)) {
        throw new Error('해당 테넌트에 학생을 등록할 권한이 없습니다.')
      }

      // 클래스 존재 및 활성 상태 확인
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name, tenant_id, is_active, max_students')
        .eq('id', params.id)
        .eq('tenant_id', enrollmentData.tenantId)
        .single()

      if (!classData) {
        throw new Error('클래스를 찾을 수 없습니다.')
      }

      if (!classData.is_active) {
        throw new Error('비활성 상태의 클래스에는 학생을 등록할 수 없습니다.')
      }

      // 학생 존재 및 활성 상태 확인
      const { data: student } = await supabase
        .from('students')
        .select('id, name, tenant_id, status')
        .eq('id', enrollmentData.studentId)
        .eq('tenant_id', enrollmentData.tenantId)
        .single()

      if (!student) {
        throw new Error('학생을 찾을 수 없습니다.')
      }

      if (student.status !== 'active') {
        throw new Error('비활성 상태의 학생은 등록할 수 없습니다.')
      }

      // 클래스 정원 확인
      if (classData.max_students) {
        const { count: currentEnrollments } = await supabase
          .from('student_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', params.id)
          .eq('status', 'active')

        if (currentEnrollments && currentEnrollments >= classData.max_students) {
          throw new Error('클래스 정원이 가득 찼습니다.')
        }
      }

      // 중복 등록 확인
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', enrollmentData.studentId)
        .eq('class_id', params.id)
        .eq('status', 'active')
        .single()

      if (existingEnrollment) {
        throw new Error('해당 학생은 이미 이 클래스에 등록되어 있습니다.')
      }

      // 클래스 내 다음 position 계산
      const { data: maxPositionResult } = await supabase
        .from('student_enrollments')
        .select('position_in_class')
        .eq('class_id', params.id)
        .order('position_in_class', { ascending: false })
        .limit(1)
        .single()

      const nextPosition = (maxPositionResult?.position_in_class || 0) + 1

      // 수강 등록 생성
      const { data: newEnrollment, error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: enrollmentData.studentId,
          class_id: params.id,
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
          students:student_id (
            id,
            name,
            student_number,
            status,
            phone,
            email,
            grade_level,
            school_name,
            profile_image
          ),
          user_profiles:enrolled_by (
            id,
            name,
            email
          )
        `)
        .single()

      if (error) {
        console.error('❌ 학생 등록 실패:', error)
        throw new Error(`학생 등록 실패: ${error.message}`)
      }

      logApiSuccess('add-student-to-class', { 
        classId: params.id,
        studentId: enrollmentData.studentId,
        enrollmentId: newEnrollment.id
      })

      return createSuccessResponse(
        { enrollment: newEnrollment },
        '학생이 클래스에 성공적으로 등록되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}