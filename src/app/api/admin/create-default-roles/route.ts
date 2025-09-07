import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json()
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const defaultRoles = [
      {
        tenant_id: tenantId,
        name: 'admin',
        display_name: '관리자',
        description: '학원 관리자',
        hierarchy_level: 4,
        is_system_role: true,
        is_assignable: true,
      },
      {
        tenant_id: tenantId,
        name: 'instructor',
        display_name: '강사',
        description: '수업 담당 강사',
        hierarchy_level: 3,
        is_system_role: true,
        is_assignable: true,
      },
      {
        tenant_id: tenantId,
        name: 'staff',
        display_name: '직원',
        description: '일반 직원',
        hierarchy_level: 2,
        is_system_role: true,
        is_assignable: true,
      },
      {
        tenant_id: tenantId,
        name: 'viewer',
        display_name: '열람자',
        description: '읽기 전용 사용자',
        hierarchy_level: 1,
        is_system_role: true,
        is_assignable: true,
      },
    ]

    const { data, error } = await supabase
      .from('tenant_roles')
      .upsert(defaultRoles, { 
        onConflict: 'tenant_id,name',
        ignoreDuplicates: true 
      })

    if (error) {
      console.error('기본 역할 생성 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ 기본 역할 생성 완료:', data)

    return NextResponse.json({
      success: true,
      message: '기본 역할이 성공적으로 생성되었습니다.',
      roles: defaultRoles.map(r => ({ name: r.name, display_name: r.display_name }))
    })

  } catch (error: unknown) {
    console.error('기본 역할 생성 오류:', error)
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}