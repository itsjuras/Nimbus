import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateJobSchema, type UpdateJobRequest, type JobStatus } from '@nimbus/shared'
import { useJob, useUpdateJob, useDeleteJob } from '../../hooks/useJobs'
import { useCrewMembers } from '../../hooks/useCrew'

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-gray-900 text-white',
  completed: 'bg-gray-100 text-gray-900',
  missed: 'bg-gray-100 text-gray-400',
}

export default function JobDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: job, isLoading } = useJob(id)
  const { data: allCrew } = useCrewMembers()
  const updateJob = useUpdateJob(id)
  const deleteJob = useDeleteJob()

  const {
    register,
    handleSubmit,
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
  }

  async function onDelete() {
    if (!confirm('Delete this job? This cannot be undone.')) return
    await deleteJob.mutateAsync(id)
    navigate('/owner/jobs')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Job not found.</p>
        <Link to="/owner/jobs" className="mt-2 text-sm text-gray-900 hover:underline">
          Back to jobs
        </Link>
      </div>
    )
  }

  const isEditable = job.status === 'scheduled'

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link to="/owner/jobs" className="text-sm text-gray-400 hover:text-gray-600">
            ← Jobs
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{job.clientName}</h1>
          <p className="text-sm text-gray-500">{job.checklistName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[job.status]}`}>
            {job.status.replace('_', ' ')}
          </span>
          {isEditable && (
            <button onClick={onDelete} className="text-sm text-gray-400 hover:text-gray-700 hover:underline">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit(onSave)}
          className="lg:col-span-2 space-y-4 rounded-xl border border-gray-200 bg-white p-6"
        >
          <h2 className="text-base font-semibold text-gray-900">Job details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Scheduled date & time
            </label>
            <input
              {...register('scheduledAt')}
              type="datetime-local"
              disabled={!isEditable}
              className={inputClass}
            />
            {errors.scheduledAt && (
              <p className="mt-1 text-xs text-gray-600">{errors.scheduledAt.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              disabled={!isEditable}
              className={inputClass}
            />
          </div>

          {isEditable && (
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </form>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Crew</h2>
          {isEditable ? (
            <div>
              <select
                multiple
                {...register('crewIds')}
                className={`${inputClass} h-40`}
              >
                {allCrew?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Hold Ctrl / Cmd to select multiple</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {job.crew.map((member) => (
                <li key={member.id} className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                    <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {job.checklistItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Checklist progress
            <span className="ml-2 text-sm font-normal text-gray-400">
              {job.checklistItems.filter((i) => i.completed).length} /{' '}
              {job.checklistItems.length} completed
            </span>
          </h2>
          <ul className="divide-y divide-gray-100">
            {job.checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    item.completed
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {item.completed && '✓'}
                </span>
                <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                {item.requiresPhoto && (
                  <span className="text-xs text-gray-400">📷 required</span>
                )}
                {item.photos.length > 0 && (
                  <span className="text-xs text-gray-600">{item.photos.length} photo(s)</span>
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
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
