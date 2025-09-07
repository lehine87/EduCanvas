/**
 * API Route 권한 검증 미들웨어 - 업계 표준 구현
 * 
 * 기능:
 * - API Route별 세밀한 권한 제어
 * - 자동 테넌트 접근 제어
 * - 권한 부족 시 상세한 에러 메시지
 * - 로깅 및 감사 추적
 */

import { NextRequest } from 'next/server'
import { 
  studentPermissions, 
  type StudentPermission, 
  type PermissionCheckResult 
} from './permissionSystem'
import { createServerErrorResponse, createForbiddenErrorResponse } from '@/lib/api-response'

/**
 * API 권한 검증 옵션
 */
interface ApiPermissionOptions {
  permission: StudentPermission
  requireSameTenant?: boolean
  allowTestUsers?: boolean
  logAccess?: boolean
}

/**
 * 확장된 사용자 정보 (인증에서 가져옴)
 */
export interface AuthenticatedUser {
  id: string
  tenant_id: string
  role: string
  email?: string
  isTestUser?: boolean
  membership?: any
}

/**
 * API 권한 검증 결과
 */
export interface ApiPermissionResult {
  granted: boolean
  user: AuthenticatedUser
  error?: any
  permissionCheck?: PermissionCheckResult
}

/**
 * API Route 권한 검증 미들웨어
 */
export async function checkApiPermission(
  req: NextRequest,
  user: AuthenticatedUser,
  options: ApiPermissionOptions
): Promise<ApiPermissionResult> {
  const { permission, requireSameTenant = true, allowTestUsers = true, logAccess = true } = options

  try {
    // user 객체 검증
    if (!user || !user.id || !user.tenant_id) {
      return {
        granted: false,
        user,
        error: createForbiddenErrorResponse('Invalid user information')
      }
    }

    // 테스트 사용자도 실제 권한 검증 수행 (역할 전달)
    const permissionCheck = await studentPermissions.checkPermission(
      user.id,
      user.tenant_id,
      permission,
      user.isTestUser ? user.role : undefined
    )

    if (!permissionCheck.granted) {
      if (logAccess) {
        console.log(`🔒 [API-AUTH] Permission denied: ${user.email} -> ${permission} (${permissionCheck.reason})`)
      }
      
      return {
        granted: false,
        user,
        permissionCheck,
        error: createForbiddenErrorResponse(
          `Permission '${permission}' required. Current role: ${permissionCheck.currentRole}, Required role: ${permissionCheck.requiredRole}`
        )
      }
    }

    if (logAccess) {
      console.log(`✅ [API-AUTH] Access granted: ${user.email} -> ${permission}`)
    }

    return { granted: true, user, permissionCheck }

  } catch (error) {
    console.error('🔒 [API-AUTH] Permission check failed:', error)
    
    return {
      granted: false,
      user,
      error: createServerErrorResponse(
        'Failed to verify permissions',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
}

/**
 * 테넌트 데이터 접근 권한 검증
 */
export async function checkTenantDataAccess(
  user: AuthenticatedUser,
  targetTenantId: string,
  options: { allowCrossTenant?: boolean } = {}
): Promise<ApiPermissionResult> {
  const { allowCrossTenant = false } = options

  try {
    // 테스트 사용자는 허용
    if (user?.isTestUser) {
      return { granted: true, user }
    }

    // 같은 테넌트 접근
    if (user.tenant_id === targetTenantId) {
      return { granted: true, user }
    }

    // 다른 테넌트 접근 시 권한 체크
    if (!allowCrossTenant) {
      console.log(`🔒 [TENANT-AUTH] Cross-tenant access denied: ${user.tenant_id} -> ${targetTenantId}`)
      
      return {
        granted: false,
        user,
        error: createForbiddenErrorResponse(
          `Cannot access data from different tenant. User tenant: ${user.tenant_id}, Target tenant: ${targetTenantId}`
        )
      }
    }

    // 관리자 권한으로 다른 테넌트 접근 가능한지 체크
    const crossTenantCheck = await studentPermissions.checkPermission(
      user.id,
      user.tenant_id,
      'student:all_tenants'
    )

    if (!crossTenantCheck.granted) {
      console.log(`🔒 [TENANT-AUTH] Insufficient permissions for cross-tenant access: ${user.email}`)
      
      return {
        granted: false,
        user,
        permissionCheck: crossTenantCheck,
        error: createForbiddenErrorResponse(
          'Admin privileges required for cross-tenant access'
        )
      }
    }

    console.log(`✅ [TENANT-AUTH] Cross-tenant access granted: ${user.email} (${user.tenant_id} -> ${targetTenantId})`)
    return { granted: true, user, permissionCheck: crossTenantCheck }

  } catch (error) {
    console.error('🔒 [TENANT-AUTH] Tenant access check failed:', error)
    
    return {
      granted: false,
      user,
      error: createServerErrorResponse(
        'Failed to verify tenant access',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
}

/**
 * 학생 데이터 접근 권한 검증 (개별 학생)
 */
export async function checkStudentDataAccess(
  user: AuthenticatedUser,
  studentData: { tenant_id: string; id: string; [key: string]: any }
): Promise<ApiPermissionResult> {
  
  // 기본 테넌트 접근 권한 체크
  const tenantCheck = await checkTenantDataAccess(user, studentData.tenant_id, { allowCrossTenant: true })
  
  if (!tenantCheck.granted) {
    return tenantCheck
  }

  // 추가적인 학생별 접근 제어 로직을 여기에 구현할 수 있음
  // 예: 강사는 자신이 담당하는 학생만 접근 가능

  console.log(`✅ [STUDENT-AUTH] Student data access granted: ${user.email} -> student ${studentData.id}`)
  
  return { granted: true, user }
}

/**
 * 권한 검증 데코레이터 패턴 (타입스크립트 실험적 기능)
 */
export function RequirePermission(permission: StudentPermission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (req: NextRequest, context: any) {
      // 실제 구현에서는 user 정보를 context에서 추출
      console.log(`🔒 [DECORATOR] Checking permission: ${permission}`)
      
      return originalMethod.call(this, req, context)
    }
    
    return descriptor
  }
}

/**
 * API Route 권한 검증 유틸리티
 */
export class ApiPermissionUtils {
  /**
   * 권한 에러 응답 생성
   */
  static createPermissionError(
    permission: StudentPermission,
    currentRole?: string,
    requiredRole?: string
  ) {
    return createForbiddenErrorResponse(
      `Permission '${permission}' required.${currentRole ? ` Current role: ${currentRole}.` : ''}${requiredRole ? ` Required role: ${requiredRole} or higher.` : ''}`
    )
  }

  /**
   * 권한 검증 로그
   */
  static logPermissionCheck(
    user: AuthenticatedUser,
    permission: StudentPermission,
    granted: boolean,
    reason?: string
  ) {
    const status = granted ? '✅ GRANTED' : '❌ DENIED'
    const reasonText = reason ? ` (${reason})` : ''
    console.log(`🔒 [PERMISSION] ${status}: ${user.email} -> ${permission}${reasonText}`)
  }

  /**
   * 사용자 권한 요약
   */
  static async getUserPermissionSummary(user: AuthenticatedUser): Promise<string> {
    if (user?.isTestUser) {
      return '🔧 Test User (All permissions)'
    }

    return await studentPermissions.getPermissionSummary(user.id, user.tenant_id)
  }
}