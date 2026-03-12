import { Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

type Props = {
  children: React.ReactNode
  user: User | null
  profile?: UserProfile | null
  requireAdmin?: boolean
  requirePaid?: boolean
}

export function ProtectedRoute({ children, user, profile, requireAdmin, requirePaid }: Props) {
  if (!user) return <Navigate to="/login" replace />

  if (requireAdmin) {
    if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />
  }

  if (requirePaid) {
    if (!profile || profile.payment_status !== 'paid') return <Navigate to="/" replace />
  }

  return <>{children}</>
}
