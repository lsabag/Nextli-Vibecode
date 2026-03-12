import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { getUserProfile } from '@/lib/supabase/queries/users'
import type { UserProfile } from '@/types'

type AuthState = {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
}

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

const DEV_USER = {
  id: 'dev-admin-001',
  email: 'admin@dev.local',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Dev Admin' },
  created_at: new Date().toISOString(),
} as User

const DEV_PROFILE: UserProfile = {
  id: 'dev-admin-001',
  full_name: 'Dev Admin',
  role: 'admin',
  payment_status: 'paid',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
}

async function loadProfile(userId: string): Promise<UserProfile | null> {
  // 5-second timeout — prevents infinite hang if Supabase project is paused
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000))
  const fetch = getUserProfile(userId)
    .catch(async () => {
      // Profile may not exist yet for brand-new users (trigger race condition)
      await new Promise(r => setTimeout(r, 600))
      return getUserProfile(userId).catch(() => null)
    })
  return Promise.race([fetch, timeout])
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(
    DEV_BYPASS
      ? { user: DEV_USER, profile: DEV_PROFILE, session: null, loading: false }
      : { user: null, profile: null, session: null, loading: true }
  )

  useEffect(() => {
    if (DEV_BYPASS) return

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await loadProfile(session.user.id)
          setState({ user: session.user, profile, session, loading: false })
        } else {
          setState({ user: null, profile: null, session: null, loading: false })
        }
      })
      .catch(() => setState({ user: null, profile: null, session: null, loading: false }))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await loadProfile(session.user.id)
          setState({ user: session.user, profile, session, loading: false })
        } else {
          setState({ user: null, profile: null, session: null, loading: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return state
}
