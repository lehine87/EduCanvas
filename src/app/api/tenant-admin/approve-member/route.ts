import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  isTenantAdmin,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'

// 입력 검증 스키마
const approveMemberSchema = z.object({
  userId: z.string().uuid('유효한 사용자 ID가 아닙니다'),
  action: z.enum(['approve', 'reject']),
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다')
})

type ApproveMemberRequest = z.infer<typeof approveMemberSchema>

export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('approve-member', { userId: userProfile!.id })

      // 1. 테넌트 관리자 권한 확인
      if (!isTenantAdmin(userProfile!)) {
        throw new Error('테넌트 관리자 권한이 필요합니다.')
      }

      // 2. 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        approveMemberSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { userId, action, tenantId }: ApproveMemberRequest = validationResult

      // 3. 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 회원을 관리할 권한이 없습니다.')
      }

      console.log(`👤 사용자 ${userId} ${action === 'approve' ? '승인' : '거부'} 처리 중...`)

      if (action === 'approve') {
        // 승인: status를 'active'로 변경
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .eq('tenant_id', tenantId) // 보안: 같은 테넌트만 수정 가능
        
        if (error) {
          console.error('❌ 회원 승인 실패:', error)
          throw new Error(`회원 승인 실패: ${error.message}`)
        }
        
        console.log('✅ 회원 승인 성공')
        
      } else if (action === 'reject') {
        // 거부: user_profiles에서 삭제하고 auth.users도 삭제
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId)
          .eq('tenant_id', tenantId)
        
        if (profileError) {
          console.error('❌ 프로필 삭제 실패:', profileError)
          throw new Error(`프로필 삭제 실패: ${profileError.message}`)
        }
        
        // auth.users에서도 삭제
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)
        
        if (authError) {
          console.error('❌ Auth 사용자 삭제 실패:', authError)
          // 프로필은 이미 삭제되었으므로 로그만 남기고 계속 진행
        }
        
        console.log('✅ 회원 거부 및 삭제 성공')
      }

      const message = action === 'approve' ? '회원이 승인되었습니다.' : '회원이 거부되었습니다.'
      
      logApiSuccess('approve-member', { userId, action, tenantId })

      return createSuccessResponse(null, message)
    },
    {
      requireAuth: true,
      requireTenantAdmin: true
    }
  )
}