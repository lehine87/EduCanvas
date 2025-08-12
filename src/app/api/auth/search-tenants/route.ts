import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role 클라이언트 (RLS 우회 가능)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { searchType, searchQuery } = await request.json()
    
    if (!searchType || !searchQuery) {
      return NextResponse.json(
        { error: '검색 타입과 검색어가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🔍 학원 검색 API 호출:', { searchType, searchQuery })

    // 검색 쿼리 빌드
    let query = supabase
      .from('tenants')
      .select('id, name, slug, tenant_code, contact_phone, address')
      .eq('is_active', true)

    if (searchType === 'code') {
      // 고객번호로 정확 검색
      if (!/^\d{6}$/.test(searchQuery.trim())) {
        return NextResponse.json(
          { error: '고객번호는 6자리 숫자여야 합니다.' },
          { status: 400 }
        )
      }
      query = query.eq('tenant_code', searchQuery.trim())
    } else if (searchType === 'name') {
      // 학원명으로 유사 검색
      query = query.ilike('name', `%${searchQuery.trim()}%`)
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 검색 타입입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await query.limit(10).order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 학원 검색 쿼리 오류:', error)
      return NextResponse.json(
        { error: '검색 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log(`✅ 학원 검색 완료: ${data?.length || 0}개 결과`)
    
    // 검색 결과를 안전하게 필터링
    const safeResults = (data || []).map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      tenant_code: tenant.tenant_code,
      contact_phone: tenant.contact_phone,
      address: tenant.address
    }))

    return NextResponse.json({
      success: true,
      results: safeResults,
      count: safeResults.length,
      searchType,
      searchQuery
    })

  } catch (error) {
    console.error('💥 학원 검색 API 오류:', error)
    
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