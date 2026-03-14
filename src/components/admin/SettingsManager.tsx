import { useEffect, useState, useMemo } from 'react'
import { getAdminSystemSettings, updateSystemSetting } from '@/lib/supabase/queries/admin'
import { Save, ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from 'lucide-react'
import { useAdminDirty } from '@/hooks/useAdminDirty'

type SettingRow = { key: string; value: string; dirty: boolean }

// FOMO settings are managed in the dedicated "באנר FOMO" tab
const FOMO_KEYS = new Set(['fomo_banner_active', 'fomo_text', 'fomo_variant', 'fomo_end_time', 'fomo_cta_text', 'fomo_cta_link'])
// OG/share settings managed in dedicated ShareSettingsManager
const OG_KEYS = new Set(['og_title', 'og_description', 'og_image', 'og_url'])
// Nav config managed in NavOrderManager
const NAV_CONFIG_KEYS = new Set(['admin_nav_config'])
// Prompt showcase settings are managed in the dedicated prompt showcase tab
const PROMPT_KEYS_PREFIX = ['terminal_', 'beforeafter_', 'beforeafter_bad_', 'beforeafter_good_', 'cards_', 'chat_']

const settingLabels: Record<string, string> = {
  // Navbar
  navbar_links:          'קישורי ניווט',
  navbar_popup_title:    'כותרת פופאפ "אזור אישי"',
  navbar_popup_subtitle: 'תת-כותרת פופאפ',
  navbar_popup_icon:     'אייקון פופאפ',

  // Hero
  hero_headline:       'כותרת ראשית',
  hero_subheadline:    'כותרת משנה',
  hero_description:    'תיאור',
  hero_badge_text:     'טקסט תג Live',
  hero_badge_link:     'קישור תג Live (ריק = ללא קישור)',
  hero_cta_primary:    'טקסט כפתור ראשי',
  hero_cta_secondary:  'טקסט כפתור משני',
  hero_features:       'כרטיסי פיצ\'רים',

  // Syllabus
  syllabus_heading:    'כותרת',
  syllabus_subheading: 'תת-כותרת',
  syllabus_badges:     'אייקונים ותגיות מפגשים',

  // Projects
  projects_heading:    'כותרת',
  projects_subheading: 'תת-כותרת',

  // Courses
  courses_heading:     'כותרת',
  courses_subheading:  'תת-כותרת',

  // Team
  team_heading:        'כותרת',
  team_subheading:     'תת-כותרת',

  // Contact
  contact_heading:     'כותרת',
  contact_description: 'תיאור',
  contact_success:     'הודעת הצלחה',
  contact_email:       'אימייל',
  contact_phone:       'טלפון',

  // Footer
  footer_text:         'טקסט זכויות יוצרים',

  // Student workspace
  ws_sidebar_logo:       'לוגו סיידבר',
  ws_search_placeholder: 'טקסט חיפוש (placeholder)',
  ws_panel_content:      'טאב: תוכן',
  ws_panel_prompts:      'טאב: פרומפטים',
  ws_panel_notes:        'טאב: הפנקס שלי',
  ws_notes_placeholder:  'טקסט הערות (placeholder)',
  ws_notes_export:       'כפתור ייצוא הערות',
  ws_locked_title:       'כותרת תוכן נעול',
  ws_locked_detail:      'פירוט תוכן נעול',
  ws_coming_soon:        'טקסט "בקרוב"',
  ws_reveal_later:       'טקסט "יחשף בהמשך"',
  ws_prompts_empty:      'טקסט אין פרומפטים',
  ws_feedback_heading:   'כותרת פידבק',
  ws_feedback_desc:      'תיאור פידבק',
  ws_feedback_learned:   'שאלה: מה למדתי',
  ws_feedback_missing:   'שאלה: מה חסר',
  ws_no_courses:         'טקסט אין קורסים',
  ws_ai_mentor_soon:     'טקסט AI Mentor בקרוב',
  ws_onboarding_heading:   'כותרת שאלון',
  ws_onboarding_done_title: 'כותרת סיום שאלון',
  ws_onboarding_done_text:  'טקסט סיום שאלון',
  ws_onboarding_done_cta:   'כפתור סיום שאלון',
  ws_prep_heading:       'כותרת הכנה',
  ws_prep_desc:          'תיאור הכנה',
  ws_prep_done:          'טקסט השלמת הכנה',
  ws_prep_cta:           'כפתור המשך',

  // Other
  ai_mentor_active:    'AI Mentor (פעיל/כבוי)',
}

type Section = { title: string; icon: string; keys: string[] }

// Landing page sections — ordered top-to-bottom like the actual page
const LANDING_SECTIONS: Section[] = [
  {
    title: 'Header — ניווט עליון',
    icon: '🧭',
    keys: ['navbar_links', 'navbar_popup_title', 'navbar_popup_subtitle', 'navbar_popup_icon'],
  },
  {
    title: 'Hero — ראש העמוד',
    icon: '🏠',
    keys: ['hero_headline', 'hero_subheadline', 'hero_description', 'hero_badge_text', 'hero_badge_link', 'hero_cta_primary', 'hero_cta_secondary', 'hero_features'],
  },
  {
    title: 'סילבוס — מסלול הלימוד',
    icon: '📚',
    keys: ['syllabus_heading', 'syllabus_subheading', 'syllabus_badges'],
  },
  {
    title: 'פרויקטים',
    icon: '📱',
    keys: ['projects_heading', 'projects_subheading'],
  },
  {
    title: 'קורסים נוספים',
    icon: '🎓',
    keys: ['courses_heading', 'courses_subheading'],
  },
  {
    title: 'הצוות',
    icon: '👥',
    keys: ['team_heading', 'team_subheading'],
  },
  {
    title: 'יצירת קשר',
    icon: '📧',
    keys: ['contact_heading', 'contact_description', 'contact_success', 'contact_email', 'contact_phone'],
  },
  {
    title: 'Footer — תחתית העמוד',
    icon: '🔗',
    keys: ['footer_text'],
  },
]

// Student workspace sections — organized by student-facing page
const STUDENT_SECTIONS: Section[] = [
  {
    title: 'סיידבר + כללי',
    icon: '📋',
    keys: ['ws_sidebar_logo', 'ws_search_placeholder', 'ws_panel_content', 'ws_panel_prompts', 'ws_panel_notes', 'ws_no_courses', 'ws_ai_mentor_soon'],
  },
  {
    title: 'תוכן מפגש',
    icon: '📖',
    keys: ['ws_locked_title', 'ws_locked_detail', 'ws_coming_soon', 'ws_reveal_later', 'ws_prompts_empty'],
  },
  {
    title: 'הערות תלמידים',
    icon: '📝',
    keys: ['ws_notes_placeholder', 'ws_notes_export'],
  },
  {
    title: 'פידבק על מפגש',
    icon: '💬',
    keys: ['ws_feedback_heading', 'ws_feedback_desc', 'ws_feedback_learned', 'ws_feedback_missing'],
  },
  {
    title: 'שאלון קבלה (Onboarding)',
    icon: '👋',
    keys: ['ws_onboarding_heading', 'ws_onboarding_done_title', 'ws_onboarding_done_text', 'ws_onboarding_done_cta'],
  },
  {
    title: 'הכנה לקורס',
    icon: '🎯',
    keys: ['ws_prep_heading', 'ws_prep_desc', 'ws_prep_done', 'ws_prep_cta'],
  },
]

const GENERAL_SECTIONS: Section[] = [
  {
    title: 'כללי',
    icon: '⚙️',
    keys: ['ai_mentor_active'],
  },
]

const ALL_SECTIONS = [...LANDING_SECTIONS, ...STUDENT_SECTIONS, ...GENERAL_SECTIONS]

const TOGGLE_KEYS = new Set(['ai_mentor_active'])
const VISUAL_JSON_KEYS = new Set(['hero_features', 'syllabus_badges', 'navbar_links'])
const TEXTAREA_KEYS = new Set(['hero_description', 'contact_description'])
const EMOJI_PICKER_KEYS = new Set(['navbar_popup_icon'])
const EMOJI_OPTIONS = ['✨', '🚀', '🎯', '💡', '⭐', '🔥', '💬', '👋', '📚', '🎓', '🛠️', '⚡', '💻', '🎨', '📱', '']

function isPromptShowcaseKey(key: string) {
  return PROMPT_KEYS_PREFIX.some(p => key.startsWith(p))
}

function parseJSON<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) } catch { return fallback }
}

// ── Searchable index for global admin search ─────────────────────────────────

export type SettingSearchEntry = {
  key: string
  label: string
  sectionTitle: string
  sectionIcon: string
  mode: 'landing' | 'general' | 'student'
}

/** Returns a flat list of all settings with their section info, for use in admin search */
export function getSettingsSearchIndex(): SettingSearchEntry[] {
  const entries: SettingSearchEntry[] = []
  for (const section of LANDING_SECTIONS) {
    for (const key of section.keys) {
      entries.push({ key, label: settingLabels[key] ?? key, sectionTitle: section.title, sectionIcon: section.icon, mode: 'landing' })
    }
  }
  for (const section of STUDENT_SECTIONS) {
    for (const key of section.keys) {
      entries.push({ key, label: settingLabels[key] ?? key, sectionTitle: section.title, sectionIcon: section.icon, mode: 'student' })
    }
  }
  for (const section of GENERAL_SECTIONS) {
    for (const key of section.keys) {
      entries.push({ key, label: settingLabels[key] ?? key, sectionTitle: section.title, sectionIcon: section.icon, mode: 'general' })
    }
  }
  return entries
}

// ── Visual JSON Editors ──────────────────────────────────────────────────────

type FeatureCard = { icon: string; label: string; desc: string }

function FeatureCardsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cards = parseJSON<FeatureCard[]>(value, [])

  function update(index: number, patch: Partial<FeatureCard>) {
    const next = cards.map((c, i) => i === index ? { ...c, ...patch } : c)
    onChange(JSON.stringify(next))
  }

  function add() {
    onChange(JSON.stringify([...cards, { icon: '⭐', label: '', desc: '' }]))
  }

  function remove(index: number) {
    onChange(JSON.stringify(cards.filter((_, i) => i !== index)))
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...cards]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(JSON.stringify(next))
  }

  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <div key={i} className="flex items-start gap-2 bg-white/3 border border-white/5 rounded-lg p-3">
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors" title="הזז למעלה">
              <ChevronUp size={14} />
            </button>
            <GripVertical size={14} className="text-gray-700 mx-auto" />
            <button onClick={() => move(i, 1)} disabled={i === cards.length - 1} className="text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors" title="הזז למטה">
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <EmojiSelect value={card.icon} onChange={v => update(i, { icon: v })} />
              <input
                type="text"
                value={card.label}
                onChange={e => update(i, { label: e.target.value })}
                placeholder="כותרת"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                dir="auto"
              />
            </div>
            <input
              type="text"
              value={card.desc}
              onChange={e => update(i, { desc: e.target.value })}
              placeholder="תיאור"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              dir="auto"
            />
          </div>
          <button onClick={() => remove(i)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-1" title="מחק">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1">
        <Plus size={14} /> הוסף כרטיס
      </button>
    </div>
  )
}

type SyllabusBadge = { icon: string; badge: string }

function SyllabusBadgesEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const badges = parseJSON<Record<string, SyllabusBadge>>(value, {})
  const entries = Object.entries(badges).sort(([a], [b]) => Number(a) - Number(b))

  function update(key: string, patch: Partial<SyllabusBadge>) {
    const next = { ...badges, [key]: { ...badges[key], ...patch } }
    onChange(JSON.stringify(next))
  }

  function add() {
    const nextKey = String(entries.length > 0 ? Math.max(...entries.map(([k]) => Number(k))) + 1 : 1)
    onChange(JSON.stringify({ ...badges, [nextKey]: { icon: '🎯', badge: '' } }))
  }

  function remove(key: string) {
    const next = { ...badges }
    delete next[key]
    onChange(JSON.stringify(next))
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, badge]) => (
        <div key={key} className="flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg p-3">
          <span className="text-xs text-gray-600 w-8 shrink-0 text-center">#{key}</span>
          <EmojiSelect value={badge.icon} onChange={v => update(key, { icon: v })} />
          <input
            type="text"
            value={badge.badge}
            onChange={e => update(key, { badge: e.target.value })}
            placeholder="שם התגית"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            dir="auto"
          />
          <button onClick={() => remove(key)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0" title="מחק">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1">
        <Plus size={14} /> הוסף מפגש
      </button>
    </div>
  )
}

type NavLink = { label: string; href: string }

function NavLinksEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const links = parseJSON<NavLink[]>(value, [])

  function update(index: number, patch: Partial<NavLink>) {
    const next = links.map((l, i) => i === index ? { ...l, ...patch } : l)
    onChange(JSON.stringify(next))
  }

  function add() {
    onChange(JSON.stringify([...links, { label: '', href: '#' }]))
  }

  function remove(index: number) {
    onChange(JSON.stringify(links.filter((_, i) => i !== index)))
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...links]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(JSON.stringify(next))
  }

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg p-3">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors">
              <ChevronUp size={12} />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === links.length - 1} className="text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors">
              <ChevronDown size={12} />
            </button>
          </div>
          <input
            type="text"
            value={link.label}
            onChange={e => update(i, { label: e.target.value })}
            placeholder="טקסט"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            dir="rtl"
          />
          <input
            type="text"
            value={link.href}
            onChange={e => update(i, { href: e.target.value })}
            placeholder="#section או /page"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors font-mono"
            dir="ltr"
          />
          <button onClick={() => remove(i)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0" title="מחק">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1">
        <Plus size={14} /> הוסף קישור
      </button>
    </div>
  )
}

// ── Emoji selector dropdown ──────────────────────────────────────────────────

function EmojiSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-lg flex items-center justify-center transition-colors"
      >
        {value || '?'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl p-2 grid grid-cols-4 gap-1 w-44">
            {EMOJI_OPTIONS.filter(Boolean).map(emoji => (
              <button
                key={emoji}
                onClick={() => { onChange(emoji); setOpen(false) }}
                className={`w-9 h-9 rounded-md text-lg flex items-center justify-center transition-colors ${
                  value === emoji ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Shared settings renderer ─────────────────────────────────────────────────

type SettingsRendererProps = {
  sections: Section[]
  title: string
  /** If true, all sections start collapsed except the first one */
  defaultCollapsed?: boolean
}

function SettingsRenderer({ sections, title, defaultCollapsed = false }: SettingsRendererProps) {
  const [rows, setRows] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const hasDirtyRows = useMemo(() => rows.some(r => r.dirty), [rows])
  useAdminDirty(`settings-${title}`, hasDirtyRows)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (!defaultCollapsed) return {}
    const init: Record<string, boolean> = {}
    sections.forEach((s, i) => { init[s.title] = i > 0 })
    return init
  })

  // Collect all keys from the given sections so we can ensure they exist
  const sectionKeys = new Set(sections.flatMap(s => s.keys))

  function loadSettings() {
    setLoading(true)
    setFetchError(null)
    getAdminSystemSettings().then(map => {
      const existing = Object.entries(map)
        .filter(([key]) => !FOMO_KEYS.has(key) && !OG_KEYS.has(key) && !NAV_CONFIG_KEYS.has(key) && !isPromptShowcaseKey(key))
        .map(([key, value]) => ({ key, value, dirty: false }))
      // Add missing section keys with empty default so fields are always visible
      const existingKeys = new Set(existing.map(r => r.key))
      for (const key of sectionKeys) {
        if (!existingKeys.has(key)) {
          existing.push({ key, value: '', dirty: false })
        }
      }
      setRows(existing)
      setLoading(false)
    }).catch(err => { setFetchError(err?.message ?? 'שגיאה בטעינה'); setLoading(false) })
  }

  useEffect(() => { loadSettings() }, [])

  function handleChange(key: string, value: string) {
    setRows(prev => prev.map(r => r.key === key ? { ...r, value, dirty: true } : r))
  }

  async function handleSave(row: SettingRow) {
    setSaving(row.key)
    await updateSystemSetting(row.key, row.value)
    setRows(prev => prev.map(r => r.key === row.key ? { ...r, dirty: false } : r))
    setSaving(null)
  }

  function toggleSection(sectionTitle: string) {
    setCollapsed(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }))
  }

  const rowMap = Object.fromEntries(rows.map(r => [r.key, r]))

  // Collect any keys not in the given sections
  const categorizedKeys = new Set(ALL_SECTIONS.flatMap(s => s.keys))
  const uncategorized = rows.filter(r => !categorizedKeys.has(r.key))

  function renderField(row: SettingRow) {
    if (TOGGLE_KEYS.has(row.key)) {
      return (
        <button
          onClick={() => {
            const newVal = row.value === 'true' ? 'false' : 'true'
            handleChange(row.key, newVal)
            updateSystemSetting(row.key, newVal)
            setRows(prev => prev.map(r => r.key === row.key ? { ...r, value: newVal, dirty: false } : r))
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            row.value === 'true'
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-gray-500 border border-white/10'
          }`}
        >
          {row.value === 'true' ? 'פעיל' : 'כבוי'}
        </button>
      )
    }

    if (EMOJI_PICKER_KEYS.has(row.key)) {
      return (
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map(emoji => (
            <button
              key={emoji || '__none'}
              onClick={() => handleChange(row.key, emoji)}
              className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-colors border ${
                row.value === emoji
                  ? 'bg-blue-600/20 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {emoji || <span className="text-xs text-gray-500">ללא</span>}
            </button>
          ))}
        </div>
      )
    }

    if (row.key === 'hero_features') {
      return <FeatureCardsEditor value={row.value} onChange={v => handleChange(row.key, v)} />
    }
    if (row.key === 'syllabus_badges') {
      return <SyllabusBadgesEditor value={row.value} onChange={v => handleChange(row.key, v)} />
    }
    if (row.key === 'navbar_links') {
      return <NavLinksEditor value={row.value} onChange={v => handleChange(row.key, v)} />
    }

    if (TEXTAREA_KEYS.has(row.key)) {
      return (
        <textarea
          value={row.value}
          onChange={e => handleChange(row.key, e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-y"
          dir="rtl"
        />
      )
    }

    return (
      <input
        type="text"
        value={row.value}
        onChange={e => handleChange(row.key, e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
        dir="rtl"
      />
    )
  }

  function renderRow(row: SettingRow) {
    const isVisual = VISUAL_JSON_KEYS.has(row.key)
    return (
      <div key={row.key} className={`py-3 border-b border-white/5 last:border-0 ${isVisual ? '' : 'flex items-start gap-3'}`}>
        {isVisual ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">{settingLabels[row.key] ?? row.key}</div>
              <button
                onClick={() => handleSave(row)}
                disabled={!row.dirty || saving === row.key}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Save size={12} />
                {saving === row.key ? '...' : 'שמור'}
              </button>
            </div>
            {renderField(row)}
          </>
        ) : (
          <>
            <div className="w-44 shrink-0 pt-2">
              <div className="text-sm text-gray-400">{settingLabels[row.key] ?? row.key}</div>
            </div>
            <div className="flex-1">
              {renderField(row)}
            </div>
            <button
              onClick={() => handleSave(row)}
              disabled={!row.dirty || saving === row.key}
              className="shrink-0 mt-1 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Save size={12} />
              {saving === row.key ? '...' : 'שמור'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-6">{title}</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-1">שגיאה בטעינת ההגדרות</p>
          <p className="text-gray-500 text-sm mb-4 font-mono">{fetchError}</p>
          <button onClick={loadSettings} className="bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">נסה שוב</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map(section => {
            const sectionRows = section.keys.map(k => rowMap[k]).filter(Boolean)
            if (sectionRows.length === 0) return null
            const isCollapsed = collapsed[section.title] ?? false

            return (
              <div key={section.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{section.icon}</span>
                    <span className="text-white font-semibold text-sm">{section.title}</span>
                    <span className="text-gray-600 text-xs">({sectionRows.length})</span>
                  </div>
                  {isCollapsed ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
                </button>
                {!isCollapsed && (
                  <div className="px-5 pb-4">
                    {sectionRows.map(row => renderRow(row))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Show uncategorized only in general settings mode */}
          {sections === GENERAL_SECTIONS && uncategorized.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('__uncategorized')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📋</span>
                  <span className="text-white font-semibold text-sm">הגדרות נוספות</span>
                  <span className="text-gray-600 text-xs">({uncategorized.length})</span>
                </div>
                {(collapsed['__uncategorized'] ?? false) ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
              </button>
              {!(collapsed['__uncategorized'] ?? false) && (
                <div className="px-5 pb-4">
                  {uncategorized.map(row => renderRow(row))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Exported components ──────────────────────────────────────────────────────

/** Landing page settings — organized by page section (Header → Footer) */
export function LandingPageSettings() {
  return <SettingsRenderer sections={LANDING_SECTIONS} title="הגדרות דף הבית" defaultCollapsed />
}

/** Student area settings — workspace, onboarding, prep page texts */
export function StudentAreaSettings() {
  return <SettingsRenderer sections={STUDENT_SECTIONS} title="אזור תלמידים — טקסטים" defaultCollapsed />
}

/** General / non-landing settings */
export function SettingsManager() {
  return <SettingsRenderer sections={GENERAL_SECTIONS} title="הגדרות כלליות" />
}
