import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { 
  PermissionGuard, 
  AdminOnly, 
  OwnerOnly,
  StudentCreateGuard,
  StudentUpdateGuard,
  StudentDeleteGuard,
  ClassCreateGuard,
  ClassUpdateGuard 
} from '@/components/auth/PermissionGuard'

// Mock AuthContext
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      hasPermission: vi.fn(),
      isOwner: vi.fn(),
      isAdmin: vi.fn(),
      isInstructor: vi.fn()
    }))
  }
})

describe('PermissionGuard', () => {
  let mockAuth: {
    hasPermission: ReturnType<typeof vi.fn>
    isOwner: ReturnType<typeof vi.fn>
    isAdmin: ReturnType<typeof vi.fn>
    isInstructor: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = useAuth()
    vi.clearAllMocks()
  })

  test('should render children when permission is granted', () => {
    mockAuth.hasPermission.mockReturnValue(true)

    render(
      <PermissionGuard resource="student" action="read">
        <div>Protected Content</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('should not render children when permission is denied', () => {
    mockAuth.hasPermission.mockReturnValue(false)

    render(
      <PermissionGuard resource="student" action="update">
        <div>Protected Content</div>
      </PermissionGuard>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('should render fallback when permission is denied', () => {
    mockAuth.hasPermission.mockReturnValue(false)

    render(
      <PermissionGuard 
        resource="student" 
        action="update"
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('should check owner requirement', () => {
    mockAuth.isOwner.mockReturnValue(false)
    mockAuth.hasPermission.mockReturnValue(true)

    render(
      <PermissionGuard 
        resource="system" 
        action="manage"
        requireOwnership
      >
        <div>Owner Only Content</div>
      </PermissionGuard>
    )

    expect(screen.queryByText('Owner Only Content')).not.toBeInTheDocument()
  })

  test('should render when owner requirement is met', () => {
    mockAuth.isOwner.mockReturnValue(true)
    mockAuth.hasPermission.mockReturnValue(true)

    render(
      <PermissionGuard 
        resource="system" 
        action="manage"
        requireOwnership
      >
        <div>Owner Only Content</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Owner Only Content')).toBeInTheDocument()
  })

  test('should check admin requirement', () => {
    mockAuth.isAdmin.mockReturnValue(false)
    mockAuth.hasPermission.mockReturnValue(true)

    render(
      <PermissionGuard 
        resource="user" 
        action="update"
        fallback={<div>Admin required</div>}
      >
        <div>Admin Only Content</div>
      </PermissionGuard>
    )

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
  })

  test('should render when admin requirement is met', () => {
    mockAuth.isAdmin.mockReturnValue(true)
    mockAuth.hasPermission.mockReturnValue(true)

    render(
      <PermissionGuard 
        resource="user" 
        action="update"
        fallback={<div>Admin required</div>}
      >
        <div>Admin Only Content</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Admin Only Content')).toBeInTheDocument()
  })

  test('should check instructor requirement', () => {
    mockAuth.isInstructor.mockReturnValue(false)
    mockAuth.hasPermission.mockReturnValue(true)

    render(
      <PermissionGuard 
        resource="class" 
        action="update"
        fallback={<div>Instructor required</div>}
      >
        <div>Instructor Only Content</div>
      </PermissionGuard>
    )

    expect(screen.queryByText('Instructor Only Content')).not.toBeInTheDocument()
  })
})

describe('Specialized Permission Guards', () => {
  let mockAuth: {
    hasPermission: ReturnType<typeof vi.fn>
    isOwner: ReturnType<typeof vi.fn>
    isAdmin: ReturnType<typeof vi.fn>
    isInstructor: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = useAuth()
    vi.clearAllMocks()
  })

  test('OwnerOnly should work correctly', () => {
    mockAuth.isOwner.mockReturnValue(true)

    render(
      <OwnerOnly>
        <div>Owner Content</div>
      </OwnerOnly>
    )

    expect(screen.getByText('Owner Content')).toBeInTheDocument()
  })

  test('OwnerOnly should hide content for non-owners', () => {
    mockAuth.isOwner.mockReturnValue(false)

    render(
      <OwnerOnly fallback={<div>Not Owner</div>}>
        <div>Owner Content</div>
      </OwnerOnly>
    )

    expect(screen.getByText('Not Owner')).toBeInTheDocument()
    expect(screen.queryByText('Owner Content')).not.toBeInTheDocument()
  })

  test('AdminOnly should work correctly', () => {
    mockAuth.isAdmin.mockReturnValue(true)

    render(
      <AdminOnly>
        <div>Admin Content</div>
      </AdminOnly>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  test('StudentWriteGuard should check student write permission', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      return resource === 'students' && action === 'write'
    })

    render(
      <StudentUpdateGuard>
        <div>Student Write Content</div>
      </StudentUpdateGuard>
    )

    expect(screen.getByText('Student Write Content')).toBeInTheDocument()
    expect(mockAuth.hasPermission).toHaveBeenCalledWith('students', 'write')
  })

  test('StudentDeleteGuard should check student delete permission', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      return resource === 'students' && action === 'delete'
    })

    render(
      <StudentDeleteGuard>
        <div>Student Delete Content</div>
      </StudentDeleteGuard>
    )

    expect(screen.getByText('Student Delete Content')).toBeInTheDocument()
    expect(mockAuth.hasPermission).toHaveBeenCalledWith('students', 'delete')
  })

  test('ClassWriteGuard should check class write permission', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      return resource === 'classes' && action === 'write'
    })

    render(
      <ClassUpdateGuard>
        <div>Class Write Content</div>
      </ClassUpdateGuard>
    )

    expect(screen.getByText('Class Write Content')).toBeInTheDocument()
    expect(mockAuth.hasPermission).toHaveBeenCalledWith('classes', 'write')
  })

  test('should handle multiple permission requirements', () => {
    mockAuth.hasPermission.mockReturnValue(false)
    mockAuth.isAdmin.mockReturnValue(false)

    render(
      <StudentDeleteGuard fallback={<div>No Delete Access</div>}>
        <div>Delete Student Button</div>
      </StudentDeleteGuard>
    )

    expect(screen.getByText('No Delete Access')).toBeInTheDocument()
    expect(screen.queryByText('Delete Student Button')).not.toBeInTheDocument()
  })
})