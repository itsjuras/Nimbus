import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateJobSchema, type UpdateJobRequest, type JobStatus } from '@nimbus/shared'
import { useJob, useUpdateJob, useDeleteJob } from '../../hooks/useJobs'
import { useCrewMembers } from '../../hooks/useCrew'
import { useTheme } from '../../hooks/useTheme'

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

export default function JobDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [isEditing, setIsEditing] = useState(false)

  const { data: job, isLoading } = useJob(id)
  const { data: allCrew } = useCrewMembers()
  const updateJob = useUpdateJob(id)
  const deleteJob = useDeleteJob()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateJobRequest>({
    resolver: zodResolver(UpdateJobSchema),
    ...(job && {
      values: {
        scheduledAt: job.scheduledAt.slice(0, 16),
        notes: job.notes ?? undefined,
        crewIds: job.crew.map((m) => m.id),
      },
    }),
  })

  async function onSave(data: UpdateJobRequest) {
    await updateJob.mutateAsync(data)
    setIsEditing(false)
  }

  function onDiscard() {
    reset()
    setIsEditing(false)
  }

  async function onCancelJob() {
    if (!confirm('Cancel this job? This cannot be undone.')) return
    await deleteJob.mutateAsync(id)
    navigate('/owner/jobs')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Job not found.</p>
        <Link to="/owner/jobs" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link to="/owner/jobs" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Jobs
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{job.clientName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 normal-case tracking-normal">{job.checklistName}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-normal ${STATUS_BADGE[job.status]}`}>
            {job.status.replace('_', ' ')}
          </span>

          {isEditing ? (
            <>
              <button
                onClick={onCancelJob}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
              >
                Cancel job
              </button>
              <button
                onClick={onDiscard}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Discard
              </button>
              <button
                form="job-edit-form"
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
            >
              Edit job
            </button>
          )}

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
        <form
          id="job-edit-form"
          onSubmit={handleSubmit(onSave)}
          className="lg:col-span-2 space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Job details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scheduled date & time
            </label>
            <input
              {...register('scheduledAt')}
              type="datetime-local"
              disabled={!isEditing}
              className={inputClass}
            />
            {errors.scheduledAt && (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal">{errors.scheduledAt.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              disabled={!isEditing}
              placeholder={isEditing ? 'Add notes…' : ''}
              className={inputClass}
            />
          </div>
        </form>

        <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Crew</h2>
          {isEditing ? (
            <div>
              <select
                multiple
                {...register('crewIds')}
                form="job-edit-form"
                className={`${inputClass} h-40`}
              >
                {allCrew?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">Hold Ctrl / Cmd to select multiple</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {job.crew.map((member) => (
                <li key={member.id} className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize normal-case tracking-normal">{member.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {job.checklistItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Checklist
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              {job.checklistItems.filter((i) => i.completed).length} / {job.checklistItems.length} completed
            </span>
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {job.checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
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
                <span className={`flex-1 text-sm normal-case tracking-normal ${item.completed ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.label}
                </span>
                {item.requiresPhoto && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">Photo required</span>
                )}
                {item.photos.length > 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal">{item.photos.length} photo(s)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-400 dark:disabled:text-gray-500'

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
