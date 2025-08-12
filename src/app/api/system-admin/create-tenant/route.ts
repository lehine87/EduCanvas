import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Service Role 클라이언트 (Admin API 사용 가능)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const tenantSchema = z.object({
  name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().min(10),
  address: z.string().min(5),
  business_registration: z.string().optional(),
  admin_name: z.string().min(2),
  admin_email: z.string().email(),
})

const generateTenantCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 서버 사이드 테넌트 생성 API 시작')
    
    // TODO: JWT 토큰 검증 및 system_admin 권한 확인
    
    const body = await request.json()
    
    // 입력 데이터 검증
    const validatedData = tenantSchema.parse(body)
    console.log('✅ 입력 데이터 검증 완료:', validatedData.name)

    // 1. 테넌트 생성
    const tenantCode = generateTenantCode()
    const slug = generateSlug(validatedData.name)
    
    console.log('🏗️ 테넌트 데이터 생성 중...')
    const tenantData = {
      name: validatedData.name,
      slug: slug,
      tenant_code: tenantCode,
      contact_email: validatedData.contact_email,
      contact_phone: validatedData.contact_phone,
      address: validatedData.address,
      business_registration: validatedData.business_registration || null,
      subscription_tier: 'trial',
      subscription_status: 'active',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert(tenantData)
      .select()
      .single()

    if (tenantError) {
      console.error('❌ 테넌트 생성 실패:', tenantError)
      return NextResponse.json(
        { error: `테넌트 생성 실패: ${tenantError.message}` },
        { status: 400 }
      )
    }

    console.log('✅ 테넌트 생성 성공:', tenant.name)

    // 2. 임시 비밀번호 생성
    const tempPassword = 'EduCanvas2025!' + Math.floor(Math.random() * 1000)
    console.log('🔑 임시 비밀번호 생성 완료')

    // 3. 관리자 계정 생성 (Auth) - Service Role 사용
    console.log('👤 관리자 계정 생성 중...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.admin_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.admin_name,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('❌ 관리자 계정 생성 실패:', authError)
      
      // 테넌트는 생성되었으므로 롤백 고려
      await supabase.from('tenants').delete().eq('id', tenant.id)
      
      return NextResponse.json(
        { error: `관리자 계정 생성 실패: ${authError.message}` },
        { status: 400 }
      )
    }

    console.log('✅ 관리자 계정 생성 성공:', authData.user?.email)

    // 4. user_profiles에 관리자 프로필 생성
    console.log('📋 관리자 프로필 생성 중...')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user!.id,
        email: validatedData.admin_email,
        name: validatedData.admin_name,
        role: 'admin',
        status: 'active',
        tenant_id: tenant.id
      })

    if (profileError) {
      console.error('❌ 관리자 프로필 생성 실패:', profileError)
      
      // 롤백: 생성된 계정들 삭제
      await supabase.auth.admin.deleteUser(authData.user!.id)
      await supabase.from('tenants').delete().eq('id', tenant.id)
      
      return NextResponse.json(
        { error: `관리자 프로필 생성 실패: ${profileError.message}` },
        { status: 400 }
      )
    }

    console.log('✅ 관리자 프로필 생성 성공')
    console.log('🎉 테넌트 생성 과정 완료!')

    // 성공 응답
    return NextResponse.json({
      success: true,
      tenant: tenant,
      admin: {
        email: validatedData.admin_email,
        name: validatedData.admin_name,
        tempPassword: tempPassword
      }
    })

  } catch (error) {
    console.error('💥 테넌트 생성 API 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 유효하지 않습니다.', details: error.issues },
        { status: 400 }
      )
    }
    
    // 타입 가드를 사용한 안전한 에러 처리
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '내부 서버 오류가 발생했습니다.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}