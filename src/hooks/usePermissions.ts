'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useMemo } from 'react'

export interface PermissionCheck {
  canRead: (resource: string) => boolean
  canWrite: (resource: string) => boolean
  canDelete: (resource: string) => boolean
  canAdmin: (resource: string) => boolean
  hasPermission: (resource: string, action: string) => boolean
}

export interface RoleCheck {
  isOwner: boolean
  isAdmin: boolean
  isInstructor: boolean
  isStaff: boolean
  isViewer: boolean
  role: string | undefined
  roleLevel: number
}

export interface ResourcePermissions {
  students: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  classes: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  videos: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  payments: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  reports: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  settings: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  users: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
}

export function usePermissions() {
  const { user, hasPermission, isOwner, isAdmin, isInstructor } = useAuth()
  
  const permissionCheck: PermissionCheck = useMemo(() => ({
    canRead: (resource: string) => hasPermission(resource, 'read'),
    canWrite: (resource: string) => hasPermission(resource, 'write'),
    canDelete: (resource: string) => hasPermission(resource, 'delete'),
    canAdmin: (resource: string) => hasPermission(resource, 'admin'),
    hasPermission
  }), [hasPermission])
  
  const roleCheck: RoleCheck = useMemo(() => {
    const role = user?.role
    return {
      isOwner: isOwner(),
      isAdmin: isAdmin(),
      isInstructor: isInstructor(),
      isStaff: role === 'staff',
      isViewer: role === 'viewer',
      role,
      roleLevel: getRoleLevel(role)
    }
  }, [user?.role, isOwner, isAdmin, isInstructor])
  
  const resourcePermissions: ResourcePermissions = useMemo(() => ({
    students: {
      canRead: hasPermission('students', 'read'),
      canWrite: hasPermission('students', 'write'),
      canDelete: hasPermission('students', 'delete'),
      canAdmin: hasPermission('students', 'admin')
    },
    classes: {
      canRead: hasPermission('classes', 'read'),
      canWrite: hasPermission('classes', 'write'),
      canDelete: hasPermission('classes', 'delete'),
      canAdmin: hasPermission('classes', 'admin')
    },
    videos: {
      canRead: hasPermission('videos', 'read'),
      canWrite: hasPermission('videos', 'write'),
      canDelete: hasPermission('videos', 'delete'),
      canAdmin: hasPermission('videos', 'admin')
    },
    payments: {
      canRead: hasPermission('payments', 'read'),
      canWrite: hasPermission('payments', 'write'),
      canDelete: hasPermission('payments', 'delete'),
      canAdmin: hasPermission('payments', 'admin')
    },
    reports: {
      canRead: hasPermission('reports', 'read'),
      canWrite: hasPermission('reports', 'write'),
      canDelete: hasPermission('reports', 'delete'),
      canAdmin: hasPermission('reports', 'admin')
    },
    settings: {
      canRead: hasPermission('settings', 'read'),
      canWrite: hasPermission('settings', 'write'),
      canDelete: hasPermission('settings', 'delete'),
      canAdmin: hasPermission('settings', 'admin')
    },
    users: {
      canRead: hasPermission('users', 'read'),
      canWrite: hasPermission('users', 'write'),
      canDelete: hasPermission('users', 'delete'),
      canAdmin: hasPermission('users', 'admin')
    }
  }), [hasPermission])
  
  return {
    ...permissionCheck,
    ...roleCheck,
    resources: resourcePermissions,
    user
  }
}

function getRoleLevel(role?: string): number {
  switch (role) {
    case 'owner': return 1
    case 'admin': return 2
    case 'instructor': return 3
    case 'staff': return 4
    case 'viewer': return 5
    default: return 5
  }
}

// Specialized hooks for common permission patterns
export function useStudentPermissions() {
  const { resources } = usePermissions()
  return resources.students
}

export function useClassPermissions() {
  const { resources } = usePermissions()
  return resources.classes
}

export function useVideoPermissions() {
  const { resources } = usePermissions()
  return resources.videos
}

export function usePaymentPermissions() {
  const { resources } = usePermissions()
  return resources.payments
}

export function useUserManagementPermissions() {
  const { resources } = usePermissions()
  return resources.users
}

export function useSettingsPermissions() {
  const { resources } = usePermissions()
  return resources.settings
}

// Navigation permissions hook
export function useNavigationPermissions() {
  const { resources, roleCheck } = usePermissions()
  
  return useMemo(() => ({
    canAccessDashboard: true, // All authenticated users
    canAccessStudents: resources.students.canRead,
    canAccessClasses: resources.classes.canRead,
    canAccessVideos: resources.videos.canRead,
    canAccessPayments: resources.payments.canRead,
    canAccessReports: resources.reports.canRead,
    canAccessSettings: resources.settings.canRead || roleCheck.isAdmin,
    canAccessUserManagement: resources.users.canRead || roleCheck.isAdmin,
    canAccessAnalytics: resources.reports.canRead || roleCheck.isInstructor,
    canAccessSystemSettings: roleCheck.isOwner
  }), [resources, roleCheck])
}

// Form action permissions hook
export function useFormPermissions() {
  const { resources, roleCheck } = usePermissions()
  
  return useMemo(() => ({
    students: {
      canCreate: resources.students.canWrite,
      canEdit: resources.students.canWrite,
      canDelete: resources.students.canDelete,
      canBulkImport: resources.students.canWrite && roleCheck.isAdmin,
      canExport: resources.students.canRead
    },
    classes: {
      canCreate: resources.classes.canWrite,
      canEdit: resources.classes.canWrite,
      canDelete: resources.classes.canDelete,
      canManageEnrollments: resources.classes.canWrite,
      canViewAnalytics: resources.classes.canRead
    },
    videos: {
      canUpload: resources.videos.canWrite,
      canEdit: resources.videos.canWrite,
      canDelete: resources.videos.canDelete,
      canAssign: resources.videos.canWrite && roleCheck.isInstructor,
      canViewAnalytics: resources.videos.canRead && roleCheck.isInstructor
    },
    payments: {
      canCreate: resources.payments.canWrite,
      canEdit: resources.payments.canWrite,
      canDelete: resources.payments.canDelete,
      canRefund: resources.payments.canWrite && roleCheck.isAdmin,
      canViewReports: resources.payments.canRead
    }
  }), [resources, roleCheck])
}

// Bulk operation permissions
export function useBulkOperationPermissions() {
  const { roleCheck, resources } = usePermissions()
  
  return useMemo(() => ({
    canBulkDeleteStudents: resources.students.canDelete && roleCheck.isAdmin,
    canBulkUpdateStudents: resources.students.canWrite,
    canBulkEnrollStudents: resources.classes.canWrite,
    canBulkAssignVideos: resources.videos.canWrite && roleCheck.isInstructor,
    canBulkProcessPayments: resources.payments.canWrite && roleCheck.isAdmin,
    canExportData: roleCheck.isAdmin,
    canImportData: roleCheck.isAdmin
  }), [roleCheck, resources])
}