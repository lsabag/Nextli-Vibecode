import { useState, useEffect } from 'react'
import { getAdminStudentNotes } from '@/lib/supabase/queries/admin'
import { getAdminUsers } from '@/lib/supabase/queries/admin'
import { getAdminCourseSessions } from '@/lib/supabase/queries/admin'
import { FileText, User, BookOpen } from 'lucide-react'

type NoteRow = { user_id: string; session_id: string; content: string; updated_at: string }

export function NotesViewer() {
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [users, setUsers] = useState<Map<string, string>>(new Map())
  const [sessions, setSessions] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filterSession, setFilterSession] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')

  useEffect(() => {
    Promise.all([
      getAdminStudentNotes(),
      getAdminUsers(),
      getAdminCourseSessions(),
    ]).then(([notesData, usersData, sessionsData]) => {
      setNotes(notesData.filter(n => n.content.trim().length > 0))
      setUsers(new Map(usersData.map(u => [u.id, u.full_name || u.email || u.id])))
      setSessions(new Map(sessionsData.map(s => [s.id, `מפגש ${s.session_number}: ${s.title}`])))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = notes.filter(n => {
    if (filterSession !== 'all' && n.session_id !== filterSession) return false
    if (filterUser !== 'all' && n.user_id !== filterUser) return false
    return true
  })

  // Unique sessions/users that have notes
  const noteSessionIds = [...new Set(notes.map(n => n.session_id))]
  const noteUserIds = [...new Set(notes.map(n => n.user_id))]

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-2">הערות תלמידים</h2>
      <p className="text-sm text-gray-500 mb-6">צפייה במה שהתלמידים כתבו בפנקס האישי שלהם</p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <FileText size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">אין הערות עדיין</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-gray-500" />
              <select
                value={filterSession}
                onChange={e => setFilterSession(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
              >
                <option value="all">כל המפגשים</option>
                {noteSessionIds.map(id => (
                  <option key={id} value={id}>{sessions.get(id) ?? id}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-gray-500" />
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
              >
                <option value="all">כל התלמידים</option>
                {noteUserIds.map(id => (
                  <option key={id} value={id}>{users.get(id) ?? id}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-600">{filtered.length} הערות</span>
          </div>

          {/* Notes list */}
          <div className="space-y-3">
            {filtered.map((note, i) => (
              <div key={`${note.user_id}-${note.session_id}-${i}`} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-400 font-medium">{users.get(note.user_id) ?? note.user_id}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">{sessions.get(note.session_id) ?? note.session_id}</span>
                  </div>
                  <span className="text-[10px] text-gray-600">
                    {new Date(note.updated_at).toLocaleDateString('he-IL')}
                  </span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
