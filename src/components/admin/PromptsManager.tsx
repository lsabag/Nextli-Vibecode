import { useEffect, useState } from 'react'
import { getAdminPrompts, upsertPrompt, deletePrompt } from '@/lib/supabase/queries/admin'
import type { PromptLibraryItem } from '@/types'
import { Plus, Trash2, Save, Zap, Pencil } from 'lucide-react'

function newPrompt(sessionId: string, order: number): Omit<PromptLibraryItem, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    title: '',
    content: '',
    category: 'כללי',
    display_order: order,
    is_active: true,
  }
}

export function PromptsManager({ sessionId }: { sessionId: string }) {
  const [prompts, setPrompts] = useState<PromptLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Omit<PromptLibraryItem, 'created_at'> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminPrompts(sessionId)
      .then(data => { setPrompts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  async function handleSave() {
    if (!editing || !editing.title.trim() || !editing.content.trim()) return
    setSaving(true)
    try {
      await upsertPrompt(editing)
      const updated = { ...editing, created_at: new Date().toISOString() } as PromptLibraryItem
      setPrompts(prev => {
        const idx = prev.findIndex(p => p.id === editing.id)
        if (idx >= 0) {
          const next = [...prev]; next[idx] = updated; return next
        }
        return [...prev, updated].sort((a, b) => a.display_order - b.display_order)
      })
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deletePrompt(id)
    setPrompts(prev => prev.filter(p => p.id !== id))
  }

  const inputCls = 'w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">פרומפטים למפגש</p>
        <button
          onClick={() => setEditing(newPrompt(sessionId, prompts.length))}
          className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={12} />
          הוסף פרומפט
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map(prompt => (
            <div key={prompt.id}
              className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10"
            >
              <Zap size={13} className="text-purple-400 flex-shrink-0" />
              <span className="text-xs text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded flex-shrink-0">
                {prompt.category}
              </span>
              <span className="text-sm text-gray-300 flex-1 truncate">{prompt.title}</span>
              {!prompt.is_active && (
                <span className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">מושבת</span>
              )}
              <button
                onClick={() => setEditing({
                  id: prompt.id,
                  session_id: prompt.session_id,
                  title: prompt.title,
                  content: prompt.content,
                  category: prompt.category,
                  display_order: prompt.display_order,
                  is_active: prompt.is_active,
                })}
                className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                aria-label="ערוך פרומפט"
                title="ערוך"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => handleDelete(prompt.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
                aria-label="מחק פרומפט"
                title="מחק"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {prompts.length === 0 && !editing && (
            <p className="text-gray-600 text-xs text-center py-3">אין פרומפטים — לחץ "הוסף פרומפט"</p>
          )}
        </div>
      )}

      {/* Edit/Create form */}
      {editing && (
        <div className="mt-3 bg-white/5 border border-white/20 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={editing.title}
            onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="כותרת הפרומפט"
            className={inputCls}
            dir="rtl"
          />
          <textarea
            value={editing.content}
            onChange={e => setEditing(prev => prev ? { ...prev, content: e.target.value } : prev)}
            placeholder="תוכן הפרומפט — התלמיד ילחץ ויעתיק..."
            rows={4}
            className={`${inputCls} resize-none font-mono`}
            dir="ltr"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">קטגוריה:</span>
              <input
                type="text"
                value={editing.category}
                onChange={e => setEditing(prev => prev ? { ...prev, category: e.target.value } : prev)}
                placeholder="כללי"
                className="bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500 w-32"
                dir="rtl"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">סדר:</span>
              <input
                type="number"
                value={editing.display_order}
                onChange={e => setEditing(prev => prev ? { ...prev, display_order: Number(e.target.value) } : prev)}
                className="bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500 w-16"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={e => setEditing(prev => prev ? { ...prev, is_active: e.target.checked } : prev)}
                className="accent-blue-500"
              />
              פעיל
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title.trim() || !editing.content.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Save size={12} />
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
