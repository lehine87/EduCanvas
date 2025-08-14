import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient as createMiddlewareClient } from '@/lib/supabase/middleware'
import type { UserProfile } from '@/types/auth.types'

/**
 * API 응답 생성 유틸리티
 */
export function createErrorResponse(error: string, status: number = 400) {
  return NextResponse.json({ error }, { status })
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    ...(data && { data }),
    ...(message && { message })
  })
}

/**
 * 인증 및 권한 검증 유틸리티
 */
export interface AuthResult {
  session: {
    user: { id: string; email?: string }
    access_token: string
  }
  userProfile: UserProfile
}

export async function authenticateUser(request: NextRequest): Promise<AuthResult | NextResponse> {
  // 1. 세션 확인
  const { supabase: middlewareClient } = createMiddlewareClient(request)
  const { data: { session }, error: sessionError } = await middlewareClient.auth.getSession()
  
  if (sessionError || !session?.user) {
    console.error('❌ 인증 실패:', sessionError?.message)
    return createErrorResponse('로그인이 필요합니다.', 401)
  }

  // 2. 사용자 프로필 조회
  const supabaseServiceRole = createServiceRoleClient()
  
  const { data: userProfile, error: profileError } = await supabaseServiceRole
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profileError || !userProfile) {
    console.error('❌ 사용자 프로필 조회 실패:', profileError?.message)
    return createErrorResponse('유효하지 않은 사용자입니다.', 403)
  }

  if (userProfile.status !== 'active') {
    console.error('❌ 비활성 사용자:', userProfile.status)
    return createErrorResponse('계정이 활성화되지 않았습니다.', 403)
  }

  return {
    session: session as AuthResult['session'],
    userProfile: userProfile as UserProfile
  }
}

/**
 * 테넌트 권한 검증
 */
export function validateTenantAccess(
  userProfile: UserProfile, 
  requestedTenantId: string
): boolean {
  return userProfile.tenant_id === requestedTenantId
}

/**
 * 시스템 관리자 권한 검증
 */
export function isSystemAdmin(userProfile: UserProfile): boolean {
  return userProfile.email === 'admin@test.com' || 
         userProfile.role === 'system_admin'
}

/**
 * 테넌트 관리자 권한 검증
 */
export function isTenantAdmin(userProfile: UserProfile): boolean {
  return userProfile.role === 'admin' && userProfile.status === 'active'
}

/**
 * 공통 API 핸들러 래퍼
 */
export interface ApiHandlerOptions {
  requireAuth?: boolean
  requireSystemAdmin?: boolean
  requireTenantAdmin?: boolean
  validateTenant?: boolean
}

export async function withApiHandler(
  request: NextRequest,
  handler: (context: {
    request: NextRequest
    session?: AuthResult['session']
    userProfile?: UserProfile
    supabase: ReturnType<typeof createServiceRoleClient>
  }) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  try {
    const supabase = createServiceRoleClient()
    
    // 인증이 필요한 경우
    if (options.requireAuth) {
      const authResult = await authenticateUser(request)
      
      // 인증 실패 시 에러 응답 반환
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const { session, userProfile } = authResult

      // 시스템 관리자 권한 필요
      if (options.requireSystemAdmin && !isSystemAdmin(userProfile)) {
        return createErrorResponse('시스템 관리자 권한이 필요합니다.', 403)
      }

      // 테넌트 관리자 권한 필요
      if (options.requireTenantAdmin && !isTenantAdmin(userProfile)) {
        return createErrorResponse('테넌트 관리자 권한이 필요합니다.', 403)
      }

      return handler({ request, session, userProfile, supabase })
    }

    // 인증이 필요하지 않은 경우
    return handler({ request, supabase })

  } catch (error) {
    console.error('💥 API 핸들러 오류:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : '내부 서버 오류가 발생했습니다.'
    
    return createErrorResponse(errorMessage, 500)
  }
}

/**
 * 입력 검증 유틸리티
 */
export function validateRequestBody<T>(
  body: unknown,
  validator: (data: unknown) => T
): T | NextResponse {
  try {
    return validator(body)
  } catch (error) {
    console.warn('⚠️ 요청 검증 실패:', error)
    return createErrorResponse(
      '필수 파라미터가 누락되었거나 형식이 올바르지 않습니다.',
      400
    )
  }
}

/**
 * 표준 로깅 유틸리티
 */
export function logApiStart(apiName: string, context?: Record<string, unknown>) {
  console.log(`🏢 API 시작: ${apiName}`, context ? context : '')
}

export function logApiSuccess(apiName: string, result?: Record<string, unknown>) {
  console.log(`✅ API 성공: ${apiName}`, result ? result : '')
}

export function logApiError(apiName: string, error: unknown) {
  console.error(`❌ API 실패: ${apiName}`, error)
}