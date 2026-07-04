import { useState } from 'react'

interface DatePickerModalProps {
  open: boolean
  onClose: () => void
  value: string | null // ISO date string, e.g. "2026-07-15"
  onSelect: (isoDate: string) => void
  onClear?: () => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function DatePickerModal({ open, onClose, value, onSelect, onClear }: DatePickerModalProps) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date()
  const [current, setCurrent] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))

  if (!open) return null

  const year = current.getFullYear()
  const month = current.getMonth()
  const today = new Date()

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

  function isToday(day: number, isCurrentMonth: boolean) {
    return (
      isCurrentMonth &&
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  function isSelected(day: number, isCurrentMonth: boolean) {
    return isCurrentMonth && value === toIsoDate(year, month, day)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Due date
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
              {current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((wd, i) => (
              <div key={i} className="flex h-7 items-center justify-center text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              const selected = isSelected(cell.day, cell.current)
              const todayCell = isToday(cell.day, cell.current)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!cell.current}
                  onClick={() => onSelect(toIsoDate(year, month, cell.day))}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm normal-case tracking-normal transition-colors ${
                    !cell.current
                      ? 'text-gray-200 dark:text-gray-800 cursor-default'
                      : selected
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold'
                        : todayCell
                          ? 'font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <button
            type="button"
            onClick={() => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Today
          </button>
          {onClear && value && (
            <button
              type="button"
              onClick={() => { onClear(); onClose() }}
              className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
