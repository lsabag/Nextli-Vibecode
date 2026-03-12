import { useState, useEffect } from 'react'
import { CheckCircle, Circle, ExternalLink, ClipboardList } from 'lucide-react'
import { getPrepChecklist, getItemLinks } from '@/lib/supabase/queries/prep'
import type { PrepChecklistItem } from '@/types'

const STORAGE_KEY = 'nextli-prep-progress'

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveProgress(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

type Props = { courseId: string; sessionId: string }

export function PrepBlock({ courseId, sessionId }: Props) {
  const [items, setItems] = useState<PrepChecklistItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(loadProgress)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPrepChecklist(courseId, sessionId)
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId, sessionId])

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      saveProgress(next)
      return next
    })
  }

  if (loading) return <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
  if (items.length === 0) return null

  const totalChecked = items.filter(i => checked.has(i.id)).length

  return (
    <div className="bg-gradient-to-br from-blue-500/5 to-green-500/5 border border-blue-500/20 rounded-xl p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center">
          <ClipboardList size={18} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">הכנה למפגש</h3>
          <p className="text-gray-500 text-xs">סמנו V על כל שלב שסיימתם</p>
        </div>
        <span className="text-xs text-gray-500">{totalChecked}/{items.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-l from-blue-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${items.length > 0 ? (totalChecked / items.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map(item => {
          const done = checked.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full text-right flex items-start gap-3 p-3 rounded-xl border transition-all ${
                done
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-white/3 border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {done ? (
                  <CheckCircle size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} className="text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm ${done ? 'text-green-300' : 'text-white'}`}>
                    {item.title}
                  </span>
                  {item.is_required && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      חובה
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                )}
                {getItemLinks(item).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 mr-2 transition-colors"
                  >
                    <ExternalLink size={11} />
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
