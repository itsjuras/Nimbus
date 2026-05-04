import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ allowedRoles, redirectTo = '/login' }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to={redirectTo} replace />

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
