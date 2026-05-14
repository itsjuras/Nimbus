import { useState } from 'react'
import { Link } from 'react-router-dom'
import { JOBS, getClient, formatDate, type JobStatus } from './_data'

const STATUS_TABS: { label: string; value: JobStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Missed', value: 'missed' },
]

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-gray-900 text-white',
  completed: 'bg-gray-100 text-gray-900',
  missed: 'bg-gray-100 text-gray-400',
}

export default function DemoJobsPage() {
  const [activeStatus, setActiveStatus] = useState<JobStatus | undefined>(undefined)

  const jobs = JOBS.filter((j) => !activeStatus || j.status === activeStatus).sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime(),
  )

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <button
          disabled
          title="Not available in demo"
          className="cursor-not-allowed rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white opacity-50"
        >
          Schedule job
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Scheduled</th>
              <th className="px-6 py-3">Crew</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => {
              const client = getClient(job.clientId)
              return (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/demo/jobs/${job.id}`} className="hover:underline">
                      {client?.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(job.scheduledAt)}</td>
                  <td className="px-6 py-4 text-gray-500">{job.crewIds.length} assigned</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status]}`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/demo/jobs/${job.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
