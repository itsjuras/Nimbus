import { useState } from 'react'
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

export default function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'details' | 'checklist'>('details')

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
  }

  async function onSaveChecklist(data: ReplaceChecklistRequest) {
    const withPositions: ReplaceChecklistRequest = {
      ...data,
      items: data.items.map((item, i) => ({ ...item, position: i })),
    }
    await replaceChecklist.mutateAsync(withPositions)
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Client not found.</p>
        <Link to="/owner/clients" className="mt-2 text-sm text-gray-900 hover:underline">
          Back to clients
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/owner/clients" className="text-sm text-gray-400 hover:text-gray-600">
            ← Clients
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{client.name}</h1>
        </div>
        <button onClick={onDelete} className="text-sm text-gray-400 hover:text-gray-700 hover:underline">
          Delete client
        </button>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {(['details', 'checklist'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
        <form
          onSubmit={detailForm.handleSubmit(onSaveDetails)}
          className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / building name *" error={detailForm.formState.errors.name?.message}>
              <input {...detailForm.register('name')} className={inputClass} />
            </Field>
            <Field label="Address" error={detailForm.formState.errors.address?.message}>
              <input {...detailForm.register('address')} className={inputClass} />
            </Field>
            <Field label="Contact name" error={detailForm.formState.errors.contactName?.message}>
              <input {...detailForm.register('contactName')} className={inputClass} />
            </Field>
            <Field label="Contact email" error={detailForm.formState.errors.contactEmail?.message}>
              <input {...detailForm.register('contactEmail')} type="email" className={inputClass} />
            </Field>
          </div>
          <Field label="Notes" error={detailForm.formState.errors.notes?.message}>
            <textarea {...detailForm.register('notes')} rows={4} className={inputClass} />
          </Field>
          <button
            type="submit"
            disabled={detailForm.formState.isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {detailForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      {activeTab === 'checklist' && (
        <form
          onSubmit={checklistForm.handleSubmit(onSaveChecklist)}
          className="max-w-2xl space-y-4"
        >
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <Field
              label="Checklist name"
              error={checklistForm.formState.errors.name?.message}
            >
              <input {...checklistForm.register('name')} className={inputClass} />
            </Field>

            <div className="mt-6 space-y-2">
              {fields.length === 0 && (
                <p className="text-sm text-gray-400">No items yet. Add one below.</p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <input
                    {...checklistForm.register(`items.${index}.label`)}
                    placeholder="Task description"
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                    <input
                      type="checkbox"
                      {...checklistForm.register(`items.${index}.requiresPhoto`)}
                      className="rounded"
                    />
                    Photo required
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-300 hover:text-gray-600"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ label: '', requiresPhoto: false, position: fields.length })}
              className="mt-4 text-sm font-medium text-gray-900 hover:underline"
            >
              + Add item
            </button>
          </div>

          <button
            type="submit"
            disabled={checklistForm.formState.isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {checklistForm.formState.isSubmitting ? 'Saving…' : 'Save checklist'}
          </button>
        </form>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200'

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
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-gray-600">{error}</p>}
    </div>
  )
}
