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

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signOut }
}

async function fetchProfile(): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').single()
    if (error) return null
    return data as Profile
  } catch {
    return null
  }
}
