import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink, BellOff } from 'lucide-react'

type Severity = 'critical' | 'error' | 'warn' | 'info'
type CheckItem = {
  id: string
  category: string
  label: string
  severity: Severity
  detail: string
  action?: { label: string; tab?: string; href?: string }
}

const severityOrder: Record<Severity, number> = { critical: 0, error: 1, warn: 2, info: 3 }

const severityIcon: Record<Severity, React.ElementType> = {
  critical: XCircle,
  error: XCircle,
  warn: AlertTriangle,
  info: AlertTriangle,
}
const severityColor: Record<Severity, string> = {
  critical: 'text-red-400',
  error: 'text-red-400',
  warn: 'text-yellow-400',
  info: 'text-blue-400',
}
const severityBg: Record<Severity, string> = {
  critical: 'bg-red-500/10 border-red-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  warn: 'bg-yellow-500/10 border-yellow-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
}
const severityLabel: Record<Severity, string> = {
  critical: 'קריטי',
  error: 'שגיאה',
  warn: 'אזהרה',
  info: 'מידע',
}

// ── Snooze persistence via localStorage ──────────────────────────────────────

const SNOOZE_KEY = 'health-check-snoozed'

function getSnoozed(): Set<string> {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function setSnoozed(ids: Set<string>) {
  localStorage.setItem(SNOOZE_KEY, JSON.stringify([...ids]))
}

// ── Checks ───────────────────────────────────────────────────────────────────

async function runChecks(): Promise<CheckItem[]> {
  const items: CheckItem[] = []

  // ── Courses ─────────────────────────────────────────────────────────────
  const { data: courses } = await supabase.from('courses').select('*')
  const courseList = (courses ?? []) as Record<string, unknown>[]

  if (courseList.length === 0) {
    items.push({
      id: 'no-courses',
      category: 'קורסים',
      label: 'אין קורסים במערכת',
      severity: 'critical',
      detail: 'צור לפחות קורס אחד כדי שהפלטפורמה תעבוד.',
      action: { label: 'ניהול קורסים', tab: 'courses&sub=manage' },
    })
  } else {
    const activeCourses = courseList.filter(c => c.status === 'active' || c.status === 'completed')
    if (activeCourses.length === 0) {
      items.push({
        id: 'no-active-courses',
        category: 'קורסים',
        label: 'אין קורסים פעילים',
        severity: 'error',
        detail: 'כל הקורסים בסטטוס טיוטה. תלמידים לא יראו כלום ב-workspace.',
        action: { label: 'ניהול קורסים', tab: 'courses&sub=manage' },
      })
    }

    for (const course of courseList) {
      if (!course.title || (course.title as string).trim() === '') {
        items.push({
          id: `course-no-title-${course.id}`,
          category: 'קורסים',
          label: `קורס ללא כותרת (${(course.id as string).slice(0, 8)}...)`,
          severity: 'warn',
          detail: 'לקורס חסרה כותרת — יופיע ריק ברשימה.',
          action: { label: 'ערוך קורס', tab: 'courses&sub=manage' },
        })
      }
    }
  }

  // ── Sessions ────────────────────────────────────────────────────────────
  const { data: sessions } = await supabase.from('course_sessions').select('*')
  const sessionList = (sessions ?? []) as Record<string, unknown>[]

  for (const course of courseList) {
    const courseSessions = sessionList.filter(s => s.course_id === course.id)
    if (courseSessions.length === 0 && (course.status === 'active' || course.status === 'completed')) {
      items.push({
        id: `no-sessions-${course.id}`,
        category: 'מפגשים',
        label: `לקורס "${course.title}" אין מפגשים`,
        severity: 'critical',
        detail: 'קורס פעיל בלי מפגשים — התלמידים יראו רשימה ריקה.',
        action: { label: 'נהל מפגשים', tab: 'courses&sub=manage' },
      })
    }

    const openSessions = courseSessions.filter(s => s.status === 'open')
    if (openSessions.length === 0 && courseSessions.length > 0 && course.status === 'active') {
      items.push({
        id: `no-open-sessions-${course.id}`,
        category: 'מפגשים',
        label: `כל המפגשים נעולים בקורס "${course.title}"`,
        severity: 'warn',
        detail: 'אין מפגשים פתוחים — התלמידים לא יכולים לגשת לתוכן.',
        action: { label: 'נהל מפגשים', tab: 'courses&sub=manage' },
      })
    }

    for (const s of courseSessions) {
      if (!s.title || (s.title as string).trim() === '') {
        items.push({
          id: `session-no-title-${s.id}`,
          category: 'מפגשים',
          label: `מפגש ${s.session_number} ללא כותרת`,
          severity: 'warn',
          detail: `בקורס "${course.title}" — מפגש ${s.session_number} חסר כותרת.`,
          action: { label: 'ערוך מפגש', tab: 'courses&sub=manage' },
        })
      }
    }
  }

  // ── Content ─────────────────────────────────────────────────────────────
  const { data: content } = await supabase.from('session_content').select('*')
  const contentList = (content ?? []) as Record<string, unknown>[]

  for (const s of sessionList) {
    const sessionContent = contentList.filter(c => c.session_id === s.id)
    if (sessionContent.length === 0 && s.status === 'open') {
      items.push({
        id: `no-content-${s.id}`,
        category: 'תוכן',
        label: `מפגש "${s.title || s.session_number}" ללא תוכן`,
        severity: 'warn',
        detail: 'מפגש פתוח בלי בלוקי תוכן — התלמידים יראו "התוכן יתווסף בקרוב".',
        action: { label: 'הוסף תוכן', tab: 'courses&sub=manage' },
      })
    }

    if (s.status === 'open' && (s.reveal_index as number) === 0 && sessionContent.length > 0) {
      const course = courseList.find(c => c.id === s.course_id)
      if (course && course.status === 'active') {
        items.push({
          id: `reveal-zero-${s.id}`,
          category: 'תוכן',
          label: `reveal_index = 0 במפגש "${s.title || s.session_number}"`,
          severity: 'info',
          detail: 'כל התוכן מוצג ללא חשיפה מדורגת. אם זה מכוון — לחץ Snooze.',
          action: { label: 'הגדר חשיפה', tab: 'courses&sub=manage' },
        })
      }
    }

    for (const c of sessionContent) {
      if (!c.title || (c.title as string).trim() === '') {
        items.push({
          id: `content-no-title-${c.id}`,
          category: 'תוכן',
          label: `בלוק תוכן ללא כותרת (${c.content_type})`,
          severity: 'warn',
          detail: `במפגש "${s.title || s.session_number}" — בלוק מסוג ${c.content_type} ללא כותרת.`,
          action: { label: 'ערוך בלוק', tab: 'courses&sub=manage' },
        })
      }
      if (c.content_type === 'video' && (!c.content || (c.content as string).trim() === '')) {
        items.push({
          id: `video-no-url-${c.id}`,
          category: 'תוכן',
          label: `בלוק וידאו ללא URL: "${c.title}"`,
          severity: 'error',
          detail: 'בלוק וידאו בלי לינק — יציג iframe ריק.',
          action: { label: 'ערוך בלוק', tab: 'courses&sub=manage' },
        })
      }
      if (c.content_type === 'file' && !c.file_url) {
        items.push({
          id: `file-no-url-${c.id}`,
          category: 'תוכן',
          label: `בלוק קובץ ללא URL: "${c.title}"`,
          severity: 'error',
          detail: 'בלוק קובץ בלי לינק להורדה — כפתור "הורד" לא יופיע.',
          action: { label: 'ערוך בלוק', tab: 'courses&sub=manage' },
        })
      }
    }
  }

  // ── System Settings ─────────────────────────────────────────────────────
  const { data: settings } = await supabase.from('system_settings').select('*')
  const settingsMap: Record<string, string> = {}
  for (const row of (settings ?? []) as Record<string, unknown>[]) {
    settingsMap[row.key as string] = row.value as string
  }

  if (!settingsMap.contact_email) {
    items.push({
      id: 'no-contact-email',
      category: 'הגדרות',
      label: 'לא הוגדר אימייל ליצירת קשר',
      severity: 'warn',
      detail: 'לינק האימייל בדף הנחיתה לא יופיע.',
      action: { label: 'הגדרות מערכת', tab: 'settings' },
    })
  }

  if (!settingsMap.contact_phone) {
    items.push({
      id: 'no-contact-phone',
      category: 'הגדרות',
      label: 'לא הוגדר מספר טלפון ליצירת קשר',
      severity: 'warn',
      detail: 'לינק הטלפון בדף הנחיתה לא יופיע.',
      action: { label: 'הגדרות מערכת', tab: 'settings' },
    })
  }

  if (settingsMap.fomo_banner_active === 'true' && !settingsMap.fomo_cta_link) {
    items.push({
      id: 'fomo-no-link',
      category: 'הגדרות',
      label: 'באנר FOMO פעיל ללא לינק CTA',
      severity: 'error',
      detail: 'הבאנר מוצג אבל כפתור הפעולה לא מוביל לשום מקום.',
      action: { label: 'באנר FOMO', tab: 'landing&sub=landing-content' },
    })
  }

  // ── Landing page content ────────────────────────────────────────────────
  const { data: additionalCourses } = await supabase.from('additional_courses').select('*')
  const { data: teamMembers } = await supabase.from('team_members').select('*')

  if (!teamMembers || teamMembers.length === 0) {
    items.push({
      id: 'no-team',
      category: 'דף נחיתה',
      label: 'אין חברי צוות',
      severity: 'info',
      detail: 'סקשן "הצוות" בדף הנחיתה יהיה ריק.',
      action: { label: 'הנבחרת', tab: 'landing&sub=landing-content' },
    })
  }

  if (!additionalCourses || additionalCourses.length === 0) {
    items.push({
      id: 'no-additional-courses',
      category: 'דף נחיתה',
      label: 'אין קורסים נוספים בדף הנחיתה',
      severity: 'info',
      detail: 'סקשן "קורסים נוספים" בדף הנחיתה לא יוצג.',
      action: { label: 'קורסים בדף הראשי', tab: 'landing&sub=landing-content' },
    })
  }

  // ── Wizard ──────────────────────────────────────────────────────────────
  const { data: wizardSteps } = await supabase.from('wizard_steps').select('*')
  if (!wizardSteps || wizardSteps.length === 0) {
    items.push({
      id: 'no-wizard',
      category: 'שאלון קבלה',
      label: 'אין שלבים בשאלון הקבלה',
      severity: 'info',
      detail: 'תלמידים חדשים ידלגו ישר ל-workspace בלי שאלון.',
      action: { label: 'שאלון קבלה', tab: 'students&sub=wizard' },
    })
  }

  // ── Features not yet implemented ────────────────────────────────────────
  items.push({
    id: 'contact-form-noop',
    category: 'פיצ\'רים חסרים',
    label: 'טופס יצירת קשר לא שולח באמת',
    severity: 'error',
    detail: 'הטופס מציג "נשלח" אבל לא שולח מייל. צריך לחבר שירות אימייל (SendGrid / Resend / Cloudflare Email Workers).',
  })

  items.push({
    id: 'ai-mentor-placeholder',
    category: 'פיצ\'רים חסרים',
    label: 'AI Mentor — placeholder בלבד',
    severity: 'info',
    detail: 'הכפתור מציג "יהיה זמין בקרוב". אפשר להסיר או לחבר ל-API.',
  })

  // ── Deployment readiness ──────────────────────────────────────────────
  items.push({
    id: 'ga-placeholder',
    category: 'השקה',
    label: 'Google Analytics — מזהה לא הוגדר',
    severity: 'error',
    detail: 'צריך להחליף את GA_MEASUREMENT_ID בקובץ src/lib/analytics.ts עם מזהה אמיתי של Google Analytics.',
  })

  items.push({
    id: 'og-image-png',
    category: 'השקה',
    label: 'OG Image — צריך להמיר ל-PNG',
    severity: 'warn',
    detail: 'קיים og-image.svg בתיקיית public אבל רשתות חברתיות דורשות PNG/JPG (1200x630). יש להמיר ולשמור כ-og-image.png.',
  })

  items.push({
    id: 'legal-contact-info',
    category: 'השקה',
    label: 'פרטי קשר בעמודים המשפטיים — placeholder',
    severity: 'error',
    detail: 'עמודי פרטיות, נגישות ותנאי שימוש מכילים אימיילים/טלפונים לדוגמה. עדכנו לפרטים אמיתיים.',
  })

  // sitemap.xml — created in public/sitemap.xml. Update when adding new public routes.

  // D1 database is now connected — no longer showing Supabase warning

  // ── Accessibility compliance (Israeli Standard 5568) ──────────────────
  // skip-nav and focus-trap — implemented

  items.push({
    id: 'a11y-contrast-audit',
    category: 'נגישות',
    label: 'נדרש בדיקת ניגודיות צבעים',
    severity: 'warn',
    detail: 'הריצו axe-core או Lighthouse כדי לוודא שכל טקסט עומד ביחס ניגודיות 4.5:1 (WCAG 1.4.3).',
  })

  items.push({
    id: 'a11y-annual-audit',
    category: 'נגישות',
    label: 'ביקורת נגישות שנתית',
    severity: 'info',
    detail: 'החוק הישראלי מחייב ביקורת נגישות תקופתית. מומלץ לבצע ביקורת אוטומטית + ידנית לפחות פעם בשנה.',
  })

  items.push({
    id: 'a11y-keyboard-test',
    category: 'נגישות',
    label: 'נדרש בדיקת ניווט מקלדת',
    severity: 'warn',
    detail: 'ודאו שכל אלמנט אינטראקטיבי נגיש עם Tab, Enter, Space, Escape ומקשי חצים.',
  })

  items.push({
    id: 'payment-not-connected',
    category: 'פיצ\'רים חסרים',
    label: 'אין חיבור לתשלומים',
    severity: 'error',
    detail: 'שדה payment_status קיים בפרופיל משתמש אבל אין ספק תשלומים מחובר (PayPal / Stripe / גרין אינווייס).',
  })

  return items
}

// ── Component ────────────────────────────────────────────────────────────────

export function SystemHealthCheck() {
  const [items, setItems] = useState<CheckItem[]>([])
  const [loading, setLoading] = useState(true)
  const [snoozed, setSnoozedState] = useState<Set<string>>(getSnoozed)

  function load() {
    setLoading(true)
    // Minimum 400ms so the user sees the refresh animation
    const start = Date.now()
    runChecks()
      .then(data => {
        const elapsed = Date.now() - start
        const delay = Math.max(0, 400 - elapsed)
        setTimeout(() => { setItems(data); setLoading(false) }, delay)
      })
      .catch(() => {
        const elapsed = Date.now() - start
        const delay = Math.max(0, 400 - elapsed)
        setTimeout(() => setLoading(false), delay)
      })
  }

  useEffect(() => { load() }, [])

  function toggleSnooze(id: string) {
    setSnoozedState(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      setSnoozed(next)
      return next
    })
  }

  function clearAllSnooze() {
    setSnoozedState(new Set())
    setSnoozed(new Set())
  }

  // Sort: severity first, snoozed last
  const sorted = [...items].sort((a, b) => {
    const aS = snoozed.has(a.id) ? 1 : 0
    const bS = snoozed.has(b.id) ? 1 : 0
    if (aS !== bS) return aS - bS
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const activeItems = sorted.filter(i => !snoozed.has(i.id))
  const snoozedItems = sorted.filter(i => snoozed.has(i.id))

  const critical = activeItems.filter(i => i.severity === 'critical')
  const errors = activeItems.filter(i => i.severity === 'error')
  const warnings = activeItems.filter(i => i.severity === 'warn')
  const infos = activeItems.filter(i => i.severity === 'info')

  function renderItem(item: CheckItem) {
    const isSnoozed = snoozed.has(item.id)
    const Icon = severityIcon[item.severity]
    return (
      <div
        key={item.id}
        className={`flex items-start gap-3 rounded-xl border p-4 transition-opacity ${
          isSnoozed ? 'bg-white/3 border-white/5 opacity-50' : severityBg[item.severity]
        }`}
      >
        <Icon size={18} className={`${isSnoozed ? 'text-gray-600' : severityColor[item.severity]} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium text-sm ${isSnoozed ? 'text-gray-500' : 'text-white'}`}>{item.label}</p>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isSnoozed ? 'bg-white/5 text-gray-600' : severityBg[item.severity] + ' ' + severityColor[item.severity]
            }`}>
              {severityLabel[item.severity]}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">{item.detail}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => toggleSnooze(item.id)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              isSnoozed
                ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                : 'bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10'
            }`}
            title={isSnoozed ? 'הפעל מחדש' : 'Snooze — העבר לתחתית'}
          >
            <BellOff size={11} />
            {isSnoozed ? 'הפעל' : 'Snooze'}
          </button>
          {item.action && item.action.tab && (
            <a
              href={`?tab=${item.action.tab}`}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {item.action.label}
              <ExternalLink size={10} />
            </a>
          )}
          {item.action && item.action.href && (
            <a
              href={item.action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {item.action.label}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">נשאר לעשות</h2>
          <p className="text-sm text-gray-500">בדיקה אוטומטית — כשתתקן, הפריט ייעלם. לחץ Snooze כדי להוריד לתחתית.</p>
        </div>
        <div className="flex items-center gap-2">
          {snoozedItems.length > 0 && (
            <button
              onClick={clearAllSnooze}
              className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              בטל כל ה-Snooze ({snoozedItems.length})
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            בדוק שוב
          </button>
        </div>
      </div>

      {/* Summary badges */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {critical.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <XCircle size={14} className="text-red-400" />
              <span className="text-xs text-red-400 font-semibold">{critical.length} קריטי</span>
            </div>
          )}
          {errors.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <XCircle size={14} className="text-red-400" />
              <span className="text-xs text-red-400 font-semibold">{errors.length} שגיאות</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-400 font-semibold">{warnings.length} אזהרות</span>
            </div>
          )}
          {infos.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
              <AlertTriangle size={14} className="text-blue-400" />
              <span className="text-xs text-blue-400 font-semibold">{infos.length} מידע</span>
            </div>
          )}
          {activeItems.length === 0 && snoozedItems.length === 0 && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-xs text-green-400 font-semibold">הכל תקין!</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-12 text-center">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-bold text-lg mb-1">המערכת תקינה לחלוטין</p>
          <p className="text-gray-500 text-sm">כל ההגדרות והתכנים במקום. אפשר להתחיל!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active items sorted by severity */}
          {activeItems.map(renderItem)}

          {/* Snoozed section */}
          {snoozedItems.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-4 pb-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                  <BellOff size={11} />
                  Snoozed ({snoozedItems.length})
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              {snoozedItems.map(renderItem)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
