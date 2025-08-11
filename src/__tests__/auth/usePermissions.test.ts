import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { 
  usePermissions, 
  useStudentPermissions,
  useNavigationPermissions,
  useFormPermissions,
  useBulkOperationPermissions
} from '@/hooks/usePermissions'

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('usePermissions', () => {
  let mockAuth: any

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = {
      user: null,
      hasPermission: vi.fn(),
      isOwner: vi.fn(),
      isAdmin: vi.fn(),
      isInstructor: vi.fn()
    }
    useAuth.mockReturnValue(mockAuth)
    vi.clearAllMocks()
  })

  test('should return permission checking functions', () => {
    const { result } = renderHook(() => usePermissions())

    expect(typeof result.current.canRead).toBe('function')
    expect(typeof result.current.canWrite).toBe('function')
    expect(typeof result.current.canDelete).toBe('function')
    expect(typeof result.current.canAdmin).toBe('function')
    expect(typeof result.current.hasPermission).toBe('function')
  })

  test('should return role checking properties', () => {
    mockAuth.user = { role: 'admin' }
    mockAuth.isOwner.mockReturnValue(false)
    mockAuth.isAdmin.mockReturnValue(true)
    mockAuth.isInstructor.mockReturnValue(true)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.isOwner).toBe(false)
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isInstructor).toBe(true)
    expect(result.current.isStaff).toBe(false)
    expect(result.current.isViewer).toBe(false)
    expect(result.current.role).toBe('admin')
    expect(result.current.roleLevel).toBe(2)
  })

  test('should return correct role level for different roles', () => {
    const roles = [
      { role: 'owner', expectedLevel: 1 },
      { role: 'admin', expectedLevel: 2 },
      { role: 'instructor', expectedLevel: 3 },
      { role: 'staff', expectedLevel: 4 },
      { role: 'viewer', expectedLevel: 5 },
      { role: undefined, expectedLevel: 5 }
    ]

    roles.forEach(({ role, expectedLevel }) => {
      mockAuth.user = { role }
      const { result } = renderHook(() => usePermissions())
      expect(result.current.roleLevel).toBe(expectedLevel)
    })
  })

  test('should return resource permissions', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      const permissions: Record<string, string[]> = {
        students: ['read', 'write'],
        classes: ['read'],
        videos: ['read', 'write', 'delete']
      }
      return permissions[resource]?.includes(action) || false
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.resources.students.canRead).toBe(true)
    expect(result.current.resources.students.canWrite).toBe(true)
    expect(result.current.resources.students.canDelete).toBe(false)
    
    expect(result.current.resources.classes.canRead).toBe(true)
    expect(result.current.resources.classes.canWrite).toBe(false)
    
    expect(result.current.resources.videos.canRead).toBe(true)
    expect(result.current.resources.videos.canWrite).toBe(true)
    expect(result.current.resources.videos.canDelete).toBe(true)
  })

  test('canRead function should work correctly', () => {
    mockAuth.hasPermission.mockReturnValue(true)

    const { result } = renderHook(() => usePermissions())
    const canRead = result.current.canRead('students')

    expect(canRead).toBe(true)
    expect(mockAuth.hasPermission).toHaveBeenCalledWith('students', 'read')
  })

  test('canWrite function should work correctly', () => {
    mockAuth.hasPermission.mockReturnValue(false)

    const { result } = renderHook(() => usePermissions())
    const canWrite = result.current.canWrite('classes')

    expect(canWrite).toBe(false)
    expect(mockAuth.hasPermission).toHaveBeenCalledWith('classes', 'write')
  })
})

describe('useStudentPermissions', () => {
  let mockAuth: any

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = {
      hasPermission: vi.fn()
    }
    useAuth.mockReturnValue(mockAuth)
  })

  test('should return student-specific permissions', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      return resource === 'students' && ['read', 'write'].includes(action)
    })

    const { result } = renderHook(() => useStudentPermissions())

    expect(result.current.canRead).toBe(true)
    expect(result.current.canWrite).toBe(true)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canAdmin).toBe(false)
  })
})

describe('useNavigationPermissions', () => {
  let mockAuth: any

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = {
      hasPermission: vi.fn(),
      isOwner: vi.fn(),
      isAdmin: vi.fn(),
      isInstructor: vi.fn()
    }
    useAuth.mockReturnValue(mockAuth)
  })

  test('should return navigation permissions for admin user', () => {
    mockAuth.hasPermission.mockReturnValue(true)
    mockAuth.isAdmin.mockReturnValue(true)
    mockAuth.isInstructor.mockReturnValue(true)
    mockAuth.isOwner.mockReturnValue(false)

    const { result } = renderHook(() => useNavigationPermissions())

    expect(result.current.canAccessDashboard).toBe(true)
    expect(result.current.canAccessStudents).toBe(true)
    expect(result.current.canAccessClasses).toBe(true)
    expect(result.current.canAccessVideos).toBe(true)
    expect(result.current.canAccessPayments).toBe(true)
    expect(result.current.canAccessReports).toBe(true)
    expect(result.current.canAccessSettings).toBe(true) // Admin should have settings access
    expect(result.current.canAccessUserManagement).toBe(true)
    expect(result.current.canAccessAnalytics).toBe(true) // Instructor has analytics access
    expect(result.current.canAccessSystemSettings).toBe(false) // Only owner
  })

  test('should return limited permissions for viewer user', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      return action === 'read' // Viewer can only read
    })
    mockAuth.isAdmin.mockReturnValue(false)
    mockAuth.isInstructor.mockReturnValue(false)
    mockAuth.isOwner.mockReturnValue(false)

    const { result } = renderHook(() => useNavigationPermissions())

    expect(result.current.canAccessDashboard).toBe(true) // Always true
    expect(result.current.canAccessStudents).toBe(true)
    expect(result.current.canAccessClasses).toBe(true)
    expect(result.current.canAccessVideos).toBe(true)
    expect(result.current.canAccessPayments).toBe(true)
    expect(result.current.canAccessReports).toBe(true)
    expect(result.current.canAccessSettings).toBe(false) // No admin rights
    expect(result.current.canAccessUserManagement).toBe(false) // No admin rights
    expect(result.current.canAccessAnalytics).toBe(false) // No instructor rights
    expect(result.current.canAccessSystemSettings).toBe(false)
  })
})

describe('useFormPermissions', () => {
  let mockAuth: any

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = {
      hasPermission: vi.fn(),
      isAdmin: vi.fn(),
      isInstructor: vi.fn()
    }
    useAuth.mockReturnValue(mockAuth)
  })

  test('should return form permissions for admin user', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      const adminPermissions: Record<string, string[]> = {
        students: ['read', 'write', 'delete'],
        classes: ['read', 'write', 'delete'],
        videos: ['read', 'write', 'delete'],
        payments: ['read', 'write', 'delete']
      }
      return adminPermissions[resource]?.includes(action) || false
    })
    mockAuth.isAdmin.mockReturnValue(true)
    mockAuth.isInstructor.mockReturnValue(true)

    const { result } = renderHook(() => useFormPermissions())

    expect(result.current.students.canCreate).toBe(true)
    expect(result.current.students.canEdit).toBe(true)
    expect(result.current.students.canDelete).toBe(true)
    expect(result.current.students.canBulkImport).toBe(true) // Admin can bulk import
    expect(result.current.students.canExport).toBe(true)

    expect(result.current.classes.canCreate).toBe(true)
    expect(result.current.classes.canEdit).toBe(true)
    expect(result.current.classes.canDelete).toBe(true)

    expect(result.current.videos.canUpload).toBe(true)
    expect(result.current.videos.canAssign).toBe(true) // Admin + Instructor
  })

  test('should return limited permissions for instructor', () => {
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      const instructorPermissions: Record<string, string[]> = {
        students: ['read', 'write'],
        classes: ['read', 'write'],
        videos: ['read', 'write'],
        payments: ['read']
      }
      return instructorPermissions[resource]?.includes(action) || false
    })
    mockAuth.isAdmin.mockReturnValue(false)
    mockAuth.isInstructor.mockReturnValue(true)

    const { result } = renderHook(() => useFormPermissions())

    expect(result.current.students.canCreate).toBe(true)
    expect(result.current.students.canEdit).toBe(true)
    expect(result.current.students.canDelete).toBe(false)
    expect(result.current.students.canBulkImport).toBe(false) // Not admin
    
    expect(result.current.payments.canCreate).toBe(false)
    expect(result.current.payments.canRefund).toBe(false) // Not admin
    expect(result.current.payments.canViewReports).toBe(true)
  })
})

describe('useBulkOperationPermissions', () => {
  let mockAuth: any

  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext')
    mockAuth = {
      isAdmin: vi.fn(),
      isInstructor: vi.fn(),
      hasPermission: vi.fn()
    }
    useAuth.mockReturnValue(mockAuth)
  })

  test('should return bulk operation permissions for admin', () => {
    mockAuth.isAdmin.mockReturnValue(true)
    mockAuth.isInstructor.mockReturnValue(true)
    mockAuth.hasPermission.mockReturnValue(true) // Admin has all permissions

    const { result } = renderHook(() => useBulkOperationPermissions())

    expect(result.current.canBulkDeleteStudents).toBe(true)
    expect(result.current.canBulkUpdateStudents).toBe(true)
    expect(result.current.canBulkEnrollStudents).toBe(true)
    expect(result.current.canBulkAssignVideos).toBe(true)
    expect(result.current.canBulkProcessPayments).toBe(true)
    expect(result.current.canExportData).toBe(true)
    expect(result.current.canImportData).toBe(true)
  })

  test('should return limited bulk permissions for instructor', () => {
    mockAuth.isAdmin.mockReturnValue(false)
    mockAuth.isInstructor.mockReturnValue(true)
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      const instructorPermissions: Record<string, string[]> = {
        students: ['read', 'write'],
        classes: ['read', 'write'],
        videos: ['read', 'write']
      }
      return instructorPermissions[resource]?.includes(action) || false
    })

    const { result } = renderHook(() => useBulkOperationPermissions())

    expect(result.current.canBulkDeleteStudents).toBe(false) // No delete permission
    expect(result.current.canBulkUpdateStudents).toBe(true)
    expect(result.current.canBulkEnrollStudents).toBe(true)
    expect(result.current.canBulkAssignVideos).toBe(true) // Instructor can assign
    expect(result.current.canBulkProcessPayments).toBe(false) // Not admin
    expect(result.current.canExportData).toBe(false) // Not admin
    expect(result.current.canImportData).toBe(false) // Not admin
  })

  test('should return no bulk permissions for viewer', () => {
    mockAuth.isAdmin.mockReturnValue(false)
    mockAuth.isInstructor.mockReturnValue(false)
    mockAuth.hasPermission.mockImplementation((resource: string, action: string) => {
      return action === 'read' // Viewer can only read
    })

    const { result } = renderHook(() => useBulkOperationPermissions())

    expect(result.current.canBulkDeleteStudents).toBe(false)
    expect(result.current.canBulkUpdateStudents).toBe(false)
    expect(result.current.canBulkEnrollStudents).toBe(false)
    expect(result.current.canBulkAssignVideos).toBe(false)
    expect(result.current.canBulkProcessPayments).toBe(false)
    expect(result.current.canExportData).toBe(false)
    expect(result.current.canImportData).toBe(false)
  })
})