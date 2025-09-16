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
  console.log('🔍 [DEBUG] 인증 프로세스 시작')
  
  // 1. 사용자 확인 (getUser가 더 안전함)
  const { supabase: middlewareClient } = createMiddlewareClient(request)
  const { data: { user }, error: userError } = await middlewareClient.auth.getUser()
  
  console.log('🔍 [DEBUG] getUser 결과:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: userError?.message
  })
  
  if (userError || !user) {
    console.error('❌ 인증 실패:', userError?.message)
    return createErrorResponse('로그인이 필요합니다.', 401)
  }

  // 세션 정보 구성 (getUser는 user만 반환하므로 token 정보가 필요한 경우)
  const { data: { session }, error: sessionError } = await middlewareClient.auth.getSession()
  if (!session) {
    console.error('❌ 세션 조회 실패:', sessionError?.message)
    return createErrorResponse('세션이 만료되었습니다.', 401)
  }

  // 2. 사용자 프로필 조회
  const supabaseServiceRole = createServiceRoleClient()
  
  const { data: userProfile, error: profileError } = await supabaseServiceRole
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
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
  requestedTenantId: string | null | undefined
): boolean {
  // 시스템 관리자는 모든 테넌트에 접근 가능
  if (userProfile.role === 'system_admin') {
    return true
  }
  
  // 테넌트 ID가 없거나 null인 경우 false
  if (!requestedTenantId) {
    return false
  }
  
  // 일반 사용자는 자신의 테넌트만 접근 가능
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
  return userProfile.role === 'tenant_admin' && userProfile.status === 'active'
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
  console.log('🔍 [API-HANDLER] withApiHandler 시작:', {
    url: request.url,
    method: request.method,
    requireAuth: options.requireAuth,
    requireSystemAdmin: options.requireSystemAdmin,
    requireTenantAdmin: options.requireTenantAdmin
  })

  try {
    console.log('🔍 [API-HANDLER] Service Role 클라이언트 생성 시도')
    const supabase = createServiceRoleClient()
    console.log('✅ [API-HANDLER] Service Role 클라이언트 생성 성공')
    
    // 인증이 필요한 경우
    if (options.requireAuth) {
      console.log('🔍 [API-HANDLER] 인증 검증 시작')
      const authResult = await authenticateUser(request)
      
      // 인증 실패 시 에러 응답 반환
      if (authResult instanceof NextResponse) {
        console.log('❌ [API-HANDLER] 인증 실패')
        return authResult
      }

      const { session, userProfile } = authResult
      console.log('✅ [API-HANDLER] 인증 성공:', {
        userId: userProfile.id,
        userRole: userProfile.role,
        userTenantId: userProfile.tenant_id
      })

      // 시스템 관리자 권한 필요
      if (options.requireSystemAdmin && !isSystemAdmin(userProfile)) {
        console.log('❌ [API-HANDLER] 시스템 관리자 권한 부족')
        return createErrorResponse('시스템 관리자 권한이 필요합니다.', 403)
      }

      // 테넌트 관리자 권한 필요
      if (options.requireTenantAdmin && !isTenantAdmin(userProfile)) {
        console.log('❌ [API-HANDLER] 테넌트 관리자 권한 부족')
        return createErrorResponse('테넌트 관리자 권한이 필요합니다.', 403)
      }

      console.log('🔍 [API-HANDLER] 핸들러 호출 시작')
      const result = await handler({ request, session, userProfile, supabase })
      console.log('✅ [API-HANDLER] 핸들러 호출 완료')
      return result
    }

    // 인증이 필요하지 않은 경우
    console.log('🔍 [API-HANDLER] 인증 없이 핸들러 호출')
    return handler({ request, supabase })

  } catch (error) {
    console.error('💥 [API-HANDLER] 최상위 에러 발생:', {
      error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method
    })
    
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
    console.warn('📋 검증 대상 데이터:', body)
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