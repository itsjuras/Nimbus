import { Link, useParams } from 'react-router-dom'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useTheme } from '../../hooks/useTheme'
import { useCrewMembers } from '../../hooks/useCrew'
import type { UserRole } from '@nimbus/shared'

const ROLE_BADGE: Record<UserRole, string> = {
  owner: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  manager: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  crew: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

export default function CrewDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { theme, toggle } = useTheme()
  const { data: crew, isLoading } = useCrewMembers()

  const member = crew?.find((m) => m.id === id)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Crew member not found.</p>
        <Link to="/owner/crew" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal">
          ← Back to crew
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/owner/crew" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Crew
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SidebarToggle />
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={`relative flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow transition-transform duration-300 ${
                theme === 'dark' ? 'translate-x-9' : 'translate-x-1'
              }`}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="self-start space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 lg:order-last">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xl font-semibold text-gray-700 dark:text-gray-300">
              {member.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${ROLE_BADGE[member.role]}`}>
                {member.role}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 pt-2">
            <div className="py-3">
              <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Phone</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">{member.phone ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:col-span-2">
          <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Job history</h2>
          </div>
          <p className="p-8 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            Job history per crew member coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
