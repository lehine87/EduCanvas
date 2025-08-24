import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateMemberSchema = z.object({
  tenantId: z.string().uuid(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  job_function: z.enum(['instructor', 'general']),
  role: z.enum(['admin', 'instructor', 'staff', 'viewer']).optional(),
  role_id: z.string().uuid().optional(),
  hire_date: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
})

const deleteMemberSchema = z.object({
  tenantId: z.string().uuid(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🏢 테넌트 관리자 API - 회원 정보 수정 시작')
    
    const { id: membershipId } = await params
    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId가 필요합니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)
    
    console.log(`📝 회원 ${membershipId} 정보 수정 중...`)
    console.log('📋 수정 데이터:', validatedData)
    
    const supabase = createServiceRoleClient()
    
    // 1. 먼저 해당 membership이 존재하고 요청한 테넌트에 속하는지 확인
    const { data: existingMembership, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select('id, user_id, tenant_id')
      .eq('id', membershipId)
      .eq('tenant_id', validatedData.tenantId)
      .single()

    if (membershipError || !existingMembership) {
      console.error('❌ 회원 조회 실패:', membershipError)
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. user_profiles 업데이트
    const { error: userProfileError } = await supabase
      .from('user_profiles')
      .update({
        name: validatedData.full_name,
        phone: validatedData.phone || null,
      })
      .eq('id', existingMembership.user_id)

    if (userProfileError) {
      console.error('❌ 사용자 프로필 업데이트 실패:', userProfileError)
      return NextResponse.json(
        { error: `사용자 프로필 업데이트 실패: ${userProfileError.message}` },
        { status: 500 }
      )
    }

    // 3. role이 있는 경우 role_id로 변환
    let roleId = validatedData.role_id
    if (validatedData.role && !validatedData.role_id) {
      console.log(`🔍 역할 '${validatedData.role}'에 해당하는 role_id 조회 중...`)
      
      const { data: roleData, error: roleError } = await supabase
        .from('tenant_roles')
        .select('id')
        .eq('tenant_id', validatedData.tenantId)
        .eq('name', validatedData.role)
        .single()

      if (roleError || !roleData) {
        console.error('❌ 역할 조회 실패:', roleError)
        return NextResponse.json(
          { error: `역할 '${validatedData.role}'을 찾을 수 없습니다.` },
          { status: 400 }
        )
      }

      roleId = roleData.id
      console.log(`✅ 역할 ID 찾음: ${roleId}`)
    }

    // 4. tenant_memberships 업데이트
    const updateData: any = {
      job_function: validatedData.job_function,
      hire_date: validatedData.hire_date,
      specialization: validatedData.specialization,
      bio: validatedData.bio,
    }

    if (roleId) {
      updateData.role_id = roleId
    }

    const { data: updatedMembership, error: membershipUpdateError } = await supabase
      .from('tenant_memberships')
      .update(updateData)
      .eq('id', membershipId)
      .select(`
        *,
        user_profiles!tenant_memberships_user_id_fkey (
          id,
          email,
          name,
          phone,
          created_at
        ),
        tenant_roles (
          name,
          display_name,
          hierarchy_level
        )
      `)
      .single()

    if (membershipUpdateError) {
      console.error('❌ 회원 정보 업데이트 실패:', membershipUpdateError)
      return NextResponse.json(
        { error: `회원 정보 업데이트 실패: ${membershipUpdateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ 회원 정보 업데이트 성공')
    
    // 응답 데이터 형식 변환
    const member = {
      id: updatedMembership.user_profiles?.id,
      email: updatedMembership.user_profiles?.email,
      name: updatedMembership.user_profiles?.name,
      full_name: updatedMembership.user_profiles?.name,
      phone: updatedMembership.user_profiles?.phone,
      status: updatedMembership.status,
      job_function: updatedMembership.job_function,
      role: updatedMembership.tenant_roles?.display_name || '팀원',
      role_name: updatedMembership.tenant_roles?.name,
      hierarchy_level: updatedMembership.tenant_roles?.hierarchy_level || 1,
      hire_date: updatedMembership.hire_date,
      specialization: updatedMembership.specialization,
      bio: updatedMembership.bio,
      created_at: updatedMembership.created_at,
      membership_id: updatedMembership.id
    }

    return NextResponse.json({
      member,
      success: true
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('💥 테넌트 관리자 API - 회원 정보 수정 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터 형식이 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '내부 서버 오류가 발생했습니다.'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🏢 테넌트 관리자 API - 회원 비활성화 시작')
    
    const { id: membershipId } = await params
    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId가 필요합니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = deleteMemberSchema.parse(body)
    
    console.log(`🗑️ 회원 ${membershipId} 비활성화 중...`)
    
    const supabase = createServiceRoleClient()
    
    // 1. 먼저 해당 membership이 존재하고 요청한 테넌트에 속하는지 확인
    const { data: existingMembership, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select('id, user_id, tenant_id')
      .eq('id', membershipId)
      .eq('tenant_id', validatedData.tenantId)
      .single()

    if (membershipError || !existingMembership) {
      console.error('❌ 회원 조회 실패:', membershipError)
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. 회원 상태를 'inactive'로 변경 (실제 삭제하지 않음)
    const { error: deactivateError } = await supabase
      .from('tenant_memberships')
      .update({
        status: 'inactive'
      })
      .eq('id', membershipId)

    if (deactivateError) {
      console.error('❌ 회원 비활성화 실패:', deactivateError)
      return NextResponse.json(
        { error: `회원 비활성화 실패: ${deactivateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ 회원 비활성화 성공')

    return NextResponse.json({
      success: true,
      message: '회원이 성공적으로 비활성화되었습니다.'
    })

  } catch (error) {
    console.error('💥 테넌트 관리자 API - 회원 비활성화 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터 형식이 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '내부 서버 오류가 발생했습니다.'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}