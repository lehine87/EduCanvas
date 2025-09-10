/**
 * @file check-role.ts
 * @description Simple role checking utility for API routes
 * @module T-V2-012
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Check if user has one of the specified roles
 */
export async function checkUserRole(
  userId: string, 
  allowedRoles: string[]
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Get user's tenant membership and role information
    const { data: membership, error } = await supabase
      .from('tenant_memberships')
      .select(`
        role:tenant_roles!tenant_memberships_role_id_fkey(
          name
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error || !membership) {
      return false
    }

    // Handle the role data structure safely
    const role = membership.role && typeof membership.role === 'object' && 'name' in membership.role 
      ? membership.role.name 
      : null

    if (!role) {
      return false
    }

    return allowedRoles.includes(role)
  } catch (error) {
    console.error('Role check error:', error)
    return false
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return checkUserRole(userId, ['admin'])
}

/**
 * Check if user has manager or admin role
 */
export async function isManagerOrAdmin(userId: string): Promise<boolean> {
  return checkUserRole(userId, ['admin', 'manager'])
}

/**
 * Check if user has instructor, manager, or admin role
 */
export async function isInstructorOrAbove(userId: string): Promise<boolean> {
  return checkUserRole(userId, ['admin', 'manager', 'instructor'])
}