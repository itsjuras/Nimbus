import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'

const SetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type SetPasswordForm = z.infer<typeof SetPasswordSchema>

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordForm>({ resolver: zodResolver(SetPasswordSchema) })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else navigate('/login', { replace: true })
    })
  }, [navigate])

  async function onSubmit(data: SetPasswordForm) {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      navigate('/crew/jobs', { replace: true })
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to set password.',
      })
    }
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Nimbus</h1>
          <p className="mt-2 text-gray-500">Set your password to get started</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl bg-white p-8 shadow-sm border border-gray-200"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Min. 8 characters"
              className={inputClass}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-gray-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={inputClass}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-gray-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200'
