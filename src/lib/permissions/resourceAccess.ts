/**
 * 리소스 접근 제어 시스템
 * @description 리소스별 세밀한 접근 제어 및 소유권 기반 권한 관리
 * @version v4.1
 * @since 2025-08-14
 */

import type { Database } from '@/types/database'
import type { UserProfile, UserRole } from '@/types/auth.types'
import type { 
  Resource,
  Action,
  Permission,
  PermissionContext,
  PermissionCheckDetails
} from '@/types/permissions.types'
import { 
  hasPermission,
  canPerformAction,
  checkPermissionDetails 
} from './rbac'
import { hasTenantPermission } from './tenantRoles'
import { createClient } from '@/lib/db/supabase/client'
import { isInstructor, hasTenantId } from '@/types/auth.types'
import type { AttendanceWithRelations, ResourceAccessDebugInterface } from '@/types/utilityTypes'
import { isAttendanceWithRelations } from '@/types/typeGuards'

// ================================================================
// 리소스 소유권 타입
// ================================================================

/**
 * 리소스 소유권 정보
 */
export interface ResourceOwnership {
  resourceType: Resource
  resourceId: string
  ownerId: string
  ownerType: 'user' | 'tenant' | 'system'
  metadata?: Record<string, unknown>
}

/**
 * 리소스 접근 결과
 */
export interface ResourceAccessResult {
  granted: boolean
  reason?: string
  ownership?: ResourceOwnership
  requiredPermissions?: Permission[]
  actualPermissions?: Permission[]
}

// ================================================================
// 리소스별 소유권 확인 함수
// ================================================================

/**
 * 학생 리소스 소유권 확인
 */
export async function checkStudentOwnership(
  userId: string,
  studentId: string,
  userRole?: UserRole
): Promise<ResourceOwnership | null> {
  const supabase = createClient()

  try {
    // 학생 정보 조회
    const { data: student, error } = await supabase
      .from('students')
      .select('id, tenant_id')
      .eq('id', studentId)
      .single()

    if (error || !student) return null

    // 강사인 경우 담당 학생인지 확인
    if (userRole === 'instructor') {
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          classes!inner(
            instructor_id
          )
        `)
        .eq('student_id', studentId)
        .eq('classes.instructor_id', userId)
        .limit(1)

      if (enrollment && enrollment.length > 0) {
        return {
          resourceType: 'student',
          resourceId: studentId,
          ownerId: userId,
          ownerType: 'user',
          metadata: { relationship: 'instructor' }
        }
      }
    }

    // 테넌트 소속 확인
    return {
      resourceType: 'student',
      resourceId: studentId,
      ownerId: student.tenant_id || '',
      ownerType: 'tenant'
    }
  } catch (error) {
    console.error('Error checking student ownership:', error)
    return null
  }
}

/**
 * 클래스 리소스 소유권 확인
 */
export async function checkClassOwnership(
  userId: string,
  classId: string,
  userRole?: UserRole
): Promise<ResourceOwnership | null> {
  const supabase = createClient()

  try {
    const { data: classData, error } = await supabase
      .from('classes')
      .select('id, tenant_id, instructor_id')
      .eq('id', classId)
      .single()

    if (error || !classData) return null

    // 강사인 경우 담당 클래스인지 확인
    if (userRole === 'instructor' && classData.instructor_id === userId) {
      return {
        resourceType: 'class',
        resourceId: classId,
        ownerId: userId,
        ownerType: 'user',
        metadata: { relationship: 'instructor' }
      }
    }

    // 테넌트 소속 확인
    return {
      resourceType: 'class',
      resourceId: classId,
      ownerId: classData.tenant_id || '',
      ownerType: 'tenant'
    }
  } catch (error) {
    console.error('Error checking class ownership:', error)
    return null
  }
}

/**
 * 결제 리소스 소유권 확인
 */
export async function checkPaymentOwnership(
  userId: string,
  paymentId: string,
  userRole?: UserRole
): Promise<ResourceOwnership | null> {
  const supabase = createClient()

  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id, tenant_id, student_id')
      .eq('id', paymentId)
      .single()

    if (error || !payment) return null

    // 테넌트 소속 확인
    return {
      resourceType: 'payment',
      resourceId: paymentId,
      ownerId: payment.tenant_id || '',
      ownerType: 'tenant',
      metadata: { studentId: payment.student_id }
    }
  } catch (error) {
    console.error('Error checking payment ownership:', error)
    return null
  }
}

/**
 * 출결 리소스 소유권 확인
 */
export async function checkAttendanceOwnership(
  userId: string,
  attendanceId: string,
  userRole?: UserRole
): Promise<ResourceOwnership | null> {
  const supabase = createClient()

  try {
    const { data: attendance, error } = await supabase
      .from('attendances')
      .select(`
        id,
        tenant_id,
        class_schedules!inner(
          classes!inner(
            instructor_id
          )
        )
      `)
      .eq('id', attendanceId)
      .single()

    if (error || !attendance) return null

    // 강사인 경우 담당 클래스의 출결인지 확인
    if (userRole === 'instructor') {
      const classData = isAttendanceWithRelations(attendance) 
        ? attendance.class_schedules?.classes
        : null
      if (classData?.instructor_id === userId) {
        return {
          resourceType: 'attendance',
          resourceId: attendanceId,
          ownerId: userId,
          ownerType: 'user',
          metadata: { relationship: 'instructor' }
        }
      }
    }

    // 테넌트 소속 확인
    return {
      resourceType: 'attendance',
      resourceId: attendanceId,
      ownerId: attendance.tenant_id || '',
      ownerType: 'tenant'
    }
  } catch (error) {
    console.error('Error checking attendance ownership:', error)
    return null
  }
}

// ================================================================
// 통합 리소스 접근 제어
// ================================================================

/**
 * 리소스 접근 권한 확인 (소유권 포함)
 */
export async function checkResourceAccess(
  userProfile: UserProfile,
  resource: Resource,
  action: Action,
  resourceId?: string
): Promise<ResourceAccessResult> {
  // 1. 기본 권한 체크
  const basePermissionCheck = checkPermissionDetails(
    userProfile,
    { resource, action },
    { userId: userProfile.id, tenantId: userProfile.tenant_id || '' }
  )

  // 기본 권한이 있으면 허용
  if (basePermissionCheck.granted) {
    return {
      granted: true,
      actualPermissions: basePermissionCheck.matchedPermissions
    }
  }

  // 2. 리소스 ID가 있는 경우 소유권 기반 체크
  if (resourceId) {
    let ownership: ResourceOwnership | null = null

    // 리소스별 소유권 확인
    switch (resource) {
      case 'student':
        ownership = await checkStudentOwnership(
          userProfile.id,
          resourceId,
          userProfile.role as UserRole
        )
        break
      case 'class':
        ownership = await checkClassOwnership(
          userProfile.id,
          resourceId,
          userProfile.role as UserRole
        )
        break
      case 'payment':
        ownership = await checkPaymentOwnership(
          userProfile.id,
          resourceId,
          userProfile.role as UserRole
        )
        break
      case 'attendance':
        ownership = await checkAttendanceOwnership(
          userProfile.id,
          resourceId,
          userProfile.role as UserRole
        )
        break
    }

    if (ownership) {
      // 소유권 기반 권한 체크
      const ownershipPermissionCheck = checkPermissionDetails(
        userProfile,
        { resource, action, scope: 'own' },
        {
          userId: userProfile.id,
          tenantId: userProfile.tenant_id || '',
          resourceId,
          resourceOwnerId: ownership.ownerId
        }
      )

      if (ownershipPermissionCheck.granted) {
        return {
          granted: true,
          ownership,
          actualPermissions: ownershipPermissionCheck.matchedPermissions
        }
      }
    }
  }

  // 3. 테넌트 권한 체크
  if (hasTenantId(userProfile)) {
    const tenantPermission = await hasTenantPermission(
      userProfile,
      userProfile.tenant_id,
      { resource, action }
    )

    if (tenantPermission) {
      return {
        granted: true,
        reason: 'Granted by tenant role'
      }
    }
  }

  // 권한 없음
  return {
    granted: false,
    reason: basePermissionCheck.failureReason || 'No permission',
    requiredPermissions: [{ resource, action }]
  }
}

// ================================================================
// 벌크 리소스 접근 제어
// ================================================================

/**
 * 여러 리소스에 대한 접근 권한 일괄 확인
 */
export async function checkBulkResourceAccess(
  userProfile: UserProfile,
  resources: Array<{
    resource: Resource
    action: Action
    resourceId?: string
  }>
): Promise<Map<string, ResourceAccessResult>> {
  const results = new Map<string, ResourceAccessResult>()

  // 병렬 처리로 성능 최적화
  const checks = await Promise.all(
    resources.map(async ({ resource, action, resourceId }) => {
      const key = `${resource}:${action}:${resourceId || 'all'}`
      const result = await checkResourceAccess(
        userProfile,
        resource,
        action,
        resourceId
      )
      return { key, result }
    })
  )

  for (const { key, result } of checks) {
    results.set(key, result)
  }

  return results
}

// ================================================================
// 리소스 필터링
// ================================================================

/**
 * 접근 가능한 리소스만 필터링
 */
export async function filterAccessibleResources<T extends { id: string }>(
  userProfile: UserProfile,
  resource: Resource,
  action: Action,
  items: T[]
): Promise<T[]> {
  if (items.length === 0) return []

  // 시스템 관리자는 모든 리소스 접근 가능
  if (userProfile.role === 'system_admin') {
    return items
  }

  // 각 아이템에 대한 접근 권한 체크
  const accessChecks = await Promise.all(
    items.map(async (item) => {
      const result = await checkResourceAccess(
        userProfile,
        resource,
        action,
        item.id
      )
      return { item, canAccess: result.granted }
    })
  )

  // 접근 가능한 아이템만 반환
  return accessChecks
    .filter(({ canAccess }) => canAccess)
    .map(({ item }) => item)
}

// ================================================================
// 리소스 생성 권한
// ================================================================

/**
 * 리소스 생성 가능 여부 확인
 */
export async function canCreateResource(
  userProfile: UserProfile,
  resource: Resource,
  tenantId?: string
): Promise<boolean> {
  // 테넌트 ID가 제공된 경우 해당 테넌트에서의 권한 체크
  if (tenantId) {
    // 사용자가 해당 테넌트 소속인지 확인
    if (hasTenantId(userProfile) && userProfile.tenant_id !== tenantId) {
      return false
    }

    return hasTenantPermission(
      userProfile,
      tenantId,
      { resource, action: 'create' }
    )
  }

  // 기본 권한 체크
  return canPerformAction(
    userProfile,
    resource,
    'create',
    { userId: userProfile.id, tenantId: userProfile.tenant_id || '' }
  )
}

// ================================================================
// 특수 권한 체크
// ================================================================

/**
 * 강사의 담당 학생 확인
 */
export async function isInstructorStudent(
  instructorId: string,
  studentId: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select(`
        id,
        classes!inner(
          instructor_id
        )
      `)
      .eq('student_id', studentId)
      .eq('classes.instructor_id', instructorId)
      .limit(1)

    return !error && data && data.length > 0
  } catch (error) {
    console.error('Error checking instructor-student relationship:', error)
    return false
  }
}

/**
 * 강사의 담당 클래스 확인
 */
export async function isInstructorClass(
  instructorId: string,
  classId: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('instructor_id', instructorId)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Error checking instructor-class relationship:', error)
    return false
  }
}

/**
 * 데이터 소유자 확인
 */
export async function isResourceOwner(
  userId: string,
  resource: Resource,
  resourceId: string
): Promise<boolean> {
  let ownership: ResourceOwnership | null = null

  switch (resource) {
    case 'student':
      ownership = await checkStudentOwnership(userId, resourceId)
      break
    case 'class':
      ownership = await checkClassOwnership(userId, resourceId)
      break
    case 'payment':
      ownership = await checkPaymentOwnership(userId, resourceId)
      break
    case 'attendance':
      ownership = await checkAttendanceOwnership(userId, resourceId)
      break
    default:
      return false
  }

  return ownership?.ownerId === userId && ownership?.ownerType === 'user'
}

// ================================================================
// 캐시 및 성능 최적화
// ================================================================

/**
 * 리소스 접근 권한 캐시
 */
class ResourceAccessCache {
  private cache: Map<string, { result: boolean; timestamp: number }>
  private readonly ttl: number

  constructor(ttl = 300000) { // 5분 TTL
    this.cache = new Map()
    this.ttl = ttl
  }

  getCacheKey(
    userId: string,
    resource: Resource,
    action: Action,
    resourceId?: string
  ): string {
    return `${userId}:${resource}:${action}:${resourceId || 'all'}`
  }

  get(
    userId: string,
    resource: Resource,
    action: Action,
    resourceId?: string
  ): boolean | null {
    const key = this.getCacheKey(userId, resource, action, resourceId)
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  set(
    userId: string,
    resource: Resource,
    action: Action,
    result: boolean,
    resourceId?: string
  ): void {
    const key = this.getCacheKey(userId, resource, action, resourceId)
    this.cache.set(key, { result, timestamp: Date.now() })
  }

  invalidate(userId?: string): void {
    if (!userId) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key)
      }
    }
  }
}

// 전역 리소스 접근 캐시 인스턴스
export const resourceAccessCache = new ResourceAccessCache()

// ================================================================
// 개발 도구
// ================================================================

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    const windowWithResourceAccess = window as Window & { __RESOURCE_ACCESS__?: ResourceAccessDebugInterface }
    // Development only: Debug interface (타입 호환성을 위한 예외)
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
  }
}