import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 테넌트 관리자 API - 회원 목록 조회 시작')
    
    // URL에서 tenantId 추출
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status') // 'all', 'pending', 'active' 등
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId가 필요합니다.' },
        { status: 400 }
      )
    }
    
    console.log(`📋 테넌트 ${tenantId}의 회원 목록 조회 중... (status: ${status || 'all'})`)
    
    // 기본 쿼리
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        tenants:tenant_id (
          name,
          tenant_code
        )
      `)
      .eq('tenant_id', tenantId)
    
    // 상태별 필터링 (실제 데이터베이스 ENUM 값 사용)
    if (status === 'pending') {
      query = query.eq('status', 'pending_approval')
    } else if (status === 'active') {
      query = query.eq('status', 'active')
    }
    // status === 'all'인 경우 모든 상태 포함
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 회원 목록 조회 실패:', error)
      return NextResponse.json(
        { error: `회원 목록 조회 실패: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ 회원 목록 조회 성공: ${data?.length || 0}명`)
    
    // 통계 계산 (실제 데이터베이스 값 기반)
    const stats = {
      total: data?.length || 0,
      active: data?.filter(user => user.status === 'active').length || 0,
      pending: data?.filter(user => user.status === 'pending_approval').length || 0,
      instructors: data?.filter(user => user.role === 'instructor').length || 0,
      staff: data?.filter(user => user.role === 'staff').length || 0
    }
    
    console.log('📊 회원 통계:', stats)

    return NextResponse.json({
      members: data || [],
      stats
    })

  } catch (error: any) {
    console.error('💥 테넌트 관리자 API - 회원 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '내부 서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}