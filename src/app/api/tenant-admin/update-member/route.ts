import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient as createMiddlewareClient } from '@/lib/supabase/middleware'

export async function POST(request: NextRequest) {
  try {
    const { userId, updates, tenantId } = await request.json()

    if (!userId || !updates || !tenantId) {
      return NextResponse.json(
        { error: '필수 매개변수가 누락되었습니다.' },
        { status: 400 }
      )
    }

    console.log('🏢 테넌트 관리자 API - 회원 정보 업데이트 시작')
    console.log('📝 업데이트 요청:', { userId, updates, tenantId })

    // 현재 로그인한 사용자 확인
    const { supabase: middlewareClient } = createMiddlewareClient(request)
    const { data: { user }, error: userError } = await middlewareClient.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ 인증 실패:', userError?.message)
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 현재 사용자의 프로필 확인 (권한 검사)
    const supabaseServiceRole = createServiceRoleClient()
    
    const { data: currentUserProfile, error: profileError } = await supabaseServiceRole
      .from('user_profiles')
      .select('tenant_id, role, status')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile || currentUserProfile.status !== 'active') {
      console.error('❌ 사용자 프로필 조회 실패 또는 비활성 사용자:', profileError)
      return NextResponse.json(
        { error: '유효하지 않은 사용자입니다.' },
        { status: 403 }
      )
    }

    // 관리자 권한 검사
    if (currentUserProfile.role !== 'tenant_admin' && currentUserProfile.role !== 'system_admin') {
      console.error('❌ 관리자 권한 없음:', currentUserProfile.role)
      return NextResponse.json(
        { error: '회원을 관리할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 테넌트 권한 검사
    if (currentUserProfile.tenant_id !== tenantId) {
      console.error('❌ 테넌트 권한 없음:', {
        userTenant: currentUserProfile.tenant_id,
        requestedTenant: tenantId
      })
      return NextResponse.json(
        { error: '해당 테넌트의 회원을 관리할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 대상 사용자가 같은 테넌트에 속하는지 확인
    const { data: targetUser, error: targetError } = await supabaseServiceRole
      .from('user_profiles')
      .select('tenant_id, role, name, email')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      console.error('❌ 대상 사용자 조회 실패:', targetError)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (targetUser.tenant_id !== tenantId) {
      console.error('❌ 다른 테넌트의 사용자:', {
        targetTenant: targetUser.tenant_id,
        requestedTenant: tenantId
      })
      return NextResponse.json(
        { error: '해당 테넌트의 회원이 아닙니다.' },
        { status: 403 }
      )
    }

    // 관리자는 다른 관리자를 수정할 수 없음 (시스템 관리자는 제외)
    if (targetUser.role === 'tenant_admin' && currentUserProfile.role !== 'system_admin') {
      console.error('❌ 관리자는 다른 관리자를 수정할 수 없음')
      return NextResponse.json(
        { error: '다른 관리자의 정보를 변경할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 회원 정보 업데이트
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: updatedUser, error: updateError } = await supabaseServiceRole
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, role, status, updated_at')
      .single()

    if (updateError) {
      console.error('❌ 회원 정보 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: `회원 정보 업데이트에 실패했습니다: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ 회원 정보 업데이트 성공:', updatedUser)

    // 업데이트 내용에 따른 메시지 생성
    let message = '회원 정보가 업데이트되었습니다.'
    if (updates.status) {
      message = `${targetUser.name}님의 상태가 ${updates.status === 'active' ? '활성' : '비활성'}으로 변경되었습니다.`
    } else if (updates.role) {
      message = `${targetUser.name}님의 역할이 ${updates.role}로 변경되었습니다.`
    }

    return NextResponse.json({
      message,
      user: updatedUser
    })

  } catch (error) {
    console.error('🚨 테넌트 관리자 API 예외:', error)
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}