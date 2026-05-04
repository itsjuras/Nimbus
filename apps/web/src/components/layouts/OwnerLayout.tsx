import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/owner/dashboard', label: 'Dashboard' },
  { to: '/owner/jobs', label: 'Jobs' },
  { to: '/owner/clients', label: 'Clients' },
  { to: '/owner/crew', label: 'Crew' },
]

export function OwnerLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">Nimbus</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <p className="truncate text-sm font-medium text-gray-700">{profile?.fullName}</p>
          <button
            onClick={signOut}
            className="mt-1 text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
