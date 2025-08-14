'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { 
  Resource, 
  Action, 
  PermissionString,
  PermissionContext 
} from '@/types/permissions.types'
import { hasPermission, canPerformAction } from '@/lib/permissions/rbac'
import { checkResourceAccess } from '@/lib/permissions/resourceAccess'

/**
 * PermissionGuard 컴포넌트 Props
 */
interface PermissionGuardProps {
  resource: Resource
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
  resourceId?: string // 특정 리소스 ID (소유권 체크용)
  requireOwnership?: boolean // 소유권 체크 필요 여부
  permissionString?: PermissionString // 직접 권한 문자열 제공
  showLoading?: boolean // 로딩 상태 표시 여부
  onDenied?: () => void // 권한 거부 시 콜백
}

/**
 * 권한 기반 컴포넌트 렌더링 가드
 * @description 사용자 권한에 따라 컴포넌트를 조건부 렌더링
 */
export function PermissionGuard({ 
  resource, 
  action, 
  children,
  fallback = null,
  resourceId,
  requireOwnership = false,
  permissionString,
  showLoading = false,
  onDenied
}: PermissionGuardProps) {
  const { user, profile, isLoading } = useAuth()

  // 권한 체크
  const hasAccess = useMemo(() => {
    if (!user || !profile) return false

    // 권한 문자열이 직접 제공된 경우
    if (permissionString) {
      return hasPermission(profile, permissionString)
    }

    // 리소스 ID가 있고 소유권 체크가 필요한 경우
    if (resourceId && requireOwnership) {
      const context: PermissionContext = {
        userId: user.id,
        tenantId: profile.tenant_id,
        resourceId,
        resourceOwnerId: user.id // 소유권 체크를 위해 현재 사용자 ID 사용
      }
      
      return hasPermission(
        profile,
        { resource, action, scope: 'own' },
        context
      )
    }

    // 일반적인 권한 체크
    return canPerformAction(profile, resource, action, {
      userId: user.id,
      tenantId: profile.tenant_id
    })
  }, [user, profile, resource, action, resourceId, requireOwnership, permissionString])

  // 로딩 중일 때
  if (isLoading && showLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    )
  }

  // 권한이 없을 때
  if (!hasAccess) {
    if (onDenied) {
      onDenied()
    }
    return <>{fallback}</>
  }

  // 권한이 있을 때
  return <>{children}</>
}

/**
 * 역할 기반 가드 컴포넌트
 */
interface RoleGuardProps {
  allowedRoles: Array<'system_admin' | 'admin' | 'instructor' | 'staff' | 'viewer'>
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const { profile } = useAuth()
  
  const hasRole = profile && profile.role && allowedRoles.includes(profile.role)
  
  return hasRole ? <>{children}</> : <>{fallback}</>
}

// ================================================================
// 특화된 가드 컴포넌트들
// ================================================================

/**
 * 시스템 관리자 전용
 */
export function SystemAdminOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['system_admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * 테넌트 관리자 이상
 */
export function AdminOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['system_admin', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * 강사 전용
 */
export function InstructorOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['instructor']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * 스태프 이상
 */
export function StaffOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard 
      allowedRoles={['system_admin', 'admin', 'instructor', 'staff']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

// ================================================================
// 리소스별 특화 가드
// ================================================================

/**
 * 학생 생성 권한
 */
export function StudentCreateGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="student" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 학생 수정 권한
 */
export function StudentEditGuard({ 
  children, 
  fallback,
  studentId
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  studentId?: string
}) {
  return (
    <PermissionGuard 
      resource="student" 
      action="update" 
      resourceId={studentId}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * 학생 삭제 권한
 */
export function StudentDeleteGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="student" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 클래스 생성 권한
 */
export function ClassCreateGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="class" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 클래스 수정 권한
 */
export function ClassEditGuard({ 
  children, 
  fallback,
  classId
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  classId?: string
}) {
  return (
    <PermissionGuard 
      resource="class" 
      action="update" 
      resourceId={classId}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * 결제 접근 권한
 */
export function PaymentAccessGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="payment" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 결제 생성 권한
 */
export function PaymentCreateGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="payment" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 출결 관리 권한
 */
export function AttendanceManageGuard({ 
  children, 
  fallback,
  classId
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  classId?: string
}) {
  return (
    <PermissionGuard 
      resource="attendance" 
      action="update" 
      resourceId={classId}
      requireOwnership={true}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * 분석 데이터 접근 권한
 */
export function AnalyticsAccessGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="analytics" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 시스템 설정 접근 권한
 */
export function SystemSettingsGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard resource="system" action="manage" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}