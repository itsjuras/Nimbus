import { useState } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateJobSchema, type CreateJobRequest, type JobStatus } from '@nimbus/shared'
import { useJobs, useCreateJob, useDeleteJob } from '../../hooks/useJobs'
import { useClients } from '../../hooks/useClients'
import { useCrewMembers } from '../../hooks/useCrew'
import { useTheme } from '../../hooks/useTheme'

const STATUS_TABS: { label: string; value: JobStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Missed', value: 'missed' },
]

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
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

  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const selectedClientId = watch('clientId')
  const clientChecklists = clients?.find((c) => c.id === selectedClientId)

  async function onSubmit(data: CreateJobRequest) {
    await createJob.mutateAsync(data)
    reset()
    setShowForm(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Jobs</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-2 text-xs font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 sm:px-4 sm:text-sm"
          >
            {showForm ? 'Cancel' : 'Schedule job'}
          </button>
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

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">New job</h2>
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
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {createJob.error instanceof Error ? createJob.error.message : 'Failed to create job'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling…' : 'Schedule job'}
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium uppercase transition-colors sm:px-4 ${
              activeStatus === tab.value
                ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : jobs?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No jobs found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 sm:px-6">Client</th>
                <th className="hidden sm:table-cell px-4 py-3 sm:px-6">Scheduled</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {jobs?.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => navigate(`/owner/jobs/${job.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100 sm:px-6">
                    <Link
                      to={`/owner/clients/${job.clientId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {job.clientId}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">
                    {new Date(job.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-normal ${STATUS_BADGE[job.status]}`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right sm:px-6">
                    <span className="mr-3 font-medium text-gray-900 dark:text-gray-100">View</span>
                    {job.status === 'scheduled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this job?')) deleteJob.mutate(job.id)
                        }}
                        className="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
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
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

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
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal">{error}</p>}
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
