import { useNavigate } from 'react-router-dom'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { CREW, JOBS } from './_data'
import { useTheme } from '../../hooks/useTheme'

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  manager: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  crew: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

export default function DemoCrewPage() {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const jobCountFor = (crewId: string) =>
    JOBS.filter((j) => j.crewIds.includes(crewId) && j.status === 'completed').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crew</h1>
        <div className="flex items-center gap-3">
          <button
            disabled
            title="Not available in demo"
            className="cursor-not-allowed rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 opacity-50"
          >
            Invite crew
          </button>
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 sm:px-6">Name</th>
              <th className="px-4 py-3 sm:px-6">Role</th>
              <th className="hidden md:table-cell px-4 py-3 sm:px-6">Phone</th>
              <th className="hidden lg:table-cell px-4 py-3 sm:px-6">Email</th>
              <th className="hidden lg:table-cell px-4 py-3 sm:px-6">Jobs completed</th>
              <th className="px-4 py-3 sm:px-6" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {CREW.map((member) => (
              <tr key={member.id} onClick={() => navigate(`/demo/crew/${member.id}`)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {member.fullName.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${ROLE_BADGE[member.role]}`}>
                    {member.role}
                  </span>
                </td>
                <td className="hidden md:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">{member.phone}</td>
                <td className="hidden lg:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">{member.email}</td>
                <td className="hidden lg:table-cell px-4 py-4 font-medium text-gray-700 dark:text-gray-300 normal-case tracking-normal sm:px-6">{jobCountFor(member.id)}</td>
                <td className="px-4 py-4 text-right sm:px-6">
                  <span className="font-medium text-gray-900 dark:text-gray-100">View</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
