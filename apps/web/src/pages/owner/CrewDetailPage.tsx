import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  UpdatePayRateSchema,
  SaveCrewBankSchema,
  type UpdatePayRateRequest,
  type SaveCrewBankRequest,
  type UserRole,
  type JobStatus,
} from '@nimbus/shared'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useTheme } from '../../hooks/useTheme'
import { useCrewMembers, useCrewMemberJobs, useUpdateCrewMember } from '../../hooks/useCrew'
import { useSaveCrewBank } from '../../hooks/usePayroll'

const ROLE_BADGE: Record<UserRole, string> = {
  owner: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  manager: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  crew: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

const STATUS_BADGE: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default function CrewDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { theme, toggle } = useTheme()
  const { data: crew, isLoading } = useCrewMembers()
  const { data: jobs, isLoading: jobsLoading } = useCrewMemberJobs(id)
  const updateMember = useUpdateCrewMember(id)
  const [editingPay, setEditingPay] = useState(false)

  const member = crew?.find((m) => m.id === id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePayRateRequest>({
    resolver: zodResolver(UpdatePayRateSchema),
    values: {
      payType: (member?.payType ?? 'hourly') as 'hourly' | 'per_job',
      payRateCents: member?.payRateCents ?? 0,
    },
  })

  async function onSavePay(data: UpdatePayRateRequest) {
    await updateMember.mutateAsync(data)
    setEditingPay(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Crew member not found.</p>
        <Link to="/owner/crew" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal">
          ← Back to crew
        </Link>
      </div>
    )
  }

  const completedJobs = jobs?.filter((j) => j.status === 'completed') ?? []
  const activeJobs = jobs?.filter((j) => j.status === 'in_progress' || j.status === 'scheduled') ?? []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/owner/crew" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Crew
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar: profile card + pay settings */}
        <div className="space-y-4 lg:order-last">
          {/* Profile card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xl font-semibold text-gray-700 dark:text-gray-300">
                {member.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</p>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${ROLE_BADGE[member.role]}`}>
                  {member.role}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="py-3">
                <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Phone</p>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">{member.phone ?? '—'}</p>
              </div>
              <div className="py-3">
                <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Jobs completed</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{completedJobs.length}</p>
              </div>
              <div className="py-3">
                <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Active jobs</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{activeJobs.length}</p>
              </div>
            </div>
          </div>

          {/* Pay settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pay settings</h2>
              {!editingPay && (
                <button
                  onClick={() => setEditingPay(true)}
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Edit
                </button>
              )}
            </div>

            {editingPay ? (
              <form onSubmit={handleSubmit(onSavePay)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Pay type</label>
                  <select {...register('payType')} className={inputClass}>
                    <option value="hourly">Hourly</option>
                    <option value="per_job">Per job</option>
                  </select>
                  {errors.payType && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">{errors.payType.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Rate ($ per hour / per job)
                  </label>
                  <input
                    {...register('payRateCents', {
                      setValueAs: (v) => Math.round(parseFloat(v) * 100),
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={member.payRateCents ? (member.payRateCents / 100).toFixed(2) : ''}
                    className={inputClass}
                  />
                  {errors.payRateCents && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">{errors.payRateCents.message}</p>
                  )}
                </div>

                {updateMember.error && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal">
                    {updateMember.error instanceof Error ? updateMember.error.message : 'Failed to save'}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { reset(); setEditingPay(false) }}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="py-3">
                  <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Pay type</p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal capitalize">
                    {member.payType ? member.payType.replace('_', ' ') : 'Not set'}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Rate</p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
                    {member.payRateCents ? formatCents(member.payRateCents) : 'Not set'}
                    {member.payType === 'hourly' && member.payRateCents ? '/hr' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          <BankDetailsCard
            profileId={member.id}
            fullName={member.fullName}
            bankLast4={member.bankLast4}
          />
        </div>

        {/* Main panel: job history */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:col-span-2">
          <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Job history</h2>
          </div>

          {jobsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              No jobs assigned yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                        {job.clientName ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal">
                        {new Date(job.scheduledAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${STATUS_BADGE[job.status]}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BankDetailsCard({
  profileId,
  fullName,
  bankLast4,
}: {
  profileId: string
  fullName: string
  bankLast4: string | null
}) {
  const [editing, setEditing] = useState(false)
  const saveBank = useSaveCrewBank(profileId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaveCrewBankRequest>({
    resolver: zodResolver(SaveCrewBankSchema),
    defaultValues: { accountHolderName: fullName },
  })

  async function onSave(data: SaveCrewBankRequest) {
    await saveBank.mutateAsync(data)
    reset({ accountHolderName: fullName })
    setEditing(false)
  }

  const showForm = editing || !bankLast4

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bank details</h2>
        {bankLast4 && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Replace
          </button>
        )}
      </div>

      {!showForm ? (
        <p className="text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
          Bank account ····{bankLast4}
          <span className="ml-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Connected
          </span>
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Account holder name
            </label>
            <input {...register('accountHolderName')} className={inputClass} />
            {errors.accountHolderName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">
                {errors.accountHolderName.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Routing number</label>
            <input {...register('routingNumber')} inputMode="numeric" placeholder="110000000" className={inputClass} />
            {errors.routingNumber && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">
                {errors.routingNumber.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Account number</label>
            <input {...register('accountNumber')} inputMode="numeric" placeholder="000123456789" className={inputClass} />
            {errors.accountNumber && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">
                {errors.accountNumber.message}
              </p>
            )}
          </div>

          {saveBank.error && (
            <p className="text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">
              {saveBank.error instanceof Error ? saveBank.error.message : 'Failed to save'}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { reset({ accountHolderName: fullName }); setEditing(false) }}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            Used to pay wages via direct deposit. Details go straight to Stripe — Nimbus never stores account numbers.
          </p>
        </form>
      )}
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
