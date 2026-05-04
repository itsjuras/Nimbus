import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
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
        fetchProfile().then((profile) => {
          setState({ session, user: session.user, profile, loading: false })
        })
      } else {
        setState({ session: null, user: null, profile: null, loading: false })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile().then((profile) => {
          setState({ session, user: session.user, profile, loading: false })
        })
      } else {
        setState({ session: null, user: null, profile: null, loading: false })
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...state, signOut }
}

async function fetchProfile(): Promise<Profile | null> {
  try {
    return await api.get<Profile>('/api/v1/auth/me')
  } catch {
    return null
  }
}
