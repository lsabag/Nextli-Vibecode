import { useEffect, useState } from 'react'
import { getAdminSystemSettings, updateSystemSetting } from '@/lib/supabase/queries/admin'
import { Save } from 'lucide-react'

type SettingRow = { key: string; value: string; dirty: boolean }

// FOMO settings are managed in the dedicated "באנר FOMO" tab
const FOMO_KEYS = new Set(['fomo_banner_active', 'fomo_text', 'fomo_variant', 'fomo_end_time', 'fomo_cta_text', 'fomo_cta_link'])

const settingLabels: Record<string, string> = {
  hero_headline:      'כותרת ראשית (Hero)',
  hero_subheadline:   'כותרת משנה (Hero)',
  hero_description:   'תיאור תחת הכותרת',
  contact_email:      'אימייל יצירת קשר',
  contact_phone:      'טלפון יצירת קשר',
  ai_mentor_active:   'AI Mentor (true/false)',
}

const TOGGLE_KEYS = new Set(['ai_mentor_active'])

export function SettingsManager() {
  const [rows, setRows] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  function loadSettings() {
    setLoading(true)
    setFetchError(null)
    getAdminSystemSettings().then(map => {
      setRows(
        Object.entries(map)
          .filter(([key]) => !FOMO_KEYS.has(key))
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

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-6">הגדרות מערכת</h2>

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
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="bg-blue-600/80">
                <th className="text-white px-4 py-3 text-right font-semibold text-sm">מפתח</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm">ערך</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm">שמירה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm text-gray-500 w-48">
                    {settingLabels[row.key] ?? row.key}
                  </td>
                  <td className="px-4 py-3">
                    {TOGGLE_KEYS.has(row.key) ? (
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
                    ) : (
                      <input
                        type="text"
                        value={row.value}
                        onChange={e => handleChange(row.key, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        dir="rtl"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 w-20">
                    <button
                      onClick={() => handleSave(row)}
                      disabled={!row.dirty || saving === row.key}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Save size={12} />
                      {saving === row.key ? '...' : 'שמור'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
