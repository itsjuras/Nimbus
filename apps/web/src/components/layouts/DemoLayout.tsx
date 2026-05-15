import { NavLink, Outlet, Link } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import NimbusSymbolLogo from '../../assets/NimbusSymbolLogo.png'

const NAV = [
  { to: '/demo', label: 'Dashboard', end: true },
  { to: '/demo/jobs', label: 'Jobs', end: false },
  { to: '/demo/clients', label: 'Clients', end: false },
  { to: '/demo/crew', label: 'Crew', end: false },
  { to: '/demo/invoices', label: 'Invoices', end: false },
]

export function DemoLayout() {
  const { theme } = useTheme()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-plex uppercase tracking-widest" style={{ wordSpacing: '-0.3em' }}>
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800 px-6">
          <img src={NimbusSymbolLogo} alt="Nimbus" className="h-8 w-auto animate-pulse-glow" />
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <p className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">Brightline Cleaning Co.</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Owner</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              Demo
            </span>
            <Link to="/" className="text-xs text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300">
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
