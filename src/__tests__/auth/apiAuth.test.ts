import { describe, test, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { withApiAuth, checkUserPermission, logSecurityEvent } from '@/lib/auth/apiAuth'

// Mock Supabase
const mockSupabase = {
  auth: {
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
    })),
    insert: vi.fn()
  }))
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabase
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('withApiAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should authenticate valid user with tenant access', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    const mockTenantUser = {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
      status: 'active',
      tenant_roles: {
        name: 'admin',
        hierarchy_level: 2,
        base_permissions: {}
      },
      custom_permissions: {}
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    mockSupabase.from().update().eq().eq.mockResolvedValue({
      data: {},
      error: null
    })

    const mockHandler = vi.fn().mockResolvedValue(new Response('Success'))
    const protectedHandler = withApiAuth(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    request.headers.set('x-tenant-id', 'tenant-123')

    const response = await protectedHandler(request)

    expect(response.status).toBe(200)
    expect(mockHandler).toHaveBeenCalled()
    
    const authenticatedReq = mockHandler.mock.calls[0][0]
    expect(authenticatedReq.user.id).toBe('user-123')
    expect(authenticatedReq.user.tenant_id).toBe('tenant-123')
    expect(authenticatedReq.user.role).toBe('admin')
    expect(authenticatedReq.user.role_level).toBe(2)
  })

  test('should reject unauthenticated requests', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    const response = await protectedHandler(request)

    expect(response.status).toBe(401)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Authentication required')
    expect(body.code).toBe('AUTH_REQUIRED')
  })

  test('should reject requests without tenant ID', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    // No x-tenant-id header

    const response = await protectedHandler(request)

    expect(response.status).toBe(400)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Tenant information required')
    expect(body.code).toBe('TENANT_REQUIRED')
  })

  test('should reject invalid tenant access', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: null,
      error: new Error('No rows found')
    })

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    request.headers.set('x-tenant-id', 'invalid-tenant')

    const response = await protectedHandler(request)

    expect(response.status).toBe(403)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Access denied for this tenant')
    expect(body.code).toBe('TENANT_ACCESS_DENIED')
  })

  test('should enforce owner requirement', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    const mockTenantUser = {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
      status: 'active',
      tenant_roles: {
        name: 'admin',
        hierarchy_level: 2, // Not owner (level 1)
        base_permissions: {}
      },
      custom_permissions: {}
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler, { requireOwner: true })

    const request = new NextRequest('http://localhost/api/test')
    request.headers.set('x-tenant-id', 'tenant-123')

    const response = await protectedHandler(request)

    expect(response.status).toBe(403)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Owner access required')
    expect(body.code).toBe('OWNER_REQUIRED')
  })

  test('should enforce admin requirement', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    const mockTenantUser = {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
      status: 'active',
      tenant_roles: {
        name: 'instructor',
        hierarchy_level: 3, // Not admin (level 2 or lower)
        base_permissions: {}
      },
      custom_permissions: {}
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler, { requireAdmin: true })

    const request = new NextRequest('http://localhost/api/test')
    request.headers.set('x-tenant-id', 'tenant-123')

    const response = await protectedHandler(request)

    expect(response.status).toBe(403)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Admin access required')
    expect(body.code).toBe('ADMIN_REQUIRED')
  })

  test('should enforce specific permissions', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    const mockTenantUser = {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
      status: 'active',
      tenant_roles: {
        name: 'viewer',
        hierarchy_level: 5, // Viewer level
        base_permissions: {}
      },
      custom_permissions: {} // No custom permissions
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler, {
      requiredPermissions: [{ resource: 'students', action: 'write' }]
    })

    const request = new NextRequest('http://localhost/api/test')
    request.headers.set('x-tenant-id', 'tenant-123')

    const response = await protectedHandler(request)

    expect(response.status).toBe(403)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Insufficient permissions')
    expect(body.code).toBe('PERMISSION_DENIED')
    expect(body.required).toEqual([{ resource: 'students', action: 'write' }])
  })

  test('should allow access with custom permissions', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
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
        students: ['read', 'write'] // Custom permission overrides role default
      }
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    mockSupabase.from().update().eq().eq.mockResolvedValue({
      data: {},
      error: null
    })

    const mockHandler = vi.fn().mockResolvedValue(new Response('Success'))
    const protectedHandler = withApiAuth(mockHandler, {
      requiredPermissions: [{ resource: 'students', action: 'write' }]
    })

    const request = new NextRequest('http://localhost/api/test')
    request.headers.set('x-tenant-id', 'tenant-123')

    const response = await protectedHandler(request)

    expect(response.status).toBe(200)
    expect(mockHandler).toHaveBeenCalled()
  })

  test('should handle internal server errors', async () => {
    mockSupabase.auth.getSession.mockRejectedValue(new Error('Database error'))

    const mockHandler = vi.fn()
    const protectedHandler = withApiAuth(mockHandler)

    const request = new NextRequest('http://localhost/api/test')

    const response = await protectedHandler(request)

    expect(response.status).toBe(500)
    expect(mockHandler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe('Internal server error')
    expect(body.code).toBe('INTERNAL_ERROR')
  })
})

describe('checkUserPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should return true for valid permission', async () => {
    const mockTenantUser = {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
      status: 'active',
      tenant_roles: {
        name: 'admin',
        hierarchy_level: 2
      },
      custom_permissions: {}
    }

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    const result = await checkUserPermission('user-123', 'tenant-123', 'students', 'write')

    expect(result).toBe(true)
  })

  test('should return false for invalid permission', async () => {
    const mockTenantUser = {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
      status: 'active',
      tenant_roles: {
        name: 'viewer',
        hierarchy_level: 5
      },
      custom_permissions: {}
    }

    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: mockTenantUser,
      error: null
    })

    const result = await checkUserPermission('user-123', 'tenant-123', 'students', 'delete')

    expect(result).toBe(false)
  })

  test('should return false on database error', async () => {
    mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
      data: null,
      error: new Error('User not found')
    })

    const result = await checkUserPermission('invalid-user', 'tenant-123', 'students', 'read')

    expect(result).toBe(false)
  })
})

describe('logSecurityEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should log security event successfully', async () => {
    mockSupabase.from().insert.mockResolvedValue({
      data: {},
      error: null
    })

    await logSecurityEvent(
      'user-123',
      'tenant-123',
      'delete',
      'students',
      {
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        session_id: 'session-123'
      }
    )

    expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
    expect(mockSupabase.from().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        action: 'delete',
        table_name: 'students',
        risk_level: 'medium',
        is_anomalous: false
      })
    )
  })

  test('should not throw on logging failure', async () => {
    mockSupabase.from().insert.mockResolvedValue({
      data: null,
      error: new Error('Logging failed')
    })

    // Should not throw
    await expect(logSecurityEvent(
      'user-123',
      'tenant-123',
      'delete',
      'students'
    )).resolves.toBeUndefined()
  })
})