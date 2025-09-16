import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      phone,
      specialization,
      bio,
      emergency_contact,
      tenant_id
    } = await request.json()
    
    // 필수 필드 검증
    if (!name || !phone || !tenant_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '이름, 전화번호, 테넌트는 필수 입력 사항입니다.'
          }
        },
        { status: 400 }
      )
    }

    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('🔑 토큰 확인:', { hasAuthHeader: !!authHeader, hasToken: !!token })
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: '인증 토큰이 필요합니다.'
          }
        },
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
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: '유효하지 않은 인증 토큰입니다.'
          }
        },
        { status: 401 }
      )
    }

    console.log('🚀 온보딩 API 시작:', {
      userId: user.id,
      email: user.email,
      name,
      tenant_id
    })

    // 테넌트 존재 확인
    const { data: tenantData, error: tenantError } = await supabaseServiceRole
      .from('tenants')
      .select('id, name, slug')
      .eq('id', tenant_id)
      .eq('is_active', true)
      .single()

    if (tenantError || !tenantData) {
      console.error('❌ 테넌트 조회 실패:', tenantError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: '선택된 학원을 찾을 수 없습니다.'
          }
        },
        { status: 400 }
      )
    }

    // 사용자 프로필 업데이트 (실제 데이터베이스 스키마에 맞게)
    interface ProfileUpdateData {
      name: string
      phone: string
      role: string | null
      tenant_id: string
      status: Database['public']['Enums']['user_status']
      updated_at: string
    }
    
    const profileData: ProfileUpdateData = {
      name,
      phone,
      role: null, // 직책은 승인 과정에서 설정
      tenant_id,
      status: 'pending_approval' as Database['public']['Enums']['user_status'], // 승인 대기 상태로 설정
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
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '프로필 업데이트 중 오류가 발생했습니다.',
            details: [updateError.message]
          }
        },
        { status: 500 }
      )
    }

    // 추가 정보는 tenant_memberships에 저장 (직책과 무관하게)
    const { data: membership } = await supabaseServiceRole
      .from('tenant_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (membership) {
      const { error: updateError } = await supabaseServiceRole
        .from('tenant_memberships')
        .update({
          specialization: specialization || null,
          bio: bio || null,
          emergency_contact: emergency_contact || null
        })
        .eq('id', membership.id)

      if (updateError) {
        console.warn('⚠️ 개인 정보 업데이트 실패 (계속 진행):', updateError)
      } else {
        console.log('✅ 개인 정보 업데이트 완료')
      }
    } else {
      console.warn('⚠️ tenant_memberships 레코드를 찾을 수 없음')
    }

    console.log('✅ 온보딩 완료:', {
      userId: user.id,
      tenant: tenantData.name,
      status: 'pending_approval'
    })

    return NextResponse.json({
      success: true,
      data: {
        message: '온보딩이 완료되었습니다. 관리자 승인을 기다려주세요.',
        profile: {
          ...updatedProfile,
          tenants: tenantData
        }
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
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage
        }
      },
      { status: 500 }
    )
  }
}