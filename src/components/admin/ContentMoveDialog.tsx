import { useEffect, useState } from 'react'
import { getAdminCourses, getAdminCourseSessions, upsertSessionContent, deleteSessionContent } from '@/lib/supabase/queries/admin'
import type { Course, CourseSession, SessionContent } from '@/types'
import { X, ArrowRightLeft, Copy, ChevronDown, Loader2 } from 'lucide-react'

type Props = {
  block: SessionContent
  currentSessionId: string
  onClose: () => void
  onMoved: () => void
}

export function ContentMoveDialog({ block, currentSessionId, onClose, onMoved }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [sessionsMap, setSessionsMap] = useState<Record<string, CourseSession[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [mode, setMode] = useState<'move' | 'copy'>('copy')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const allCourses = await getAdminCourses()
      setCourses(allCourses)

      const map: Record<string, CourseSession[]> = {}
      await Promise.all(
        allCourses.map(async c => {
          const sessions = await getAdminCourseSessions(c.id)
          map[c.id] = sessions
        })
      )
      setSessionsMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const targetSessions = selectedCourse ? (sessionsMap[selectedCourse] ?? []) : []

  async function handleConfirm() {
    if (!selectedSession) return
    setSaving(true)
    try {
      if (mode === 'copy') {
        // Create a copy with new ID in target session
        await upsertSessionContent({
          id: crypto.randomUUID(),
          session_id: selectedSession,
          content_type: block.content_type,
          title: block.title,
          content: block.content,
          language: block.language,
          display_order: 999, // will be at end
          is_locked: block.is_locked,
          file_url: block.file_url,
        })
      } else {
        // Move: update session_id
        await upsertSessionContent({
          ...block,
          session_id: selectedSession,
          display_order: 999,
        })
      }
      onMoved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-bold text-sm">העברה / העתקה של בלוק</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Block info */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">בלוק:</p>
            <p className="text-sm text-white font-medium">{block.title || '(ללא כותרת)'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{block.content_type}</p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setMode('copy')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                mode === 'copy' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Copy size={12} />
              העתק
            </button>
            <button
              onClick={() => setMode('move')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                mode === 'move' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ArrowRightLeft size={12} />
              העבר
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Course picker */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">בחר קורס</label>
                <div className="relative">
                  <select
                    value={selectedCourse ?? ''}
                    onChange={e => { setSelectedCourse(e.target.value || null); setSelectedSession(null) }}
                    className="w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 appearance-none"
                  >
                    <option value="">— בחר קורס —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Session picker */}
              {selectedCourse && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">בחר מפגש</label>
                  <div className="relative">
                    <select
                      value={selectedSession ?? ''}
                      onChange={e => setSelectedSession(e.target.value || null)}
                      className="w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 appearance-none"
                    >
                      <option value="">— בחר מפגש —</option>
                      {targetSessions.map(s => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={mode === 'move' && s.id === currentSessionId}
                        >
                          מפגש {s.session_number}: {s.title || '(ללא כותרת)'}
                          {s.id === currentSessionId ? ' (נוכחי)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {mode === 'move' && selectedSession && selectedSession !== currentSessionId && (
                <p className="text-xs text-orange-400/80 bg-orange-500/10 rounded-lg p-2">
                  הבלוק יוסר מהמפגש הנוכחי ויועבר למפגש שנבחר.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-white/10">
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSession || saving || (mode === 'move' && selectedSession === currentSessionId)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 ${
              mode === 'move'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : mode === 'copy' ? <Copy size={12} /> : <ArrowRightLeft size={12} />}
            {saving ? 'מבצע...' : mode === 'copy' ? 'העתק' : 'העבר'}
          </button>
        </div>
      </div>
    </div>
  )
}
