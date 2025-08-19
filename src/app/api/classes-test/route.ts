import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// withApiHandler 없이 클래스 API 테스트
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 클래스 테스트 API 호출됨')
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    console.log('🔍 클래스 조회 파라미터:', { tenantId })
    
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
    
    // 테넌트 필터링 (제공된 경우)
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    console.log('🔍 실행할 쿼리 생성됨')
    
    const { data: classes, error } = await query
      .order('name', { ascending: true })
      .limit(10)
    
    console.log('📊 쿼리 결과:', { classes: classes?.length, error })
    
    if (error) {
      console.error('❌ 클래스 목록 조회 실패:', error)
      throw new Error(`클래스 목록 조회 실패: ${error.message}`)
    }
    
    // 기본 클래스 정보 반환
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
      count: classes?.length || 0
    })
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('🚨 클래스 테스트 API 에러:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      }, 
      { status: 500 }
    )
  }
}