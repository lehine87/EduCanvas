/**
 * 개발 전용 디버그 인터페이스
 * @description Production 빌드에서 완전히 제외되는 개발 도구들
 * @version v1.0
 * @since 2025-08-14
 */

// ⚠️ 이 파일은 개발 환경에서만 로드됩니다
if (process.env.NODE_ENV !== 'development') {
  throw new Error('Debug interface는 개발 환경에서만 사용 가능합니다.')
}

import type { RBACDebugInterface, ResourceAccessDebugInterface, TenantRolesDebugInterface } from '@/types/utilityTypes'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canPerformAction,
  checkPermissionDetails,
  getUserPermissions,
  getUserPermissionStrings,
  invalidatePermissionCache,
  getPermissionCacheStats
} from '@/lib/permissions/rbac'
import {
  ROLE_PERMISSIONS,
  ROLE_PERMISSION_STRINGS
} from '@/types/permissions.types'
import {
  checkResourceAccess,
  checkBulkResourceAccess,
  filterAccessibleResources,
  canCreateResource,
  isInstructorStudent,
  isInstructorClass,
  isResourceOwner,
  checkStudentOwnership,
  checkClassOwnership,
  checkPaymentOwnership,
  checkAttendanceOwnership,
  resourceAccessCache
} from '@/lib/permissions/resourceAccess'
import {
  tenantRoleManager,
  hasTenantPermission,
  getUserTenantRole,
  checkTenantMembershipStatus,
  createTenantRole,
  updateTenantRole,
  assignTenantRole
} from '@/lib/permissions/tenantRoles'

/**
 * 개발 환경에서만 전역 디버그 도구 등록
 */
export function registerDebugInterfaces(): void {
  if (typeof window === 'undefined') return

  // RBAC Debug Interface
  const windowWithRBAC = window as Window & { __RBAC__?: RBACDebugInterface }
  windowWithRBAC.__RBAC__ = {
    hasPermission: hasPermission as any,
    hasAnyPermission: hasAnyPermission as any, 
    hasAllPermissions: hasAllPermissions as any,
    canPerformAction: canPerformAction as any,
    checkPermissionDetails: checkPermissionDetails as any,
    getUserPermissions: getUserPermissions,
    getUserPermissionStrings: getUserPermissionStrings,
    invalidateCache: invalidatePermissionCache,
    getCacheStats: getPermissionCacheStats,
    ROLE_PERMISSIONS: ROLE_PERMISSIONS,
    ROLE_PERMISSION_STRINGS: ROLE_PERMISSION_STRINGS
  }

  // Resource Access Debug Interface
  const windowWithResourceAccess = window as Window & { __RESOURCE_ACCESS__?: ResourceAccessDebugInterface }
  windowWithResourceAccess.__RESOURCE_ACCESS__ = {
    checkResourceAccess: checkResourceAccess as any,
    checkBulkResourceAccess: checkBulkResourceAccess as any,
    filterAccessibleResources: filterAccessibleResources as any,
    canCreateResource: canCreateResource as any,
    isInstructorStudent,
    isInstructorClass,
    isResourceOwner: isResourceOwner as any,
    checkStudentOwnership,
    checkClassOwnership,
    checkPaymentOwnership,
    checkAttendanceOwnership,
    cache: resourceAccessCache as any
  }

  // Tenant Roles Debug Interface
  const windowWithTenantRoles = window as Window & { __TENANT_ROLES__?: TenantRolesDebugInterface }
  windowWithTenantRoles.__TENANT_ROLES__ = {
    manager: tenantRoleManager,
    hasTenantPermission: hasTenantPermission as any,
    getUserTenantRole,
    checkTenantMembershipStatus,
    createTenantRole: createTenantRole as any,
    updateTenantRole: updateTenantRole as any,
    assignTenantRole
  }

  console.log('🔧 Debug interfaces registered:', {
    __RBAC__: '권한 시스템 디버깅',
    __RESOURCE_ACCESS__: '리소스 접근 제어 디버깅',
    __TENANT_ROLES__: '테넌트 역할 관리 디버깅'
  })
}