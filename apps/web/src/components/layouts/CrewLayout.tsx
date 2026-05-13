import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function CrewLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-14 items-center justify-between bg-white px-4 shadow-sm">
        <span className="text-lg font-bold text-gray-900">Nimbus</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{profile?.fullName}</span>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
