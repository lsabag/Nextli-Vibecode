import { useEffect, useState, useRef } from 'react'
import { getAdminSystemSettings, updateSystemSetting } from '@/lib/supabase/queries/admin'
import { Save, RotateCcw, Upload, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { useAdminDirty } from '@/hooks/useAdminDirty'

const DEFAULTS = {
  og_title: 'Nextli: וייבקוד',
  og_description: 'קורס אינטנסיבי לפיתוח עם AI - למד לבנות אתרים ואפליקציות בעזרת וייבקוד',
  og_image: '',
  og_url: 'https://vibe.nextli.co.il/',
}

type OGSettings = typeof DEFAULTS

export function ShareSettingsManager() {
  const [settings, setSettings] = useState<OGSettings>({ ...DEFAULTS })
  const [original, setOriginal] = useState<OGSettings>({ ...DEFAULTS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [activePreview, setActivePreview] = useState<'whatsapp' | 'facebook' | 'twitter' | 'slack'>('whatsapp')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dirty = Object.keys(DEFAULTS).some(
    k => settings[k as keyof OGSettings] !== original[k as keyof OGSettings]
  )
  useAdminDirty('share-settings', dirty)

  useEffect(() => {
    getAdminSystemSettings().then(map => {
      const loaded: OGSettings = {
        og_title: map.og_title ?? DEFAULTS.og_title,
        og_description: map.og_description ?? DEFAULTS.og_description,
        og_image: map.og_image ?? DEFAULTS.og_image,
        og_url: map.og_url ?? DEFAULTS.og_url,
      }
      setSettings(loaded)
      setOriginal(loaded)
      setLoading(false)
    })
  }, [])

  function handleChange(key: keyof OGSettings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaveSuccess(false)
    setSaveError(null)
    if (key === 'og_image') setImagePreviewError(false)
  }

  function handleReset() {
    setSettings({ ...original })
    setSaveSuccess(false)
    setSaveError(null)
    setImagePreviewError(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== original[key as keyof OGSettings]) {
          await updateSystemSetting(key, value)
        }
      }
      setOriginal({ ...settings })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!file.type.startsWith('image/')) return

    // Convert to data URL for preview, but user should upload to CDN
    // For now, show a note that they need a public URL
    const reader = new FileReader()
    reader.onload = () => {
      // Check dimensions
      const img = new window.Image()
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          setSaveError('התמונה קטנה מדי. מומלץ 1200×630 פיקסלים.')
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // Truncation helpers for previews
  const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max) + '…' : s
  const previewTitle = settings.og_title || DEFAULTS.og_title
  const previewDesc = settings.og_description || DEFAULTS.og_description
  const previewImage = settings.og_image
  const previewUrl = settings.og_url || DEFAULTS.og_url
  const previewDomain = (() => {
    try { return new URL(previewUrl).hostname } catch { return 'vibe.nextli.co.il' }
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputCls = 'w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors'

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">הגדרות שיתוף</h2>
          <p className="text-xs text-gray-500 mt-1">כך הקישור שלך יראה כשישלחו אותו בוואצאפ, פייסבוק, טוויטר ואתרים אחרים</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={handleReset} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-2 rounded-xl text-sm transition-colors" title="בטל שינויים">
              <RotateCcw size={14} />
              בטל
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Save size={14} />
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
          נשמר בהצלחה! שימו לב: WhatsApp ופייסבוק שומרים cache — ייתכן עיכוב עד שהתצוגה תתעדכן.
          <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" className="underline mr-1">
            נקו cache בפייסבוק
          </a>
        </div>
      )}
      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{saveError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">כותרת (og:title)</label>
            <input type="text" value={settings.og_title} onChange={e => handleChange('og_title', e.target.value)} className={inputCls} placeholder={DEFAULTS.og_title} />
            <p className="text-[10px] text-gray-600 mt-1">מומלץ עד 60 תווים. נוכחי: {settings.og_title.length}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">תיאור (og:description)</label>
            <textarea
              value={settings.og_description}
              onChange={e => handleChange('og_description', e.target.value)}
              className={inputCls + ' resize-none'}
              rows={3}
              placeholder={DEFAULTS.og_description}
            />
            <p className="text-[10px] text-gray-600 mt-1">מומלץ עד 155 תווים. נוכחי: {settings.og_description.length}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">כתובת האתר (og:url)</label>
            <input type="url" value={settings.og_url} onChange={e => handleChange('og_url', e.target.value)} className={inputCls} dir="ltr" placeholder={DEFAULTS.og_url} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">תמונת שיתוף (og:image)</label>
            <div className="space-y-2">
              <input
                type="url"
                value={settings.og_image}
                onChange={e => handleChange('og_image', e.target.value)}
                className={inputCls}
                dir="ltr"
                placeholder="https://vibe.nextli.co.il/og-image.png"
              />
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <p className="text-[10px] text-gray-600 flex-1">
                  גודל מומלץ: <strong>1200×630</strong> פיקסלים (יחס 1.91:1). פורמט: PNG או JPG. הכניסו URL ציבורי לתמונה.
                </p>
              </div>

              {/* Image dimension indicator */}
              {previewImage && !imagePreviewError && (
                <ImageDimensionCheck url={previewImage} onError={() => setImagePreviewError(true)} />
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {(['whatsapp', 'facebook', 'twitter', 'slack'] as const).map(p => (
              <button
                key={p}
                onClick={() => setActivePreview(p)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activePreview === p ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {p === 'whatsapp' ? 'WhatsApp' : p === 'facebook' ? 'Facebook' : p === 'twitter' ? 'Twitter/X' : 'Slack'}
              </button>
            ))}
          </div>

          {activePreview === 'whatsapp' && (
            <WhatsAppPreview title={previewTitle} description={previewDesc} url={previewUrl} domain={previewDomain} image={previewImage} imageError={imagePreviewError} onImageError={() => setImagePreviewError(true)} />
          )}
          {activePreview === 'facebook' && (
            <FacebookPreview title={previewTitle} description={previewDesc} domain={previewDomain} image={previewImage} imageError={imagePreviewError} onImageError={() => setImagePreviewError(true)} />
          )}
          {activePreview === 'twitter' && (
            <TwitterPreview title={previewTitle} description={previewDesc} domain={previewDomain} image={previewImage} imageError={imagePreviewError} onImageError={() => setImagePreviewError(true)} />
          )}
          {activePreview === 'slack' && (
            <SlackPreview title={previewTitle} description={previewDesc} url={previewUrl} domain={previewDomain} image={previewImage} imageError={imagePreviewError} onImageError={() => setImagePreviewError(true)} />
          )}

          <p className="text-[10px] text-gray-600 text-center">תצוגה מקדימה משוערת — המראה המדויק עשוי להשתנות</p>

          {/* Debug tools */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-400">כלי בדיקה</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink size={10} /> Facebook Debugger
              </a>
              <a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink size={10} /> Twitter Card Validator
              </a>
              <a href="https://www.opengraph.xyz/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink size={10} /> OpenGraph Preview
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Image dimension checker ──────────────────────────────────────────────────

function ImageDimensionCheck({ url, onError }: { url: string; onError: () => void }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    setDims(null)
    if (!url) return
    const img = new window.Image()
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => onError()
    img.src = url
  }, [url, onError])

  if (!dims) return null

  const ratio = dims.w / dims.h
  const idealRatio = 1200 / 630
  const ratioOk = Math.abs(ratio - idealRatio) < 0.15
  const sizeOk = dims.w >= 600 && dims.h >= 315

  return (
    <div className={`flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg ${
      sizeOk && ratioOk ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
    }`}>
      <ImageIcon size={12} />
      <span>{dims.w}×{dims.h}px (יחס {ratio.toFixed(2)}:1)</span>
      {sizeOk && ratioOk ? (
        <span className="mr-auto">מושלם!</span>
      ) : (
        <span className="mr-auto">
          {!sizeOk && 'קטן מדי — '}מומלץ 1200×630
        </span>
      )}
    </div>
  )
}

// ── Preview Components ───────────────────────────────────────────────────────

type PreviewProps = {
  title: string
  description: string
  url?: string
  domain: string
  image: string
  imageError: boolean
  onImageError: () => void
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <ImageIcon size={24} className="text-gray-600 mx-auto mb-1" />
        <p className="text-[10px] text-gray-600">אין תמונה</p>
      </div>
    </div>
  )
}

function WhatsAppPreview({ title, description, url, domain, image, imageError, onImageError }: PreviewProps) {
  return (
    <div className="bg-[#0b141a] rounded-xl p-3 max-w-sm mx-auto" dir="ltr">
      <p className="text-[10px] text-gray-500 mb-2 text-center">WhatsApp Preview</p>
      {/* Message bubble */}
      <div className="bg-[#005c4b] rounded-xl overflow-hidden max-w-[280px] ml-auto">
        {/* Link card */}
        <div className="bg-[#025144] rounded-t-xl overflow-hidden">
          {/* Image */}
          <div className="w-full h-[140px] overflow-hidden">
            {image && !imageError ? (
              <img src={image} alt="" className="w-full h-full object-cover" onError={onImageError} />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
          {/* Text */}
          <div className="px-3 py-2">
            <p className="text-[13px] font-medium text-[#e9edef] leading-snug">{title.slice(0, 70)}</p>
            <p className="text-[11px] text-[#8696a0] leading-snug mt-0.5 line-clamp-2">{description.slice(0, 120)}</p>
            <p className="text-[11px] text-[#8696a0] mt-1">{domain}</p>
          </div>
        </div>
        {/* Message text */}
        <div className="px-2 py-1.5 flex items-end justify-between">
          <span className="text-[13px] text-[#e9edef]">{url}</span>
          <span className="text-[10px] text-[#8696a0] mr-2 whitespace-nowrap">17:26 ✓✓</span>
        </div>
      </div>
    </div>
  )
}

function FacebookPreview({ title, description, domain, image, imageError, onImageError }: PreviewProps) {
  return (
    <div className="bg-[#242526] rounded-xl p-3 max-w-sm mx-auto" dir="ltr">
      <p className="text-[10px] text-gray-500 mb-2 text-center">Facebook Preview</p>
      {/* Post card */}
      <div className="border border-[#3e4042] rounded-lg overflow-hidden bg-[#3a3b3c]">
        {/* Image */}
        <div className="w-full h-[160px] overflow-hidden">
          {image && !imageError ? (
            <img src={image} alt="" className="w-full h-full object-cover" onError={onImageError} />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        {/* Text */}
        <div className="bg-[#3a3b3c] px-3 py-2.5">
          <p className="text-[11px] text-[#b0b3b8] uppercase tracking-wide">{domain}</p>
          <p className="text-[15px] font-semibold text-[#e4e6eb] leading-snug mt-0.5">{title.slice(0, 65)}</p>
          <p className="text-[13px] text-[#b0b3b8] leading-snug mt-0.5 line-clamp-2">{description.slice(0, 100)}</p>
        </div>
      </div>
    </div>
  )
}

function TwitterPreview({ title, description, domain, image, imageError, onImageError }: PreviewProps) {
  return (
    <div className="bg-black rounded-xl p-3 max-w-sm mx-auto" dir="ltr">
      <p className="text-[10px] text-gray-500 mb-2 text-center">Twitter/X Preview</p>
      {/* Card */}
      <div className="border border-[#2f3336] rounded-2xl overflow-hidden">
        {/* Image */}
        <div className="w-full h-[150px] overflow-hidden">
          {image && !imageError ? (
            <img src={image} alt="" className="w-full h-full object-cover" onError={onImageError} />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        {/* Text */}
        <div className="bg-black px-3 py-2.5 border-t border-[#2f3336]">
          <p className="text-[13px] text-[#71767b]">{domain}</p>
          <p className="text-[15px] text-[#e7e9ea] leading-snug">{title.slice(0, 70)}</p>
          <p className="text-[13px] text-[#71767b] leading-snug mt-0.5 line-clamp-2">{description.slice(0, 120)}</p>
        </div>
      </div>
    </div>
  )
}

function SlackPreview({ title, description, url, domain, image, imageError, onImageError }: PreviewProps) {
  return (
    <div className="bg-[#1a1d21] rounded-xl p-3 max-w-sm mx-auto" dir="ltr">
      <p className="text-[10px] text-gray-500 mb-2 text-center">Slack Preview</p>
      {/* Message */}
      <div className="flex gap-2.5">
        {/* Accent bar */}
        <div className="w-1 rounded-full bg-[#4a9cc8] shrink-0" />
        {/* Content */}
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#d1d2d3]">{domain}</p>
          <p className="text-[15px] text-[#1d9bd1] font-semibold leading-snug mt-0.5 hover:underline cursor-pointer">{title.slice(0, 70)}</p>
          <p className="text-[13px] text-[#ababad] leading-snug mt-0.5 line-clamp-3">{description.slice(0, 150)}</p>
          {image && !imageError && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-[240px] h-[126px]">
              <img src={image} alt="" className="w-full h-full object-cover" onError={onImageError} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
