import { useEffect, useState } from 'react'
import { getAdminSystemSettings, updateSystemSetting } from '@/lib/supabase/queries/admin'
import { Save, ChevronDown, ChevronUp } from 'lucide-react'

type SettingRow = { key: string; value: string; dirty: boolean }

// FOMO settings are managed in the dedicated "באנר FOMO" tab
const FOMO_KEYS = new Set(['fomo_banner_active', 'fomo_text', 'fomo_variant', 'fomo_end_time', 'fomo_cta_text', 'fomo_cta_link'])
// Prompt showcase settings are managed in the dedicated prompt showcase tab
const PROMPT_KEYS_PREFIX = ['terminal_', 'beforeafter_', 'beforeafter_bad_', 'beforeafter_good_', 'cards_', 'chat_']

const settingLabels: Record<string, string> = {
  // Hero
  hero_headline:       'כותרת ראשית',
  hero_subheadline:    'כותרת משנה',
  hero_description:    'תיאור',
  hero_badge_text:     'טקסט תג Live',
  hero_badge_link:     'קישור תג Live (ריק = ללא קישור)',
  hero_cta_primary:    'טקסט כפתור ראשי',
  hero_cta_secondary:  'טקסט כפתור משני',
  hero_features:       'כרטיסי פיצ\'רים (JSON)',

  // Syllabus
  syllabus_heading:    'כותרת',
  syllabus_subheading: 'תת-כותרת',
  syllabus_badges:     'אייקונים ותגיות מפגשים (JSON)',

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

  // Navbar
  navbar_links:        'קישורי ניווט (JSON)',

  // Footer
  footer_text:         'טקסט זכויות יוצרים',

  // Other
  ai_mentor_active:    'AI Mentor (פעיל/כבוי)',
}

// Group settings into sections for organized display
const SECTIONS: { title: string; icon: string; keys: string[] }[] = [
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
    title: 'ניווט ופוטר',
    icon: '🔗',
    keys: ['navbar_links', 'footer_text'],
  },
  {
    title: 'כללי',
    icon: '⚙️',
    keys: ['ai_mentor_active'],
  },
]

const TOGGLE_KEYS = new Set(['ai_mentor_active'])
const JSON_KEYS = new Set(['hero_features', 'syllabus_badges', 'navbar_links'])
const TEXTAREA_KEYS = new Set(['hero_description', 'contact_description'])

function isPromptShowcaseKey(key: string) {
  return PROMPT_KEYS_PREFIX.some(p => key.startsWith(p))
}

export function SettingsManager() {
  const [rows, setRows] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function loadSettings() {
    setLoading(true)
    setFetchError(null)
    getAdminSystemSettings().then(map => {
      setRows(
        Object.entries(map)
          .filter(([key]) => !FOMO_KEYS.has(key) && !isPromptShowcaseKey(key))
          .map(([key, value]) => ({ key, value, dirty: false }))
      )
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

  function toggleSection(title: string) {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const rowMap = Object.fromEntries(rows.map(r => [r.key, r]))

  // Collect any keys not in a section (from DB but not categorized)
  const categorizedKeys = new Set(SECTIONS.flatMap(s => s.keys))
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

    if (JSON_KEYS.has(row.key) || TEXTAREA_KEYS.has(row.key)) {
      return (
        <textarea
          value={row.value}
          onChange={e => handleChange(row.key, e.target.value)}
          rows={JSON_KEYS.has(row.key) ? 4 : 2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-y font-mono"
          dir={JSON_KEYS.has(row.key) ? 'ltr' : 'rtl'}
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
    return (
      <div key={row.key} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
        <div className="w-44 shrink-0 pt-2">
          <div className="text-sm text-gray-400">{settingLabels[row.key] ?? row.key}</div>
          {JSON_KEYS.has(row.key) && (
            <div className="text-xs text-gray-600 mt-0.5">עריכת JSON</div>
          )}
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
      </div>
    )
  }

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-6">הגדרות האתר</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-1">שגיאה בטעינת ההגדרות</p>
          <p className="text-gray-500 text-sm mb-4 font-mono">{fetchError}</p>
          <button onClick={loadSettings} className="bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">נסה שוב</button>
        </div>
      ) : (
        <div className="space-y-4">
          {SECTIONS.map(section => {
            const sectionRows = section.keys.map(k => rowMap[k]).filter(Boolean)
            if (sectionRows.length === 0) return null
            const isCollapsed = collapsed[section.title]

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

          {uncategorized.length > 0 && (
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
                {collapsed['__uncategorized'] ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
              </button>
              {!collapsed['__uncategorized'] && (
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
