import { useEffect, useState } from 'react'
import { getAdminSystemSettings, updateSystemSetting } from '@/lib/supabase/queries/admin'
import { FomoBanner, FOMO_VARIANT_LABELS } from '@/components/landing/FomoBanner'
import type { FomoVariant } from '@/components/landing/FomoBanner'
import { Save, RotateCcw } from 'lucide-react'
import DateTimePicker from '@/components/ui/DateTimePicker'

type FomoSettings = {
  fomo_banner_active: string
  fomo_text: string
  fomo_variant: string
  fomo_end_time: string
  fomo_cta_text: string
  fomo_cta_link: string
}

const DEFAULTS: FomoSettings = {
  fomo_banner_active: 'true',
  fomo_text: '🔥 מקומות מוגבלים! המחיר עולה בקרוב — הצטרף עכשיו',
  fomo_variant: 'gradient',
  fomo_end_time: '',
  fomo_cta_text: 'הצטרף עכשיו',
  fomo_cta_link: '/intake',
}

const VARIANT_SWATCHES: { id: FomoVariant; label: string }[] = [
  { id: 'gradient', label: 'גרדיאנט' },
  { id: 'blue',     label: 'כחול' },
  { id: 'purple',   label: 'סגול' },
  { id: 'green',    label: 'ירוק' },
  { id: 'amber',    label: 'ענבר' },
  { id: 'red',      label: 'אדום' },
  { id: 'pink',     label: 'ורוד' },
  { id: 'teal',     label: 'ים' },
  { id: 'gray',     label: 'אפור' },
]

const SWATCH_BG: Record<FomoVariant, string> = {
  gradient: 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600',
  blue:     'bg-blue-600',
  purple:   'bg-purple-600',
  green:    'bg-green-600',
  amber:    'bg-amber-500',
  red:      'bg-red-600',
  pink:     'bg-pink-600',
  teal:     'bg-teal-600',
  gray:     'bg-gray-700',
}

export function FomoBannerManager() {
  const [settings, setSettings] = useState<FomoSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    getAdminSystemSettings().then(map => {
      setSettings({
        fomo_banner_active: map.fomo_banner_active ?? DEFAULTS.fomo_banner_active,
        fomo_text:          map.fomo_text          ?? DEFAULTS.fomo_text,
        fomo_variant:       map.fomo_variant       ?? DEFAULTS.fomo_variant,
        fomo_end_time:      map.fomo_end_time      ?? DEFAULTS.fomo_end_time,
        fomo_cta_text:      map.fomo_cta_text      ?? DEFAULTS.fomo_cta_text,
        fomo_cta_link:      map.fomo_cta_link      ?? DEFAULTS.fomo_cta_link,
      })
      setLoading(false)
    }).catch(_err => {
      // On error, fall back to defaults so the UI is still usable
      setLoading(false)
    })
  }, [])

  function update<K extends keyof FomoSettings>(key: K, value: FomoSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await Promise.all(
        (Object.entries(settings) as [string, string][]).map(([k, v]) => updateSystemSetting(k, v))
      )
      setDirty(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'שגיאה בשמירה — בדוק הרשאות admin')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setSettings(DEFAULTS)
    setDirty(true)
  }

  const isActive = settings.fomo_banner_active === 'true'

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* Top bar: toggle + save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => update('fomo_banner_active', isActive ? 'false' : 'true')}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isActive ? 'bg-blue-600' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${isActive ? 'right-0.5' : 'left-0.5'}`} />
          </button>
          <span className={`text-xs font-medium ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
            {isActive ? 'פעיל' : 'כבוי'}
          </span>
          {saveSuccess && <span className="text-green-400 text-xs">✓ נשמר</span>}
          {saveError && <span className="text-red-400 text-xs">{saveError}</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            <RotateCcw size={12} />
            איפוס
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Save size={12} />
            {saving ? '...' : 'שמור'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg overflow-hidden border border-white/10">
        {isActive ? (
          <FomoBanner
            text={settings.fomo_text}
            variant={settings.fomo_variant}
            endTime={settings.fomo_end_time || undefined}
            ctaText={settings.fomo_cta_text || undefined}
            ctaLink={settings.fomo_cta_link || undefined}
            preview
          />
        ) : (
          <div className="bg-white/5 py-3 text-center text-gray-600 text-xs">הבאנר כבוי</div>
        )}
      </div>

      {/* Compact form */}
      <div className="space-y-3">
        <input
          type="text"
          value={settings.fomo_text}
          onChange={e => update('fomo_text', e.target.value)}
          placeholder="טקסט הבאנר"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
          dir="rtl"
        />

        {/* Color swatches */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-500 shrink-0">צבע:</span>
          {VARIANT_SWATCHES.map(v => (
            <button
              key={v.id}
              onClick={() => update('fomo_variant', v.id)}
              title={v.label}
              className={`w-6 h-6 rounded-md ${SWATCH_BG[v.id]} transition-all duration-150 ${
                settings.fomo_variant === v.id
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0f] scale-110'
                  : 'opacity-50 hover:opacity-80'
              }`}
            />
          ))}
        </div>

        {/* Timer + CTA in one row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">טיימר</label>
            <DateTimePicker
              value={settings.fomo_end_time || ''}
              onChange={iso => update('fomo_end_time', iso)}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">טקסט כפתור</label>
            <input
              type="text"
              value={settings.fomo_cta_text}
              onChange={e => update('fomo_cta_text', e.target.value)}
              placeholder="הצטרף עכשיו"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
              dir="rtl"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">קישור כפתור</label>
            <input
              type="text"
              value={settings.fomo_cta_link}
              onChange={e => update('fomo_cta_link', e.target.value)}
              placeholder="/intake"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
