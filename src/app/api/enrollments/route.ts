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

// 수강 정보 조회 파라미터 스키마
const getEnrollmentsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다').optional().nullable(),
  studentId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  packageId: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'completed', 'suspended', 'cancelled', 'all']).default('all'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  includeDetails: z.boolean().default(false)
})

// 수강 등록 생성 스키마
const createEnrollmentSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  student_id: z.string().uuid('학생 ID는 필수입니다'),
  class_id: z.string().uuid().optional(),
  package_id: z.string().uuid('패키지 ID는 필수입니다'),
  enrollment_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  original_price: z.number().min(0),
  discount_amount: z.number().min(0).default(0),
  final_price: z.number().min(0),
  payment_plan: z.string().optional(),
  hours_total: z.number().min(0).optional(),
  sessions_total: z.number().min(0).optional(),
  video_access_expires_at: z.string().optional(),
  can_download_videos: z.boolean().default(false),
  notes: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
  enrolled_by: z.string().uuid().optional(),
  status: z.enum(['active', 'completed', 'suspended', 'cancelled']).default('active')
})

type GetEnrollmentsParams = z.infer<typeof getEnrollmentsSchema>
type CreateEnrollmentData = z.infer<typeof createEnrollmentSchema>

/**
 * 수강 정보 목록 조회
 * GET /api/enrollments?tenantId=xxx&studentId=xxx&classId=xxx&status=active&includeDetails=true
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-enrollments', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        studentId: searchParams.get('studentId'),
        classId: searchParams.get('classId'),
        packageId: searchParams.get('packageId'),
        status: searchParams.get('status') || 'all',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        includeDetails: searchParams.get('includeDetails') === 'true'
      }
      
      console.log('📋 API 파라미터:', rawParams)

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getEnrollmentsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetEnrollmentsParams = validationResult

      // 테넌트 권한 검증 (시스템 관리자는 전체 접근 가능)
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 수강 정보에 접근할 권한이 없습니다.')
      }

      // 기본 쿼리 구성
      let selectFields = `
        *,
        students:student_id (
          id,
          name,
          student_number,
          status,
          phone,
          email
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
      `

      // 결제 정보 포함 옵션
      if (params.includeDetails) {
        selectFields += `,
        payments (
          id,
          amount,
          status,
          due_date,
          payment_date,
          payment_method
        )
        `
      }

      let query = supabase
        .from('student_enrollments')
        .select(selectFields)

      // 시스템 관리자가 아닌 경우에만 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

      // 학생 필터링
      if (params.studentId) {
        query = query.eq('student_id', params.studentId)
      }

      // 클래스 필터링
      if (params.classId) {
        query = query.eq('class_id', params.classId)
      }

      // 패키지 필터링
      if (params.packageId) {
        query = query.eq('package_id', params.packageId)
      }

      // 상태 필터링
      if (params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      // 페이지네이션
      const { data: enrollments, error, count } = await query
        .range(params.offset, params.offset + params.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 수강 정보 목록 조회 실패:', error)
        throw new Error(`수강 정보 목록 조회 실패: ${error.message}`)
      }

      const result = {
        enrollments: enrollments || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }

      logApiSuccess('get-enrollments', { 
        count: enrollments?.length || 0, 
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
 * 새 수강 등록 생성
 * POST /api/enrollments
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-enrollment', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createEnrollmentSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const enrollmentData: CreateEnrollmentData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, enrollmentData.tenantId)) {
        throw new Error('해당 테넌트에 수강 등록을 생성할 권한이 없습니다.')
      }

      // 학생 존재 및 권한 확인
      const { data: student } = await supabase
        .from('students')
        .select('id, name, tenant_id, status')
        .eq('id', enrollmentData.student_id)
        .eq('tenant_id', enrollmentData.tenantId)
        .single()

      if (!student) {
        throw new Error('유효하지 않은 학생입니다.')
      }

      if (student.status !== 'active') {
        throw new Error('비활성 상태의 학생은 수강 등록할 수 없습니다.')
      }

      // 코스패키지 존재 및 유효성 확인
      const { data: coursePackage } = await supabase
        .from('course_packages')
        .select('id, name, tenant_id, is_active, price, class_id')
        .eq('id', enrollmentData.package_id)
        .eq('tenant_id', enrollmentData.tenantId)
        .single()

      if (!coursePackage) {
        throw new Error('유효하지 않은 코스패키지입니다.')
      }

      if (!coursePackage.is_active) {
        throw new Error('비활성 상태의 코스패키지는 등록할 수 없습니다.')
      }

      // 클래스 존재 확인 (class_id가 제공된 경우)
      if (enrollmentData.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, tenant_id, status')
          .eq('id', enrollmentData.class_id)
          .eq('tenant_id', enrollmentData.tenantId)
          .single()

        if (!classData) {
          throw new Error('유효하지 않은 클래스입니다.')
        }

        if (classData.status !== 'active') {
          throw new Error('비활성 상태의 클래스는 등록할 수 없습니다.')
        }
      } else if (coursePackage.class_id) {
        // 패키지에 클래스가 지정되어 있는 경우 자동 설정
        enrollmentData.class_id = coursePackage.class_id
      }

      // 중복 등록 확인 (같은 학생, 같은 패키지, 활성 상태)
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', enrollmentData.student_id)
        .eq('package_id', enrollmentData.package_id)
        .eq('status', 'active')
        .single()

      if (existingEnrollment) {
        throw new Error('이미 해당 패키지로 활성 수강 중입니다.')
      }

      // 등록자 정보 설정
      const finalEnrollmentData = {
        ...enrollmentData,
        enrolled_by: enrollmentData.enrolled_by || userProfile!.id,
        enrollment_date: enrollmentData.enrollment_date || new Date().toISOString()
      }

      // 수강 등록 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restEnrollmentData } = finalEnrollmentData
      const { data: newEnrollment, error } = await supabase
        .from('student_enrollments')
        .insert({
          ...restEnrollmentData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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
        console.error('❌ 수강 등록 생성 실패:', error)
        throw new Error(`수강 등록 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-enrollment', { 
        enrollmentId: newEnrollment.id,
        studentId: newEnrollment.student_id,
        packageId: newEnrollment.package_id
      })

      return createSuccessResponse(
        { enrollment: newEnrollment },
        '수강 등록이 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}