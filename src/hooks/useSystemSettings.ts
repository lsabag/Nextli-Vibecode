import { useState, useEffect } from 'react'
import { getSystemSettings } from '@/lib/supabase/queries/landing'
import type { SystemSettingsMap } from '@/types'

type SettingsState = {
  settings: SystemSettingsMap
  loading: boolean
}

// Mirrors the seed values in migration 3 — used as fallback if DB fetch fails
const DEFAULT_SETTINGS: SystemSettingsMap = {
  // ── Hero ──
  hero_headline:    'מרעיון למוצר',
  hero_subheadline: 'תוך 3 מפגשים',
  hero_description: 'לומדים לבנות מוצרים דיגיטליים אמיתיים עם AI — בלי ניסיון קודם בקוד',
  hero_badge_text:  'סטודיו אינטנסיבי (hands-on) — Vibe Coding',
  hero_badge_link:  '',
  hero_cta_primary: 'הצטרף עכשיו',
  hero_cta_secondary: 'ראה את המסלול',
  hero_features:    JSON.stringify([
    { icon: '⚡', label: 'AI-First Development', desc: 'בונים עם AI מהיום הראשון' },
    { icon: '🛠️', label: 'Vibe Coding Matrix', desc: 'מתודולוגיה ייחודית שלנו' },
    { icon: '🚀', label: 'Ship in 3 Sessions', desc: 'מוצר אמיתי תוך שבועיים' },
    { icon: '💬', label: 'Prompt Engineering', desc: 'לדבר עם AI ב-Spec & Prompt' },
  ]),

  // ── Syllabus ──
  syllabus_heading:    'מסלול ה-המראה שלך',
  syllabus_subheading: 'שלושה מפגשים אינטנסיביים — מאפס לפרודקשן',
  syllabus_badges:     JSON.stringify({ 1: { icon: '🎯', badge: 'Kickoff' }, 2: { icon: '⚙️', badge: 'Deep Dive' }, 3: { icon: '🚀', badge: 'Launch' } }),

  // ── Projects ──
  projects_heading:    'הפרויקטים של התלמידים',
  projects_subheading: 'הפרויקטים שנבנו בתוכנית — כל מפגש מסתיים בפרודקט אמיתי',

  // ── Additional Courses ──
  courses_heading:    'קורסים נוספים',
  courses_subheading: 'המשך הדרך — עוד כלים, עוד מוצרים',

  // ── Team ──
  team_heading:    'הנבחרת שלנו',
  team_subheading: 'אנשים שבנו מוצרים אמיתיים — ועכשיו מלמדים אתכם',

  // ── Contact ──
  contact_heading:    'בואו נדבר',
  contact_description: 'יש שאלות? רוצים לדעת עוד לפני שנרשמים? אנחנו כאן.',
  contact_success:    'ההודעה נשלחה! נחזור אליך בקרוב.',
  contact_email:      '',
  contact_phone:      '',

  // ── Navbar ──
  navbar_links: JSON.stringify([
    { label: 'מסלול', href: '#syllabus' },
    { label: 'פרויקטים', href: '#projects' },
    { label: 'הצוות', href: '#team' },
    { label: 'יצירת קשר', href: '#contact' },
  ]),

  // ── Footer ──
  footer_text: 'Nextli וייבקוד. כל הזכויות שמורות.',

  // ── FOMO ──
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
