import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 테넌트 관리자 API - 회원 목록 조회 시작')
    
    // URL에서 파라미터 추출
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status') // 'all', 'pending', 'active' 등
    const jobFunction = searchParams.get('job_function') // 'instructor', 'general', 'all'
    const roleName = searchParams.get('role_name') // '원장', '팀장' 등
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId가 필요합니다.' },
        { status: 400 }
      )
    }
    
    console.log(`📋 테넌트 ${tenantId}의 회원 목록 조회 중...`)
    console.log('🔍 필터:', { status, jobFunction, roleName })
    
    // 기본 쿼리
    const supabase = createServiceRoleClient()
    
    let query = supabase
      .from('tenant_memberships')
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
      .eq('tenant_id', tenantId)
    
    let data, error;

    // pending 사용자는 user_profiles에서 직접 조회
    if (status === 'pending') {
      const { data: pendingData, error: pendingError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          name,
          phone,
          status,
          role,
          created_at
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })

      if (pendingError) {
        console.error('❌ pending 사용자 조회 실패:', pendingError)
        return NextResponse.json(
          { error: `pending 사용자 조회 실패: ${pendingError.message}` },
          { status: 500 }
        )
      }

      // pending 사용자를 tenant_memberships 형식으로 변환
      data = pendingData?.map(user => ({
        id: null, // membership_id가 없으므로 null
        user_id: user.id,
        tenant_id: tenantId,
        status: 'pending',
        job_function: user.role === 'instructor' ? 'instructor' : 'general',
        hire_date: null,
        specialization: null,
        bio: null,
        created_at: user.created_at,
        user_profiles: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          created_at: user.created_at
        },
        tenant_roles: null
      })) || []

      error = null
    } else {
      // 기존 로직: tenant_memberships에서 조회
      if (status === 'active') {
        query = query.eq('status', 'active')
      } else if (status === 'inactive') {
        query = query.eq('status', 'inactive')
      }
      // status === 'all'인 경우 모든 상태 포함
      
      // 직능별 필터링
      if (jobFunction && jobFunction !== 'all') {
        query = query.eq('job_function', jobFunction)
      }
      
      // 직급별 필터링
      if (roleName) {
        // tenant_roles와 조인하여 role_name으로 필터링
        query = query.eq('tenant_roles.name', roleName)
      }
      
      const result = await query.order('created_at', { ascending: false })
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('❌ 회원 목록 조회 실패:', error)
      return NextResponse.json(
        { error: `회원 목록 조회 실패: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ 회원 목록 조회 성공: ${data?.length || 0}명`)
    
    // 통계 계산
    const stats = {
      total: data?.length || 0,
      active: data?.filter(member => member.status === 'active').length || 0,
      pending: data?.filter(member => member.status === 'pending').length || 0,
      inactive: data?.filter(member => member.status === 'inactive').length || 0,
      instructors: data?.filter(member => member.job_function === 'instructor').length || 0,
      general: data?.filter(member => member.job_function === 'general').length || 0
    }
    
    // 직급별 통계 추가
    const roleStats: { [key: string]: number } = {}
    data?.forEach(member => {
      const roleName = member.tenant_roles?.display_name || '미지정'
      roleStats[roleName] = (roleStats[roleName] || 0) + 1
    })
    
    console.log('📊 회원 통계:', stats)
    console.log('📊 직급별 통계:', roleStats)

    // 응답 데이터 형식 변환 (기존 코드와의 호환성을 위해)
    const members = data?.map(member => ({
      id: member.user_profiles?.id,
      email: member.user_profiles?.email,
      name: member.user_profiles?.name,
      full_name: member.user_profiles?.name, // 호환성을 위해 둘 다 제공
      phone: member.user_profiles?.phone,
      status: member.status,
      job_function: member.job_function,
      role: member.tenant_roles?.display_name || '팀원',
      role_name: member.tenant_roles?.name,
      hierarchy_level: member.tenant_roles?.hierarchy_level || 1,
      hire_date: member.hire_date,
      specialization: member.specialization,
      bio: member.bio,
      created_at: member.created_at,
      membership_id: member.id
    })) || []

    return NextResponse.json({
      members,
      stats: {
        ...stats,
        byRole: roleStats
      }
    })

  } catch (error) {
    console.error('💥 테넌트 관리자 API - 회원 목록 조회 오류:', error)
    
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