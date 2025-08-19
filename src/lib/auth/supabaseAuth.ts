import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export const supabase = createClient()

export interface TenantWithRole {
  id: string
  name: string
  slug: string
  role: string
  hierarchy_level: number
  permission_overrides?: Record<string, string[]> | null
}

export interface AuthUser extends User {
  tenant_id?: string
  role?: string
  permissions?: Record<string, string[]>
  available_tenants?: Array<{
    id: string
    name: string
    slug: string
    role?: string
  }>
  is_developer?: boolean
}

export interface AuthSession extends Session {
  user: AuthUser
}

// Developer/superuser permissions (all access)
const DEVELOPER_PERMISSIONS: Record<string, string[]> = {
  students: ['read', 'write', 'delete', 'admin'],
  classes: ['read', 'write', 'delete', 'admin'],
  payments: ['read', 'write', 'delete', 'admin'],
  reports: ['read', 'write', 'delete', 'admin'],
  settings: ['read', 'write', 'delete', 'admin'],
  videos: ['read', 'write', 'delete', 'admin'],
  users: ['read', 'write', 'delete', 'admin'],
  tenants: ['read', 'write', 'delete', 'admin']
}

// Default role permissions mapping
const ROLE_PERMISSIONS = {
  owner: {
    students: ['read', 'write', 'delete', 'admin'],
    classes: ['read', 'write', 'delete', 'admin'],
    payments: ['read', 'write', 'delete', 'admin'],
    reports: ['read', 'write', 'delete', 'admin'],
    settings: ['read', 'write', 'delete', 'admin'],
    videos: ['read', 'write', 'delete', 'admin'],
    users: ['read', 'write', 'delete', 'admin']
  },
  admin: {
    students: ['read', 'write', 'delete'],
    classes: ['read', 'write', 'delete'],
    payments: ['read', 'write'],
    reports: ['read', 'write'],
    settings: ['read', 'write'],
    videos: ['read', 'write', 'delete'],
    users: ['read', 'write']
  },
  instructor: {
    students: ['read', 'write'],
    classes: ['read', 'write'],
    payments: ['read'],
    reports: ['read'],
    videos: ['read', 'write'],
    settings: ['read']
  },
  staff: {
    students: ['read', 'write'],
    classes: ['read'],
    payments: ['read'],
    reports: ['read'],
    videos: ['read']
  },
  viewer: {
    students: ['read'],
    classes: ['read'],
    payments: ['read'],
    reports: ['read'],
    videos: ['read']
  },
  developer: DEVELOPER_PERMISSIONS
} as Record<string, Record<string, string[]>>

export class AuthManager {
  private static instance: AuthManager
  private currentUser: AuthUser | null = null
  private currentTenant: string | null = null
  
  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }
  
  /**
   * 올바른 인증 플로우: 이메일/패스워드 먼저, 그다음 테넌트 자동 감지
   */
  async signIn(email: string, password: string, selectedTenantId?: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // 1. 기본 Supabase 인증 (테넌트 무관하게 먼저 로그인)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      const user = authData.user
      if (!user) {
        return { user: null, error: '인증 실패' }
      }

      // 2. 사용자가 속한 모든 테넌트 조회
      const userTenants = await this.getUserTenants(user.id)
      
      if (!userTenants || userTenants.length === 0) {
        await supabase.auth.signOut()
        return { user: null, error: '접근 가능한 테넌트가 없습니다. 관리자에게 문의하세요.' }
      }

      // 3. 개발자/관리자 특별 권한 확인
      const isDeveloper = this.checkDeveloperAccess(email, userTenants || [])

      // 4. 개발자인 경우 모든 테넌트에 접근 가능
      let availableTenants = userTenants
      if (isDeveloper) {
        const allTenants = await this.getAllTenants()
        availableTenants = allTenants || userTenants
      }

      // 5. 테넌트 선택 로직
      let selectedTenant = null
      if (selectedTenantId) {
        // 특정 테넌트 지정된 경우
        selectedTenant = availableTenants.find(t => t?.id === selectedTenantId) || null
        if (!selectedTenant) {
          return { user: null, error: '해당 테넌트에 대한 접근 권한이 없습니다.' }
        }
      } else {
        // 자동 선택: 가장 높은 권한의 테넌트
        const validTenants = availableTenants.filter(t => t != null)
        selectedTenant = validTenants.sort((a, b) => 
          (a.hierarchy_level || 999) - (b.hierarchy_level || 999)
        )[0] || null
      }

      // null 체크 추가
      if (!selectedTenant) {
        return { user: null, error: '사용 가능한 테넌트가 없습니다.' }
      }

      // 6. 사용자 정보 구성
      const permissions = this.getPermissions(isDeveloper ? 'developer' : selectedTenant.role, selectedTenant.permission_overrides || null)
      
      const authUser: AuthUser = {
        ...user,
        tenant_id: selectedTenant.id,
        role: isDeveloper ? 'developer' : selectedTenant.role,
        permissions: permissions || {},
        available_tenants: availableTenants.filter(t => t != null).map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          role: t.role
        })),
        is_developer: isDeveloper
      }

      this.currentUser = authUser
      this.currentTenant = selectedTenant.id

      // 7. 로그인 시간 업데이트
      await this.updateLastLogin(user.id, selectedTenant.id)

      return { user: authUser, error: null }

    } catch (error) {
      console.error('Login error:', error)
      return { user: null, error: '로그인 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 사용자가 속한 모든 테넌트 조회 (재시도 로직 포함)
   */
  private async getUserTenants(userId: string): Promise<TenantWithRole[] | null> {
    console.log('🔍 Fetching tenants for user:', userId)
    
    // RLS 정책 인증 상태 안정화를 위한 재시도 로직
    let attempts = 0
    const maxAttempts = 3
    const retryDelay = 500 // 500ms
    let tenantUsers = null
    
    while (attempts < maxAttempts) {
      attempts++
      
      try {
        // 1. 기본 tenant_users 데이터 조회
        const { data: fetchedTenantUsers, error: tenantUserError } = await supabase
          .from('tenant_users')
          .select('tenant_id, primary_role_id, permission_overrides, email, name')
          .eq('user_id', userId)
          .eq('status', 'active')

        if (tenantUserError) {
          // 403 오류인 경우 재시도 (RLS 정책 인증 상태 불일치)
          if (tenantUserError.code === '403' || tenantUserError.message.includes('permission denied')) {
            console.log(`🔄 Attempt ${attempts}/${maxAttempts}: RLS permission issue, retrying in ${retryDelay}ms...`)
            
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, retryDelay))
              continue
            }
          }
          
          console.error('❌ Error fetching tenant_users:', tenantUserError)
          return null
        }

        // 성공적으로 데이터를 가져옴
        tenantUsers = fetchedTenantUsers
        console.log('✅ Found tenant memberships:', tenantUsers?.length || 0)
        break
        
      } catch (error) {
        console.error(`❌ Exception on attempt ${attempts}:`, error)
        if (attempts >= maxAttempts) return null
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    if (!tenantUsers || tenantUsers.length === 0) {
      console.log('❌ No tenant memberships found for user:', userId)
      return []
    }

    // 2. 각 테넌트에 대한 정보 조회
    const tenantPromises = tenantUsers.map(async (tu) => {
      // 테넌트 정보 조회
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('id', tu.tenant_id)
        .single()

      if (tenantError) {
        console.error('❌ Error fetching tenant:', tu.tenant_id, tenantError)
        return null
      }

      // 역할 정보 조회 (있는 경우)
      let role = null
      if (tu.primary_role_id) {
        const { data: roleData, error: roleError } = await supabase
          .from('tenant_roles')
          .select('name, hierarchy_level, base_permissions')
          .eq('id', tu.primary_role_id)
          .single()

        if (!roleError && roleData) {
          role = roleData
        }
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: role?.name || 'viewer',
        hierarchy_level: role?.hierarchy_level || 999,
        permission_overrides: tu.permission_overrides
      }
    })

    const results = await Promise.all(tenantPromises)
    const validTenants = results.filter(Boolean)
    
    console.log('✅ Successfully mapped tenant data:', validTenants.length)
    console.log('📋 User tenants:', validTenants.map(t => t ? `${t.name} (${t.role})` : 'null'))
    
    const filteredTenants: TenantWithRole[] = []
    for (const tenant of validTenants) {
      if (tenant !== null) {
        filteredTenants.push(tenant as TenantWithRole)
      }
    }
    return filteredTenants
  }

  /**
   * 개발자 권한 확인
   */
  private checkDeveloperAccess(email: string, userTenants: TenantWithRole[]): boolean {
    // 개발자 이메일 패턴 확인
    if (email.includes('admin@test.com') || 
        email.includes('@dev.') || 
        email.includes('developer@')) {
      return true
    }

    // Owner 권한 확인 (hierarchy_level = 1)
    return userTenants.some(t => t?.hierarchy_level === 1)
  }

  /**
   * 모든 테넌트 조회 (개발자용)
   */
  private async getAllTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching all tenants:', error)
      return null
    }

    return data?.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      role: 'developer',
      hierarchy_level: 0
    })) || []
  }

  /**
   * 권한 매트릭스 조회
   */
  private getPermissions(role: string, overrides?: Record<string, string[]> | null): Record<string, string[]> {
    const basePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer
    
    // 권한 오버라이드 적용
    if (overrides && typeof overrides === 'object') {
      return { ...basePermissions, ...overrides }
    }

    return basePermissions || {}
  }

  /**
   * 테넌트 변경
   */
  async switchTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const availableTenant = this.currentUser.available_tenants?.find(t => t.id === tenantId)
    if (!availableTenant && !this.currentUser.is_developer) {
      return { success: false, error: '해당 테넌트에 대한 접근 권한이 없습니다.' }
    }

    this.currentUser.tenant_id = tenantId
    this.currentTenant = tenantId

    return { success: true }
  }

  /**
   * 로그인 시간 업데이트
   */
  private async updateLastLogin(userId: string, tenantId: string) {
    try {
      await supabase
        .from('tenant_users')
        .update({ 
          last_login_at: new Date().toISOString(),
          login_attempts: 0 
        })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
    } catch (error) {
      console.error('Error updating last login:', error)
      // Non-critical error, don't throw
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
    this.currentUser = null
    this.currentTenant = null
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  getCurrentTenant(): string | null {
    return this.currentTenant
  }

  hasPermission(resource: string, action: string): boolean {
    if (!this.currentUser?.permissions) return false
    
    const resourcePerms = this.currentUser.permissions[resource]
    if (!resourcePerms) return false
    
    return resourcePerms.includes(action) || resourcePerms.includes('admin')
  }

  /**
   * 현재 세션에서 사용자 정보 복원
   */
  async restoreSession(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // getUser()로 먼저 사용자 확인 (보안상 더 안전)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { user: null, error: '사용자 인증이 필요합니다.' }
      }

      // 세션이 있으면 사용자 테넌트 정보 복원
      const userTenants = await this.getUserTenants(user.id)
      if (!userTenants || userTenants.length === 0) {
        return { user: null, error: '접근 가능한 테넌트가 없습니다.' }
      }

      const isDeveloper = this.checkDeveloperAccess(user.email!, userTenants)
      let availableTenants = userTenants
      
      if (isDeveloper) {
        const allTenants = await this.getAllTenants()
        availableTenants = allTenants || userTenants
      }

      const selectedTenant = availableTenants[0] // 첫 번째 테넌트 선택
      
      if (!selectedTenant) {
        return { user: null, error: '사용 가능한 테넌트가 없습니다.' }
      }

      const authUser: AuthUser = {
        ...user,
        tenant_id: selectedTenant.id,
        role: isDeveloper ? 'developer' : selectedTenant.role,
        permissions: this.getPermissions(isDeveloper ? 'developer' : selectedTenant.role, selectedTenant.permission_overrides || null),
        available_tenants: availableTenants.filter(t => t != null).map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          role: t.role
        })),
        is_developer: isDeveloper
      }

      this.currentUser = authUser
      this.currentTenant = selectedTenant.id

      return { user: authUser, error: null }

    } catch (error) {
      console.error('Session restore error:', error)
      return { user: null, error: '세션 복원 실패' }
    }
  }

  /**
   * 현재 사용자가 테넌트 소유자인지 확인
   */
  isOwner(): boolean {
    if (!this.currentUser || !this.currentUser.role) {
      return false
    }
    return this.currentUser.role === 'owner'
  }

  /**
   * 현재 사용자가 관리자인지 확인
   */
  isAdmin(): boolean {
    if (!this.currentUser || !this.currentUser.role) {
      return false
    }
    return ['owner', 'admin'].includes(this.currentUser.role)
  }

  /**
   * 현재 사용자가 강사인지 확인
   */
  isInstructor(): boolean {
    if (!this.currentUser || !this.currentUser.role) {
      return false
    }
    return ['owner', 'admin', 'instructor'].includes(this.currentUser.role)
  }

  /**
   * 사용자 데이터를 새로고침
   */
  async refreshUserData(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!this.currentUser) {
        return { user: null, error: '현재 사용자가 없습니다' }
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { user: null, error: '사용자 인증이 필요합니다' }
      }

      // 사용자 정보 재조회
      const userTenants = await this.getUserTenants(user.id)
      if (!userTenants || userTenants.length === 0) {
        return { user: null, error: '접근 가능한 테넌트가 없습니다' }
      }

      const isDeveloper = this.checkDeveloperAccess(user.email!, userTenants)
      let availableTenants = userTenants
      
      if (isDeveloper) {
        const allTenants = await this.getAllTenants()
        availableTenants = allTenants || userTenants
      }

      // 현재 테넌트 정보 유지하면서 업데이트
      const currentTenant = availableTenants.find(t => t?.id === this.currentTenant) || availableTenants[0]
      
      if (!currentTenant) {
        return { user: null, error: '사용 가능한 테넌트가 없습니다.' }
      }

      const authUser: AuthUser = {
        ...user,
        tenant_id: currentTenant.id,
        role: currentTenant.role,
        permissions: isDeveloper ? DEVELOPER_PERMISSIONS : (this.getPermissions(currentTenant.role, currentTenant.permission_overrides) || {}),
        available_tenants: availableTenants.filter(t => t != null).map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          role: t.role
        })),
        is_developer: isDeveloper
      }

      this.currentUser = authUser
      this.currentTenant = currentTenant.id

      return { user: authUser, error: null }

    } catch (error) {
      console.error('User data refresh error:', error)
      return { user: null, error: '사용자 데이터 새로고침 실패' }
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance()
export default authManager