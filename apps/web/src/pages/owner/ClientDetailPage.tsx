import { useState } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  UpdateClientSchema,
  ReplaceChecklistSchema,
  type UpdateClientRequest,
  type ReplaceChecklistRequest,
} from '@nimbus/shared'
import { useClient, useUpdateClient, useDeleteClient } from '../../hooks/useClients'
import { useChecklist, useReplaceChecklist } from '../../hooks/useChecklist'
import { useTheme } from '../../hooks/useTheme'

export default function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [activeTab, setActiveTab] = useState<'details' | 'checklist'>('details')
  const [isEditing, setIsEditing] = useState(false)

  const { data: client, isLoading } = useClient(id)
  const updateClient = useUpdateClient(id)
  const deleteClient = useDeleteClient()
  const { data: checklistData } = useChecklist(id)
  const replaceChecklist = useReplaceChecklist(id)

  const detailForm = useForm<UpdateClientRequest>({
    resolver: zodResolver(UpdateClientSchema),
    ...(client && {
      values: {
        name: client.name,
        address: client.address ?? undefined,
        contactName: client.contactName ?? undefined,
        contactEmail: client.contactEmail ?? undefined,
        notes: client.notes ?? undefined,
      },
    }),
  })

  const checklistForm = useForm<ReplaceChecklistRequest>({
    resolver: zodResolver(ReplaceChecklistSchema),
    values: checklistData
      ? {
          name: checklistData.checklist.name,
          items: checklistData.items.map((item) => ({
            label: item.label,
            requiresPhoto: item.requiresPhoto,
            position: item.position,
          })),
        }
      : { name: 'Standard Checklist', items: [] },
  })

  const { fields, append, remove, move } = useFieldArray({
    control: checklistForm.control,
    name: 'items',
  })

  async function onSaveDetails(data: UpdateClientRequest) {
    await updateClient.mutateAsync(data)
    setIsEditing(false)
  }

  async function onSaveChecklist(data: ReplaceChecklistRequest) {
    const withPositions: ReplaceChecklistRequest = {
      ...data,
      items: data.items.map((item, i) => ({ ...item, position: i })),
    }
    await replaceChecklist.mutateAsync(withPositions)
    setIsEditing(false)
  }

  function onDiscard() {
    detailForm.reset()
    checklistForm.reset()
    setIsEditing(false)
  }

  async function onDelete() {
    if (!client) return
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return
    await deleteClient.mutateAsync(id)
    navigate('/owner/clients')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">Client not found.</p>
        <Link to="/owner/clients" className="mt-2 text-sm text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal">
          Back to clients
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/owner/clients" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Clients
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{client.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={onDelete}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
              >
                Delete client
              </button>
              <button
                onClick={onDiscard}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Discard
              </button>
              <button
                form={activeTab === 'details' ? 'client-detail-form' : 'client-checklist-form'}
                type="submit"
                className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
            >
              Edit client
            </button>
          )}
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
        {(['details', 'checklist'] as const).map((tab) => (
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
        <form
          id="client-detail-form"
          onSubmit={detailForm.handleSubmit(onSaveDetails)}
          className="mx-auto max-w-2xl space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / building name *" error={detailForm.formState.errors.name?.message}>
              <input {...detailForm.register('name')} disabled={!isEditing} className={inputClass} />
            </Field>
            <Field label="Address" error={detailForm.formState.errors.address?.message}>
              <input {...detailForm.register('address')} disabled={!isEditing} className={inputClass} />
            </Field>
            <Field label="Contact name" error={detailForm.formState.errors.contactName?.message}>
              <input {...detailForm.register('contactName')} disabled={!isEditing} className={inputClass} />
            </Field>
            <Field label="Contact email" error={detailForm.formState.errors.contactEmail?.message}>
              <input {...detailForm.register('contactEmail')} type="email" disabled={!isEditing} className={inputClass} />
            </Field>
          </div>
          <Field label="Notes" error={detailForm.formState.errors.notes?.message}>
            <textarea {...detailForm.register('notes')} rows={4} disabled={!isEditing} className={inputClass} />
          </Field>
        </form>
      )}

      {activeTab === 'checklist' && (
        <form
          id="client-checklist-form"
          onSubmit={checklistForm.handleSubmit(onSaveChecklist)}
          className="mx-auto max-w-2xl space-y-4"
        >
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <Field
              label="Checklist name"
              error={checklistForm.formState.errors.name?.message}
            >
              <input {...checklistForm.register('name')} disabled={!isEditing} className={inputClass} />
            </Field>

            <div className="mt-6 space-y-2">
              {fields.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">No items yet. Add one below.</p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                  <button
                    type="button"
                    disabled={!isEditing || index === 0}
                    onClick={() => move(index, index - 1)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={!isEditing || index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <input
                    {...checklistForm.register(`items.${index}.label`)}
                    disabled={!isEditing}
                    placeholder="Task description"
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-300 dark:placeholder:text-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-400 dark:disabled:text-gray-500"
                  />
                  <label className={`flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                    <input
                      type="checkbox"
                      {...checklistForm.register(`items.${index}.requiresPhoto`)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    Photo required
                  </label>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => remove(index)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-0 disabled:pointer-events-none"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={() => append({ label: '', requiresPhoto: false, position: fields.length })}
                className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal"
              >
                + Add item
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-400 dark:disabled:text-gray-500'

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
