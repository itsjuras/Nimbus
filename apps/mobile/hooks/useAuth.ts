import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '@nimbus/shared'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (session) {
        fetchProfile(session.user.id).then((profile) => {
          setState({ session, user: session.user, profile, loading: false })
        })
      } else {
        setState({ session: null, user: null, profile: null, loading: false })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id).then((profile) => {
          setState({ session, user: session.user, profile, loading: false })
        })
      } else {
        setState({ session: null, user: null, profile: null, loading: false })
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signOut }
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error || !data) return null
    // Supabase returns snake_case columns — map to the shared camelCase Profile type
    const row = data as Record<string, unknown>
    return {
      id: row['id'] as string,
      companyId: row['company_id'] as string,
      role: row['role'] as Profile['role'],
      fullName: row['full_name'] as string,
      phone: (row['phone'] as string | null) ?? null,
      avatarUrl: (row['avatar_url'] as string | null) ?? null,
      payType: (row['pay_type'] as 'hourly' | 'per_job' | null) ?? null,
      payRateCents: (row['pay_rate_cents'] as number | null) ?? null,
      bankLast4: (row['bank_last4'] as string | null) ?? null,
      createdAt: row['created_at'] as string,
    }
  } catch {
    return null
  }
}
