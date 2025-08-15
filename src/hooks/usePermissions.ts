/**
 * 권한 관련 커스텀 훅 (통합 버전)
 * @description RBAC 권한 시스템을 React 컴포넌트에서 쉽게 사용하기 위한 훅
 * @version v4.1 - 기존 인터페이스 유지하면서 새로운 RBAC 시스템 통합
 * @since 2025-08-14
 */

'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { useMemo, useCallback, useEffect, useState } from 'react'
import type { 
  UserRole,
  UserProfile 
} from '@/types/auth.types'
import type { 
  Resource, 
  Action, 
  Permission,
  PermissionString,
  PermissionContext,
  PermissionCheckDetails
} from '@/types/permissions.types'
import { 
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  canPerformAction as canPerform,
  getUserPermissions,
  getUserPermissionStrings,
  checkPermissionDetails,
  invalidatePermissionCache
} from '@/lib/permissions/rbac'
import { 
  checkResourceAccess,
  filterAccessibleResources,
  isInstructorStudent,
  isInstructorClass,
  isResourceOwner
} from '@/lib/permissions/resourceAccess'

// ================================================================
// 기존 인터페이스 유지 (하위 호환성)
// ================================================================

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
  attendance: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    canAdmin: boolean
  }
  analytics: {
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

// ================================================================
// 메인 usePermissions 훅 (기존 인터페이스 유지 + 확장)
// ================================================================

export function usePermissions() {
  const { user, profile } = useAuthStore()
  
  // 기존 인터페이스와 호환을 위한 computed values
  const isOwner = profile?.role === 'admin' && profile?.status === 'active'
  const isAdmin = profile?.role === 'admin' || profile?.role === 'system_admin'
  const isInstructor = profile?.role === 'instructor'
  
  // Legacy hasPermission 함수 (호환성)
  const legacyHasPermission = useCallback((resource: string, action: string) => {
    if (!profile) return false
    // 간단한 권한 체크 로직
    const role = profile.role
    if (role === 'system_admin' || role === 'admin') return true
    if (role === 'instructor' && (resource === 'classes' || resource === 'students')) return true
    if (role === 'staff' && resource === 'students') return true
    return false
  }, [profile])
  
  // 새로운 RBAC 시스템의 권한 체크 함수
  const hasNewPermission = useCallback((
    resource: string,
    action: string
  ): boolean => {
    if (!profile) return false
    
    // 리소스와 액션을 새로운 타입으로 매핑
    const resourceMap: Record<string, Resource> = {
      'students': 'student',
      'classes': 'class',
      'videos': 'document', // videos를 document로 매핑
      'payments': 'payment',
      'reports': 'analytics',
      'settings': 'system',
      'users': 'user'
    }
    
    const actionMap: Record<string, Action> = {
      'read': 'read',
      'write': 'update',
      'delete': 'delete',
      'admin': 'manage',
      'create': 'create'
    }
    
    const mappedResource = resourceMap[resource] || resource as Resource
    const mappedAction = actionMap[action] || action as Action
    
    if (!profile?.id) return false
    return canPerform(profile, mappedResource, mappedAction, {
      userId: profile.id,
      tenantId: profile.tenant_id || ''
    })
  }, [profile])
  
  // 기존 인터페이스와의 호환성을 위한 래퍼
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    // 먼저 새로운 RBAC 시스템으로 체크
    const newPermissionResult = hasNewPermission(resource, action)
    if (newPermissionResult) return true
    
    // 폴백으로 기존 시스템 체크
    return legacyHasPermission(resource, action)
  }, [hasNewPermission, legacyHasPermission])
  
  // PermissionCheck 인터페이스 구현
  const permissionCheck: PermissionCheck = useMemo(() => ({
    canRead: (resource: string) => hasPermission(resource, 'read'),
    canWrite: (resource: string) => hasPermission(resource, 'write'),
    canDelete: (resource: string) => hasPermission(resource, 'delete'),
    canAdmin: (resource: string) => hasPermission(resource, 'admin'),
    hasPermission
  }), [hasPermission])
  
  // RoleCheck 인터페이스 구현
  const roleCheck: RoleCheck = useMemo(() => {
    const role = profile?.role || undefined // null을 undefined로 변환
    return {
      isOwner: isOwner || role === 'system_admin',
      isAdmin: isAdmin || role === 'admin' || role === 'system_admin',
      isInstructor: isInstructor || role === 'instructor',
      isStaff: role === 'staff',
      isViewer: role === 'viewer',
      role,
      roleLevel: getRoleLevel(role)
    }
  }, [profile?.role, isOwner, isAdmin, isInstructor])
  
  // ResourcePermissions 인터페이스 구현
  const resourcePermissions: ResourcePermissions = useMemo(() => ({
    students: {
      canRead: hasPermission('students', 'read'),
      canWrite: hasPermission('students', 'write') || hasPermission('students', 'create'),
      canDelete: hasPermission('students', 'delete'),
      canAdmin: hasPermission('students', 'admin')
    },
    classes: {
      canRead: hasPermission('classes', 'read'),
      canWrite: hasPermission('classes', 'write') || hasPermission('classes', 'create'),
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
      canWrite: hasPermission('payments', 'write') || hasPermission('payments', 'create'),
      canDelete: hasPermission('payments', 'delete'),
      canAdmin: hasPermission('payments', 'admin')
    },
    attendance: {
      canRead: hasPermission('attendance', 'read'),
      canWrite: hasPermission('attendance', 'write') || hasPermission('attendance', 'create'),
      canDelete: hasPermission('attendance', 'delete'),
      canAdmin: hasPermission('attendance', 'admin')
    },
    analytics: {
      canRead: hasPermission('analytics', 'read'),
      canWrite: hasPermission('analytics', 'write') || hasPermission('analytics', 'create'),
      canDelete: hasPermission('analytics', 'delete'),
      canAdmin: hasPermission('analytics', 'admin')
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
  
  // 새로운 RBAC 시스템의 추가 기능들
  const permissions = useMemo(() => {
    if (!user) return []
    return getUserPermissions(user as unknown as UserProfile)
  }, [user])
  
  const permissionStrings = useMemo(() => {
    if (!user) return []
    return getUserPermissionStrings(user as unknown as UserProfile)
  }, [user]) as PermissionString[]
  
  // 권한 새로고침
  const refreshPermissions = useCallback(() => {
    if (user?.id) {
      invalidatePermissionCache(user.id)
    }
  }, [user])
  
  return {
    ...permissionCheck,
    ...roleCheck,
    resources: resourcePermissions,
    user,
    // 새로운 RBAC 시스템 추가 기능
    permissions,
    permissionStrings,
    refreshPermissions
  }
}

function getRoleLevel(role?: string): number {
  switch (role) {
    case 'system_admin': return 0
    case 'owner': return 1
    case 'admin': return 2
    case 'instructor': return 3
    case 'staff': return 4
    case 'viewer': return 5
    default: return 5
  }
}

// ================================================================
// 기존 특화 훅들 (하위 호환성 유지)
// ================================================================

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
  const { resources, isAdmin, isInstructor, isOwner } = usePermissions()
  
  return useMemo(() => ({
    canAccessDashboard: true, // All authenticated users
    canAccessStudents: resources.students.canRead,
    canAccessClasses: resources.classes.canRead,
    canAccessVideos: resources.videos.canRead,
    canAccessPayments: resources.payments.canRead,
    canAccessReports: resources.reports.canRead,
    canAccessSettings: resources.settings.canRead || isAdmin,
    canAccessUserManagement: resources.users.canRead || isAdmin,
    canAccessAnalytics: resources.reports.canRead || isInstructor,
    canAccessSystemSettings: isOwner
  }), [resources, isAdmin, isInstructor, isOwner])
}

// Form action permissions hook
export function useFormPermissions() {
  const { resources, isAdmin, isInstructor, isOwner } = usePermissions()
  
  return useMemo(() => ({
    students: {
      canCreate: resources.students.canWrite,
      canEdit: resources.students.canWrite,
      canDelete: resources.students.canDelete,
      canBulkImport: resources.students.canWrite && isAdmin,
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
      canAssign: resources.videos.canWrite && isInstructor,
      canViewAnalytics: resources.videos.canRead && isInstructor
    },
    payments: {
      canCreate: resources.payments.canWrite,
      canEdit: resources.payments.canWrite,
      canDelete: resources.payments.canDelete,
      canRefund: resources.payments.canWrite && isAdmin,
      canViewReports: resources.payments.canRead
    }
  }), [resources, isAdmin, isInstructor])
}

// Bulk operation permissions
export function useBulkOperationPermissions() {
  const { isAdmin, isInstructor, resources } = usePermissions()
  
  return useMemo(() => ({
    canBulkDeleteStudents: resources.students.canDelete && isAdmin,
    canBulkUpdateStudents: resources.students.canWrite,
    canBulkEnrollStudents: resources.classes.canWrite,
    canBulkAssignVideos: resources.videos.canWrite && isInstructor,
    canBulkProcessPayments: resources.payments.canWrite && isAdmin,
    canExportData: isAdmin,
    canImportData: isAdmin
  }), [isAdmin, isInstructor, resources])
}

// ================================================================
// 새로운 RBAC 시스템 전용 훅들
// ================================================================

/**
 * 특정 리소스에 대한 권한 체크 훅
 */
export function useResourcePermissions(
  resource: Resource,
  resourceId?: string
) {
  const { user, profile } = useAuthStore()
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    isOwner: false,
    loading: true
  })
  
  useEffect(() => {
    if (!user) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        isOwner: false,
        loading: false
      })
      return
    }
    
    const checkPermissions = async () => {
      const [read, update, del] = await Promise.all([
        checkResourceAccess(user as unknown as UserProfile, resource, 'read', resourceId),
        checkResourceAccess(user as unknown as UserProfile, resource, 'update', resourceId),
        checkResourceAccess(user as unknown as UserProfile, resource, 'delete', resourceId)
      ])
      
      const create = canPerform(user as unknown as UserProfile, resource, 'create')
      const owner = resourceId ? await isResourceOwner(user.id, resource, resourceId) : false
      
      setPermissions({
        canRead: read.granted,
        canCreate: create,
        canUpdate: update.granted,
        canDelete: del.granted,
        isOwner: owner,
        loading: false
      })
    }
    
    checkPermissions()
  }, [user, resource, resourceId])
  
  return permissions
}

/**
 * 강사의 담당 학생/클래스 확인 훅
 */
export function useInstructorResources() {
  const { user, profile } = useAuthStore()
  
  const checkIfMyStudent = useCallback(async (studentId: string): Promise<boolean> => {
    if (!user || user?.role !== 'instructor') return false
    return isInstructorStudent(user.id, studentId)
  }, [user])
  
  const checkIfMyClass = useCallback(async (classId: string): Promise<boolean> => {
    if (!user || user?.role !== 'instructor') return false
    return isInstructorClass(user.id, classId)
  }, [user])
  
  return {
    checkIfMyStudent,
    checkIfMyClass
  }
}

/**
 * 접근 가능한 리소스 필터링 훅
 */
export function useFilteredResources<T extends { id: string }>(
  resource: Resource,
  items: T[],
  action: Action = 'read'
) {
  const { user, profile } = useAuthStore()
  const [filteredItems, setFilteredItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user) {
      setFilteredItems([])
      setLoading(false)
      return
    }
    
    const filterItems = async () => {
      setLoading(true)
      const accessible = await filterAccessibleResources(
        user as unknown as UserProfile,
        resource,
        action,
        items
      )
      setFilteredItems(accessible)
      setLoading(false)
    }
    
    filterItems()
  }, [user, resource, action, items])
  
  return { items: filteredItems, loading }
}

/**
 * 권한 기반 조건부 렌더링 훅
 */
export function useConditionalRender(
  permission: PermissionString | Permission,
  context?: PermissionContext
) {
  const { user, profile } = useAuthStore()
  
  const shouldRender = useMemo(() => {
    if (!profile) return false
    
    const ctx = context || {
      userId: profile?.id || '',
      tenantId: profile.tenant_id || undefined
    }
    
    return checkPermission(profile, permission, ctx)
  }, [profile, permission, context])
  
  return shouldRender
}

/**
 * 역할 기반 네비게이션 아이템 필터링 훅
 */
export function useNavigationItems<T extends { requiredRoles?: UserRole[] }>(
  items: T[]
): T[] {
  const { role } = usePermissions()
  
  return useMemo(() => {
    if (!role) return []
    
    return items.filter(item => {
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true
      }
      return item.requiredRoles.includes(role as UserRole)
    })
  }, [items, role])
}