/**
 * User State Detector
 * @description 사용자의 현재 네비게이션 상태를 효율적으로 감지하는 유틸리티
 * @version v1.0 - 제로베이스 리디렉션 시스템 재설계
 * @since 2025-08-15
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'
import type { 
  NavigationContext, 
  UserNavigationState 
} from '@/types/navigation.types'
import type { UserProfile } from '@/types/auth.types'
import { NAVIGATION_CONFIG } from './RouteDefinitions'

/**
 * 특수 권한 이메일 주소들
 */
const SPECIAL_EMAILS = {
  SYSTEM_ADMINS: ['admin@test.com', 'sjlee87@kakao.com']
}

/**
 * Supabase 쿠키 패턴들
 */
const SUPABASE_COOKIE_PATTERNS = [
  /sb-[a-zA-Z0-9]+-auth-token(?:-code-verifier)?=/,
  /sb-[a-zA-Z0-9]+-auth-refresh-token=/
]

/**
 * 미들웨어 컨텍스트에서 사용자 네비게이션 상태 감지
 */
export async function getUserNavigationStateFromRequest(
  request: NextRequest
): Promise<NavigationContext> {
  const requestId = Math.random().toString(36).substring(7)
  
  const debugMode = process.env.NAVIGATION_DEBUG === 'true'
  if (debugMode) {
    console.log(`🕵️ [USER-STATE-DETECTOR] Starting detection for request: ${requestId}`)
  }

  try {
    // 1. 빠른 쿠키 기반 인증 확인
    const hasAuthCookie = hasValidSupabaseCookie(request)
    
    if (!hasAuthCookie) {
      if (debugMode) {
        console.log(`🍪 [USER-STATE-DETECTOR-${requestId}] No valid auth cookies found`)
      }
      return createAnonymousContext()
    }

    if (debugMode) {
      console.log(`✅ [USER-STATE-DETECTOR-${requestId}] Valid auth cookies detected`)
    }

    // 2. Supabase 클라이언트로 사용자 확인
    const { supabase } = createClient(request)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      if (debugMode) {
        console.log(`👤 [USER-STATE-DETECTOR-${requestId}] No valid user session:`, userError?.message)
      }
      return createAnonymousContext()
    }

    if (debugMode) {
      console.log(`👤 [USER-STATE-DETECTOR-${requestId}] User session found:`, {
        userId: user.id,
        email: user.email
      })
    }

    // 3. 사용자 프로필 조회
    const profile = await getUserProfile(supabase, user.id, requestId)
    
    if (!profile) {
      if (debugMode) {
        console.log(`👤 [USER-STATE-DETECTOR-${requestId}] No profile found - authenticated state`)
      }
      return createAuthenticatedContext(user.email || '')
    }

    // 4. 프로필 기반 컨텍스트 생성
    const context = createContextFromProfile(profile, user.email || '')
    
    if (debugMode) {
      console.log(`✅ [USER-STATE-DETECTOR-${requestId}] Context created:`, {
        userState: context.userState,
        role: context.role,
        tenantId: context.tenantId,
        isEmailVerified: context.isEmailVerified
      })
    }

    return context

  } catch (error) {
    console.error(`❌ [USER-STATE-DETECTOR-${requestId}] Error during detection:`, error)
    
    // 에러 발생 시 안전한 기본값 반환
    return createAnonymousContext()
  }
}

/**
 * 클라이언트 사이드에서 사용자 네비게이션 상태 감지
 */
export async function getUserNavigationStateFromClient(): Promise<NavigationContext> {
  const debugMode = process.env.NAVIGATION_DEBUG === 'true'
  if (debugMode) {
    console.log(`🖥️ [USER-STATE-DETECTOR] Getting client-side navigation state`)
  }

  try {
    // 동적 import로 클라이언트 전용 모듈 로드
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return createAnonymousContext()
    }

    // 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return createAuthenticatedContext(user.email || '')
    }

    return createContextFromProfile(profile, user.email || '')

  } catch (error) {
    console.error(`❌ [USER-STATE-DETECTOR] Client-side error:`, error)
    return createAnonymousContext()
  }
}

/**
 * Supabase 쿠키 유효성 확인
 */
function hasValidSupabaseCookie(request: NextRequest): boolean {
  const cookies = request.headers.get('cookie')
  
  if (!cookies) return false

  return SUPABASE_COOKIE_PATTERNS.some(pattern => pattern.test(cookies))
}

/**
 * 사용자 프로필 조회 (서버사이드)
 */
async function getUserProfile(
  supabase: ReturnType<typeof createClient>['supabase'],
  userId: string,
  requestId: string
): Promise<UserProfile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        role,
        tenant_id,
        status,
        email_verified,
        name,
        email,
        tenants (
          id,
          name,
          slug
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      const debugMode = process.env.NAVIGATION_DEBUG === 'true'
      if (debugMode) {
        console.warn(`⚠️ [USER-STATE-DETECTOR-${requestId}] Profile query error:`, error.message)
      }
      return null
    }

    return profile as UserProfile

  } catch (error) {
    console.error(`❌ [USER-STATE-DETECTOR-${requestId}] Profile fetch error:`, error)
    return null
  }
}

/**
 * 프로필 기반 네비게이션 컨텍스트 생성
 */
function createContextFromProfile(profile: UserProfile, email: string): NavigationContext {
  // 특수 권한 확인
  const specialPermissions: string[] = []
  const isSystemAdminEmail = SPECIAL_EMAILS.SYSTEM_ADMINS.includes(email)
  
  if (isSystemAdminEmail) {
    specialPermissions.push('system_admin')
    specialPermissions.push(email)
  }

  // 상태 결정 로직
  let userState: UserNavigationState

  // 시스템 관리자는 tenantId가 없어도 활성 상태
  if (isSystemAdminEmail || profile.role === 'system_admin') {
    userState = 'active'
  } else if (!profile.tenant_id) {
    userState = 'onboarding'
  } else if (profile.status === 'pending_approval') {
    userState = 'pending'
  } else if (profile.status === 'active') {
    userState = 'active'
  } else {
    // 기타 상태 (suspended, inactive 등)는 대기 상태로 처리
    userState = 'pending'
  }

  return {
    userState,
    role: (profile.role as 'system_admin' | 'tenant_admin' | 'instructor' | 'staff' | 'viewer') || undefined,
    tenantId: profile.tenant_id || undefined,
    isEmailVerified: profile.email_verified || false,
    accountStatus: profile.status || undefined,
    specialPermissions: specialPermissions.length > 0 ? specialPermissions : undefined
  }
}

/**
 * 익명 사용자 컨텍스트 생성
 */
function createAnonymousContext(): NavigationContext {
  return {
    userState: 'anonymous',
    isEmailVerified: false
  }
}

/**
 * 인증된 사용자 (프로필 없음) 컨텍스트 생성
 */
function createAuthenticatedContext(email: string): NavigationContext {
  // 특수 권한 확인
  const specialPermissions: string[] = []
  
  if (SPECIAL_EMAILS.SYSTEM_ADMINS.includes(email)) {
    specialPermissions.push('system_admin')
    specialPermissions.push(email)
  }

  return {
    userState: 'authenticated',
    isEmailVerified: false,
    specialPermissions: specialPermissions.length > 0 ? specialPermissions : undefined
  }
}

/**
 * 네비게이션 컨텍스트 비교 (변경 감지용)
 */
export function areNavigationContextsEqual(
  a: NavigationContext,
  b: NavigationContext
): boolean {
  return (
    a.userState === b.userState &&
    a.role === b.role &&
    a.tenantId === b.tenantId &&
    a.isEmailVerified === b.isEmailVerified &&
    a.accountStatus === b.accountStatus &&
    JSON.stringify(a.specialPermissions || []) === JSON.stringify(b.specialPermissions || [])
  )
}

/**
 * 네비게이션 컨텍스트 유효성 검증
 */
export function validateNavigationContext(context: NavigationContext): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 필수 필드 확인
  if (!context.userState) {
    errors.push('userState is required')
  }

  if (typeof context.isEmailVerified !== 'boolean') {
    errors.push('isEmailVerified must be boolean')
  }

  // 상태별 추가 검증
  if (context.userState === 'active') {
    if (!context.role) {
      errors.push('role is required for active users')
    }
    if (!context.tenantId) {
      errors.push('tenantId is required for active users')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}