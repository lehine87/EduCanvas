import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isCheckEmailRequest, createErrorResponse } from '@/types'
import type { CheckEmailRequest, CheckEmailResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    
    // 타입 가드를 사용한 안전한 입력 검증
    if (!isCheckEmailRequest(body)) {
      console.warn('⚠️ CheckEmail API 잘못된 요청 형식:', body)
      return createErrorResponse('이메일 주소가 필요합니다.', 400)
    }

    const { email }: CheckEmailRequest = body

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
      return createErrorResponse('이메일 검사 중 오류가 발생했습니다.', 500)
    }

    const exists = !!data
    console.log(`${exists ? '❌' : '✅'} 이메일 중복 검사 결과:`, { email, exists })

    const response = {
      success: true,
      data: {
        exists
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('💥 이메일 검사 API 오류:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '내부 서버 오류가 발생했습니다.'
      
    return createErrorResponse(errorMessage, 500)
  }
}