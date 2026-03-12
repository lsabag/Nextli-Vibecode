import { useState, useEffect } from 'react'
import { getSystemSettings } from '@/lib/supabase/queries/landing'
import type { SystemSettingsMap } from '@/types'

type SettingsState = {
  settings: SystemSettingsMap
  loading: boolean
}

// Mirrors the seed values in migration 3 — used as fallback if DB fetch fails
const DEFAULT_SETTINGS: SystemSettingsMap = {
  hero_headline:    'מרעיון למוצר',
  hero_subheadline: 'תוך 3 מפגשים',
  hero_description: 'לומדים לבנות מוצרים דיגיטליים אמיתיים עם AI — בלי ניסיון קודם בקוד',
  contact_email:    '',
  contact_phone:    '',
  fomo_banner_active: 'false',
  fomo_text: '',
}

export function useSystemSettings(): SettingsState {
  const [state, setState] = useState<SettingsState>({ settings: DEFAULT_SETTINGS, loading: true })

  useEffect(() => {
    getSystemSettings()
      .then(dbSettings => setState({ settings: { ...DEFAULT_SETTINGS, ...dbSettings }, loading: false }))
      .catch(() => setState({ settings: DEFAULT_SETTINGS, loading: false }))
  }, [])

  return state
}
