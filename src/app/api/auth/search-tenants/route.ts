import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isSearchTenantsRequest, createErrorResponse } from '@/types'
import type { SearchTenantsRequest, SearchTenantsResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    
    // 타입 가드를 사용한 안전한 입력 검증
    if (!isSearchTenantsRequest(body)) {
      console.warn('⚠️ SearchTenants API 잘못된 요청 형식:', body)
      return createErrorResponse('검색 타입과 검색어가 필요하며 올바른 형식이어야 합니다.', 400)
    }

    const { searchType, searchQuery }: SearchTenantsRequest = body

    console.log('🔍 학원 검색 API 호출:', { searchType, searchQuery })

    // Service Role 클라이언트 생성 (환경변수 체크 포함)
    const supabase = createServiceRoleClient()

    // 검색 쿼리 빌드
    let query = supabase
      .from('tenants')
      .select('id, name, slug, tenant_code, contact_phone, address')
      .eq('is_active', true)

    if (searchType === 'code') {
      // 고객번호로 정확 검색
      if (!/^\d{6}$/.test(searchQuery.trim())) {
        return createErrorResponse('고객번호는 6자리 숫자여야 합니다.', 400)
      }
      query = query.eq('tenant_code', searchQuery.trim())
    } else if (searchType === 'name') {
      // 학원명으로 유사 검색
      query = query.ilike('name', `%${searchQuery.trim()}%`)
    } else if (searchType === 'slug') {
      // slug로 검색 추가
      query = query.ilike('slug', `%${searchQuery.trim()}%`)
    } else {
      return createErrorResponse('지원하지 않는 검색 타입입니다. (name, slug, code만 지원)', 400)
    }

    const { data, error } = await query.limit(10).order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 학원 검색 쿼리 오류:', error)
      return createErrorResponse('검색 중 오류가 발생했습니다.', 500)
    }

    console.log(`✅ 학원 검색 완료: ${data?.length || 0}개 결과`)
    
    // 검색 결과를 타입 안전하게 변환
    const tenants = (data || []).map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: 'active' as const // 활성화된 테넌트만 검색되므로
    }))

    const response: SearchTenantsResponse = {
      tenants
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('💥 학원 검색 API 오류:', error)
    
    // 타입 가드를 사용한 안전한 에러 처리
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '내부 서버 오류가 발생했습니다.'
    
    return createErrorResponse(errorMessage, 500)
  }
}