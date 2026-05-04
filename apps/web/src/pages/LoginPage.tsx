import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Profile } from '@nimbus/shared'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})
type LoginRequest = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(LoginSchema) })

  async function onSubmit(data: LoginRequest) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error

      // Route based on role
      const profile = await api.get<Profile>('/api/v1/auth/me')
      if (profile.role === 'crew') {
        navigate('/crew/jobs', { replace: true })
      } else {
        navigate('/owner/dashboard', { replace: true })
      }
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Invalid email or password.',
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Nimbus</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl bg-white p-8 shadow-sm border border-gray-200"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

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
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-gray-500">
            New here?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
