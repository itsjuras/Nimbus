import { Link } from 'react-router-dom'
import { useLiveJobs } from '../../hooks/useLiveJobs'
import { useClients } from '../../hooks/useClients'
import { useCrewMembers } from '../../hooks/useCrew'
import type { Job, JobStatus } from '@nimbus/shared'

const COLUMNS: { status: JobStatus; label: string; color: string; dot: string }[] = [
  { status: 'scheduled', label: 'Scheduled', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-gray-100 border-gray-300', dot: 'bg-gray-600' },
  { status: 'completed', label: 'Completed', color: 'bg-white border-gray-200', dot: 'bg-gray-900' },
  { status: 'missed', label: 'Missed', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300' },
]

const BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-gray-900 text-white',
  completed: 'bg-gray-100 text-gray-900',
  missed: 'bg-gray-100 text-gray-400',
}

export default function DashboardPage() {
  const { data: jobs, isLoading } = useLiveJobs()
  const { data: clients } = useClients()
  const { data: crew } = useCrewMembers()

  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const byStatus = (status: JobStatus) =>
    (jobs ?? [])
      .filter((j) => j.status === status)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const todayCount = (jobs ?? []).filter((j) => {
    if (j.status !== 'scheduled' && j.status !== 'in_progress') return false
    const d = new Date(j.scheduledAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {todayCount > 0
              ? `${todayCount} job${todayCount !== 1 ? 's' : ''} active today`
              : 'No active jobs today'}
          </p>
        </div>

        <div className="mt-3 flex gap-6">
          {COLUMNS.map(({ status, label, dot }) => {
            const count = byStatus(status).length
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {COLUMNS.map(({ status, label, color }) => {
          const columnJobs = byStatus(status)
          return (
            <div key={status} className="flex w-72 shrink-0 flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {columnJobs.length}
                </span>
              </div>

              <div className={`flex-1 rounded-xl border p-3 ${color}`}>
                {columnJobs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">No jobs</p>
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
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="font-semibold text-gray-900 leading-tight">{clientName}</p>

      <p className="mt-1 text-xs text-gray-500">
        {isToday
          ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : scheduled.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>

      {job.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-400">{job.notes}</p>
      )}

      <LiveIndicator status={job.status} />
    </Link>
  )
}

function LiveIndicator({ status }: { status: JobStatus }) {
  if (status !== 'in_progress') return null
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-600 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-900" />
      </span>
      <span className="text-xs font-medium text-gray-600">Live</span>
    </div>
  )
}
