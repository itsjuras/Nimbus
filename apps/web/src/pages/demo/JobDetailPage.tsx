import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { JOBS, getClient, getCrew, formatDate, type DemoChecklistItem, type JobStatus } from './_data'
import { useTheme } from '../../hooks/useTheme'

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

export default function DemoJobDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { theme, toggle } = useTheme()
  const job = JOBS.find((j) => j.id === id)

  const [checklistItems, setChecklistItems] = useState<DemoChecklistItem[]>(
    job?.checklistItems ?? [],
  )

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Job not found.</p>
        <Link to="/demo/jobs" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline">
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
          <Link to="/demo/jobs" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Jobs
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{client?.name ?? '—'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 normal-case tracking-normal">{formatDate(job.scheduledAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-normal ${STATUS_BADGE[job.status]}`}>
            {job.status.replace('_', ' ')}
          </span>
          <button
            disabled
            title="Not available in demo"
            className="cursor-not-allowed rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 opacity-40"
          >
            Edit job
          </button>
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
        <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Job details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scheduled date & time
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
              className={readonlyInputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              readOnly
              rows={3}
              value={job.notes ?? ''}
              placeholder="No notes for this job."
              className={readonlyInputClass}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Crew</h2>
          <ul className="space-y-3">
            {job.crewIds.map((crewId) => {
              const member = getCrew(crewId)
              if (!member) return null
              return (
                <li key={crewId} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal capitalize">{member.role}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {checklistItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Checklist progress
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              {completedCount} / {checklistItems.length} completed
            </span>
          </h2>

          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gray-900 dark:bg-gray-100 transition-all duration-300"
              style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
            />
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {checklistItems.map((item) => (
              <li
                key={item.id}
                className="flex cursor-pointer items-center gap-3 py-3 -mx-6 px-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => toggleItem(item.id)}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    item.completed
                      ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {item.completed && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </span>
                <span className={`flex-1 text-sm normal-case tracking-normal transition-colors ${item.completed ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.label}
                </span>
                {item.requiresPhoto && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">Photo required</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const readonlyInputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm normal-case tracking-normal text-gray-500 dark:text-gray-400 outline-none'

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
