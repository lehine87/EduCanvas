import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AuthManager } from '@/lib/auth/supabaseAuth'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock AuthManager
vi.mock('@/lib/auth/supabaseAuth', () => ({
  AuthManager: {
    getInstance: vi.fn(() => ({
      signIn: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      getCurrentTenant: vi.fn(),
      hasPermission: vi.fn(),
      isOwner: vi.fn(),
      isAdmin: vi.fn(),
      isInstructor: vi.fn(),
      refreshUserData: vi.fn()
    }))
  },
  supabaseAuth: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn()
    },
    from: vi.fn()
  }
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
})

describe('AuthContext', () => {
  let mockAuthManager: {
    signIn: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getCurrentUser: ReturnType<typeof vi.fn>
    getCurrentTenant: ReturnType<typeof vi.fn>
    hasPermission: ReturnType<typeof vi.fn>
    isOwner: ReturnType<typeof vi.fn>
    isAdmin: ReturnType<typeof vi.fn>
    isInstructor: ReturnType<typeof vi.fn>
    refreshUserData: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAuthManager = AuthManager.getInstance() as unknown as typeof mockAuthManager
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const TestComponent = () => {
    const auth = useAuth()
    return (
      <div>
        <div data-testid="loading">{auth.loading ? 'Loading' : 'Not Loading'}</div>
        <div data-testid="user">{auth.user ? auth.user.email : 'No User'}</div>
        <div data-testid="tenant">{auth.tenantId || 'No Tenant'}</div>
        <div data-testid="owner">{auth.isOwner() ? 'Owner' : 'Not Owner'}</div>
        <div data-testid="admin">{auth.isAdmin() ? 'Admin' : 'Not Admin'}</div>
        <button
          data-testid="signin"
          onClick={() => auth.signIn('test@example.com', 'password', 'tenant-123')}
        >
          Sign In
        </button>
        <button data-testid="signout" onClick={() => auth.signOut()}>
          Sign Out
        </button>
      </div>
    )
  }

  test('should provide authentication context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
    expect(screen.getByTestId('tenant')).toHaveTextContent('No Tenant')
  })

  test('should handle successful sign in', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenant_id: 'tenant-123',
      role: 'admin'
    }

    mockAuthManager.signIn.mockResolvedValue({
      user: mockUser,
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signInButton = screen.getByTestId('signin')
    
    await act(async () => {
      signInButton.click()
    })

    await waitFor(() => {
      expect(mockAuthManager.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password',
        'tenant-123'
      )
    })

    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
  })

  test('should handle sign in error', async () => {
    mockAuthManager.signIn.mockResolvedValue({
      user: null,
      error: new Error('Invalid credentials')
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signInButton = screen.getByTestId('signin')
    
    await act(async () => {
      signInButton.click()
    })

    await waitFor(() => {
      expect(mockAuthManager.signIn).toHaveBeenCalled()
    })

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('should handle sign out', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenant_id: 'tenant-123',
      role: 'admin'
    }

    // Set up authenticated state
    mockAuthManager.getCurrentUser.mockReturnValue(mockUser)
    mockAuthManager.getCurrentTenant.mockReturnValue('tenant-123')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signOutButton = screen.getByTestId('signout')
    
    await act(async () => {
      signOutButton.click()
    })

    await waitFor(() => {
      expect(mockAuthManager.signOut).toHaveBeenCalled()
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  test('should check permissions correctly', () => {
    mockAuthManager.hasPermission.mockReturnValue(true)
    mockAuthManager.isOwner.mockReturnValue(false)
    mockAuthManager.isAdmin.mockReturnValue(true)
    mockAuthManager.isInstructor.mockReturnValue(true)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('owner')).toHaveTextContent('Not Owner')
    expect(screen.getByTestId('admin')).toHaveTextContent('Admin')
  })

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth는 AuthProvider 내부에서 사용해야 합니다.')

    consoleSpy.mockRestore()
  })
})

describe('withAuth HOC', () => {
  let mockAuthManager: {
    getCurrentUser: ReturnType<typeof vi.fn>
    getCurrentTenant: ReturnType<typeof vi.fn>
    hasPermission: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAuthManager = AuthManager.getInstance() as unknown as typeof mockAuthManager
    vi.clearAllMocks()
  })

  test('should redirect unauthenticated users', () => {
    const { withAuth } = require('@/contexts/AuthContext')
    
    const ProtectedComponent = withAuth(() => <div>Protected Content</div>)

    mockAuthManager.getCurrentUser.mockReturnValue(null)
    
    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  test('should show loading state', () => {
    const { withAuth } = require('@/contexts/AuthContext')
    
    const ProtectedComponent = withAuth(() => <div>Protected Content</div>)

    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    )

    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  test('should render component for authenticated users', () => {
    const { withAuth } = require('@/contexts/AuthContext')
    
    const ProtectedComponent = withAuth(() => <div>Protected Content</div>)

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenant_id: 'tenant-123',
      role: 'admin'
    }

    mockAuthManager.getCurrentUser.mockReturnValue(mockUser)
    mockAuthManager.getCurrentTenant.mockReturnValue('tenant-123')

    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('should check required permissions', () => {
    const { withAuth } = require('@/contexts/AuthContext')
    
    const ProtectedComponent = withAuth(
      () => <div>Admin Content</div>,
      [{ resource: 'users', action: 'admin' }]
    )

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenant_id: 'tenant-123',
      role: 'viewer'
    }

    mockAuthManager.getCurrentUser.mockReturnValue(mockUser)
    mockAuthManager.getCurrentTenant.mockReturnValue('tenant-123')
    mockAuthManager.hasPermission.mockReturnValue(false)

    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/admin/unauthorized')
  })

  test('should render component when permissions are satisfied', () => {
    const { withAuth } = require('@/contexts/AuthContext')
    
    const ProtectedComponent = withAuth(
      () => <div>Admin Content</div>,
      [{ resource: 'users', action: 'admin' }]
    )

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenant_id: 'tenant-123',
      role: 'admin'
    }

    mockAuthManager.getCurrentUser.mockReturnValue(mockUser)
    mockAuthManager.getCurrentTenant.mockReturnValue('tenant-123')
    mockAuthManager.hasPermission.mockReturnValue(true)

    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})