import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    // 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No active session' 
      })
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        profile: null,
        error: 'Failed to fetch profile'
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        tenant_id: profile.tenant_id,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      session: {
        access_token: session.access_token ? 'Present' : 'Missing',
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}