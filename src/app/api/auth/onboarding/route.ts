import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      phone,
      position,
      specialization,
      bio,
      emergency_contact,
      tenant_id
    } = await request.json()
    
    // 필수 필드 검증
    if (!name || !phone || !position || !tenant_id) {
      return NextResponse.json(
        { error: '이름, 전화번호, 직책, 테넌트는 필수 입력 사항입니다.' },
        { status: 400 }
      )
    }

    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('🔑 토큰 확인:', { hasAuthHeader: !!authHeader, hasToken: !!token })
    
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // Service Role 클라이언트 생성 (환경변수 체크 포함)
    const supabaseServiceRole = createServiceRoleClient()
    
    // Service Role로 토큰 검증
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token)
    
    console.log('👤 사용자 확인:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: authError?.message
    })
    
    if (authError || !user) {
      console.error('❌ 토큰 검증 실패:', authError?.message)
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      )
    }

    console.log('🚀 온보딩 API 시작:', {
      userId: user.id,
      email: user.email,
      name,
      position,
      tenant_id
    })

    // 테넌트 존재 확인
    const { data: tenantData, error: tenantError } = await supabaseServiceRole
      .from('tenants')
      .select('id, name, tenant_code')
      .eq('id', tenant_id)
      .eq('is_active', true)
      .single()

    if (tenantError || !tenantData) {
      console.error('❌ 테넌트 조회 실패:', tenantError)
      return NextResponse.json(
        { error: '선택된 학원을 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 사용자 프로필 업데이트 (실제 데이터베이스 스키마에 맞게)
    interface ProfileUpdateData {
      name: string
      phone: string
      role: string
      tenant_id: string
      status: 'active' | 'inactive' | 'suspended' | 'pending_approval'
      updated_at: string
    }
    
    const profileData: ProfileUpdateData = {
      name,
      phone,
      role: position, // position을 role로 매핑
      tenant_id,
      status: 'pending_approval', // 승인 대기 상태로 설정
      updated_at: new Date().toISOString()
    }

    // 추가 정보들은 instructors 테이블에서 관리
    // user_profiles 테이블에는 custom_fields 컬럼이 없음

    console.log('💾 프로필 업데이트 데이터:', profileData)

    const { data: updatedProfile, error: updateError } = await supabaseServiceRole
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id)
      .select(`
        *,
        tenants:tenant_id (
          id,
          name,
          tenant_code
        )
      `)
      .single()

    if (updateError) {
      console.error('❌ 프로필 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '프로필 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 강사인 경우 instructors 테이블에도 레코드 생성
    if (position === 'instructor') {
      const instructorData = {
        user_id: user.id,
        tenant_id,
        name,
        phone,
        email: user.email,
        specialization: specialization || null,
        hire_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
        status: 'active',
        bio: bio || null, // 자기소개 (새 컬럼)
        emergency_contact: emergency_contact || null, // 비상연락처 (새 컬럼)
        // memo 필드에도 백업으로 저장 (호환성)
        memo: [
          bio && `[자기소개] ${bio}`,
          emergency_contact && `[비상연락처] ${emergency_contact}`
        ].filter(Boolean).join('\n') || null
      }

      // instructors 테이블에 레코드 생성 (user_id가 UNIQUE라면 upsert, 아니면 insert)
      const { data: existingInstructor } = await supabaseServiceRole
        .from('instructors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let instructorError = null
      if (existingInstructor) {
        // 기존 레코드 업데이트
        const { error } = await supabaseServiceRole
          .from('instructors')
          .update(instructorData)
          .eq('user_id', user.id)
        instructorError = error
      } else {
        // 새 레코드 생성
        const { error } = await supabaseServiceRole
          .from('instructors')
          .insert(instructorData)
        instructorError = error
      }

      if (instructorError) {
        console.warn('⚠️ 강사 레코드 생성 실패 (계속 진행):', instructorError)
      } else {
        console.log('✅ 강사 레코드 생성 완료')
      }
    }

    console.log('✅ 온보딩 완료:', {
      userId: user.id,
      tenant: tenantData.name,
      role: position,
      status: 'pending_approval'
    })

    return NextResponse.json({
      success: true,
      message: '온보딩이 완료되었습니다. 관리자 승인을 기다려주세요.',
      profile: {
        ...updatedProfile,
        tenants: tenantData
      }
    })

  } catch (error) {
    console.error('💥 온보딩 API 오류:', error)
    
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