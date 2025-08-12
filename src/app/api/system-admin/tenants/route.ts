import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 시스템 관리자용 API - Service Role 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 시스템 관리자 API - 테넌트 목록 조회 시작')
    
    // 권한 확인은 나중에 추가 (현재는 개발용)
    // TODO: JWT 토큰 검증 및 system_admin 권한 확인
    
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        user_count:user_profiles(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 시스템 관리자 API - 테넌트 조회 실패:', error)
      return NextResponse.json(
        { error: '테넌트 목록을 가져올 수 없습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 시스템 관리자 API - 테넌트 조회 성공:', data?.length || 0, '개')
    data?.forEach(tenant => {
      const count = tenant.user_count?.[0]?.count || 0
      console.log(`   ${tenant.name}: ${count}명`)
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('💥 시스템 관리자 API - 예상치 못한 오류:', error)
    return NextResponse.json(
      { error: '내부 서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}