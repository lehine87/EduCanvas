import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('📧 이메일 중복 검사:', email)

    // Service Role 클라이언트 생성 (환경변수 체크 포함)
    const supabase = createServiceRoleClient()

    // user_profiles 테이블에서 이메일 중복 검사
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('❌ 이메일 검사 오류:', error)
      return NextResponse.json(
        { error: '이메일 검사 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const exists = !!data
    console.log(`${exists ? '❌' : '✅'} 이메일 중복 검사 결과:`, { email, exists })

    return NextResponse.json({
      exists,
      email,
      message: exists 
        ? '이미 사용 중인 이메일입니다' 
        : '사용 가능한 이메일입니다'
    })

  } catch (error) {
    console.error('💥 이메일 검사 API 오류:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '내부 서버 오류가 발생했습니다.'
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}