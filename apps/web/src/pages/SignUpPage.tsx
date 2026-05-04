import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { SignUpSchema, type SignUpRequest } from '@nimbus/shared'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function SignUpPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpRequest>({ resolver: zodResolver(SignUpSchema) })

  async function onSubmit(data: SignUpRequest) {
    try {
      await api.post('/api/v1/auth/signup', data)
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      navigate('/owner/dashboard', { replace: true })
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Sign up failed. Please try again.',
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Nimbus</h1>
          <p className="mt-2 text-gray-600">Set up your cleaning company</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl bg-white p-8 shadow-sm border border-gray-200"
        >
          <Field label="Company name" error={errors.companyName?.message}>
            <input
              {...register('companyName')}
              placeholder="Sparkle Cleaning Co."
              className={inputClass}
            />
          </Field>

          <Field label="Your full name" error={errors.fullName?.message}>
            <input {...register('fullName')} placeholder="Jane Smith" className={inputClass} />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="jane@example.com"
              className={inputClass}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder="Min. 8 characters"
              className={inputClass}
            />
          </Field>

          {errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
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
