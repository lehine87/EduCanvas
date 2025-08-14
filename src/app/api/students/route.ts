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

// 학생 조회 파라미터 스키마
const getStudentsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  classId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'all']).default('all'),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional()
})

// 학생 생성 스키마
const createStudentSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '학생 이름은 필수입니다'),
  student_number: z.string().min(1, '학번은 필수입니다'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  parent_name: z.string().optional(),
  parent_phone_1: z.string().optional(),
  parent_phone_2: z.string().optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

type GetStudentsParams = z.infer<typeof getStudentsSchema>
type CreateStudentData = z.infer<typeof createStudentSchema>

/**
 * 학생 목록 조회
 * GET /api/students?tenantId=xxx&classId=xxx&status=active&limit=100&offset=0&search=홍길동
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-students', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        classId: searchParams.get('classId'),
        status: searchParams.get('status') || 'all',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getStudentsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetStudentsParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 학생 정보에 접근할 권한이 없습니다.')
      }

      // 기본 쿼리 구성
      let query = supabase
        .from('students')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            grade,
            course
          ),
          student_enrollments!inner (
            id,
            status,
            enrolled_at,
            course_packages (
              id,
              name,
              duration_months
            )
          )
        `)
        .eq('tenant_id', params.tenantId)

      // 클래스 필터링
      if (params.classId) {
        query = query.eq('class_id', params.classId)
      }

      // 상태 필터링
      if (params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      // 검색 기능
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,student_number.ilike.%${params.search}%,phone.ilike.%${params.search}%`)
      }

      // 페이지네이션
      const { data: students, error, count } = await query
        .range(params.offset, params.offset + params.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 학생 목록 조회 실패:', error)
        throw new Error(`학생 목록 조회 실패: ${error.message}`)
      }

      const result = {
        students: students || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }

      logApiSuccess('get-students', { 
        count: students?.length || 0, 
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
 * 새 학생 생성
 * POST /api/students
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-student', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createStudentSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const studentData: CreateStudentData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, studentData.tenantId)) {
        throw new Error('해당 테넌트에 학생을 생성할 권한이 없습니다.')
      }

      // 학번 중복 확인
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('tenant_id', studentData.tenantId)
        .eq('student_number', studentData.student_number)
        .single()

      if (existingStudent) {
        throw new Error('이미 존재하는 학번입니다.')
      }

      // 학생 생성
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert({
          ...studentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('❌ 학생 생성 실패:', error)
        throw new Error(`학생 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-student', { 
        studentId: newStudent.id,
        studentNumber: newStudent.student_number 
      })

      return createSuccessResponse(
        { student: newStudent },
        '학생이 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}