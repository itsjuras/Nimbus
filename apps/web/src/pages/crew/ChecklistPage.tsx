import { useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useJob } from '../../hooks/useJobs'
import { useMarkItemComplete, useUploadPhoto, useCompleteJob } from '../../hooks/useCrewJobs'
import { useStartJob } from '../../hooks/useJobs'
import type { JobChecklistItemDetail } from '@nimbus/shared'

export default function ChecklistPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading } = useJob(id)
  const startJob = useStartJob()
  const markItem = useMarkItemComplete(id)
  const uploadPhoto = useUploadPhoto(id)
  const completeJob = useCompleteJob()
  const [completingError, setCompletingError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingPhotoItemId, setPendingPhotoItemId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Job not found.</p>
        <Link to="/crew/jobs" className="mt-2 text-sm text-gray-900">← Back</Link>
      </div>
    )
  }

  const canStart = job.status === 'scheduled'
  const isActive = job.status === 'in_progress'
  const isDone = job.status === 'completed'

  const allCompleted = job.checklistItems.every((i) => i.completed)
  const allPhotosPresent = job.checklistItems
    .filter((i) => i.requiresPhoto)
    .every((i) => i.photos.length > 0)
  const canComplete = isActive && allCompleted && allPhotosPresent

  async function handleStart() {
    await startJob.mutateAsync(id)
  }

  async function handleToggleItem(item: JobChecklistItemDetail) {
    if (!isActive) return
    await markItem.mutateAsync({
      checklistItemId: item.checklistItemId,
      completed: !item.completed,
    })
  }

  function handleCameraClick(checklistItemId: string) {
    setPendingPhotoItemId(checklistItemId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pendingPhotoItemId) return
    e.target.value = ''

    await uploadPhoto.mutateAsync({ checklistItemId: pendingPhotoItemId, file })
    setPendingPhotoItemId(null)
  }

  async function handleComplete() {
    setCompletingError(null)
    try {
      await completeJob.mutateAsync(id)
      navigate('/crew/jobs')
    } catch (err) {
      setCompletingError(err instanceof Error ? err.message : 'Failed to complete job')
    }
  }

  const completedCount = job.checklistItems.filter((i) => i.completed).length
  const progress = job.checklistItems.length > 0
    ? Math.round((completedCount / job.checklistItems.length) * 100)
    : 0

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="bg-white px-4 pb-4 pt-4 shadow-sm">
        <Link to="/crew/jobs" className="text-sm text-gray-400">← My Jobs</Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{job.clientName}</h1>
        <p className="text-sm text-gray-500">
          {new Date(job.scheduledAt).toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {isActive && job.checklistItems.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-gray-400">
              <span>{completedCount} of {job.checklistItems.length} done</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-gray-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {job.notes && (
        <div className="mx-4 mt-4 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
          <span className="font-medium">Note: </span>{job.notes}
        </div>
      )}

      {canStart && (
        <div className="mx-4 mt-6">
          <button
            onClick={handleStart}
            disabled={startJob.isPending}
            className="w-full rounded-2xl bg-gray-900 py-4 text-base font-bold text-white active:bg-gray-800 disabled:opacity-50"
          >
            {startJob.isPending ? 'Starting…' : 'Start Job'}
          </button>
        </div>
      )}

      {(isActive || isDone) && (
        <div className="flex-1 px-4 py-4">
          <ul className="space-y-3">
            {job.checklistItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => handleToggleItem(item)}
                  disabled={!isActive || markItem.isPending}
                  className="flex w-full items-center gap-4 p-4 text-left active:bg-gray-50 disabled:cursor-default"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      item.completed
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`flex-1 text-base ${
                      item.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>

                {item.requiresPhoto && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {item.photos.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          ✓ {item.photos.length} photo{item.photos.length > 1 ? 's' : ''} attached
                        </span>
                        {isActive && (
                          <button
                            onClick={() => handleCameraClick(item.checklistItemId)}
                            className="ml-auto text-sm font-medium text-gray-900"
                          >
                            Add another
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCameraClick(item.checklistItemId)}
                        disabled={!isActive || uploadPhoto.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 active:border-gray-900 active:text-gray-900 disabled:opacity-50"
                      >
                        {uploadPhoto.isPending && pendingPhotoItemId === item.checklistItemId
                          ? 'Uploading…'
                          : '📷 Take photo (required)'}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isDone && (
        <div className="mx-4 mb-6 rounded-2xl bg-gray-100 p-6 text-center">
          <p className="text-2xl">✓</p>
          <p className="mt-2 font-semibold text-gray-900">Job completed</p>
          {job.completedAt && (
            <p className="mt-1 text-sm text-gray-500">
              {new Date(job.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {isActive && (
        <div className="sticky bottom-0 bg-white px-4 py-4 shadow-[0_-1px_0_0_#e5e7eb]">
          {completingError && (
            <p className="mb-3 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-800">
              {completingError}
            </p>
          )}
          <button
            onClick={handleComplete}
            disabled={!canComplete || completeJob.isPending}
            className="w-full rounded-2xl bg-gray-900 py-4 text-base font-bold text-white active:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
          >
            {completeJob.isPending
              ? 'Completing…'
              : canComplete
              ? 'Complete Job'
              : `${job.checklistItems.length - completedCount} item${job.checklistItems.length - completedCount !== 1 ? 's' : ''} remaining`}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
