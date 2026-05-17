import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext'
import NimbusSymbolLogo from '../../assets/NimbusSymbolLogo.png'

const navItems = [
  { to: '/owner/dashboard', label: 'Dashboard' },
  { to: '/owner/calendar', label: 'Calendar' },
  { to: '/owner/jobs', label: 'Jobs' },
  { to: '/owner/clients', label: 'Clients' },
  { to: '/owner/crew', label: 'Crew' },
  { to: '/owner/invoices', label: 'Invoices' },
]

function OwnerLayoutInner() {
  const { profile, signOut } = useAuth()
  const { sidebarOpen, toggleSidebar } = useSidebar()

  const closeOnMobile = () => {
    if (window.innerWidth < 768) toggleSidebar()
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      document.body.classList.add('resizing')
      clearTimeout(timer)
      timer = setTimeout(() => document.body.classList.remove('resizing'), 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-plex uppercase tracking-widest" style={{ wordSpacing: '-0.3em' }}>

      {/* Backdrop — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
          // Mobile: fixed full-width overlay, slide in/out
          'fixed inset-y-0 left-0 z-50 w-full transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: relative inline, width-based collapse
          'md:relative md:inset-auto md:z-auto md:translate-x-0 md:shrink-0 md:min-w-0 md:overflow-hidden md:transition-[width]',
          sidebarOpen ? 'md:w-56' : 'md:w-0',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800 px-6">
          <img src={NimbusSymbolLogo} alt="Nimbus" className="h-8 w-auto animate-pulse-glow" />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{profile?.fullName}</p>
          <button
            onClick={signOut}
            className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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

export function OwnerLayout() {
  return (
    <SidebarProvider>
      <OwnerLayoutInner />
    </SidebarProvider>
  )
}
