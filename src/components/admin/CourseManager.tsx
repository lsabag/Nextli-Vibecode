import { useEffect, useState } from 'react'
import {
  getAdminCourseSessions,
  updateCourseSessionStatus,
  updateCourseSessionSchedule,
  updateCourseSessionInfo,
  getAdminSessionContent,
  upsertSessionContent,
  deleteSessionContent,
} from '@/lib/supabase/queries/admin'
import type { CourseSession, SessionContent, ContentType } from '@/types'
import {
  Lock, Unlock, ChevronDown, ChevronUp, Plus, Trash2, Save,
  FileText, Code, Video, Copy, File, Eye, EyeOff, Calendar,
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { ContentPreviewModal } from './ContentPreviewModal'
import DateTimePicker from '@/components/ui/DateTimePicker'

const sessionIcons: Record<number, string> = { 1: '🎯', 2: '⚙️', 3: '🚀' }

const contentTypeLabels: Record<ContentType, string> = {
  text:       'טקסט פשוט',
  rich_text:  'טקסט עשיר',
  code:       'קוד',
  video:      'וידאו',
  file:       'קובץ',
  prompt:     'פרומפט',
  feedback:   'משוב',
  prep:       'הכנה',
}

const contentTypeIcons: Record<ContentType, React.ElementType> = {
  text:      FileText,
  rich_text: FileText,
  code:      Code,
  video:     Video,
  file:      File,
  prompt:    Copy,
  feedback:  Eye,
  prep:      Calendar,
}

// Convert YouTube/Vimeo watch URLs to embed URLs
function toEmbedUrl(url: string): string {
  // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo: https://vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  // Already embed URL or other — return as-is
  return url
}

type EditingContent = Omit<SessionContent, 'created_at'>

function newContent(sessionId: string, order: number): EditingContent {
  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    content_type: 'rich_text',
    title: '',
    content: '',
    language: null,
    display_order: order,
    is_locked: false,
    file_url: null,
  }
}

function SessionEditor({ session, onSessionUpdate }: {
  session: CourseSession
  onSessionUpdate: (updated: CourseSession) => void
}) {
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description)
  const [savingInfo, setSavingInfo] = useState(false)
  const [contentItems, setContentItems] = useState<SessionContent[]>([])
  const [loadingContent, setLoadingContent] = useState(true)
  const [editingItem, setEditingItem] = useState<EditingContent | null>(null)
  const [savingContent, setSavingContent] = useState(false)

  useEffect(() => {
    getAdminSessionContent(session.id)
      .then(data => { setContentItems(data); setLoadingContent(false) })
      .catch(() => setLoadingContent(false))
  }, [session.id])

  async function handleSaveInfo() {
    setSavingInfo(true)
    try {
      await updateCourseSessionInfo(session.id, title, description)
      onSessionUpdate({ ...session, title, description })
    } finally {
      setSavingInfo(false)
    }
  }

  function handleAddContent() {
    const order = contentItems.length > 0
      ? Math.max(...contentItems.map(c => c.display_order)) + 1
      : 0
    setEditingItem(newContent(session.id, order))
  }

  function handleDuplicate(item: SessionContent) {
    const order = Math.max(...contentItems.map(c => c.display_order)) + 1
    setEditingItem({
      ...item,
      id: crypto.randomUUID(),
      display_order: order,
    })
  }

  async function handleSaveContent() {
    if (!editingItem) return
    setSavingContent(true)
    try {
      await upsertSessionContent(editingItem)
      setContentItems(prev => {
        const existing = prev.findIndex(c => c.id === editingItem.id)
        const updated = { ...editingItem, created_at: new Date().toISOString() } as SessionContent
        if (existing >= 0) {
          const next = [...prev]; next[existing] = updated; return next
        }
        return [...prev, updated].sort((a, b) => a.display_order - b.display_order)
      })
      setEditingItem(null)
    } finally {
      setSavingContent(false)
    }
  }

  async function handleToggleLock(item: SessionContent) {
    const updated = { ...item, is_locked: !item.is_locked }
    await upsertSessionContent(updated)
    setContentItems(prev => prev.map(c => c.id === item.id ? updated : c))
  }

  async function handleDeleteContent(id: string) {
    await deleteSessionContent(id)
    setContentItems(prev => prev.filter(c => c.id !== id))
  }

  const infoChanged = title !== session.title || description !== session.description

  const inputCls = 'w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-5">

      {/* Session info */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">פרטי המפגש</p>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          className={inputCls} dir="rtl" placeholder="כותרת המפגש" />
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={2} className={`${inputCls} resize-none`} dir="rtl" placeholder="תיאור המפגש" />
        {infoChanged && (
          <button onClick={handleSaveInfo} disabled={savingInfo}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Save size={12} />
            {savingInfo ? 'שומר...' : 'שמור פרטים'}
          </button>
        )}
      </div>

      {/* Content items list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">תוכן המפגש</p>
          <button onClick={handleAddContent}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors">
            <Plus size={12} />
            הוסף בלוק
          </button>
        </div>

        {loadingContent ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {contentItems.map(item => {
              const Icon = contentTypeIcons[item.content_type]
              return (
                <div key={item.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    item.is_locked
                      ? 'bg-white/3 border-white/5 opacity-60'
                      : 'bg-white/5 border-white/10'
                  }`}>
                  <Icon size={13} className="text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 bg-white/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    {contentTypeLabels[item.content_type]}
                  </span>
                  <span className="text-sm text-gray-300 flex-1 truncate">{item.title || '(ללא כותרת)'}</span>
                  {item.is_locked && <Lock size={11} className="text-gray-600 flex-shrink-0" />}
                  <button onClick={() => handleToggleLock(item)}
                    className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${
                      item.is_locked
                        ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10'
                        : 'text-gray-500 hover:text-gray-300 bg-white/5'
                    }`}
                    aria-label={item.is_locked ? 'פתח בלוק' : 'נעל בלוק'}>
                    {item.is_locked ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button onClick={() => handleDuplicate(item)}
                    className="text-gray-500 hover:text-blue-400 transition-colors px-1" aria-label="שכפל בלוק">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => setEditingItem({ ...item })}
                    className="text-xs text-gray-500 hover:text-blue-400 transition-colors px-2 py-1">
                    ערוך
                  </button>
                  <button onClick={() => handleDeleteContent(item.id)}
                    aria-label="מחק בלוק"
                    className="text-gray-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
            {contentItems.length === 0 && !editingItem && (
              <p className="text-gray-600 text-xs text-center py-3">אין תוכן — לחץ "הוסף בלוק"</p>
            )}
          </div>
        )}

        {/* Inline block editor */}
        {editingItem && (
          <div className="mt-3 bg-white/5 border border-white/20 rounded-xl p-4 space-y-3">
            {/* Type + options row */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={editingItem.content_type}
                onChange={e => {
                  const ct = e.target.value as ContentType
                  setEditingItem(prev => prev ? ({
                    ...prev,
                    content_type: ct,
                    language: ct === 'code' ? (prev.language ?? 'typescript') : null,
                    content: ct === 'rich_text' ? '<p></p>' : '',
                  }) : prev)
                }}
                className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="rich_text">טקסט עשיר (WYSIWYG)</option>
                <option value="text">טקסט פשוט</option>
                <option value="code">קוד</option>
                <option value="video">וידאו (YouTube/Vimeo)</option>
                <option value="file">קובץ להורדה</option>
              </select>

              {editingItem.content_type === 'code' && (
                <input type="text" value={editingItem.language ?? ''}
                  onChange={e => setEditingItem(prev => prev ? ({ ...prev, language: e.target.value || null }) : prev)}
                  placeholder="שפה (typescript, python...)"
                  className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 flex-1"
                  dir="ltr" />
              )}

              <label className="flex items-center gap-1.5 text-xs text-gray-400 mr-auto">
                <input type="checkbox" checked={editingItem.is_locked}
                  onChange={e => setEditingItem(prev => prev ? ({ ...prev, is_locked: e.target.checked }) : prev)}
                  className="accent-yellow-400" />
                נעול לתלמידים
              </label>
            </div>

            {/* Title */}
            <input type="text" value={editingItem.title}
              onChange={e => setEditingItem(prev => prev ? ({ ...prev, title: e.target.value }) : prev)}
              placeholder="כותרת הבלוק"
              className="w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
              dir="rtl" />

            {/* Content input — varies by type */}
            {editingItem.content_type === 'rich_text' ? (
              <RichTextEditor
                content={editingItem.content}
                onChange={html => setEditingItem(prev => prev ? ({ ...prev, content: html }) : prev)}
              />
            ) : editingItem.content_type === 'video' ? (
              <div className="space-y-2">
                <input type="url" value={editingItem.content}
                  onChange={e => setEditingItem(prev => prev ? ({ ...prev, content: e.target.value }) : prev)}
                  placeholder="https://www.youtube.com/watch?v=... או https://vimeo.com/..."
                  className="w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 transition-colors font-mono"
                  dir="ltr" />
                {editingItem.content && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
                    <iframe
                      src={toEmbedUrl(editingItem.content)}
                      className="w-full h-full"
                      allowFullScreen
                      title="preview"
                    />
                  </div>
                )}
              </div>
            ) : editingItem.content_type === 'file' ? (
              <div className="space-y-2">
                <textarea
                  value={editingItem.content}
                  onChange={e => setEditingItem(prev => prev ? ({ ...prev, content: e.target.value }) : prev)}
                  placeholder="תיאור הקובץ (מה התלמיד יוריד)..."
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 resize-none"
                  dir="rtl" />
                <input type="url"
                  value={editingItem.file_url ?? ''}
                  onChange={e => setEditingItem(prev => prev ? ({ ...prev, file_url: e.target.value || null }) : prev)}
                  placeholder="URL לקובץ (Google Drive, Dropbox...)"
                  className="w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 font-mono"
                  dir="ltr" />
              </div>
            ) : (
              /* text / code */
              <textarea
                value={editingItem.content}
                onChange={e => setEditingItem(prev => prev ? ({ ...prev, content: e.target.value }) : prev)}
                placeholder={editingItem.content_type === 'code' ? 'קוד...' : 'טקסט...'}
                rows={5}
                className={`w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none ${
                  editingItem.content_type === 'code' ? 'font-mono' : ''
                }`}
                dir="rtl" />
            )}

            {/* Display order */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">סדר הצגה:</span>
              <input type="number" value={editingItem.display_order}
                onChange={e => setEditingItem(prev => prev ? ({ ...prev, display_order: Number(e.target.value) }) : prev)}
                className="bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500 w-20" />
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2">
              <button onClick={handleSaveContent}
                disabled={savingContent || !editingItem.title.trim()}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                <Save size={12} />
                {savingContent ? 'שומר...' : 'שמור בלוק'}
              </button>
              <button onClick={() => setEditingItem(null)}
                className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CourseManager() {
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null) // session id being scheduled
  const [scheduleInputVal, setScheduleInputVal] = useState('')
  const [previewSession, setPreviewSession] = useState<CourseSession | null>(null)

  function loadSessions() {
    setLoading(true)
    setFetchError(null)
    getAdminCourseSessions()
      .then(data => { setSessions(data); setLoading(false) })
      .catch(err => { setFetchError(err?.message ?? 'שגיאה בטעינה'); setLoading(false) })
  }

  useEffect(() => { loadSessions() }, [])

  async function toggleStatus(session: CourseSession) {
    const next = session.status === 'open' ? 'locked' : 'open'
    setUpdating(session.id)
    await updateCourseSessionStatus(session.id, next)
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: next } : s))
    setUpdating(null)
  }

  async function handleSaveSchedule(session: CourseSession, isoVal: string) {
    const scheduled_at = isoVal || null
    await updateCourseSessionSchedule(session.id, scheduled_at)
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, scheduled_at } : s))
    setEditingSchedule(null)
  }

  async function handleClearSchedule(session: CourseSession) {
    await updateCourseSessionSchedule(session.id, null)
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, scheduled_at: null } : s))
    setEditingSchedule(null)
  }

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-2">ניהול מפגשים</h2>
      <p className="text-sm text-gray-500 mb-6">
        פתיחת מפגש שולחת עדכון Realtime לכל התלמידים. ניתן לנעול בלוקי תוכן בודדים בתוך מפגש פתוח.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-1">שגיאה בטעינת המפגשים</p>
          <p className="text-gray-500 text-sm mb-4 font-mono">{fetchError}</p>
          <button onClick={loadSessions}
            className="bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
            נסה שוב
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">אין מפגשים — הרץ את ה-migrations כדי לאכלס נתונים</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id
            return (
              <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{sessionIcons[session.session_number] ?? '📚'}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-semibold">מפגש {session.session_number}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        session.status === 'open'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10 text-gray-500'
                      }`}>
                        {session.status === 'open' ? '● פתוח' : '🔒 נעול'}
                      </span>
                    </div>
                    <h3 className="text-white font-bold">{session.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-1">{session.description}</p>
                    {session.scheduled_at && (
                      <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                        <Calendar size={11} />
                        יפתח אוטומטית: {new Date(session.scheduled_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPreviewSession(session)}
                      className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300"
                      title="תצוגה מקדימה">
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSchedule(editingSchedule === session.id ? null : session.id)
                        setScheduleInputVal(session.scheduled_at ?? '')
                      }}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                        editingSchedule === session.id
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300'
                      }`}
                      title="תזמן פתיחה אוטומטית">
                      <Calendar size={13} />
                    </button>
                    <button
                      onClick={() => toggleStatus(session)}
                      disabled={updating === session.id}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                        session.status === 'open'
                          ? 'bg-white/10 hover:bg-white/15 text-gray-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-50`}>
                      {updating === session.id ? '...'
                        : session.status === 'open'
                          ? <><Lock size={13} /> נעל מפגש</>
                          : <><Unlock size={13} /> פתח מפגש</>
                      }
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      className="p-2 text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                      title={isExpanded ? 'סגור עריכה' : 'ערוך תוכן'}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Inline schedule picker */}
                {editingSchedule === session.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <p className="text-xs text-gray-400">תאריך ושעת פתיחה אוטומטית:</p>
                    <DateTimePicker
                      value={scheduleInputVal}
                      onChange={iso => {
                        setScheduleInputVal(iso)
                        if (iso) {
                          handleSaveSchedule(session, iso)
                        } else {
                          handleClearSchedule(session)
                        }
                      }}
                    />
                    <button
                      onClick={() => setEditingSchedule(null)}
                      className="text-xs text-gray-600 hover:text-gray-400 px-2">
                      סגור
                    </button>
                  </div>
                )}

                {isExpanded && (
                  <SessionEditor
                    session={session}
                    onSessionUpdate={updated => setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {previewSession && (
        <ContentPreviewModal session={previewSession} onClose={() => setPreviewSession(null)} />
      )}
    </div>
  )
}
