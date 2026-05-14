import { NavLink, Outlet, Link } from 'react-router-dom'

const NAV = [
  { to: '/demo', label: 'Dashboard', end: true },
  { to: '/demo/jobs', label: 'Jobs', end: false },
  { to: '/demo/clients', label: 'Clients', end: false },
  { to: '/demo/crew', label: 'Crew', end: false },
  { to: '/demo/invoices', label: 'Invoices', end: false },
]

export function DemoLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <span className="text-xl font-bold text-gray-900">Nimbus</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <p className="truncate text-sm font-medium text-gray-700">Brightline Cleaning Co.</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              Demo
            </span>
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
              ← Back to site
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
