import { AuthGuard } from '@/components/auth/AuthGuard'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    </AuthGuard>
  )
}