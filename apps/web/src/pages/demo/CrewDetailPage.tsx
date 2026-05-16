import { Link, useNavigate, useParams } from 'react-router-dom'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { CREW, JOBS, getClient, formatDate } from './_data'
import { useTheme } from '../../hooks/useTheme'
import type { JobStatus } from '@nimbus/shared'

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  manager: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  crew: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

export default function DemoCrewDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const member = CREW.find((c) => c.id === id)
  const memberJobs = JOBS.filter((j) => j.crewIds.includes(id)).sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime(),
  )
  const completedCount = memberJobs.filter((j) => j.status === 'completed').length

  if (!member) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Crew member not found.</p>
        <Link to="/demo/crew" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal">
          ← Back to crew
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/demo/crew" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
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
              {member.fullName.charAt(0)}
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
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">{member.phone}</p>
            </div>
            <div className="py-3">
              <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Email</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">{member.email}</p>
            </div>
            <div className="py-3">
              <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Jobs completed</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:col-span-2">
          <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Job history</h2>
          </div>
          {memberJobs.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">No jobs assigned yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Client</th>
                  <th className="hidden sm:table-cell px-4 py-3 sm:px-6">Date</th>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                  <th className="px-4 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {memberJobs.map((job) => {
                  const client = getClient(job.clientId)
                  return (
                    <tr
                      key={job.id}
                      onClick={() => navigate(`/demo/jobs/${job.id}`)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal sm:px-6">{client?.name ?? '—'}</td>
                      <td className="hidden sm:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">{formatDate(job.scheduledAt)}</td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-normal ${STATUS_BADGE[job.status]}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        <span className="font-medium text-gray-900 dark:text-gray-100">View</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
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
