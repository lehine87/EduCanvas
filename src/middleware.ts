import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/design-system-test' // Keep for development
  ]
  
  // Admin paths that require authentication
  const adminPaths = ['/admin']
  const isAdminPath = adminPaths.some(path => url.pathname.startsWith(path))

  // Static files and API routes
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.') ||
    req.nextUrl.pathname.startsWith('/test-db') // Allow for development
  ) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users from admin paths
  if (!session && isAdminPath) {
    url.pathname = '/login'
    url.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from login page
  if (session && url.pathname === '/login') {
    const redirectPath = url.searchParams.get('redirect')
    url.pathname = redirectPath || '/admin/dashboard'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Tenant validation for admin paths
  if (session && isAdminPath) {
    const tenantId = req.headers.get('x-tenant-id') || 
                   url.searchParams.get('tenant') ||
                   req.cookies.get('current_tenant_id')?.value
    
    // If no tenant ID, check if user has tenant access
    if (!tenantId) {
      // Get user's available tenants
      const { data: tenants, error } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants (name, slug)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
      
      if (error || !tenants || tenants.length === 0) {
        // User has no tenant access - redirect to unauthorized
        url.pathname = '/admin/unauthorized'
        return NextResponse.redirect(url)
      }
      
      // If user has only one tenant, auto-select it
      if (tenants.length === 1) {
        const response = NextResponse.next()
        response.cookies.set('current_tenant_id', tenants[0].tenant_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
        response.headers.set('x-tenant-id', tenants[0].tenant_id)
        return response
      }
      
      // Multiple tenants - redirect to tenant selection
      url.pathname = '/admin/select-tenant'
      return NextResponse.redirect(url)
    }
    
    // Validate tenant membership
    const { data: tenantUser, error } = await supabase
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

    if (error || !tenantUser) {
      // Invalid tenant access
      url.pathname = '/admin/unauthorized'
      return NextResponse.redirect(url)
    }
    
    // Add tenant and role information to headers
    const response = NextResponse.next()
    response.headers.set('x-tenant-id', tenantId)
    response.headers.set('x-user-role', tenantUser.tenant_roles?.name || 'viewer')
    response.headers.set('x-user-level', tenantUser.tenant_roles?.hierarchy_level?.toString() || '5')
    
    // Set tenant cookie if not already set
    if (!req.cookies.get('current_tenant_id')) {
      response.cookies.set('current_tenant_id', tenantId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }
    
    return response
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|ico|json)$).*)',
  ],
}