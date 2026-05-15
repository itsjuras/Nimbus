import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateClientSchema, type CreateClientRequest } from '@nimbus/shared'
import { useClients, useCreateClient, useDeleteClient } from '../../hooks/useClients'
import { useTheme } from '../../hooks/useTheme'

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: clients, isLoading } = useClients()
  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientRequest>({ resolver: zodResolver(CreateClientSchema) })

  async function onSubmit(data: CreateClientRequest) {
    await createClient.mutateAsync(data)
    reset()
    setShowForm(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
          >
            {showForm ? 'Cancel' : 'Add client'}
          </button>
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

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">New client</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / building name *" error={errors.name?.message}>
              <input {...register('name')} placeholder="Acme HQ" className={inputClass} />
            </Field>
            <Field label="Address" error={errors.address?.message}>
              <input {...register('address')} placeholder="123 Main St" className={inputClass} />
            </Field>
            <Field label="Contact name" error={errors.contactName?.message}>
              <input {...register('contactName')} placeholder="John Doe" className={inputClass} />
            </Field>
            <Field label="Contact email" error={errors.contactEmail?.message}>
              <input
                {...register('contactEmail')}
                type="email"
                placeholder="john@acme.com"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Access codes, special instructions…"
              className={inputClass}
            />
          </Field>

          {createClient.error && (
            <p className="text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
              {createClient.error instanceof Error ? createClient.error.message : 'Failed to create client'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save client'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : clients?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">No clients yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {clients?.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/owner/clients/${client.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal">
                    {client.contactName ?? '—'}
                    {client.contactEmail && (
                      <span className="ml-1 text-gray-400 dark:text-gray-500">({client.contactEmail})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal">{client.address ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="mr-3 font-medium text-gray-900 dark:text-gray-100">View</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete ${client.name}?`)) deleteClient.mutate(client.id)
                      }}
                      className="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                    >
                      Delete
                    </button>
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

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

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
