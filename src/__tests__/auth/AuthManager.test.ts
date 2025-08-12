import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { AuthManager } from '@/lib/auth/supabaseAuth'

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }))
}

vi.mock('@/lib/auth/supabaseAuth', async () => {
  const actual = await vi.importActual('@/lib/auth/supabaseAuth')
  return {
    ...actual,
    supabaseAuth: mockSupabase
  }
})

describe('AuthManager', () => {
  let authManager: AuthManager

  beforeEach(() => {
    authManager = AuthManager.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset the singleton instance for testing
    ;(AuthManager as unknown as { instance: undefined }).instance = undefined
  })

  describe('signIn', () => {
    test('should authenticate user with valid credentials and tenant', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockTenantUser = {
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        status: 'active',
        tenant_roles: {
          name: 'admin',
          hierarchy_level: 2,
          base_permissions: {}
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      const result = await authManager.signIn('test@example.com', 'password', 'tenant-123')

      expect(result.error).toBeNull()
      expect(result.user).toBeTruthy()
      expect(result.user!.tenant_id).toBe('tenant-123')
      expect(result.user!.role).toBe('admin')
    })

    test('should reject invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid login credentials')
      })

      const result = await authManager.signIn('invalid@example.com', 'wrong', 'tenant-123')

      expect(result.error).toBeTruthy()
      expect(result.error).toContain('Invalid login credentials')
    })

    test('should reject invalid tenant membership', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('No rows found')
      })

      const result = await authManager.signIn('test@example.com', 'password', 'invalid-tenant')

      expect(result.error).toBeTruthy()
      expect(result.error).toContain('멤버가 아닙니다')
    })

    test('should handle inactive tenant membership', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockTenantUser = {
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        status: 'inactive'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      const result = await authManager.signIn('test@example.com', 'password', 'tenant-123')

      expect(result.error).toBeTruthy()
    })
  })

  describe('permission checking', () => {
    beforeEach(async () => {
      // Mock successful authentication
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockTenantUser = {
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        status: 'active',
        tenant_roles: {
          name: 'instructor',
          hierarchy_level: 3,
          base_permissions: {}
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      await authManager.signIn('test@example.com', 'password', 'tenant-123')
    })

    test('should grant correct permissions for instructor role', () => {
      expect(authManager.hasPermission('students', 'read')).toBe(true)
      expect(authManager.hasPermission('students', 'write')).toBe(true)
      expect(authManager.hasPermission('students', 'delete')).toBe(false)
      expect(authManager.hasPermission('classes', 'read')).toBe(true)
      expect(authManager.hasPermission('classes', 'write')).toBe(true)
      expect(authManager.hasPermission('payments', 'read')).toBe(true)
      expect(authManager.hasPermission('payments', 'write')).toBe(false)
    })

    test('should check role hierarchy correctly', () => {
      expect(authManager.isOwner()).toBe(false)
      expect(authManager.isAdmin()).toBe(false)
      expect(authManager.isInstructor()).toBe(true)
    })
  })

  describe('owner permissions', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'owner-123',
        email: 'owner@example.com'
      }

      const mockTenantUser = {
        tenant_id: 'tenant-123',
        user_id: 'owner-123',
        status: 'active',
        tenant_roles: {
          name: 'owner',
          hierarchy_level: 1,
          base_permissions: {}
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      await authManager.signIn('owner@example.com', 'password', 'tenant-123')
    })

    test('should grant all permissions for owner role', () => {
      expect(authManager.hasPermission('students', 'read')).toBe(true)
      expect(authManager.hasPermission('students', 'write')).toBe(true)
      expect(authManager.hasPermission('students', 'delete')).toBe(true)
      expect(authManager.hasPermission('students', 'admin')).toBe(true)
      expect(authManager.hasPermission('settings', 'admin')).toBe(true)
      expect(authManager.hasPermission('users', 'admin')).toBe(true)
    })

    test('should identify owner role correctly', () => {
      expect(authManager.isOwner()).toBe(true)
      expect(authManager.isAdmin()).toBe(true) // Owner is also admin
      expect(authManager.isInstructor()).toBe(true) // Owner includes instructor rights
    })
  })

  describe('custom permissions', () => {
    test('should respect custom permissions over role defaults', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockTenantUser = {
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        status: 'active',
        tenant_roles: {
          name: 'viewer',
          hierarchy_level: 5,
          base_permissions: {}
        },
        custom_permissions: {
          students: ['read', 'write', 'delete'],
          classes: ['admin']
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      await authManager.signIn('test@example.com', 'password', 'tenant-123')

      // Viewer normally only has read permissions
      // But custom permissions should override
      expect(authManager.hasPermission('students', 'write')).toBe(true)
      expect(authManager.hasPermission('students', 'delete')).toBe(true)
      expect(authManager.hasPermission('classes', 'admin')).toBe(true)
      
      // Should still respect role defaults where no custom permission exists
      expect(authManager.hasPermission('videos', 'read')).toBe(true)
      expect(authManager.hasPermission('videos', 'write')).toBe(false)
    })
  })

  describe('signOut', () => {
    test('should clear user session', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await authManager.signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(authManager.getCurrentUser()).toBeNull()
      expect(authManager.getCurrentTenant()).toBeNull()
    })
  })

  describe('refreshUserData', () => {
    test('should update user permissions', async () => {
      // First, authenticate
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      let mockTenantUser = {
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        status: 'active',
        tenant_roles: {
          name: 'viewer',
          hierarchy_level: 5,
          base_permissions: {}
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      await authManager.signIn('test@example.com', 'password', 'tenant-123')
      expect(authManager.hasPermission('students', 'write')).toBe(false)

      // Update role to admin
      mockTenantUser = {
        ...mockTenantUser,
        tenant_roles: {
          name: 'admin',
          hierarchy_level: 2,
          base_permissions: {}
        }
      }

      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockTenantUser,
        error: null
      })

      await authManager.refreshUserData()

      // Should now have admin permissions
      expect(authManager.hasPermission('students', 'write')).toBe(true)
      expect(authManager.isAdmin()).toBe(true)
    })
  })
})