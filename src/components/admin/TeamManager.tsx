import { useEffect, useState, useRef, useCallback } from 'react'
import {
  getAdminTeamMembers,
  upsertTeamMember,
  deleteTeamMember,
} from '@/lib/supabase/queries/admin'
import type { TeamMember } from '@/types'
import { Plus, Trash2, Check, Upload, X, Link2 } from 'lucide-react'

function blankMember(order: number): Omit<TeamMember, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    name: '',
    role: '',
    initials: '',
    image_url: null,
    display_order: order,
    is_active: true,
  }
}

export function TeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function load() {
    setLoading(true)
    setFetchError(null)
    getAdminTeamMembers()
      .then(data => { setMembers(data); setLoading(false) })
      .catch(err => { setFetchError(err?.message ?? 'שגיאה בטעינה'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const autoSave = useCallback((member: TeamMember) => {
    if (debounceTimers.current[member.id]) {
      clearTimeout(debounceTimers.current[member.id])
    }
    debounceTimers.current[member.id] = setTimeout(async () => {
      await upsertTeamMember(member)
      setSavedId(member.id)
      setTimeout(() => setSavedId(prev => prev === member.id ? null : prev), 1500)
    }, 600)
  }, [])

  // Immediate save (no debounce) for image changes
  const immediateSave = useCallback(async (member: TeamMember) => {
    if (debounceTimers.current[member.id]) clearTimeout(debounceTimers.current[member.id])
    await upsertTeamMember(member)
    setSavedId(member.id)
    setTimeout(() => setSavedId(prev => prev === member.id ? null : prev), 1500)
  }, [])

  async function handleAdd() {
    const order = members.length > 0 ? Math.max(...members.map(m => m.display_order)) + 1 : 1
    const member = blankMember(order)
    await upsertTeamMember(member)
    setMembers(prev => [...prev, { ...member, created_at: new Date().toISOString() }])
  }

  function update(id: string, patch: Partial<TeamMember>) {
    setMembers(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...patch } : m)
      const member = updated.find(m => m.id === id)
      if (member) autoSave(member)
      return updated
    })
  }

  function handleImageUpload(memberId: string, file: File) {
    // Convert to data URL — works in dev mode, but too large for D1 production
    // For production, use an external URL instead (paste into the URL field)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // Warn if data URL is very large (>50KB won't reliably save to D1)
      if (dataUrl.length > 50_000) {
        alert('התמונה גדולה מדי לשמירה ישירה. העלה את התמונה לשירות חיצוני (כמו Imgur או Cloudflare R2) והדבק את הלינק בשדה URL.')
        return
      }
      setMembers(prev => {
        const updated = prev.map(m => m.id === memberId ? { ...m, image_url: dataUrl } : m)
        const member = updated.find(m => m.id === memberId)
        if (member) immediateSave(member)
        return updated
      })
    }
    reader.readAsDataURL(file)
  }

  function handleImageUrl(memberId: string, url: string) {
    setMembers(prev => {
      const updated = prev.map(m => m.id === memberId ? { ...m, image_url: url || null } : m)
      const member = updated.find(m => m.id === memberId)
      if (member) immediateSave(member)
      return updated
    })
  }

  function clearImage(memberId: string) {
    setMembers(prev => {
      const updated = prev.map(m => m.id === memberId ? { ...m, image_url: null } : m)
      const member = updated.find(m => m.id === memberId)
      if (member) immediateSave(member)
      return updated
    })
  }

  async function handleDelete(id: string) {
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])
    await deleteTeamMember(id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const inputCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors w-full'

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-xs">שינויים נשמרים אוטומטית</p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          הוסף
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">טוען...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center space-y-2">
          <p className="text-red-400 text-xs">{fetchError}</p>
          <button onClick={load} className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">נסה שוב</button>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
          <p className="text-gray-500 text-xs">אין חברי צוות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 group relative">
              {/* Saved indicator */}
              {savedId === member.id && (
                <span className="absolute top-2 left-2 text-green-400 text-[10px] flex items-center gap-0.5">
                  <Check size={10} /> נשמר
                </span>
              )}

              {/* Avatar */}
              <div className="relative shrink-0">
                {member.image_url ? (
                  <div className="relative">
                    <img src={member.image_url} alt={member.name || ''} className="w-12 h-12 rounded-xl object-cover" />
                    <button
                      onClick={() => clearImage(member.id)}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      aria-label="הסר תמונה"
                      title="הסר תמונה"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{member.initials || '??'}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={el => { fileInputRefs.current[member.id] = el }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(member.id, file)
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => fileInputRefs.current[member.id]?.click()}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 text-gray-300 text-[8px] px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                  title="העלה תמונה"
                >
                  <Upload size={8} />
                </button>
              </div>

              {/* Fields row */}
              <div className="flex-1 space-y-2 min-w-0">
              <div className="grid grid-cols-4 gap-2">
                <input
                  value={member.name}
                  onChange={e => update(member.id, { name: e.target.value })}
                  placeholder="שם"
                  className={`${inputCls} font-medium`}
                  dir="rtl"
                />
                <input
                  value={member.role}
                  onChange={e => update(member.id, { role: e.target.value })}
                  placeholder="תפקיד"
                  className={inputCls}
                  dir="rtl"
                />
                <input
                  value={member.initials}
                  onChange={e => update(member.id, { initials: e.target.value })}
                  placeholder="ר״ת"
                  className={inputCls}
                  maxLength={3}
                  dir="rtl"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={member.display_order}
                    onChange={e => update(member.id, { display_order: Number(e.target.value) })}
                    className={`${inputCls} w-12 text-center`}
                    title="סדר"
                  />
                  <label className="flex items-center gap-0.5 text-[10px] text-gray-500 shrink-0">
                    <input
                      type="checkbox"
                      checked={member.is_active}
                      onChange={e => update(member.id, { is_active: e.target.checked })}
                      className="accent-blue-500 w-3 h-3"
                    />
                    פעיל
                  </label>
                </div>
              </div>
              {/* Image URL input */}
              <div className="flex items-center gap-2">
                <Link2 size={12} className="text-gray-600 shrink-0" />
                <input
                  type="text"
                  value={member.image_url?.startsWith('data:') ? '' : (member.image_url ?? '')}
                  onChange={e => handleImageUrl(member.id, e.target.value)}
                  placeholder="URL לתמונה (הדבק לינק חיצוני)"
                  className={`${inputCls} text-xs`}
                  dir="ltr"
                />
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0 whitespace-nowrap transition-colors"
                >
                  העלה ל-Imgur
                </a>
              </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(member.id)}
                className="p-1 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                aria-label={`מחק ${member.name || 'חבר צוות'}`}
                title="מחק"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
