import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { SignUpSchema, type SignUpRequest } from '@nimbus/shared'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import { ShaderBackground } from '../components/ui/shader-background'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

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
    <div className="min-h-screen font-plex uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ wordSpacing: '-0.3em' }}>
      <ShaderBackground isDark={theme === 'dark'} />
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-white/60 dark:bg-black/60" />

      {/* ── Theme toggle ── */}
      <div className="fixed right-6 top-6 z-50">
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

      {/* ── Form ── */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <Link to="/" className="text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100">
              Nimbus
            </Link>
            <p className="mt-2 text-xs font-medium tracking-widest text-gray-400 dark:text-gray-500">
              Set up your cleaning company
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-2xl border border-gray-200/60 bg-white/80 p-8 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/80"
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
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gray-900 py-3 text-xs font-bold tracking-widest text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-gray-900 hover:underline dark:text-gray-100">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white/50 px-3 py-2.5 text-sm normal-case tracking-normal outline-none transition-colors placeholder:text-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800'

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
      <label className="mb-1.5 block text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs normal-case tracking-normal text-gray-500 dark:text-gray-400">{error}</p>}
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
