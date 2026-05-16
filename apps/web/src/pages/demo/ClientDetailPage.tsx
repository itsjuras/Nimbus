import { useState } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CLIENTS, CHECKLISTS, JOBS, getClient, formatDate, type ChecklistItem } from './_data'
import { useTheme } from '../../hooks/useTheme'

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  missed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

export default function DemoClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const client = getClient(id)
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'history'>('details')
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    CHECKLISTS[id]?.items ?? [],
  )

  const clientJobs = JOBS.filter((j) => j.clientId === id).sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime(),
  )

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Client not found.</p>
        <Link to="/demo/clients" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal">
          ← Back to clients
        </Link>
      </div>
    )
  }

  function moveItem(index: number, direction: -1 | 1) {
    setChecklistItems((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const a = next[index]!
      const b = next[target]!
      next[index] = b
      next[target] = a
      return next
    })
  }

  function removeItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index))
  }

  function addItem() {
    setChecklistItems((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, label: '', requiresPhoto: false, position: prev.length },
    ])
  }

  function updateItem(index: number, label: string) {
    setChecklistItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, label } : item)),
    )
  }

  function togglePhoto(index: number) {
    setChecklistItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, requiresPhoto: !item.requiresPhoto } : item)),
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/demo/clients" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Clients
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{client.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled
            title="Not available in demo"
            className="cursor-not-allowed rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 opacity-40"
          >
            Edit client
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

      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(['details', 'checklist', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium uppercase transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Company / building name', value: client.name },
              { label: 'Address', value: client.address },
              { label: 'Contact name', value: client.contactName },
              { label: 'Contact email', value: client.contactEmail },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <input
                  readOnly
                  value={value}
                  className={readonlyInputClass}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              readOnly
              rows={3}
              value={client.notes || 'No notes.'}
              className={readonlyInputClass}
            />
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Checklist name</label>
              <input
                readOnly
                value={CHECKLISTS[id]?.name ?? 'Standard Checklist'}
                className={readonlyInputClass}
              />
            </div>

            <div className="mt-6 space-y-2">
              {checklistItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3"
                >
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === checklistItems.length - 1}
                    onClick={() => moveItem(index, 1)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20"
                  >
                    ↓
                  </button>
                  <input
                    value={item.label}
                    onChange={(e) => updateItem(index, e.target.value)}
                    placeholder="Task description"
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">
                    <input
                      type="checkbox"
                      checked={item.requiresPhoto}
                      onChange={() => togglePhoto(index)}
                      className="rounded"
                    />
                    Photo required
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal"
            >
              + Add item
            </button>
          </div>

          <button
            onClick={() => alert('Changes saved! (demo only)')}
            className="mx-auto block rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
          >
            Save checklist
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {clientJobs.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">No job history for this client.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Date</th>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                  <th className="hidden sm:table-cell px-4 py-3 sm:px-6">Crew</th>
                  <th className="px-4 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {clientJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/demo/jobs/${job.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300 normal-case tracking-normal sm:px-6">{formatDate(job.scheduledAt)}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-normal ${STATUS_BADGE[job.status]}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 sm:px-6">{job.crewIds.length} assigned</td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <span className="font-medium text-gray-900 dark:text-gray-100">View</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
