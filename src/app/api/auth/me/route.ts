import { NextRequest } from 'next/server'
import { 
  withApiHandler, 
  createSuccessResponse,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'

export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ userProfile, supabase }) => {
      logApiStart('get-me', { userId: userProfile!.id })

      // 현재 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }

      // 프로필 정보 조회 (userProfile은 이미 검증됨)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          role,
          tenant_id,
          status,
          email_verified,
          name,
          email,
          tenants (
            id,
            name,
            slug
          )
        `)
        .eq('id', userProfile!.id)
        .single()

      console.log('🔍 [AUTH-ME] User info:', {
        userId: userProfile!.id,
        email: userProfile!.email,
        profile: profile ? {
          role: profile.role,
          tenant_id: profile.tenant_id,
          status: profile.status,
          email_verified: profile.email_verified
        } : 'No profile found',
        profileError: profileError?.message
      })

      logApiSuccess('get-me', { userId: userProfile!.id })

      return createSuccessResponse({
        authenticated: true,
        user: {
          id: userProfile!.id,
          email: userProfile!.email,
          emailConfirmed: user?.email_confirmed_at ? true : false
        },
        profile: profile || null,
        profileError: profileError?.message || null
      })
    },
    {
      requireAuth: true
    }
  )
}