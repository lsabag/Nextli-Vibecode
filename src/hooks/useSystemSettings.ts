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

  // ── Navbar popup ──
  navbar_popup_title:    'עדיין לא רשום?',
  navbar_popup_subtitle: 'בוא נמצא את המסלול שלך',
  navbar_popup_icon:     '✨',

  // ── Footer ──
  footer_text: 'Nextli וייבקוד. כל הזכויות שמורות.',

  // ── Student Workspace ──
  ws_sidebar_logo:           'Nextli: וייבקוד',
  ws_search_placeholder:     'חפש בתוכן, פרומפטים והערות...',
  ws_panel_content:          'תוכן',
  ws_panel_prompts:          'פרומפטים',
  ws_panel_notes:            'הפנקס שלי',
  ws_notes_placeholder:      'כתוב כאן את ההערות שלך... הן נשמרות אוטומטית',
  ws_notes_export:           'ייצא כטקסט',
  ws_locked_title:           'תוכן נעול',
  ws_locked_detail:          'יפתח בהמשך הקורס',
  ws_coming_soon:            'התוכן יתווסף בקרוב',
  ws_reveal_later:           'יחשף בהמשך השיעור',
  ws_prompts_empty:          'אין פרומפטים למפגש זה עדיין',
  ws_feedback_heading:       'פידבק על המפגש',
  ws_feedback_desc:          'שתפו אותנו — מה הבנתם ומה חסר לכם',
  ws_feedback_learned:       'מה למדתי במפגש הזה?',
  ws_feedback_missing:       'מה חסר לי? מה לא הבנתי?',
  ws_no_courses:             'אין קורסים פעילים',
  ws_ai_mentor_soon:         'ה-AI Mentor יהיה זמין בקרוב. עד אז — שאל בצ\'אט של קלוד!',

  // ── Onboarding ──
  ws_onboarding_heading:     'בואו נכיר אותך',
  ws_onboarding_done_title:  'תודה שמילאת!',
  ws_onboarding_done_text:   'קיבלנו את התשובות שלך. אנחנו שמחים שהצטרפת! עכשיו בואו נתחיל ללמוד.',
  ws_onboarding_done_cta:    'לאזור הלמידה',

  // ── Prep page ──
  ws_prep_heading:           'הכנה לקורס',
  ws_prep_desc:              'כדי שנוכל להתחיל ישר לבנות במפגש הראשון, יש כמה דברים שחשוב לסדר מראש. סמנו V על כל שלב שסיימתם.',
  ws_prep_done:              'כל שלבי החובה הושלמו!',
  ws_prep_cta:               'מוכנים! בואו נתחיל',

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
