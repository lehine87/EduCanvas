// Authentication components
export { LoginForm } from './LoginForm'
export * from './PermissionGate'
export * from './PermissionGuard'

// Re-export from context for convenience
export { useAuth, withAuth, AuthProvider } from '@/contexts/AuthContext'