import { useEffect, useState } from 'react'
import {
  getAdminContentTemplates,
  upsertContentTemplate,
  deleteContentTemplate,
  getAdminCourses,
  getAdminCourseSessions,
  upsertSessionContent,
} from '@/lib/supabase/queries/admin'
import type { ContentTemplate, ContentType, Course, CourseSession, SessionContent } from '@/types'
import {
  Plus, Trash2, Save, Eye, EyeOff, Pencil, X,
  FileText, Code, Video, File, Zap, MessageSquare, ClipboardList,
  PackagePlus, Loader2,
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { useAdminDirty } from '@/hooks/useAdminDirty'

const contentTypeLabels: Record<ContentType, string> = {
  text: 'טקסט פשוט',
  rich_text: 'טקסט עשיר',
  code: 'קוד',
  video: 'וידאו',
  file: 'קובץ',
  prompt: 'פרומפט',
  feedback: 'פידבק',
  prep: 'הכנה למפגש',
}

const contentTypeIcons: Record<ContentType, React.ElementType> = {
  text: FileText,
  rich_text: FileText,
  code: Code,
  video: Video,
  file: File,
  prompt: Zap,
  feedback: MessageSquare,
  prep: ClipboardList,
}

type EditingTemplate = Omit<ContentTemplate, 'created_at'>

function newTemplate(order: number): EditingTemplate {
  return {
    id: crypto.randomUUID(),
    content_type: 'rich_text',
    title: '',
    content: '',
    language: null,
    is_locked: false,
    file_url: null,
    display_order: order,
    is_active: true,
  }
}

// ── Push to sessions dialog ───────────────────────────────────────────────────

function PushDialog({ template, onClose }: { template: ContentTemplate; onClose: () => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [sessionsMap, setSessionsMap] = useState<Record<string, CourseSession[]>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pushing, setPushing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      const allCourses = await getAdminCourses()
      setCourses(allCourses)
      const map: Record<string, CourseSession[]> = {}
      await Promise.all(
        allCourses.map(async c => {
          map[c.id] = await getAdminCourseSessions(c.id)
        })
      )
      setSessionsMap(map)
      setLoading(false)
    }
    load()
  }, [])

  function toggleSession(sessionId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  function selectAllInCourse(courseId: string) {
    const sessions = sessionsMap[courseId] ?? []
    setSelected(prev => {
      const next = new Set(prev)
      const allSelected = sessions.every(s => next.has(s.id))
      for (const s of sessions) {
        if (allSelected) next.delete(s.id)
        else next.add(s.id)
      }
      return next
    })
  }

  async function handlePush() {
    if (selected.size === 0) return
    setPushing(true)
    const promises = Array.from(selected).map(sessionId => {
      const block: Omit<SessionContent, 'created_at'> = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        content_type: template.content_type,
        title: template.title,
        content: template.content,
        language: template.language,
        display_order: 999,
        is_locked: template.is_locked,
        file_url: template.file_url,
      }
      return upsertSessionContent(block)
    })
    await Promise.all(promises)
    setPushing(false)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h3 className="text-white font-bold text-sm">הוסף תבנית למפגשים</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={16} /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500">תבנית:</p>
            <p className="text-sm text-white font-medium">{template.title}</p>
          </div>

          {done ? (
            <div className="text-center py-8">
              <p className="text-green-400 font-semibold mb-1">נוסף בהצלחה!</p>
              <p className="text-xs text-gray-500">התבנית נוספה ל-{selected.size} מפגשים</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => {
                const sessions = sessionsMap[course.id] ?? []
                if (sessions.length === 0) return null
                const allSelected = sessions.every(s => selected.has(s.id))
                return (
                  <div key={course.id} className="bg-white/5 rounded-lg p-3">
                    <button onClick={() => selectAllInCourse(course.id)}
                      className="flex items-center gap-2 w-full text-right mb-2">
                      <input type="checkbox" checked={allSelected} readOnly className="accent-blue-500" />
                      <span className="text-sm text-white font-medium">{course.title}</span>
                      <span className="text-[10px] text-gray-500 mr-auto">{sessions.length} מפגשים</span>
                    </button>
                    <div className="space-y-1 mr-5">
                      {sessions.map(s => (
                        <label key={s.id} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                          <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSession(s.id)} className="accent-blue-500" />
                          מפגש {s.session_number}: {s.title || '(ללא כותרת)'}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-white/10 shrink-0">
          <span className="text-xs text-gray-500">{selected.size} מפגשים נבחרו</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg bg-white/5">
              {done ? 'סגור' : 'ביטול'}
            </button>
            {!done && (
              <button onClick={handlePush} disabled={selected.size === 0 || pushing}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors">
                {pushing ? <Loader2 size={12} className="animate-spin" /> : <PackagePlus size={12} />}
                {pushing ? 'מוסיף...' : 'הוסף'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContentTemplatesManager() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditingTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [pushTemplate, setPushTemplate] = useState<ContentTemplate | null>(null)

  useAdminDirty('content-templates', editing !== null)

  function load() {
    setLoading(true)
    getAdminContentTemplates()
      .then(data => { setTemplates(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!editing || !editing.title.trim()) return
    setSaving(true)
    try {
      await upsertContentTemplate(editing)
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteContentTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  async function handleToggleActive(tpl: ContentTemplate) {
    const updated = { ...tpl, is_active: !tpl.is_active }
    await upsertContentTemplate(updated)
    setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, is_active: !t.is_active } : t))
  }

  const inputCls = 'w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">ספריית תבניות תוכן</h2>
          <p className="text-xs text-gray-500 mt-1">
            תבניות משותפות שניתן להוסיף לכל מפגש בלחיצה. צרו בלוקים חוזרים פעם אחת והשתמשו בהם בכל הקורסים.
          </p>
        </div>
        <button
          onClick={() => setEditing(newTemplate(templates.length))}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          תבנית חדשה
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white/5 border border-white/20 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            {templates.some(t => t.id === editing.id) ? 'עריכת תבנית' : 'תבנית חדשה'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={editing.content_type}
              onChange={e => {
                const ct = e.target.value as ContentType
                setEditing({
                  ...editing,
                  content_type: ct,
                  language: ct === 'code' ? (editing.language ?? 'typescript') : null,
                  content: ct === 'rich_text' ? '<p></p>' : editing.content_type === 'rich_text' ? '' : editing.content,
                })
              }}
              className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="rich_text">טקסט עשיר (WYSIWYG)</option>
              <option value="text">טקסט פשוט</option>
              <option value="code">קוד</option>
              <option value="video">וידאו</option>
              <option value="file">קובץ להורדה</option>
              <option value="prompt">פרומפט</option>
              <option value="feedback">פידבק</option>
            </select>

            {editing.content_type === 'code' && (
              <input type="text" value={editing.language ?? ''}
                onChange={e => setEditing({ ...editing, language: e.target.value || null })}
                placeholder="שפה (typescript, python...)"
                className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 flex-1"
                dir="ltr" />
            )}

            <label className="flex items-center gap-1.5 text-xs text-gray-400 mr-auto">
              <input type="checkbox" checked={editing.is_locked}
                onChange={e => setEditing({ ...editing, is_locked: e.target.checked })}
                className="accent-yellow-400" />
              נעול לתלמידים
            </label>
          </div>

          <input type="text" value={editing.title}
            onChange={e => setEditing({ ...editing, title: e.target.value })}
            placeholder="שם התבנית"
            className={inputCls} dir="rtl" />

          {editing.content_type === 'rich_text' ? (
            <RichTextEditor
              content={editing.content || '<p></p>'}
              onChange={html => setEditing({ ...editing, content: html })}
            />
          ) : editing.content_type === 'file' ? (
            <div className="space-y-2">
              <textarea value={editing.content}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                placeholder="תיאור הקובץ..." rows={2}
                className={`${inputCls} resize-none`} dir="rtl" />
              <input type="url" value={editing.file_url ?? ''}
                onChange={e => setEditing({ ...editing, file_url: e.target.value || null })}
                placeholder="URL לקובץ"
                className={`${inputCls} font-mono`} dir="ltr" />
            </div>
          ) : (
            <textarea value={editing.content}
              onChange={e => setEditing({ ...editing, content: e.target.value })}
              placeholder="תוכן התבנית..."
              rows={4}
              className={`${inputCls} resize-none ${editing.content_type === 'code' ? 'font-mono' : ''}`}
              dir={editing.content_type === 'code' ? 'ltr' : 'rtl'} />
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !editing.title.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Save size={14} />
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={() => setEditing(null)}
              className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Templates list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 && !editing ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <PackagePlus size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">אין תבניות עדיין</p>
          <p className="text-gray-600 text-sm">צרו תבנית כדי להשתמש בה בכל המפגשים</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(tpl => {
            const Icon = contentTypeIcons[tpl.content_type]
            return (
              <div key={tpl.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  tpl.is_active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}
              >
                <Icon size={16} className="text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{tpl.title}</p>
                  <p className="text-[10px] text-gray-500">{contentTypeLabels[tpl.content_type]}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setPushTemplate(tpl)}
                    className="flex items-center gap-1 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-2.5 py-1.5 rounded-lg transition-colors"
                    title="הוסף למפגשים">
                    <PackagePlus size={12} />
                    הוסף למפגשים
                  </button>
                  <button onClick={() => handleToggleActive(tpl)}
                    className="text-gray-600 hover:text-gray-400 p-1.5 transition-colors"
                    title={tpl.is_active ? 'השבת' : 'הפעל'}>
                    {tpl.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => setEditing({ ...tpl })}
                    className="text-gray-600 hover:text-blue-400 p-1.5 transition-colors" title="ערוך">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(tpl.id)}
                    className="text-gray-600 hover:text-red-400 p-1.5 transition-colors" title="מחק">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pushTemplate && (
        <PushDialog template={pushTemplate} onClose={() => setPushTemplate(null)} />
      )}
    </div>
  )
}
