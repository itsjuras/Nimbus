import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateClientSchema, type CreateClientRequest } from '@nimbus/shared'
import { useClients, useCreateClient, useDeleteClient } from '../../hooks/useClients'

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: clients, isLoading } = useClients()
  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()

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
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add client'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6"
        >
          <h2 className="text-base font-semibold text-gray-900">New client</h2>

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
            <p className="text-sm text-red-500">
              {createClient.error instanceof Error
                ? createClient.error.message
                : 'Failed to create client'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save client'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : clients?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No clients yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients?.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/owner/clients/${client.id}`} className="hover:text-blue-600">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {client.contactName ?? '—'}
                    {client.contactEmail && (
                      <span className="ml-1 text-gray-400">({client.contactEmail})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{client.address ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/owner/clients/${client.id}`}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${client.name}?`)) {
                          deleteClient.mutate(client.id)
                        }
                      }}
                      className="text-red-500 hover:underline"
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
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

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
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
