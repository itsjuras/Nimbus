import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InviteCrewSchema, type InviteCrewRequest, type UserRole } from '@nimbus/shared'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useTheme } from '../../hooks/useTheme'
import { useCrewMembers, useInviteCrew } from '../../hooks/useCrew'

const ROLE_BADGE: Record<UserRole, string> = {
  owner: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  manager: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  crew: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

export default function CrewPage() {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const { data: crew, isLoading } = useCrewMembers()
  const inviteCrew = useInviteCrew()
  const [showInvite, setShowInvite] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteCrewRequest>({
    resolver: zodResolver(InviteCrewSchema),
    defaultValues: { role: 'crew' },
  })

  async function onInvite(data: InviteCrewRequest) {
    await inviteCrew.mutateAsync(data)
    reset()
    setShowInvite(false)
  }

  function handleCancel() {
    reset()
    inviteCrew.reset()
    setShowInvite(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crew</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
          >
            {showInvite ? 'Cancel' : 'Invite crew'}
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

      {showInvite && (
        <form
          onSubmit={handleSubmit(onInvite)}
          className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Invite a crew member</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 normal-case tracking-normal">
            They'll receive an email with a link to set their password and access the app.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Full name *</label>
              <input
                {...register('fullName')}
                placeholder="Jane Smith"
                className={inputClass}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
              <input
                {...register('email')}
                type="email"
                placeholder="jane@example.com"
                className={inputClass}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+1 (555) 000-0000"
                className={inputClass}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role *</label>
              <select {...register('role')} className={inputClass}>
                <option value="crew">Crew</option>
                <option value="manager">Manager</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">{errors.role.message}</p>
              )}
            </div>
          </div>

          {inviteCrew.error && (
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
              {inviteCrew.error instanceof Error ? inviteCrew.error.message : 'Failed to send invite'}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending…' : 'Send invite'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 sm:px-6">Name</th>
                <th className="px-4 py-3 sm:px-6">Role</th>
                <th className="hidden sm:table-cell px-4 py-3 sm:px-6">Phone</th>
                <th className="px-4 py-3 sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {crew?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                    No crew members yet. Invite someone to get started.
                  </td>
                </tr>
              )}
              {crew?.map((member) => (
                <tr key={member.id} onClick={() => navigate(`/owner/crew/${member.id}`)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${ROLE_BADGE[member.role]}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">
                    {member.phone ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-right sm:px-6">
                    <span className="font-medium text-gray-900 dark:text-gray-100">View</span>
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
