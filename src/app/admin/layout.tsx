import { AuthGuard } from '@/components/auth/AuthGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard 
      requireAuth={true}
      allowedRoles={['system_admin', 'admin', 'instructor', 'staff', 'viewer']}
    >
      {children}
    </AuthGuard>
  )
}