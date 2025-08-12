import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    tenant_id: string
    role: string
    role_level: number
    permissions: Record<string, string[]>
  }
}

export interface ApiAuthOptions {
  requiredPermissions?: { resource: string; action: string }[]
  requireOwner?: boolean
  requireAdmin?: boolean
  requireInstructor?: boolean
}

// Permission checking function
function checkPermission(
  userRole: string,
  roleLevel: number,
  customPermissions: Record<string, string[]>,
  resource: string,
  action: string
): boolean {
  // Owner (level 1) has all permissions
  if (roleLevel === 1) return true
  
  // Check custom permissions first
  if (customPermissions[resource]?.includes(action)) {
    return true
  }
  
  // Role-based permission checks
  switch (roleLevel) {
    case 2: // Admin
      return action !== 'admin' // Admins can't perform owner-only actions
      
    case 3: // Instructor
      switch (resource) {
        case 'students': return ['read', 'write'].includes(action)
        case 'classes': return ['read', 'write'].includes(action)
        case 'videos': return ['read', 'write'].includes(action)
        case 'reports': return action === 'read'
        case 'payments': return action === 'read'
        case 'settings': return action === 'read'
        default: return false
      }
      
    case 4: // Staff
      switch (resource) {
        case 'students': return ['read', 'write'].includes(action)
        case 'classes': return action === 'read'
        case 'videos': return action === 'read'
        case 'reports': return action === 'read'
        case 'payments': return action === 'read'
        default: return false
      }
      
    case 5: // Viewer
    default:
      return action === 'read'
  }
}

export function withApiAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>,
  options: ApiAuthOptions = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const supabase = createClient()
      
      // 1. Authentication check
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED' 
          }), 
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // 2. Get tenant ID from headers or cookies
      const tenantId = req.headers.get('x-tenant-id') || 
                     req.cookies.get('current_tenant_id')?.value

      if (!tenantId) {
        return new Response(
          JSON.stringify({ 
            error: 'Tenant information required',
            code: 'TENANT_REQUIRED' 
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // 3. Validate tenant membership and get role info
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenant_roles (
            name,
            hierarchy_level,
            base_permissions
          )
        `)
        .eq('user_id', session.user.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single()

      if (tenantError || !tenantUser) {
        return new Response(
          JSON.stringify({ 
            error: 'Access denied for this tenant',
            code: 'TENANT_ACCESS_DENIED' 
          }), 
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const role = tenantUser.tenant_roles?.name || 'viewer'
      const roleLevel = tenantUser.tenant_roles?.hierarchy_level || 5
      const customPermissions = tenantUser.custom_permissions || {}

      // 4. Role-based access checks
      if (options.requireOwner && roleLevel !== 1) {
        return new Response(
          JSON.stringify({ 
            error: 'Owner access required',
            code: 'OWNER_REQUIRED' 
          }), 
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (options.requireAdmin && roleLevel > 2) {
        return new Response(
          JSON.stringify({ 
            error: 'Admin access required',
            code: 'ADMIN_REQUIRED' 
          }), 
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (options.requireInstructor && roleLevel > 3) {
        return new Response(
          JSON.stringify({ 
            error: 'Instructor access required',
            code: 'INSTRUCTOR_REQUIRED' 
          }), 
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // 5. Permission-based access checks
      if (options.requiredPermissions) {
        const hasAllPermissions = options.requiredPermissions.every(({ resource, action }) =>
          checkPermission(role, roleLevel, customPermissions, resource, action)
        )

        if (!hasAllPermissions) {
          return new Response(
            JSON.stringify({ 
              error: 'Insufficient permissions',
              code: 'PERMISSION_DENIED',
              required: options.requiredPermissions
            }), 
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // 6. Create authenticated request object
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        id: session.user.id,
        email: session.user.email!,
        tenant_id: tenantId,
        role,
        role_level: roleLevel,
        permissions: customPermissions
      }

      // 7. Update last activity timestamp
      await supabase
        .from('tenant_users')
        .update({ 
          last_activity_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .eq('tenant_id', tenantId)

      return await handler(authenticatedReq)
    } catch (error) {
      console.error('API authentication error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          code: 'INTERNAL_ERROR' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

// Utility function for manual permission checks
export async function checkUserPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: tenantUser, error } = await supabase
      .from('tenant_users')
      .select(`
        *,
        tenant_roles (
          name,
          hierarchy_level
        )
      `)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single()

    if (error || !tenantUser) return false

    const role = tenantUser.tenant_roles?.name || 'viewer'
    const roleLevel = tenantUser.tenant_roles?.hierarchy_level || 5
    const customPermissions = tenantUser.custom_permissions || {}

    return checkPermission(role, roleLevel, customPermissions, resource, action)
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

// Audit logging function for sensitive operations
export async function logSecurityEvent(
  userId: string,
  tenantId: string,
  action: string,
  resource: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createClient()
    
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        action,
        table_name: resource,
        new_values: metadata,
        occurred_at: new Date().toISOString(),
        risk_level: 'medium',
        is_anomalous: false,
        ip_address: metadata.ip_address,
        user_agent: metadata.user_agent,
        session_id: metadata.session_id
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
    // Don't throw - logging failures shouldn't break the request
  }
}

// Example usage patterns:

/*
// Basic authenticated API route
export const GET = withApiAuth(
  async (req: AuthenticatedRequest) => {
    return Response.json({ user: req.user })
  }
)

// Permission-required API route
export const POST = withApiAuth(
  async (req: AuthenticatedRequest) => {
    const data = await req.json()
    // Handle student creation
    return Response.json({ success: true })
  },
  { requiredPermissions: [{ resource: 'students', action: 'write' }] }
)

// Admin-only API route
export const DELETE = withApiAuth(
  async (req: AuthenticatedRequest) => {
    // Handle sensitive deletion
    await logSecurityEvent(
      req.user.id,
      req.user.tenant_id,
      'delete',
      'students',
      { 
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent')
      }
    )
    return Response.json({ success: true })
  },
  { requireAdmin: true }
)

// Owner-only API route
export const PUT = withApiAuth(
  async (req: AuthenticatedRequest) => {
    // Handle tenant settings update
    return Response.json({ success: true })
  },
  { requireOwner: true }
)
*/