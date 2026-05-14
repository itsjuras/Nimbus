import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { JOBS, CREW, getClient, getCrew, formatDate, type DemoChecklistItem, type JobStatus } from './_data'

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-gray-900 text-white',
  completed: 'bg-gray-100 text-gray-900',
  missed: 'bg-gray-100 text-gray-400',
}

export default function DemoJobDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const job = JOBS.find((j) => j.id === id)

  const [checklistItems, setChecklistItems] = useState<DemoChecklistItem[]>(
    job?.checklistItems ?? [],
  )

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Job not found.</p>
        <Link to="/demo/jobs" className="mt-2 text-sm text-gray-900 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    )
  }

  const client = getClient(job.clientId)
  const completedCount = checklistItems.filter((i) => i.completed).length

  function toggleItem(itemId: string) {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link to="/demo/jobs" className="text-sm text-gray-400 hover:text-gray-600">
            ← Jobs
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{client?.name ?? '—'}</h1>
          <p className="text-sm text-gray-500">{formatDate(job.scheduledAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[job.status]}`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900">Job details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Scheduled date &amp; time
            </label>
            <input
              readOnly
              value={job.scheduledAt.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          {job.notes && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                readOnly
                rows={3}
                value={job.notes}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>
          )}

          {!job.notes && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                readOnly
                rows={3}
                placeholder="No notes for this job."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Crew */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Crew</h2>
          <ul className="space-y-3">
            {job.crewIds.map((crewId) => {
              const member = getCrew(crewId)
              if (!member) return null
              return (
                <li key={crewId} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                    <p className="text-xs capitalize text-gray-400">{member.role}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Checklist */}
      {checklistItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Checklist progress
            <span className="ml-2 text-sm font-normal text-gray-400">
              {completedCount} / {checklistItems.length} completed
            </span>
          </h2>

          {/* Progress bar */}
          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-300"
              style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
            />
          </div>

          <ul className="divide-y divide-gray-100">
            {checklistItems.map((item) => (
              <li
                key={item.id}
                className="flex cursor-pointer items-center gap-3 py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                onClick={() => toggleItem(item.id)}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    item.completed
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {item.completed && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </span>
                <span
                  className={`flex-1 text-sm transition-colors ${
                    item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </span>
                {item.requiresPhoto && (
                  <span className="text-xs text-gray-400">Photo required</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
