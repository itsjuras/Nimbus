import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { JOBS, getClient, type JobStatus } from './_data'
import { useTheme } from '../../hooks/useTheme'

const CHIP: Record<JobStatus, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

const STATUS_LABEL: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  missed: 'Missed',
}

export default function DemoCalendarPage() {
  const { theme, toggle } = useTheme()
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      setCurrent(new Date(year, delta < 0 ? month + 1 : month - 1, 1))
    }
    touchStartX.current = null
  }

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const leading = Array.from({ length: firstDayOfWeek }, (_, i) => ({
    day: prevMonthLastDay - firstDayOfWeek + 1 + i,
    current: false,
  }))
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, current: true }))
  const trailingCount = (7 - ((leading.length + currentDays.length) % 7)) % 7
  const trailing = Array.from({ length: trailingCount }, (_, i) => ({ day: i + 1, current: false }))
  const cells = [...leading, ...currentDays, ...trailing]

  const today = new Date()

  const jobsForDay = (day: number) =>
    JOBS.filter((j) => {
      const d = j.scheduledAt
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })

  return (
    <div
      className="flex h-full flex-col p-4 sm:p-6 lg:p-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="shrink-0 text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <div className="flex w-full items-center justify-center gap-2 order-last sm:order-none sm:w-auto sm:flex-1">
          <button
            onClick={() => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Today
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ←
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
            {current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
          >
            →
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-3 ml-auto sm:ml-0">
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

      <div className="mb-1 grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-medium uppercase text-gray-400 dark:text-gray-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-800">
        {cells.map(({ day, current: isCurrentMonth }, i) => {
          const dayJobs = isCurrentMonth ? jobsForDay(day) : []
          const isToday =
            isCurrentMonth &&
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          return (
            <div
              key={i}
              onClick={() => isCurrentMonth && setSelectedDay(day)}
              className={`min-h-[72px] p-1.5 sm:min-h-[100px] sm:p-2 ${
                isCurrentMonth
                  ? 'bg-white dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors'
                  : 'bg-gray-50 dark:bg-gray-800/40'
              }`}
            >
              <span
                className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : isCurrentMonth
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {day}
              </span>
              {isCurrentMonth && (
                <div className="space-y-0.5">
                  {dayJobs.map((job) => {
                    const client = getClient(job.clientId)
                    return (
                      <div
                        key={job.id}
                        className={`truncate rounded px-1.5 py-0.5 text-xs font-medium normal-case tracking-normal ${CHIP[job.status]}`}
                      >
                        {client?.name ?? '—'}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedDay !== null && (() => {
        const modalJobs = jobsForDay(selectedDay)
        const dateLabel = new Date(year, month, selectedDay).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
        })
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                  {dateLabel}
                </h2>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <div className="px-3 py-3">
                {modalJobs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                    No jobs scheduled
                  </p>
                ) : (
                  <div className="space-y-1">
                    {modalJobs.map((job) => {
                      const client = getClient(job.clientId)
                      return (
                        <Link
                          key={job.id}
                          to={`/demo/jobs/${job.id}`}
                          onClick={() => setSelectedDay(null)}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                              {client?.name ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                              {job.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`ml-3 shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${CHIP[job.status]}`}>
                            {STATUS_LABEL[job.status]}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
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
