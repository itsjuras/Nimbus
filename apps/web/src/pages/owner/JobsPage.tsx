import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateJobSchema, type CreateJobRequest, type JobStatus } from '@nimbus/shared'
import { useJobs, useCreateJob, useDeleteJob } from '../../hooks/useJobs'
import { useClients } from '../../hooks/useClients'
import { useCrewMembers } from '../../hooks/useCrew'

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

export default function JobsPage() {
  const [activeStatus, setActiveStatus] = useState<JobStatus | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)

  const { data: jobs, isLoading } = useJobs(activeStatus ? { status: activeStatus } : {})
  const { data: clients } = useClients()
  const { data: crew } = useCrewMembers()
  const createJob = useCreateJob()
  const deleteJob = useDeleteJob()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobRequest>({ resolver: zodResolver(CreateJobSchema) })

  const selectedClientId = watch('clientId')
  const clientChecklists = clients?.find((c) => c.id === selectedClientId)

  async function onSubmit(data: CreateJobRequest) {
    await createJob.mutateAsync(data)
    reset()
    setShowForm(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : 'Schedule job'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900">New job</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client *" error={errors.clientId?.message}>
              <select {...register('clientId')} className={inputClass}>
                <option value="">Select a client…</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Checklist *" error={errors.checklistId?.message}>
              <select {...register('checklistId')} className={inputClass} disabled={!selectedClientId}>
                <option value="">Select a client first…</option>
                {clientChecklists && (
                  <option value="">Loading…</option>
                )}
              </select>
            </Field>

            <Field label="Scheduled date & time *" error={errors.scheduledAt?.message}>
              <input
                {...register('scheduledAt')}
                type="datetime-local"
                className={inputClass}
              />
            </Field>

            <Field label="Assign crew *" error={errors.crewIds?.message}>
              <select {...register('crewIds')} multiple className={`${inputClass} h-24`}>
                {crew?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any special instructions…"
              className={`${inputClass} mt-4`}
            />
          </Field>

          {createJob.error && (
            <p className="mt-2 text-sm text-gray-700">
              {createJob.error instanceof Error ? createJob.error.message : 'Failed to create job'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling…' : 'Schedule job'}
          </button>
        </form>
      )}

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

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : jobs?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No jobs found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Scheduled</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs?.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/owner/jobs/${job.id}`} className="hover:underline">
                      {job.clientId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(job.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status]}`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/owner/jobs/${job.id}`}
                      className="mr-3 font-medium text-gray-900 hover:underline"
                    >
                      View
                    </Link>
                    {job.status === 'scheduled' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this job?')) deleteJob.mutate(job.id)
                        }}
                        className="text-gray-400 hover:text-gray-700 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error: string | undefined
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-gray-600">{error}</p>}
    </div>
  )
}
