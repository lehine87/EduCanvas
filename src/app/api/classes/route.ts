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

// 클래스 조회 파라미터 스키마
const getClassesSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  includeStudents: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  grade: z.string().optional(),
  course: z.string().optional()
})

// 클래스 생성 스키마
const createClassSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '클래스 이름은 필수입니다'),
  grade: z.string().optional(),
  course: z.string().optional(),
  instructor_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  max_students: z.number().int().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

type GetClassesParams = z.infer<typeof getClassesSchema>
type CreateClassData = z.infer<typeof createClassSchema>

/**
 * 클래스 목록 조회 (학생 정보 포함 옵션)
 * GET /api/classes?tenantId=xxx&includeStudents=true&status=active&grade=중1&course=수학
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-classes', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        includeStudents: searchParams.get('includeStudents') === 'true',
        status: searchParams.get('status') || 'all',
        grade: searchParams.get('grade'),
        course: searchParams.get('course')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getClassesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetClassesParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 클래스 정보에 접근할 권한이 없습니다.')
      }

      // 기본 쿼리 구성
      let selectFields = `
        *,
        instructors:instructor_id (
          id,
          name,
          email
        ),
        classrooms:classroom_id (
          id,
          name,
          capacity
        )
      `

      // 학생 정보 포함 옵션
      if (params.includeStudents) {
        selectFields += `,
        students (
          id,
          name,
          student_number,
          status,
          grade,
          phone,
          email
        )
        `
      }

      let query = supabase
        .from('classes')
        .select(selectFields)
        .eq('tenant_id', params.tenantId)

      // 상태 필터링
      if (params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      // 학년 필터링
      if (params.grade) {
        query = query.eq('grade', params.grade)
      }

      // 과정 필터링
      if (params.course) {
        query = query.eq('course', params.course)
      }

      const { data: classes, error } = await query
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ 클래스 목록 조회 실패:', error)
        throw new Error(`클래스 목록 조회 실패: ${error.message}`)
      }

      // 기본 클래스 정보 반환 (간소화)
      const classesWithStats = (classes || []).map(cls => ({
        ...cls,
        student_count: 0 // 실제 구현시 계산 필요
      })) as Array<typeof classes[0] & { student_count: number }>

      const result = {
        classes: classesWithStats,
        total: classes?.length || 0
      }

      logApiSuccess('get-classes', { 
        count: classes?.length || 0,
        includeStudents: params.includeStudents
      })

      return createSuccessResponse(result)
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 새 클래스 생성
 * POST /api/classes
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-class', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createClassSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const classData: CreateClassData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, classData.tenantId)) {
        throw new Error('해당 테넌트에 클래스를 생성할 권한이 없습니다.')
      }

      // 클래스명 중복 확인 (같은 테넌트 내)
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id')
        .eq('tenant_id', classData.tenantId)
        .eq('name', classData.name)
        .single()

      if (existingClass) {
        throw new Error('이미 존재하는 클래스명입니다.')
      }

      // 강사 권한 확인 (instructor_id가 제공된 경우)
      if (classData.instructor_id) {
        const { data: instructor } = await supabase
          .from('user_profiles')
          .select('id, role, tenant_id')
          .eq('id', classData.instructor_id)
          .eq('tenant_id', classData.tenantId)
          .eq('role', 'instructor')
          .eq('status', 'active')
          .single()

        if (!instructor) {
          throw new Error('유효하지 않은 강사입니다.')
        }
      }

      // 클래스 생성
      const { data: newClass, error } = await supabase
        .from('classes')
        .insert({
          ...classData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          instructors:instructor_id (
            id,
            name,
            email
          ),
          classrooms:classroom_id (
            id,
            name,
            capacity
          )
        `)
        .single()

      if (error) {
        console.error('❌ 클래스 생성 실패:', error)
        throw new Error(`클래스 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-class', { 
        classId: newClass.id,
        className: newClass.name 
      })

      return createSuccessResponse(
        { class: newClass },
        '클래스가 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}