import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: '인증되지 않은 사용자입니다.',
        authenticated: false 
      }, { status: 401 })
    }

    // 프로필 정보 조회
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
      .eq('id', user.id)
      .single()

    console.log('🔍 [AUTH-ME] User info:', {
      userId: user.id,
      email: user.email,
      profile: profile ? {
        role: profile.role,
        tenant_id: profile.tenant_id,
        status: profile.status,
        email_verified: profile.email_verified
      } : 'No profile found',
      profileError: profileError?.message
    })

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? true : false
      },
      profile: profile || null,
      profileError: profileError?.message || null
    })

  } catch (error) {
    console.error('❌ [AUTH-ME] Error:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}