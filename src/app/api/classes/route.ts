import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'

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
  instructor_id: z.string().uuid().optional().or(z.literal('')),
  classroom_id: z.string().uuid().optional().or(z.literal('')),
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
    const supabase = createServiceRoleClient()

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
      instructors:instructor_id (
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
  try {
    console.log('🎯 클래스 생성 API 시작')

    // Supabase 클라이언트 생성
    const supabase = createServiceRoleClient()

    // 입력 검증
    const body: unknown = await request.json()
    
    // Zod 스키마로 검증
    console.log('🔍 클래스 생성 입력 데이터:', body)
    const parseResult = createClassSchema.safeParse(body)
    if (!parseResult.success) {
      console.error('❌ Zod 검증 실패:', parseResult.error.issues)
      return NextResponse.json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: parseResult.error.issues
      }, { status: 400 })
    }

    const classData: CreateClassData = parseResult.data

    // 빈 문자열과 undefined를 null로 변환
    const cleanedData = {
      ...classData,
      instructor_id: (classData.instructor_id === '' || classData.instructor_id === undefined) ? null : classData.instructor_id,
      classroom_id: (classData.classroom_id === '' || classData.classroom_id === undefined) ? null : classData.classroom_id,
      start_date: (classData.start_date === '' || classData.start_date === undefined) ? null : classData.start_date,
      end_date: (classData.end_date === '' || classData.end_date === undefined) ? null : classData.end_date,
      color: (classData.color === '' || classData.color === undefined) ? null : classData.color,
      description: (classData.description === '' || classData.description === undefined) ? null : classData.description,
      main_textbook: (classData.main_textbook === '' || classData.main_textbook === undefined) ? null : classData.main_textbook,
      supplementary_textbook: (classData.supplementary_textbook === '' || classData.supplementary_textbook === undefined) ? null : classData.supplementary_textbook,
      grade: (classData.grade === '' || classData.grade === undefined) ? null : classData.grade,
      course: (classData.course === '' || classData.course === undefined) ? null : classData.course,
      subject: (classData.subject === '' || classData.subject === undefined) ? null : classData.subject
    }

    console.log('📝 클래스 생성 데이터:', cleanedData)

    // 클래스명 중복 확인 (같은 테넌트 내)
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('tenant_id', cleanedData.tenantId)
      .eq('name', cleanedData.name)
      .single()

    if (existingClass) {
      return NextResponse.json({
        error: '이미 존재하는 클래스명입니다.'
      }, { status: 409 })
    }

    // 강사 존재 확인 (instructor_id가 제공된 경우)
    if (cleanedData.instructor_id) {
      const { data: instructor, error: instructorError } = await supabase
        .from('instructors')
        .select('id, name')
        .eq('id', cleanedData.instructor_id)
        .eq('tenant_id', cleanedData.tenantId)
        .eq('status', 'active')
        .single()

      if (!instructor || instructorError) {
        return NextResponse.json({
          error: '유효하지 않은 강사입니다.'
        }, { status: 400 })
      }

      console.log('✅ 강사 검증 완료:', instructor.name)
    }

    // 클래스 생성 - tenantId를 tenant_id로 매핑
    const { tenantId, ...restClassData } = cleanedData
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
        instructors:instructor_id (
          id,
          name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('❌ 클래스 생성 실패:', error)
      return NextResponse.json({
        error: `클래스 생성 실패: ${error.message}`
      }, { status: 500 })
    }

    console.log('✅ 클래스 생성 성공:', newClass.id)

    return NextResponse.json({
      success: true,
      message: '클래스가 성공적으로 생성되었습니다.',
      data: { class: newClass }
    }, { status: 201 })

  } catch (error) {
    console.error('💥 클래스 생성 API 오류:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '클래스 생성 중 알 수 없는 오류가 발생했습니다.'
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}