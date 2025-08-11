'use client'

import { useAuth } from '@/contexts/AuthContext'
import React from 'react'

interface PermissionGuardProps {
  resource: string
  action: string
  fallback?: React.ReactNode
  children: React.ReactNode
  requireOwner?: boolean
  requireAdmin?: boolean
  requireInstructor?: boolean
}

export function PermissionGuard({ 
  resource, 
  action, 
  fallback,
  children,
  requireOwner,
  requireAdmin,
  requireInstructor
}: PermissionGuardProps) {
  const { hasPermission, isOwner, isAdmin, isInstructor } = useAuth()
  
  // Check role-based requirements first
  if (requireOwner && !isOwner()) {
    return fallback || null
  }
  
  if (requireAdmin && !isAdmin()) {
    return fallback || null
  }
  
  if (requireInstructor && !isInstructor()) {
    return fallback || null
  }
  
  // Check specific permission
  if (!hasPermission(resource, action)) {
    return fallback || null
  }
  
  return <>{children}</>
}

// Specialized guards for common use cases
export function OwnerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="system" action="admin" requireOwner fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="system" action="admin" requireAdmin fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function InstructorOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="system" action="write" requireInstructor fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

// Resource-specific guards
export function StudentWriteGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="students" action="write" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function StudentDeleteGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="students" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function ClassWriteGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="classes" action="write" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function VideoWriteGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="videos" action="write" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function PaymentAccessGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard resource="payments" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}