import { useState } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { Modal } from '../../components/ui/Modal'
import { Link, useNavigate } from 'react-router-dom'
import type { JobStatus } from '@nimbus/shared'
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

type Recurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly'
const OCCURRENCES: Record<Recurrence, number> = { daily: 30, weekly: 52, biweekly: 26, monthly: 12 }

function roundToNextHour(): Date {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}

export default function JobsPage() {
  const [activeStatus, setActiveStatus] = useState<JobStatus | undefined>(undefined)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [jobClientId, setJobClientId] = useState('')
  const [jobCrewIds, setJobCrewIds] = useState<string[]>([])
  const [jobDate, setJobDate] = useState<Date>(roundToNextHour)
  const [jobNotes, setJobNotes] = useState('')
  const [jobIsRecurring, setJobIsRecurring] = useState(false)
  const [jobRecurrence, setJobRecurrence] = useState<Recurrence>('weekly')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [showCrewPicker, setShowCrewPicker] = useState(false)

  const { data: jobs, isLoading } = useJobs(activeStatus ? { status: activeStatus } : {})
  const { data: clients } = useClients()
  const { data: crew } = useCrewMembers()
  const createJob = useCreateJob()
  const deleteJob = useDeleteJob()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  function resetForm() {
    setJobClientId('')
    setJobCrewIds([])
    setJobDate(roundToNextHour())
    setJobNotes('')
    setJobIsRecurring(false)
    setJobRecurrence('weekly')
    setFormError('')
  }

  function handleClose() {
    resetForm()
    setShowModal(false)
  }

  async function onSubmit() {
    if (!jobClientId || jobCrewIds.length === 0) {
      setFormError('Please select a client and at least one crew member.')
      return
    }
    setFormError('')
    setIsSubmitting(true)
    try {
      await createJob.mutateAsync({
        clientId: jobClientId,
        scheduledAt: jobDate.toISOString(),
        notes: jobNotes.trim() || undefined,
        crewIds: jobCrewIds,
        ...(jobIsRecurring && {
          recurrence: { frequency: jobRecurrence, occurrences: OCCURRENCES[jobRecurrence] },
        }),
      })
      handleClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to schedule job.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClient = clients?.find((c) => c.id === jobClientId)
  const availableCrew = (crew ?? []).filter((m) => !jobCrewIds.includes(m.id))
  const canSubmit = !!jobClientId && jobCrewIds.length > 0 && !isSubmitting

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Jobs</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-2 text-xs font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 sm:px-4 sm:text-sm"
          >
            Schedule job
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

      <Modal open={showModal} onClose={handleClose} title="Schedule Job">
        <div className="space-y-6">

          {/* CLIENT */}
          <div>
            <SectionLabel label="Client" />
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{selectedClient.name}</p>
                  {selectedClient.address && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{selectedClient.address}</p>
                  )}
                </div>
                <button type="button" onClick={() => setJobClientId('')} className="ml-3 text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">×</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClientPicker(true)}
                className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors text-center"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                + Select Client
              </button>
            )}
          </div>

          {/* DATE */}
          <div>
            <SectionLabel label="Date" />
            <MiniCalendar
              selected={jobDate}
              onChange={(date) => {
                const next = new Date(jobDate)
                next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
                setJobDate(next)
              }}
            />
          </div>

          {/* TIME */}
          <div>
            <SectionLabel label="Time" />
            <TimePicker selected={jobDate} onChange={setJobDate} />
          </div>

          {/* REPEAT */}
          <div>
            <SectionLabel label="Repeat" />
            <SegmentedControl
              options={[
                { value: 'one-time', label: 'One Time' },
                { value: 'recurring', label: 'Recurring' },
              ]}
              value={jobIsRecurring ? 'recurring' : 'one-time'}
              onChange={(v) => setJobIsRecurring(v === 'recurring')}
            />
            {jobIsRecurring && (
              <div className="mt-2">
                <SegmentedControl
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'biweekly', label: 'Biweekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  value={jobRecurrence}
                  onChange={(v) => setJobRecurrence(v as Recurrence)}
                  slim
                />
              </div>
            )}
          </div>

          {/* CREW */}
          <div>
            <SectionLabel label="Crew" />
            <div className="space-y-2">
              {jobCrewIds.map((id) => {
                const member = crew?.find((m) => m.id === id)
                if (!member) return null
                return (
                  <div key={id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{member.fullName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{member.role}</p>
                    </div>
                    <button type="button" onClick={() => setJobCrewIds((prev) => prev.filter((i) => i !== id))} className="ml-3 text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">×</button>
                  </div>
                )
              })}
              {availableCrew.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCrewPicker(true)}
                  className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors text-center"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  + Add Crew Member
                </button>
              )}
            </div>
          </div>

          {/* NOTES */}
          <div>
            <SectionLabel label="Notes (optional)" />
            <textarea
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions…"
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-500 dark:text-red-400 normal-case tracking-normal">{formError}</p>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-gray-900 dark:bg-gray-100 py-3 text-sm font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {isSubmitting ? 'Scheduling…' : 'Schedule Job'}
          </button>
        </div>
      </Modal>

      {/* Client picker overlay */}
      {showClientPicker && (
        <PickerOverlay title="Select Client" onClose={() => setShowClientPicker(false)}>
          {(clients ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setJobClientId(c.id); setShowClientPicker(false) }}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{c.name}</p>
              {c.address && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">{c.address}</p>}
            </button>
          ))}
        </PickerOverlay>
      )}

      {/* Crew picker overlay */}
      {showCrewPicker && (
        <PickerOverlay title="Add Crew Member" onClose={() => setShowCrewPicker(false)}>
          {availableCrew.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">All crew members assigned</p>
          ) : availableCrew.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setJobCrewIds((prev) => [...prev, m.id]); setShowCrewPicker(false) }}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{m.fullName}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.role}</p>
            </button>
          ))}
        </PickerOverlay>
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
                      className="hover:underline normal-case tracking-normal"
                    >
                      {clients?.find((c) => c.id === job.clientId)?.name ?? job.clientId}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">
                    {new Date(job.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-normal ${STATUS_BADGE[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right sm:px-6">
                    <span className="mr-3 font-medium text-gray-900 dark:text-gray-100">View</span>
                    {job.status === 'scheduled' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this job?')) deleteJob.mutate(job.id) }}
                        className="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:underline normal-case tracking-normal"
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

// ─── Calendar ────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WDAYS = ['S','M','T','W','T','F','S']

function MiniCalendar({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const [current, setCurrent] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  type Cell = { day: number; cur: boolean }
  const cells: Cell[] = [
    ...Array.from({ length: firstDay }, (_, i) => ({ day: daysInPrevMonth - firstDay + 1 + i, cur: false })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, cur: true })),
  ]
  let t = 1
  while (cells.length % 7 !== 0) cells.push({ day: t++, cur: false })
  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const today = new Date()
  const selStr = selected.toDateString()

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-1.5 text-xl leading-none text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">‹</button>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          {MONTHS[month]!.toUpperCase()} {year}
        </span>
        <button type="button" onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-1.5 text-xl leading-none text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WDAYS.map((d, i) => (
          <div key={i} className="flex items-center justify-center py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map(({ day, cur }, di) => {
            const mOff = cur ? 0 : (di < 4 && wi === 0 ? -1 : 1)
            const date = new Date(year, month + mOff, day)
            const isSel = cur && date.toDateString() === selStr
            const isToday = cur && date.toDateString() === today.toDateString()
            return (
              <button
                key={`${wi}-${di}`}
                type="button"
                onClick={() => cur && onChange(date)}
                disabled={!cur}
                className="flex items-center justify-center py-0.5"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isSel ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold'
                  : isToday ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold'
                  : cur ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-300 dark:text-gray-700'
                }`}>
                  {day}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Time picker ─────────────────────────────────────────────────────────────

function TimePicker({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const h24 = selected.getHours()
  const h12 = h24 % 12 || 12
  const [hours, setHours] = useState(String(h12))
  const [minutes, setMinutes] = useState(String(selected.getMinutes()).padStart(2, '0'))
  const [isAM, setIsAM] = useState(h24 < 12)

  function apply(h: string, m: string, am: boolean) {
    const hNum = Math.max(1, Math.min(12, parseInt(h) || 1))
    const mNum = Math.max(0, Math.min(59, parseInt(m) || 0))
    const newH = am ? (hNum === 12 ? 0 : hNum) : (hNum === 12 ? 12 : hNum + 12)
    const next = new Date(selected)
    next.setHours(newH, mNum, 0, 0)
    onChange(next)
  }

  function handleHoursBlur() {
    const hNum = Math.max(1, Math.min(12, parseInt(hours) || 1))
    setHours(String(hNum))
    apply(String(hNum), minutes, isAM)
  }

  function handleMinutesBlur() {
    const mNum = Math.max(0, Math.min(59, parseInt(minutes) || 0))
    const padded = String(mNum).padStart(2, '0')
    setMinutes(padded)
    apply(hours, padded, isAM)
  }

  function toggleAMPM(am: boolean) {
    setIsAM(am)
    apply(hours, minutes, am)
  }

  return (
    <div className="relative flex items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
      {/* Absolutely centered so the AM/PM width doesn't shift it */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
        <input
          type="text"
          value={hours}
          onChange={(e) => setHours(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={handleHoursBlur}
          onFocus={(e) => e.target.select()}
          placeholder="12"
          maxLength={2}
          className="w-12 bg-transparent text-center text-2xl font-semibold normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none pointer-events-auto"
        />
        <span className="text-xl font-bold text-gray-300 dark:text-gray-600">:</span>
        <input
          type="text"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={handleMinutesBlur}
          onFocus={(e) => e.target.select()}
          placeholder="00"
          maxLength={2}
          className="w-12 bg-transparent text-center text-2xl font-semibold normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none pointer-events-auto"
        />
      </div>
      {/* Invisible spacer so the container has height */}
      <span className="invisible text-2xl">00:00</span>
      <div className="ml-auto flex rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleAMPM(true)}
          className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${
            isAM
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => toggleAMPM(false)}
          className={`px-3 py-1.5 text-[11px] font-bold transition-colors border-l border-gray-200 dark:border-gray-800 ${
            !isAM
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          PM
        </button>
      </div>
    </div>
  )
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function PickerOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{title}</h3>
          <button type="button" onClick={onClose} className="text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">×</button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3 space-y-2">{children}</div>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">{label}</p>
}

function SegmentedControl({ options, value, onChange, slim }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; slim?: boolean }) {
  return (
    <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg font-bold uppercase tracking-wider transition-colors ${slim ? 'py-1.5 text-[10px]' : 'py-2 text-xs'} ${
            value === opt.value
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
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
