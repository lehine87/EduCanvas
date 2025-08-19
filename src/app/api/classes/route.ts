import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// 클래스 조회 파라미터 스키마
const getClassesSchema = z.object({
  tenantId: z.string().optional().nullable(),
  includeStudents: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  grade: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
})

// 클래스 생성 스키마
const createClassSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '클래스 이름은 필수입니다'),
  grade: z.string().optional(),
  course: z.string().optional(),
  subject: z.string().optional(),
  instructor_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  max_students: z.number().int().min(1).optional(),
  min_students: z.number().int().min(1).optional(),
  color: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  main_textbook: z.string().max(200).optional(),
  supplementary_textbook: z.string().max(200).optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
})

type GetClassesParams = z.infer<typeof getClassesSchema>
type CreateClassData = z.infer<typeof createClassSchema>

/**
 * 클래스 목록 조회 (학생 정보 포함 옵션)
 * GET /api/classes?tenantId=xxx&includeStudents=true&status=active&grade=중1&course=수학
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 클래스 API 호출됨')
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const rawParams = {
      tenantId: searchParams.get('tenantId'),
      includeStudents: searchParams.get('includeStudents') === 'true',
      status: searchParams.get('status') || 'all',
      grade: searchParams.get('grade'),
      course: searchParams.get('course'),
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    console.log('🔍 클래스 조회 파라미터:', rawParams)

    // 파라미터 처리 (검증 생략)
    const params = {
      tenantId: rawParams.tenantId,
      includeStudents: rawParams.includeStudents,
      status: rawParams.status as 'active' | 'inactive' | 'all',
      grade: rawParams.grade,
      course: rawParams.course,
      limit: rawParams.limit,
      offset: rawParams.offset
    }

    // 기본 쿼리 구성
    let selectFields = `
      *,
      user_profiles:instructor_id (
        id,
        name,
        email
      )
    `

    let query = supabase
      .from('classes')
      .select(selectFields)
    
    // 테넌트 필터링
    if (params.tenantId) {
      query = query.eq('tenant_id', params.tenantId)
    }

    // 상태 필터링 (is_active 컬럼 사용)
    if (params.status !== 'all') {
      const isActive = params.status === 'active'
      query = query.eq('is_active', isActive)
    }

    // 학년 필터링
    if (params.grade) {
      query = query.eq('grade', params.grade)
    }

    // 과정 필터링
    if (params.course) {
      query = query.eq('course', params.course)
    }

    console.log('🔍 실행할 쿼리 생성됨')

    const { data: classes, error } = await query
      .order('name', { ascending: true })
      .limit(params.limit)
      .range(params.offset, params.offset + params.limit - 1)

    console.log('📊 쿼리 결과:', { classes: classes?.length, error })

    if (error) {
      console.error('❌ 클래스 목록 조회 실패:', error)
      throw new Error(`클래스 목록 조회 실패: ${error.message}`)
    }

    // 기본 클래스 정보 반환 (임시로 student_count를 0으로 설정)
    const classesWithStats = (classes || [])
      .filter((cls): cls is NonNullable<typeof cls> => cls !== null && cls !== undefined)
      .map(cls => Object.assign({}, cls, {
        student_count: 0 // 임시로 0으로 설정
      }))

    const result = {
      classes: classesWithStats,
      total: classes?.length || 0
    }

    console.log('✅ 처리 완료:', { 
      count: classes?.length || 0,
      includeStudents: params.includeStudents
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('🚨 클래스 API 에러:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      }, 
      { status: 500 }
    )
  }
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

      // 클래스 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restClassData } = classData
      const { data: newClass, error } = await supabase
        .from('classes')
        .insert({
          ...restClassData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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