// EduCanvas 인증 관련 통합 타입 정의
import type { Database } from './database'

// ================================================================
// 1. 기본 사용자 및 테넌트 타입
// ================================================================

/**
 * UserProfile 타입 (통일된 정의)
 * 모든 사용자의 기본 프로필 정보
 * @version v4.1 스키마 기준
 * @since 2025-08-12
 */
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  // 추가적인 계산된 필드들
  tenants?: { 
    id: string
    name: string
    slug: string
    tenant_code?: string
    is_active?: boolean
  } | null
  // 캐시된 권한 정보
  permissions?: string[]
  // 역할 계층 정보
  role_hierarchy?: {
    level: number
    parent_roles: string[]
    child_roles: string[]
  }
}

export type UserInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserUpdate = Database['public']['Tables']['user_profiles']['Update']

/**
 * Tenant 타입 (테넌트 정보)
 */
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']  
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']

/**
 * 사용자 역할 타입 (v4.1 ENUM 기반)
 * 데이터베이스 enum과 정확히 일치
 */
export type UserRole = 'system_admin' | 'tenant_admin' | 'instructor' | 'staff' | 'viewer'

/**
 * 사용자 상태 타입 
 */
export type UserStatus = Database['public']['Enums']['user_status']

// ================================================================
// 2. 확장된 사용자 타입들
// ================================================================

/**
 * 관계 데이터를 포함한 UserProfile 타입
 */
export interface UserProfileWithRelations extends UserProfile {
  tenant?: Tenant
  tenant_membership?: {
    id: string
    role_id: string | null
    status: string | null
    permissions_override: Record<string, unknown> | null
    accepted_at: string | null
    last_accessed_at: string | null
  }
  instructor_profile?: {
    id: string
    specialization: string | null
    qualification: string | null
    hire_date: string | null
  }
}

/**
 * 테넌트 멤버십 상세 정보
 */
type BaseTenantMembership = Database['public']['Tables']['tenant_memberships']['Row']

export interface TenantMembership extends BaseTenantMembership {
  user_profile?: UserProfile
  tenant?: Tenant
  role?: {
    id: string
    name: string
    display_name: string
    hierarchy_level: number
  }
}

/**
 * 인증된 사용자 세션 정보
 */
export interface AuthenticatedUser {
  id: string
  email: string
  profile: UserProfile
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    token_type: string
  }
  tenant?: Tenant
  permissions: string[]
  role_hierarchy: {
    current_role: string
    level: number
    can_impersonate: string[]
  }
}

// ================================================================
// 3. 권한 및 보안 타입들
// ================================================================

/**
 * 권한 체크 결과
 */
export interface PermissionCheckResult {
  granted: boolean
  reason?: 'no_user' | 'no_tenant' | 'insufficient_role' | 'missing_permission' | 'tenant_mismatch'
  required_role?: string
  required_permission?: string
  current_role?: string
  current_tenant?: string
}

/**
 * 보안 컨텍스트
 */
export interface SecurityContext {
  user_id: string
  tenant_id: string
  session_id: string
  ip_address?: string
  user_agent?: string
  permissions: Set<string>
  role_level: number
  is_system_admin: boolean
  last_activity: Date
}

// ================================================================
// 4. API 인증 타입들
// ================================================================

/**
 * JWT 페이로드 타입
 */
export interface JWTPayload {
  sub: string // user_id
  email: string
  role?: string
  tenant_id?: string
  aud: string
  iss: string
  iat: number
  exp: number
  session_id?: string
}

/**
 * API 인증 헤더
 */
export interface AuthHeaders {
  authorization?: string
  'x-tenant-id'?: string
  'x-user-role'?: string
  'x-session-id'?: string
}

/**
 * 로그인 요청/응답 타입들
 */
export interface LoginRequest {
  email: string
  password: string
  tenant_code?: string
  remember_me?: boolean
}

export interface LoginResponse {
  user: AuthenticatedUser
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  tenant: Tenant | null
  requires_onboarding: boolean
}

// ================================================================
// 5. 폼 및 UI 타입들
// ================================================================

/**
 * 사용자 프로필 폼 데이터
 */
export interface UserProfileFormData {
  name: string
  email: string
  phone?: string
  avatar_url?: string
  preferred_language?: 'ko' | 'en'
  timezone?: string
  two_factor_enabled?: boolean
}

/**
 * 테넌트 생성 폼 데이터
 */
export interface TenantCreateFormData {
  name: string
  slug: string
  tenant_code: string
  contact_email?: string
  contact_phone?: string
  address?: string
  business_registration?: string
}

// ================================================================
// 6. 필터 및 검색 타입들
// ================================================================

/**
 * 사용자 필터 조건
 */
export interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  tenant_id?: string | 'all'
  created_after?: string
  created_before?: string
  last_login_after?: string
  email_verified?: boolean
  two_factor_enabled?: boolean
}

/**
 * 테넌트 필터 조건
 */
export interface TenantFilters {
  search?: string
  is_active?: boolean | 'all'
  subscription_tier?: string | 'all'
  subscription_status?: string | 'all'
  created_after?: string
  created_before?: string
  trial_ending_soon?: boolean
}

// ================================================================
// 7. 통계 및 분석 타입들
// ================================================================

/**
 * 사용자 통계
 */
export interface UserStats {
  total: number
  active: number
  inactive: number
  suspended: number
  pending_approval: number
  by_role: Record<string, number>
  by_tenant: Record<string, number>
  email_verified: number
  two_factor_enabled: number
  recent_signups: number // 지난 30일
  recent_logins: number // 지난 7일
}

/**
 * 테넌트 통계
 */
export interface TenantStats {
  total: number
  active: number
  trial: number
  paid: number
  by_tier: Record<string, number>
  by_status: Record<string, number>
  average_users_per_tenant: number
  total_revenue: number
  monthly_recurring_revenue: number
}

// ================================================================
// 8. 고급 타입 가드 함수들
// ================================================================

/**
 * UserProfile 타입 가드 (기본)
 */
export function isValidUserProfile(profile: unknown): profile is UserProfile {
  return (
    typeof profile === 'object' &&
    profile !== null &&
    'id' in profile &&
    typeof (profile as UserProfile).id === 'string' &&
    'email' in profile &&
    typeof (profile as UserProfile).email === 'string' &&
    'name' in profile &&
    typeof (profile as UserProfile).name === 'string'
  )
}

/**
 * tenant_id를 가진 UserProfile인지 확인하는 타입 가드
 */
export function hasTenantId(profile: UserProfile): profile is UserProfile & { tenant_id: string } {
  return 'tenant_id' in profile && typeof profile.tenant_id === 'string' && profile.tenant_id.length > 0
}

/**
 * role을 가진 UserProfile인지 확인하는 타입 가드
 */
export function hasRole(profile: UserProfile): profile is UserProfile & { role: string } {
  return 'role' in profile && typeof profile.role === 'string' && profile.role.length > 0
}

/**
 * 활성 사용자인지 확인
 */
export function isActiveUser(profile: UserProfile): boolean {
  return profile.status === 'active'
}

/**
 * 승인 대기 중인 사용자인지 확인
 */
export function isPendingApproval(profile: UserProfile): boolean {
  return profile.status === 'pending_approval'
}

/**
 * 온보딩이 필요한 사용자인지 확인 (pending_approval이면서 tenant_id가 없는 경우)
 */
export function needsOnboarding(profile: UserProfile): boolean {
  return profile.status === 'pending_approval' && !hasTenantId(profile)
}

/**
 * 승인 대기 페이지로 가야 하는 사용자인지 확인 (pending_approval이면서 tenant_id가 있는 경우)
 */
export function needsApprovalWaiting(profile: UserProfile): boolean {
  return profile.status === 'pending_approval' && hasTenantId(profile)
}

/**
 * 이메일 인증된 사용자인지 확인
 */
export function isEmailVerified(profile: UserProfile): profile is UserProfile & { email_verified: true } {
  return profile.email_verified === true
}

/**
 * 시스템 관리자인지 확인
 */
export function isSystemAdmin(profile: UserProfile): boolean {
  return hasRole(profile) && profile.role === 'system_admin'
}

/**
 * 테넌트 관리자인지 확인
 */
export function isTenantAdmin(profile: UserProfile): boolean {
  return hasRole(profile) && hasTenantId(profile) && profile.role === 'admin'
}

/**
 * 강사인지 확인
 */
export function isInstructor(profile: UserProfile): boolean {
  return hasRole(profile) && profile.role === 'instructor'
}

/**
 * 스태프인지 확인
 */
export function isStaff(profile: UserProfile): boolean {
  return hasRole(profile) && profile.role === 'staff'
}

/**
 * 특정 권한을 가진지 확인
 */
export function hasPermission(profile: UserProfile, permission: string): boolean {
  if (!profile.permissions) return false
  return profile.permissions.includes(permission)
}

/**
 * 여러 권한 중 하나라도 가진지 확인
 */
export function hasAnyPermission(profile: UserProfile, permissions: string[]): boolean {
  if (!profile.permissions) return false
  return permissions.some(permission => profile.permissions!.includes(permission))
}

/**
 * 모든 권한을 가진지 확인
 */
export function hasAllPermissions(profile: UserProfile, permissions: string[]): boolean {
  if (!profile.permissions) return false
  return permissions.every(permission => profile.permissions!.includes(permission))
}

/**
 * 유효한 Tenant인지 확인
 */
export function isValidTenant(tenant: unknown): tenant is Tenant {
  return (
    typeof tenant === 'object' &&
    tenant !== null &&
    'id' in tenant &&
    typeof (tenant as Tenant).id === 'string' &&
    'name' in tenant &&
    typeof (tenant as Tenant).name === 'string' &&
    'slug' in tenant &&
    typeof (tenant as Tenant).slug === 'string'
  )
}

/**
 * 활성 테넌트인지 확인
 */
export function isActiveTenant(tenant: Tenant): boolean {
  return tenant.is_active === true
}

/**
 * 유효한 JWT 페이로드인지 확인
 */
export function isValidJWTPayload(payload: unknown): payload is JWTPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    typeof (payload as JWTPayload).sub === 'string' &&
    'email' in payload &&
    typeof (payload as JWTPayload).email === 'string' &&
    'iat' in payload &&
    typeof (payload as JWTPayload).iat === 'number' &&
    'exp' in payload &&
    typeof (payload as JWTPayload).exp === 'number'
  )
}

/**
 * 만료된 JWT인지 확인
 */
export function isJWTExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now
}

/**
 * 사용자가 특정 테넌트에 접근할 수 있는지 확인
 */
export function canAccessTenant(profile: UserProfile, tenantId: string): boolean {
  if (isSystemAdmin(profile)) return true
  return hasTenantId(profile) && profile.tenant_id === tenantId
}

/**
 * 두 사용자가 같은 테넌트인지 확인
 */
export function isSameTenant(profile1: UserProfile, profile2: UserProfile): boolean {
  return hasTenantId(profile1) && hasTenantId(profile2) && profile1.tenant_id === profile2.tenant_id
}

// ================================================================
// 9. 보안 유틸리티 함수들
// ================================================================

/**
 * 민감한 사용자 정보 마스킹
 */
export function maskUserProfile(profile: UserProfile): Partial<UserProfile> {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    role: profile.role,
    status: profile.status,
    created_at: profile.created_at,
    // 민감한 정보는 제외
    phone: undefined,
    avatar_url: undefined,
    tenant_id: undefined
  }
}

/**
 * 사용자 디스플레이용 정보만 추출
 */
export function getUserDisplayInfo(profile: UserProfile): {
  id: string
  name: string
  email: string
  role?: string | null
  avatar_url?: string | null
  initials: string
} {
  const nameParts = profile.name.split(' ')
  const initials = nameParts.length >= 2 
    ? `${nameParts[0]?.[0] || ''}${nameParts[1]?.[0] || ''}`.toUpperCase()
    : nameParts[0]?.slice(0, 2)?.toUpperCase() || 'U'

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatar_url: profile.avatar_url,
    initials
  }
}

/**
 * 권한 체크 결과 생성
 */
export function createPermissionResult(
  granted: boolean, 
  reason?: PermissionCheckResult['reason'], 
  context?: Partial<PermissionCheckResult>
): PermissionCheckResult {
  return {
    granted,
    reason,
    ...context
  }
}

/**
 * 보안 컨텍스트 생성
 */
export function createSecurityContext(
  profile: UserProfile, 
  sessionId: string, 
  metadata?: {
    ip_address?: string
    user_agent?: string
  }
): SecurityContext | null {
  if (!hasTenantId(profile)) return null

  return {
    user_id: profile.id,
    tenant_id: profile.tenant_id,
    session_id: sessionId,
    ip_address: metadata?.ip_address,
    user_agent: metadata?.user_agent,
    permissions: new Set(profile.permissions || []),
    role_level: profile.role_hierarchy?.level || 0,
    is_system_admin: isSystemAdmin(profile),
    last_activity: new Date()
  }
}

// ================================================================
// 10. 상수 및 기본값들
// ================================================================

/**
 * 기본 사용자 권한 상수들
 */
export const DEFAULT_PERMISSIONS = {
  SYSTEM_ADMIN: [
    'system:*',
    'tenant:*',
    'user:*',
    'student:*', 
    'class:*',
    'payment:*',
    'analytics:*'
  ],
  TENANT_ADMIN: [
    'tenant:read',
    'tenant:update',
    'user:*',
    'student:*',
    'class:*',
    'payment:*',
    'analytics:read'
  ],
  INSTRUCTOR: [
    'student:read',
    'student:update',
    'class:read',
    'class:update',
    'attendance:*',
    'grade:*'
  ],
  STAFF: [
    'student:read',
    'student:create',
    'student:update',
    'class:read',
    'payment:read'
  ],
  VIEWER: [
    'student:read',
    'class:read',
    'analytics:read'
  ]
} as const

/**
 * 역할 계층 상수
 */
export const ROLE_HIERARCHY = {
  system_admin: 100,
  admin: 80,
  instructor: 60,
  staff: 40,
  viewer: 20
} as const

/**
 * 세션 만료 시간 상수 (초)
 */
export const SESSION_EXPIRY = {
  ACCESS_TOKEN: 60 * 60, // 1시간
  REFRESH_TOKEN: 60 * 60 * 24 * 7, // 7일
  REMEMBER_ME: 60 * 60 * 24 * 30 // 30일
} as const