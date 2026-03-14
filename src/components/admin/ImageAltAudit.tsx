import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Image, CheckCircle, AlertTriangle, Save, RefreshCw } from 'lucide-react'

type ImageEntry = {
  id: string
  source: string // 'additional_courses' | 'team_members' | 'rich_text'
  sourceLabel: string
  imageUrl: string
  altText: string
  originalAlt: string
  context: string // e.g. course title, member name
  table?: string
  fieldToUpdate?: string
}

export function ImageAltAudit() {
  const [entries, setEntries] = useState<ImageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function loadImages() {
    setLoading(true)
    const results: ImageEntry[] = []

    // Additional courses
    const { data: courses } = await supabase.from('additional_courses').select('*')
    for (const c of (courses ?? []) as Record<string, unknown>[]) {
      if (c.image_url) {
        results.push({
          id: `ac-${c.id}`,
          source: 'additional_courses',
          sourceLabel: 'קורסים נוספים',
          imageUrl: c.image_url as string,
          altText: (c.title as string) || '',
          originalAlt: (c.title as string) || '',
          context: (c.title as string) || `(${(c.id as string).slice(0, 8)}…)`,
          table: 'additional_courses',
          fieldToUpdate: 'title',
        })
      }
    }

    // Team members
    const { data: members } = await supabase.from('team_members').select('*')
    for (const m of (members ?? []) as Record<string, unknown>[]) {
      if (m.image_url) {
        results.push({
          id: `tm-${m.id}`,
          source: 'team_members',
          sourceLabel: 'חברי צוות',
          imageUrl: m.image_url as string,
          altText: (m.name as string) || '',
          originalAlt: (m.name as string) || '',
          context: (m.name as string) || `(${(m.id as string).slice(0, 8)}…)`,
          table: 'team_members',
          fieldToUpdate: 'name',
        })
      }
    }

    // Rich text content — extract <img> tags
    const { data: content } = await supabase.from('session_content').select('*')
    const { data: sessions } = await supabase.from('course_sessions').select('*')
    const sessionMap = new Map((sessions ?? []).map((s: Record<string, unknown>) => [s.id as string, s.title as string]))

    for (const c of (content ?? []) as Record<string, unknown>[]) {
      if (c.content_type === 'rich_text' && c.content) {
        const html = c.content as string
        const imgRegex = /<img[^>]*>/gi
        let match
        let idx = 0
        while ((match = imgRegex.exec(html)) !== null) {
          const imgTag = match[0]
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/)
          const altMatch = imgTag.match(/alt=["']([^"']*)["']/)
          if (srcMatch) {
            const sessionTitle = sessionMap.get(c.session_id as string) || ''
            results.push({
              id: `rt-${c.id}-${idx}`,
              source: 'rich_text',
              sourceLabel: 'תוכן עשיר',
              imageUrl: srcMatch[1],
              altText: altMatch?.[1] ?? '',
              originalAlt: altMatch?.[1] ?? '',
              context: `${c.title || 'ללא כותרת'} (מפגש: ${sessionTitle})`,
            })
            idx++
          }
        }
      }
    }

    setEntries(results)
    setLoading(false)
  }

  useEffect(() => { loadImages() }, [])

  function updateAlt(id: string, newAlt: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, altText: newAlt } : e))
  }

  async function saveEntry(entry: ImageEntry) {
    if (!entry.table || !entry.fieldToUpdate) return
    setSaving(entry.id)
    const realId = entry.id.split('-').slice(1).join('-')
    await supabase.from(entry.table).update({ [entry.fieldToUpdate]: entry.altText }).eq('id', realId)
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, originalAlt: entry.altText } : e))
    setSaving(null)
  }

  const missingCount = entries.filter(e => !e.altText.trim()).length
  const totalCount = entries.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">ביקורת ALT לתמונות</h2>
          <p className="text-xs text-gray-500 mt-1">כל תמונה באתר חייבת טקסט חלופי (alt) לנגישות — תקן 5568 / WCAG 2.0 AA</p>
        </div>
        <button
          onClick={loadImages}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} />
          רענן
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <Image size={12} />
            תמונות באתר
          </div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${missingCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
          <div className={`text-2xl font-bold ${missingCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{missingCount}</div>
          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${missingCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {missingCount > 0 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
            חסרות ALT
          </div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${missingCount === 0 && totalCount > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
          <div className={`text-2xl font-bold ${missingCount === 0 && totalCount > 0 ? 'text-green-400' : 'text-white'}`}>
            {totalCount > 0 ? Math.round(((totalCount - missingCount) / totalCount) * 100) : 100}%
          </div>
          <div className="text-xs text-gray-500 mt-1">כיסוי</div>
        </div>
      </div>

      {totalCount === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <Image size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">אין תמונות במערכת כרגע</p>
        </div>
      )}

      {/* Image list */}
      {entries.map(entry => {
        const isMissing = !entry.altText.trim()
        const isChanged = entry.altText !== entry.originalAlt
        const isRichText = entry.source === 'rich_text'

        return (
          <div
            key={entry.id}
            className={`flex items-start gap-4 rounded-xl border p-4 ${
              isMissing ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'
            }`}
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              <img
                src={entry.imageUrl}
                alt={entry.altText || 'ללא תיאור'}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded">{entry.sourceLabel}</span>
                <span className="text-xs text-gray-500 truncate">{entry.context}</span>
                {isMissing && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">חסר ALT</span>
                )}
              </div>

              {isRichText ? (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    {entry.altText ? `alt="${entry.altText}"` : 'ללא alt — יש לערוך את בלוק התוכן העשיר ישירות'}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">עריכת alt בתוכן עשיר נעשית דרך עורך ה-Rich Text</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={entry.altText}
                    onChange={e => updateAlt(entry.id, e.target.value)}
                    placeholder="הקלידו טקסט חלופי..."
                    className={`flex-1 bg-[#12121a] border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors ${
                      isMissing ? 'border-red-500/30 focus:border-red-500/50' : 'border-white/10 focus:border-blue-500/50'
                    }`}
                  />
                  {isChanged && (
                    <button
                      onClick={() => saveEntry(entry)}
                      disabled={saving === entry.id}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Save size={12} />
                      {saving === entry.id ? 'שומר...' : 'שמור'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
