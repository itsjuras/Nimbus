import { Link } from 'react-router-dom'
import { JOBS, CLIENTS, getClient, formatDate, type JobStatus } from './_data'

const COLUMNS: { status: JobStatus; label: string; color: string; dot: string }[] = [
  { status: 'scheduled', label: 'Scheduled', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-gray-100 border-gray-300', dot: 'bg-gray-600' },
  { status: 'completed', label: 'Completed', color: 'bg-white border-gray-200', dot: 'bg-gray-900' },
  { status: 'missed', label: 'Missed', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300' },
]

export default function DemoDashboardPage() {
  const byStatus = (status: JobStatus) =>
    JOBS.filter((j) => j.status === status).sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
    )

  const todayCount = JOBS.filter((j) => j.status === 'in_progress').length

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {todayCount} job{todayCount !== 1 ? 's' : ''} active today
          </p>
        </div>
        <div className="mt-3 flex gap-6">
          {COLUMNS.map(({ status, label, dot }) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-gray-900">{byStatus(status).length}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {COLUMNS.map(({ status, label, color }) => {
          const jobs = byStatus(status)
          return (
            <div key={status} className="flex w-72 shrink-0 flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {jobs.length}
                </span>
              </div>
              <div className={`flex-1 rounded-xl border p-3 ${color}`}>
                {jobs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">No jobs</p>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => {
                      const client = getClient(job.clientId)
                      return (
                        <Link
                          key={job.id}
                          to={`/demo/jobs/${job.id}`}
                          className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <p className="font-semibold leading-tight text-gray-900">
                            {client?.name ?? '—'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(job.scheduledAt)}</p>
                          {job.notes && (
                            <p className="mt-2 line-clamp-2 text-xs text-gray-400">{job.notes}</p>
                          )}
                          {job.status === 'in_progress' && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-600 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-900" />
                              </span>
                              <span className="text-xs font-medium text-gray-600">Live</span>
                            </div>
                          )}
                        </Link>
                      )
                    })}
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
