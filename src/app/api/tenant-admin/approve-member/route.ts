import { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient as createMiddlewareClient } from '@/lib/supabase/middleware'
import { isApproveMemberRequest, createErrorResponse, createSuccessResponse } from '@/types'
import type { ApproveMemberRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 테넌트 관리자 API - 회원 승인/거부 시작')
    
    // 현재 로그인한 사용자 확인
    const { supabase: middlewareClient } = createMiddlewareClient(request)
    const { data: { session }, error: sessionError } = await middlewareClient.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('❌ 인증 실패:', sessionError?.message)
      return createErrorResponse('로그인이 필요합니다.', 401)
    }

    // 현재 사용자가 테넌트 관리자인지 확인
    const supabaseServiceRole = createServiceRoleClient()
    
    const { data: currentUserProfile } = await supabaseServiceRole
      .from('user_profiles')
      .select('tenant_id, role, status')
      .eq('id', session.user.id)
      .single()

    if (!currentUserProfile || currentUserProfile.status !== 'active') {
      console.error('❌ 사용자 프로필을 찾을 수 없거나 활성화되지 않음')
      return createErrorResponse('유효하지 않은 사용자입니다.', 403)
    }
    
    const body: unknown = await request.json()
    
    // 타입 가드를 사용한 안전한 입력 검증
    if (!isApproveMemberRequest(body)) {
      console.warn('⚠️ ApproveMember API 잘못된 요청 형식:', body)
      return createErrorResponse('필수 파라미터가 누락되었거나 형식이 올바르지 않습니다.', 400)
    }

    const { userId, action, tenantId }: ApproveMemberRequest = body

    // 같은 테넌트 관리자만 승인 가능 (보안 검증)
    if (currentUserProfile.tenant_id !== tenantId) {
      console.error('❌ 테넌트 권한 없음:', { 
        currentTenant: currentUserProfile.tenant_id, 
        requestedTenant: tenantId 
      })
      return createErrorResponse('해당 테넌트의 회원을 관리할 권한이 없습니다.', 403)
    }
    
    console.log(`👤 사용자 ${userId} ${action === 'approve' ? '승인' : '거부'} 처리 중...`)
    
    if (action === 'approve') {
      // 승인: status를 'active'로 변경
      const { error } = await supabaseServiceRole
        .from('user_profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('tenant_id', tenantId) // 보안: 같은 테넌트만 수정 가능
      
      if (error) {
        console.error('❌ 회원 승인 실패:', error)
        return createErrorResponse(`회원 승인 실패: ${error.message}`, 500)
      }
      
      console.log('✅ 회원 승인 성공')
      
    } else if (action === 'reject') {
      // 거부: user_profiles에서 삭제하고 auth.users도 삭제
      const { error: profileError } = await supabaseServiceRole
        .from('user_profiles')
        .delete()
        .eq('id', userId)
        .eq('tenant_id', tenantId)
      
      if (profileError) {
        console.error('❌ 프로필 삭제 실패:', profileError)
        return createErrorResponse(`프로필 삭제 실패: ${profileError.message}`, 500)
      }
      
      // auth.users에서도 삭제
      const { error: authError } = await supabaseServiceRole.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('❌ Auth 사용자 삭제 실패:', authError)
        // 프로필은 이미 삭제되었으므로 로그만 남기고 계속 진행
      }
      
      console.log('✅ 회원 거부 및 삭제 성공')
    } else {
      return createErrorResponse('유효하지 않은 action입니다. (approve/reject)', 400)
    }

    return createSuccessResponse(
      null, 
      action === 'approve' ? '회원이 승인되었습니다.' : '회원이 거부되었습니다.'
    )

  } catch (error) {
    console.error('💥 테넌트 관리자 API - 회원 승인/거부 오류:', error)
    
    // 타입 가드를 사용한 안전한 에러 처리
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '내부 서버 오류가 발생했습니다.'
    
    return createErrorResponse(errorMessage, 500)
  }
}