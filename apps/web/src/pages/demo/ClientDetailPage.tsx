import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CLIENTS, CHECKLISTS, JOBS, getClient, formatDate, type ChecklistItem } from './_data'

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-gray-900 text-white',
  completed: 'bg-gray-100 text-gray-900',
  missed: 'bg-gray-100 text-gray-400',
}

export default function DemoClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const client = getClient(id)
  const [activeTab, setActiveTab] = useState<'details' | 'checklist'>('details')
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    CHECKLISTS[id]?.items ?? [],
  )

  const clientJobs = JOBS.filter((j) => j.clientId === id).sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime(),
  )

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Client not found.</p>
        <Link to="/demo/clients" className="mt-2 text-sm text-gray-900 hover:underline">
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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/demo/clients" className="text-sm text-gray-400 hover:text-gray-600">
            ← Clients
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{client.name}</h1>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {(['details', 'checklist', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'details' | 'checklist')}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Company / building name
              </label>
              <input
                readOnly
                value={client.name}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
              <input
                readOnly
                value={client.address}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact name</label>
              <input
                readOnly
                value={client.contactName}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact email</label>
              <input
                readOnly
                value={client.contactEmail}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              readOnly
              rows={3}
              value={client.notes || 'No notes.'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="max-w-2xl space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Checklist name</label>
              <input
                readOnly
                value={CHECKLISTS[id]?.name ?? 'Standard Checklist'}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>

            <div className="mt-6 space-y-2">
              {checklistItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3"
                >
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === checklistItems.length - 1}
                    onClick={() => moveItem(index, 1)}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                  >
                    ↓
                  </button>
                  <input
                    value={item.label}
                    onChange={(e) => updateItem(index, e.target.value)}
                    placeholder="Task description"
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900"
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
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
                    className="text-gray-300 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-4 text-sm font-medium text-gray-900 hover:underline"
            >
              + Add item
            </button>
          </div>

          <button
            onClick={() => alert('Changes saved! (demo only)')}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Save checklist
          </button>
        </div>
      )}

      {activeTab === ('history' as never) && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {clientJobs.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">No job history for this client.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Crew</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">{formatDate(job.scheduledAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status]}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{job.crewIds.length} assigned</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/demo/jobs/${job.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        View
                      </Link>
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
