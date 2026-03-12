import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Mail, Phone, Clock, Trash2, Filter } from 'lucide-react'
import type { WaitlistEntry } from '@/types'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'מתחיל',
  intermediate: 'בינוני',
  advanced: 'מנוסה',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-blue-500/20 text-blue-400',
  advanced: 'bg-purple-500/20 text-purple-400',
}

const STATUS_LABELS: Record<string, string> = {
  waiting: 'ממתין',
  signup: 'הרשמה',
  contacted: 'נוצר קשר',
  enrolled: 'רשום לקורס',
}

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-amber-500/20 text-amber-400',
  signup: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-cyan-500/20 text-cyan-400',
  enrolled: 'bg-green-500/20 text-green-400',
}

export function WaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    const { data } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('waitlist').update({ status }).eq('id', id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
  }

  async function deleteEntry(id: string) {
    await supabase.from('waitlist').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const filtered = entries.filter(e => {
    if (filterLevel !== 'all' && e.recommended_level !== filterLevel) return false
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    return true
  })

  // Stats
  const stats = {
    total: entries.length,
    beginner: entries.filter(e => e.recommended_level === 'beginner').length,
    intermediate: entries.filter(e => e.recommended_level === 'intermediate').length,
    advanced: entries.filter(e => e.recommended_level === 'advanced').length,
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">רשימת המתנה והרשמות</h2>
          <p className="text-gray-500 text-sm mt-0.5">נרשמו דרך שאלון ההתאמה</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">סה"כ</div>
        </div>
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.beginner}</div>
          <div className="text-xs text-gray-500 mt-1">מתחילים</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.intermediate}</div>
          <div className="text-xs text-gray-500 mt-1">בינוניים</div>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.advanced}</div>
          <div className="text-xs text-gray-500 mt-1">מנוסים</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-gray-500" />
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
        >
          <option value="all" className="bg-[#1a1a2e] text-white">כל הרמות</option>
          <option value="beginner" className="bg-[#1a1a2e] text-white">מתחילים</option>
          <option value="intermediate" className="bg-[#1a1a2e] text-white">בינוניים</option>
          <option value="advanced" className="bg-[#1a1a2e] text-white">מנוסים</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
        >
          <option value="all" className="bg-[#1a1a2e] text-white">כל הסטטוסים</option>
          <option value="waiting" className="bg-[#1a1a2e] text-white">ממתין</option>
          <option value="signup" className="bg-[#1a1a2e] text-white">הרשמה</option>
          <option value="contacted" className="bg-[#1a1a2e] text-white">נוצר קשר</option>
          <option value="enrolled" className="bg-[#1a1a2e] text-white">רשום לקורס</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Users size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">
            {entries.length === 0
              ? 'עוד אין נרשמים — שתף את הקישור /intake'
              : 'אין תוצאות לפילטר הנוכחי'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            let parsedAnswers: Record<string, string> = {}
            try { parsedAnswers = JSON.parse(entry.answers) } catch {}

            return (
              <div key={entry.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-white font-semibold">{entry.full_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[entry.recommended_level] || 'bg-white/10 text-gray-400'}`}>
                        {LEVEL_LABELS[entry.recommended_level] || entry.recommended_level}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[entry.status] || 'bg-white/10 text-gray-400'}`}>
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail size={13} /> {entry.email}
                      </span>
                      {entry.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} /> {entry.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {new Date(entry.created_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>

                    {/* Answers summary */}
                    {Object.keys(parsedAnswers).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {Object.entries(parsedAnswers).map(([key, val]) => (
                          <span key={key} className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded">
                            {val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <select
                      value={entry.status}
                      onChange={e => updateStatus(entry.id, e.target.value)}
                      aria-label={`סטטוס של ${entry.full_name}`}
                      className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="waiting" className="bg-[#1a1a2e] text-white">ממתין</option>
                      <option value="signup" className="bg-[#1a1a2e] text-white">הרשמה</option>
                      <option value="contacted" className="bg-[#1a1a2e] text-white">נוצר קשר</option>
                      <option value="enrolled" className="bg-[#1a1a2e] text-white">רשום לקורס</option>
                    </select>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                      aria-label={`מחק ${entry.full_name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
