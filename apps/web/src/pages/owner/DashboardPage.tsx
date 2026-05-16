import { Link } from 'react-router-dom'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useLiveJobs } from '../../hooks/useLiveJobs'
import { useClients } from '../../hooks/useClients'
import { useCrewMembers } from '../../hooks/useCrew'
import { useTheme } from '../../hooks/useTheme'
import type { Job, JobStatus } from '@nimbus/shared'

const COLUMNS: { status: JobStatus; label: string; color: string; darkColor: string; dot: string; darkDot: string }[] = [
  { status: 'scheduled', label: 'Scheduled', color: 'bg-gray-50 border-gray-200', darkColor: 'dark:bg-gray-800/60 dark:border-gray-700', dot: 'bg-gray-300', darkDot: 'dark:bg-gray-600' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-gray-100 border-gray-300', darkColor: 'dark:bg-gray-800 dark:border-gray-600', dot: 'bg-gray-600', darkDot: 'dark:bg-gray-400' },
  { status: 'completed', label: 'Completed', color: 'bg-white border-gray-200', darkColor: 'dark:bg-gray-900 dark:border-gray-700', dot: 'bg-gray-900', darkDot: 'dark:bg-gray-200' },
  { status: 'missed', label: 'Missed', color: 'bg-gray-50 border-gray-200', darkColor: 'dark:bg-gray-800/60 dark:border-gray-700', dot: 'bg-gray-300', darkDot: 'dark:bg-gray-600' },
]

export default function DashboardPage() {
  const { data: jobs, isLoading } = useLiveJobs()
  const { data: clients } = useClients()
  const { data: crew } = useCrewMembers()
  const { theme, toggle } = useTheme()

  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const byStatus = (status: JobStatus) =>
    (jobs ?? [])
      .filter((j) => j.status === status)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const today = new Date().toDateString()
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  const todayCount = (jobs ?? []).filter((j) => new Date(j.scheduledAt).toDateString() === today).length
  const liveCount = byStatus('in_progress').length
  const weekCount = (jobs ?? []).filter(
    (j) => j.status === 'completed' && new Date(j.scheduledAt).getTime() >= weekAgo,
  ).length
  const clientCount = clients?.length ?? 0

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent dark:border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:h-full">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-6 pb-4 sm:px-8 sm:pt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Dashboard</h1>
          <div className="flex items-center gap-3">
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

        <div className="mt-3 flex flex-wrap gap-3 sm:gap-6">
          {COLUMNS.map(({ status, label, dot, darkDot }) => {
            const count = byStatus(status).length
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot} ${darkDot}`} />
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 px-4 py-4 sm:grid-cols-4 sm:gap-4 sm:px-8 sm:py-5">
        <StatCard label="Today's Jobs" value={todayCount} />
        <StatCard label="Live Now" value={liveCount} accent={liveCount > 0} />
        <StatCard label="Done This Week" value={weekCount} />
        <StatCard label="Clients" value={clientCount} />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:p-5 lg:flex lg:flex-1 lg:gap-4 lg:p-6">
        {COLUMNS.map(({ status, label, color, darkColor }) => {
          const columnJobs = byStatus(status)
          return (
            <div key={status} className="flex flex-col lg:flex-1 lg:min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</h2>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 tracking-normal leading-none">
                  {columnJobs.length}
                </span>
              </div>

              <div className={`min-h-36 rounded-xl border p-3 lg:flex-1 ${color} ${darkColor}`}>
                {columnJobs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-600">No jobs</p>
                ) : (
                  <div className="space-y-3">
                    {columnJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        clientName={clientMap.get(job.clientId) ?? '—'}
                        crew={crew}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function JobCard({
  job,
  clientName,
  crew,
}: {
  job: Job
  clientName: string
  crew: { id: string; fullName: string }[] | undefined
}) {
  const scheduled = new Date(job.scheduledAt)
  const isToday = scheduled.toDateString() === new Date().toDateString()

  return (
    <Link
      to={`/owner/jobs/${job.id}`}
      className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
    >
      <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{clientName}</p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">
        {isToday
          ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : scheduled.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>

      {job.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">{job.notes}</p>
      )}

      <LiveIndicator status={job.status} />
    </Link>
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

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{value}</p>
      {accent && value > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-600 dark:bg-gray-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-gray-200" />
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">in progress</span>
        </div>
      )}
    </div>
  )
}

function LiveIndicator({ status }: { status: JobStatus }) {
  if (status !== 'in_progress') return null
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-600 dark:bg-gray-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-200" />
      </span>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Live</span>
    </div>
  )
}
