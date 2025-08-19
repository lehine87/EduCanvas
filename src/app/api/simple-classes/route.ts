import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 간단한 클래스 API (인증 없이)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 간단한 클래스 API 호출됨')
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('📡 Supabase 연결 시도')
    
    // 매우 간단한 쿼리
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, is_active')
      .limit(5)
    
    console.log('📊 쿼리 결과:', { classes: classes?.length, error })
    
    if (error) {
      console.error('❌ 쿼리 에러:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: { classes: classes || [] },
      message: `${classes?.length || 0}개의 클래스를 찾았습니다`
    })
    
  } catch (error) {
    console.error('🚨 간단한 클래스 API 에러:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      }, 
      { status: 500 }
    )
  }
}